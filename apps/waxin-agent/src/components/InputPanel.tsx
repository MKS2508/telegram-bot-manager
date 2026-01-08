/**
 * Input Panel Component.
 *
 * Provides a wrapper for text input.
 * Note: For event handling, use InputRenderable directly with InputRenderableEvents.
 */

import { Box, Input } from '@opentui/core'

/**
 * Input Panel Props.
 */
export interface InputPanelProps {
  id?: string
  placeholder?: string
  width?: number
  height?: number
  backgroundColor?: string
  textColor?: string
  cursorColor?: string
  focusedBackgroundColor?: string
}

/**
 * Render input panel (declarative wrapper).
 * For full event handling, use InputRenderable class directly.
 */
export function InputPanel({
  id = 'input',
  placeholder = 'Enter text...',
  width = 40,
  height = 3,
  backgroundColor = '#1a1a1a',
  textColor = '#ffffff',
  cursorColor = '#00ff00',
  focusedBackgroundColor = '#2a2a2a'
}: InputPanelProps): any {
  return Box(
    {
      borderStyle: 'single',
      border: true,
      padding: 1
    },
    Input({
      id,
      placeholder,
      width,
      height,
      backgroundColor,
      textColor,
      cursorColor,
      focusedBackgroundColor
    })
  )
}
