/**
 * Regras do gesto lateral que troca de aba. Ficam separadas da interface para
 * poderem ser testadas sem navegador — o componente só liga os eventos de toque
 * e de rolagem a estas funções.
 */

/** Distância mínima, em px, para o arrasto virar troca de aba. */
export const LIMIAR = 60
/** Um piparote rápido troca de aba mesmo sem chegar ao limiar (px por ms). */
export const VELOCIDADE_FLICK = 0.45
/** Abaixo disso o gesto ainda não tem direção definida — não roubamos a rolagem. */
export const FOLGA = 12
/** Quanto o dedo precisa andar a mais na horizontal para vencer a vertical. */
export const DOMINANCIA = 1.2
/** Rolagem horizontal de trackpad acumulada até trocar de aba. */
export const LIMIAR_RODA = 90

export type Eixo = 'indefinido' | 'horizontal' | 'vertical'

/**
 * Para qual eixo o gesto pendeu. Enquanto for 'indefinido' não fazemos nada:
 * roubar o movimento cedo demais faria a página travar ao rolar na diagonal.
 * 'vertical' é definitivo — aquele toque é da rolagem da página, não nosso.
 */
export function definirEixo(dx: number, dy: number): Eixo {
  if (Math.abs(dx) > FOLGA && Math.abs(dx) > Math.abs(dy) * DOMINANCIA) return 'horizontal'
  if (Math.abs(dy) > FOLGA) return 'vertical'
  return 'indefinido'
}

/**
 * Quanto o conteúdo anda de fato. Puxar para um lado que não tem aba faz o
 * conteúdo ceder só um pouco: o elástico avisa que ali a lista acabou.
 */
export function deslocamento(dx: number, temAnterior: boolean, temProxima: boolean): number {
  const semVizinho = (dx > 0 && !temAnterior) || (dx < 0 && !temProxima)
  return semVizinho ? dx / 4 : dx
}

/**
 * Quantas abas andar ao soltar o dedo: -1 volta, +1 avança, 0 fica.
 * Arrastar para a esquerda (dx negativo) traz a próxima aba, como virar página.
 */
export function decidirTroca(dx: number, duracaoMs: number): -1 | 0 | 1 {
  const velocidade = Math.abs(dx) / Math.max(1, duracaoMs)
  if (Math.abs(dx) < LIMIAR && velocidade < VELOCIDADE_FLICK) return 0
  return dx < 0 ? 1 : -1
}

/** Índice de destino, preso aos limites da lista (não circula). */
export function proximoIndice(atual: number, passo: number, total: number): number {
  return Math.max(0, Math.min(total - 1, atual + passo))
}
