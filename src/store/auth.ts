import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { getClient } from './sync'

const OFFLINE_KEY = 'dnd_usar_offline'

const lerOffline = () => {
  try {
    return localStorage.getItem(OFFLINE_KEY) === '1'
  } catch {
    return false
  }
}

export interface AuthResult {
  ok: boolean
  message: string
}

interface AuthState {
  session: Session | null
  user: User | null
  ready: boolean // já checamos a sessão inicial?
  offline: boolean // o usuário escolheu usar sem conta
  setOffline: (v: boolean) => void
  init: () => Promise<void>
  signInEmail: (email: string, senha: string) => Promise<AuthResult>
  signUpEmail: (email: string, senha: string) => Promise<AuthResult>
  signOut: () => Promise<void>
}

let inscrito = false

export const useAuth = create<AuthState>((set) => ({
  session: null,
  user: null,
  ready: false,
  offline: lerOffline(),

  setOffline: (v) => {
    try {
      localStorage.setItem(OFFLINE_KEY, v ? '1' : '0')
    } catch {
      /* ignora storage indisponível */
    }
    set({ offline: v })
  },

  init: async () => {
    const supabase = await getClient()
    // Sem credenciais embutidas (ex.: rodando local sem .env) → não há nuvem.
    if (!supabase) {
      set({ ready: true })
      return
    }
    const { data } = await supabase.auth.getSession()
    set({ session: data.session ?? null, user: data.session?.user ?? null, ready: true })
    if (!inscrito) {
      inscrito = true
      supabase.auth.onAuthStateChange((_evento, session) => {
        set({ session: session ?? null, user: session?.user ?? null })
      })
    }
  },

  signInEmail: async (email, senha) => {
    const supabase = await getClient()
    if (!supabase) return { ok: false, message: 'A nuvem não está disponível neste momento.' }
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
    if (error) return { ok: false, message: traduzErro(error.message) }
    return { ok: true, message: 'Bem-vindo de volta!' }
  },

  signUpEmail: async (email, senha) => {
    const supabase = await getClient()
    if (!supabase) return { ok: false, message: 'A nuvem não está disponível neste momento.' }
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password: senha })
    if (error) return { ok: false, message: traduzErro(error.message) }
    // Se o projeto exigir confirmação por e-mail, ainda não há sessão.
    if (data.session) return { ok: true, message: 'Conta criada com sucesso!' }
    return { ok: true, message: 'Conta criada! Confira seu e-mail para confirmar o cadastro antes de entrar.' }
  },

  signOut: async () => {
    const supabase = await getClient()
    await supabase?.auth.signOut()
    set({ session: null, user: null })
  },
}))

function traduzErro(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'E-mail ou senha incorretos.'
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'Este e-mail já possui conta. Faça login.'
  if (m.includes('at least') || (m.includes('password') && m.includes('6')))
    return 'A senha precisa ter pelo menos 6 caracteres.'
  if (m.includes('unable to validate email') || m.includes('invalid email')) return 'E-mail inválido.'
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.'
  if (m.includes('rate limit')) return 'Muitas tentativas. Aguarde um instante e tente de novo.'
  return msg
}
