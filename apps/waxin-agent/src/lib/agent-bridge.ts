/**
 * Agent Bridge - Connects TUI to Bot Manager Agent.
 *
 * Provides a clean interface for executing agent commands and tracking results.
 */

import { query } from '@anthropic-ai/claude-agent-sdk'
import { agentLogger } from './logger.js'
import { categorizeError } from './error-categorizer.js'
import type { AgentResult, AgentOptions, AgentUsage, ToolCallLog, AgentCallbacks } from '../types.js'

// Re-export types for convenience
export type { AgentResult, AgentOptions, AgentUsage, ToolCallLog, AgentCallbacks }

/**
 * Bridge to the Bot Manager Agent.
 *
 * Handles agent execution, message processing, and result extraction.
 */
export class AgentBridge {
  private currentResult: AgentResult | null = null
  private sessionId = ''
  private toolCalls: ToolCallLog[] = []

  /**
   * Execute a prompt with the agent.
   */
  async execute(prompt: string, options: AgentOptions = {}, callbacks: AgentCallbacks = {}): Promise<AgentResult> {
    agentLogger.info(`🚀 Starting agent execution`)
    agentLogger.info(`📝 Prompt: "${prompt.slice(0, 50)}..."`)

    // Debug environment variables
    agentLogger.debug(`🔑 ANTHROPIC_AUTH_TOKEN: ${process.env.ANTHROPIC_AUTH_TOKEN ? 'SET' : 'NOT SET'}`)
    agentLogger.debug(`🔑 ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? 'SET' : 'NOT SET'}`)
    agentLogger.debug(`🌐 ANTHROPIC_BASE_URL: ${process.env.ANTHROPIC_BASE_URL || 'default'}`)
    agentLogger.debug(`🤖 ANTHROPIC_MODEL: ${process.env.ANTHROPIC_MODEL || 'default'}`)

    const startTime = Date.now()
    const toolCalls: ToolCallLog[] = []
    const errors: string[] = []
    let finalResult: string | null = null
    let usage: AgentUsage = { inputTokens: 0, outputTokens: 0, totalCostUsd: 0 }
    let messageCount = 0

    try {
      // Query options with correct model format
      const queryOptions = {
        model: options.model || 'claude-sonnet-4-5-20250929',
        cwd: options.workingDirectory || process.cwd(),
        maxTurns: options.maxTurns || 50,
        permissionMode: options.permissionMode || 'acceptEdits',
        includePartialMessages: options.includePartial || false,
        mcpServers: {},
        agents: {},
        allowedTools: []
      }

      // Execute query
      for await (const message of query({ prompt, options: queryOptions })) {
        messageCount++
        agentLogger.debug(`📨 Message #${messageCount}: ${(message as { type: string }).type}`)

        callbacks.onMessage?.(message)

        const msg = message as {
          type: string
          subtype?: string
          session_id?: string
          content?: Array<{ type: string; text?: string; name?: string; input?: unknown; id?: string }>
          result?: string
          errors?: string[]
          usage?: { input_tokens?: number; output_tokens?: number }
          total_cost_usd?: number
        }

        switch (msg.type) {
          case 'system':
            if (msg.subtype === 'init' && msg.session_id) {
              this.sessionId = msg.session_id
              agentLogger.info(`Session started: ${msg.session_id}`)
            }
            break

          case 'assistant':
            if (Array.isArray(msg.content)) {
              for (const block of msg.content) {
                if (block.type === 'text' && block.text) {
                  callbacks.onAssistantMessage?.(block.text)
                  agentLogger.debug(`Assistant: ${block.text.slice(0, 100)}...`)
                } else if (block.type === 'tool_use' && block.name) {
                  callbacks.onToolCall?.(block.name, block.input)
                  toolCalls.push({
                    tool: block.name,
                    input: block.input,
                    result: '' // Will be filled when tool completes
                  })
                  agentLogger.info(`Tool call: ${block.name}`)
                }
              }
            }
            break

          case 'result':
            if (msg.session_id) {
              this.sessionId = msg.session_id
            }

            usage = {
              inputTokens: msg.usage?.input_tokens || 0,
              outputTokens: msg.usage?.output_tokens || 0,
              totalCostUsd: msg.total_cost_usd || 0
            }

            if (msg.subtype === 'success') {
              finalResult = msg.result || null
              agentLogger.success('Agent completed successfully')
            } else {
              const resultErrors = msg.errors || []
              errors.push(...resultErrors)
              agentLogger.error(`Agent failed: ${msg.subtype}`)
            }
            break

          default:
            agentLogger.debug(`Message type: ${msg.type}`)
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      errors.push(errorMsg)
      agentLogger.error(`❌ Fatal error: ${errorMsg}`)

      if (errorMsg.includes('AUTHENTICATION_FAILED')) {
        agentLogger.error('Check your ANTHROPIC_API_KEY')
      } else if (errorMsg.includes('RATE_LIMIT_EXCEEDED')) {
        agentLogger.error('Rate limit exceeded, retry after delay')
      } else if (errorMsg.includes('CONTEXT_LENGTH_EXCEEDED')) {
        agentLogger.error('Context too large, consider session compaction')
      }
    }

    const durationMs = Date.now() - startTime

    agentLogger.success(`✅ Agent completed in ${durationMs}ms (${messageCount} messages)`)

    const result: AgentResult = {
      success: errors.length === 0 && finalResult !== null,
      result: finalResult,
      sessionId: this.sessionId,
      toolCalls,
      errors,
      usage,
      durationMs
    }

    this.currentResult = result
    this.toolCalls = toolCalls

    if (errors.length > 0) {
      categorizeError(errors[0])
    }

    return result
  }

  /**
   * Get current result.
   */
  getResult(): AgentResult | null {
    return this.currentResult
  }

  /**
   * Get current stats.
   */
  getStats() {
    return this.currentResult
      ? {
          sessionId: this.currentResult.sessionId,
          inputTokens: this.currentResult.usage.inputTokens,
          outputTokens: this.currentResult.usage.outputTokens,
          totalTokens: this.currentResult.usage.inputTokens + this.currentResult.usage.outputTokens,
          totalCostUsd: this.currentResult.usage.totalCostUsd,
          durationMs: this.currentResult.durationMs,
          toolCallsCount: this.currentResult.toolCalls.length,
          errorsCount: this.currentResult.errors.length
        }
      : null
  }

  /**
   * Get current session ID.
   */
  getSessionId(): string {
    return this.sessionId
  }

  /**
   * Get tool calls from last execution.
   */
  getToolCalls(): ToolCallLog[] {
    return this.toolCalls
  }

  /**
   * Clear current result.
   */
  clear(): void {
    this.currentResult = null
    this.sessionId = ''
    this.toolCalls = []
  }
}

/**
 * Singleton instance for global use.
 */
let globalBridge: AgentBridge | null = null

/**
 * Get or create the global agent bridge instance.
 */
export function getGlobalBridge(): AgentBridge {
  if (!globalBridge) {
    globalBridge = new AgentBridge()
  }
  return globalBridge
}
