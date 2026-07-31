import type { SupabaseClient } from '@supabase/supabase-js'
import type { Character } from '../types'
import { useStore } from './store'

let client: SupabaseClient | null = null
let clientKey = ''

/**
 * A biblioteca do Supabase é carregada sob demanda: quem só usa o app offline
 * nunca baixa esse pedaço do código.
 */
export async function getClient(): Promise<SupabaseClient | null> {
  const { supabaseUrl, supabaseKey } = useStore.getState()
  if (!supabaseUrl || !supabaseKey) return null
  const key = supabaseUrl + supabaseKey
  if (!client || clientKey !== key) {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      client = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: true } })
      clientKey = key
    } catch {
      return null
    }
  }
  return client
}

export const isConfigured = () => {
  const { supabaseUrl, supabaseKey } = useStore.getState()
  return Boolean(supabaseUrl && supabaseKey)
}

export interface SyncResult {
  ok: boolean
  message: string
  enviadas?: number
  recebidas?: number
}

const toRow = (c: Character, userId: string | null) => ({
  id: c.id,
  user_id: userId,
  nome: c.name,
  nivel: c.level,
  classe: c.classId,
  dados: c as unknown as Record<string, unknown>,
  updated_at: new Date(c.updatedAt).toISOString(),
})

/**
 * Sincronização bidirecional por "último a escrever vence" (comparando updatedAt).
 * Requer a tabela `fichas` — veja supabase/schema.sql.
 */
export async function syncNow(): Promise<SyncResult> {
  if (!navigator.onLine) return { ok: false, message: 'Você está offline. Os dados seguem salvos no aparelho.' }

  const supabase = await getClient()
  if (!supabase) return { ok: false, message: 'Configure a URL e a chave do Supabase na aba Nuvem.' }

  const store = useStore.getState()
  const locais = store.characters

  try {
    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData.session?.user.id ?? null

    const { data: remotas, error: readError } = await supabase.from('fichas').select('id, dados, updated_at')
    if (readError) return { ok: false, message: `Erro ao ler do Supabase: ${readError.message}` }

    const remoteMap = new Map<string, Character>()
    for (const row of remotas ?? []) {
      const dados = row.dados as unknown as Character
      if (dados?.id) remoteMap.set(dados.id, dados)
    }

    // Quem vence: comparação por updatedAt
    const merged = new Map<string, Character>()
    for (const c of locais) merged.set(c.id, c)
    let recebidas = 0
    for (const [id, remote] of remoteMap) {
      const local = merged.get(id)
      if (!local) {
        merged.set(id, remote)
        recebidas++
      } else if ((remote.updatedAt ?? 0) > (local.updatedAt ?? 0)) {
        merged.set(id, remote)
        recebidas++
      }
    }

    const finais = [...merged.values()]
    const paraEnviar = finais.filter((c) => {
      const remote = remoteMap.get(c.id)
      return !remote || (c.updatedAt ?? 0) > (remote.updatedAt ?? 0)
    })

    if (paraEnviar.length) {
      const { error: upError } = await supabase
        .from('fichas')
        .upsert(paraEnviar.map((c) => toRow(c, userId)), { onConflict: 'id' })
      if (upError) return { ok: false, message: `Erro ao enviar: ${upError.message}` }
    }

    store.replaceAll(finais)
    store.setLastSync(Date.now())

    return {
      ok: true,
      message: `Sincronizado: ${paraEnviar.length} enviada(s), ${recebidas} recebida(s).`,
      enviadas: paraEnviar.length,
      recebidas,
    }
  } catch (e) {
    return { ok: false, message: `Falha na sincronização: ${(e as Error).message}` }
  }
}

export async function deleteRemote(id: string): Promise<void> {
  if (!navigator.onLine) return
  const supabase = await getClient()
  if (!supabase) return
  await supabase.from('fichas').delete().eq('id', id)
}

// ---------- Backup local (funciona 100% offline) ----------
export function exportarJSON(characters: Character[]) {
  const blob = new Blob([JSON.stringify({ versao: 1, fichas: characters }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fichas-dnd-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importarJSON(file: File): Promise<Character[]> {
  const texto = await file.text()
  const dados = JSON.parse(texto)
  const fichas: Character[] = Array.isArray(dados) ? dados : dados.fichas
  if (!Array.isArray(fichas)) throw new Error('Arquivo inválido: não encontrei a lista de fichas.')
  return fichas
}
