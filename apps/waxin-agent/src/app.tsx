/**
 * Bot Manager Agent TUI - Main Application.
 *
 * Multi-panel debugging interface for the Bot Manager Agent.
 */

import { TextAttributes, createCliRenderer, TextareaRenderable, TextRenderable, BoxRenderable, RGBA, type KeyBinding } from '@opentui/core'
import { configureTUILogger } from './lib/index.js'
import { useAgent } from './hooks/useAgent.js'
import { updateStats, getStats, setLogFilter, logInfo, enableAutoProcessing, initLogs, getRecentLogs, getLogFilter } from './hooks/index.js'
import { LogLevel, type AgentCallbacks } from './types.js'

/**
 * Global references to Renderables for dynamic updates.
 */
let outputText: TextRenderable | null = null
let statsText: TextRenderable | null = null
let logsBox: BoxRenderable | null = null
let logTexts: TextRenderable[] = []
let promptInput: TextareaRenderable | null = null
let currentRenderer: Awaited<ReturnType<typeof createCliRenderer>> | null = null

// Frame counter for periodic updates
let frameCounter = 0

/**
 * TUI State.
 */
interface TUIState {
  isExecuting: boolean
  currentResult: any
  currentFilter: LogLevel
  messages: string[]
}

/**
 * Update the logs panel with fresh log entries.
 */
function updateLogsPanel(): void {
  if (!logsBox || !currentRenderer) return

  // Remove old log texts
  for (const logText of logTexts) {
    logsBox.remove(logText.id)
  }
  logTexts = []

  // Get fresh logs
  const filter = getLogFilter()
  const recentLogs = getRecentLogs(20)

  // Add new log texts
  let yOffset = 1
  for (const log of recentLogs) {
    const levelIcon = getLevelIcon(log.level)
    const timestamp = formatTimestamp(log.timestamp)
    const component = log.component.padEnd(8)

    const logText = new TextRenderable(currentRenderer, {
      id: `log-${log.component}-${log.timestamp}`,
      content: `${levelIcon} ${timestamp} [${component}] ${log.message}`,
      position: 'absolute',
      left: 1,
      top: yOffset++,
      width: 100,
      fg: getLevelColor(log.level)
    })
    logsBox.add(logText)
    logTexts.push(logText)
  }

  // Update title with current filter
  const titleText = new TextRenderable(currentRenderer, {
    id: 'logs-title',
    content: `📋 Logs [${LogLevel[filter.level]}] (Press Ctrl+L to change)`,
    position: 'absolute',
    left: 1,
    top: 0,
    attributes: TextAttributes.BOLD,
    fg: RGBA.fromInts(255, 215, 135)
  })
  logsBox.add(titleText)
  logTexts.push(titleText)
}

/**
 * Update stats panel.
 */
function updateStatsPanel(): void {
  if (!statsText) return

  const stats = getStats()
  if (!stats) {
    statsText.content = 'No stats yet'
    return
  }

  const statsStr = `📊 Stats:
Tokens: ${stats.inputTokens + stats.outputTokens} (${stats.inputTokens} in, ${stats.outputTokens} out)
Cost: $${stats.totalCostUsd.toFixed(4)}
Duration: ${stats.durationMs}ms
Tools: ${stats.toolCallsCount}
Errors: ${stats.errorsCount}`

  statsText.content = statsStr
}

/**
 * Get color for log level.
 */
function getLevelColor(level: LogLevel): RGBA {
  switch (level) {
    case 0: return RGBA.fromInts(136, 136, 136) // DEBUG - gray
    case 1: return RGBA.fromInts(144, 238, 144) // INFO - green
    case 2: return RGBA.fromInts(255, 215, 0)   // WARN - yellow
    case 3: return RGBA.fromInts(255, 80, 80)   // ERROR - red
    default: return RGBA.fromInts(255, 255, 255)
  }
}

/**
 * Get icon for log level.
 */
function getLevelIcon(level: LogLevel): string {
  switch (level) {
    case 0: return '🔍' // DEBUG
    case 1: return 'ℹ️'  // INFO
    case 2: return '⚠️'  // WARN
    case 3: return '❌'  // ERROR
    default: return '•'
  }
}

/**
 * Format timestamp for display.
 */
function formatTimestamp(iso: string): string {
  const date = new Date(iso)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

/**
 * Start the TUI application.
 */
export async function startTUI(): Promise<void> {
  // Configure logger
  configureTUILogger('cyberpunk')

  // Initialize log system with file output
  initLogs({ logDirectory: './logs' })

  logInfo('TUI', 'Starting Bot Manager Agent TUI')

  // Initialize agent hook
  const { execute, getStats: getAgentStats } = useAgent()

  // Initialize operations
  enableAutoProcessing(1000)

  // State
  const state: TUIState = {
    isExecuting: false,
    currentResult: null,
    currentFilter: 1, // INFO
    messages: []
  }

  // Create renderer
  currentRenderer = await createCliRenderer({ exitOnCtrlC: true })
  const renderer = currentRenderer

  // Create main container
  const mainGroup = new BoxRenderable(renderer, {
    id: 'main-group',
    flexDirection: 'column',
    flexGrow: 1
  })
  renderer.root.add(mainGroup)

  // ===== HEADER =====
  const headerText = new TextRenderable(renderer, {
    id: 'header',
    content: '🤖 Bot Manager Agent TUI',
    position: 'absolute',
    left: 1,
    top: 0,
    attributes: TextAttributes.BOLD,
    fg: RGBA.fromInts(255, 215, 135)
  })
  mainGroup.add(headerText)

  // ===== STATS PANEL (top left) =====
  statsText = new TextRenderable(renderer, {
    id: 'stats',
    content: '📊 No stats yet',
    position: 'absolute',
    left: 1,
    top: 2,
    width: 30,
    height: 5
  })
  mainGroup.add(statsText)

  // ===== OUTPUT PANEL (center) =====
  outputText = new TextRenderable(renderer, {
    id: 'output',
    content: 'Waiting for response...',
    position: 'absolute',
    left: 32,
    top: 2,
    width: 67,
    height: 12
  })
  mainGroup.add(outputText)

  // ===== LOGS PANEL (bottom) =====
  logsBox = new BoxRenderable(renderer, {
    id: 'logs-box',
    position: 'absolute',
    left: 1,
    top: 19,
    width: 98,
    height: 5,
    borderStyle: 'single',
    border: true,
    padding: 1,
    backgroundColor: RGBA.fromInts(26, 26, 26, 255)
  })
  mainGroup.add(logsBox)

  // Initialize logs
  updateLogsPanel()

  // ===== INPUT TEXTAREA =====
  promptInput = new TextareaRenderable(renderer, {
    id: 'prompt-input',
    initialValue: '',
    position: 'absolute',
    left: 1,
    top: 25,
    width: 98,
    height: 3,
    backgroundColor: RGBA.fromInts(26, 26, 26, 255),
    textColor: RGBA.fromInts(255, 255, 255, 255),
    focusedBackgroundColor: RGBA.fromInts(42, 42, 42, 255),
    focusedTextColor: RGBA.fromInts(255, 255, 255, 255),
    placeholder: 'Enter prompt... (Shift+Enter: new line | Enter: send | Ctrl+L: logs | Esc: exit)'
  })

  // Custom key bindings: Enter to submit
  const customBindings: KeyBinding[] = [
    { name: 'return', shift: false, action: 'submit' as const }
  ]
  promptInput.keyBindings = customBindings

  mainGroup.add(promptInput)

  // Placeholder for input label
  const inputLabel = new TextRenderable(renderer, {
    id: 'input-label',
    content: '💬 Prompt (Shift+Enter: new line | Enter: send | Ctrl+L: logs | Esc: exit)',
    position: 'absolute',
    left: 1,
    top: 24,
    attributes: TextAttributes.DIM,
    fg: RGBA.fromInts(150, 150, 150, 255)
  })
  mainGroup.add(inputLabel)

  // Handle submit (Enter without shift)
  promptInput.onSubmit = async (_event) => {
    if (!promptInput) return

    const content = promptInput.plainText

    if (!content.trim() || state.isExecuting) {
      return
    }

    // Clear input
    promptInput.clear()

    // Reset messages for new execution
    state.messages = []
    state.isExecuting = true

    // Update output to show working state
    if (outputText) {
      outputText.content = `⏳ Executing: ${content.slice(0, 50)}...`
    }

    logInfo('USER', content)

    // Setup callbacks for streaming
    const callbacks: AgentCallbacks = {
      onMessage: (message) => {
        logInfo('AGENT', `Message received: ${(message as { type: string }).type}`)
      },

      onAssistantMessage: (text: string) => {
        // Accumulate assistant messages
        state.messages.push(text)

        // Update output text directly
        if (outputText) {
          outputText.content = state.messages.join('\n')
        }
      },

      onToolCall: (tool: string, _input: unknown) => {
        // Log tool calls
        logInfo('TOOL', `Tool call: ${tool}`)
      }
    }

    try {
      const result = await execute(content, {}, callbacks)

      state.currentResult = result
      state.isExecuting = false

      // Update output with final result
      if (outputText) {
        if (result.result) {
          outputText.content = result.result
        } else {
          outputText.content = '✅ Execution completed (no output)'
        }
      }

      // Update stats
      const stats = getAgentStats()
      if (stats) {
        updateStats(stats)
      }

      logInfo('TUI', `Execution completed: ${result.success ? 'Success' : 'Failed'}`)
    } catch (error) {
      state.isExecuting = false
      if (outputText) {
        outputText.content = `❌ Error: ${error}`
      }
      logInfo('TUI', `Execution error: ${error}`)
    }

    // Re-focus input after execution
    promptInput.focus()
  }

  // Setup keyboard input handler
  setupKeyboardHandler(renderer, state, promptInput)

  // Frame callback for periodic updates (logs, stats)
  renderer.setFrameCallback(async (_deltaTime) => {
    frameCounter++
    if (frameCounter % 30 === 0) {  // ~2 veces por segundo
      updateLogsPanel()
      updateStatsPanel()
    }
  })

  logInfo('TUI', 'TUI started successfully')
}

/**
 * Setup keyboard input handler for global shortcuts.
 */
function setupKeyboardHandler(
  renderer: Awaited<ReturnType<typeof createCliRenderer>>,
  state: TUIState,
  promptInput: TextareaRenderable
): void {
  renderer.keyInput.on('keypress', (key) => {
    // Log level toggle with Ctrl+L
    if (key.name === 'l' && key.ctrl && !key.shift) {
      const nextLevel = (state.currentFilter + 1) % 4
      state.currentFilter = nextLevel
      setLogFilter({ level: nextLevel })
      logInfo('TUI', `Log level changed to: ${LogLevel[nextLevel]}`)
      updateLogsPanel() // Immediate update
    }

    // Exit on escape
    if (key.name === 'escape') {
      logInfo('TUI', 'Exiting TUI...')
      process.exit(0)
    }

    // Help on F1
    if (key.name === 'f1') {
      logInfo('TUI', 'Shortcuts: Shift+Enter=New line, Enter=Send, Ctrl+L=Toggle log level, Esc=Exit, F1=Help')
    }

    // Clear input with Ctrl+K
    if (key.ctrl && key.name === 'k') {
      promptInput.clear()
      logInfo('TUI', 'Input cleared')
    }
  })

  logInfo('TUI', 'Keyboard handler ready')
}

/**
 * Change log level.
 */
export function changeLogLevel(currentLevel: LogLevel): LogLevel {
  const nextLevel = (currentLevel + 1) % 4
  setLogFilter({ level: nextLevel })
  logInfo('TUI', `Log level changed to: ${LogLevel[nextLevel]}`)
  return nextLevel
}

/**
 * Handle user prompt submission.
 */
export async function submitPrompt(
  prompt: string,
  state: TUIState,
  execute: (prompt: string) => Promise<any>,
  getAgentStats: () => any
): Promise<void> {
  if (!prompt.trim()) {
    return
  }

  state.isExecuting = true
  logInfo('USER', prompt)

  try {
    const result = await execute(prompt)

    state.currentResult = result
    state.isExecuting = false

    // Update stats
    const stats = getAgentStats()
    if (stats) {
      updateStats(stats)
    }

    logInfo('TUI', `Execution completed: ${result.success ? 'Success' : 'Failed'}`)
  } catch (error) {
    state.isExecuting = false
    logInfo('TUI', `Execution error: ${error}`)
  }
}
