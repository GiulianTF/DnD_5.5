// Executa os testes de regras e de renderização fora do navegador.
// Uso: node scripts/run-tests.cjs [regras|render|todos]
const { execFileSync } = require('node:child_process')
const path = require('node:path')
const os = require('node:os')
const fs = require('node:fs')

const raiz = path.resolve(__dirname, '..')
const saida = fs.mkdtempSync(path.join(os.tmpdir(), 'fichas-dnd-teste-'))
const alvo = process.argv[2] ?? 'todos'

// Ambiente de navegador mínimo para o código que roda fora do browser
const mem = { getItem: () => null, setItem: () => {}, removeItem: () => {} }
globalThis.localStorage = mem
if (!('onLine' in globalThis.navigator)) {
  Object.defineProperty(globalThis.navigator, 'onLine', { value: true, configurable: true })
}
Object.defineProperty(globalThis, 'window', {
  value: { addEventListener: () => {}, removeEventListener: () => {}, __pwaPrompt: null, localStorage: mem },
  configurable: true, writable: true,
})
Object.defineProperty(globalThis, 'document', {
  value: { body: { style: {} }, getElementById: () => null, createElement: () => ({ click: () => {} }) },
  configurable: true, writable: true,
})

// Chamamos o entrypoint JS do esbuild direto pelo node: sem shell, funciona igual em Windows e Unix.
const esbuild = path.join(raiz, 'node_modules', 'esbuild', 'bin', 'esbuild')

function compilarERodar(entrada, nome) {
  const arquivo = path.join(saida, `${nome}.cjs`)
  execFileSync(process.execPath, [
    esbuild, entrada, '--bundle', '--platform=node', '--format=cjs',
    '--define:import.meta.env={}', `--outfile=${arquivo}`, '--log-level=error',
  ], { cwd: raiz, stdio: 'inherit' })
  require(arquivo)
}

let falhou = false
const original = process.exitCode
try {
  if (alvo === 'regras' || alvo === 'todos') compilarERodar('src/__smoke.ts', 'regras')
  if (alvo === 'render' || alvo === 'todos') compilarERodar('src/__render.tsx', 'render')
  // Por último: remove crypto.randomUUID do ambiente, então não pode rodar antes dos outros.
  if (alvo === 'inseguro' || alvo === 'todos') compilarERodar('src/__insecure.tsx', 'inseguro')
} catch (e) {
  console.error(e.message)
  falhou = true
} finally {
  fs.rmSync(saida, { recursive: true, force: true })
}

process.exitCode = falhou ? 1 : original
