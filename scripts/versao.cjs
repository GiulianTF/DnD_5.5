// Sincroniza a versao do app com a primeira entrada de src/data/patch-notes.ts.
//
// As notas de atualizacao sao a fonte da verdade: para publicar uma versao nova
// voce escreve a entrada no topo de PATCH_NOTES e roda o gerar-prod. Este script
// copia essa versao para o package.json, de onde o vite.config.ts a injeta em
// __APP_VERSION__ e a etiqueta de versao do app se atualiza sozinha.
//
// Uso:
//   node scripts/versao.cjs            grava a versao no package.json
//   node scripts/versao.cjs --check    so confere (nao grava); sai 1 se divergir
const fs = require('node:fs')
const path = require('node:path')

const raiz = path.resolve(__dirname, '..')
const arquivoNotas = path.join(raiz, 'src', 'data', 'patch-notes.ts')
const arquivoPkg = path.join(raiz, 'package.json')
const conferir = process.argv.includes('--check')

const notas = fs.readFileSync(arquivoNotas, 'utf8')

// Primeira entrada da lista = versao atual. Lemos o texto direto para nao
// precisar compilar TypeScript so por causa de duas linhas.
const inicio = notas.indexOf('export const PATCH_NOTES')
if (inicio < 0) {
  console.error('ERRO  nao achei PATCH_NOTES em src/data/patch-notes.ts')
  process.exit(1)
}
const primeira = notas.slice(inicio).match(/version:\s*'([^']+)'/)
const primeiraData = notas.slice(inicio).match(/date:\s*'([^']+)'/)
if (!primeira) {
  console.error('ERRO  a primeira entrada de PATCH_NOTES nao tem "version"')
  process.exit(1)
}
const versao = primeira[1]

if (!/^\d+\.\d+\.\d+$/.test(versao)) {
  console.error(`ERRO  versao "${versao}" nao esta no formato x.y.z`)
  process.exit(1)
}
if (!primeiraData || !/^\d{4}-\d{2}-\d{2}$/.test(primeiraData[1])) {
  console.error('ERRO  a primeira entrada de PATCH_NOTES precisa de uma data aaaa-mm-dd')
  process.exit(1)
}

// A lista tem que estar em ordem decrescente: a mais nova em cima.
const todas = [...notas.slice(inicio).matchAll(/version:\s*'([^']+)'/g)].map((m) => m[1])
const numero = (v) => v.split('.').map(Number).reduce((a, n) => a * 1000 + n, 0)
for (let i = 1; i < todas.length; i++) {
  if (numero(todas[i]) >= numero(todas[i - 1])) {
    console.error(`ERRO  PATCH_NOTES fora de ordem: ${todas[i]} vem depois de ${todas[i - 1]}`)
    process.exit(1)
  }
}

const pkg = JSON.parse(fs.readFileSync(arquivoPkg, 'utf8'))
if (pkg.version === versao) {
  console.log(`OK  versao ${versao} (package.json ja esta sincronizado)`)
  process.exit(0)
}

if (conferir) {
  console.error(`ERRO  package.json esta em ${pkg.version} e as notas em ${versao}. Rode: node scripts/versao.cjs`)
  process.exit(1)
}

// Reescreve so a linha da versao para preservar a formatacao do arquivo.
const original = fs.readFileSync(arquivoPkg, 'utf8')
const atualizado = original.replace(
  /("version"\s*:\s*)"[^"]*"/,
  (_, prefixo) => `${prefixo}"${versao}"`,
)
if (atualizado === original) {
  console.error('ERRO  nao achei o campo "version" no package.json')
  process.exit(1)
}
fs.writeFileSync(arquivoPkg, atualizado)
console.log(`OK  versao ${pkg.version} -> ${versao} (${todas.length} nota(s) de atualizacao)`)
