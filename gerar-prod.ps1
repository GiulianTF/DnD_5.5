# gerar-prod.ps1 — Publica o app na Vercel (produção)
# Uso:  .\gerar-prod.ps1
# O que faz: valida os tipos, gera o build local (para pegar erros antes de
# subir) e, se tudo passar, faz o deploy de produção na Vercel.
#
# IMPORTANTE: NÃO use $ErrorActionPreference='Stop' aqui. Comandos nativos como
# 'vercel' e 'npm' escrevem o banner de versão no stderr como saída normal; com
# 'Stop' o PowerShell interpretaria isso como erro e abortaria o script. Em vez
# disso, checamos o código de saída de cada comando ($LASTEXITCODE).

Set-Location -Path $PSScriptRoot

function Write-Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "OK  $msg" -ForegroundColor Green }
function Write-Err($msg)  { Write-Host "ERRO  $msg" -ForegroundColor Red }

# 0) Confere se a Vercel CLI existe e se você está logado
Write-Step "Verificando a Vercel CLI"
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
  Write-Err "A Vercel CLI nao esta instalada. Rode:  npm install -g vercel"
  exit 1
}
$who = vercel whoami 2>$null | Select-Object -Last 1
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($who)) {
  Write-Err "Voce nao esta logado na Vercel. Rode:  vercel login"
  exit 1
}
Write-Ok "Logado como $($who.Trim())"

# 1) Versao: copia a versao da nota de atualizacao mais recente para o
# package.json, de onde o build injeta a etiqueta de versao mostrada no app.
Write-Step "Sincronizando a versao"
node scripts/versao.cjs
if ($LASTEXITCODE -ne 0) { Write-Err "Nao consegui definir a versao. Deploy cancelado."; exit 1 }

# 2) Testes (regras + renderizacao). Comente este bloco se quiser pular.
Write-Step "Rodando testes"
npm test
if ($LASTEXITCODE -ne 0) { Write-Err "Testes falharam. Deploy cancelado."; exit 1 }
Write-Ok "Testes passaram"

# 3) Build local (tsc -b + vite build) — pega erros de tipo antes de subir
Write-Step "Gerando build local"
npm run build
if ($LASTEXITCODE -ne 0) { Write-Err "Build falhou. Deploy cancelado."; exit 1 }
Write-Ok "Build gerado em dist/"

# 4) Deploy de producao
Write-Step "Publicando na Vercel (producao)"
vercel --prod --yes
if ($LASTEXITCODE -ne 0) { Write-Err "Deploy falhou."; exit 1 }

Write-Host ""
Write-Ok "Publicado! Producao: https://dnd-fichas-2024.vercel.app"
