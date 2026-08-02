import type { AbilityKey, Feat, SpellPick } from '../types'

/** As magias de talento usam a habilidade de conjuração que o jogador escolher. */
const INT_SAB_CAR: AbilityKey[] = ['int', 'sab', 'car']

const escolha = (
  id: string, source: string, fromClasses: string[], spellLevel: number, count: number,
  opts: Partial<SpellPick> = {},
): SpellPick => ({
  id, source, level: 1, count, fromClasses, spellLevel,
  abilities: INT_SAB_CAR, freeUses: 'longo', ...opts,
})

export const FEATS: Feat[] = [
  // ---------- Talentos de Origem (PHB 2024) ----------
  { id: 'alerta', name: 'Alerta', category: 'origem', desc: 'Adicione seu bônus de proficiência à Iniciativa. Após rolar Iniciativa, você pode trocar seu resultado com o de um aliado disposto.' },
  { id: 'artesao-talento', name: 'Artífice', category: 'origem', desc: 'Proficiência com três ferramentas de artesão. Desconto de 20% ao comprar itens não mágicos. Ao terminar um descanso longo, pode fabricar um item simples da lista do talento.' },
  { id: 'curandeiro', name: 'Curandeiro', category: 'origem', desc: 'Com um kit de curandeiro, use uma ação para permitir que uma criatura gaste um Dado de Vida e role-o + seu bônus de proficiência em cura. Pode rerrolar 1s em dados de cura.' },
  { id: 'sortudo-talento', name: 'Sortudo', category: 'origem', desc: 'Você tem pontos de sorte = bônus de proficiência (recupera em descanso longo). Gaste 1 para ter Vantagem num Teste D20 seu ou impor Desvantagem a um ataque contra você.' },
  {
    id: 'iniciado-em-magia',
    name: 'Iniciado em Magia',
    category: 'origem',
    desc: 'Escolha a lista de Clérigo, Druida ou Mago: aprenda 2 truques e uma magia de 1º círculo dessa lista (conjurável 1×/descanso longo sem gastar espaço, ou gastando um espaço de magia).',
    repeatable: true,
    spellPicks: [
      escolha('iniciado-em-magia-truques', 'Iniciado em Magia', ['clerigo', 'druida', 'mago'], 0, 2, {
        freeUses: 'vontade',
        nota: 'Os dois truques e a magia de 1º círculo devem sair da mesma lista (Clérigo, Druida ou Mago).',
      }),
      escolha('iniciado-em-magia-magia', 'Iniciado em Magia', ['clerigo', 'druida', 'mago'], 1, 1, {
        nota: 'Conjurável 1×/descanso longo sem gastar espaço — ou gastando um espaço de magia, se você tiver.',
      }),
    ],
  },
  { id: 'musicista', name: 'Musicista', category: 'origem', desc: 'Proficiência com três instrumentos musicais. Ao terminar um descanso curto ou longo, dê Inspiração Heroica a aliados (= bônus de proficiência).' },
  { id: 'atacante-selvagem', name: 'Atacante Selvagem', category: 'origem', desc: '1×/turno, ao acertar um ataque com arma, você pode rolar os dados de dano duas vezes e usar o melhor resultado.' },
  { id: 'habilidoso', name: 'Habilidoso', category: 'origem', desc: 'Ganhe proficiência em três perícias ou ferramentas à sua escolha.', repeatable: true },
  { id: 'brigao-de-taverna', name: 'Brigão de Taverna', category: 'origem', desc: 'Ataques desarmados causam 1d4 + FOR; pode rerrolar 1s no dano; proficiência com armas improvisadas; empurre 1,5 m ao acertar ataque desarmado 1×/turno.' },
  { id: 'durao', name: 'Durão', category: 'origem', desc: 'Seu máximo de Pontos de Vida aumenta em 2 por nível de personagem.' },

  // ---------- Talentos Gerais (nível 4+) ----------
  { id: 'aumento-de-habilidade', name: 'Incremento no Valor de Habilidade', category: 'geral', desc: '+2 em uma habilidade ou +1 em duas (máx. 20).', repeatable: true },
  { id: 'atleta', name: 'Atleta', category: 'geral', desc: '+1 FOR ou DES. Levantar-se custa só 1,5 m; escalada não custa movimento extra; salto com apenas 1,5 m de impulso.', abilityIncrease: ['for', 'des'] },
  { id: 'mestre-em-armas-grandes', name: 'Mestre em Armas Grandes', category: 'geral', desc: '+1 FOR. Ao marcar acerto crítico ou reduzir criatura a 0 PV com arma corpo a corpo, faça um ataque extra como ação Bônus. Armas Pesadas: some o bônus de proficiência ao dano 1×/turno.', abilityIncrease: ['for'] },
  { id: 'atirador-perito', name: 'Atirador de Elite', category: 'geral', desc: '+1 DES. Ataques à distância ignoram meia cobertura e três-quartos; sem Desvantagem por alcance longo; sem Desvantagem por inimigos adjacentes.', abilityIncrease: ['des'] },
  { id: 'mestre-em-armaduras-pesadas', name: 'Mestre em Armadura Pesada', category: 'geral', desc: '+1 FOR ou CON. Usando armadura pesada, reduza em seu bônus de proficiência o dano Cortante, Perfurante e de Concussão sofrido.', abilityIncrease: ['for', 'con'] },
  { id: 'mestre-em-armas-de-hasta', name: 'Mestre em Armas de Hasta', category: 'geral', desc: '+1 FOR ou DES. Com lança, azagaia ou arma de hasta: ataque Bônus com a outra extremidade (1d4); reação de ataque quando inimigos entram no seu alcance.', abilityIncrease: ['for', 'des'] },
  { id: 'perito-em-escudos', name: 'Mestre em Escudos', category: 'geral', desc: '+1 FOR. 1×/turno, ao acertar um ataque corpo a corpo pela ação Atacar, golpeie com o escudo: o alvo (até uma categoria maior) faz SG de FOR (CD 8 + mod. FOR + prof.) ou é derrubado (Caído) ou empurrado 1,5 m. Reação: some o bônus de CA do escudo a uma salvaguarda de DES sua; se passar e o efeito causar meio dano, você não sofre dano.', abilityIncrease: ['for'] },
  { id: 'resiliente', name: 'Resiliente', category: 'geral', desc: '+1 em uma habilidade em que você não tenha proficiência em salvaguardas; ganhe proficiência nas salvaguardas dessa habilidade.', abilityIncrease: ['for', 'des', 'con', 'int', 'sab', 'car'] },
  { id: 'observador', name: 'Observador', category: 'geral', desc: '+1 INT ou SAB. Proficiência (ou Perícia Aprimorada) em Intuição, Investigação ou Percepção.', abilityIncrease: ['int', 'sab'] },
  { id: 'sentinela', name: 'Sentinela', category: 'geral', desc: '+1 FOR ou DES. Reação: ataque contra quem atacar outro alvo ou usar Desengajar; seu ataque de oportunidade reduz o deslocamento do alvo a 0.', abilityIncrease: ['for', 'des'] },
  { id: 'conjurador-de-guerra', name: 'Conjurador de Guerra', category: 'geral', desc: '+1 INT, SAB ou CAR. Vantagem em salvaguardas de concentração; conjure truques como ataques de oportunidade; componentes somáticos mesmo com as mãos ocupadas.', abilityIncrease: ['int', 'sab', 'car'] },
  { id: 'aparador-duplo', name: 'Lutador com Duas Armas', category: 'geral', desc: '+1 FOR ou DES. Ao atacar com uma arma Leve pela ação Atacar, faça um ataque extra como ação Bônus com uma arma corpo a corpo diferente que não seja de Duas Mãos (sem somar o modificador de habilidade ao dano); saque ou guarde duas armas de uma vez.', abilityIncrease: ['for', 'des'] },
  { id: 'adepto-elemental', name: 'Adepto Elemental', category: 'geral', desc: '+1 INT, SAB ou CAR. Escolha um tipo de dano (ácido, elétrico, fogo, frio ou trovão): suas magias ignoram resistência a ele e tratam 1s nos dados de dano como 2s.', abilityIncrease: ['int', 'sab', 'car'], repeatable: true },
  {
    id: 'tocado-pela-sombra',
    name: 'Tocado pela Sombra',
    category: 'geral',
    desc: '+1 INT, SAB ou CAR. Aprenda Invisibilidade e uma magia de 1º círculo de Ilusão ou Necromancia; conjure cada uma 1×/descanso longo sem gastar espaço.',
    abilityIncrease: ['int', 'sab', 'car'],
    innateSpells: [{ spellId: 'invisibilidade', level: 1, abilities: INT_SAB_CAR, freeUses: 'longo' }],
    spellPicks: [
      escolha('tocado-pela-sombra-magia', 'Tocado pela Sombra', ['bardo', 'bruxo', 'clerigo', 'druida', 'feiticeiro', 'mago', 'paladino', 'patrulheiro'], 1, 1, {
        schools: ['Ilusão', 'Necromancia'],
      }),
    ],
  },
  {
    id: 'tocado-pelo-feerico',
    name: 'Tocado pelo Feérico',
    category: 'geral',
    desc: '+1 INT, SAB ou CAR. Aprenda Passo Nebuloso e uma magia de 1º círculo de Adivinhação ou Encantamento; conjure cada uma 1×/descanso longo sem gastar espaço.',
    abilityIncrease: ['int', 'sab', 'car'],
    innateSpells: [{ spellId: 'passo-nebuloso', level: 1, abilities: INT_SAB_CAR, freeUses: 'longo' }],
    spellPicks: [
      escolha('tocado-pelo-feerico-magia', 'Tocado pelo Feérico', ['bardo', 'bruxo', 'clerigo', 'druida', 'feiticeiro', 'mago', 'paladino', 'patrulheiro'], 1, 1, {
        schools: ['Adivinhação', 'Encantamento'],
      }),
    ],
  },

  // ---------- Talentos de Estilo de Luta (PHB 2024) ----------
  { id: 'estilo-arquearia', name: 'Arquearia', category: 'estilo', desc: 'Você ganha +2 nas jogadas de ataque feitas com armas à distância.' },
  { id: 'estilo-combate-cego', name: 'Combate Cego', category: 'estilo', desc: 'Você tem Percepção às Cegas de 3 m: enxerga qualquer criatura nesse raio que não esteja atrás de cobertura total, mesmo Invisível ou se você estiver Cego.' },
  { id: 'estilo-defesa', name: 'Defesa', category: 'estilo', desc: 'Enquanto estiver usando armadura, você ganha +1 na Classe de Armadura.' },
  { id: 'estilo-duelismo', name: 'Duelismo', category: 'estilo', desc: 'Quando estiver empunhando uma arma corpo a corpo em uma mão e nenhuma outra arma, você ganha +2 nas jogadas de dano com ela.' },
  { id: 'estilo-interceptacao', name: 'Interceptação', category: 'estilo', desc: 'Reação, quando uma criatura a até 1,5 m de você causar dano a outra criatura: reduza esse dano em 1d10 + seu bônus de proficiência. Você precisa estar empunhando uma arma ou escudo.' },
  { id: 'estilo-armas-grandes', name: 'Combate com Armas Grandes', category: 'estilo', desc: 'Ao rolar dano com uma arma corpo a corpo de duas mãos (ou Versátil usada com as duas mãos), trate resultados de 1 ou 2 nos dados de dano como 3.' },
  { id: 'estilo-protecao', name: 'Proteção', category: 'estilo', desc: 'Reação, quando uma criatura que você possa ver atacar um alvo a até 1,5 m de você: imponha Desvantagem na jogada de ataque. Você precisa estar empunhando um escudo.' },
  { id: 'estilo-armas-arremesso', name: 'Combate com Armas de Arremesso', category: 'estilo', desc: 'Ao acertar um ataque com uma arma de Arremesso, você ganha +2 na jogada de dano. Sacar a arma faz parte do ataque.' },
  { id: 'estilo-duas-armas', name: 'Combate com Duas Armas', category: 'estilo', desc: 'Ao fazer o ataque extra da propriedade Leve, você pode somar seu modificador de habilidade ao dano desse ataque.' },
  { id: 'estilo-desarmado', name: 'Combate Desarmado', category: 'estilo', desc: 'Seus ataques desarmados causam 1d6 + FOR de dano de concussão (1d8 se você não estiver empunhando nada). No início de cada turno, cause 1d4 de dano a uma criatura Agarrada por você.' },
  {
    id: 'estilo-combatente-abencoado',
    name: 'Combatente Abençoado',
    category: 'estilo',
    desc: 'Você aprende dois truques de Clérigo à sua escolha; Carisma é sua habilidade de conjuração para eles. Ao subir de nível, pode trocá-los por outros truques de Clérigo.',
    spellPicks: [
      escolha('estilo-combatente-abencoado-truques', 'Combatente Abençoado', ['clerigo'], 0, 2, {
        abilities: ['car'], freeUses: 'vontade',
        nota: 'Sempre que ganhar um nível, você pode trocar um destes truques por outro truque de Clérigo.',
      }),
    ],
  },
  {
    id: 'estilo-guerreiro-druidico',
    name: 'Guerreiro Druídico',
    category: 'estilo',
    desc: 'Você aprende dois truques de Druida à sua escolha; Sabedoria é sua habilidade de conjuração para eles. Ao subir de nível, pode trocá-los por outros truques de Druida.',
    spellPicks: [
      escolha('estilo-guerreiro-druidico-truques', 'Guerreiro Druídico', ['druida'], 0, 2, {
        abilities: ['sab'], freeUses: 'vontade',
        nota: 'Sempre que ganhar um nível, você pode trocar um destes truques por outro truque de Druida.',
      }),
    ],
  },
]

export const featById = (id: string) => FEATS.find((f) => f.id === id)
export const ORIGIN_FEATS = FEATS.filter((f) => f.category === 'origem')
export const GENERAL_FEATS = FEATS.filter((f) => f.category === 'geral')
export const FIGHTING_STYLES = FEATS.filter((f) => f.category === 'estilo')

export const FEAT_CATEGORY_NAMES: Record<Feat['category'], string> = {
  origem: 'Origem',
  geral: 'Geral',
  estilo: 'Estilo de Luta',
}
