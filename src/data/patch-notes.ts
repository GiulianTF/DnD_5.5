/**
 * Notas de atualização mostradas na tela Novidades.
 *
 * Esta lista é a FONTE DA VERDADE da versão do app: `scripts/versao.cjs` copia
 * a versão da primeira entrada para o `package.json`, e o `vite.config.ts`
 * injeta esse número em `__APP_VERSION__`. Para publicar uma versão nova,
 * escreva a entrada nova no topo da lista e rode `npm run gerar-prod`.
 *
 * O texto é para o JOGADOR, não para quem programa: frases curtas, sem jargão
 * de código e com emoji quando ajuda a bater o olho e entender.
 */
export interface PatchNote {
  /** semver, sempre maior que o da entrada seguinte */
  version: string
  /** data de publicação, no formato aaaa-mm-dd */
  date: string
  /** manchete curta da versão */
  titulo: string
  /** frase de abertura, no clima da mesa */
  resumo: string
  destaques: { icone: string; texto: string }[]
}

export const PATCH_NOTES: PatchNote[] = [
  {
    version: '0.10.0',
    date: '2026-08-02',
    titulo: 'Passa a página',
    resumo: 'Arraste para o lado para trocar de aba na ficha. Pedido de vocês, entregue. 👉',
    destaques: [
      { icone: '👉', texto: 'Arraste o conteúdo da ficha para o lado e troque de aba — Ficha, Perícias, Ações, Itens e Magias. Funciona nos dois sentidos.' },
      { icone: '🫱', texto: 'O conteúdo acompanha o dedo enquanto você arrasta, e dá aquele efeito elástico quando não tem mais aba para aquele lado.' },
      { icone: '⌨️', texto: 'No computador, as setas ← → do teclado fazem o mesmo. Trackpad com rolagem lateral também vale.' },
      { icone: '🧭', texto: 'Abaixo das abas apareceu um atalho mostrando qual aba está de cada lado — é só tocar para ir direto.' },
      { icone: '👀', texto: 'A barra de abas ficou com a letra maior e rola sozinha para manter a aba atual à vista em telas estreitas.' },
    ],
  },
  {
    version: '0.9.0',
    date: '2026-08-02',
    titulo: 'Grimório arrumado',
    resumo: 'Suas magias agora moram todas no mesmo lugar. Chega de caçar aquela magia de talento no fim da página. 📖',
    destaques: [
      { icone: '🔮', texto: 'Uma lista só de magias, separada por círculo — 1º, 2º, 3º... As magias de classe, de subclasse, de espécie e de talento aparecem juntas, em ordem.' },
      { icone: '◆', texto: 'Magias sempre preparadas (de domínio, de patrono, de juramento) vêm marcadas e não ocupam vaga no seu limite.' },
      { icone: '◈', texto: 'Magias que você conjura de graça — Iniciado em Magia, linhagens élficas, Tocado pelo Feérico — ganharam marcadores de uso do lado. Clique para gastar, descanso longo devolve.' },
      { icone: '🧹', texto: 'Magia concedida por duas fontes ao mesmo tempo não aparece mais duplicada.' },
      { icone: '✨', texto: 'Esta tela de Novidades! Toque na versão em Minhas Fichas para ver o que mudou.' },
    ],
  },
  {
    version: '0.8.0',
    date: '2026-08-02',
    titulo: 'Não morra ainda',
    resumo: 'Teste de Morte na ficha e uma varredura geral nas regras pelo Livro do Jogador 2024. 💀',
    destaques: [
      { icone: '💀', texto: 'Cartão de Teste de Morte: marque sucessos e falhas, ou role direto no app (10+, 1 e 20 natural já contam certo). A 0 PV a ficha pulsa em vermelho.' },
      { icone: '🩸', texto: 'Levar dano caído marca uma falha sozinho. Qualquer cura ou descanso longo zera os marcadores.' },
      { icone: '👼', texto: 'Aasimar, Golias, Orc e Draconato com os traços corrigidos — Revelação Celestial, as quatro dádivas de gigante, Investida Adrenalizada e o sopro dracônico.' },
      { icone: '⚔️', texto: 'Faísca Divina, Golpes Estudados, Magia de Guerra, Metabolismo Sobrenatural, Fúria dos Elementos, Contramúsica e mais características revisadas pelo texto do livro.' },
      { icone: '🛡', texto: 'Mestre em Escudos e Lutador com Duas Armas reescritos pela regra de 2024.' },
    ],
  },
  {
    version: '0.7.0',
    date: '2026-08-01',
    titulo: 'Multiclasse liberado',
    resumo: 'Dá para misturar classes, e seus recursos de subclasse viraram botões. 🎲',
    destaques: [
      { icone: '🎭', texto: 'Multiclasse no assistente de evolução: escolha em qual classe cai o nível. Os requisitos de 13+, os PV do dado certo e o nível de conjurador combinado saem calculados.' },
      { icone: '🎯', texto: 'Nova seção de recursos na aba Ações: cada opção é um botão que gasta o recurso e já rola o dado — manobras, metamagia, Canalizar Divindade, Pontos de Foco, dados psiônicos.' },
      { icone: '📜', texto: 'Mestre de Batalha com as 20 manobras para escolher, e o Bruxo com todas as Invocações Místicas (Lâmina, Corrente e Tomo).' },
      { icone: '❤️', texto: 'Ao subir de nível, dá para digitar o PV que você rolou na mesa em vez de rolar no app.' },
      { icone: '🇧🇷', texto: 'Faxina nos textos: nada mais de nome em inglês entre parênteses.' },
    ],
  },
  {
    version: '0.6.0',
    date: '2026-07-31',
    titulo: 'Preparar magias do jeito certo',
    resumo: 'Cada classe prepara magias do seu jeito, e agora o app sabe disso. 🧙',
    destaques: [
      { icone: '📖', texto: 'Clérigo e Druida redefinem tudo no descanso longo, Mago prepara do grimório, Paladino e Patrulheiro trocam uma por descanso, Bardo/Bruxo/Feiticeiro trocam ao subir de nível. Com contador de trocas na tela.' },
      { icone: '⛪', texto: 'Magias sempre preparadas de subclasse: domínios, patronos, círculos druídicos, juramentos, origens de Feiticeiro e os Segredos Mágicos do Colégio do Conhecimento.' },
      { icone: '🗡', texto: 'Cavaleiro Místico e Trapaceiro Arcano viraram conjuradores de 1/3, como manda o livro.' },
      { icone: '🪖', texto: 'Corrigido: o Clérigo Protetor não conseguia equipar cota de malha mesmo tendo a proficiência.' },
    ],
  },
  {
    version: '0.5.0',
    date: '2026-07-31',
    titulo: 'O livro inteiro na mão',
    resumo: 'Todas as magias e todos os itens mágicos, com o texto completo. 📚',
    destaques: [
      { icone: '🔮', texto: 'As 391 magias do Livro do Jogador 2024, do truque ao 9º círculo, com a descrição INTEIRA de cada uma. Sem resumo.' },
      { icone: '💍', texto: 'Os 348 itens mágicos do Livro do Mestre, do Comum ao Artefato, agrupados por raridade e com busca por nome.' },
      { icone: '🎁', texto: 'Toda escolha de magia fora da classe (linhagem élfica, Iniciado em Magia, Combatente Abençoado...) agora acontece num passo só, junto das magias da classe.' },
      { icone: '📈', texto: 'Bônus de itens mágicos entram sozinhos na CA, no ataque, no dano e nas salvaguardas.' },
    ],
  },
  {
    version: '0.4.0',
    date: '2026-07-31',
    titulo: 'Nada escolhido por você',
    resumo: 'A criação de ficha parou de chutar suas escolhas. 🎲',
    destaques: [
      { icone: '✅', texto: 'Nada mais vem pré-selecionado: espécie, classe, antecedente e equipamento começam vazios, e cada passo avisa o que ainda falta.' },
      { icone: '🧝', texto: 'Magias de espécie aparecem na aba Magias mesmo para quem não conjura — o guerreiro drow vê Fogo das Fadas e Escuridão com CD e ataque calculados.' },
      { icone: '💰', texto: 'A bolsa ganhou as cinco moedas (PL/PO/PE/PP/PC). Comprar um item desconta o preço, quebra moeda grande e devolve troco.' },
      { icone: '🎲', texto: 'O rolador de dados saiu do botão flutuante e virou item da barra de baixo — não cobre mais o fim das listas.' },
    ],
  },
  {
    version: '0.3.0',
    date: '2026-07-31',
    titulo: 'Perícias e maestrias',
    resumo: 'Aba nova de Perícias e as maestrias de arma no lugar. 🗡',
    destaques: [
      { icone: '🎯', texto: 'Aba Perícias: todas as perícias, proficiências de armadura, armas, ferramentas e as maestrias de arma numa tela só.' },
      { icone: '⚔️', texto: 'Maestria em Armas escolhida na criação e editável na ficha.' },
      { icone: '📜', texto: 'Antecedente deixou de vir como Soldado por padrão, e o bônus de atributo dele tem a opção Livre para mesas que preferem distribuir à vontade.' },
      { icone: '😮‍💨', texto: 'Retomar o Fôlego devolve 1 uso no descanso curto e todos no longo.' },
    ],
  },
  {
    version: '0.2.0',
    date: '2026-07-31',
    titulo: 'Conta na nuvem',
    resumo: 'Suas fichas te seguem para qualquer aparelho. ☁',
    destaques: [
      { icone: '🔐', texto: 'Login e cadastro: com conta, as fichas ficam na nuvem e abrem em qualquer aparelho. Sem conta também funciona, tudo salvo no celular.' },
      { icone: '🐉', texto: 'Escolhas de espécie que faltavam: ancestral do Draconato (10 cores), dádiva de gigante do Golias, linhagens de Elfo e Gnomo, legado do Tiefling.' },
      { icone: '🛡', texto: 'Os 12 Estilos de Luta do PHB 2024, Ordem Divina do Clérigo e Ordem Primal do Druida.' },
      { icone: '🎒', texto: 'Equipamento inicial com as opções A/B (A/B/C no Guerreiro): os itens caem na mochila e as moedas no bolso.' },
    ],
  },
  {
    version: '0.1.0',
    date: '2026-07-31',
    titulo: 'Rolando iniciativa',
    resumo: 'A primeira versão do app. Bem-vindo à mesa! 🐉',
    destaques: [
      { icone: '📝', texto: 'Criador de personagem passo a passo, ficha completa e assistente de subir de nível.' },
      { icone: '🎲', texto: 'Rolador de dados embutido, com histórico das rolagens.' },
      { icone: '📴', texto: 'Funciona 100% offline e dá para instalar como aplicativo no celular.' },
    ],
  },
]

/** A versão que está rodando. `__APP_VERSION__` vem do build; fora dele, do topo da lista. */
export const APP_VERSION =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : PATCH_NOTES[0].version

/** A entrada de notas da versão atual, quando existe. */
export const notaAtual = (): PatchNote | undefined =>
  PATCH_NOTES.find((n) => n.version === APP_VERSION) ?? PATCH_NOTES[0]

/** Data no formato curto que o jogador lê ("2 de agosto de 2026"). */
export const formatarData = (iso: string): string => {
  const [ano, mes, dia] = iso.split('-').map(Number)
  const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
  return `${dia} de ${meses[mes - 1]} de ${ano}`
}
