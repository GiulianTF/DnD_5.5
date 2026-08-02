import type { Item, Spell } from '../types'

/**
 * Leitura do que é "usável" numa ficha: quantas cargas um item mágico tem, o
 * que se gasta ao usar e qual dado o texto do livro manda rolar. Os catálogos
 * guardam o texto integral das regras, então em vez de duplicar cada número num
 * campo novo lemos o próprio texto — é uma fonte só, e ela já está revisada.
 */

export interface CargasDoItem {
  /** total de cargas do item */
  max: number
  /** como o item recarrega, no texto do livro ("recupera 1d6 cargas ao amanhecer") */
  recarga?: string
}

/*
 * "Esta varinha tem 7 cargas" é a forma que o livro usa para declarar o total.
 * "com N cargas" também aparece, mas é ambíguo — "Com 1 carga, você conjura a
 * versão de 1º círculo" fala do custo de UM uso, não do total. Por isso ele só
 * entra como segunda tentativa, quando nenhuma forma direta apareceu.
 */
/*
 * `têm` (plural de "ter") aparece nos itens que são um par — "estas lentes têm
 * 3 cargas". Alguns itens só declaram o total de passagem, dentro da frase do
 * custo: "gastar 1 das 3 cargas dele" (Anel dos Três Desejos).
 *
 * Itens cujo total é rolado ("a arma tem 1d3 cargas") ficam de fora de
 * propósito: sem número fixo não há barra de cargas honesta para mostrar, e o
 * texto integral do item continua na ficha para o jogador controlar na mão.
 */
const TOTAL_DE_CARGAS = /\b(?:tem|têm|possui|possuem|contém)\s+(\d+)\s+cargas?\b/i
const TOTAL_EM_CUSTO = /\b\d+\s+d[ao]s\s+(\d+)\s+cargas?\b/i
const TOTAL_ALTERNATIVO = /\bcom\s+(\d+)\s+cargas?\b/i
/*
 * O espaço logo depois do verbo evita casar com o título "Recuperando Cargas."
 * que abre o parágrafo — queremos a frase de regra ("recupera 1d6 + 1 cargas
 * gastas diariamente ao amanhecer"), não o cabeçalho. Alguns itens omitem a
 * palavra "cargas" na frase ("recupera diariamente ao amanhecer"), daí a
 * segunda alternativa.
 */
const COMO_RECARREGA = /\b(recupera(?:m|ram)?\s+[^.]*?(?:cargas?\b|ao amanhecer)[^.]*)\./i

/** Junta o texto do item numa string só para as buscas. */
const textoDoItem = (item: Item): string =>
  [item.magic?.desc, ...(item.magic?.text ?? []), item.desc].filter(Boolean).join(' ')

/**
 * Cargas que o item declara no próprio texto. Devolve `undefined` quando o item
 * não trabalha com cargas — aí não há o que controlar na ficha.
 */
export function cargasDoItem(item: Item): CargasDoItem | undefined {
  const texto = textoDoItem(item)
  const total = texto.match(TOTAL_DE_CARGAS)
    ?? texto.match(TOTAL_EM_CUSTO)
    ?? texto.match(TOTAL_ALTERNATIVO)
  if (!total) return undefined
  const max = Number(total[1])
  if (!Number.isFinite(max) || max <= 0) return undefined
  const recarga = texto.match(COMO_RECARREGA)
  return { max, recarga: recarga?.[1]?.trim() }
}

/** Item que some da mochila ao ser usado: poções, pergaminhos e munição. */
export function ehConsumivel(item: Item): boolean {
  const cat = item.magic?.category
  return cat === 'Poção' || cat === 'Pergaminho' || cat === 'Munição'
}

/** O item pode ser usado na ficha (tem cargas ou se gasta). */
export const ehUsavel = (item: Item): boolean => ehConsumivel(item) || !!cargasDoItem(item)

/*
 * Primeiro dado citado no texto. As descrições do livro trazem o dano e a cura
 * no corpo do texto ("sofre 8d6 de dano de fogo"), então é de lá que sai a
 * sugestão de rolagem. Ignoramos o que vier depois de "Espaço de Magia de
 * Círculo Superior": aquele trecho é o acréscimo por círculo, não a rolagem base.
 */
const DADO = /\b(\d{1,2})d(\d{1,3})\b/
const CORTE_UPCAST = /Usando um Espaço de Magia de Círculo Superior|Aprimoramento de Truque/i

/** Ex.: "8d6". Devolve `undefined` quando o texto não pede rolagem nenhuma. */
export function dadosNoTexto(paragrafos: string[]): string | undefined {
  for (const p of paragrafos) {
    if (CORTE_UPCAST.test(p)) break
    const m = p.match(DADO)
    if (m) return `${m[1]}d${m[2]}`
  }
  return undefined
}

/** Dado sugerido ao conjurar uma magia. */
export const dadosDaMagia = (s: Spell): string | undefined => dadosNoTexto(s.desc)

/** Dado sugerido ao usar um item. */
export const dadosDoItem = (item: Item): string | undefined =>
  dadosNoTexto([...(item.magic?.text ?? []), item.magic?.desc, item.desc].filter(Boolean) as string[])

// ---------- Qual espaço de magia gastar ----------
/**
 * Círculos que ainda têm espaço livre e servem para conjurar uma magia daquele
 * nível — do próprio círculo para cima, porque conjurar num espaço maior é
 * sempre permitido (e às vezes melhor).
 */
export function circulosDisponiveis(
  nivelDaMagia: number,
  totais: number[],
  gastos: Record<number, number>,
): number[] {
  const out: number[] = []
  for (let lvl = Math.max(1, nivelDaMagia); lvl <= totais.length; lvl++) {
    const total = totais[lvl - 1] ?? 0
    if (total - (gastos[lvl] ?? 0) > 0) out.push(lvl)
  }
  return out
}
