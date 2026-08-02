import type {
  AbilityKey, AlwaysPreparedSpell, ClassFeature, DndClass, EquipmentGrant, EquipmentOption,
  OptionGroup, Subclass,
} from '../types'
import { FIGHTING_STYLES } from './feats'

const mod = (v: number) => Math.floor((v - 10) / 2)

/**
 * Converte a tabela de magias sempre preparadas do livro ("Nível de Clérigo /
 * Magias Preparadas") na lista achatada usada pela ficha.
 */
const semprePreparadas = (tabela: Record<number, string[]>): AlwaysPreparedSpell[] =>
  Object.entries(tabela).flatMap(([level, ids]) => ids.map((spellId) => ({ level: Number(level), spellId })))

// ---------- Equipamento inicial (PHB 2024: pacote da classe ou só moedas) ----------
const eq = (label: string, items: EquipmentGrant[], gold: number, id = 'A'): EquipmentOption =>
  ({ id, label, items, gold })
const soOuro = (gold: number, id = 'B'): EquipmentOption =>
  ({ id, label: `${gold} PO (compre seu próprio equipamento)`, items: [], gold })

// ---------- Estilo de Luta ----------
/** Estilos disponíveis para todas as classes marciais. */
const ESTILOS_BASE = FIGHTING_STYLES.filter(
  (f) => f.id !== 'estilo-combatente-abencoado' && f.id !== 'estilo-guerreiro-druidico',
)

const estiloDeLuta = (level: number, extraIds: string[] = []): OptionGroup => ({
  id: 'estilo-de-luta',
  name: 'Estilo de Luta',
  level,
  desc: 'Escolha um talento de Estilo de Luta. Ele fica ativo permanentemente e aparece na sua ficha.',
  options: [...ESTILOS_BASE, ...FIGHTING_STYLES.filter((f) => extraIds.includes(f.id))].map((f) => ({
    id: f.id,
    name: f.name,
    desc: f.desc,
  })),
})

// Magias preparadas por nível (PHB 2024)
const PREP_FULL = [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22]
const PREP_WIZARD = [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 18, 18, 19, 21, 22, 24, 25]
const PREP_SORC = [2, 4, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22]
const PREP_WARLOCK = [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15]
const PREP_HALF = [2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15]

const CANTRIPS_2_3_4 = [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]
const CANTRIPS_3_4_5 = [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]
const CANTRIPS_4_5_6 = [4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6]

const asi = (level: number): ClassFeature => ({
  level,
  name: 'Incremento no Valor de Habilidade',
  desc: 'Ganhe o talento Incremento no Valor de Habilidade (+2 em uma habilidade ou +1 em duas) ou outro talento geral à sua escolha.',
})
const subclassFeat = (level: number, name = 'Subclasse'): ClassFeature => ({
  level,
  name: `Escolha de ${name}`,
  desc: 'Escolha sua subclasse, que concede características agora e em níveis posteriores.',
})
const epicBoon = (): ClassFeature => ({
  level: 19,
  name: 'Dádiva Épica',
  desc: 'Ganhe uma Dádiva Épica (talento épico) ou outro talento à sua escolha; uma habilidade pode chegar a 30.',
})

const sub = (
  id: string, name: string, desc: string, f: [number, string, string][],
  extra: Omit<Subclass, 'id' | 'name' | 'desc' | 'features'> = {},
): Subclass => ({
  id,
  name,
  desc,
  features: f.map(([level, n, d]) => ({ level, name: n, desc: d })),
  ...extra,
})

// ---------- Conjuração de 1/3 (Cavaleiro Místico e Trapaceiro Arcano) ----------
const PREP_TERCO = [0, 0, 3, 4, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 11, 11, 12, 13]
/**
 * Truques à escolha: 2 no nível 3, 3 no nível 10. O Trapaceiro Arcano usa a
 * mesma contagem porque o terceiro truque dele (Mãos Mágicas) é fixo e entra
 * como magia sempre preparada.
 */
const CANTRIPS_TERCO = [0, 0, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3]

export const CLASSES: DndClass[] = [
  // ================= BÁRBARO =================
  {
    id: 'barbaro',
    name: 'Bárbaro',
    hitDie: 12,
    primary: 'Força',
    saves: ['for', 'con'],
    armor: ['Leve', 'Média', 'Escudos'],
    weapons: ['Simples', 'Marciais'],
    skillChoices: ['lidar-animais', 'atletismo', 'intimidacao', 'natureza', 'percepcao', 'sobrevivencia'],
    skillCount: 2,
    caster: 'nenhum',
    startingEquipment: 'Machado grande, 4 machadinhas, pacote de explorador e 15 PO',
    equipmentOptions: [
      eq('Machado grande, 4 machadinhas, pacote de explorador e 15 PO', [
        { itemId: 'machado-grande' }, { itemId: 'machadinha', qty: 4 }, { itemId: 'pacote-explorador' },
      ], 15),
      soOuro(75),
    ],
    features: [
      { level: 1, name: 'Fúria', desc: 'Como ação Bônus, entre em Fúria (10 min): vantagem em testes e salvaguardas de FOR, bônus de dano com FOR (+2), resistência a dano Cortante, Perfurante e de Concussão. Não funciona com armadura pesada.' },
      { level: 1, name: 'Defesa sem Armadura', desc: 'Sem armadura, sua CA = 10 + mod. DES + mod. CON (pode usar escudo).' },
      { level: 1, name: 'Maestria em Armas', desc: 'Use as propriedades de maestria de 2 tipos de armas à sua escolha.' },
      { level: 2, name: 'Ataque Descuidado', desc: 'Ao atacar, ganhe vantagem nos ataques com FOR neste turno, mas ataques contra você têm vantagem até seu próximo turno.' },
      { level: 2, name: 'Sentido de Perigo', desc: 'Vantagem em salvaguardas de DES contra efeitos que você possa ver.' },
      subclassFeat(3, 'Caminho Primal'),
      { level: 3, name: 'Conhecimento Primal', desc: 'Proficiência em mais uma perícia de Bárbaro; durante a Fúria, alguns testes de perícia podem usar FOR.' },
      asi(4),
      { level: 5, name: 'Ataque Extra', desc: 'Você pode atacar duas vezes ao usar a ação Atacar.' },
      { level: 5, name: 'Movimento Rápido', desc: '+3 m de deslocamento sem armadura pesada.' },
      { level: 6, name: 'Característica de Subclasse', desc: 'Você ganha uma característica do seu Caminho Primal.' },
      { level: 7, name: 'Instinto Selvagem', desc: 'Vantagem em Iniciativa; se estiver surpreso, pode agir normalmente se entrar em Fúria.' },
      { level: 7, name: 'Golpe Instintivo', desc: 'Como parte da ação Bônus para entrar em Fúria, mova-se até metade do seu deslocamento.' },
      asi(8),
      { level: 9, name: 'Crítico Brutal (1 dado)', desc: 'Role um dado de dano de arma adicional em acertos críticos.' },
      { level: 10, name: 'Característica de Subclasse', desc: 'Você ganha uma característica do seu Caminho Primal.' },
      { level: 11, name: 'Fúria Implacável', desc: 'Se cair a 0 PV em Fúria, faça SG CON CD 10 para ficar com 1 PV (CD +5 por uso).' },
      asi(12),
      { level: 13, name: 'Crítico Brutal (2 dados)', desc: 'Role dois dados de dano adicionais em acertos críticos.' },
      { level: 14, name: 'Característica de Subclasse', desc: 'Você ganha uma característica do seu Caminho Primal.' },
      { level: 15, name: 'Fúria Persistente', desc: 'Sua Fúria só termina se você ficar Inconsciente ou decidir terminá-la; recupere todos os usos ao rolar Iniciativa (1×/descanso longo).' },
      asi(16),
      { level: 17, name: 'Crítico Brutal (3 dados)', desc: 'Role três dados de dano adicionais em acertos críticos.' },
      { level: 18, name: 'Força Indomável', desc: 'Se o total de um teste de FOR ou salvaguarda de FOR for menor que seu valor de FOR, use o valor de FOR.' },
      epicBoon(),
      { level: 20, name: 'Campeão Primal', desc: 'FOR e CON aumentam em +4 (máximo 25).' },
    ],
    masteryCount: (lv) => (lv >= 10 ? 4 : lv >= 4 ? 3 : 2),
    resources: [
      { id: 'furia', name: 'Fúria', fromLevel: 1, recharge: 'longo', max: (lv) => (lv >= 17 ? 6 : lv >= 12 ? 5 : lv >= 6 ? 4 : lv >= 3 ? 3 : 2) },
    ],
    subclasses: [
      sub('berserker', 'Caminho do Furioso (Berserker)', 'Canalize a fúria em violência desenfreada.', [
        [3, 'Frenesi', 'Durante a Fúria, seu Ataque Descuidado causa dano extra igual a dados d6 = bônus de dano da Fúria.'],
        [6, 'Fúria Inconsequente', 'Imune a Enfeitiçado e Amedrontado durante a Fúria.'],
        [10, 'Represália', 'Reação: ataque corpo a corpo contra quem te causar dano a até 1,5 m.'],
        [14, 'Presença Intimidante', 'Como ação Bônus, amedronte inimigos próximos (SG SAB).'],
      ]),
      sub('coracao-selvagem', 'Caminho do Coração Selvagem', 'Laço místico com os espíritos animais.', [
        [3, 'Fúria dos Selvagens', 'Ao entrar em Fúria, escolha: Urso (resistência a todo dano, exceto Energético, Necrótico, Psíquico e Radiante), Águia (Desengajar/Correr como Bônus) ou Lobo (aliados têm vantagem contra inimigos adjacentes a você).'],
        [6, 'Aspecto dos Selvagens', 'Ganhe benefícios utilitários de animal (coruja, pantera ou salmão).'],
        [10, 'Andarilho Natural', 'Conjure Comunhão com a Natureza como ritual.'],
        [14, 'Poder dos Selvagens', 'Melhoria de Falcão, Leão ou Urso durante a Fúria.'],
      ]),
      sub('arvore-do-mundo', 'Caminho da Árvore do Mundo', 'Poder vital de Yggdrasil, a Árvore do Mundo.', [
        [3, 'Vitalidade da Árvore', 'Ao entrar em Fúria e a cada turno em Fúria, ganhe PV temporário.'],
        [6, 'Ramos da Árvore', 'Puxe criaturas a até 9 m para perto de você (SG FOR).'],
        [10, 'Escudo de Batalha', 'Reação: transfira ataques de aliados próximos para você.'],
        [14, 'Viagem pelos Galhos', 'Teleporte-se a até 18 m como parte do movimento durante a Fúria.'],
      ]),
      sub('zelote', 'Caminho do Zelote', 'Fúria abastecida por poder divino.', [
        [3, 'Fúria Divina', 'Dano extra necrótico ou radiante (1d6 + metade do nível) no primeiro acerto de cada turno em Fúria.'],
        [3, 'Guerreiro dos Deuses', 'Magias que te ressuscitam não gastam componentes materiais.'],
        [6, 'Foco Fanático', 'Rerrole uma salvaguarda falha por Fúria.'],
        [10, 'Presença Zelosa', 'Bônus: até 10 criaturas ganham vantagem em ataques e salvaguardas.'],
        [14, 'Fúria Além da Morte', 'Em Fúria, você não cai inconsciente a 0 PV.'],
      ]),
    ],
  },

  // ================= BARDO =================
  {
    id: 'bardo',
    name: 'Bardo',
    hitDie: 8,
    primary: 'Carisma',
    saves: ['des', 'car'],
    armor: ['Leve'],
    weapons: ['Simples'],
    skillChoices: ['acrobacia', 'arcanismo', 'atletismo', 'atuacao', 'enganacao', 'furtividade', 'historia', 'intimidacao', 'intuicao', 'investigacao', 'lidar-animais', 'medicina', 'natureza', 'percepcao', 'persuasao', 'prestidigitacao', 'religiao', 'sobrevivencia'],
    skillCount: 3,
    caster: 'completo',
    spellAbility: 'car',
    preparedByLevel: PREP_FULL,
    preparation: 'nivel-uma',
    cantripsByLevel: CANTRIPS_2_3_4,
    startingEquipment: 'Armadura de couro, 2 adagas, instrumento musical, pacote de artista e 19 PO',
    equipmentOptions: [
      eq('Armadura de couro, 2 adagas, instrumento musical, pacote de artista e 19 PO', [
        { itemId: 'couro' }, { itemId: 'adaga', qty: 2 }, { itemId: 'instrumento-musical' }, { itemId: 'pacote-artista' },
      ], 19),
      soOuro(90),
    ],
    features: [
      { level: 1, name: 'Inspiração de Bardo', desc: 'Bônus: dê um d6 de Inspiração a uma criatura a até 18 m; ela pode somar a um Teste D20 falho. Dado aumenta: d8 (5º), d10 (10º), d12 (15º).' },
      { level: 1, name: 'Conjuração', desc: 'Você conjura magias de Bardo usando Carisma.' },
      { level: 2, name: 'Perícia Aprimorada', desc: 'Escolha 2 perícias com proficiência: dobre o bônus de proficiência (mais 2 no nível 9).' },
      { level: 2, name: 'Pau para Toda Obra', desc: 'Some metade do bônus de proficiência a testes de habilidade sem proficiência.' },
      subclassFeat(3, 'Colégio de Bardo'),
      asi(4),
      { level: 5, name: 'Fonte de Inspiração', desc: 'Recupere todos os usos de Inspiração de Bardo em descanso curto ou longo; pode gastar espaço de magia para recuperar um uso.' },
      { level: 6, name: 'Característica de Subclasse', desc: 'Você ganha uma característica do seu Colégio.' },
      { level: 7, name: 'Contramúsica', desc: 'Reação, quando você ou uma criatura a até 9 m falhar numa salvaguarda contra um efeito que aplique Enfeitiçado ou Amedrontado: a salvaguarda é rerrolada, com vantagem.' },
      asi(8),
      { level: 9, name: 'Perícia Aprimorada (2)', desc: 'Mais duas perícias com bônus de proficiência dobrado.' },
      { level: 10, name: 'Segredos Mágicos', desc: 'Suas magias preparadas podem vir também das listas de Clérigo, Druida e Mago.' },
      asi(12),
      { level: 14, name: 'Característica de Subclasse', desc: 'Você ganha uma característica do seu Colégio.' },
      asi(16),
      { level: 18, name: 'Inspiração Superior', desc: 'Ao rolar Iniciativa, recupere usos de Inspiração se tiver menos de 2.' },
      epicBoon(),
      { level: 20, name: 'Palavras de Criação', desc: 'Sempre tenha Palavra de Poder: Curar e Palavra de Poder: Matar preparadas; podem afetar um segundo alvo próximo.' },
    ],
    resources: [
      { id: 'inspiracao-bardica', name: 'Inspiração de Bardo', fromLevel: 1, recharge: 'longo', max: (_lv, m) => Math.max(1, mod(m.car)) },
    ],
    subclasses: [
      sub('danca', 'Colégio da Dança', 'Graça e movimento como expressão mágica.', [
        [3, 'Ritmo Ágil', 'Sem armadura/escudo: CA = 10 + DES + CAR; +3 m de deslocamento.'],
        [3, 'Passos Inspirados', 'Quem usa sua Inspiração pode se mover e ganhar CA extra.'],
        [6, 'Batida Alinhada', 'Use DES para ataques desarmados; dado de Inspiração como dano.'],
        [14, 'Presença de Palco', 'Ao rolar Iniciativa, recupere um uso de Inspiração; imunidade a quedas curtas.'],
      ]),
      sub('encanto', 'Colégio do Encanto (Glamour)', 'Majestade feérica que fascina e protege.', [
        [3, 'Manto de Inspiração', 'Bônus: gaste um uso de Inspiração para dar PV temporário e movimento livre a aliados.'],
        [3, 'Atuação Hipnotizante', 'Encante plateias com sua atuação (SG SAB).'],
        [6, 'Manto de Majestade', 'Bônus: conjure Comando sem gastar espaço, 1×/turno.'],
        [14, 'Majestade Sobrenatural', 'Presença régia: imponha desvantagem em ataques contra você (SG CAR).'],
      ]),
      sub('conhecimento', 'Colégio do Conhecimento', 'Saber é poder; palavras cortam mais que espadas.', [
        [3, 'Proficiências Adicionais', 'Proficiência em 3 perícias à sua escolha.'],
        [3, 'Palavras Cortantes', 'Reação: gaste Inspiração para subtrair o dado do ataque, teste ou dano de um inimigo.'],
        [6, 'Segredos Mágicos', 'Escolha duas magias das listas de Bardo, Clérigo, Druida ou Mago (truque ou magia de um círculo para o qual você tenha espaços). Elas ficam sempre preparadas e contam como magias de Bardo; ao subir de nível você pode trocar uma delas.'],
        [14, 'Perícia Incomparável', 'Se falhar num teste de habilidade, gaste Inspiração para somar o dado.'],
      ], {
        spellPicks: [{
          id: 'conhecimento-segredos-magicos',
          source: 'Colégio do Conhecimento — Segredos Mágicos',
          level: 6,
          count: 2,
          fromClasses: ['bardo', 'clerigo', 'druida', 'mago'],
          spellLevel: 0,
          upToMaxSlot: true,
          alwaysPrepared: true,
          abilities: ['car'],
          nota: 'Contam como magias de Bardo e ficam sempre preparadas, sem ocupar vaga na sua lista.',
        }],
      }),
      sub('bravura', 'Colégio da Bravura (Valor)', 'Bardos guerreiros que inspiram em batalha.', [
        [3, 'Inspiração em Combate', 'Aliados podem usar sua Inspiração para dano extra ou CA (reação).'],
        [3, 'Treinamento Marcial', 'Proficiência com armas marciais, armadura média e escudos.'],
        [6, 'Ataque Extra', 'Ataque duas vezes com a ação Atacar; pode trocar um ataque por um truque.'],
        [14, 'Magia de Batalha', 'Após conjurar magia com ação, faça um ataque com arma como Bônus.'],
      ], { armor: ['Média', 'Escudos'], weapons: ['Marciais'] }),
    ],
  },

  // ================= CLÉRIGO =================
  {
    id: 'clerigo',
    name: 'Clérigo',
    hitDie: 8,
    primary: 'Sabedoria',
    saves: ['sab', 'car'],
    armor: ['Leve', 'Média', 'Escudos'],
    weapons: ['Simples'],
    skillChoices: ['historia', 'intuicao', 'medicina', 'persuasao', 'religiao'],
    skillCount: 2,
    caster: 'completo',
    spellAbility: 'sab',
    preparedByLevel: PREP_FULL,
    preparation: 'descanso-todas',
    cantripsByLevel: CANTRIPS_3_4_5,
    startingEquipment: 'Cota de malha (camisão), escudo, maça, símbolo sagrado, pacote de sacerdote e 7 PO',
    equipmentOptions: [
      eq('Camisão de malha, escudo, maça, símbolo sagrado, pacote de sacerdote e 7 PO', [
        { itemId: 'camisao-de-malha' }, { itemId: 'escudo' }, { itemId: 'maca' },
        { itemId: 'simbolo-sagrado' }, { itemId: 'pacote-sacerdote' },
      ], 7),
      soOuro(110),
    ],
    choices: [
      {
        id: 'ordem-divina',
        name: 'Ordem Divina',
        level: 1,
        desc: 'Escolha o papel que você cumpre no serviço divino.',
        options: [
          {
            id: 'protetor',
            name: 'Protetor',
            desc: 'Treinado para a batalha, você adquire proficiência com armas Marciais e treinamento com Armadura Pesada.',
            armor: ['Pesada'],
            weapons: ['Marciais'],
          },
          { id: 'taumaturgo', name: 'Taumaturgo', desc: 'Você conhece mais um truque de Clérigo e soma seu modificador de Sabedoria (mín. +1) aos testes de Arcanismo e Religião.' },
        ],
      },
      {
        id: 'golpes-abencoados',
        name: 'Golpes Abençoados',
        level: 7,
        desc: 'Escolha como a energia divina reforça seus ataques (permanente).',
        options: [
          { id: 'conjurador-divino', name: 'Conjurador Divino', desc: 'Seus truques de Clérigo que causam dano rolam um dado de dano adicional (dois no nível 14).' },
          { id: 'golpes-potentes', name: 'Golpes Potentes', desc: '1×/turno, ao acertar um ataque com arma, cause +1d8 de dano radiante (2d8 no nível 14).' },
        ],
      },
    ],
    features: [
      { level: 1, name: 'Conjuração', desc: 'Você conjura magias de Clérigo usando Sabedoria.' },
      { level: 1, name: 'Ordem Divina', desc: 'Escolha: Protetor (armas marciais e armadura pesada) ou Taumaturgo (+1 truque e bônus em Arcanismo/Religião).' },
      { level: 2, name: 'Canalizar Divindade', desc: 'Use energia divina: Faísca Divina (criatura a até 9 m: role 1d8 + mod. SAB e cure essa quantidade, ou cause dano radiante ou necrótico — SG CON para metade; +1d8 nos níveis 7, 13 e 18) ou Expulsar Mortos-Vivos. Recupere 1 uso em descanso curto.' },
      subclassFeat(3, 'Domínio Divino'),
      asi(4),
      { level: 5, name: 'Golpear Mortos-Vivos', desc: 'Ao usar Expulsar Mortos-Vivos, role um número de d8 igual ao seu modificador de Sabedoria (mín. 1d8): mortos-vivos que falharem na salvaguarda sofrem dano radiante igual ao total.' },
      { level: 6, name: 'Característica de Subclasse', desc: 'Você ganha uma característica do seu Domínio.' },
      { level: 7, name: 'Golpes Abençoados', desc: 'Escolha: Conjurador Divino (dado extra em truques) ou Golpes Potentes (+1d8 radiante em ataques com arma).' },
      asi(8),
      { level: 10, name: 'Intervenção Divina', desc: 'Como ação de Magia, conjure qualquer magia de Clérigo de 5º nível ou menor sem gastar espaço, 1×/descanso longo.' },
      asi(12),
      { level: 14, name: 'Golpes Abençoados Aprimorados', desc: 'O benefício escolhido em Golpes Abençoados melhora (2d8).' },
      asi(16),
      { level: 17, name: 'Característica de Subclasse', desc: 'Você ganha uma característica do seu Domínio.' },
      epicBoon(),
      { level: 20, name: 'Intervenção Divina Maior', desc: 'Sua Intervenção Divina pode conjurar Desejo (recarrega em 2d4 descansos longos).' },
    ],
    resources: [
      { id: 'canalizar-divindade', name: 'Canalizar Divindade', fromLevel: 2, recharge: 'longo', shortRestUses: 1, max: (lv) => (lv >= 18 ? 4 : lv >= 6 ? 3 : 2) },
      { id: 'intervencao-divina', name: 'Intervenção Divina', fromLevel: 10, recharge: 'longo', max: () => 1 },
    ],
    subclasses: [
      sub('vida', 'Domínio da Vida', 'A energia positiva que sustenta toda a vida.', [
        [3, 'Magias de Domínio da Vida', 'Auxílio, Bênção, Curar Ferimentos e Restauração Menor ficam sempre preparadas; mais magias nos níveis 5, 7 e 9.'],
        [3, 'Discípulo da Vida', 'Magias de cura restauram PV adicional (2 + nível do espaço).'],
        [3, 'Preservar a Vida', 'Canalizar Divindade: distribua cura = 5 × nível de Clérigo entre criaturas feridas.'],
        [6, 'Curandeiro Abençoado', 'Curar outros também cura você.'],
        [17, 'Cura Suprema', 'Magias de cura usam o valor máximo dos dados.'],
      ], {
        alwaysPrepared: semprePreparadas({
          3: ['auxilio', 'bencao', 'curar-ferimentos', 'restauracao-menor'],
          5: ['palavra-curativa-em-massa', 'revivificar'],
          7: ['aura-de-vida', 'protecao-contra-a-morte'],
          9: ['curar-ferimentos-em-massa', 'restauracao-maior'],
        }),
      }),
      sub('luz', 'Domínio da Luz', 'Chamas purificadoras e luz reveladora.', [
        [3, 'Magias de Domínio da Luz', 'Fogo das Fadas, Mãos Flamejantes, Raio Ardente e Ver o Invisível ficam sempre preparadas; mais magias nos níveis 5, 7 e 9.'],
        [3, 'Chama Protetora', 'Reação: imponha desvantagem num ataque contra você (usos = SAB mod.).'],
        [3, 'Explosão de Radiância', 'Canalizar Divindade: dano radiante em área ao seu redor (SG CON).'],
        [6, 'Clarão Aprimorado', 'Chama Protetora pode proteger aliados próximos.'],
        [17, 'Coroa de Luz', 'Emita luz solar; inimigos na luz têm desvantagem contra suas magias de fogo/radiante.'],
      ], {
        alwaysPrepared: semprePreparadas({
          3: ['fogo-das-fadas', 'maos-flamejantes', 'raio-ardente', 'ver-o-invisivel'],
          5: ['bola-de-fogo', 'luz-do-dia'],
          7: ['muralha-de-fogo', 'olho-arcano'],
          9: ['coluna-de-chamas', 'videncia'],
        }),
      }),
      sub('trapaca', 'Domínio da Trapaça', 'Ilusão, sombras e travessuras divinas.', [
        [3, 'Magias de Domínio da Trapaça', 'Disfarçar-se, Enfeitiçar Pessoa, Invisibilidade e Passo Sem Rastro ficam sempre preparadas; mais magias nos níveis 5, 7 e 9.'],
        [3, 'Bênção do Trapaceiro', 'Dê vantagem em Furtividade a uma criatura (você incluso).'],
        [3, 'Invocar Duplicata', 'Canalizar Divindade: crie uma ilusão sua que conjura magias junto.'],
        [6, 'Passos da Trapaça', 'Bônus: teleporte-se trocando de lugar com sua duplicata.'],
        [17, 'Ladrão Aprimorado', 'Duplicatas extras e magias pela duplicata com vantagem.'],
      ], {
        alwaysPrepared: semprePreparadas({
          3: ['disfarcar-se', 'enfeiticar-pessoa', 'invisibilidade', 'passo-sem-rastro'],
          5: ['indetectavel', 'padrao-hipnotico'],
          7: ['confusao', 'porta-dimensional'],
          9: ['dominar-pessoa', 'modificar-memoria'],
        }),
      }),
      sub('guerra', 'Domínio da Guerra', 'Coragem e destreza em batalha como devoção.', [
        [3, 'Magias de Domínio da Guerra', 'Arma Espiritual, Arma Mágica, Escudo da Fé e Raio Guia ficam sempre preparadas; mais magias nos níveis 5, 7 e 9.'],
        [3, 'Sacerdote de Guerra', 'Bônus: faça um ataque com arma (usos = SAB mod./descanso longo).'],
        [3, 'Ataque Direcionado', 'Canalizar Divindade: +10 num ataque (seu ou de aliado a até 9 m).'],
        [6, 'Bênção do Deus da Guerra', 'Ataque Direcionado como reação para aliados.'],
        [17, 'Avatar da Batalha', 'Resistência a dano Cortante, Perfurante e de Concussão.'],
      ], {
        alwaysPrepared: semprePreparadas({
          3: ['arma-espiritual', 'arma-magica', 'escudo-da-fe', 'raio-guia'],
          5: ['guardioes-espirituais', 'manto-do-cruzado'],
          7: ['escudo-ardente', 'movimentacao-livre'],
          9: ['golpe-de-arco', 'paralisar-monstro'],
        }),
      }),
    ],
  },

  // ================= DRUIDA =================
  {
    id: 'druida',
    name: 'Druida',
    hitDie: 8,
    primary: 'Sabedoria',
    saves: ['int', 'sab'],
    armor: ['Leve', 'Escudos'],
    weapons: ['Simples'],
    skillChoices: ['arcanismo', 'lidar-animais', 'intuicao', 'medicina', 'natureza', 'percepcao', 'religiao', 'sobrevivencia'],
    skillCount: 2,
    caster: 'completo',
    spellAbility: 'sab',
    preparedByLevel: PREP_FULL,
    preparation: 'descanso-todas',
    cantripsByLevel: CANTRIPS_2_3_4,
    startingEquipment: 'Armadura de couro, escudo, foice, foco druídico, pacote de explorador e 9 PO',
    equipmentOptions: [
      eq('Armadura de couro, escudo, foice curta, foco druídico, pacote de explorador e 9 PO', [
        { itemId: 'couro' }, { itemId: 'escudo' }, { itemId: 'foice-curta' },
        { itemId: 'foco-druidico' }, { itemId: 'pacote-explorador' },
      ], 9),
      soOuro(50),
    ],
    choices: [
      {
        id: 'ordem-primal',
        name: 'Ordem Primal',
        level: 1,
        desc: 'Escolha a sua vocação druídica.',
        options: [
          {
            id: 'guardiao',
            name: 'Protetor',
            desc: 'Treinado para a batalha, você adquire proficiência com armas Marciais e treinamento com Armadura Média.',
            armor: ['Média'],
            weapons: ['Marciais'],
          },
          { id: 'mago-primal', name: 'Xamã', desc: 'Você conhece mais um truque de Druida e soma seu modificador de Sabedoria (mín. +1) aos testes de Arcanismo e Natureza.' },
        ],
      },
    ],
    features: [
      { level: 1, name: 'Conjuração', desc: 'Você conjura magias de Druida usando Sabedoria.' },
      { level: 1, name: 'Druidismo', desc: 'Você conhece o truque Druidismo e a língua Druídica.' },
      { level: 1, name: 'Ordem Primal', desc: 'Escolha: Protetor (armas marciais e armadura média) ou Xamã (+1 truque e bônus em Arcanismo/Natureza).' },
      { level: 2, name: 'Forma Selvagem', desc: 'Bônus: transforme-se em uma Besta (ND limitado pelo nível). Ganha PV temporário. Recupere 1 uso em descanso curto.' },
      { level: 2, name: 'Companheiro Selvagem', desc: 'Gaste um uso de Forma Selvagem para conjurar Encontrar Familiar (fada).' },
      subclassFeat(3, 'Círculo Druídico'),
      asi(4),
      { level: 5, name: 'Forma Selvagem Rejuvenescida', desc: 'Recupere um uso de Forma Selvagem gastando um espaço de magia; 1×/descanso longo, faça o inverso: gaste um uso de Forma Selvagem (Bônus) para recuperar um espaço de 1º círculo.' },
      { level: 6, name: 'Característica de Subclasse', desc: 'Você ganha uma característica do seu Círculo.' },
      { level: 7, name: 'Fúria dos Elementos', desc: 'Escolha (permanente): Conjuração Potente (some seu mod. de SAB ao dano dos truques de Druida) ou Golpe Primal (1×/turno, +1d8 de dano de frio, elétrico, fogo ou trovão em um ataque na Forma Selvagem ou com arma).' },
      asi(8),
      { level: 10, name: 'Característica de Subclasse', desc: 'Você ganha uma característica do seu Círculo.' },
      asi(12),
      { level: 14, name: 'Característica de Subclasse', desc: 'Você ganha uma característica do seu Círculo.' },
      { level: 15, name: 'Fúria dos Elementos Aprimorada', desc: 'O benefício escolhido em Fúria dos Elementos melhora: Golpe Primal passa a +2d8; Conjuração Potente aumenta em 90 m o alcance dos truques de Druida com alcance de 3 m ou mais.' },
      asi(16),
      { level: 18, name: 'Magias da Besta', desc: 'Na Forma Selvagem, você pode conjurar magias, exceto as que exijam componente material com custo ou que seja consumido.' },
      epicBoon(),
      { level: 20, name: 'Arquidruida', desc: 'Recupere Forma Selvagem ao rolar Iniciativa; converta usos em espaços de magia.' },
    ],
    resources: [
      { id: 'forma-selvagem', name: 'Forma Selvagem', fromLevel: 2, recharge: 'longo', shortRestUses: 1, max: (lv) => (lv >= 17 ? 4 : lv >= 6 ? 3 : 2) },
    ],
    subclasses: [
      sub('terra', 'Círculo da Terra', 'Magia da terra: florestas, desertos, montanhas.', [
        [3, 'Magias de Círculo Druídico', 'Sempre que completar um Descanso Longo, escolha um terreno (Árido, Polar, Temperado ou Tropical): as magias daquele terreno até o seu nível ficam sempre preparadas.'],
        [3, 'Auxílio da Terra', 'Canalize a natureza: cure aliados e cause dano a um inimigo em área.'],
        [6, 'Recuperação Natural', 'Recupere espaços de magia num descanso curto (1×/descanso longo).'],
        [10, 'Proteção Natural', 'Imune a Envenenado e resistência a um tipo de dano ligado ao seu terreno.'],
        [14, 'Santuário Natural', 'Bestas e plantas hesitam em te atacar (SG SAB).'],
      ], {
        choices: [{
          id: 'terreno-druidico',
          name: 'Terreno do Círculo da Terra',
          level: 3,
          desc: 'Escolha o terreno das suas Magias de Círculo Druídico. Você pode trocá-lo sempre que completar um Descanso Longo.',
          options: [
            {
              id: 'arido', name: 'Árido', desc: 'Mãos Flamejantes, Raio de Fogo e Turvar (3º); Bola de Fogo (5º); Malogro (7º); Muralha de Pedra (9º). Resistência a dano Ígneo no nível 10.',
              alwaysPrepared: semprePreparadas({
                3: ['maos-flamejantes', 'raio-de-fogo', 'turvar'],
                5: ['bola-de-fogo'],
                7: ['malogro'],
                9: ['muralha-de-pedra'],
              }),
            },
            {
              id: 'polar', name: 'Polar', desc: 'Névoa Obscurecente, Paralisar Pessoa e Raio de Gelo (3º); Nevasca (5º); Tempestade Glacial (7º); Cone de Frio (9º). Resistência a dano Gélido no nível 10.',
              alwaysPrepared: semprePreparadas({
                3: ['nevoa-obscurecente', 'paralisar-pessoa', 'raio-de-gelo'],
                5: ['nevasca'],
                7: ['tempestade-glacial'],
                9: ['cone-de-frio'],
              }),
            },
            {
              id: 'temperado', name: 'Temperado', desc: 'Passo Nebuloso, Sono e Toque Chocante (3º); Relâmpago (5º); Movimentação Livre (7º); Passo Arbóreo (9º). Resistência a dano Elétrico no nível 10.',
              alwaysPrepared: semprePreparadas({
                3: ['passo-nebuloso', 'sono', 'toque-chocante'],
                5: ['relampago'],
                7: ['movimentacao-livre'],
                9: ['passo-arboreo'],
              }),
            },
            {
              id: 'tropical', name: 'Tropical', desc: 'Bolha Ácida, Raio Nauseante e Teia (3º); Nuvem Fétida (5º); Polimorfia (7º); Praga de Insetos (9º). Resistência a dano Venenoso no nível 10.',
              alwaysPrepared: semprePreparadas({
                3: ['bolha-acida', 'raio-nauseante', 'teia'],
                5: ['nuvem-fetida'],
                7: ['polimorfia'],
                9: ['praga-de-insetos'],
              }),
            },
          ],
        }],
      }),
      sub('lua', 'Círculo da Lua', 'Metamorfos que dominam formas selvagens de combate.', [
        [3, 'Formas do Círculo', 'Formas Selvagens mais fortes: ND até 1/3 do nível, CA 13 + SAB, PV temporário maior.'],
        [3, 'Magias do Círculo da Lua', 'Curar Ferimentos, Fagulha Estelar e Raio Lunar sempre preparadas (mais nos níveis 5, 7 e 9); podem ser conjuradas em Forma Selvagem.'],
        [6, 'Golpes Aprimorados do Círculo', 'Ataques na Forma Selvagem contam como mágicos; +1d10 radiante 1×/turno.'],
        [10, 'Forma Lunar Aprimorada', 'Conjure Raio Lunar sem espaço 1×/dia; mova o luar de graça.'],
        [14, 'Forma Lunar Suprema', 'Alterar-se à vontade; resistência enquanto o Raio Lunar estiver ativo.'],
      ], {
        alwaysPrepared: semprePreparadas({
          3: ['curar-ferimentos', 'fagulha-estelar', 'raio-lunar'],
          5: ['invocar-animais'],
          7: ['fonte-do-luar'],
          9: ['curar-ferimentos-em-massa'],
        }),
      }),
      sub('mar', 'Círculo do Mar', 'A ira e o embalo do oceano.', [
        [3, 'Ira do Mar', 'Bônus: aura aquática que empurra e causa dano de frio (SG CON).'],
        [3, 'Magias do Círculo do Mar', 'Despedaçar, Lufada de Vento, Névoa Obscurecente, Onda Trovejante e Raio de Gelo sempre preparadas; mais magias nos níveis 5, 7 e 9.'],
        [6, 'Afinidade Aquática', 'Deslocamento de natação; respire embaixo d’água.'],
        [10, 'Maré Vigorosa', 'Sua aura também cura ou reposiciona aliados.'],
        [14, 'Oceano Interior', 'Resistência a frio; sua aura alcança 9 m.'],
      ], {
        alwaysPrepared: semprePreparadas({
          3: ['despedacar', 'lufada-de-vento', 'nevoa-obscurecente', 'onda-trovejante', 'raio-de-gelo'],
          5: ['relampago', 'respirar-na-agua'],
          7: ['controlar-agua', 'tempestade-glacial'],
          9: ['invocar-elemental', 'paralisar-monstro'],
        }),
      }),
      sub('estrelas', 'Círculo das Estrelas', 'Constelações e presságios do céu noturno.', [
        [3, 'Forma Estelar', 'Bônus: gaste Forma Selvagem para assumir forma estelar: Arqueiro (ataque radiante), Cálice (cura extra) ou Dragão (concentração estável).'],
        [3, 'Mapa Estelar', 'Orientação e Raio Guia sempre preparados; conjure Raio Guia sem gastar espaço um número de vezes igual ao seu modificador de Sabedoria (mín. 1) por descanso longo.'],
        [6, 'Presságio Cósmico', 'Reação: some ou subtraia 1d6 de Testes D20 próximos (usos = prof.).'],
        [10, 'Constelações Cintilantes', 'Formas estelares melhoram (2d8); voo na forma estelar.'],
        [14, 'Corpo Estelar', 'Resistência a dano Cortante, Perfurante e de Concussão na Forma Estelar.'],
      ], {
        alwaysPrepared: semprePreparadas({ 3: ['orientacao', 'raio-guia'] }),
      }),
    ],
  },

  // ================= GUERREIRO =================
  {
    id: 'guerreiro',
    name: 'Guerreiro',
    hitDie: 10,
    primary: 'Força ou Destreza',
    saves: ['for', 'con'],
    armor: ['Leve', 'Média', 'Pesada', 'Escudos'],
    weapons: ['Simples', 'Marciais'],
    skillChoices: ['acrobacia', 'lidar-animais', 'atletismo', 'historia', 'intuicao', 'intimidacao', 'percepcao', 'persuasao', 'sobrevivencia'],
    skillCount: 2,
    caster: 'nenhum',
    startingEquipment: 'Cota de malha, espada grande, mangual, 8 azagaias, pacote de masmorra e 4 PO',
    equipmentOptions: [
      eq('Cota de malha, espada grande, mangual, 8 azagaias, pacote de masmorra e 4 PO', [
        { itemId: 'cota-de-malha' }, { itemId: 'espada-grande' }, { itemId: 'mangual' },
        { itemId: 'azagaia', qty: 8 }, { itemId: 'pacote-masmorra' },
      ], 4),
      eq('Couro batido, cimitarra, espada curta, arco longo, aljava com 20 flechas, pacote de masmorra e 11 PO', [
        { itemId: 'couro-batido' }, { itemId: 'cimitarra' }, { itemId: 'espada-curta' },
        { itemId: 'arco-longo' }, { itemId: 'aljava' }, { itemId: 'pacote-masmorra' },
      ], 11, 'B'),
      soOuro(155, 'C'),
    ],
    choices: [estiloDeLuta(1)],
    features: [
      { level: 1, name: 'Estilo de Luta', desc: 'Escolha um talento de Estilo de Luta (ex.: Defesa +1 CA, Duelismo +2 dano, Arquearia +2 ataque à distância, Armas Grandes rerrolar 1-2 no dano).' },
      { level: 1, name: 'Retomar o Fôlego', desc: 'Bônus: recupere 1d10 + nível de Guerreiro PV. Recupere 1 uso em descanso curto, todos no longo.' },
      { level: 1, name: 'Maestria em Armas', desc: 'Use as propriedades de maestria de 3 tipos de armas (aumenta em níveis altos).' },
      { level: 2, name: 'Surto de Ação', desc: 'Uma ação adicional no seu turno (exceto Magia). 1 uso por descanso curto/longo (2 no nível 17, um por vez).' },
      { level: 2, name: 'Mente Tática', desc: 'Ao falhar num teste de habilidade, gaste um uso de Retomar o Fôlego para somar 1d10.' },
      subclassFeat(3, 'Arquétipo Marcial'),
      asi(4),
      { level: 5, name: 'Ataque Extra', desc: 'Ataque duas vezes com a ação Atacar.' },
      { level: 5, name: 'Mudança Tática', desc: 'Ao usar Retomar o Fôlego, mova-se até metade do deslocamento sem provocar ataques de oportunidade.' },
      asi(6),
      { level: 7, name: 'Característica de Subclasse', desc: 'Você ganha uma característica do seu Arquétipo.' },
      asi(8),
      { level: 9, name: 'Indomável', desc: 'Rerrole uma salvaguarda falha (com bônus = nível). 1×/descanso longo (2 no 13º, 3 no 17º).' },
      { level: 9, name: 'Mestre Tático', desc: 'Ao atacar, troque a propriedade de maestria da arma por Empurrar, Enfraquecer ou Atrasar.' },
      { level: 10, name: 'Característica de Subclasse', desc: 'Você ganha uma característica do seu Arquétipo.' },
      { level: 11, name: 'Dois Ataques Extras', desc: 'Ataque três vezes com a ação Atacar.' },
      asi(12),
      { level: 13, name: 'Golpes Estudados', desc: 'Se você errar uma jogada de ataque contra uma criatura, ganha vantagem na sua próxima jogada de ataque contra ela.' },
      asi(14),
      { level: 15, name: 'Característica de Subclasse', desc: 'Você ganha uma característica do seu Arquétipo.' },
      asi(16),
      { level: 17, name: 'Surto de Ação (2 usos)', desc: 'Dois usos de Surto de Ação por descanso (um por turno).' },
      { level: 18, name: 'Característica de Subclasse', desc: 'Você ganha uma característica do seu Arquétipo.' },
      epicBoon(),
      { level: 20, name: 'Três Ataques Extras', desc: 'Ataque quatro vezes com a ação Atacar.' },
    ],
    masteryCount: (lv) => (lv >= 16 ? 6 : lv >= 10 ? 5 : lv >= 4 ? 4 : 3),
    resources: [
      { id: 'retomar-folego', name: 'Retomar o Fôlego', fromLevel: 1, recharge: 'longo', shortRestUses: 1, max: (lv) => (lv >= 10 ? 4 : lv >= 4 ? 3 : 2) },
      { id: 'surto-de-acao', name: 'Surto de Ação', fromLevel: 2, recharge: 'curto', max: (lv) => (lv >= 17 ? 2 : 1) },
      { id: 'indomavel', name: 'Indomável', fromLevel: 9, recharge: 'longo', max: (lv) => (lv >= 17 ? 3 : lv >= 13 ? 2 : 1) },
    ],
    subclasses: [
      sub('mestre-de-batalha', 'Mestre de Batalha', 'Técnica marcial refinada em manobras.', [
        [3, 'Superioridade em Combate', '4 dados de superioridade (d8) e 3 manobras (Ataque Preciso, Rasteira, Comandar etc.). Recupera em descanso curto.'],
        [7, 'Estudioso da Guerra', 'Proficiência extra e conhecimento de campo de batalha.'],
        [10, 'Manobras Aprimoradas', 'Dados de superioridade viram d10; mais manobras.'],
        [15, 'Implacável', 'Ao rolar Iniciativa sem dados de superioridade, recupere um.'],
        [18, 'Dados Supremos', 'Dados de superioridade viram d12.'],
      ]),
      sub('campeao', 'Campeão', 'Força bruta e físico apurado.', [
        [3, 'Crítico Aprimorado', 'Seus ataques com arma critam com 19-20.'],
        [3, 'Atleta Notável', 'Vantagem em Iniciativa e testes de Atletismo.'],
        [7, 'Estilo Adicional', 'Ganhe outro talento de Estilo de Luta.'],
        [10, 'Guerreiro Heroico', 'Em combate, ganhe Inspiração Heroica no início de cada turno seu, se não a tiver.'],
        [15, 'Crítico Superior', 'Crítico com 18-20.'],
        [18, 'Sobrevivente', 'Vantagem em Testes de Morte (20 natural recupera PV); no início de cada turno seu, recupere 5 + mod. CON PV se estiver com metade dos PV ou menos (e acima de 0).'],
      ]),
      sub('cavaleiro-arcano', 'Cavaleiro Místico (Arcano)', 'Guerreiro que entrelaça magia arcana ao aço.', [
        [3, 'Conjuração', 'Você conjura magias da lista de Mago usando Inteligência: 2 truques (3 no nível 10) e a lista de magias preparadas da tabela de Cavaleiro Místico. Ao subir de nível você pode trocar uma magia preparada e um truque.'],
        [3, 'Vínculo com Arma', 'Invoque armas vinculadas à sua mão; impossível ser desarmado.'],
        [7, 'Magia de Guerra', 'Ao usar a ação Atacar, você pode substituir um dos ataques pela conjuração de um dos seus truques de Mago (tempo de conjuração de 1 ação).'],
        [10, 'Golpe Sobrenatural', 'Seus ataques impõem desvantagem na salvaguarda contra sua próxima magia.'],
        [15, 'Carga Arcana', 'Teleporte-se ao usar Surto de Ação.'],
        [18, 'Magia de Guerra Aprimorada', 'Ao usar a ação Atacar, você pode substituir dois dos ataques pela conjuração de uma magia de Mago de 1º ou 2º círculo (tempo de conjuração de 1 ação).'],
      ], {
        spellcasting: {
          list: 'mago', ability: 'int', fromLevel: 3,
          preparedByLevel: PREP_TERCO, cantripsByLevel: CANTRIPS_TERCO,
        },
      }),
      sub('guerreiro-psiquico', 'Guerreiro Psíquico', 'Poder psiônico canalizado em combate.', [
        [3, 'Poder Psiônico', 'Dados de Energia Psiônica (d6): Golpe Protegido (reduz dano), Golpe Psiônico (dano extra), Movimento Telecinético.'],
        [7, 'Adepto Telecinético', 'Impulso psíquico: voo curto, empurrões; dados viram d8.'],
        [10, 'Barreira Protegida', 'Resistência psíquica; proteja aliados com a mente.'],
        [15, 'Mestre Telecinético', 'Conjure Telecinésia; dados viram d10.'],
        [18, 'Mente de Aço', 'Salvaguardas mentais aprimoradas; dados viram d12.'],
      ]),
    ],
  },

  // ================= MONGE =================
  {
    id: 'monge',
    name: 'Monge',
    hitDie: 8,
    primary: 'Destreza e Sabedoria',
    saves: ['for', 'des'],
    armor: [],
    weapons: ['Simples', 'Marciais com propriedade Leve'],
    skillChoices: ['acrobacia', 'atletismo', 'historia', 'intuicao', 'religiao', 'furtividade'],
    skillCount: 2,
    caster: 'nenhum',
    startingEquipment: 'Lança, 5 adagas, ferramentas de artesão ou instrumento, pacote de explorador e 11 PO',
    equipmentOptions: [
      eq('Lança, 5 adagas, ferramentas de artesão (ou instrumento musical), pacote de explorador e 11 PO', [
        { itemId: 'lanca' }, { itemId: 'adaga', qty: 5 }, { itemId: 'ferramentas-artesao' }, { itemId: 'pacote-explorador' },
      ], 11),
      soOuro(50),
    ],
    features: [
      { level: 1, name: 'Artes Marciais', desc: 'Ataques desarmados/armas de monge usam d6 (aumenta com o nível) e podem usar DES; ataque desarmado como ação Bônus.' },
      { level: 1, name: 'Defesa sem Armadura', desc: 'Sem armadura nem escudo, CA = 10 + mod. DES + mod. SAB.' },
      { level: 2, name: 'Foco (Chi)', desc: 'Pontos de Foco = nível de Monge: Rajada de Golpes (2 ataques Bônus), Defesa Paciente (Esquivar Bônus), Passo do Vento (Desengajar/Correr Bônus). Recupera em descanso curto.' },
      { level: 2, name: 'Metabolismo Sobrenatural', desc: '1×/descanso longo, ao rolar Iniciativa, recupere todo o Foco; ao fazê-lo, role seu Dado de Artes Marciais e recupere PV igual ao seu nível de Monge + a rolagem.' },
      { level: 2, name: 'Movimento sem Armadura', desc: '+3 m de deslocamento sem armadura (aumenta com o nível).' },
      subclassFeat(3, 'Tradição Monástica'),
      { level: 3, name: 'Desviar Ataques', desc: 'Reação: reduza dano de ataque (1d10 + DES + nível); se reduzir a 0, redirecione.' },
      asi(4),
      { level: 4, name: 'Queda Lenta', desc: 'Reação: reduza dano de queda em 5 × nível de Monge.' },
      { level: 5, name: 'Ataque Extra', desc: 'Ataque duas vezes com a ação Atacar.' },
      { level: 5, name: 'Golpe Atordoante', desc: '1×/turno, gaste 1 Foco ao acertar: SG CON ou o alvo fica Atordoado até seu próximo turno.' },
      { level: 6, name: 'Golpes Potencializados', desc: 'Seus ataques desarmados contam como mágicos.' },
      { level: 6, name: 'Característica de Subclasse', desc: 'Você ganha uma característica da sua Tradição.' },
      { level: 7, name: 'Evasão', desc: 'Salvaguardas de DES para meio dano: sucesso = nenhum dano.' },
      asi(8),
      { level: 9, name: 'Movimento Acrobático', desc: 'Corra por paredes e sobre líquidos.' },
      { level: 10, name: 'Autodomínio Elevado', desc: 'Imune a Envenenado e à doença; gaste 1 Foco para terminar Enfeitiçado/Amedrontado em si.' },
      { level: 11, name: 'Característica de Subclasse', desc: 'Você ganha uma característica da sua Tradição.' },
      asi(12),
      { level: 13, name: 'Desviar Energia', desc: 'Desviar Ataques funciona contra qualquer tipo de dano.' },
      { level: 14, name: 'Disciplina Superior', desc: 'Proficiência em todas as salvaguardas; gaste 1 Foco para rerrolar salvaguarda falha.' },
      { level: 15, name: 'Foco Perfeito', desc: 'Ao rolar Iniciativa com 3 Pontos de Foco ou menos, volte a ter 4 pontos.' },
      asi(16),
      { level: 17, name: 'Característica de Subclasse', desc: 'Você ganha uma característica da sua Tradição.' },
      { level: 18, name: 'Defesa Superior', desc: 'Gaste 3 Focos: resistência a todo dano (exceto Energético) por 1 minuto.' },
      epicBoon(),
      { level: 20, name: 'Defesa do Corpo e da Mente', desc: 'DES e SAB +4 (máx. 25).' },
    ],
    resources: [
      { id: 'foco', name: 'Pontos de Foco', fromLevel: 2, recharge: 'curto', max: (lv) => lv },
    ],
    subclasses: [
      sub('mao-aberta', 'Guerreiro da Mão Aberta', 'Mestres do combate desarmado.', [
        [3, 'Técnica da Mão Aberta', 'Rajada de Golpes: derrube, empurre ou impeça reações.'],
        [6, 'Integridade do Corpo', 'Bônus: cure-se (rolagem de Artes Marciais + SAB), usos = prof.'],
        [11, 'Serenidade', 'Defesa Paciente dá PV temporário.'],
        [17, 'Palma Trêmula', 'Vibrações letais: gaste 4 Focos ao acertar um Golpe Desarmado; ao encerrá-las (ação), o alvo faz SG de CON: 10d12 de dano energético na falha, metade no sucesso.'],
      ]),
      sub('sombra', 'Guerreiro da Sombra', 'Ninjas que dobram as sombras.', [
        [3, 'Artes da Sombra', 'Gaste Foco: conjure Escuridão (enxergando dentro), Ilusão Menor, Passo Nebuloso na penumbra.'],
        [6, 'Passo Sombrio', 'Bônus: teleporte entre sombras; vantagem no próximo ataque.'],
        [11, 'Manto de Sombras', 'Invisibilidade na penumbra gastando Foco.'],
        [17, 'Opressão Sombria', 'Ataques de oportunidade contra quem sofre com sua escuridão.'],
      ]),
      sub('elementos', 'Guerreiro dos Elementos', 'Canalize fogo, água, terra e ar.', [
        [3, 'Sintonia Elemental', 'Golpes com alcance de 3 m e dano elemental; empurre/puxe alvos.'],
        [6, 'Explosão Elemental', 'Gaste Foco: rajada elemental em área (SG DES).'],
        [11, 'Viajante dos Elementos', 'Voo, natação e escalada; resistência a um elemento.'],
        [17, 'Fúria Elemental Perfeita', 'Golpes elementais superiores; imunidade situacional.'],
      ]),
      sub('misericordia', 'Guerreiro da Misericórdia', 'Mãos que curam e mãos que ferem.', [
        [3, 'Mãos da Cura/Do Mal', 'Gaste Foco: cure com toque ou cause dano necrótico extra.'],
        [6, 'Toque Médico', 'Suas mãos curam condições (Envenenado, Atordoado etc.).'],
        [11, 'Rajada de Cura e Dor', 'Rajada de Golpes pode curar aliados ou drenar inimigos.'],
        [17, 'Mãos do Último Suspiro', 'Reviva mortos recentes (1×/descanso longo).'],
      ]),
    ],
  },

  // ================= PALADINO =================
  {
    id: 'paladino',
    name: 'Paladino',
    hitDie: 10,
    primary: 'Força e Carisma',
    saves: ['sab', 'car'],
    armor: ['Leve', 'Média', 'Pesada', 'Escudos'],
    weapons: ['Simples', 'Marciais'],
    skillChoices: ['atletismo', 'intuicao', 'intimidacao', 'medicina', 'persuasao', 'religiao'],
    skillCount: 2,
    caster: 'meio',
    spellAbility: 'car',
    preparedByLevel: PREP_HALF,
    preparation: 'descanso-uma',
    startingEquipment: 'Cota de malha, escudo, espada longa, 6 azagaias, símbolo sagrado, pacote de sacerdote e 9 PO',
    equipmentOptions: [
      eq('Cota de malha, escudo, espada longa, 6 azagaias, símbolo sagrado, pacote de sacerdote e 9 PO', [
        { itemId: 'cota-de-malha' }, { itemId: 'escudo' }, { itemId: 'espada-longa' },
        { itemId: 'azagaia', qty: 6 }, { itemId: 'simbolo-sagrado' }, { itemId: 'pacote-sacerdote' },
      ], 9),
      soOuro(150),
    ],
    choices: [estiloDeLuta(2, ['estilo-combatente-abencoado'])],
    masteryCount: (lv) => (lv >= 4 ? 3 : 2),
    features: [
      { level: 1, name: 'Impor as Mãos', desc: 'Reserva de cura = 5 × nível de Paladino. Bônus: cure PV ou remova a condição Envenenado (custo 5).' },
      { level: 1, name: 'Conjuração', desc: 'Você conjura magias de Paladino usando Carisma.' },
      { level: 1, name: 'Maestria em Armas', desc: 'Use as propriedades de maestria de 2 tipos de armas.' },
      { level: 2, name: 'Golpe Divino (Smite)', desc: 'Castigo Divino sempre preparado; conjure 1×/descanso longo sem gastar espaço.' },
      { level: 2, name: 'Estilo de Luta', desc: 'Escolha um talento de Estilo de Luta (ou Combatente Abençoado: truques de Clérigo).' },
      subclassFeat(3, 'Juramento Sagrado'),
      { level: 3, name: 'Canalizar Divindade', desc: 'Usos do poder do juramento. Recupere 1 uso em descanso curto.' },
      asi(4),
      { level: 5, name: 'Ataque Extra', desc: 'Ataque duas vezes com a ação Atacar.' },
      { level: 5, name: 'Montaria Fiel', desc: 'Encontrar Corcel sempre preparado; conjure 1×/descanso longo de graça.' },
      { level: 6, name: 'Aura de Proteção', desc: 'Você e aliados a até 3 m somam seu mod. de CAR (mín. +1) em salvaguardas.' },
      { level: 7, name: 'Característica de Subclasse', desc: 'Você ganha uma característica do seu Juramento.' },
      asi(8),
      { level: 9, name: 'Abjurar Inimigos', desc: 'Canalizar Divindade: amedronte inimigos próximos (SG SAB).' },
      { level: 10, name: 'Aura de Coragem', desc: 'Você e aliados na aura são imunes a Amedrontado.' },
      { level: 11, name: 'Golpes Radiantes', desc: 'Seus ataques corpo a corpo com arma ou Golpe Desarmado causam +1d8 de dano radiante.' },
      asi(12),
      { level: 14, name: 'Toque Restaurador', desc: 'Impor as Mãos também remove Amedrontado, Enfeitiçado, Paralisado e Atordoado (custo 5 cada).' },
      { level: 15, name: 'Característica de Subclasse', desc: 'Você ganha uma característica do seu Juramento.' },
      asi(16),
      { level: 18, name: 'Auras Ampliadas', desc: 'Suas auras alcançam 9 m.' },
      epicBoon(),
      { level: 20, name: 'Característica de Subclasse (Ápice)', desc: 'A transformação máxima do seu Juramento.' },
    ],
    resources: [
      { id: 'canalizar-divindade-paladino', name: 'Canalizar Divindade', fromLevel: 3, recharge: 'longo', shortRestUses: 1, max: (lv) => (lv >= 11 ? 3 : 2) },
      { id: 'impor-as-maos', name: 'Impor as Mãos (PV na reserva)', fromLevel: 1, recharge: 'longo', max: (lv) => lv * 5 },
    ],
    subclasses: [
      sub('devocao', 'Juramento de Devoção', 'Honestidade, coragem, compaixão e dever.', [
        [3, 'Magias do Juramento da Devoção', 'Escudo da Fé e Proteção Contra o Bem e o Mal ficam sempre preparadas; mais magias nos níveis 5, 9, 13 e 17.'],
        [3, 'Arma Sagrada', 'Canalizar Divindade: some CAR aos ataques; a arma emite luz (10 min).'],
        [7, 'Aura de Devoção', 'Você e aliados na aura são imunes a Enfeitiçado.'],
        [15, 'Vontade Inabalável', 'Vantagem em salvaguardas contra magias de Encantamento.'],
        [20, 'Auréola Sagrada', 'Forma angelical: luz solar, dano radiante, salvaguardas superiores.'],
      ], {
        alwaysPrepared: semprePreparadas({
          3: ['escudo-da-fe', 'protecao-contra-o-bem-e-o-mal'],
          5: ['auxilio', 'zona-da-verdade'],
          9: ['dissipar-magia', 'sinal-de-esperanca'],
          13: ['defensor-da-fe', 'movimentacao-livre'],
          17: ['coluna-de-chamas', 'comunhao'],
        }),
      }),
      sub('gloria', 'Juramento da Glória', 'Heroísmo destinado à lenda.', [
        [3, 'Magias do Juramento da Glória', 'Heroísmo e Raio Guia ficam sempre preparadas; mais magias nos níveis 5, 9, 13 e 17.'],
        [3, 'Atleta Inspirador', 'Canalizar Divindade: impulsione proezas atléticas suas e de aliados.'],
        [3, 'Golpes Peerless', 'Dano extra com Canalizar Divindade.'],
        [7, 'Aura de Vivacidade', 'Seu deslocamento aumenta 3 m; aliados na aura também ganham 3 m.'],
        [15, 'Defesa Gloriosa', 'Reação que aumenta a CA do alvo e pune o atacante.'],
        [20, 'Avatar da Glória', 'Velocidade e presença lendárias.'],
      ], {
        alwaysPrepared: semprePreparadas({
          3: ['heroismo', 'raio-guia'],
          5: ['aprimorar-atributo', 'arma-magica'],
          9: ['celeridade', 'protecao-contra-energia'],
          13: ['compulsao', 'movimentacao-livre'],
          17: ['lendas-e-historias', 'presenca-regia-de-yolande'],
        }),
      }),
      sub('anciaes', 'Juramento dos Anciões', 'Preserve a luz, a vida e a alegria.', [
        [3, 'Magias do Juramento dos Anciões', 'Falar com Animais e Golpe Constritor ficam sempre preparadas; mais magias nos níveis 5, 9, 13 e 17.'],
        [3, 'Ira da Natureza', 'Canalizar Divindade: prenda inimigos com vinhas espectrais (SG FOR).'],
        [7, 'Aura de Resistência', 'Você e aliados na aura têm resistência a dano Necrótico, Psíquico e Radiante.'],
        [15, 'Sentinela Imortal', '1×/dia, ao cair a 0 PV, fique com 1 PV; não envelhece.'],
        [20, 'Campeão Ancião', 'Forma primaveril: regeneração e magias aceleradas.'],
      ], {
        alwaysPrepared: semprePreparadas({
          3: ['falar-com-animais', 'golpe-constritor'],
          5: ['passo-nebuloso', 'raio-lunar'],
          9: ['crescimento-de-plantas', 'protecao-contra-energia'],
          13: ['pele-rocha', 'tempestade-glacial'],
          17: ['comunhao-com-a-natureza', 'passo-arboreo'],
        }),
      }),
      sub('vinganca', 'Juramento de Vingança', 'Punir o mal a qualquer custo.', [
        [3, 'Magias do Juramento da Vingança', 'Marca do Predador e Perdição ficam sempre preparadas; mais magias nos níveis 5, 9, 13 e 17.'],
        [3, 'Voto de Inimizade', 'Canalizar Divindade (Bônus): vantagem nos ataques contra um alvo por 1 minuto.'],
        [7, 'Andarilho Implacável', 'Ataques de oportunidade não custam sua reação... e seu alvo não escapa.'],
        [15, 'Alma de Vingança', 'Reação: ataque quem tem seu Voto quando ele atacar.'],
        [20, 'Anjo Vingador', 'Asas e aura de medo por 10 minutos.'],
      ], {
        alwaysPrepared: semprePreparadas({
          3: ['marca-do-predador', 'perdicao'],
          5: ['paralisar-pessoa', 'passo-nebuloso'],
          9: ['celeridade', 'protecao-contra-energia'],
          13: ['banimento', 'porta-dimensional'],
          17: ['paralisar-monstro', 'videncia'],
        }),
      }),
    ],
  },

  // ================= PATRULHEIRO =================
  {
    id: 'patrulheiro',
    name: 'Patrulheiro',
    hitDie: 10,
    primary: 'Destreza e Sabedoria',
    saves: ['for', 'des'],
    armor: ['Leve', 'Média', 'Escudos'],
    weapons: ['Simples', 'Marciais'],
    skillChoices: ['lidar-animais', 'atletismo', 'furtividade', 'intuicao', 'investigacao', 'natureza', 'percepcao', 'sobrevivencia'],
    skillCount: 3,
    caster: 'meio',
    spellAbility: 'sab',
    preparedByLevel: PREP_HALF,
    preparation: 'descanso-uma',
    startingEquipment: 'Armadura de couro batido, cimitarra, espada curta, arco longo com 20 flechas, pacote de explorador e 7 PO',
    equipmentOptions: [
      eq('Couro batido, cimitarra, espada curta, arco longo, aljava com 20 flechas, pacote de explorador e 7 PO', [
        { itemId: 'couro-batido' }, { itemId: 'cimitarra' }, { itemId: 'espada-curta' },
        { itemId: 'arco-longo' }, { itemId: 'aljava' }, { itemId: 'pacote-explorador' },
      ], 7),
      soOuro(150),
    ],
    choices: [estiloDeLuta(2, ['estilo-guerreiro-druidico'])],
    masteryCount: (lv) => (lv >= 4 ? 3 : 2),
    features: [
      { level: 1, name: 'Conjuração', desc: 'Você conjura magias de Patrulheiro usando Sabedoria.' },
      { level: 1, name: 'Inimigo Favorito', desc: 'Marca do Caçador sempre preparada; conjure sem gastar espaço (usos aumentam com o nível).' },
      { level: 1, name: 'Maestria em Armas', desc: 'Use as propriedades de maestria de 2 tipos de armas.' },
      { level: 2, name: 'Perito em Perícia', desc: 'Perícia Aprimorada em uma perícia (bônus de proficiência dobrado).' },
      { level: 2, name: 'Estilo de Luta', desc: 'Escolha um talento de Estilo de Luta (ou Guerreiro Druídico: truques de Druida).' },
      subclassFeat(3, 'Arquétipo de Patrulheiro'),
      asi(4),
      { level: 5, name: 'Ataque Extra', desc: 'Ataque duas vezes com a ação Atacar.' },
      { level: 6, name: 'Andarilho', desc: '+3 m de deslocamento; deslocamento de escalada e natação.' },
      { level: 7, name: 'Característica de Subclasse', desc: 'Você ganha uma característica do seu Arquétipo.' },
      asi(8),
      { level: 9, name: 'Perito em Perícia (2)', desc: 'Perícia Aprimorada em mais uma perícia.' },
      { level: 10, name: 'Incansável', desc: 'PV temporário (1d8 + SAB) como ação; descanso curto reduz Exaustão.' },
      { level: 11, name: 'Característica de Subclasse', desc: 'Você ganha uma característica do seu Arquétipo.' },
      asi(12),
      { level: 13, name: 'Passos Relentes', desc: 'Marca do Caçador não quebra invisibilidade; conjuração aprimorada.' },
      { level: 14, name: 'Véu Natural', desc: 'Invisibilidade como ação Bônus (usos = prof./descanso longo).' },
      { level: 15, name: 'Característica de Subclasse', desc: 'Você ganha uma característica do seu Arquétipo.' },
      asi(16),
      { level: 17, name: 'Matador Preciso', desc: 'Vantagem nos ataques contra o alvo da sua Marca do Caçador.' },
      { level: 18, name: 'Sentidos Selvagens', desc: 'Percepção às Cegas 9 m.' },
      epicBoon(),
      { level: 20, name: 'Caçador Supremo', desc: 'Marca do Caçador causa d10 e afeta ataques múltiplos.' },
    ],
    resources: [
      { id: 'inimigo-favorito', name: 'Inimigo Favorito (Marca do Caçador grátis)', fromLevel: 1, recharge: 'longo', max: (lv) => (lv >= 17 ? 6 : lv >= 13 ? 5 : lv >= 9 ? 4 : lv >= 5 ? 3 : 2) },
    ],
    subclasses: [
      sub('cacador', 'Caçador', 'Especialista em abater presas perigosas.', [
        [3, 'Presas do Caçador', 'Escolha: Matador de Colossos (+1d8 contra feridos), Quebrador de Hordas (ataque extra contra outro alvo adjacente).'],
        [7, 'Táticas Defensivas', 'Escolha: Fuga da Horda ou Defesa contra Multiataque.'],
        [11, 'Ataques Superiores', 'Rajada: ataque em área contra criaturas em linha/próximas.'],
        [15, 'Defesa Superior', 'Reação: resistência a um dano recebido.'],
      ]),
      sub('mestre-das-bestas', 'Mestre das Bestas', 'Vínculo profundo com uma besta primal.', [
        [3, 'Companheiro Primal', 'Uma Besta da Terra, do Ar ou da Água luta ao seu lado (age no seu turno).'],
        [7, 'Treinamento Excepcional', 'Bônus: a besta ataca; seus golpes contam como mágicos.'],
        [11, 'Fúria Bestial', 'A besta ataca duas vezes; Marca do Caçador beneficia a besta.'],
        [15, 'Vínculo Partilhado', 'Compartilhe magias e teleportes com a besta.'],
      ]),
      sub('andarilho-feerico', 'Andarilho Feérico', 'Tocado pela magia das Cortes Feéricas.', [
        [3, 'Magias do Andarilho Feérico', 'Enfeitiçar Pessoa fica sempre preparada; mais magias nos níveis 5, 9, 13 e 17.'],
        [3, 'Golpes Terríveis', 'Dano psíquico extra (1d4→1d6) 1×/turno.'],
        [3, 'Bênção Feérica', 'Charme sobrenatural em interações sociais.'],
        [7, 'Espelho Enevoado', 'Reação ao ser atacado: fique invisível e teleporte-se (usos = SAB).'],
        [11, 'Andarilho de Duas Mentes', 'Vantagem em salvaguardas mentais; compartilhe com aliados.'],
        [15, 'Nevoeiro Errante', 'Passo Nebuloso à vontade; traga aliados junto.'],
      ], {
        alwaysPrepared: semprePreparadas({
          3: ['enfeiticar-pessoa'],
          5: ['passo-nebuloso'],
          9: ['convocar-feerico'],
          13: ['porta-dimensional'],
          17: ['despistar'],
        }),
      }),
      sub('perseguidor-sombrio', 'Vigilante das Sombras (Gloom Stalker)', 'Caçador das trevas e do subterrâneo.', [
        [3, 'Magias do Vigilante das Sombras', 'Disfarçar-se fica sempre preparada; mais magias nos níveis 5, 9, 13 e 17.'],
        [3, 'Emboscada Terrível', 'No 1º turno: +3 m, ataque adicional com +1d8; invisível para visão no escuro.'],
        [3, 'Visão Umbral', 'Visão no escuro 18 m (ou +18 m).'],
        [7, 'Ferro na Mente', 'Proficiência em salvaguardas de SAB.'],
        [11, 'Golpes Atrozes', 'Se errar um ataque, faça outro imediatamente.'],
        [15, 'Vulto Sombrio', 'Reação: fique invisível ao sofrer dano.'],
      ], {
        alwaysPrepared: semprePreparadas({
          3: ['disfarcar-se'],
          5: ['corda-extradimensional'],
          9: ['medo'],
          13: ['invisibilidade-maior'],
          17: ['similaridade'],
        }),
      }),
    ],
  },

  // ================= LADINO =================
  {
    id: 'ladino',
    name: 'Ladino',
    hitDie: 8,
    primary: 'Destreza',
    saves: ['des', 'int'],
    armor: ['Leve'],
    weapons: ['Simples', 'Marciais com propriedade Leve ou Acuidade'],
    skillChoices: ['acrobacia', 'atletismo', 'enganacao', 'furtividade', 'intimidacao', 'intuicao', 'investigacao', 'percepcao', 'persuasao', 'prestidigitacao'],
    skillCount: 4,
    caster: 'nenhum',
    startingEquipment: 'Armadura de couro, 2 adagas, espada curta, arco curto com 20 flechas, ferramentas de ladrão, pacote de assaltante e 8 PO',
    equipmentOptions: [
      eq('Armadura de couro, 2 adagas, espada curta, arco curto, aljava com 20 flechas, ferramentas de ladrão, pacote de assaltante e 8 PO', [
        { itemId: 'couro' }, { itemId: 'adaga', qty: 2 }, { itemId: 'espada-curta' }, { itemId: 'arco-curto' },
        { itemId: 'aljava' }, { itemId: 'ferramentas-de-ladrao' }, { itemId: 'pacote-assaltante' },
      ], 8),
      soOuro(100),
    ],
    features: [
      { level: 1, name: 'Ataque Furtivo', desc: '1×/turno, +1d6 de dano (aumenta a cada 2 níveis) com arma de Acuidade ou à distância se tiver vantagem ou um aliado adjacente ao alvo.' },
      { level: 1, name: 'Perícia Aprimorada', desc: 'Duas perícias com bônus de proficiência dobrado (mais 2 no nível 6).' },
      { level: 1, name: 'Gíria de Ladrão', desc: 'Você conhece a Gíria de Ladrão e mais um idioma.' },
      { level: 1, name: 'Maestria em Armas', desc: 'Use as propriedades de maestria de 2 tipos de armas.' },
      { level: 2, name: 'Ação Ardilosa', desc: 'Bônus: Correr, Desengajar ou Esconder-se.' },
      subclassFeat(3, 'Arquétipo de Ladino'),
      { level: 3, name: 'Mira Firme', desc: 'Bônus: vantagem no próximo ataque (se não se mover no turno).' },
      asi(4),
      { level: 5, name: 'Esquiva Sagaz', desc: 'Reação: reduza o dano de um ataque à metade.' },
      { level: 5, name: 'Golpes Ardilosos', desc: 'Troque dados do Ataque Furtivo por efeitos: Derrubar, Desarmar, Envenenar, Retirar-se.' },
      { level: 6, name: 'Perícia Aprimorada (2)', desc: 'Mais duas perícias com bônus dobrado.' },
      { level: 7, name: 'Evasão', desc: 'Salvaguardas de DES para meio dano: sucesso = nenhum dano.' },
      { level: 7, name: 'Talento Confiável', desc: 'Testes com proficiência: trate rolagens de 9 ou menos no d20 como 10.' },
      asi(8),
      { level: 9, name: 'Característica de Subclasse', desc: 'Você ganha uma característica do seu Arquétipo.' },
      asi(10),
      { level: 11, name: 'Golpes Ardilosos Aprimorados', desc: 'Novos efeitos: Atordoar (Daze), Golpe Preciso.' },
      asi(12),
      { level: 13, name: 'Característica de Subclasse', desc: 'Você ganha uma característica do seu Arquétipo.' },
      { level: 14, name: 'Sentidos Cegos', desc: 'Percepção às Cegas 3 m.' },
      { level: 15, name: 'Mente Escorregadia', desc: 'Proficiência em salvaguardas de SAB e CAR.' },
      asi(16),
      { level: 17, name: 'Característica de Subclasse', desc: 'Você ganha uma característica do seu Arquétipo.' },
      { level: 18, name: 'Elusivo', desc: 'Nenhum ataque tem vantagem contra você (se não estiver Incapacitado).' },
      epicBoon(),
      { level: 20, name: 'Golpe de Sorte', desc: '1×/descanso curto, transforme um ataque errado em acerto ou uma falha em 20 natural.' },
    ],
    masteryCount: (lv) => (lv >= 4 ? 3 : 2),
    resources: [
      { id: 'golpe-de-sorte', name: 'Golpe de Sorte', fromLevel: 20, recharge: 'curto', max: () => 1 },
    ],
    subclasses: [
      sub('ladrao', 'Ladrão', 'Mãos rápidas e pés mais rápidos ainda.', [
        [3, 'Mãos Rápidas', 'Ação Ardilosa: usar objetos, ferramentas de ladrão ou Prestidigitação como Bônus.'],
        [3, 'Trabalho no Segundo Andar', 'Escalada sem custo extra; saltos maiores.'],
        [9, 'Furtividade Suprema', 'Vantagem em Furtividade movendo-se à meia velocidade.'],
        [13, 'Usar Dispositivos Mágicos', 'Use pergaminhos e itens mágicos alheios; sintonize mais itens.'],
        [17, 'Reflexos de Ladrão', 'Dois turnos na primeira rodada de combate.'],
      ]),
      sub('assassino', 'Assassino', 'Morte rápida e silenciosa.', [
        [3, 'Assassinar', 'Vantagem contra quem não agiu; dano extra no 1º turno (+ nível de ladino).'],
        [3, 'Ferramentas do Ofício', 'Kits de disfarce e veneno.'],
        [9, 'Infiltração Perfeita', 'Identidades falsas impecáveis; mímica de vozes.'],
        [13, 'Toque Mortal', 'Envenenar golpes: dano extra de veneno.'],
        [17, 'Golpe da Morte', 'Na primeira rodada de combate, quando seu Ataque Furtivo acertar: o alvo faz SG de CON (CD 8 + mod. DES + prof.) ou o dano do ataque é dobrado.'],
      ]),
      sub('faca-espiritual', 'Lâmina da Alma (Soulknife)', 'Lâminas psíquicas nascidas da mente.', [
        [3, 'Lâminas Psíquicas', 'Crie lâminas de energia (1d6/1d4 psíquico, arremessáveis).'],
        [3, 'Poder Psiônico', 'Dados psiônicos: some a testes falhos; comunicação telepática.'],
        [9, 'Almas Entrelaçadas', 'Teleporte curto; invisibilidade breve com dados psiônicos.'],
        [13, 'Véu Psíquico', 'Invisibilidade por 1 hora (1×/descanso longo ou com dado).'],
        [17, 'Rasgo na Mente', 'Sua lâmina pode Atordoar (SG SAB).'],
      ]),
      sub('trapaceiro-arcano', 'Trapaceiro Arcano', 'Ladino que tempera golpes com magia.', [
        [3, 'Conjuração', 'Você conjura magias da lista de Mago usando Inteligência: 3 truques — Mãos Mágicas e mais dois (4 no nível 10) — e a lista de magias preparadas da tabela de Trapaceiro Arcano. Ao subir de nível você pode trocar uma magia preparada e um truque (exceto Mãos Mágicas).'],
        [3, 'Mão Mágica Ardilosa', 'Mão Mágica invisível; abra fechaduras e bata carteiras a distância.'],
        [9, 'Emboscada Mágica', 'Alvos que você surpreende têm desvantagem contra suas magias.'],
        [13, 'Trapaceiro Versátil', 'Use a Mão Mágica para distrair (vantagem em ataques).'],
        [17, 'Ladrão de Magias', 'Roube magias conjuradas contra você (SG do conjurador).'],
      ], {
        spellcasting: {
          list: 'mago', ability: 'int', fromLevel: 3,
          preparedByLevel: PREP_TERCO, cantripsByLevel: CANTRIPS_TERCO,
        },
        alwaysPrepared: semprePreparadas({ 3: ['maos-magicas'] }),
      }),
    ],
  },

  // ================= FEITICEIRO =================
  {
    id: 'feiticeiro',
    name: 'Feiticeiro',
    hitDie: 6,
    primary: 'Carisma',
    saves: ['con', 'car'],
    armor: [],
    weapons: ['Simples'],
    skillChoices: ['arcanismo', 'enganacao', 'intuicao', 'intimidacao', 'persuasao', 'religiao'],
    skillCount: 2,
    caster: 'completo',
    spellAbility: 'car',
    preparedByLevel: PREP_SORC,
    preparation: 'nivel-uma',
    cantripsByLevel: CANTRIPS_4_5_6,
    startingEquipment: '2 adagas, foco arcano (cristal), pacote de masmorra e 28 PO',
    equipmentOptions: [
      eq('Lança, 2 adagas, foco arcano (cristal), pacote de masmorra e 28 PO', [
        { itemId: 'lanca' }, { itemId: 'adaga', qty: 2 }, { itemId: 'foco-arcano' }, { itemId: 'pacote-masmorra' },
      ], 28),
      soOuro(50),
    ],
    features: [
      { level: 1, name: 'Conjuração', desc: 'Você conjura magias de Feiticeiro usando Carisma.' },
      { level: 1, name: 'Feitiçaria Inata', desc: 'Bônus (2×/descanso longo): por 1 minuto, +1 na CD de magias e vantagem nos ataques de magia.' },
      { level: 2, name: 'Fonte de Magia', desc: 'Pontos de Feitiçaria = nível: converta em espaços de magia e vice-versa.' },
      { level: 2, name: 'Metamagia', desc: 'Escolha 2 opções (Magia Acelerada, Sutil, Estendida, Cuidadosa, Distante, Potencializada, Duplicada...). Mais opções nos níveis 10 e 17.' },
      subclassFeat(3, 'Origem de Feitiçaria'),
      asi(4),
      { level: 5, name: 'Restauração Feiticeira', desc: 'Em descanso curto, recupere Pontos de Feitiçaria (até metade do nível, 1×/descanso longo).' },
      { level: 6, name: 'Característica de Subclasse', desc: 'Você ganha uma característica da sua Origem.' },
      { level: 7, name: 'Feitiçaria Encarnada', desc: 'Use 2 opções de Metamagia na mesma magia.' },
      asi(8),
      { level: 10, name: 'Metamagia Extra', desc: 'Aprenda mais uma opção de Metamagia.' },
      asi(12),
      { level: 14, name: 'Característica de Subclasse', desc: 'Você ganha uma característica da sua Origem.' },
      asi(16),
      { level: 17, name: 'Metamagia Extra', desc: 'Aprenda mais uma opção de Metamagia.' },
      { level: 18, name: 'Característica de Subclasse', desc: 'Você ganha uma característica da sua Origem.' },
      epicBoon(),
      { level: 20, name: 'Apoteose Arcana', desc: 'Em Feitiçaria Inata, use 1 opção de Metamagia grátis por turno.' },
    ],
    resources: [
      { id: 'pontos-de-feiticaria', name: 'Pontos de Feitiçaria', fromLevel: 2, recharge: 'longo', max: (lv) => lv },
      { id: 'feiticaria-inata', name: 'Feitiçaria Inata', fromLevel: 1, recharge: 'longo', max: () => 2 },
    ],
    subclasses: [
      sub('draconica', 'Feitiçaria Dracônica', 'Sangue de dragão corre em suas veias.', [
        [3, 'Magias Dracônicas', 'Alterar-se, Comando, Orbe Cromático e Sopro de Dragão ficam sempre preparadas; mais magias nos níveis 5, 7 e 9.'],
        [3, 'Resiliência Dracônica', 'PV +3 e +1/nível; sem armadura, CA = 10 + DES + CAR.'],
        [6, 'Afinidade Elemental', 'Some CAR ao dano do seu elemento dracônico; resistência a ele.'],
        [14, 'Asas de Dragão', 'Bônus: asas espectrais (voo 18 m).'],
        [18, 'Presença de Dragão', 'Aura de temor ou fascínio (SG SAB).'],
      ], {
        alwaysPrepared: semprePreparadas({
          3: ['alterar-se', 'comando', 'orbe-cromatico', 'sopro-de-dragao'],
          5: ['medo', 'voo'],
          7: ['enfeiticar-monstro', 'olho-arcano'],
          9: ['invocar-dragao', 'lendas-e-historias'],
        }),
      }),
      sub('selvagem', 'Feitiçaria Selvagem', 'Magia caótica e imprevisível.', [
        [3, 'Surto de Magia Selvagem', 'Suas magias podem disparar efeitos aleatórios da tabela de Magia Selvagem.'],
        [3, 'Marés do Caos', 'Ganhe vantagem em um Teste D20; recarrega com um surto.'],
        [6, 'Sorte Dobrada', 'Role 2d20 ao gastar Pontos de Feitiçaria em Testes D20.'],
        [14, 'Caos Controlado', 'Role duas vezes na tabela de surtos e escolha.'],
        [18, 'Bombardeio Arcano', 'Dados máximos de dano explodem (role de novo e some).'],
      ]),
      sub('mecanica', 'Feitiçaria Mecânica (Relojoaria)', 'A ordem absoluta de Mechanus.', [
        [3, 'Magias Mecânicas', 'Alarme, Auxílio, Proteção Contra o Bem e o Mal e Restauração Menor ficam sempre preparadas; mais magias nos níveis 5, 7 e 9.'],
        [3, 'Restaurar Equilíbrio', 'Cancele vantagem/desvantagem em Testes D20 próximos.'],
        [6, 'Bastião da Lei', 'Gaste pontos: barreira que absorve dano.'],
        [14, 'Passo entre Instantes', 'Reação: previna dano e reordene o tempo.'],
        [18, 'Ordem Absoluta', 'Cavaleiro da ordem: imunidades e auras de proteção.'],
      ], {
        alwaysPrepared: semprePreparadas({
          3: ['alarme', 'auxilio', 'protecao-contra-o-bem-e-o-mal', 'restauracao-menor'],
          5: ['dissipar-magia', 'protecao-contra-energia'],
          7: ['invocar-constructo', 'movimentacao-livre'],
          9: ['muralha-de-energia', 'restauracao-maior'],
        }),
      }),
      sub('aberrante', 'Feitiçaria Aberrante', 'Um toque do Reino Distante na sua mente.', [
        [3, 'Magias Psiônicas', 'Acalmar Emoções, Braços de Hadar, Detectar Pensamentos, Sussurros Dissonantes e Talho Mental ficam sempre preparadas; mais magias nos níveis 5, 7 e 9.'],
        [3, 'Fala Telepática', 'Telepatia com criaturas próximas.'],
        [6, 'Defesas Psíquicas', 'Resistência a dano psíquico; vantagem contra Amedrontado e Enfeitiçado.'],
        [14, 'Revelação em Carne', 'Gaste pontos: voe, nade, atravesse frestas.'],
        [18, 'Distorcer Realidade', 'Explosão psíquica devastadora em área.'],
      ], {
        alwaysPrepared: semprePreparadas({
          3: ['acalmar-emocoes', 'bracos-de-hadar', 'detectar-pensamentos', 'sussurros-dissonantes', 'talho-mental'],
          5: ['fome-de-hadar', 'remeter'],
          7: ['invocar-aberracao', 'tentaculos-negros-de-evard'],
          9: ['ligacao-telepatica-de-rary', 'telecinese'],
        }),
      }),
    ],
  },

  // ================= BRUXO =================
  {
    id: 'bruxo',
    name: 'Bruxo',
    hitDie: 8,
    primary: 'Carisma',
    saves: ['sab', 'car'],
    armor: ['Leve'],
    weapons: ['Simples'],
    skillChoices: ['arcanismo', 'enganacao', 'historia', 'intimidacao', 'investigacao', 'natureza', 'religiao'],
    skillCount: 2,
    caster: 'pacto',
    spellAbility: 'car',
    preparedByLevel: PREP_WARLOCK,
    preparation: 'nivel-uma',
    cantripsByLevel: CANTRIPS_2_3_4,
    // Arcanum Místico: uma magia de 6º a 9º círculo, conjurável 1×/descanso longo.
    spellPicks: [6, 7, 8, 9].map((circulo, i) => ({
      id: `arcanum-mistico-${circulo}`,
      source: `Arcanum Místico (${circulo}º círculo)`,
      level: 11 + i * 2,
      count: 1,
      fromClasses: ['bruxo'],
      spellLevel: circulo,
      abilities: ['car'] as const as AbilityKey[],
      freeUses: 'longo' as const,
      nota: 'Conjurável 1×/descanso longo sem gastar espaço de Pacto.',
    })),
    startingEquipment: 'Armadura de couro, foice, 2 adagas, foco arcano (orbe), livro de conhecimento, pacote de estudioso e 15 PO',
    equipmentOptions: [
      eq('Armadura de couro, foice curta, 2 adagas, foco arcano (orbe), livro de ocultismo, pacote de estudioso e 15 PO', [
        { itemId: 'couro' }, { itemId: 'foice-curta' }, { itemId: 'adaga', qty: 2 },
        { itemId: 'foco-arcano' }, { itemId: 'livro' }, { itemId: 'pacote-estudioso' },
      ], 15),
      soOuro(100),
    ],
    features: [
      { level: 1, name: 'Conjuração de Pacto', desc: 'Espaços de Pacto: poucos, mas sempre no nível máximo e recuperados em descanso curto.' },
      { level: 1, name: 'Invocações Místicas', desc: 'Fragmentos de poder (1 no nível 1, até 10 no 20): Explosão Agonizante, Visão Diabólica, Pacto da Lâmina/da Corrente/do Tomo etc.' },
      { level: 2, name: 'Magical Cunning', desc: 'Astúcia Mágica: 1×/dia, recupere metade dos espaços de Pacto com 1 minuto de ritual.' },
      subclassFeat(3, 'Patrono Sobrenatural'),
      asi(4),
      { level: 5, name: 'Invocações (3)', desc: 'Você tem mais Invocações Místicas (total conforme a tabela).' },
      { level: 6, name: 'Característica de Subclasse', desc: 'Você ganha uma característica do seu Patrono.' },
      asi(8),
      { level: 9, name: 'Contato com o Patrono', desc: 'Contate seu patrono diretamente: conjure Contatar Outro Plano 1×/descanso longo.' },
      { level: 10, name: 'Característica de Subclasse', desc: 'Você ganha uma característica do seu Patrono.' },
      { level: 11, name: 'Arcanum Místico (6º)', desc: 'Escolha uma magia de 6º nível: conjure 1×/descanso longo sem espaço.' },
      asi(12),
      { level: 13, name: 'Arcanum Místico (7º)', desc: 'Uma magia de 7º nível, 1×/descanso longo.' },
      { level: 14, name: 'Característica de Subclasse', desc: 'Você ganha uma característica do seu Patrono.' },
      { level: 15, name: 'Arcanum Místico (8º)', desc: 'Uma magia de 8º nível, 1×/descanso longo.' },
      asi(16),
      { level: 17, name: 'Arcanum Místico (9º)', desc: 'Uma magia de 9º nível, 1×/descanso longo.' },
      epicBoon(),
      { level: 20, name: 'Mestre Sobrenatural', desc: 'Astúcia Mágica recupera todos os espaços de Pacto.' },
    ],
    resources: [
      { id: 'astucia-magica', name: 'Astúcia Mágica', fromLevel: 2, recharge: 'longo', max: () => 1 },
    ],
    subclasses: [
      sub('arquifada', 'Patrono Arquifada', 'Um senhor feérico caprichoso e poderoso.', [
        [3, 'Magias de Pacto da Arquifada', 'Acalmar Emoções, Fogo das Fadas, Força Espectral, Passo Nebuloso e Sono ficam sempre preparadas; mais magias nos níveis 5, 7 e 9.'],
        [3, 'Passos Feéricos', 'Passo Nebuloso sem gastar espaço (usos = CAR, mín. 1) por descanso longo.'],
        [6, 'Escape Enevoado', 'Reação ao sofrer dano: teleporte-se com um benefício.'],
        [10, 'Defesas Enfeitiçadas', 'Imunidade a Enfeitiçado; redirecione encantamentos.'],
        [14, 'Magia Sedutora', 'Após conjurar Encantamento ou Ilusão, conjure Passo Nebuloso de graça na mesma ação.'],
      ], {
        alwaysPrepared: semprePreparadas({
          3: ['acalmar-emocoes', 'fogo-das-fadas', 'forca-espectral', 'passo-nebuloso', 'sono'],
          5: ['crescimento-de-plantas', 'piscar'],
          7: ['dominar-fera', 'invisibilidade-maior'],
          9: ['dominar-pessoa', 'similaridade'],
        }),
      }),
      sub('celestial', 'Patrono Celestial', 'Poder dos Planos Superiores.', [
        [3, 'Magias do Celestial', 'Auxílio, Chama Sagrada, Curar Ferimentos, Luz, Raio Guia e Restauração Menor ficam sempre preparadas; mais magias nos níveis 5, 7 e 9.'],
        [3, 'Luz Curativa', 'Reserva de d6s de cura (1 + nível); cure como Bônus.'],
        [6, 'Alma Radiante', 'Resistência radiante; some CAR ao dano radiante/ígneo 1×/turno.'],
        [10, 'Resiliência Celestial', 'PV temporário para você e aliados após descansos.'],
        [14, 'Vingança Flamejante', 'Ao cair a 0 PV, exploda em luz radiante e levante-se.'],
      ], {
        alwaysPrepared: semprePreparadas({
          3: ['auxilio', 'chama-sagrada', 'curar-ferimentos', 'luz', 'raio-guia', 'restauracao-menor'],
          5: ['luz-do-dia', 'revivificar'],
          7: ['defensor-da-fe', 'muralha-de-fogo'],
          9: ['convocar-celestial', 'restauracao-maior'],
        }),
      }),
      sub('infernal', 'Patrono Ínfero (Fiend)', 'Um pacto com poderes dos Planos Inferiores.', [
        [3, 'Magias de Pacto do Ínfero', 'Comando, Mãos Flamejantes, Raio Ardente e Sugestão ficam sempre preparadas; mais magias nos níveis 5, 7 e 9.'],
        [3, 'Bênção do Tinhoso', 'Ao reduzir um inimigo a 0 PV, ganhe PV temporário (CAR + nível).'],
        [6, 'Sorte do Tinhoso', 'Some 1d10 a um Teste D20 (1×/descanso curto).'],
        [10, 'Resiliência Ínfera', 'Escolha uma resistência a dano a cada descanso.'],
        [14, 'Arremessar Através do Inferno', 'Ao acertar, envie o alvo numa viagem infernal: 8d10 psíquico (SG CAR).'],
      ], {
        alwaysPrepared: semprePreparadas({
          3: ['comando', 'maos-flamejantes', 'raio-ardente', 'sugestao'],
          5: ['bola-de-fogo', 'nuvem-fetida'],
          7: ['escudo-ardente', 'muralha-de-fogo'],
          9: ['missao', 'praga-de-insetos'],
        }),
      }),
      sub('grande-antigo', 'Patrono Grande Antigo', 'Entidades incompreensíveis de além das estrelas.', [
        [3, 'Magias de Pacto do Grande Antigo', 'Detectar Pensamentos, Força Espectral, Gargalhada Nefasta de Tasha e Sussurros Dissonantes ficam sempre preparadas; mais magias nos níveis 5, 7 e 9.'],
        [3, 'Magias Psíquicas', 'Troque o dano das suas magias de Bruxo para Psíquico; Encantamento e Ilusão sem componentes V/S.'],
        [3, 'Mente Desperta', 'Conexão telepática com uma criatura próxima.'],
        [6, 'Combatente Clarividente', 'A criatura ligada a você faz salvaguarda de SAB ou fica em desvantagem contra você.'],
        [10, 'Proteção Talássica', 'PV temporário ao conjurar; resistência psíquica.'],
        [14, 'Criar Escravo (Servo)', 'Enfeitice uma criatura tocada permanentemente (SG SAB).'],
      ], {
        alwaysPrepared: semprePreparadas({
          3: ['detectar-pensamentos', 'forca-espectral', 'gargalhada-nefasta-de-tasha', 'sussurros-dissonantes'],
          5: ['clarividencia', 'fome-de-hadar'],
          7: ['confusao', 'invocar-aberracao'],
          9: ['modificar-memoria', 'telecinese'],
        }),
      }),
    ],
  },

  // ================= MAGO =================
  {
    id: 'mago',
    name: 'Mago',
    hitDie: 6,
    primary: 'Inteligência',
    saves: ['int', 'sab'],
    armor: [],
    weapons: ['Simples'],
    skillChoices: ['arcanismo', 'historia', 'intuicao', 'investigacao', 'medicina', 'natureza', 'religiao'],
    skillCount: 2,
    caster: 'completo',
    spellAbility: 'int',
    preparedByLevel: PREP_WIZARD,
    preparation: 'grimorio',
    cantripsByLevel: CANTRIPS_3_4_5,
    startingEquipment: '2 adagas, foco arcano (bastão), robe, grimório, pacote de estudioso e 5 PO',
    equipmentOptions: [
      eq('2 adagas, foco arcano (bastão), robe, grimório, pacote de estudioso e 5 PO', [
        { itemId: 'adaga', qty: 2 }, { itemId: 'foco-arcano' }, { itemId: 'robe' },
        { itemId: 'grimorio' }, { itemId: 'pacote-estudioso' },
      ], 5),
      soOuro(55),
    ],
    features: [
      { level: 1, name: 'Conjuração', desc: 'Você conjura magias de Mago usando Inteligência; seu grimório guarda suas magias (6 iniciais, +2 por nível).' },
      { level: 1, name: 'Ritualista', desc: 'Conjure magias com a marcação Ritual do grimório sem prepará-las.' },
      { level: 1, name: 'Recuperação Arcana', desc: '1×/dia em descanso curto, recupere espaços de magia (soma dos níveis = metade do nível de Mago, arredondado para cima).' },
      { level: 2, name: 'Estudioso', desc: 'Perícia Aprimorada em Arcanismo, História, Investigação, Medicina, Natureza ou Religião.' },
      subclassFeat(3, 'Tradição Arcana'),
      asi(4),
      { level: 5, name: 'Memorizar Magia', desc: 'Após descanso curto, troque uma magia preparada.' },
      { level: 6, name: 'Característica de Subclasse', desc: 'Você ganha uma característica da sua Tradição.' },
      asi(8),
      { level: 10, name: 'Característica de Subclasse', desc: 'Você ganha uma característica da sua Tradição.' },
      asi(12),
      { level: 14, name: 'Característica de Subclasse', desc: 'Você ganha uma característica da sua Tradição.' },
      asi(16),
      { level: 18, name: 'Maestria em Magia', desc: 'Escolha uma magia de 1º e uma de 2º nível: conjure-as à vontade sem gastar espaços.' },
      epicBoon(),
      { level: 20, name: 'Magias Exemplares', desc: 'Duas magias de 3º círculo sempre preparadas: conjure cada uma 1× sem gastar espaço; recupera os usos em descanso curto ou longo.' },
    ],
    resources: [
      { id: 'recuperacao-arcana', name: 'Recuperação Arcana', fromLevel: 1, recharge: 'longo', max: () => 1 },
    ],
    subclasses: [
      sub('abjurador', 'Abjurador', 'Mestre das proteções mágicas.', [
        [3, 'Escudo Arcano', 'Escudo protetor com PV = 2× nível + INT; absorve dano por você.'],
        [6, 'Recarga Projetada', 'Recarregue o Escudo Arcano com espaços de magia.'],
        [10, 'Rompe-Magia', 'Contramagia e Dissipar Magia sempre preparadas; some seu bônus de proficiência ao teste e conjure Dissipar Magia como ação Bônus.'],
        [14, 'Resistência a Magias', 'Vantagem em salvaguardas contra magias; resistência ao dano delas.'],
      ], {
        alwaysPrepared: semprePreparadas({ 10: ['contramagia', 'dissipar-magia'] }),
      }),
      sub('adivinho', 'Adivinho', 'Vislumbres do futuro moldam o presente.', [
        [3, 'Portento', 'Role 2d20 após descanso longo; substitua qualquer Teste D20 por eles.'],
        [6, 'Adivinhação Perita', 'Magias de Adivinhação de 2º+ restauram espaços menores.'],
        [10, 'O Terceiro Olho', 'Visão no escuro, ler idiomas ou ver invisível.'],
        [14, 'Portento Maior', 'Role 3d20 no Portento.'],
      ]),
      sub('evocador', 'Evocador', 'Poder destrutivo dos elementos.', [
        [3, 'Esculpir Magias', 'Aliados são poupados das suas evocações em área.'],
        [3, 'Truque Potente', 'Truques causam meio dano mesmo em salvaguarda bem-sucedida.'],
        [6, 'Evocação Potencializada', 'Some INT ao dano de magias de Evocação.'],
        [10, 'Contra-ataque Elemental', 'Reação: retribua dano elemental.'],
        [14, 'Sobrecarga', 'Maximize o dano de uma Evocação de 5º nível ou menor (1×/descanso longo).'],
      ]),
      sub('ilusionista', 'Ilusionista', 'A realidade é uma sugestão.', [
        [3, 'Ilusões Aprimoradas', 'Ilusão Menor grátis e melhor; magias de ilusão sem componentes verbais.'],
        [6, 'Criaturas Espectrais', 'Convocar Feérico e Invocar Fera sempre preparadas; podem virar Ilusão e ser conjuradas sem espaço (com metade dos PV).'],
        [10, 'Eu Ilusório', 'Reação: um duplo ilusório faz um ataque errar você (recarrega com magia de ilusão).'],
        [14, 'Realidade Ilusória', 'Torne um objeto ilusório real por 1 minuto.'],
      ], {
        alwaysPrepared: semprePreparadas({ 6: ['convocar-feerico', 'invocar-fera'] }),
      }),
    ],
  },
]

export const classById = (id: string) => CLASSES.find((c) => c.id === id)

// ---------- Espaços de magia ----------
/** Tabela de conjurador completo: [nível do personagem - 1][nível do espaço - 1] */
export const FULL_CASTER_SLOTS: number[][] = [
  [2, 0, 0, 0, 0, 0, 0, 0, 0],
  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  [4, 2, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 2, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 1, 0, 0, 0, 0, 0],
  [4, 3, 3, 2, 0, 0, 0, 0, 0],
  [4, 3, 3, 3, 1, 0, 0, 0, 0],
  [4, 3, 3, 3, 2, 0, 0, 0, 0],
  [4, 3, 3, 3, 2, 1, 0, 0, 0],
  [4, 3, 3, 3, 2, 1, 0, 0, 0],
  [4, 3, 3, 3, 2, 1, 1, 0, 0],
  [4, 3, 3, 3, 2, 1, 1, 0, 0],
  [4, 3, 3, 3, 2, 1, 1, 1, 0],
  [4, 3, 3, 3, 2, 1, 1, 1, 0],
  [4, 3, 3, 3, 2, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 2, 1, 1],
]

/** Meio conjurador (Paladino/Patrulheiro 2024, com espaços no nível 1) */
export const HALF_CASTER_SLOTS: number[][] = [
  [2, 0, 0, 0, 0],
  [2, 0, 0, 0, 0],
  [3, 0, 0, 0, 0],
  [3, 0, 0, 0, 0],
  [4, 2, 0, 0, 0],
  [4, 2, 0, 0, 0],
  [4, 3, 0, 0, 0],
  [4, 3, 0, 0, 0],
  [4, 3, 2, 0, 0],
  [4, 3, 2, 0, 0],
  [4, 3, 3, 0, 0],
  [4, 3, 3, 0, 0],
  [4, 3, 3, 1, 0],
  [4, 3, 3, 1, 0],
  [4, 3, 3, 2, 0],
  [4, 3, 3, 2, 0],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2],
]

/**
 * Conjurador de 1/3 (Cavaleiro Místico e Trapaceiro Arcano): a conjuração só
 * começa no 3º nível, então as duas primeiras linhas são vazias.
 */
export const THIRD_CASTER_SLOTS: number[][] = [
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [2, 0, 0, 0],
  [3, 0, 0, 0],
  [3, 0, 0, 0],
  [3, 0, 0, 0],
  [4, 2, 0, 0],
  [4, 2, 0, 0],
  [4, 2, 0, 0],
  [4, 3, 0, 0],
  [4, 3, 0, 0],
  [4, 3, 0, 0],
  [4, 3, 2, 0],
  [4, 3, 2, 0],
  [4, 3, 2, 0],
  [4, 3, 3, 0],
  [4, 3, 3, 0],
  [4, 3, 3, 0],
  [4, 3, 3, 1],
  [4, 3, 3, 1],
]

/** Pacto do Bruxo: [quantidade de espaços, nível do espaço] */
export const PACT_SLOTS: [number, number][] = [
  [1, 1], [2, 1], [2, 2], [2, 2], [2, 3], [2, 3], [2, 4], [2, 4], [2, 5], [2, 5],
  [3, 5], [3, 5], [3, 5], [3, 5], [3, 5], [3, 5], [4, 5], [4, 5], [4, 5], [4, 5],
]
