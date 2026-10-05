declare module 'claude-code' {
  interface PluginState {
    'game-sounds': {
      // Кадр индикатора загрузки звуков; null, когда загрузки нет.
      downloadFrame: number | null
    }
  }
}
