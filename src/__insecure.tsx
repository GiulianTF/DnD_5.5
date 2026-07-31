// Reproduz o contexto inseguro (http:// por IP da rede), onde crypto.randomUUID nao existe.
// Nao faz parte do app.
declare const process: { exitCode?: number }

const cryptoAny = globalThis.crypto as unknown as { randomUUID?: unknown }
const tinha = typeof cryptoAny.randomUUID === 'function'
// Em contexto inseguro a propriedade simplesmente nao existe no objeto crypto.
Object.defineProperty(globalThis.crypto, 'randomUUID', { value: undefined, configurable: true, writable: true })
console.log(`crypto.randomUUID existia: ${tinha}; agora: ${typeof cryptoAny.randomUUID} (simulando http:// por IP)`)

let falhas = 0
const tenta = (nome: string, fn: () => void) => {
  try { fn(); console.log(`  . ${nome}`) } catch (e) { falhas++; console.log(`  X ${nome}: ${(e as Error).message}`) }
}

async function main() {
  const { newCharacter } = await import('./store/store')
  const { roll, rollDamage } = await import('./engine/dice')
  const { renderToString } = await import('react-dom/server')
  const { CharacterCreator } = await import('./screens/CharacterCreator')
  const { CharacterSheet } = await import('./screens/CharacterSheet')

  const { uid } = await import('./engine/uid')

  console.log('\n== Gerador de identificadores sem randomUUID ==')
  const gerados = new Set<string>()
  for (let i = 0; i < 20000; i++) gerados.add(uid())
  tenta(`20000 identificadores unicos (gerados ${gerados.size})`, () => {
    if (gerados.size !== 20000) throw new Error(`houve colisao: ${20000 - gerados.size}`)
  })
  const formato = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
  const primeiro = [...gerados][0]
  tenta(`formato UUID v4 valido (${primeiro})`, () => {
    const invalidos = [...gerados].filter((g) => !formato.test(g))
    if (invalidos.length) throw new Error(`${invalidos.length} fora do formato, ex.: ${invalidos[0]}`)
  })

  console.log('\n== Acoes que geram identificadores ==')
  tenta('newCharacter (criar ficha)', () => { newCharacter({ name: 'Teste' }) })
  tenta('roll (rolar dado)', () => { roll({ label: 'd20', sides: 20, isD20Test: true }) })
  tenta('rollDamage (rolar dano)', () => { rollDamage('Espada', '1d8', 3, 'Cortante') })
  tenta('CharacterCreator (tela de criacao)', () => {
    renderToString(<CharacterCreator onDone={() => {}} onCancel={() => {}} />)
  })
  tenta('CharacterSheet (ficha aberta)', () => {
    const c = newCharacter({ name: 'Teste', classId: 'guerreiro' })
    renderToString(<CharacterSheet char={c} onBack={() => {}} />)
  })

  console.log(falhas === 0 ? '\n>>> CONTEXTO INSEGURO OK' : `\n>>> ${falhas} FALHA(S) EM CONTEXTO INSEGURO`)
  if (falhas > 0) process.exitCode = 1
}

main()
