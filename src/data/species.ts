import type { AbilityKey, InnateSpell, OptionGroup, Species, SpellPick } from '../types'

/**
 * No PHB 2024 as magias de linhagem usam a habilidade que o jogador escolher
 * entre Inteligência, Sabedoria e Carisma — a ficha aplica a de maior valor.
 */
const INT_SAB_CAR: AbilityKey[] = ['int', 'sab', 'car']

/** Atalho para declarar magias concedidas por espécie/linhagem. */
const magia = (
  spellId: string, level: number,
  freeUses: InnateSpell['freeUses'] = 'longo',
  abilities: AbilityKey[] = INT_SAB_CAR,
  nota?: string,
): InnateSpell => ({ spellId, level, abilities, freeUses, nota })

/** Atalho para declarar magias que a espécie deixa o jogador ESCOLHER. */
const escolha = (
  id: string, source: string, fromClasses: string[], spellLevel: number, count: number,
  level = 1, freeUses: SpellPick['freeUses'] = 'vontade', nota?: string,
): SpellPick => ({ id, source, level, count, fromClasses, spellLevel, abilities: INT_SAB_CAR, freeUses, nota })

/** Ancestrais dracônicos: cada cor define o dano do Sopro e a resistência. */
const ANCESTRAL_DRACONICO: OptionGroup = {
  id: 'ancestral-draconico',
  name: 'Ancestral Dracônico',
  desc: 'Escolha a cor do seu ancestral. Ela define o tipo de dano do seu Sopro Dracônico e a sua resistência.',
  options: [
    { id: 'negro', name: 'Dragão Negro', desc: 'Dano e resistência: Ácido. Sopro em linha.' },
    { id: 'cobre', name: 'Dragão de Cobre', desc: 'Dano e resistência: Ácido. Sopro em linha.' },
    { id: 'azul', name: 'Dragão Azul', desc: 'Dano e resistência: Elétrico. Sopro em linha.' },
    { id: 'bronze', name: 'Dragão de Bronze', desc: 'Dano e resistência: Elétrico. Sopro em linha.' },
    { id: 'latao', name: 'Dragão de Latão', desc: 'Dano e resistência: Fogo. Sopro em linha.' },
    { id: 'ouro', name: 'Dragão de Ouro', desc: 'Dano e resistência: Fogo. Sopro em cone.' },
    { id: 'vermelho', name: 'Dragão Vermelho', desc: 'Dano e resistência: Fogo. Sopro em cone.' },
    { id: 'verde', name: 'Dragão Verde', desc: 'Dano e resistência: Veneno. Sopro em cone.' },
    { id: 'prata', name: 'Dragão de Prata', desc: 'Dano e resistência: Frio. Sopro em cone.' },
    { id: 'branco', name: 'Dragão Branco', desc: 'Dano e resistência: Frio. Sopro em cone.' },
  ],
}

/** Dádivas de Gigante do Golias. */
const DADIVA_DE_GIGANTE: OptionGroup = {
  id: 'dadiva-de-gigante',
  name: 'Ancestral Gigante (Dádiva)',
  desc: 'Escolha a dádiva do seu ancestral gigante. Usos = bônus de proficiência por descanso longo.',
  options: [
    { id: 'nuvem', name: 'Dádiva da Nuvem', desc: 'Reação, quando você ou uma criatura a até 9 m for alvo de um ataque: troque de lugar com outra criatura disposta a até 9 m e o ataque passa a mirá-la.' },
    { id: 'fogo', name: 'Dádiva do Fogo', desc: 'Ao acertar um ataque com arma ou desarmado, cause 1d10 de dano de fogo extra.' },
    { id: 'gelo', name: 'Dádiva do Gelo', desc: 'Como ação Bônus, ganhe PV temporários iguais a 1d12 + seu bônus de proficiência.' },
    { id: 'colina', name: 'Dádiva da Colina', desc: 'Ao acertar um ataque, force uma criatura Grande ou menor a fazer SG de FOR (CD 8 + mod. CON + prof.) ou ficar Caída.' },
    { id: 'pedra', name: 'Dádiva da Pedra', desc: 'Reação, quando sofrer dano: reduza o dano em 1d12 + seu bônus de proficiência.' },
    { id: 'tempestade', name: 'Dádiva da Tempestade', desc: 'Reação, quando uma criatura a até 18 m te causar dano: cause 1d8 de dano de trovão nela.' },
  ],
}

const LINHAGEM_ELFICA: OptionGroup = {
  id: 'linhagem-elfica',
  name: 'Linhagem Élfica',
  desc: 'Escolha sua linhagem. Ela concede truques e magias conforme você sobe de nível.',
  options: [
    {
      id: 'drow',
      name: 'Drow',
      desc: 'Visão no escuro 36 m. Truque Luzes Dançantes. Nível 3: Fogo das Fadas. Nível 5: Escuridão (1×/descanso longo cada, ou gastando espaços).',
      innateSpells: [
        magia('luzes-dancantes', 1, 'vontade'),
        magia('fogo-das-fadas', 3),
        magia('escuridao', 5),
      ],
    },
    {
      id: 'alto-elfo',
      name: 'Alto Elfo',
      desc: 'Um truque de Mago à sua escolha (trocável em cada descanso longo). Nível 3: Detectar Magia. Nível 5: Passo Nebuloso.',
      innateSpells: [
        magia('detectar-magia', 3),
        magia('passo-nebuloso', 5),
      ],
      spellPicks: [
        escolha('alto-elfo-truque', 'Alto Elfo', ['mago'], 0, 1, 1, 'vontade',
          'Você pode trocar este truque por qualquer outro truque de Mago sempre que terminar um descanso longo.'),
      ],
    },
    {
      id: 'elfo-floresta',
      name: 'Elfo da Floresta',
      desc: 'Deslocamento 10,5 m. Truque Arte Druídica. Nível 3: Passos Largos. Nível 5: Passo Sem Rastro.',
      innateSpells: [
        magia('arte-druidica', 1, 'vontade'),
        magia('passos-largos', 3),
        magia('passo-sem-rastro', 5),
      ],
    },
  ],
}

const SENTIDOS_AGUCADOS: OptionGroup = {
  id: 'sentidos-agucados',
  name: 'Sentidos Aguçados',
  desc: 'Escolha uma perícia para ganhar proficiência.',
  options: [
    { id: 'intuicao', name: 'Intuição', desc: 'Proficiência em Intuição.', grantsSkill: 'intuicao' },
    { id: 'percepcao', name: 'Percepção', desc: 'Proficiência em Percepção.', grantsSkill: 'percepcao' },
    { id: 'sobrevivencia', name: 'Sobrevivência', desc: 'Proficiência em Sobrevivência.', grantsSkill: 'sobrevivencia' },
  ],
}

const LINHAGEM_GNOMICA: OptionGroup = {
  id: 'linhagem-gnomica',
  name: 'Linhagem Gnômica',
  desc: 'Escolha sua linhagem gnômica.',
  options: [
    {
      id: 'rochas',
      name: 'Gnomo das Rochas',
      desc: 'Você conhece os truques Reparar e Ilusão Menor. Pode gastar 10 minutos para criar um dispositivo mecânico Minúsculo (caixa de música, brinquedo ou acendedor).',
      innateSpells: [magia('reparar', 1, 'vontade'), magia('ilusao-menor', 1, 'vontade')],
    },
    {
      id: 'floresta',
      name: 'Gnomo da Floresta',
      desc: 'Você conhece o truque Ilusão Menor e pode conjurar Falar com Animais um número de vezes igual ao seu bônus de proficiência por descanso longo.',
      innateSpells: [magia('ilusao-menor', 1, 'vontade'), magia('falar-com-animais', 1, 'prof-longo')],
    },
  ],
}

const LEGADO_INFERNAL: OptionGroup = {
  id: 'legado-infernal',
  name: 'Legado Infernal',
  desc: 'Escolha seu legado. Ele define sua resistência e suas magias.',
  options: [
    {
      id: 'abissal',
      name: 'Abissal',
      desc: 'Resistência a dano Venenoso. Truque Rajada de Veneno. Nível 3: Raio do Enfraquecimento. Nível 5: Curar Ferimentos.',
      innateSpells: [
        magia('rajada-de-veneno', 1, 'vontade'),
        magia('raio-do-enfraquecimento', 3),
        magia('curar-ferimentos', 5),
      ],
    },
    {
      id: 'ctonico',
      name: 'Ctônico',
      desc: 'Resistência a dano Necrótico. Truque Toque Necrótico. Nível 3: Vitalidade Vazia. Nível 5: Raio Ardente.',
      innateSpells: [
        magia('toque-necrotico', 1, 'vontade'),
        magia('vitalidade-vazia', 3),
        magia('raio-ardente', 5),
      ],
    },
    {
      id: 'infernal',
      name: 'Infernal',
      desc: 'Resistência a dano Ígneo. Truque Raio de Fogo. Nível 3: Repreensão Diabólica. Nível 5: Escuridão.',
      innateSpells: [
        magia('raio-de-fogo', 1, 'vontade'),
        magia('repreensao-diabolica', 3),
        magia('escuridao', 5),
      ],
    },
  ],
}

const REVELACAO_CELESTIAL: OptionGroup = {
  id: 'revelacao-celestial',
  name: 'Revelação Celestial',
  level: 3,
  desc: 'A partir do nível 3, escolha a forma que você assume ao se transformar (ação Bônus, 1 minuto, 1×/descanso longo).',
  options: [
    { id: 'ceifador', name: 'Ceifador Necrótico', desc: 'Asas espectrais de sombra: criaturas a até 3 m de você (exceto você) ficam Amedrontadas até o fim do seu próximo turno. Dano extra necrótico igual ao bônus de proficiência, 1×/turno.' },
    { id: 'chamas', name: 'Chamas Interiores', desc: 'Uma aura flamejante: criaturas hostis que terminarem o turno a até 3 m sofrem dano radiante igual ao bônus de proficiência. Dano extra radiante 1×/turno.' },
    { id: 'asas', name: 'Asas Radiantes', desc: 'Ganhe deslocamento de voo igual ao seu deslocamento. Dano extra radiante igual ao bônus de proficiência, 1×/turno.' },
  ],
}

export const SPECIES: Species[] = [
  {
    id: 'aasimar',
    name: 'Aasimar',
    size: 'Médio ou Pequeno',
    speed: 9,
    darkvision: 18,
    traits: [
      { name: 'Portador Celestial', desc: 'Resistência a dano necrótico e radiante.' },
      { name: 'Mãos Curativas', desc: 'Como ação de Magia, cure uma criatura tocada em 1d4 × bônus de proficiência PV. Recupera em descanso longo.' },
      { name: 'Portador da Luz', desc: 'Você conhece o truque Luz. Carisma é sua habilidade de conjuração para ele.' },
      { name: 'Revelação Celestial', desc: 'A partir do nível 3, transforme-se (Bônus): Ceifador Necrótico, Chamas Interiores ou Asas Radiantes. Extra 1×/descanso longo: dano extra igual ao bônus de proficiência 1×/turno.' },
    ],
    innateSpells: [magia('luz', 1, 'vontade', ['car'])],
    choices: [REVELACAO_CELESTIAL],
  },
  {
    id: 'draconato',
    name: 'Draconato',
    size: 'Médio',
    speed: 9,
    darkvision: 18,
    traits: [
      { name: 'Ancestral Dracônico', desc: 'Escolha um tipo de dragão; define o dano do sopro e da resistência (Ácido, Elétrico, Fogo, Frio ou Veneno).' },
      { name: 'Sopro Dracônico', desc: 'Substitua um ataque por um sopro: cone de 4,5 m ou linha de 9 m, SG DES (CD 8 + mod. CON + prof.), 1d10 de dano (aumenta nos níveis 5/11/17). Usos = bônus de proficiência por descanso longo.' },
      { name: 'Resistência a Dano', desc: 'Resistência ao tipo de dano do seu ancestral.' },
      { name: 'Voo Dracônico', desc: 'No nível 5, como ação Bônus, ganhe voo (velocidade igual à de deslocamento) por 10 minutos, 1×/descanso longo.' },
    ],
    choices: [ANCESTRAL_DRACONICO],
  },
  {
    id: 'anao',
    name: 'Anão',
    size: 'Médio',
    speed: 9,
    darkvision: 36,
    traits: [
      { name: 'Resiliência Anã', desc: 'Resistência a dano de veneno; vantagem em salvaguardas contra a condição Envenenado.' },
      { name: 'Robustez Anã', desc: 'Seu máximo de PV aumenta em 1 por nível.' },
      { name: 'Conhecimento da Pedra', desc: 'Como ação Bônus, ganhe Sentido Sísmico de 18 m por 10 minutos enquanto estiver em pedra. Usos = bônus de proficiência por descanso longo.' },
    ],
  },
  {
    id: 'elfo',
    name: 'Elfo',
    size: 'Médio',
    speed: 9,
    darkvision: 18,
    traits: [
      { name: 'Ancestral Feérico', desc: 'Vantagem em salvaguardas contra a condição Enfeitiçado.' },
      { name: 'Sentidos Aguçados', desc: 'Proficiência em Intuição, Percepção ou Sobrevivência.' },
      { name: 'Transe', desc: 'Você não precisa dormir; 4 horas de transe equivalem a um descanso longo.' },
      { name: 'Linhagem Élfica', desc: 'Escolha: Drow (Luzes Dançantes; depois Fogo das Fadas e Escuridão, visão no escuro 36 m), Alto Elfo (um truque de Mago à sua escolha; depois Detectar Magia e Passo Nebuloso) ou Elfo da Floresta (Arte Druídica; depois Passos Largos e Passo Sem Rastro, deslocamento 10,5 m).' },
    ],
    choices: [LINHAGEM_ELFICA, SENTIDOS_AGUCADOS],
  },
  {
    id: 'gnomo',
    name: 'Gnomo',
    size: 'Pequeno',
    speed: 9,
    darkvision: 18,
    traits: [
      { name: 'Astúcia Gnômica', desc: 'Vantagem em salvaguardas de Inteligência, Sabedoria e Carisma.' },
      { name: 'Linhagem Gnômica', desc: 'Escolha: Gnomo das Rochas (truques Reparar e Ilusão Menor; dispositivos mecânicos) ou Gnomo da Floresta (truque Ilusão Menor; Falar com Animais utilizável bônus de proficiência ×/descanso longo).' },
    ],
    choices: [LINHAGEM_GNOMICA],
  },
  {
    id: 'golias',
    name: 'Golias',
    size: 'Médio',
    speed: 10.5,
    traits: [
      { name: 'Ancestral Gigante', desc: 'Escolha uma dádiva (usos = bônus de proficiência/descanso longo): Nuvem (teleporte 9 m), Fogo (1d10 fogo extra), Gelo (reduz deslocamento), Colina (derrubar Grande ou menor), Pedra (reação: reduz dano 1d12 + prof.) ou Tempestade (reação: 1d8 trovão no atacante).' },
      { name: 'Forma de Gigante', desc: 'No nível 5, como ação Bônus, fique Grande por 10 minutos: vantagem em testes de FOR e +3 m de deslocamento. 1×/descanso longo.' },
      { name: 'Feito de Pedra', desc: 'Vantagem em testes para terminar a condição Agarrado.' },
    ],
    choices: [DADIVA_DE_GIGANTE],
  },
  {
    id: 'halfling',
    name: 'Halfling',
    size: 'Pequeno',
    speed: 9,
    traits: [
      { name: 'Sortudo', desc: 'Quando rolar 1 no d20 de um Teste D20, role de novo (deve usar o novo resultado).' },
      { name: 'Bravura', desc: 'Vantagem em salvaguardas contra a condição Amedrontado.' },
      { name: 'Agilidade Halfling', desc: 'Você pode se mover através do espaço de criaturas maiores que você.' },
      { name: 'Naturalmente Furtivo', desc: 'Pode tentar se esconder mesmo quando obscurecido apenas por uma criatura maior.' },
    ],
  },
  {
    id: 'humano',
    name: 'Humano',
    size: 'Médio ou Pequeno',
    speed: 9,
    traits: [
      { name: 'Engenhoso', desc: 'Ganhe Inspiração Heroica ao terminar um descanso longo.' },
      { name: 'Habilidoso', desc: 'Ganhe proficiência em uma perícia à sua escolha.' },
      { name: 'Versátil', desc: 'Ganhe um talento de Origem à sua escolha (recomendado: Habilidoso).' },
    ],
    extraSkills: 1,
    extraOriginFeat: true,
  },
  {
    id: 'orc',
    name: 'Orc',
    size: 'Médio',
    speed: 9,
    darkvision: 36,
    traits: [
      { name: 'Investida Adrenalizada', desc: 'Quando usar a ação Correr, ganhe PV temporário igual ao bônus de proficiência.' },
      { name: 'Resistência Implacável', desc: 'Quando cair a 0 PV, caia para 1 PV em vez disso. 1×/descanso longo.' },
    ],
  },
  {
    id: 'tiefling',
    name: 'Tiefling (Tufão)',
    size: 'Médio ou Pequeno',
    speed: 9,
    darkvision: 18,
    traits: [
      { name: 'Legado Infernal', desc: 'Escolha: Abissal (resistência a Venenoso; Rajada de Veneno, depois Raio do Enfraquecimento e Curar Ferimentos), Ctônico (resistência a Necrótico; Toque Necrótico, depois Vitalidade Vazia e Raio Ardente) ou Infernal (resistência a Ígneo; Raio de Fogo, depois Repreensão Diabólica e Escuridão).' },
      { name: 'Presença Sobrenatural', desc: 'Você conhece o truque Taumaturgia.' },
    ],
    innateSpells: [magia('taumaturgia', 1, 'vontade')],
    choices: [LEGADO_INFERNAL],
  },
]

export const speciesById = (id: string) => SPECIES.find((s) => s.id === id)
