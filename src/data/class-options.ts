import type { FeatureOption, FeaturePick } from '../types'

/**
 * Opções das características que oferecem uma lista para escolher (ou uma lista
 * concedida por inteiro): Manobras do Mestre de Batalha, Invocações Místicas do
 * Bruxo, Metamagia do Feiticeiro, Canalizar Divindade do Clérigo e do Paladino,
 * habilidades de Foco do Monge e os dados psiônicos.
 *
 * Estes grupos aparecem em três lugares: no assistente de criação, no de
 * evolução (quando o nível libera novas escolhas) e na aba de Ações — lá cada
 * opção vira um botão que desconta o recurso correspondente.
 */

/** Preenche uma tabela "nível → quantidade" repetindo o valor até o nível 20. */
const porNivel = (marcos: Record<number, number>): number[] => {
  const out: number[] = []
  let atual = 0
  for (let lv = 1; lv <= 20; lv++) {
    if (marcos[lv] !== undefined) atual = marcos[lv]
    out.push(atual)
  }
  return out
}

/** Mesma ideia da tabela acima, mas para o dado associado (d8 → d10 → d12). */
const dadoPorNivel = (marcos: Record<number, string>): string[] => {
  const out: string[] = []
  let atual = ''
  for (let lv = 1; lv <= 20; lv++) {
    if (marcos[lv] !== undefined) atual = marcos[lv]
    out.push(atual)
  }
  return out
}

const opt = (id: string, name: string, desc: string, extra: Partial<FeatureOption> = {}): FeatureOption =>
  ({ id, name, desc, ...extra })

// ================= GUERREIRO · MESTRE DE BATALHA =================
/** As 20 manobras do Livro do Jogador de 2024. Todas gastam 1 Dado de Superioridade. */
export const MANOBRAS: FeaturePick = {
  id: 'manobras',
  name: 'Manobras',
  desc: 'Cada manobra gasta um Dado de Superioridade. Você troca uma manobra por outra sempre que ganha um nível de Guerreiro.',
  resourceId: 'dados-de-superioridade',
  countByLevel: porNivel({ 3: 3, 7: 5, 10: 7, 15: 9 }),
  dieByLevel: dadoPorNivel({ 3: 'd8', 10: 'd10', 18: 'd12' }),
  nota: 'O dado rolado soma-se ao efeito da manobra; a CD das manobras é 8 + proficiência + FOR ou DES.',
  options: [
    opt('ataque-ameacador', 'Ataque Ameaçador', 'Ao acertar, some o dado ao dano e force uma salvaguarda de Sabedoria: falhando, o alvo fica Amedrontado por você até o fim do seu próximo turno.'),
    opt('ataque-amplo', 'Ataque Amplo', 'Ao acertar um ataque corpo a corpo, cause dano igual ao dado a uma segunda criatura a até 1,5 m do alvo e dentro do seu alcance.'),
    opt('ataque-de-manobra', 'Ataque de Manobra', 'Ao acertar, some o dado ao dano e escolha um aliado que possa ver: ele usa a reação para mover metade do deslocamento sem provocar ataques de oportunidade.'),
    opt('ataque-desarmante', 'Ataque Desarmante', 'Ao acertar, some o dado ao dano e force salvaguarda de Força: falhando, o alvo derruba um item à sua escolha que esteja segurando.'),
    opt('ataque-empurrao', 'Ataque Empurrão', 'Ao acertar, some o dado ao dano e force salvaguarda de Força: falhando, o alvo (Grande ou menor) é empurrado até 4,5 m.'),
    opt('ataque-investida', 'Ataque Investida', 'Aumente o alcance de um ataque corpo a corpo em 1,5 m nesta jogada; ao acertar, some o dado ao dano.'),
    opt('ataque-preciso', 'Ataque Preciso', 'Some o dado à jogada de ataque — você pode usar esta manobra depois de ver o resultado do d20, mas antes de saber se acertou.'),
    opt('ataque-provocador', 'Ataque Provocador', 'Ao acertar, some o dado ao dano e force salvaguarda de Sabedoria: falhando, o alvo tem desvantagem em ataques contra qualquer criatura que não seja você até o fim do seu próximo turno.'),
    opt('ataque-rasteira', 'Ataque Rasteira', 'Ao acertar, some o dado ao dano e force salvaguarda de Força: falhando, o alvo (Grande ou menor) fica Caído.'),
    opt('aparar', 'Aparar', 'Reação, ao sofrer dano de um ataque corpo a corpo: reduza o dano no valor do dado + seu modificador de Força ou Destreza.'),
    opt('avaliacao-tatica', 'Avaliação Tática', 'Ao fazer um teste de Investigação, História ou Intuição, some o dado ao resultado.'),
    opt('emboscada', 'Emboscada', 'Some o dado a um teste de Furtividade ou à sua Iniciativa.'),
    opt('golpe-do-comandante', 'Golpe do Comandante', 'Abra mão de um dos seus ataques: um aliado usa a reação para atacar imediatamente, somando o dado ao dano dele.'),
    opt('golpe-perturbador', 'Golpe Perturbador', 'Ao acertar, some o dado ao dano; a próxima jogada de ataque de qualquer criatura contra o alvo tem vantagem.'),
    opt('isca-e-troca', 'Isca e Troca', 'Troque de lugar com um aliado a até 1,5 m (gasta 1,5 m do seu deslocamento cada um) e some o dado à CA de um dos dois até o início do seu próximo turno.'),
    opt('finta', 'Finta', 'Ação Bônus: tenha vantagem no próximo ataque contra uma criatura no seu alcance neste turno; ao acertar, some o dado ao dano.'),
    opt('movimento-evasivo', 'Movimento Evasivo', 'Ao usar a ação Mover, some o dado à sua CA até parar de se mover.'),
    opt('presenca-imponente', 'Presença Imponente', 'Ao fazer um teste de Persuasão, Enganação ou Intimidação, some o dado ao resultado.'),
    opt('reagrupar', 'Reagrupar', 'Ação Bônus: um aliado que possa ver ou ouvir você ganha PV temporários iguais ao dado + seu modificador de Força ou Destreza.'),
    opt('resposta', 'Resposta', 'Reação, quando uma criatura erra um ataque corpo a corpo contra você: faça um ataque corpo a corpo contra ela e some o dado ao dano.'),
  ],
}

/** Poder Psiônico do Guerreiro Psíquico — usos concedidos, sem escolha. */
export const PODER_PSIONICO_GUERREIRO: FeaturePick = {
  id: 'poder-psionico-guerreiro',
  name: 'Poder Psiônico',
  desc: 'Suas capacidades psiônicas gastam Dados de Energia Psiônica.',
  resourceId: 'energia-psionica-guerreiro',
  dieByLevel: dadoPorNivel({ 3: 'd6', 7: 'd8', 15: 'd10', 18: 'd12' }),
  options: [
    opt('golpe-protegido', 'Golpe Protegido', 'Reação, ao ser atingido: reduza o dano no valor do dado + seu modificador de Inteligência.', { level: 3 }),
    opt('golpe-psionico', 'Golpe Psiônico', 'Uma vez por turno, ao acertar um ataque: cause dano psíquico extra igual ao dado + seu modificador de Inteligência.', { level: 3 }),
    opt('movimento-telecinetico', 'Movimento Telecinético', 'Ação Bônus: mova telecineticamente um objeto Enorme ou menor (ou uma criatura Média ou menor disposta) até 9 m. Este uso não gasta o dado nas primeiras vezes do dia.', { level: 3 }),
  ],
}

// ================= LADINO · LÂMINA DA ALMA =================
export const PODER_PSIONICO_LADINO: FeaturePick = {
  id: 'poder-psionico-ladino',
  name: 'Poder Psiônico',
  desc: 'As capacidades da sua mente-lâmina gastam Dados de Energia Psiônica.',
  resourceId: 'energia-psionica-ladino',
  dieByLevel: dadoPorNivel({ 3: 'd6', 5: 'd8', 11: 'd10', 17: 'd12' }),
  options: [
    opt('sussurros-psionicos', 'Sussurros Psiônicos', 'Fale telepaticamente com criaturas que você possa ver; a duração depende do dado rolado.', { level: 3 }),
    opt('salto-psionico', 'Salto Psiônico', 'Ação Bônus: seu deslocamento de salto aumenta em 3 m × o dado rolado neste turno.', { level: 3 }),
    opt('lamina-psionica', 'Lâminas Psíquicas', 'Manifeste lâminas de energia psíquica (1d6 psíquico, Acuidade, Leve, Arremesso 18/36 m). Manifestá-las não gasta dado.', { cost: 0, level: 3 }),
  ],
}

// ================= FEITICEIRO · METAMAGIA =================
/** As opções de Metamagia gastam Pontos de Feitiçaria — o custo vai em `cost`. */
export const METAMAGIA: FeaturePick = {
  id: 'metamagia',
  name: 'Metamagia',
  desc: 'Escolha opções de Metamagia. Você pode usar apenas uma por conjuração, exceto Magia Acelerada combinada com outra.',
  resourceId: 'pontos-de-feiticaria',
  countByLevel: porNivel({ 2: 2, 10: 3, 17: 4 }),
  nota: 'Sempre que ganhar um nível de Feiticeiro você pode trocar uma opção de Metamagia por outra.',
  options: [
    opt('acelerada', 'Magia Acelerada', 'Mude o tempo de conjuração de uma magia de 1 ação para 1 ação Bônus neste turno.', { cost: 2 }),
    opt('ampliada', 'Magia Ampliada', 'Um alvo da magia tem desvantagem na primeira salvaguarda contra ela.', { cost: 3 }),
    opt('buscadora', 'Magia Buscadora', 'Rerrole uma jogada de ataque de magia que tenha errado (use o novo resultado).', { cost: 2 }),
    opt('cuidadosa', 'Magia Cuidadosa', 'Escolha até seu modificador de Carisma em criaturas: elas passam automaticamente na salvaguarda contra a magia.', { cost: 1 }),
    opt('distante', 'Magia Distante', 'Dobre o alcance da magia, ou torne uma magia de toque em alcance de 9 m.', { cost: 1 }),
    opt('duplicada', 'Magia Duplicada', 'Uma magia que tem um único alvo passa a atingir um segundo alvo no alcance.', { cost: 1 }),
    opt('empoderada', 'Magia Empoderada', 'Rerrole até seu modificador de Carisma em dados de dano da magia e use os novos resultados.', { cost: 1 }),
    opt('estendida', 'Magia Estendida', 'Dobre a duração de uma magia (até no máximo 24 horas).', { cost: 1 }),
    opt('sutil', 'Magia Sutil', 'Conjure sem componentes Verbais, Somáticos ou ambos.', { cost: 1 }),
    opt('transmutada', 'Magia Transmutada', 'Troque o tipo de dano da magia entre Ácido, Elétrico, Fogo, Frio, Trovão ou Veneno.', { cost: 1 }),
  ],
}

// ================= BRUXO · INVOCAÇÕES MÍSTICAS =================
/**
 * As Invocações Místicas incluem os Pactos (da Lâmina, da Corrente e do Tomo).
 * O total conhecido segue a tabela do Bruxo (PHB 2024): 1 no nível 1, 3 no 2,
 * 5 no 5, 6 no 7, 7 no 9, 8 no 12, 9 no 15 e 10 no 18.
 */
export const INVOCACOES_MISTICAS: FeaturePick = {
  id: 'invocacoes-misticas',
  name: 'Invocações Místicas',
  desc: 'Fragmentos de conhecimento proibido concedidos pelo seu patrono — entre eles os Pactos da Lâmina, da Corrente e do Tomo. Ao ganhar um nível de Bruxo você pode trocar uma invocação por outra que atenda aos pré-requisitos.',
  countByLevel: porNivel({ 1: 1, 2: 3, 5: 5, 7: 6, 9: 7, 12: 8, 15: 9, 18: 10 }),
  nota: 'Cada invocação só pode ser escolhida uma vez e alguns pré-requisitos exigem um nível de Bruxo mais alto ou um Pacto específico.',
  options: [
    // --- os três Pactos ---
    opt('pacto-da-lamina', 'Pacto da Lâmina', 'Ação Bônus: conjure uma arma de pacto (qualquer arma Simples ou Marcial à sua escolha) na sua mão, ou transforme uma arma mágica em arma de pacto. Você tem proficiência com ela, pode usar Carisma nos ataques e no dano, e o dano pode ser Necrótico, Psíquico ou Radiante.'),
    opt('pacto-da-corrente', 'Pacto da Corrente', 'Você aprende Encontrar Famíliar e a conjura como ritual sem gastar espaço. Além das formas normais, o famíliar pode ser um Diabrete, Pseudodragão, Quasit ou Sprite, e pode atacar com a reação dele quando você abre mão de um dos seus ataques.'),
    opt('pacto-do-tomo', 'Pacto do Tomo', 'Você ganha um Livro das Sombras com 3 truques e 2 magias de ritual de 1º círculo de qualquer lista. Os truques não contam no seu limite e os rituais são conjurados só como ritual, sem gastar espaço.'),

    // --- nível 1 ---
    opt('armadura-das-sombras', 'Armadura das Sombras', 'Você pode conjurar Armadura Arcana em si mesmo à vontade, sem gastar espaço de magia.'),
    opt('explosao-agonizante', 'Explosão Agonizante', 'Escolha um truque de Bruxo que cause dano: some seu modificador de Carisma ao dano dele.'),
    opt('explosao-repelente', 'Explosão Repelente', 'Quando acertar uma criatura com Rajada Mística, você pode empurrá-la até 3 m em linha reta.'),
    opt('lanca-mistica', 'Lança Mística', 'O alcance da sua Rajada Mística sobe para 90 m.'),
    opt('licoes-dos-primevos', 'Lições dos Primevos', 'Você ganha Perícia Aprimorada em uma perícia à sua escolha (pode ser escolhida mais de uma vez).'),
    opt('mascara-de-muitas-faces', 'Máscara de Muitas Faces', 'Você pode conjurar Disfarçar-se à vontade, sem gastar espaço de magia.'),
    opt('mente-mistica', 'Mente Mística', 'Você tem vantagem nas salvaguardas de Constituição para manter a concentração numa magia.'),
    opt('olhar-das-duas-mentes', 'Olhar das Duas Mentes', 'Ação: toque uma criatura disposta e perceba pelos sentidos dela por 1 hora, mantendo os seus.'),
    opt('salto-sobrenatural', 'Salto Sobrenatural', 'Você pode conjurar Salto em si mesmo à vontade, sem gastar espaço de magia.'),
    opt('vigor-diabolico', 'Vigor Diabólico', 'Você pode conjurar Falsa Vida em si mesmo à vontade, no 1º círculo, sem gastar espaço de magia.'),
    opt('visao-diabolica', 'Visão Diabólica', 'Você enxerga normalmente na escuridão, mágica ou não, até 36 m.'),
    opt('visoes-nebulosas', 'Visões Nebulosas', 'Você pode conjurar Imagem Silenciosa à vontade, sem gastar espaço de magia.'),

    // --- pré-requisitos de nível ---
    opt('dadiva-das-profundezas', 'Dádiva das Profundezas', 'Você pode respirar debaixo d\'água, ganha deslocamento de natação igual ao seu deslocamento e pode conjurar Respirar na Água 1×/descanso longo sem gastar espaço.', { level: 5 }),
    opt('lamina-sedenta', 'Lâmina Sedenta', 'Ao usar a ação Atacar com a arma de pacto, você pode atacar duas vezes com ela.', { level: 5, requires: 'pacto-da-lamina' }),
    opt('golpe-mistico', 'Golpe Místico', 'Ao acertar com a arma de pacto, gaste um espaço de Pacto para causar 1d8 de dano de Força extra por círculo do espaço e derrubar o alvo (Grande ou menor).', { level: 5, requires: 'pacto-da-lamina' }),
    opt('investidura-do-mestre-da-corrente', 'Investidura do Mestre da Corrente', 'Seu famíliar ganha deslocamento de voo, resistência a dano e a possibilidade de impor desvantagem em salvaguardas contra as suas magias.', { level: 5, requires: 'pacto-da-corrente' }),
    opt('mestre-das-formas-miriades', 'Mestre das Formas Miríades', 'Você pode conjurar Alterar-se à vontade, sem gastar espaço de magia.', { level: 5 }),
    opt('um-com-as-sombras', 'Um com as Sombras', 'Você pode conjurar Invisibilidade em si mesmo à vontade, sem gastar espaço de magia.', { level: 5 }),
    opt('sussurros-do-tumulo', 'Sussurros do Túmulo', 'Você pode conjurar Falar com os Mortos à vontade, sem gastar espaço de magia.', { level: 7 }),
    opt('passo-ascendente', 'Passo Ascendente', 'Você pode conjurar Levitação em si mesmo à vontade, sem gastar espaço de magia.', { level: 9 }),
    opt('dadiva-dos-protetores', 'Dádiva dos Protetores', 'Escreva nomes no seu Livro das Sombras: quando um deles cairia a 0 PV, ele fica com 1 PV. Recarrega em descanso longo.', { level: 9, requires: 'pacto-do-tomo' }),
    opt('visoes-de-reinos-distantes', 'Visões de Reinos Distantes', 'Você pode conjurar Olho Arcano à vontade, sem gastar espaço de magia.', { level: 9 }),
    opt('lamina-devoradora', 'Lâmina Devoradora', 'A Lâmina Sedenta passa a conceder três ataques com a arma de pacto na ação Atacar.', { level: 12, requires: 'lamina-sedenta' }),
    opt('visao-de-bruxa', 'Visão de Bruxa', 'Você enxerga a forma verdadeira de qualquer criatura Metamorfa ou disfarçada por magia que esteja no seu alcance de visão.', { level: 15 }),
  ],
}

// ================= CLÉRIGO E PALADINO · CANALIZAR DIVINDADE =================
/** Opções básicas de Canalizar Divindade do Clérigo (todas concedidas). */
export const CANALIZAR_DIVINDADE_CLERIGO: FeaturePick = {
  id: 'canalizar-divindade-clerigo',
  name: 'Canalizar Divindade',
  desc: 'Cada uso gasta uma carga de Canalizar Divindade.',
  resourceId: 'canalizar-divindade',
  options: [
    opt('faisca-divina', 'Faísca Divina', 'Ação Mágica: aponte o símbolo sagrado para uma criatura a até 9 m e role dados de d8 (1 no nível 2, 2 no 7, 3 no 13 e 4 no 18) + seu modificador de Sabedoria — cure esse total, ou cause esse dano Necrótico ou Radiante (salvaguarda de Constituição reduz à metade).', { level: 2 }),
    opt('expulsar-mortos-vivos', 'Expulsar Mortos-Vivos', 'Ação Mágica: mortos-vivos a até 9 m fazem salvaguarda de Sabedoria; falhando, ficam Amedrontados e Incapacitados e fogem de você por 1 minuto.', { level: 2 }),
  ],
}

/** Opções básicas de Canalizar Divindade do Paladino (todas concedidas). */
export const CANALIZAR_DIVINDADE_PALADINO: FeaturePick = {
  id: 'canalizar-divindade-paladino',
  name: 'Canalizar Divindade',
  desc: 'Cada uso gasta uma carga de Canalizar Divindade.',
  resourceId: 'canalizar-divindade-paladino',
  options: [
    opt('sentido-divino', 'Sentido Divino', 'Ação Bônus: até o fim do próximo turno você sabe onde está qualquer Celestial, Corruptor ou Morto-Vivo a até 18 m com linha de visão, além do tipo dele.', { level: 3 }),
  ],
}

/** Uma opção de Canalizar Divindade concedida por uma subclasse. */
export const canalizarDeSubclasse = (
  resourceId: string, id: string, name: string, desc: string, level = 3,
): FeaturePick => ({
  id: `canalizar-${id}`,
  name: 'Canalizar Divindade (subclasse)',
  resourceId,
  options: [opt(id, name, desc, { level })],
})

// ================= MONGE · PONTOS DE FOCO =================
export const DISCIPLINAS_DE_FOCO: FeaturePick = {
  id: 'disciplinas-de-foco',
  name: 'Disciplinas de Foco',
  desc: 'Cada disciplina gasta Pontos de Foco.',
  resourceId: 'foco',
  options: [
    opt('rajada-de-golpes', 'Rajada de Golpes', 'Ação Bônus: faça dois ataques desarmados (três a partir do nível 10).', { cost: 1, level: 2 }),
    opt('defesa-paciente', 'Defesa Paciente', 'Ação Bônus: use Esquivar e Desengajar no mesmo turno.', { cost: 1, level: 2 }),
    opt('passo-do-vento', 'Passo do Vento', 'Ação Bônus: use Desengajar e Correr, e o seu deslocamento de salto dobra neste turno.', { cost: 1, level: 2 }),
    opt('golpe-atordoante', 'Golpe Atordoante', 'Ao acertar um ataque corpo a corpo, force uma salvaguarda de Constituição: falhando, o alvo fica Atordoado até o fim do seu próximo turno.', { cost: 1, level: 5 }),
    opt('deflexao-aprimorada', 'Deflectir Energia', 'Reação, ao sofrer dano de Ácido, Frio, Fogo, Elétrico ou Trovão: reduza o dano e devolva parte dele.', { cost: 1, level: 13 }),
    opt('movimento-vazio', 'Passos do Vazio', 'Gaste Pontos de Foco para se teleportar ou tornar-se etéreo, conforme as características de nível alto do Monge.', { cost: 2, level: 10 }),
  ],
}

// ================= BÁRBARO · FÚRIA =================
export const OPCOES_DE_FURIA: FeaturePick = {
  id: 'opcoes-de-furia',
  name: 'Fúria',
  desc: 'Entrar em Fúria gasta um uso; ela dura 10 minutos enquanto você continuar lutando.',
  resourceId: 'furia',
  options: [
    opt('entrar-em-furia', 'Entrar em Fúria', 'Ação Bônus: ganhe dano extra com ataques de Força, resistência a dano Cortante, Perfurante e de Concussão, e vantagem em testes e salvaguardas de Força.'),
  ],
}

// ================= BARDO · INSPIRAÇÃO =================
export const OPCOES_DE_INSPIRACAO: FeaturePick = {
  id: 'opcoes-de-inspiracao',
  name: 'Inspiração de Bardo',
  desc: 'Cada uso concede um Dado de Inspiração a um aliado.',
  resourceId: 'inspiracao-bardica',
  dieByLevel: dadoPorNivel({ 1: 'd6', 5: 'd8', 10: 'd10', 15: 'd12' }),
  options: [
    opt('conceder-inspiracao', 'Conceder Inspiração de Bardo', 'Ação Bônus: uma criatura a até 18 m que possa ouvir você ganha um Dado de Inspiração, que ela soma a um Teste D20 depois de rolar (antes de saber o resultado).'),
  ],
}

// ================= MAGO · RECUPERAÇÃO ARCANA =================
export const OPCOES_DE_RECUPERACAO: FeaturePick = {
  id: 'opcoes-de-recuperacao',
  name: 'Recuperação Arcana',
  desc: 'Uma vez por dia, ao terminar um descanso curto.',
  resourceId: 'recuperacao-arcana',
  options: [
    opt('recuperar-espacos', 'Recuperar Espaços de Magia', 'Recupere espaços de magia cuja soma de círculos seja igual ou menor à metade do seu nível de Mago (arredondado para cima), nenhum acima do 5º círculo.'),
  ],
}
