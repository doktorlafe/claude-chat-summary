export type Summary = string | null

declare module 'claude-code' {
  interface PluginState {
    'chat-summary': { summary: Summary }
  }
}
