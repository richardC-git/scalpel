// Vite's `?raw` suffix imports a file's contents as a string (used for the
// plugins bundled in src/main/plugins/bundled).
declare module '*?raw' {
  const content: string
  export default content
}
