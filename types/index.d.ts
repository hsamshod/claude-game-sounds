declare module 'claude-code' {
  interface PluginState {
    'warcraft-sounds': {
      // Кадр индикатора загрузки звуков; null, когда загрузки нет.
      downloadFrame: number | null
    }
  }
}
