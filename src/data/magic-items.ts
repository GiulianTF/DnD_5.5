import type { Item, ItemRarity, MagicCategory, MagicEffects } from '../types'

/**
 * Catálogo de itens mágicos do **Livro do Mestre 2024** (`regras/livro-mestre.pdf`,
 * capítulo 7 — Tesouro), do Comum ao Artefato, em PT-BR.
 *
 * Cada entrada traz a categoria, a raridade, a exigência de sintonização e o texto
 * de regras do item. Os poucos itens cujo efeito é numérico (bônus de ataque, de CA,
 * de salvaguarda ou troca de atributo) também declaram `efeitos`, e aí a ficha
 * recalcula tudo sozinha ao equipar/sintonizar.
 */

interface Opts {
  /** requer sintonização; use uma string para a restrição ("por um Bruxo") */
  sint?: true | string
  /** detalhamento da categoria: "Qualquer Armadura Leve, Média ou Pesada" */
  detalhe?: string
  /** resumo de uma linha para as listas */
  resumo?: string
  /** preço de tabela, quando o item é vendido abertamente (poções de cura) */
  preco?: string
  /** bônus que o app aplica automaticamente */
  efeitos?: Partial<MagicEffects>
}

const mi = (
  id: string, name: string, category: MagicCategory, rarity: ItemRarity,
  text: string[], opts: Opts = {},
): Item => ({
  id,
  name,
  kind: 'magico',
  cost: opts.preco,
  magic: {
    rarity,
    category,
    categoryDetail: opts.detalhe,
    attunement: !!opts.sint,
    attunementBy: typeof opts.sint === 'string' ? opts.sint : undefined,
    desc: opts.resumo,
    text,
    ...opts.efeitos,
  },
})

export const MAGIC_ITEMS: Item[] = [
  mi('armadura-de-adamante', 'Armadura de Adamante', 'Armadura', 'incomum', [
    'Esta armadura é reforçada com adamante, uma das substâncias mais duras que existem. Enquanto você a estiver vestindo, qualquer Acerto Crítico contra você se torna um acerto normal.',
  ], { detalhe: 'Qualquer Armadura Média ou Pesada, exceto Armadura de Peles' }),

  mi('arma-de-adamante', 'Arma de Adamante', 'Arma', 'incomum', [
    'Esta arma ou munição é feita de adamante, uma das substâncias mais duras que existem. Sempre que esta arma ou munição atinge um objeto, o acerto é um Acerto Crítico.',
  ], { detalhe: 'Qualquer Munição ou Arma Corpo a Corpo' }),

  mi('jarra-de-alquimia', 'Jarra de Alquimia', 'Item Maravilhoso', 'incomum', [
    'Esta jarra de cerâmica parece comportar cerca de 4 litros de líquido e pesa 5,5 kg, esteja cheia ou vazia. A jarra chacoalha quando sacudida, mesmo estando vazia.',
    'Você pode executar uma ação Usar Magia e nomear um dos líquidos da tabela abaixo para que a jarra o produza. Depois disso, pode destampar a jarra como uma ação Utilizar e despejar o líquido, até 8 litros por minuto. A quantidade máxima depende do líquido nomeado.',
    'Líquidos da Jarra de Alquimia (quantidade máxima): Água doce 30 litros; Água salgada 45 litros; Azeite 1 litro; Cerveja 15 litros; Maionese 8 litros; Mel 4 litros; Veneno Básico 120 ml; Vinagre 8 litros; Vinho 4 litros.',
    'Depois que a jarra começa a produzir um líquido, ela não pode produzir outro — nem mais do que já chegou ao máximo — até o próximo amanhecer.',
  ]),

  mi('municao-magica', 'Munição +1, +2 ou +3', 'Munição', 'varia', [
    'Incomum (+1), Rara (+2) ou Muito Rara (+3).',
    'Você tem um bônus nas jogadas de ataque e de dano feitas com esta munição mágica. O bônus é determinado pela raridade da munição. Assim que atinge um alvo, a munição deixa de ser mágica.',
    'Esta munição costuma ser encontrada ou vendida em lotes de dez ou vinte unidades. Dez unidades valem o equivalente a uma poção da mesma raridade.',
  ], { detalhe: 'Qualquer Munição', efeitos: { attackBonus: 1 } }),

  mi('municao-do-abate', 'Munição do Abate', 'Munição', 'muito-raro', [
    'Esta munição mágica foi feita para matar criaturas de um tipo específico, escolhido pelo Mestre ou determinado aleatoriamente (Aberrações, Bestas, Celestiais, Constructos, Dragões, Elementais, Fadas, Gigantes, Humanoides, Ínferos, Limos, Monstruosidades, Mortos-vivos ou Plantas).',
    'Se uma criatura desse tipo sofrer dano da munição, ela realiza uma salvaguarda de Constituição CD 17, sofrendo 6d10 pontos de dano de Força extra se falhar, ou metade desse dano extra em caso de sucesso.',
    'Depois de causar seu dano extra a uma criatura, a munição se torna não mágica.',
  ], { detalhe: 'Qualquer Munição' }),

  mi('amuleto-da-saude', 'Amuleto da Saúde', 'Item Maravilhoso', 'raro', [
    'Sua Constituição passa a ser 19 enquanto você usar este amuleto. Ele não tem efeito sobre você se sua Constituição já for 19 ou mais sem ele.',
  ], { sint: true, resumo: 'Constituição 19 enquanto usado.', efeitos: { setAbility: { con: 19 } } }),

  mi('amuleto-contra-deteccao-e-localizacao', 'Amuleto de Proteção contra Detecção e Localização', 'Item Maravilhoso', 'incomum', [
    'Enquanto usar este amuleto, você não pode ser alvo de magias de Adivinhação nem ser percebido por sensores mágicos de vidência, a menos que você permita.',
  ], { sint: true }),

  mi('amuleto-dos-planos', 'Amuleto dos Planos', 'Item Maravilhoso', 'muito-raro', [
    'Enquanto usar este amuleto, você pode executar uma ação Usar Magia e nomear um lugar que conheça em outro plano de existência. Depois, realize um teste de Inteligência (Arcanismo) CD 15.',
    'Se for bem-sucedido, você conjura Transição Planar. Se falhar, você e cada criatura e objeto a até 4,5 metros de você viajam para um destino aleatório: 01–60 um local aleatório no plano nomeado; 61–70 um local aleatório em um Plano Interno; 71–80 um local aleatório em um Plano Externo dos planos superiores; 81–90 um local aleatório em um Plano Externo dos planos inferiores; 91–00 um local aleatório no Plano Astral.',
  ], { sint: true }),

  mi('escudo-animado', 'Escudo Animado', 'Armadura', 'muito-raro', [
    'Enquanto estiver segurando este Escudo, você pode executar uma ação Bônus para animá-lo. O Escudo salta no ar e flutua no seu espaço para protegê-lo como se você o estivesse empunhando, deixando suas mãos livres.',
    'O Escudo permanece animado por 1 minuto, até você executar uma ação Bônus para encerrar o efeito, ou até você morrer ou receber a condição Incapacitado — quando então ele cai no chão ou na sua mão, se estiver livre.',
  ], { sint: true, detalhe: 'Escudo', efeitos: { acBonus: 2 } }),

  mi('aparato-de-kwalish', 'Aparato de Kwalish', 'Item Maravilhoso', 'lendario', [
    'Este item parece, à primeira vista, um barril de ferro lacrado de 225 kg. O barril tem um trinco escondido, encontrado com um teste de Inteligência (Investigação) CD 20. Soltar o trinco destrava uma escotilha em uma das pontas, permitindo que duas criaturas Médias ou menores entrem. Dez alavancas ficam em fila na outra ponta, cada uma em posição neutra, podendo subir ou descer. Quando certas alavancas são usadas, o aparato se transforma em algo parecido com uma lagosta gigante.',
    'O Aparato de Kwalish é um objeto Grande com as seguintes estatísticas: CA 20; PV 200; Deslocamento 9 m, Natação 9 m (ou 0 m para ambos se as pernas não estiverem estendidas); Imunidade a dano Venenoso e Psíquico.',
    'Para ser usado como veículo, o aparato precisa de um piloto. Com a escotilha fechada, o compartimento é hermético e à prova d\'água, e comporta ar para 10 horas de respiração, dividido pelo número de criaturas que respiram lá dentro.',
    'O aparato flutua na água e pode submergir até 275 metros. Abaixo disso, sofre 2d6 de dano de Concussão por minuto por causa da pressão.',
    'Uma criatura no compartimento pode executar uma ação Utilizar para mover até duas alavancas para cima ou para baixo; depois de cada uso, a alavanca volta à posição neutra. Da esquerda para a direita: (1) pernas estendem/retraem; (2) escotilha frontal abre/fecha; (3) escotilhas laterais abrem/fecham; (4) garras avançam/retraem — cada garra estendida ataca com +8 e alcance 1,5 m, causando 7 (2d6) de dano de Concussão ou aplicando a condição Agarrado (CD de escape 15); (5) anda ou nada para frente/para trás; (6) gira 90 graus no sentido anti-horário/horário; (7) luzes acendem (luz plena em 9 m e penumbra por mais 9 m) ou apagam; (8) sobe/desce até 6 metros na água; (9) e (10) a escotilha traseira abre/fecha e sela.',
  ]),

  mi('armadura-magica', 'Armadura +1, +2 ou +3', 'Armadura', 'varia', [
    'Rara (+1), Muito Rara (+2) ou Lendária (+3).',
    'Você tem um bônus na Classe de Armadura enquanto veste esta armadura. O bônus é determinado pela raridade dela.',
  ], { detalhe: 'Qualquer Armadura Leve, Média ou Pesada', efeitos: { acBonus: 1 } }),

  mi('armadura-reluzente', 'Armadura Reluzente', 'Armadura', 'comum', [
    'Esta armadura nunca fica suja.',
  ], { detalhe: 'Qualquer Armadura Leve, Média ou Pesada' }),

  mi('armadura-da-invulnerabilidade', 'Armadura da Invulnerabilidade', 'Armadura', 'lendario', [
    'Você tem Resistência a dano de Concussão, Perfurante e Cortante enquanto veste esta armadura.',
    'Casco de Metal. Você pode executar uma ação Usar Magia para ganhar Imunidade a dano de Concussão, Perfurante e Cortante por 10 minutos ou até deixar de vestir a armadura. Depois de usada, esta propriedade só volta a funcionar no próximo amanhecer.',
  ], { sint: true, detalhe: 'Armadura de Placas' }),

  mi('armadura-da-resistencia', 'Armadura da Resistência', 'Armadura', 'raro', [
    'Você tem Resistência a um tipo de dano enquanto veste esta armadura. O Mestre escolhe o tipo ou o determina aleatoriamente entre Ácido, Elétrico, Gélido, Ígneo, Necrótico, Psíquico, Radiante, Trovejante e Venenoso.',
  ], { sint: true, detalhe: 'Qualquer Armadura Leve, Média ou Pesada' }),

  mi('armadura-da-vulnerabilidade', 'Armadura da Vulnerabilidade', 'Armadura', 'raro', [
    'Enquanto veste esta armadura, você tem Resistência a um dos seguintes tipos de dano: Concussão, Perfurante ou Cortante. O Mestre escolhe o tipo ou o determina aleatoriamente.',
    'Maldição. Esta armadura é amaldiçoada, fato revelado apenas quando a magia Identificar é conjurada sobre ela ou quando você se sintoniza com ela. Sintonizar-se à armadura o amaldiçoa até que você seja alvo da magia Remover Maldição ou de magia similar; tirar a armadura não encerra a maldição. Enquanto amaldiçoado, você tem Vulnerabilidade aos outros dois tipos de dano associados à armadura (aqueles aos quais ela não concede Resistência).',
  ], { sint: true, detalhe: 'Qualquer Armadura Leve, Média ou Pesada' }),

  mi('escudo-apanha-flechas', 'Escudo Apanha-Flechas', 'Armadura', 'raro', [
    'Você ganha +2 na Classe de Armadura contra jogadas de ataque à distância enquanto empunha este Escudo. Esse bônus é somado ao bônus normal de CA do Escudo.',
    'Sempre que um atacante fizer uma jogada de ataque à distância contra um alvo a até 1,5 metro de você, você pode executar uma Reação para se tornar o alvo do ataque no lugar dele.',
  ], { sint: true, detalhe: 'Escudo', efeitos: { acBonus: 2 } }),

  mi('machado-dos-senhores-anoes', 'Machado dos Senhores Anões', 'Arma', 'artefato', [
    'Forjado por um jovem príncipe anão no coração de um vulcão com o auxílio de Moradin, o machado se tornou o símbolo de unidade dos clãs anões — e foi perdido em uma guerra civil movida pela cobiça do poder que ele concede.',
    'Arma Mágica. O Machado dos Senhores Anões é uma arma mágica que concede +3 nas jogadas de ataque e de dano feitas com ela. Quando você ataca uma criatura com o machado e tira 20 no d20 da jogada de ataque, o machado causa 20 pontos de dano Cortante extra.',
    'O machado tem a propriedade Arremesso, com alcance normal de 6 metros e longo de 18 metros. Quando você acerta um ataque à distância com ele, causa 1d8 de dano de Força extra — ou 2d8 se o alvo for do tipo Gigante. Imediatamente após acertar ou errar, a arma volta voando para a sua mão.',
    'Bênçãos de Moradin. Enquanto estiver sintonizado ao machado, você ganha: Visão no Escuro de 18 metros (ou +18 metros, se já tiver); sua Constituição aumenta em 2, até o máximo de 20; proficiência com Suprimentos de Cervejeiro, Ferramentas de Pedreiro e Ferramentas de Ferreiro; Imunidade a dano Venenoso e Resistência a dano Ígneo; e, ao acertar um objeto com o machado, o objeto sofre o dano máximo possível.',
    'Convocar Elemental da Terra. Segurando o machado, você pode executar uma ação Usar Magia para convocar um Elemental da Terra em um espaço desocupado a até 9 metros de você. Ele entende seus idiomas, obedece aos seus comandos e age logo depois de você na Iniciativa. Desaparece após 24 horas, quando morre ou quando você o dispensa como ação Bônus. Só volta a funcionar no próximo amanhecer.',
    'Viajar pelas Profundezas. Você pode executar uma ação Usar Magia para tocar o machado em uma cantaria anã fixa e conjurar Teleporte a partir dele. Se o destino for subterrâneo, não há chance de acidente ou de chegar a um lugar inesperado. Só volta a funcionar depois de 3 dias.',
    'Propriedades Aleatórias. O machado tem 2 propriedades benéficas menores, 1 propriedade benéfica maior e 2 propriedades prejudiciais menores.',
    'Destruindo o Machado. A única forma de destruí-lo é derretê-lo na Forja Coração da Terra, onde foi criado, deixando-o na forja em brasa por 50 anos.',
  ], { sint: true, detalhe: 'Machado de Batalha', efeitos: { attackBonus: 3 } }),

  mi('vassoura-dancante-de-baba-yaga', 'Vassoura Dançante de Baba Yaga', 'Item Maravilhoso', 'incomum', [
    'A arquifada Baba Yaga criou muitas dessas vassouras mágicas, e não há duas exatamente iguais.',
    'Segurando a vassoura, você pode executar uma ação Usar Magia para transformá-la em uma Vassoura Animada sob o seu controle. Ela se move para o espaço desocupado mais próximo de você, age logo depois de você na Iniciativa e permanece animada até você executar uma ação Bônus e dizer a palavra de comando que a torna inanimada de novo.',
    'No seu turno, você pode comandar mentalmente a vassoura animada se ela estiver a até 9 metros de você e você não tiver a condição Incapacitado (não exige ação). Você decide que ação ela executa e para onde se move no próximo turno dela, ou dá uma ordem geral, como atacar seus inimigos ou guardar um lugar.',
    'Se a vassoura for reduzida a 0 Pontos de Vida, ela se despedaça e é destruída. Se voltar à forma inanimada antes disso, recupera todos os Pontos de Vida.',
  ], { sint: true }),

  mi('saco-de-feijoes', 'Saco de Feijões', 'Item Maravilhoso', 'raro', [
    'Este saco pesado de pano contém 3d4 feijões secos quando encontrado. Ele pesa 250 g independentemente de quantos feijões carregue e se torna um item não mágico quando fica sem nenhum.',
    'Se você despejar um ou mais feijões do saco, eles explodem em uma Esfera de 3 metros de raio centrada neles. Todos os feijões despejados são destruídos na explosão e cada criatura na Esfera, inclusive você, realiza uma salvaguarda de Destreza CD 15, sofrendo 5d4 pontos de dano Ígneo por feijão se falhar, ou metade desse dano em caso de sucesso.',
    'Se você tirar um feijão do saco, plantá-lo em terra ou areia e regá-lo, ele desaparece e produz um efeito 1 minuto depois. O Mestre escolhe o efeito ou o determina aleatoriamente — cogumelos venenosos (ou revigorantes), um gêiser de líquido, um Treant, uma estátua de pedra que o difama, uma fogueira de chamas verdes, Fungos Gritadores, sapos que viram monstros, uma Bulette faminta, uma árvore frutífera cujos frutos agem como poções, um ninho de ovos que aumentam um atributo (ou explodem), uma pirâmide com uma câmara mortuária ou um pé de feijão gigante que leva a um lugar escolhido pelo Mestre.',
  ]),

  mi('saco-devorador', 'Saco Devorador', 'Item Maravilhoso', 'muito-raro', [
    'Este saco se parece com um Saco de Contenção, mas é o orifício alimentar de uma criatura extradimensional gigantesca. Virar o saco do avesso fecha o orifício.',
    'A criatura extradimensional presa ao saco sente tudo que é colocado dentro dele. Matéria animal ou vegetal totalmente inserida no saco é devorada e perdida para sempre. Quando parte de uma criatura viva é colocada no saco — como acontece quando alguém enfia a mão nele —, há 50% de chance de a criatura ser puxada para dentro.',
    'Uma criatura dentro do saco pode executar uma ação para tentar escapar, com um teste de Força (Atletismo) CD 15. Outra criatura pode executar uma ação para enfiar a mão e puxá-la para fora, com um teste de Força (Atletismo) CD 20, desde que não seja puxada para dentro primeiro. Qualquer criatura que começar o turno dentro do saco é devorada e seu corpo, destruído.',
    'Objetos inanimados podem ser guardados no saco, que comporta cerca de 30 litros. No entanto, uma vez por dia o saco engole os objetos e os cospe em outro plano de existência, à escolha do Mestre.',
    'Se o saco for perfurado ou rasgado, é destruído e tudo o que estiver dentro é transportado para um local aleatório no Plano Astral.',
  ]),

  mi('saco-de-contencao', 'Saco de Contenção', 'Item Maravilhoso', 'incomum', [
    'Este saco tem um espaço interno bem maior do que as dimensões externas — cerca de 60 cm de largura por 1,2 metro de profundidade por dentro. Comporta até 225 kg, sem exceder o volume de 1,8 m³. O saco pesa 2,5 kg, seja qual for o conteúdo. Retirar um item de dentro dele exige uma ação Utilizar.',
    'Se o saco for sobrecarregado, perfurado ou rasgado, é destruído e o conteúdo se espalha pelo Plano Astral. Se for virado do avesso, o conteúdo cai sem sofrer dano, mas o saco precisa ser desvirado antes de voltar a funcionar. O saco comporta ar para 10 minutos de respiração, dividido pelo número de criaturas que respiram lá dentro.',
    'Colocar um Saco de Contenção dentro de um espaço extradimensional criado por uma Mochila Prática de Heward, um Buraco Portátil ou item semelhante destrói os dois itens na hora e abre um portal para o Plano Astral. Qualquer criatura em uma Esfera de 3 metros de raio centrada no portal é sugada para um local aleatório do Plano Astral. O portal então se fecha, é de mão única e não pode ser reaberto.',
  ]),

  mi('saco-de-truques', 'Saco de Truques', 'Item Maravilhoso', 'incomum', [
    'Este saco, feito de tecido cinza, ferrugem ou bege, parece vazio — mas quem enfia a mão dentro sente um pequeno objeto peludo.',
    'Você pode executar uma ação Usar Magia para tirar o objeto peludo do saco e arremessá-lo a até 6 metros. Ao cair, ele se transforma em uma criatura determinada pela cor do saco. A criatura some no amanhecer seguinte ou quando é reduzida a 0 Pontos de Vida.',
    'A criatura é Amigável a você e aos seus aliados e age logo depois de você na Iniciativa. Você pode executar uma ação Bônus para comandar como ela se move e que ação executa no próximo turno dela; sem ordens, ela age de acordo com a própria natureza.',
    'Saco Cinza: Doninha, Rato Gigante, Texugo, Javali, Pantera, Texugo Gigante, Lobo Atroz ou Alce Gigante. Saco Ferrugem: Rato, Coruja, Mastim, Cabra, Cabra Gigante, Javali Gigante, Leão ou Urso-Pardo. Saco Bege: Chacal, Símio, Babuíno, Ave-Machado, Urso-Negro, Doninha Gigante, Hiena Gigante ou Tigre.',
    'Depois que três objetos peludos forem tirados do saco, ele não pode ser usado de novo até o próximo amanhecer.',
  ]),
  mi('esfera-de-forca', 'Esfera de Força', 'Item Maravilhoso', 'raro', [
    'Esta pequena esfera preta mede cerca de 2 cm de diâmetro e pesa 30 g. Normalmente são encontradas 1d4 + 4 Esferas de Força juntas.',
    'Você pode executar uma ação Usar Magia para arremessar a esfera a até 18 metros. Ela explode em uma Esfera de 3 metros de raio no impacto e é destruída. Cada criatura na área deve passar em uma salvaguarda de Destreza CD 15 ou sofre 5d4 pontos de dano de Força.',
    'Uma esfera de força transparente então envolve a área por 1 minuto. Qualquer criatura que falhou na salvaguarda e esteja inteiramente dentro da área fica presa nela. Criaturas que passaram na salvaguarda ou estejam parcialmente na área são empurradas para fora. Só ar respirável atravessa a parede; nenhum ataque ou outro efeito passa.',
    'Uma criatura presa pode executar uma ação Utilizar para empurrar a parede, movendo a esfera até metade do deslocamento dela. A esfera pode ser carregada e a magia faz com que pese apenas 500 g, independentemente do peso das criaturas em seu interior.',
  ]),

  mi('conta-de-nutricao', 'Conta de Nutrição', 'Item Maravilhoso', 'comum', [
    'Esta conta gelatinosa e sem sabor se dissolve na sua língua e alimenta tanto quanto 1 dia de Rações.',
  ]),

  mi('conta-de-refrescamento', 'Conta de Refrescamento', 'Item Maravilhoso', 'comum', [
    'Esta conta gelatinosa e sem sabor se dissolve em líquido, transformando até meio litro dele em água fresca e potável. A conta não tem efeito sobre líquidos mágicos nem sobre substâncias nocivas, como veneno.',
  ]),

  mi('cinturao-anao', 'Cinturão Anão', 'Item Maravilhoso', 'raro', [
    'Enquanto usar este cinturão, você ganha os seguintes benefícios:',
    'Anão. Você conhece o idioma Anão.',
    'Amigo dos Anões. Você tem Vantagem em testes de Carisma (Persuasão) para interagir com anões e duergares.',
    'Robustez. Sua Constituição aumenta em 2, até o máximo de 20.',
    'Além disso, enquanto estiver sintonizado ao cinturão, há 50% de chance a cada amanhecer de você criar uma barba cheia (ou uma barba mais espessa, se já tiver uma).',
    'Se você não for anão nem duergar, também ganha, enquanto usar o cinturão: Visão no Escuro de 18 metros; Resistência a dano Venenoso; e Vantagem em salvaguardas para evitar ou encerrar a condição Envenenado.',
  ], { sint: true }),

  mi('cinturao-de-forca-do-gigante', 'Cinturão de Força do Gigante', 'Item Maravilhoso', 'varia', [
    'Enquanto usar este cinturão, sua Força passa a ser o valor concedido por ele. O tipo de gigante determina o valor. O item não tem efeito sobre você se sua Força sem o cinturão for igual ou maior.',
    'Gigante da Colina: Força 21 (Raro). Gigante do Gelo ou da Pedra: Força 23 (Muito Raro). Gigante do Fogo: Força 25 (Muito Raro). Gigante das Nuvens: Força 27 (Lendário). Gigante da Tempestade: Força 29 (Lendário).',
  ], { sint: true, efeitos: { setAbility: { for: 21 } } }),

  mi('machado-frenetico', 'Machado Frenético', 'Arma', 'raro', [
    'Você ganha +1 nas jogadas de ataque e de dano feitas com esta arma mágica. Além disso, enquanto estiver sintonizado a ela, seu máximo de Pontos de Vida aumenta em 1 para cada nível que você tiver.',
    'Maldição. Esta arma é amaldiçoada e sintonizar-se a ela estende a maldição a você. Enquanto permanecer amaldiçoado, você não aceita se separar da arma, mantendo-a sempre ao alcance, e tem Desvantagem em jogadas de ataque com qualquer outra arma.',
    'Sempre que outra criatura causar dano a você enquanto a arma estiver em sua posse, você deve passar em uma salvaguarda de Sabedoria CD 15 ou entra em fúria cega. Esse estado termina quando você começa seu turno e não há criaturas a até 18 metros que você possa ver ou ouvir.',
    'Em fúria cega, você considera inimiga a criatura mais próxima que possa ver ou ouvir. Em cada turno seu, você deve se mover o mais perto possível dela e executar a ação Atacar visando-a. Se não conseguir chegar perto o bastante para atacá-la, seu turno termina depois de gastar todo o movimento disponível.',
  ], { sint: true, detalhe: 'Machado de Batalha, Machado Grande ou Alabarda', efeitos: { attackBonus: 1 } }),

  mi('navalha-negra', 'Navalha Negra (Blackrazor)', 'Arma', 'artefato', [
    'Escondida na masmorra do Monte Pluma Branca, a Navalha Negra brilha como um pedaço de céu noturno cheio de estrelas.',
    'Você ganha +3 nas jogadas de ataque e de dano feitas com esta arma mágica. Se acertar um Morto-vivo com ela, você sofre 1d10 de dano Necrótico e o alvo recupera 1d10 Pontos de Vida. Se esse dano o reduzir a 0 Pontos de Vida, a Navalha Negra devora sua alma.',
    'Enquanto segura a arma, você tem Imunidade às condições Enfeitiçado e Amedrontado e Percepção às Cegas com alcance de 9 metros.',
    'Devorar Alma. Sempre que você usar a Navalha Negra para reduzir uma criatura a 0 Pontos de Vida, a espada mata a criatura e devora a alma dela, a menos que seja um Constructo ou um Morto-vivo. Uma criatura cuja alma foi devorada só pode ser trazida de volta à vida pela magia Desejo. Quando a espada devora uma alma que não é a sua, você ganha Pontos de Vida Temporários iguais ao máximo de Pontos de Vida da criatura morta.',
    'Celeridade. A Navalha Negra pode conjurar Celeridade em você, e só volta a fazê-lo no próximo amanhecer. Ela decide quando conjurar, e o efeito começa no início do seu turno e dura 1 minuto (sem exigir Concentração) ou até a espada decidir encerrá-lo.',
    'Senciência. A Navalha Negra é uma arma senciente Caótica e Neutra, com Inteligência 17, Sabedoria 10 e Carisma 19. Ela enxerga e ouve normalmente a até 36 metros e se comunica telepaticamente com quem a empunha. Sua ânsia é devorar almas.',
  ], { sint: true, detalhe: 'Espada Grande', efeitos: { attackBonus: 3 } }),

  mi('livro-dos-feitos-exaltados', 'Livro dos Feitos Exaltados', 'Item Maravilhoso', 'artefato', [
    'O tratado definitivo sobre tudo o que há de bom no multiverso. Um fecho pesado em forma de asas de anjo mantém o conteúdo protegido: só uma criatura sintonizada ao livro consegue abri-lo.',
    'Depois de aberto, a criatura sintonizada precisa passar 80 horas lendo e estudando o livro para digerir o conteúdo e ganhar seus benefícios. Outras criaturas leem o texto, mas não extraem nenhum sentido mais profundo nem qualquer benefício.',
    'Um Ínfero, um Morto-vivo ou um servo de um deus dos Planos Inferiores que tentar ler o livro sofre 24d6 pontos de dano Radiante, que ignora Resistência e Imunidade e não pode ser reduzido nem evitado. Uma criatura reduzida a 0 Pontos de Vida por esse dano desaparece num clarão e é destruída, deixando seus pertences para trás.',
    'Depois de estudá-lo, você ganha: sua Sabedoria e seu Carisma aumentam em 2, até o máximo de 24; você tem Vantagem em salvaguardas contra magias e outros efeitos mágicos; e magias de cura que você conjura restauram Pontos de Vida adicionais iguais ao seu bônus de proficiência.',
    'O livro raramente permanece em um só lugar: assim que é lido, ele desaparece para outro canto do multiverso onde sua orientação moral possa levar esperança a um mundo em perigo.',
  ], { sint: true }),

  mi('livro-das-trevas-vis', 'Livro das Trevas Vis', 'Item Maravilhoso', 'artefato', [
    'O conteúdo deste manuscrito imundo é o alimento dos perversos. Acredita-se que o lich-deus Vecna o tenha escrito, registrando toda ideia horrenda e toda magia corrompida que encontrou ou concebeu.',
    'A natureza não suporta a presença do livro: plantas comuns murcham perto dele, animais se recusam a se aproximar e até a pedra racha e vira pó se o livro repousar sobre ela por tempo suficiente.',
    'Sempre que uma criatura que não seja Ínfero nem Morto-vivo se sintoniza ao livro, ela realiza uma salvaguarda de Carisma CD 17. Se falhar, é magicamente transformada em uma Larva sob o controle do Mestre — só a magia Desejo reverte a transformação.',
    'Uma criatura sintonizada precisa passar 80 horas lendo e estudando o livro para usar seus benefícios: um atributo à sua escolha aumenta em 2 (até 24) enquanto outro diminui em 2; você não envelhece e não precisa comer, beber nem respirar; você aprende e pode conjurar magias sombrias registradas nele; e sua fala pode incutir terror em quem o ouve.',
  ], { sint: true }),

  mi('botas-elficas', 'Botas Élficas', 'Item Maravilhoso', 'incomum', [
    'Enquanto usar estas botas, seus passos não fazem barulho, seja qual for a superfície. Você também tem Vantagem em testes de Destreza (Furtividade).',
  ]),

  mi('botas-de-rastros-falsos', 'Botas de Rastros Falsos', 'Item Maravilhoso', 'comum', [
    'Enquanto usar estas botas, você pode fazer com que elas deixem rastros iguais aos de qualquer tipo de Humanoide do seu tamanho.',
  ], { sint: true }),

  mi('botas-de-levitacao', 'Botas de Levitação', 'Item Maravilhoso', 'raro', [
    'Enquanto usar estas botas, você pode conjurar Levitação em si mesmo, à vontade.',
  ], { sint: true }),

  mi('botas-de-velocidade', 'Botas de Velocidade', 'Item Maravilhoso', 'raro', [
    'Enquanto usar estas botas, você pode executar uma ação Bônus para bater os saltos uma no outro. Se fizer isso, as botas dobram seu deslocamento e qualquer criatura que fizer um Ataque de Oportunidade contra você tem Desvantagem na jogada de ataque. Bater os saltos de novo encerra o efeito.',
    'Depois de usar a propriedade das botas por um total de 10 minutos, a magia deixa de funcionar para você até que termine um Descanso Longo.',
  ], { sint: true }),

  mi('botas-de-passos-largos-e-saltos', 'Botas de Passos Largos e Saltos', 'Item Maravilhoso', 'incomum', [
    'Enquanto usar estas botas, seu deslocamento passa a ser 9 metros (a menos que já seja maior) e não é reduzido por carregar peso acima da sua capacidade de carga nem por vestir Armadura Pesada.',
    'Uma vez em cada turno seu, você pode saltar até 9 metros gastando apenas 3 metros de movimento.',
  ], { sint: true }),

  mi('botas-das-terras-invernais', 'Botas das Terras Invernais', 'Item Maravilhoso', 'incomum', [
    'Estas botas de pele são justas e parecem quentes. Enquanto as usar, você ganha:',
    'Resistência ao Frio. Você tem Resistência a dano Gélido e tolera temperaturas de −18 °C ou menos sem proteção adicional.',
    'Caminhante do Inverno. Você ignora Terreno Difícil criado por gelo ou neve.',
  ], { sint: true }),

  mi('tigela-de-comando-de-elementais-da-agua', 'Tigela de Comando de Elementais da Água', 'Item Maravilhoso', 'raro', [
    'Enquanto esta tigela estiver cheia de água e você estiver a até 1,5 metro dela, você pode executar uma ação Usar Magia para convocar um Elemental da Água. Ele aparece em um espaço desocupado o mais perto possível da tigela, entende seus idiomas, obedece aos seus comandos e age logo depois de você na Iniciativa.',
    'O elemental desaparece depois de 1 hora, quando morre ou quando você o dispensa como ação Bônus. A tigela só volta a funcionar assim no próximo amanhecer.',
    'A tigela tem cerca de 30 cm de diâmetro e metade disso de profundidade, comportando cerca de 11 litros.',
  ]),

  mi('bracadeiras-de-arqueria', 'Braçadeiras de Arquearia', 'Item Maravilhoso', 'incomum', [
    'Enquanto usar estas braçadeiras, você tem proficiência com o Arco Longo e o Arco Curto e ganha +2 nas jogadas de dano feitas com essas armas.',
  ], { sint: true }),

  mi('bracadeiras-de-defesa', 'Braçadeiras de Defesa', 'Item Maravilhoso', 'raro', [
    'Enquanto usar estas braçadeiras, você ganha +2 na Classe de Armadura se não estiver usando armadura nem Escudo.',
  ], { sint: true, resumo: '+2 na CA sem armadura e sem escudo.', efeitos: { acBonus: 2, requiresNoArmor: true } }),

  mi('braseiro-de-comando-de-elementais-do-fogo', 'Braseiro de Comando de Elementais do Fogo', 'Item Maravilhoso', 'raro', [
    'Enquanto estiver a até 1,5 metro deste braseiro, você pode executar uma ação Usar Magia para convocar um Elemental do Fogo. Ele aparece em um espaço desocupado o mais perto possível do braseiro, entende seus idiomas, obedece aos seus comandos e age logo depois de você na Iniciativa.',
    'O elemental desaparece depois de 1 hora, quando morre ou quando você o dispensa como ação Bônus. O braseiro só volta a funcionar assim no próximo amanhecer.',
  ]),

  mi('broche-de-escudo', 'Broche de Escudo', 'Item Maravilhoso', 'incomum', [
    'Enquanto usar este broche, você tem Resistência a dano de Força e Imunidade ao dano da magia Mísseis Mágicos.',
  ], { sint: true }),

  mi('vassoura-voadora', 'Vassoura Voadora', 'Item Maravilhoso', 'incomum', [
    'Esta vassoura de madeira funciona como uma vassoura comum até você montar nela e executar uma ação Usar Magia para fazê-la pairar sob você — a partir daí ela pode ser cavalgada pelo ar. Ela tem Deslocamento de Voo de 15 metros e carrega até 180 kg, mas o Deslocamento de Voo cai para 9 metros acima de 90 kg. A vassoura para de pairar quando você pousa ou deixa de montá-la.',
    'Com uma ação Usar Magia, você pode mandar a vassoura viajar sozinha até um destino a até 1,6 km de você, se nomear o lugar e o conhecer. Ela volta quando você executa uma ação Usar Magia e diz a palavra de comando, desde que ainda esteja a até 1,6 km.',
  ], { sint: true }),

  mi('vela-de-invocacao', 'Vela de Invocação', 'Item Maravilhoso', 'muito-raro', [
    'A magia desta vela é ativada quando ela é acesa, o que exige uma ação Usar Magia. Depois de queimar por 4 horas, a vela é destruída. Você pode apagá-la antes para usá-la depois, descontando o tempo já queimado em incrementos de 1 minuto.',
    'Acesa, a vela emite penumbra num raio de 9 metros. Enquanto estiver nessa luz, você tem Vantagem em Testes D20. Além disso, um Clérigo ou Druida na luz pode conjurar magias de 1º círculo que tenha preparado sem gastar espaços de magia.',
    'Como alternativa, ao acender a vela pela primeira vez você pode conjurar Portal com ela — o que destrói a vela. O portal criado leva a um Plano Externo específico, escolhido pelo Mestre ou determinado aleatoriamente.',
  ], { sint: true }),

  mi('vela-das-profundezas', 'Vela das Profundezas', 'Item Maravilhoso', 'comum', [
    'A chama desta vela não se apaga quando imersa em água. Ela emite luz e calor como uma vela normal.',
  ]),

  mi('capa-do-charlatao', 'Capa do Charlatão', 'Item Maravilhoso', 'raro', [
    'Esta capa tem um leve cheiro de enxofre. Enquanto a usar, você pode conjurar Porta Dimensional com ela executando uma ação Usar Magia. Esta propriedade só volta a funcionar no próximo amanhecer.',
    'Quando você se teleporta com essa magia, deixa para trás uma nuvem de fumaça. O espaço de onde você saiu fica Levemente Obscurecido por essa fumaça até o fim do seu próximo turno.',
  ]),
  mi('touca-de-respiracao-aquatica', 'Touca de Respiração Aquática', 'Item Maravilhoso', 'incomum', [
    'Enquanto usar esta touca debaixo d\'água, você pode executar uma ação Usar Magia para criar uma bolha de ar em volta da sua cabeça. Ela permite que você respire normalmente submerso e permanece com você até a touca ser retirada ou até você sair da água.',
  ]),

  mi('tapete-voador', 'Tapete Voador', 'Item Maravilhoso', 'muito-raro', [
    'Você pode fazer este tapete pairar e voar executando uma ação Usar Magia e dizendo a palavra de comando dele. Ele se move conforme as suas instruções, desde que você esteja a até 9 metros dele.',
    'Existem quatro tamanhos de Tapete Voador, escolhidos pelo Mestre ou determinados aleatoriamente: 90 × 150 cm (90 kg, Voo 24 m); 120 × 180 cm (180 kg, Voo 18 m); 150 × 210 cm (270 kg, Voo 12 m); 180 × 270 cm (360 kg, Voo 9 m).',
    'Um tapete pode carregar até o dobro da capacidade indicada, mas o Deslocamento de Voo cai pela metade se levar mais do que a capacidade normal.',
  ]),

  mi('armadura-de-desvestir', 'Armadura de Desvestir', 'Armadura', 'comum', [
    'Você pode tirar esta armadura executando uma ação Usar Magia.',
  ], { detalhe: 'Qualquer Armadura Leve, Média ou Pesada' }),

  mi('caldeirao-do-renascimento', 'Caldeirão do Renascimento', 'Item Maravilhoso', 'muito-raro', [
    'Este pote Minúsculo traz cenas em relevo de heróis nas laterais de ferro fundido.',
    'Você pode usar o caldeirão como Foco de Conjuração das suas magias, e ele serve como componente adequado para a magia Vidência.',
    'Preparar Poção. Ao terminar um Descanso Longo, você pode usar o caldeirão para criar uma Poção de Cura (maior), o que leva 1 minuto. A poção dura 24 horas e perde a magia se não for consumida.',
    'Reviver os Mortos. Com uma ação Usar Magia, você pode fazer o caldeirão crescer o bastante para uma criatura Média se agachar dentro dele, e voltá-lo ao tamanho normal com outra ação Usar Magia, empurrando sem dano para o espaço desocupado mais próximo o que não couber.',
    'Se você colocar o cadáver de um Humanoide no caldeirão e cobri-lo com 90 kg de sal (que custam 10 PO) por pelo menos 8 horas, o sal é consumido e a criatura volta à vida como pela magia Reviver os Mortos no amanhecer seguinte. Depois de usada, esta propriedade só volta a funcionar em 7 dias.',
  ], { sint: 'por um Clérigo, Druida ou Bruxo' }),

  mi('turibulo-de-controle-de-elementais-do-ar', 'Turíbulo de Controle de Elementais do Ar', 'Item Maravilhoso', 'raro', [
    'Balançando suavemente este turíbulo, você pode executar uma ação Usar Magia para convocar um Elemental do Ar. Ele aparece em um espaço desocupado o mais perto possível do turíbulo, entende seus idiomas, obedece aos seus comandos e age logo depois de você na Iniciativa.',
    'O elemental desaparece depois de 1 hora, quando morre ou quando você o dispensa como ação Bônus. O turíbulo só volta a funcionar assim no próximo amanhecer.',
  ]),

  mi('dado-do-charlatao', 'Dado do Charlatão', 'Item Maravilhoso', 'comum', [
    'Sempre que você rolar este dado de seis faces, pode controlar qual número ele mostra.',
  ], { sint: true }),

  mi('sino-de-abertura', 'Sino de Abertura', 'Item Maravilhoso', 'raro', [
    'Este tubo oco de metal tem cerca de 30 cm de comprimento e pesa 500 g. Com uma ação Usar Magia, você pode golpear o sino para conjurar Arrombar. O som de batida costumeiro da magia é substituído pelo toque claro do sino, audível a até 90 metros.',
    'O sino pode ser usado 10 vezes. Depois da décima, ele racha e se torna inútil.',
  ]),

  mi('tiara-explosiva', 'Tiara Explosiva', 'Item Maravilhoso', 'incomum', [
    'Enquanto usar esta tiara, você pode conjurar Raio Ardente com ela (+5 para acertar). A tiara só volta a conjurar essa magia no próximo amanhecer.',
  ]),

  mi('manto-de-aracnida', 'Manto de Aracnida', 'Item Maravilhoso', 'muito-raro', [
    'Esta peça fina é feita de seda negra entretecida com fios prateados. Enquanto a usar, você ganha:',
    'Resistência a Veneno. Você tem Resistência a dano Venenoso.',
    'Escalada de Aranha. Você tem Deslocamento de Escalada igual ao seu deslocamento e pode subir, descer e atravessar superfícies verticais e tetos com as mãos livres.',
    'Andar em Teias. Você não pode ser preso por teias de nenhum tipo e se move através delas como se fossem Terreno Difícil.',
    'Teia. Você pode conjurar Teia (CD de salvaguarda 13). A teia criada preenche o dobro da área normal. Depois de usada, esta propriedade só volta a funcionar no próximo amanhecer.',
  ], { sint: true }),

  mi('manto-esvoacante', 'Manto Esvoaçante', 'Item Maravilhoso', 'comum', [
    'Enquanto usar este manto, você pode executar uma ação Bônus para fazê-lo esvoaçar dramaticamente por 1 minuto.',
  ]),

  mi('manto-do-deslocamento', 'Manto do Deslocamento', 'Item Maravilhoso', 'raro', [
    'Enquanto usar este manto, ele projeta magicamente uma ilusão que faz você parecer estar em um lugar próximo à sua posição real, fazendo com que qualquer criatura tenha Desvantagem em jogadas de ataque contra você.',
    'Se você sofrer dano, a propriedade deixa de funcionar até o início do seu próximo turno. Ela também fica suprimida enquanto o seu deslocamento for 0.',
  ], { sint: true }),

  mi('manto-elfico', 'Manto Élfico', 'Item Maravilhoso', 'incomum', [
    'Enquanto usar este manto, testes de Sabedoria (Percepção) feitos para perceber você têm Desvantagem, e você tem Vantagem em testes de Destreza (Furtividade).',
  ], { sint: true }),

  mi('manto-da-invisibilidade', 'Manto da Invisibilidade', 'Item Maravilhoso', 'lendario', [
    'Este manto tem 3 cargas e recupera 1d3 cargas gastas diariamente ao amanhecer.',
    'Enquanto o usar, você pode executar uma ação Usar Magia para puxar o capuz sobre a cabeça e gastar 1 carga, recebendo a condição Invisível por 1 hora. O efeito termina antes se você abaixar o capuz (não exige ação) ou deixar de usar o manto.',
  ], { sint: true }),

  mi('manto-de-mil-estilos', 'Manto de Mil Estilos', 'Item Maravilhoso', 'comum', [
    'Enquanto usar este manto, você pode executar uma ação Bônus para mudar o estilo, a cor e a aparente qualidade da peça. O peso não muda. Seja qual for a aparência, ele continua sendo um manto: pode imitar a aparência de outros mantos mágicos, mas não ganha as propriedades mágicas deles.',
  ]),

  mi('manto-de-protecao', 'Manto de Proteção', 'Item Maravilhoso', 'incomum', [
    'Você ganha +1 na Classe de Armadura e nas salvaguardas enquanto usar este manto.',
  ], { sint: true, resumo: '+1 na CA e em salvaguardas.', efeitos: { acBonus: 1, saveBonus: 1 } }),

  mi('manto-do-morcego', 'Manto do Morcego', 'Item Maravilhoso', 'raro', [
    'Enquanto usar este manto, você tem Vantagem em testes de Destreza (Furtividade).',
    'Em área de penumbra ou escuridão, você pode segurar as bordas do manto e usá-lo para ganhar Deslocamento de Voo de 12 metros. Se soltar as bordas enquanto voa assim, ou se deixar de estar em penumbra ou escuridão, você perde esse Deslocamento de Voo.',
    'Usando o manto em penumbra ou escuridão, você pode conjurar Polimorfia em si mesmo, transformando-se em um Morcego. Nessa forma, você mantém seus valores de Inteligência, Sabedoria e Carisma. O manto só volta a ser usado assim no próximo amanhecer.',
  ], { sint: true }),

  mi('manto-da-arraia-manta', 'Manto da Arraia-Manta', 'Item Maravilhoso', 'incomum', [
    'Enquanto usar este manto, você pode respirar debaixo d\'água e tem Deslocamento de Natação de 18 metros.',
  ], { sint: true }),

  mi('amuleto-mecanico', 'Amuleto Mecânico', 'Item Maravilhoso', 'comum', [
    'Este amuleto de cobre contém engrenagens minúsculas e é movido pela magia de Mechanus, um plano de previsibilidade mecânica. Dele saem tiquetaques e zumbidos fracos.',
    'Quando fizer uma jogada de ataque usando o amuleto, você pode abrir mão de rolar o d20 e considerar que tirou 10. Depois de usada, esta propriedade só volta a funcionar no próximo amanhecer.',
  ]),

  mi('roupas-que-se-remendam', 'Roupas que se Remendam', 'Item Maravilhoso', 'comum', [
    'Este traje elegante se remenda magicamente para compensar o desgaste do dia a dia. Peças do traje que sejam destruídas não podem ser reparadas assim.',
  ]),

  mi('bola-de-cristal', 'Bola de Cristal', 'Item Maravilhoso', 'muito-raro', [
    'Enquanto tocar neste orbe de cristal, você pode conjurar Vidência com ele (CD de salvaguarda 17).',
  ], { sint: true }),

  mi('bola-de-cristal-da-leitura-mental', 'Bola de Cristal da Leitura Mental', 'Item Maravilhoso', 'lendario', [
    'Enquanto tocar neste orbe de cristal, você pode conjurar Vidência com ele (CD de salvaguarda 17).',
    'Além disso, você pode conjurar Detectar Pensamentos (CD de salvaguarda 17) mirando criaturas que possa ver a até 9 metros do sensor da magia. Você não precisa se concentrar nesse Detectar Pensamentos para mantê-lo, mas ele termina se a Vidência terminar.',
  ], { sint: true }),

  mi('bola-de-cristal-da-telepatia', 'Bola de Cristal da Telepatia', 'Item Maravilhoso', 'lendario', [
    'Enquanto tocar neste orbe de cristal, você pode conjurar Vidência com ele (CD de salvaguarda 17).',
    'Além disso, você pode se comunicar telepaticamente com criaturas que possa ver a até 9 metros do sensor da magia, e conjurar Sugestão (CD de salvaguarda 17) através do sensor em uma dessas criaturas. Você não precisa se concentrar nessa Sugestão para mantê-la, mas ela termina se a Vidência terminar. Você só pode conjurar Sugestão assim de novo no próximo amanhecer.',
  ], { sint: true }),

  mi('bola-de-cristal-da-visao-verdadeira', 'Bola de Cristal da Visão da Verdade', 'Item Maravilhoso', 'lendario', [
    'Enquanto tocar neste orbe de cristal, você pode conjurar Vidência com ele (CD de salvaguarda 17). Além disso, você tem Visão Verdadeira com alcance de 36 metros, centrada no sensor da magia.',
  ], { sint: true }),

  mi('cubo-de-forca', 'Cubo de Força', 'Item Maravilhoso', 'raro', [
    'Este cubo tem cerca de 2,5 cm de lado e cada face traz uma marca distinta. Você pode pressionar uma das faces, gastar o número de cargas exigido e conjurar a magia associada a ela (CD de salvaguarda 17).',
    'Faces do cubo e custo em cargas: Armadura Arcana (1), Escudo Arcano (1), Pequeno Refúgio de Leomund (2), Santuário Particular de Mordenkainen (3), Esfera Resiliente de Otiluke (4) e Muralha de Energia (5).',
    'O cubo começa com 10 cargas e recupera 1d6 cargas gastas diariamente ao amanhecer.',
  ], { sint: true }),

  mi('cubo-de-invocacao', 'Cubo de Invocação', 'Item Maravilhoso', 'raro', [
    'Este cubo Minúsculo parece uma caixinha de surpresas. Quando você gira a manivela com uma ação Usar Magia, uma melodia alegre sai da caixa, a tampa se abre, uma criatura aparece no espaço desocupado mais próximo e a tampa se fecha. Fora isso, a tampa não pode ser aberta.',
    'Role 1d6 para saber qual magia o cubo conjura para invocar a criatura: 1 Invocar Aberração; 2 Invocar Fera; 3 Invocar Constructo; 4 Invocar Dragão; 5 Invocar Elemental; 6 Invocar Feérico. A magia é conjurada no 5º círculo (CD de salvaguarda 17, +9 de bônus de ataque) e não exige Concentração, mas em tudo o mais você funciona como o conjurador dela.',
    'Depois que o cubo invoca uma criatura, ele só volta a fazê-lo no próximo amanhecer.',
  ]),

  mi('portal-cubico', 'Portal Cúbico', 'Item Maravilhoso', 'lendario', [
    'Este cubo tem cerca de 7,5 cm de lado e irradia energia mágica palpável. Cada um dos seis lados está sintonizado a um plano de existência diferente, um deles o Plano Material; os outros são definidos pelo Mestre.',
    'O cubo tem 3 cargas e recupera 1d3 cargas gastas diariamente ao amanhecer. Com uma ação Usar Magia, você pode gastar 1 carga para conjurar uma destas magias:',
    'Portal. Pressionando um lado do cubo, você conjura Portal, abrindo uma passagem para o plano associado àquele lado.',
    'Transição Planar. Pressionando um lado do cubo duas vezes, você conjura Transição Planar, transportando os alvos para o plano associado àquele lado.',
  ]),
  mi('fortaleza-instantanea-de-daern', 'Fortaleza Instantânea de Daern', 'Item Maravilhoso', 'raro', [
    'Com uma ação Usar Magia, você pode colocar esta estatueta de adamante de 2,5 cm no chão e, com uma palavra de comando, fazê-la crescer rapidamente até virar uma torre quadrada de adamante. Repetir a palavra de comando faz a torre voltar à forma de estatueta, o que só funciona se ela estiver vazia.',
    'Cada criatura na área onde a torre aparece é empurrada para um espaço desocupado fora, mas adjacente a ela. Objetos na área que não estejam sendo vestidos ou carregados também são empurrados para fora.',
    'A torre tem 6 metros de lado e 9 metros de altura, com seteiras em todos os lados e ameias no topo. O interior tem dois andares ligados por escada, escadaria ou rampa (à sua escolha), que termina em um alçapão para o telhado. Ao ser criada, a torre tem uma única porta no nível do chão, do lado voltado para você. A porta só abre ao seu comando, que você pode dar como ação Bônus, e é imune à magia Arrombar e similares. A magia impede que a torre seja tombada.',
    'O telhado, a porta e as paredes têm CA 20; PV 100; Imunidade a dano de Concussão, Perfurante e Cortante (exceto o causado por equipamento de cerco); e Resistência a todos os outros tipos de dano.',
  ], { sint: true }),

  mi('adaga-do-veneno', 'Adaga do Veneno', 'Arma', 'raro', [
    'Você ganha +1 nas jogadas de ataque e de dano feitas com esta arma mágica.',
    'Você pode executar uma ação Bônus para revestir magicamente a lâmina com veneno. O veneno permanece por 1 minuto ou até um ataque com esta arma acertar uma criatura. Essa criatura deve passar em uma salvaguarda de Constituição CD 15 ou sofre 2d10 de dano Venenoso e recebe a condição Envenenado por 1 minuto. A arma só volta a ser usada assim no próximo amanhecer.',
  ], { detalhe: 'Adaga', efeitos: { attackBonus: 1 } }),

  mi('espada-dancante', 'Espada Dançante', 'Arma', 'muito-raro', [
    'Você pode executar uma ação Bônus para lançar esta arma mágica no ar. Ao fazer isso, ela começa a pairar, voa até 9 metros e ataca uma criatura à sua escolha a até 1,5 metro dela. A arma usa a sua jogada de ataque e soma o seu modificador de atributo às jogadas de dano.',
    'Enquanto a arma paira, você pode executar uma ação Bônus para fazê-la voar até 9 metros até outro ponto a até 9 metros de você. Como parte da mesma ação Bônus, você pode fazê-la atacar uma criatura a até 1,5 metro dela.',
    'Depois do quarto ataque, a arma volta voando e tenta retornar à sua mão. Se você não tiver uma mão livre, ela cai no chão no seu espaço. Se não houver caminho desobstruído até você, ela chega o mais perto que puder e cai no chão. Ela também para de pairar se você a segurar ou se ficar a mais de 9 metros dela.',
  ], { sint: true, detalhe: 'Espada Grande, Espada Longa, Rapieira, Cimitarra ou Espada Curta' }),

  mi('amuleto-de-fragmento-sombrio', 'Amuleto de Fragmento Sombrio', 'Item Maravilhoso', 'comum', [
    'Este amuleto é feito de um fragmento de material resistente vindo de um reino de outro mundo. Enquanto o usar, você ganha:',
    'Foco de Conjuração. Você pode usar o amuleto como Foco de Conjuração das suas magias de Bruxo.',
    'Magia Desconhecida. Com uma ação Usar Magia, você pode tentar conjurar um truque que não conhece. O truque precisa estar na lista de Bruxo e ter tempo de conjuração de uma ação, e você realiza um teste de Inteligência (Arcanismo) CD 10. Se for bem-sucedido, você conjura a magia; se falhar, a magia falha e a ação é desperdiçada. Nos dois casos, você só volta a usar esta propriedade depois de terminar um Descanso Longo.',
  ], { sint: 'por um Bruxo' }),

  mi('garrafa-de-agua-infinita', 'Garrafa de Água Infinita', 'Item Maravilhoso', 'incomum', [
    'Este frasco com rolha chacoalha quando sacudido, como se contivesse água. Pesa 1 kg.',
    'Você pode executar uma ação Usar Magia para tirar a rolha e dizer uma de três palavras de comando, e então água doce ou salgada (à sua escolha) jorra do frasco. A água para de jorrar no início do seu próximo turno.',
    'Esguicho. A garrafa produz 4 litros de água.',
    'Fonte. A garrafa produz 19 litros de água.',
    'Gêiser. A garrafa produz 110 litros de água que jorram em uma Linha de 9 metros de comprimento por 30 cm de largura. Se você estiver segurando a garrafa, pode mirar o gêiser em uma direção (não exige ação). Uma criatura à sua escolha na Linha deve passar em uma salvaguarda de Força CD 13 ou sofre 1d4 de dano de Concussão e recebe a condição Caído. Em vez de uma criatura, você pode mirar um objeto na Linha que não esteja sendo vestido nem carregado e que pese até 90 kg: o objeto é derrubado pelo gêiser.',
  ]),

  mi('baralho-de-ilusoes', 'Baralho de Ilusões', 'Item Maravilhoso', 'incomum', [
    'Esta caixa contém um conjunto de cartas. Um baralho completo tem 34 cartas: 32 retratando criaturas específicas e duas com superfície espelhada. Um baralho encontrado como tesouro costuma estar sem 1d20 − 1 cartas.',
    'A magia do baralho só funciona se as cartas forem tiradas ao acaso. Você pode executar uma ação Usar Magia para tirar uma carta aleatória e jogá-la no chão em um ponto a até 9 metros de você. Uma ilusão da criatura correspondente se forma sobre a carta e permanece até ser dissipada. A criatura ilusória parece e se comporta como uma criatura real do seu tipo, exceto que não pode causar dano.',
    'Enquanto você estiver a até 36 metros da criatura ilusória e puder vê-la, pode executar uma ação Usar Magia para movê-la para qualquer ponto a até 9 metros da carta dela.',
    'Qualquer interação física revela que a criatura é falsa, porque objetos a atravessam. Uma criatura que executar a ação Estudar para inspecioná-la a identifica como ilusão com um teste de Inteligência (Investigação) CD 15.',
    'A ilusão dura até a carta ser movida ou até ser dissipada. Quando a ilusão termina, a imagem na carta desaparece e a carta não pode ser usada de novo.',
  ]),

  mi('baralho-de-muitas-coisas', 'Baralho de Muitas Coisas', 'Item Maravilhoso', 'lendario', [
    'Normalmente guardado em uma caixa ou bolsa, este baralho contém cartas de marfim ou pergaminho. A maioria (75%) dos baralhos tem treze cartas; alguns têm vinte e duas.',
    'Antes de tirar uma carta, você deve declarar quantas pretende tirar e então tirá-las ao acaso. Cartas tiradas além desse número não têm efeito. Fora isso, assim que você tira uma carta, a magia dela entra em efeito. Cada carta deve ser tirada no máximo 1 hora depois da anterior; se você não tirar o número escolhido, as cartas restantes voam do baralho sozinhas e fazem efeito todas de uma vez.',
    'Depois de tirada, a carta desaparece. A menos que seja o Louco ou o Bobo, ela reaparece no baralho, sendo possível tirar a mesma carta duas vezes.',
    'As cartas do baralho são: Equilíbrio, Cometa, Masmorra, Euríale, Destinos, Chamas, Louco, Gema, Bobo, Chave, Cavaleiro, Lua, Enigma, Ladino, Ruína, Sábio, Esqueleto, Estrela, Sol, Talismã, Trono e Vazio. Os efeitos vão de grandes bênçãos (atributos elevados, magias de Desejo, riquezas, aliados) a maldições devastadoras (perda da alma, aprisionamento extraplanar, inimigos poderosos e destruição de todos os seus bens).',
  ]),

  mi('defensor', 'Defensor', 'Arma', 'lendario', [
    'Você ganha +3 nas jogadas de ataque e de dano feitas com esta arma mágica.',
    'Na primeira vez que atacar com a arma em cada turno seu, você pode transferir parte ou todo o bônus da arma para a sua Classe de Armadura. Por exemplo, você pode reduzir o bônus de ataque e dano para +1 e ganhar +2 na Classe de Armadura. Os bônus ajustados permanecem até o início do seu próximo turno, mas você precisa segurar a arma para ganhar o bônus de CA.',
  ], { sint: true, detalhe: 'Qualquer Arma Corpo a Corpo', efeitos: { attackBonus: 3 } }),

  mi('armadura-demoniaca', 'Armadura Demoníaca', 'Armadura', 'muito-raro', [
    'Enquanto veste esta armadura, você ganha +1 na Classe de Armadura e conhece o idioma Abissal. Além disso, as manoplas com garras da armadura fazem seus Ataques Desarmados causarem 1d8 de dano Cortante em vez do dano de Concussão normal, e você ganha +1 nas jogadas de ataque e de dano dos seus Ataques Desarmados.',
    'Maldição. Depois de vestir esta armadura amaldiçoada, você não consegue tirá-la a menos que seja alvo da magia Remover Maldição ou de magia similar. Enquanto a estiver vestindo, você tem Desvantagem em jogadas de ataque contra demônios e em salvaguardas contra as magias e habilidades especiais deles.',
  ], { sint: true, detalhe: 'Qualquer Armadura Leve, Média ou Pesada', efeitos: { acBonus: 1 } }),

  mi('demonomicon-de-iggwilv', 'Demonomicon de Iggwilv', 'Item Maravilhoso', 'artefato', [
    'Este tratado, escrito pela arquimaga Iggwilv, documenta as camadas e os habitantes do Abismo e é tido como o mais completo e blasfemo tomo de demonologia do multiverso.',
    'Saber Abissal. Você pode consultar o Demonomicon sempre que fizer um teste de Inteligência para descobrir informações sobre demônios ou um teste de Sabedoria (Sobrevivência) relacionado ao Abismo. Ao fazer isso, você tem Vantagem no teste.',
    'Contenção. As dez primeiras páginas do Demonomicon são em branco. Com uma ação Usar Magia enquanto segura o livro, você pode mirar um Ínfero que possa ver e que esteja preso na área de uma magia Círculo Mágico. O Ínfero deve passar em uma salvaguarda de Carisma CD 20 com Desvantagem ou fica preso em uma das páginas em branco, que se enche de escrita detalhando o nome e as depravações da criatura aprisionada.',
    'Propriedades Aleatórias. O tomo tem 2 propriedades benéficas menores, 1 propriedade benéfica maior, 2 propriedades prejudiciais menores e 1 propriedade prejudicial maior.',
  ], { sint: true }),

  mi('algemas-dimensionais', 'Algemas Dimensionais', 'Item Maravilhoso', 'raro', [
    'Você pode executar uma ação Utilizar para colocar estas algemas em uma criatura que tenha a condição Incapacitado. As algemas se ajustam a criaturas de tamanho Pequeno a Grande.',
    'As algemas impedem a criatura presa de usar qualquer forma de movimento extradimensional, incluindo teleporte e viagem para outro plano de existência. Elas não impedem a criatura de atravessar um portal interdimensional.',
    'Você e qualquer criatura que designar ao usar as algemas podem executar uma ação Utilizar para removê-las. Uma vez a cada 30 dias, a criatura presa pode realizar um teste de Força (Atletismo) CD 30; se for bem-sucedida, ela se liberta e destrói as algemas.',
  ]),

  mi('brunea-de-escamas-de-dragao', 'Brunea de Escamas de Dragão', 'Armadura', 'muito-raro', [
    'A Brunea de Escamas de Dragão é feita das escamas de um único tipo de dragão e é altamente valorizada.',
    'Enquanto veste esta armadura, você ganha +1 na Classe de Armadura, tem Vantagem em salvaguardas contra as armas de sopro de Dragões e tem Resistência a um tipo de dano determinado pelo dragão que forneceu as escamas: Negro e Cobre (Ácido); Azul e Bronze (Elétrico); Latão, Ouro e Vermelho (Ígneo); Verde (Venenoso); Prata e Branco (Gélido).',
    'Além disso, você pode aguçar os sentidos com uma ação Usar Magia para perceber a distância e a direção do dragão mais próximo do mesmo tipo da armadura a até 48 km de você. Esta ação só volta a ser usada no próximo amanhecer.',
  ], { sint: true, detalhe: 'Brunea', efeitos: { acBonus: 1 } }),

  mi('matadora-de-dragoes', 'Matadora de Dragões', 'Arma', 'raro', [
    'Você ganha +1 nas jogadas de ataque e de dano feitas com esta arma mágica.',
    'A arma causa 3d6 pontos de dano extra do tipo dela se o alvo for um Dragão.',
  ], { detalhe: 'Qualquer Arma Simples ou Marcial', efeitos: { attackBonus: 1 } }),

  mi('elmo-do-pavor', 'Elmo do Pavor', 'Item Maravilhoso', 'comum', [
    'Enquanto você estiver usando este elmo de aço assustador, seus olhos brilham em vermelho e o resto do seu rosto fica escondido nas sombras.',
  ]),

  mi('globo-flutuante', 'Globo Flutuante', 'Item Maravilhoso', 'incomum', [
    'Esta pequena esfera de vidro grosso pesa 500 g. Se você estiver a até 18 metros dela, pode comandá-la para emanar luz equivalente à da magia Luz ou Luz do Dia (à sua escolha). Depois de usado, o efeito de Luz do Dia só volta a funcionar no próximo amanhecer.',
    'Você pode dar outro comando com uma ação Usar Magia para o globo iluminado subir e flutuar a no máximo 1,5 metro do chão. Ele paira assim até você ou outra criatura segurá-lo. Se você se afastar mais de 18 metros do globo flutuante, ele o segue pelo caminho mais curto até ficar a até 18 metros de você. Se for impedido de se mover, ele desce suavemente ao chão, fica inativo e sua luz se apaga.',
  ]),

  mi('po-do-desaparecimento', 'Pó do Desaparecimento', 'Item Maravilhoso', 'incomum', [
    'Este pó parece areia fina e há o bastante para um único uso.',
    'Quando você executa uma ação Utilizar para lançar o pó no ar, você e cada criatura e objeto em uma Emanação de 3 metros com origem em você recebem a condição Invisível por 2d4 minutos. A duração é a mesma para todos, e o pó é consumido quando a magia faz efeito. Imediatamente depois de uma criatura afetada fazer uma jogada de ataque, causar dano ou conjurar uma magia, a condição Invisível termina para ela.',
  ]),

  mi('po-da-secura', 'Pó da Secura', 'Item Maravilhoso', 'incomum', [
    'Este pacotinho contém 1d6 + 4 pitadas de pó.',
    'Com uma ação Utilizar, você pode espalhar uma pitada sobre água, transformando até um Cubo de 4,5 metros de água em uma pelota do tamanho de uma bolinha de gude, que flutua ou repousa perto de onde o pó foi espalhado. O peso da pelota é desprezível. Uma criatura pode executar uma ação Utilizar para esmagar a pelota contra uma superfície dura, fazendo-a se despedaçar e liberar a água absorvida, o que destrói a pelota e encerra a magia dela.',
    'Com uma ação Utilizar, você também pode espalhar uma pitada sobre um Elemental a até 1,5 metro de você composto principalmente de água. A criatura realiza uma salvaguarda de Constituição CD 13, sofrendo 10d6 pontos de dano Necrótico se falhar, ou metade desse dano em caso de sucesso.',
  ]),

  mi('po-do-espirro-e-do-sufocamento', 'Pó do Espirro e do Sufocamento', 'Item Maravilhoso', 'incomum', [
    'Encontrado em um pequeno recipiente, este pó se parece com o Pó do Desaparecimento, e a magia Identificar o revela como tal. Há o bastante para um único uso.',
    'Com uma ação Utilizar, você pode lançar o pó no ar, forçando você mesmo e todas as criaturas em uma Emanação de 9 metros com origem em você a realizar uma salvaguarda de Constituição CD 15. Constructos, Elementais, Limos, Plantas e Mortos-vivos passam automaticamente.',
    'Se falhar, a criatura começa a espirrar incontrolavelmente: ela recebe a condição Incapacitado e está sufocando. A criatura repete a salvaguarda no fim de cada turno dela, encerrando o efeito com um sucesso. O efeito também termina em qualquer criatura alvo da magia Restauração Menor.',
  ]),

  mi('placas-anas', 'Armadura de Placas Anã', 'Armadura', 'muito-raro', [
    'Enquanto veste esta armadura, você ganha +2 na Classe de Armadura. Além disso, se um efeito mover você contra a sua vontade pelo chão, você pode executar uma Reação para reduzir em até 3 metros a distância percorrida.',
  ], { detalhe: 'Meia Armadura ou Armadura de Placas', efeitos: { acBonus: 2 } }),

  mi('arremessador-anao', 'Arremessador Anão', 'Arma', 'muito-raro', [
    'Você ganha +3 nas jogadas de ataque e de dano feitas com esta arma mágica.',
    'Ela tem a propriedade Arremesso, com alcance normal de 6 metros e longo de 18 metros. Quando você acerta um ataque à distância com ela, causa 1d8 de dano de Força extra — ou 2d8 se o alvo for um Gigante. Imediatamente após acertar ou errar, a arma volta voando para a sua mão.',
  ], { sint: 'por um anão ou por uma criatura sintonizada a um Cinturão Anão', detalhe: 'Martelo de Guerra', efeitos: { attackBonus: 3 } }),

  mi('corneta-auditiva', 'Corneta Auditiva', 'Item Maravilhoso', 'comum', [
    'Enquanto estiver encostada no seu ouvido, esta corneta suprime os efeitos da condição Surdo sobre você.',
  ]),

  mi('garrafa-de-efreeti', 'Garrafa de Efreeti', 'Item Maravilhoso', 'muito-raro', [
    'Quando você executa uma ação Usar Magia para tirar a rolha desta garrafa de latão pintada, uma nuvem de fumaça densa sai dela. No fim do seu turno, a fumaça some num clarão de fogo inofensivo e um Efreeti aparece em um espaço desocupado a até 9 metros de você.',
    'Na primeira vez que a garrafa é aberta, o Mestre rola 1d10: com 1, o efreeti ataca você e, depois de 5 rodadas de luta, desaparece e a garrafa perde a magia; com 2–9, o efreeti entende seus idiomas e obedece aos seus comandos por 1 hora, depois volta para a garrafa (que não pode ser aberta por 24 horas) — o mesmo acontece nas duas aberturas seguintes, e na quarta o efreeti escapa e a garrafa perde a magia; com 10, o efreeti entende seus idiomas e pode conjurar Desejo uma vez para você, desaparecendo em seguida.',
  ]),

  mi('cota-de-efreeti', 'Cota de Efreeti', 'Armadura', 'lendario', [
    'Enquanto veste esta armadura, você ganha +3 na Classe de Armadura, tem Imunidade a dano Ígneo e conhece o idioma Primordial. Além disso, você pode ficar de pé e se mover sobre rocha derretida como se fosse chão sólido.',
  ], { sint: true, detalhe: 'Cota de Malha ou Camisão de Malha', efeitos: { acBonus: 3 } }),

  mi('gema-elemental', 'Gema Elemental', 'Item Maravilhoso', 'incomum', [
    'Esta gema contém uma centelha de energia elemental. Quando você executa uma ação Utilizar para quebrá-la, um elemental é convocado e a gema deixa de ser mágica.',
    'O elemental aparece em um espaço desocupado o mais perto possível da gema quebrada, entende seus idiomas, obedece aos seus comandos e age logo depois de você na Iniciativa. Ele desaparece depois de 1 hora, quando morre ou quando você o dispensa como ação Bônus.',
    'O tipo de gema determina o elemental: safira azul (Elemental do Ar), esmeralda (Elemental da Água), corindo vermelho (Elemental do Fogo) e diamante amarelo (Elemental da Terra).',
  ]),

  mi('elixir-da-saude', 'Elixir da Saúde', 'Poção', 'raro', [
    'Quando você bebe esta poção, é curado de todos os contágios mágicos. Além disso, as seguintes condições terminam em você: Cego, Surdo, Paralisado e Envenenado.',
    'O líquido vermelho e transparente tem minúsculas bolhas de luz dentro dele.',
  ]),

  mi('cota-elfica', 'Cota Élfica', 'Armadura', 'raro', [
    'Você ganha +1 na Classe de Armadura enquanto veste esta armadura. Você é considerado treinado com ela mesmo que não tenha treinamento com armaduras Médias ou Pesadas.',
  ], { detalhe: 'Cota de Malha ou Camisão de Malha', efeitos: { acBonus: 1 } }),
  mi('grimorio-duradouro', 'Grimório Duradouro', 'Item Maravilhoso', 'comum', [
    'Este grimório, e tudo o que estiver escrito em suas páginas, não pode ser danificado por fogo nem por água. Além disso, ele não se deteriora com o tempo.',
  ]),

  mi('arco-de-energia', 'Arco de Energia', 'Arma', 'muito-raro', [
    'Você ganha +1 nas jogadas de ataque e de dano feitas com esta arma mágica, que não tem corda.',
    'Cada vez que você puxa o braço para trás no gesto de disparo, uma flecha mágica de energia dourada aparece encaixada e pronta. Uma flecha produzida por esta arma causa dano de Força em vez de Perfurante e desaparece depois de acertar ou errar o alvo. Até desaparecer, a flecha emite luz plena num raio de 6 metros e penumbra por mais 6 metros.',
    'Flecha de Contenção. Sempre que usar esta arma para fazer um ataque à distância contra uma criatura, você pode tentar contê-la em vez de causar dano. Se a flecha acertar, o alvo deve passar em uma salvaguarda de Força CD 15 ou recebe a condição Contido por 1 minuto. Com uma ação, uma criatura Contida assim pode realizar um teste de Força (Atletismo) CD 20 para se libertar.',
    'Flecha de Transporte. Com uma ação Usar Magia, você pode disparar uma flecha de energia contra um alvo que possa ver a até 18 metros de você. O alvo pode se recusar; caso contrário, ele é teleportado para um espaço desocupado à sua escolha a até 18 metros de você. Esta propriedade só volta a funcionar no próximo amanhecer.',
  ], { sint: true, detalhe: 'Arco Longo ou Arco Curto', efeitos: { attackBonus: 1 } }),

  mi('armadura-encantada', 'Armadura Encantada', 'Armadura', 'varia', [
    'Presa a esta armadura está uma magia de 8º círculo ou menor, definida quando a armadura é criada e pertencente à escola de Abjuração ou Ilusão.',
    'A armadura tem 6 cargas e recupera 1d6 cargas gastas diariamente ao amanhecer. Enquanto a estiver vestindo, você pode gastar 1 carga para conjurar a magia dela.',
    'O círculo da magia define a CD de salvaguarda, o bônus de ataque e a raridade: truque e 1º círculo — Incomum, CD 13, +5; 2º e 3º — Rara, CD 13/15, +5/+7; 4º e 5º — Muito Rara, CD 15/17, +7/+9; 6º a 8º — Lendária, CD 17/18, +9/+10.',
  ], { sint: true, detalhe: 'Qualquer Armadura Leve, Média ou Pesada' }),

  mi('cajado-encantado', 'Cajado Encantado', 'Cajado', 'varia', [
    'Preso a este cajado está uma magia de 8º círculo ou menor, definida quando o cajado é criado e de qualquer escola de magia.',
    'O cajado tem 6 cargas e recupera 1d6 cargas gastas diariamente ao amanhecer. Enquanto o estiver segurando, você pode gastar 1 carga para conjurar a magia dele. Se gastar a última carga, role 1d20: com 1, o cajado perde suas propriedades e vira um Bordão não mágico.',
    'O círculo da magia define a CD de salvaguarda, o bônus de ataque e a raridade: truque e 1º círculo — Incomum, CD 13, +5; 2º e 3º — Raro, CD 13/15, +5/+7; 4º e 5º — Muito Raro, CD 15/17, +7/+9; 6º a 8º — Lendário, CD 17/18, +9/+10.',
  ], { sint: 'por um conjurador' }),

  mi('arma-encantada', 'Arma Encantada', 'Arma', 'varia', [
    'Presa a esta arma está uma magia de 8º círculo ou menor, definida quando a arma é criada e pertencente à escola de Invocação, Adivinhação, Evocação, Necromancia ou Transmutação.',
    'A arma tem 6 cargas e recupera 1d6 cargas gastas diariamente ao amanhecer. Enquanto a estiver segurando, você pode gastar 1 carga para conjurar a magia dela.',
    'O círculo da magia define a CD de salvaguarda, o bônus de ataque e a raridade: truque e 1º círculo — Incomum, CD 13, +5; 2º e 3º — Rara, CD 13/15, +5/+7; 4º e 5º — Muito Rara, CD 15/17, +7/+9; 6º a 8º — Lendária, CD 17/18, +9/+10.',
  ], { sint: true, detalhe: 'Qualquer Arma Simples ou Marcial' }),

  mi('olho-postico', 'Olho Postiço', 'Item Maravilhoso', 'comum', [
    'Este olho mágico substitui um olho real que foi perdido ou removido. Enquanto o Olho Postiço estiver encaixado na sua órbita, você enxerga através do pequeno orbe como se fosse o seu olho natural.',
    'Você pode inserir ou remover o Olho Postiço com uma ação Usar Magia, e ele não pode ser removido contra a sua vontade enquanto você estiver vivo.',
  ]),

  mi('garrafa-fumegante', 'Garrafa Fumegante', 'Item Maravilhoso', 'incomum', [
    'Com uma ação Usar Magia, você pode abrir ou fechar esta garrafa. Ao abri-la, uma fumaça densa jorra para fora, formando uma nuvem que preenche uma Emanação de 18 metros com origem na garrafa. A área dentro da fumaça fica Fortemente Obscurecida.',
    'A cada minuto que a garrafa permanece aberta, o tamanho da Emanação aumenta em 3 metros, até o máximo de 36 metros. Fechar a garrafa faz a nuvem ficar parada no lugar até se dispersar depois de 10 minutos. Um vento forte (como o criado pela magia Lufada de Vento) dispersa a nuvem em 1 minuto.',
  ]),

  mi('machado-do-carrasco', 'Machado do Carrasco', 'Arma', 'muito-raro', [
    'Você ganha +1 nas jogadas de ataque e de dano feitas com esta arma mágica.',
    'Qualquer Humanoide que você acertar com a arma sofre 2d6 de dano Cortante extra, e você ganha Pontos de Vida Temporários iguais ao dano extra causado.',
  ], { detalhe: 'Machado de Batalha, Machado Grande, Alabarda ou Machadinha', efeitos: { attackBonus: 1 } }),

  mi('olho-e-mao-de-vecna', 'Olho e Mão de Vecna', 'Item Maravilhoso', 'artefato', [
    'Vecna foi um poderoso mago que, por magia e conquista, ergueu um império terrível — e, temendo a morte, tornou-se um lich. Um tenente traiçoeiro chamado Kas pôs fim ao reinado dele; de Vecna sobraram apenas uma mão e um olho, artefatos macabros que ainda buscam cumprir a vontade do mestre.',
    'O Olho de Vecna e a Mão de Vecna são artefatos separados, que podem ser encontrados juntos ou não. Cada um tem 1 propriedade benéfica menor, 1 propriedade benéfica maior e 1 propriedade prejudicial menor.',
    'Sintonizar-se ao Olho. Para se sintonizar ao olho, você precisa pressioná-lo contra a sua órbita vazia. O olho se enxerta na sua cabeça e permanece lá até você morrer; se for removido, você morre. Enquanto sintonizado, seu alinhamento vira Neutro e Mau e você ganha Visão Verdadeira e a capacidade de conjurar magias poderosas de Adivinhação e Encantamento.',
    'Sintonizar-se à Mão. Para se sintonizar à mão, você precisa cortar o próprio punho esquerdo e prendê-la ao braço. Enquanto sintonizado, seu alinhamento vira Neutro e Mau, sua Força passa a ser 20 e você pode usar a mão para conjurar magias devastadoras.',
    'Quem estiver sintonizado aos dois artefatos ao mesmo tempo ganha poderes ainda maiores — e atrai a atenção do próprio Vecna.',
  ], { sint: true }),

  mi('olhos-do-encantamento', 'Olhos do Encantamento', 'Item Maravilhoso', 'incomum', [
    'Estas lentes de cristal se encaixam sobre os olhos e têm 3 cargas.',
    'Enquanto as usar, você pode gastar 1 ou mais cargas para conjurar Enfeitiçar Pessoa (CD de salvaguarda 13). Com 1 carga, você conjura a versão de 1º círculo; o círculo aumenta em um para cada carga adicional gasta. As lentes recuperam todas as cargas gastas diariamente ao amanhecer.',
  ], { sint: true }),

  mi('olhos-da-visao-minuciosa', 'Olhos da Visão Minuciosa', 'Item Maravilhoso', 'incomum', [
    'Estas lentes de cristal se encaixam sobre os olhos. Enquanto as usar, sua visão melhora bastante até 30 cm de distância, concedendo Visão no Escuro nesse alcance e Vantagem em testes de Inteligência (Investigação) feitos para examinar algo dentro dele.',
  ]),

  mi('olhos-da-aguia', 'Olhos da Águia', 'Item Maravilhoso', 'incomum', [
    'Estas lentes de cristal se encaixam sobre os olhos. Enquanto as usar, você tem Vantagem em testes de Sabedoria (Percepção) que dependam da visão. Em condições de boa visibilidade, você consegue distinguir detalhes de criaturas e objetos extremamente distantes, de até 60 cm de largura.',
  ]),

  mi('estatueta-de-poder-maravilhoso', 'Estatueta de Poder Maravilhoso', 'Item Maravilhoso', 'varia', [
    'Uma Estatueta de Poder Maravilhoso é pequena o bastante para caber no bolso. Se você executar uma ação Usar Magia para arremessá-la em um ponto no chão a até 18 metros de você, ela se torna uma criatura viva descrita abaixo. Se o espaço estiver ocupado ou não houver espaço suficiente, a estatueta não se transforma.',
    'A criatura é Amigável a você e aos seus aliados. Ela entende seus idiomas, obedece aos seus comandos e age logo depois de você na Iniciativa. Sem ordens, ela se defende, mas não executa outras ações.',
    'A criatura existe por uma duração específica de cada estatueta. No fim dela, volta à forma de estatueta — o que também acontece antes se a criatura cair a 0 Pontos de Vida ou se você executar uma ação Usar Magia tocando nela. Depois de voltar a ser estatueta, a propriedade não pode ser usada de novo por um tempo determinado.',
    'Tipos: Grifo de Bronze (Rara), Leão Dourado (Rara), Rato de Marfim (Comum), Corvo de Obsidiana (Incomum), Mosca de Serpentina (Muito Rara), Cabra de Prata (Rara), Cães de Ônix (Rara), Elefante de Mármore (Rara) e Corcel de Ébano (Muito Rara).',
  ]),

  mi('lingua-de-fogo', 'Língua de Fogo', 'Arma', 'raro', [
    'Enquanto segura esta arma mágica, você pode executar uma ação Bônus e dizer uma palavra de comando para fazer chamas envolverem a parte da arma que causa dano. Essas chamas emitem luz plena num raio de 12 metros e penumbra por mais 12 metros.',
    'Enquanto a arma estiver em chamas, ela causa 2d6 de dano Ígneo extra em um acerto. As chamas duram até você executar uma ação Bônus para repetir o comando ou até você largar, guardar ou embainhar a arma.',
  ], { sint: true, detalhe: 'Qualquer Arma Corpo a Corpo' }),

  mi('barco-dobravel', 'Barco Dobrável', 'Item Maravilhoso', 'raro', [
    'Este objeto parece uma caixa de madeira de 30 cm de comprimento por 15 cm de largura e 15 cm de profundidade. Pesa 2 kg e flutua. Pode ser aberta para guardar itens dentro. O item tem três palavras de comando, cada uma exigindo uma ação Usar Magia:',
    'Primeira palavra de comando. A caixa se desdobra em um Bote a Remo.',
    'Segunda palavra de comando. A caixa se desdobra em uma Chalupa.',
    'Terceira palavra de comando. O Barco Dobrável volta a ser uma caixa, se não houver criaturas a bordo. Objetos da embarcação que não couberem na caixa ficam do lado de fora enquanto ela se dobra; os que couberem permanecem dentro.',
    'Quando a caixa vira embarcação, seu peso passa a ser o de uma embarcação normal daquele tamanho. Se qualquer uma das embarcações for reduzida a 0 Pontos de Vida, o Barco Dobrável é destruído.',
  ]),

  mi('marca-de-gelo', 'Marca de Gelo', 'Arma', 'muito-raro', [
    'Quando você acerta com uma jogada de ataque usando esta arma mágica, o alvo sofre 1d6 de dano Gélido extra.',
    'Além disso, enquanto segura a arma, você tem Resistência a dano Ígneo. Em temperaturas congelantes, a arma emite luz plena num raio de 3 metros e penumbra por mais 3 metros.',
    'Quando você saca esta arma, pode extinguir todas as chamas não mágicas a até 9 metros de você. Depois de usada, esta propriedade só volta a funcionar depois de 1 hora.',
  ], { sint: true, detalhe: 'Glaive, Espada Grande, Espada Longa, Rapieira, Cimitarra ou Espada Curta' }),

  mi('manoplas-da-forca-do-ogro', 'Manoplas da Força do Ogro', 'Item Maravilhoso', 'incomum', [
    'Sua Força passa a ser 19 enquanto você usar estas manoplas. Elas não têm efeito sobre você se sua Força já for 19 ou mais sem elas.',
  ], { sint: true, resumo: 'Força 19 enquanto usadas.', efeitos: { setAbility: { for: 19 } } }),

  mi('gema-do-brilho', 'Gema do Brilho', 'Item Maravilhoso', 'incomum', [
    'Este prisma tem 50 cargas. Enquanto o estiver segurando, você pode executar uma ação Usar Magia e dizer uma de três palavras de comando:',
    'Primeira palavra. A gema emite luz plena num raio de 9 metros e penumbra por mais 9 metros. Este efeito não gasta carga e dura até você executar uma ação Bônus para repetir o comando ou usar outra função da gema.',
    'Segunda palavra. Você gasta 1 carga e a gema dispara um feixe brilhante contra uma criatura que possa ver a até 18 metros. A criatura deve passar em uma salvaguarda de Constituição CD 15 ou recebe a condição Cego por 1 minuto, repetindo a salvaguarda no fim de cada turno dela.',
    'Terceira palavra. Você gasta 5 cargas e a gema irrompe em luz intensa num Cone de 9 metros. Cada criatura no Cone realiza a mesma salvaguarda do feixe.',
    'Quando todas as cargas são gastas, a gema vira uma joia não mágica no valor de 50 PO.',
  ]),

  mi('gema-da-visao', 'Gema da Visão', 'Item Maravilhoso', 'raro', [
    'Esta gema tem 3 cargas. Com uma ação Usar Magia, você pode gastar 1 carga; pelos 10 minutos seguintes, você tem Visão Verdadeira a até 36 metros quando olha através da gema. A gema recupera 1d3 cargas gastas diariamente ao amanhecer.',
  ], { sint: true }),

  mi('matadora-de-gigantes', 'Matadora de Gigantes', 'Arma', 'raro', [
    'Você ganha +1 nas jogadas de ataque e de dano feitas com esta arma mágica.',
    'Quando você acerta um Gigante com esta arma, ele sofre 2d6 pontos de dano extra do tipo da arma e deve passar em uma salvaguarda de Força CD 15 ou recebe a condição Caído.',
  ], { detalhe: 'Qualquer Arma Simples ou Marcial', efeitos: { attackBonus: 1 } }),

  mi('couro-batido-encantado', 'Couro Batido Encantado', 'Armadura', 'raro', [
    'Enquanto veste esta armadura, você ganha +1 na Classe de Armadura.',
    'Você também pode executar uma ação Bônus para fazer a armadura assumir a aparência de um traje normal ou de outro tipo de armadura. Você decide como ela fica — cor, estilo e acessórios —, mas a armadura mantém o volume e o peso normais. A aparência ilusória dura até você usar esta propriedade de novo ou tirar a armadura.',
  ], { detalhe: 'Couro Batido', efeitos: { acBonus: 1 } }),

  mi('luvas-apanha-projeteis', 'Luvas Apanha-Projéteis', 'Item Maravilhoso', 'incomum', [
    'Se você for atingido por uma jogada de ataque feita com uma arma à Distância ou de Arremesso enquanto usa estas luvas, pode executar uma Reação para reduzir o dano em 1d10 mais o seu modificador de Destreza, se tiver uma mão livre. Se reduzir o dano a 0, você pode agarrar a munição ou a arma, desde que ela seja pequena o bastante para caber nessa mão.',
  ], { sint: true }),

  mi('luvas-de-natacao-e-escalada', 'Luvas de Natação e Escalada', 'Item Maravilhoso', 'incomum', [
    'Enquanto usar estas luvas, você tem Deslocamento de Escalada e Deslocamento de Natação iguais ao seu deslocamento e ganha +5 em testes de Força (Atletismo) feitos para escalar ou nadar.',
  ], { sint: true }),

  mi('luvas-de-gatuno', 'Luvas de Gatuno', 'Item Maravilhoso', 'incomum', [
    'Estas luvas são imperceptíveis quando usadas. Enquanto as usar, você ganha +5 em testes de Destreza (Prestidigitação) e em testes de Destreza feitos para abrir fechaduras.',
  ]),

  mi('oculos-da-noite', 'Óculos da Noite', 'Item Maravilhoso', 'incomum', [
    'Enquanto usar estas lentes escuras, você tem Visão no Escuro a até 18 metros. Se você já tiver Visão no Escuro, usar os óculos aumenta o alcance dela em 18 metros.',
  ]),

  mi('olho-de-bruxa', 'Olho de Bruxa', 'Item Maravilhoso', 'incomum', [
    'Um Olho de Bruxa tem 3 cargas. Enquanto o estiver usando ou segurando, você pode gastar 1 carga para conjurar Visão no Escuro (mirando apenas em si mesmo) ou Ver o Invisível. Ele recupera todas as cargas gastas diariamente ao amanhecer.',
    'Sensor do Coven. O Olho de Bruxa costuma ser confiado a um lacaio da bruxa para guarda e transporte. Com uma ação Usar Magia, uma bruxa do coven que o criou pode ver o que o Olho vê, desde que ambos estejam no mesmo plano de existência. O efeito dura enquanto a bruxa mantiver Concentração, e várias bruxas do coven podem ver por ele ao mesmo tempo.',
    'Criando um Olho de Bruxa. Só um coven de bruxas consegue fabricar este item, feito de um olho real envernizado. Um coven só pode ter um Olho de Bruxa por vez, e criar um novo exige que as três bruxas realizem um rito especial de 1 hora.',
  ]),

  mi('martelo-dos-trovoes', 'Martelo dos Trovões', 'Arma', 'lendario', [
    'Você ganha +1 nas jogadas de ataque e de dano feitas com esta arma mágica.',
    'A arma tem 5 cargas. Você pode gastar 1 carga e fazer um ataque à distância com ela, arremessando-a como se tivesse a propriedade Arremesso, com alcance normal de 6 metros e longo de 18 metros. Se o ataque acertar, a arma libera um estrondo audível a até 90 metros: o alvo e todas as criaturas a até 9 metros dele, exceto você, devem passar em uma salvaguarda de Constituição CD 17 ou recebem a condição Atordoado até o fim do seu próximo turno. Imediatamente após acertar ou errar, a arma volta voando para a sua mão. Ela recupera 1d4 + 1 cargas gastas diariamente ao amanhecer.',
    'Perdição dos Gigantes. Enquanto estiver sintonizado à arma e usando um Cinturão de Força do Gigante ou Manoplas da Força do Ogro aos quais também esteja sintonizado, você ganha: quando tirar 20 no d20 de uma jogada de ataque com esta arma contra um Gigante, ele deve passar em uma salvaguarda de Constituição CD 17 ou morre; e o valor de Força concedido pelo cinturão ou pelas manoplas aumenta em 4, até o máximo de 30.',
  ], { sint: true, detalhe: 'Malho ou Martelo de Guerra', efeitos: { attackBonus: 1 } }),

  mi('chapeu-de-disfarce', 'Chapéu de Disfarce', 'Item Maravilhoso', 'incomum', [
    'Enquanto usar este chapéu, você pode conjurar a magia Disfarçar-se. A magia termina se o chapéu for retirado.',
  ], { sint: true }),
  mi('chapeu-de-muitas-magias', 'Chapéu de Muitas Magias', 'Item Maravilhoso', 'muito-raro', [
    'Foco de Conjuração. Enquanto segura o chapéu, você pode usá-lo como Foco de Conjuração das suas magias de Mago. Qualquer magia conjurada com o chapéu ganha um componente Somático especial: você precisa enfiar a mão nele e "puxar" a magia de dentro.',
    'Magia Desconhecida. Segurando o chapéu, você pode tentar conjurar uma magia de 1º círculo ou maior que não conhece. A magia precisa estar na lista de Mago, ser de um círculo que você consiga conjurar e não pode ter componentes Materiais que custem mais de 1.000 PO.',
    'Escolhida a magia, você gasta um espaço do círculo dela e realiza um teste de Inteligência (Arcanismo) CD 10 + o círculo da magia. Se for bem-sucedido, você conjura a magia com o tempo de conjuração normal e só volta a usar esta propriedade depois de terminar um Descanso Curto ou Longo. Se falhar, a magia não sai e um efeito mágico aleatório acontece no lugar.',
    'Qualquer magia conjurada pelo chapéu usa a sua CD de salvaguarda de magia e o seu bônus de ataque mágico.',
  ], { sint: 'por um Mago' }),

  mi('chapeu-de-vermes', 'Chapéu de Vermes', 'Item Maravilhoso', 'comum', [
    'Este chapéu tem 3 cargas. Segurando-o, você pode executar uma ação Usar Magia para gastar 1 carga e convocar um Morcego, um Sapo ou um Rato, à sua escolha.',
    'A criatura convocada aparece magicamente dentro do chapéu e tenta fugir de você o mais rápido possível. Ela é Indiferente a você e às outras criaturas e não está sob o seu controle; comporta-se como uma criatura comum da espécie dela e desaparece depois de 1 hora ou quando cai a 0 Pontos de Vida. O chapéu recupera todas as cargas gastas diariamente ao amanhecer.',
  ]),

  mi('chapeu-de-magia', 'Chapéu de Magia', 'Item Maravilhoso', 'comum', [
    'Este chapéu cônico é adornado com luas e estrelas. Enquanto o usar, você ganha:',
    'Foco de Conjuração. Você pode usar o chapéu como Foco de Conjuração das suas magias de Mago.',
    'Magia Desconhecida. Com uma ação Usar Magia, você pode tentar conjurar um truque que não conhece. O truque precisa estar na lista de Mago e ter tempo de conjuração de uma ação, e você realiza um teste de Inteligência (Arcanismo) CD 10. Se for bem-sucedido, você conjura a magia; se falhar, a magia falha e a ação é desperdiçada. Nos dois casos, você só volta a usar esta propriedade depois de terminar um Descanso Longo.',
  ], { sint: 'por um Mago' }),

  mi('bandana-do-intelecto', 'Bandana do Intelecto', 'Item Maravilhoso', 'incomum', [
    'Sua Inteligência passa a ser 19 enquanto você usar esta bandana. Ela não tem efeito sobre você se sua Inteligência já for 19 ou mais sem ela.',
  ], { sint: true, resumo: 'Inteligência 19 enquanto usada.', efeitos: { setAbility: { int: 19 } } }),

  mi('elmo-do-brilhantismo', 'Elmo do Brilhantismo', 'Item Maravilhoso', 'muito-raro', [
    'Este elmo é cravejado com 1d10 diamantes, 2d10 rubis, 3d10 opalas de fogo e 4d10 opalas. Qualquer gema arrancada do elmo vira pó. Quando todas são removidas ou destruídas, o elmo perde a magia. Enquanto o usar, você ganha:',
    'Luz de Diamante. Enquanto tiver ao menos um diamante, o elmo emite uma Emanação de 9 metros. Quando há ao menos um Morto-vivo nessa área, a Emanação se enche de penumbra, e qualquer Morto-vivo que começar o turno nela sofre 1d6 de dano Radiante.',
    'Chamas de Opala de Fogo. Enquanto tiver ao menos uma opala de fogo, você pode executar uma ação Usar Magia para fazer uma arma que esteja segurando irromper em chamas. As chamas emitem luz plena num raio de 3 metros e penumbra por mais 3 metros e são inofensivas para você e para a arma. Quando você acerta um ataque com a arma em chamas, o alvo sofre 1d6 de dano Ígneo extra. As chamas duram até você executar uma ação Bônus para apagá-las ou até largar ou guardar a arma.',
    'Resistência de Rubi. Enquanto tiver ao menos um rubi, você tem Resistência a dano Ígneo.',
    'Magias. Enquanto o elmo tiver opalas, você pode conjurar magias com ele, gastando gemas: Luz do Dia (1 opala), Bola de Fogo (2 opalas), Muralha de Fogo (3 opalas) e Explosão Solar (4 opalas). CD de salvaguarda 18.',
  ], { sint: true }),

  mi('elmo-da-compreensao-de-idiomas', 'Elmo da Compreensão de Idiomas', 'Item Maravilhoso', 'incomum', [
    'Enquanto usar este elmo, você pode conjurar Compreender Idiomas a partir dele.',
  ]),

  mi('elmo-da-telepatia', 'Elmo da Telepatia', 'Item Maravilhoso', 'incomum', [
    'Enquanto usar este elmo, você tem telepatia com alcance de 9 metros e pode conjurar Detectar Pensamentos ou Sugestão (CD de salvaguarda 13) a partir dele. Depois que uma dessas magias é conjurada pelo elmo, ela só pode ser conjurada de novo por ele no próximo amanhecer.',
  ], { sint: true }),

  mi('elmo-do-teleporte', 'Elmo do Teleporte', 'Item Maravilhoso', 'raro', [
    'Este elmo tem 3 cargas. Enquanto o usar, você pode gastar 1 carga para conjurar Teleporte a partir dele. O elmo recupera 1d3 cargas gastas diariamente ao amanhecer.',
  ], { sint: true }),

  mi('mochila-pratica-de-heward', 'Mochila Prática de Heward', 'Item Maravilhoso', 'raro', [
    'Esta mochila tem um bolso central e dois bolsos laterais, cada um deles um espaço extradimensional. Cada bolso lateral comporta até 90 kg, sem exceder 0,7 m³; o bolso central comporta até 225 kg, sem exceder 1,8 m³. A mochila sempre pesa 2,5 kg, seja qual for o conteúdo.',
    'Retirar um item da mochila exige uma ação Utilizar ou uma ação Bônus (à sua escolha). Quando você enfia a mão procurando um item específico, ele está sempre magicamente por cima.',
    'Se qualquer bolso for sobrecarregado, perfurado ou rasgado, a mochila se rompe e é destruída, e o conteúdo é perdido para sempre — embora um Artefato sempre reapareça em algum lugar. Se a mochila for virada do avesso, o conteúdo cai sem sofrer dano e ela precisa ser desvirada antes de voltar a funcionar.',
    'Cada bolso comporta ar para 10 minutos de respiração, dividido pelo número de criaturas que respiram lá dentro. Colocar a mochila dentro de um Saco de Contenção, de um Buraco Portátil ou de espaço extradimensional semelhante destrói os dois itens e abre um portal para o Plano Astral.',
  ]),

  mi('bolsa-de-temperos-de-heward', 'Bolsa de Temperos Prática de Heward', 'Item Maravilhoso', 'comum', [
    'Esta bolsa de cinto parece vazia e tem 10 cargas.',
    'Segurando a bolsa, você pode executar uma ação Usar Magia para gastar 1 carga, nomear qualquer tempero não mágico (como sal, pimenta, açafrão ou coentro) e tirar dela uma pitada do tempero desejado. Uma pitada dá para temperar uma refeição. A bolsa recupera 1d6 + 4 cargas gastas diariamente ao amanhecer.',
  ]),

  mi('vingador-sagrado', 'Vingador Sagrado', 'Arma', 'lendario', [
    'Você ganha +3 nas jogadas de ataque e de dano feitas com esta arma mágica. Quando você acerta um Ínfero ou um Morto-vivo com ela, a criatura sofre 2d10 de dano Radiante extra.',
    'Enquanto você segura a arma desembainhada, ela cria uma Emanação de 3 metros com origem em você. Você e todas as criaturas Amigáveis a você na Emanação têm Vantagem em salvaguardas contra magias e outros efeitos mágicos. Se você tiver 17 níveis ou mais na classe Paladino, o tamanho da Emanação aumenta para 9 metros.',
  ], { sint: 'por um Paladino', detalhe: 'Qualquer Arma Simples ou Marcial', efeitos: { attackBonus: 3 } }),

  mi('trompa-explosiva', 'Trompa Explosiva', 'Item Maravilhoso', 'raro', [
    'Você pode executar uma ação Usar Magia para soprar a trompa, que emite um estrondo em um Cone de 9 metros, audível a até 180 metros. Cada criatura no Cone realiza uma salvaguarda de Constituição CD 15, sofrendo 5d8 de dano Trovejante e recebendo a condição Surdo por 1 minuto se falhar, ou apenas metade do dano em caso de sucesso.',
    'Objetos de vidro ou cristal no Cone que não estejam sendo vestidos ou carregados sofrem 10d8 de dano Trovejante.',
    'Cada uso da magia da trompa tem 20% de chance de fazê-la explodir. A explosão causa 10d6 de dano de Força a quem a usou e destrói a trompa.',
  ]),

  mi('trompa-do-alarme-silencioso', 'Trompa do Alarme Silencioso', 'Item Maravilhoso', 'comum', [
    'Esta trompa tem 4 cargas e recupera 1d4 cargas gastas diariamente ao amanhecer.',
    'Com uma ação Usar Magia, você pode soprar a trompa gastando 1 carga. Uma criatura à sua escolha ouve o toque, desde que esteja a até 180 metros da trompa. Nenhuma outra criatura a ouve.',
  ]),

  mi('trompa-de-valhalla', 'Trompa de Valhalla', 'Item Maravilhoso', 'varia', [
    'Você pode executar uma ação Usar Magia para soprar esta trompa. Em resposta, espíritos guerreiros do plano de Ysgard aparecem em espaços desocupados a até 18 metros de você. Cada espírito usa o bloco de estatísticas de Furioso e volta a Ysgard depois de 1 hora ou quando cai a 0 Pontos de Vida. Eles parecem guerreiros vivos e têm Imunidade às condições Enfeitiçado e Amedrontado.',
    'Depois de usada, a trompa só volta a funcionar depois de 7 dias.',
    'Existem quatro tipos, cada um de um metal, com número de espíritos e exigência próprios: Prata (Raro, 2 espíritos, sem exigência); Latão (Raro, 3 espíritos, proficiência com todas as armas Simples); Bronze (Muito Raro, 4 espíritos, treinamento com todas as armaduras Médias); Ferro (Lendário, 5 espíritos, proficiência com todas as armas Marciais).',
    'Se você soprar a trompa sem cumprir a exigência dela, os espíritos convocados atacam você. Se cumprir, eles são Amigáveis a você e aos seus aliados e seguem os seus comandos.',
  ]),

  mi('ferraduras-do-zefiro', 'Ferraduras do Zéfiro', 'Item Maravilhoso', 'muito-raro', [
    'Estas ferraduras vêm em um conjunto de quatro. Com uma ação Usar Magia, você pode encostar uma delas no casco de um cavalo ou criatura semelhante, e ela se prende sozinha. Retirar uma ferradura também exige uma ação Usar Magia.',
    'Enquanto as quatro estiverem presas aos cascos da mesma criatura, elas permitem que ela se mova normalmente flutuando a 10 cm acima da superfície. Isso significa que a criatura pode atravessar ou ficar sobre superfícies não sólidas ou instáveis, como água ou lava. A criatura não deixa rastros e ignora Terreno Difícil.',
    'Além disso, a criatura pode viajar por até 12 horas por dia sem ganhar níveis de Exaustão por viagem prolongada.',
  ]),

  mi('ferraduras-da-velocidade', 'Ferraduras da Velocidade', 'Item Maravilhoso', 'raro', [
    'Estas ferraduras vêm em um conjunto de quatro. Com uma ação Usar Magia, você pode encostar uma delas no casco de um cavalo ou criatura semelhante, e ela se prende sozinha. Retirar uma ferradura também exige uma ação Usar Magia.',
    'Enquanto as quatro estiverem presas à mesma criatura, o deslocamento dela aumenta em 9 metros.',
  ]),

  mi('bastao-imovel', 'Bastão Imóvel', 'Bastão', 'incomum', [
    'Este bastão de ferro tem um botão em uma das pontas. Você pode executar uma ação Utilizar para apertar o botão, o que faz o bastão ficar magicamente fixo no lugar. Até você ou outra criatura executar uma ação Utilizar para apertar o botão de novo, o bastão não se move, mesmo desafiando a gravidade.',
    'O bastão suporta até 3.600 kg. Peso maior faz o bastão desativar e cair. Uma criatura pode executar uma ação Utilizar para realizar um teste de Força (Atletismo) CD 30, movendo o bastão fixo em até 3 metros se for bem-sucedida.',
  ]),

  mi('instrumento-de-ilusoes', 'Instrumento de Ilusões', 'Item Maravilhoso', 'comum', [
    'Enquanto toca este instrumento musical, você pode executar uma ação Usar Magia para criar efeitos visuais ilusórios inofensivos em uma Emanação de 1,5 metro com origem no instrumento. Se você for um Bardo, o tamanho da Emanação aumenta para 4,5 metros.',
    'Exemplos de efeitos: notas musicais luminosas, um dançarino espectral, borboletas e neve caindo suavemente. Os efeitos não têm substância nem som e são obviamente ilusórios. Eles terminam quando você para de tocar.',
  ]),

  mi('instrumento-de-escrita', 'Instrumento de Escrita', 'Item Maravilhoso', 'comum', [
    'Este instrumento musical tem 3 cargas e recupera todas as cargas gastas diariamente ao amanhecer.',
    'Enquanto o toca, você pode executar uma ação Usar Magia para gastar 1 carga e escrever uma mensagem mágica em um objeto ou superfície não mágicos que possa ver a até 9 metros de você. A mensagem pode ter até seis palavras e é escrita em um idioma que você conhece. Se você for um Bardo, pode escrever mais sete palavras e fazer a mensagem brilhar fracamente, permitindo que seja vista na escuridão não mágica.',
    'Conjurar Dissipar Magia sobre a mensagem a apaga. Fora isso, ela some depois de 24 horas.',
  ]),

  mi('instrumento-dos-bardos', 'Instrumento dos Bardos', 'Item Maravilhoso', 'varia', [
    'Um Instrumento dos Bardos é superior a um instrumento comum em todos os aspectos. Existem sete tipos, cada um com o nome de um colégio de bardo.',
    'Uma criatura que tentar tocar o instrumento sem estar sintonizada a ele deve passar em uma salvaguarda de Sabedoria CD 15 ou sofre 2d4 de dano Psíquico.',
    'Você pode tocar o instrumento para conjurar uma das magias dele. Depois de usado para conjurar uma magia, ele só volta a conjurar aquela magia no próximo amanhecer. As magias usam o seu atributo de conjuração e a sua CD de salvaguarda.',
    'Todos os instrumentos permitem conjurar Voo, Invisibilidade, Levitação e Proteção Contra o Bem e o Mal, além das magias específicas: alaúde Doss (Incomum), lira Fochlucan (Incomum), gaita Mac-Fuirmidh (Incomum), bandolim Canaith (Raro), lira Cli (Raro), harpa Anstruth (Muito Raro) e harpa Ollamh (Lendário).',
  ], { sint: 'por um Bardo' }),

  mi('pedra-ioun', 'Pedra Ioun', 'Item Maravilhoso', 'varia', [
    'Do tamanho aproximado de uma bolinha de gude, as Pedras Ioun levam o nome de Ioun, um deus do conhecimento e da profecia reverenciado em alguns mundos. Existem muitos tipos, cada um com uma combinação distinta de formato e cor.',
    'Quando você executa uma ação Usar Magia para lançar uma Pedra Ioun ao ar, ela passa a orbitar a sua cabeça a 30–90 cm de distância, concedendo o benefício dela enquanto o faz. Você pode ter até três Pedras Ioun orbitando a sua cabeça ao mesmo tempo.',
    'Cada pedra em órbita é considerada um objeto que você está usando. Ela evita contato com outras criaturas e objetos, ajustando a órbita para evitar colisões e frustrando todas as tentativas de outras criaturas de atacá-la ou agarrá-la. Com uma ação Utilizar, você pode pegar e guardar quantas pedras quiser. Se a sua sintonização a uma Pedra Ioun terminar enquanto ela orbita, a pedra cai como se você a tivesse largado.',
    'Tipos: Absorção (Muito Rara), Agilidade, Força, Intelecto, Liderança e Vitalidade (Muito Raras, +2 no atributo até o máximo de 20), Consciência (Rara), Proteção (Rara, +1 na CA), Reserva (Rara), Regeneração (Lendária), Manutenção (Lendária), Maestria (Lendária, +1 no bônus de proficiência) e Sustento (Rara).',
  ], { sint: true }),

  mi('faixas-de-ferro-de-bilarro', 'Faixas de Ferro de Bilarro', 'Item Maravilhoso', 'raro', [
    'Esta esfera de ferro enferrujada mede 7,5 cm de diâmetro e pesa 500 g.',
    'Você pode executar uma ação Usar Magia para arremessar a esfera contra uma criatura Enorme ou menor que possa ver a até 18 metros de você. Enquanto atravessa o ar, a esfera se abre em um emaranhado de faixas de metal. Faça uma jogada de ataque à distância com bônus igual ao seu modificador de Destreza mais o seu bônus de proficiência. Se acertar, o alvo recebe a condição Contido até você executar uma ação Bônus para dar o comando que o libera. Fazer isso, ou errar o ataque, faz as faixas se contraírem e voltarem a ser uma esfera.',
    'Uma criatura que consiga tocar as faixas, inclusive a que está Contida, pode executar uma ação para realizar um teste de Força (Atletismo) CD 20 para rompê-las. Se for bem-sucedida, o item é destruído e a criatura Contida se liberta; se falhar, novas tentativas dessa criatura falham automaticamente por 24 horas.',
    'Depois de usadas, as faixas só voltam a funcionar no próximo amanhecer.',
  ]),

  mi('frasco-de-ferro', 'Frasco de Ferro', 'Item Maravilhoso', 'lendario', [
    'Segurando este frasco de ferro com rolha de latão, você pode executar uma ação Usar Magia para mirar uma criatura que possa ver a até 18 metros. Se o frasco estiver vazio e a criatura for nativa de outro plano de existência, ela deve passar em uma salvaguarda de Sabedoria CD 17 ou fica presa no frasco. Se já tiver sido presa por ele antes, tem Vantagem na salvaguarda.',
    'Uma vez presa, a criatura permanece no frasco até ser libertada. O frasco só comporta uma criatura por vez. Uma criatura presa não envelhece e não precisa respirar, comer nem beber.',
    'Você pode executar uma ação Usar Magia para tirar a rolha e libertar a criatura. Ela então obedece aos seus comandos por 1 hora, entendendo-os mesmo sem conhecer o idioma. Se você não der comandos, ou der um comando que provavelmente resulte na morte ou no aprisionamento dela, ela se defende, mas não executa outras ações. No fim da duração, a criatura age conforme a disposição normal dela.',
  ]),

  mi('azagaia-relampejante', 'Azagaia Relampejante', 'Arma', 'incomum', [
    'Cada vez que você fizer uma jogada de ataque com esta arma mágica e acertar, pode fazer com que ela cause dano Elétrico em vez de Perfurante.',
    'Relâmpago. Quando você arremessar esta arma contra um alvo a até 36 metros de você, pode abrir mão da jogada de ataque à distância e transformar a arma em um raio. Esse raio forma uma Linha de 1,5 metro de largura entre você e o alvo. O alvo e cada outra criatura na Linha (menos você) realizam uma salvaguarda de Destreza CD 13, sofrendo 4d6 de dano Elétrico se falharem, ou metade em caso de sucesso.',
    'Imediatamente depois de causar esse dano, a arma reaparece na sua mão. Esta propriedade só volta a funcionar no próximo amanhecer.',
  ], { detalhe: 'Azagaia' }),

  mi('unguento-de-keoghtom', 'Unguento de Keoghtom', 'Item Maravilhoso', 'incomum', [
    'Este pote de vidro de 7,5 cm de diâmetro contém 1d4 + 1 doses de uma mistura espessa com leve cheiro de babosa. O pote e o conteúdo pesam 250 g.',
    'Com uma ação Utilizar, você pode engolir uma dose do unguento ou aplicá-la em uma criatura a até 1,5 metro de você. A criatura que o recebe recupera 2d8 + 2 Pontos de Vida e deixa de ter a condição Envenenado.',
  ]),

  mi('lampiao-revelador', 'Lampião Revelador', 'Item Maravilhoso', 'incomum', [
    'Aceso, este lampião coberto queima por 6 horas com meio litro de óleo, emitindo luz plena num raio de 9 metros e penumbra por mais 9 metros. Criaturas e objetos invisíveis ficam visíveis enquanto estiverem na luz plena do lampião.',
    'Você pode executar uma ação Utilizar para baixar a tampa, reduzindo a luz do lampião a penumbra num raio de 1,5 metro.',
  ]),

  mi('fechadura-enganadora', 'Fechadura Enganadora', 'Item Maravilhoso', 'comum', [
    'Esta fechadura parece uma Fechadura comum e vem com uma única chave. Os tambores dela se ajustam magicamente para frustrar arrombadores: testes de Destreza feitos para abri-la têm Desvantagem.',
  ]),

  mi('lamina-da-sorte', 'Lâmina da Sorte', 'Arma', 'lendario', [
    'Você ganha +1 nas jogadas de ataque e de dano feitas com esta arma mágica. Enquanto ela estiver com você, você também ganha +1 nas salvaguardas.',
    'Sorte. Se a arma estiver com você, pode invocar a sorte dela (não exige ação) para rolar de novo um Teste D20 fracassado, desde que não tenha a condição Incapacitado. Você deve usar o segundo resultado. Depois de usada, esta propriedade só volta a funcionar no próximo amanhecer.',
    'Desejo. A arma tem 1d3 cargas. Segurando-a, você pode gastar 1 carga e conjurar Desejo a partir dela. Depois de usada, esta propriedade só volta a funcionar no próximo amanhecer. A arma perde esta propriedade se ficar sem cargas.',
  ], { sint: true, detalhe: 'Glaive, Espada Grande, Espada Longa, Rapieira, Cimitarra, Foice Curta ou Espada Curta', efeitos: { attackBonus: 1, saveBonus: 1 } }),

  mi('alaude-do-baque-trovejante', 'Alaúde do Baque Trovejante', 'Arma', 'muito-raro', [
    'Este alaúde reforçado pode ser empunhado como um Cacetete mágico que causa 2d8 de dano Trovejante extra em um acerto.',
    'Cantar e Golpear. Se você for um Bardo, pode usar o seu modificador de Carisma no lugar do modificador de Força ao fazer uma jogada de ataque corpo a corpo com o alaúde, desde que cante ou cantarole enquanto ataca.',
  ], { detalhe: 'Cacetete' }),

  mi('maca-da-perturbacao', 'Maça da Perturbação', 'Arma', 'raro', [
    'Quando você acerta um Ínfero ou um Morto-vivo com esta arma mágica, a criatura sofre 2d6 de dano Radiante extra. Se o alvo tiver 25 Pontos de Vida ou menos depois de sofrer esse dano, ele deve passar em uma salvaguarda de Sabedoria CD 15 ou é destruído. Em caso de sucesso, a criatura recebe a condição Amedrontado até o fim do seu próximo turno.',
    'Luz. Enquanto você segura esta arma, ela emite luz plena num raio de 6 metros e penumbra por mais 6 metros.',
  ], { sint: true, detalhe: 'Maça' }),
  mi('maca-do-castigo', 'Maça do Castigo', 'Arma', 'raro', [
    'Você ganha +1 nas jogadas de ataque e de dano feitas com esta arma mágica. O bônus aumenta para +3 quando você usa a arma para atacar um Constructo.',
    'Quando você tira 20 em uma jogada de ataque feita com esta arma, o alvo sofre 7 pontos de dano de Concussão extra, ou 14 se for um Constructo. Se um Constructo tiver 25 Pontos de Vida ou menos depois de sofrer esse dano, ele é destruído.',
  ], { detalhe: 'Maça', efeitos: { attackBonus: 1 } }),

  mi('maca-do-terror', 'Maça do Terror', 'Arma', 'raro', [
    'Esta arma mágica tem 3 cargas e recupera 1d3 cargas gastas diariamente ao amanhecer.',
    'Segurando a arma, você pode executar uma ação Usar Magia e gastar 1 carga para liberar uma onda de terror. Cada criatura à sua escolha a até 9 metros de você deve passar em uma salvaguarda de Sabedoria CD 15 ou recebe a condição Amedrontado por 1 minuto.',
    'Enquanto Amedrontada assim, a criatura precisa gastar os turnos dela tentando se afastar o máximo possível de você e não pode fazer Ataques de Oportunidade. Como ação, ela só pode usar a ação Correr ou tentar escapar de um efeito que a impeça de se mover; se não tiver para onde ir, pode executar a ação Esquivar. No fim de cada turno dela, a criatura repete a salvaguarda, encerrando o efeito com um sucesso.',
  ], { sint: true, detalhe: 'Maça' }),

  mi('manto-de-resistencia-a-magia', 'Manto de Resistência a Magia', 'Item Maravilhoso', 'raro', [
    'Você tem Vantagem em salvaguardas contra magias enquanto usar este manto.',
  ], { sint: true }),

  mi('manual-da-saude-corporal', 'Manual da Saúde Corporal', 'Item Maravilhoso', 'muito-raro', [
    'Este livro traz dicas de saúde e nutrição, e suas palavras estão carregadas de magia. Se você passar 48 horas ao longo de 6 dias ou menos estudando o conteúdo e praticando as orientações, sua Constituição aumenta em 2, até o máximo de 30. O manual então perde a magia, mas a recupera em um século.',
  ]),

  mi('manual-do-exercicio-proveitoso', 'Manual do Exercício Proveitoso', 'Item Maravilhoso', 'muito-raro', [
    'Este livro descreve exercícios físicos, e suas palavras estão carregadas de magia. Se você passar 48 horas ao longo de 6 dias ou menos estudando o conteúdo e praticando as orientações, sua Força aumenta em 2, até o máximo de 30. O manual então perde a magia, mas a recupera em um século.',
  ]),

  mi('manual-dos-golens', 'Manual dos Golens', 'Item Maravilhoso', 'muito-raro', [
    'Este tomo contém as informações e os encantamentos necessários para criar um tipo específico de golem, escolhido pelo Mestre ou determinado aleatoriamente.',
    'Para decifrar e usar o manual, você precisa ser um conjurador com pelo menos dois espaços de magia de 5º círculo. Uma criatura que não consiga usar um Manual dos Golens e tente lê-lo sofre 6d6 de dano Psíquico.',
    'Para criar o golem, você deve passar o tempo indicado trabalhando sem interrupção com o manual em mãos, descansando no máximo 8 horas por dia, e pagar o custo especificado em suprimentos: Golem de Argila (30 dias, 65.000 PO), Golem de Carne (60 dias, 50.000 PO), Golem de Ferro (120 dias, 100.000 PO) e Golem de Pedra (90 dias, 80.000 PO).',
    'Terminada a criação, o livro é consumido em chamas místicas. O golem ganha vida quando as cinzas do manual são espalhadas sobre ele, ficando sob o seu controle e obedecendo aos seus comandos.',
  ]),

  mi('manual-da-rapidez-de-acao', 'Manual da Rapidez de Ação', 'Item Maravilhoso', 'muito-raro', [
    'Este livro traz exercícios de coordenação e equilíbrio, e suas palavras estão carregadas de magia. Se você passar 48 horas ao longo de 6 dias ou menos estudando o conteúdo e praticando as orientações, sua Destreza aumenta em 2, até o máximo de 30. O manual então perde a magia, mas a recupera em um século.',
  ]),

  mi('armadura-do-marinheiro', 'Armadura do Marinheiro', 'Armadura', 'incomum', [
    'Enquanto veste esta armadura, você tem Deslocamento de Natação igual ao seu deslocamento. Além disso, se você começar o turno debaixo d\'água com 0 Pontos de Vida, recupera imediatamente 1d4 Pontos de Vida. A armadura não pode curar ninguém de novo até o próximo amanhecer.',
    'A armadura é decorada com motivos de peixes e conchas.',
  ], { detalhe: 'Qualquer Armadura Leve, Média ou Pesada' }),

  mi('medalhao-dos-pensamentos', 'Medalhão dos Pensamentos', 'Item Maravilhoso', 'incomum', [
    'O medalhão tem 5 cargas. Enquanto o usar, você pode gastar 1 carga para conjurar Detectar Pensamentos (CD de salvaguarda 13) a partir dele. O medalhão recupera 1d4 cargas gastas diariamente ao amanhecer.',
  ], { sint: true }),

  mi('espelho-aprisionador-de-vidas', 'Espelho Aprisionador de Vidas', 'Item Maravilhoso', 'muito-raro', [
    'Quando este espelho de 1,2 metro de altura por 60 cm de largura é visto indiretamente, a superfície mostra imagens fracas de criaturas. Ele pesa 22,5 kg e tem CA 11, PV 10, Imunidade a dano Venenoso e Psíquico e Vulnerabilidade a dano de Concussão. Ele se estilhaça e é destruído ao ser reduzido a 0 Pontos de Vida.',
    'Se o espelho estiver pendurado em uma superfície vertical e você estiver a até 1,5 metro dele, você pode executar uma ação Usar Magia e dizer uma palavra de comando para ativá-lo. Ele permanece ativado até você repetir a palavra de comando com outra ação Usar Magia.',
    'Qualquer criatura que não seja você e que veja o próprio reflexo no espelho ativado estando a até 9 metros dele deve passar em uma salvaguarda de Carisma CD 15 ou fica presa, junto com tudo o que estiver vestindo e carregando, em uma das doze celas extradimensionais do espelho. Uma criatura que conheça a natureza do espelho faz a salvaguarda com Vantagem, e Constructos passam automaticamente.',
    'Cada cela é uma extensão infinita cheia de névoa densa que reduz a visibilidade a 3 metros. Criaturas presas não envelhecem e não precisam comer, beber nem dormir. Você pode executar uma ação Usar Magia para libertar uma criatura de uma cela, ou trocar de lugar com ela.',
  ]),

  mi('lamina-lunar', 'Lâmina Lunar', 'Arma', 'lendario', [
    'De todos os itens mágicos criados pelos elfos, um dos mais valorizados e ciosamente guardados é a Lâmina Lunar. Em tempos antigos, quase toda casa nobre élfica reivindicava uma; hoje restam poucas.',
    'Toda Lâmina Lunar anseia por um portador cuja índole e objetivos sejam compatíveis com os dela. Se você tentar se sintonizar a uma que não o queira como portador, ela não só o rejeita como lança uma maldição, fazendo você realizar Testes D20 com Desvantagem por 24 horas ou até a maldição ser encerrada pela magia Remover Maldição ou similar. Se for aceito, você se sintoniza instantaneamente e uma nova runa aparece na lâmina. Você permanece sintonizado até morrer ou até a arma ser destruída.',
    'Você ganha +1 nas jogadas de ataque e de dano feitas com esta arma mágica, além de propriedades adicionais determinadas pelas runas que ela já acumulou — uma para cada portador anterior. Cada runa adicional pode aumentar o bônus da arma, conceder poderes defensivos, magias ou benefícios especiais.',
  ], { sint: 'por uma criatura escolhida pela própria arma', detalhe: 'Espada Grande, Espada Longa, Rapieira, Cimitarra ou Espada Curta', efeitos: { attackBonus: 1 } }),

  mi('espada-tocada-pela-lua', 'Espada Tocada pela Lua', 'Arma', 'comum', [
    'Na escuridão, a lâmina desembainhada desta arma emite luar, criando luz plena num raio de 4,5 metros e penumbra por mais 4,5 metros.',
  ], { detalhe: 'Glaive, Espada Grande, Espada Longa, Rapieira, Cimitarra ou Espada Curta' }),

  mi('chave-do-misterio', 'Chave do Mistério', 'Item Maravilhoso', 'comum', [
    'Um ponto de interrogação está trabalhado na cabeça desta chave. Ela tem 5% de chance de destrancar qualquer fechadura em que for inserida. Depois de destrancar algo, a chave desaparece.',
  ]),

  mi('manto-da-natureza', 'Manto da Natureza', 'Item Maravilhoso', 'incomum', [
    'Este manto muda de cor e textura para se misturar ao terreno ao seu redor. Enquanto o usar, você pode usá-lo como Foco de Conjuração das suas magias de Druida e de Patrulheiro.',
    'Enquanto estiver em uma área Levemente Obscurecida, você pode se Esconder como ação Bônus, mesmo estando sendo diretamente observado.',
  ], { sint: 'por um Druida ou Patrulheiro' }),

  mi('colar-da-adaptacao', 'Colar da Adaptação', 'Item Maravilhoso', 'incomum', [
    'Enquanto usar este colar, você pode respirar normalmente em qualquer ambiente e tem Vantagem em salvaguardas feitas para evitar ou encerrar a condição Envenenado.',
  ], { sint: true }),

  mi('colar-de-bolas-de-fogo', 'Colar de Bolas de Fogo', 'Item Maravilhoso', 'raro', [
    'Este colar tem 1d6 + 3 esferas penduradas nele.',
    'Você pode executar uma ação Usar Magia para destacar uma esfera e arremessá-la a até 18 metros. Ao chegar ao fim da trajetória, a esfera detona como uma Bola de Fogo de 3º círculo (CD de salvaguarda 15).',
    'Você pode arremessar várias esferas, ou até o colar inteiro, de uma vez. Ao fazer isso, aumente o dano da Bola de Fogo em 1d6 para cada esfera além da primeira (máximo de 12d6).',
  ]),

  mi('colar-de-contas-de-oracao', 'Colar de Contas de Oração', 'Item Maravilhoso', 'raro', [
    'Este colar tem 1d4 + 2 contas mágicas feitas de água-marinha, pérola negra ou topázio, além de muitas contas não mágicas. Se uma conta mágica for retirada do colar, ela perde a magia.',
    'Existem seis tipos de conta mágica, e um colar pode ter mais de uma do mesmo tipo. Para usar uma, você precisa estar usando o colar. Cada conta contém uma magia que você pode conjurar a partir dela como ação Bônus (usando a sua CD de salvaguarda de magia, se houver salvaguarda). Depois que a magia de uma conta é conjurada, ela só volta a ser usada no próximo amanhecer.',
    'Tipos: Conta da Bênção (Bênção), Conta da Cura (Curar Ferimentos de 2º círculo), Conta do Favor (Restauração Maior), Conta da Destruição (Destruição Radiante), Conta da Convocação (Defensor da Fé) e Conta do Vento (Caminhar no Vento).',
  ], { sint: 'por um Clérigo, Druida ou Paladino' }),

  mi('ladra-de-nove-vidas', 'Ladra de Nove Vidas', 'Arma', 'muito-raro', [
    'Você ganha +2 nas jogadas de ataque e de dano feitas com esta arma mágica.',
    'Roubar Vida. A arma tem 1d8 + 1 cargas. Quando você ataca uma criatura com menos de 100 Pontos de Vida com esta arma e tira 20 no d20 da jogada de ataque, a criatura deve passar em uma salvaguarda de Constituição CD 15 ou é morta instantaneamente, enquanto a espada arranca a força vital do corpo dela. Constructos e Mortos-vivos passam automaticamente. A arma perde 1 carga se a criatura for morta. Quando fica sem cargas, ela perde esta propriedade.',
  ], { sint: true, detalhe: 'Qualquer Arma Simples ou Marcial', efeitos: { attackBonus: 2 } }),

  mi('pigmentos-maravilhosos-de-nolzur', 'Pigmentos Maravilhosos de Nolzur', 'Item Maravilhoso', 'muito-raro', [
    'Esta caixa fina de madeira contém 1d4 potes de pigmento e um pincel (pesando 500 g no total).',
    'Usando o pincel e gastando 1 pote de pigmento, você pode pintar qualquer número de objetos tridimensionais e elementos de terreno (como paredes, portas, árvores, flores, armas, teias e fossos), desde que tudo caiba em um Cubo de 6 metros. O trabalho leva 10 minutos, durante os quais você deve permanecer no Cubo e manter Concentração. Se a Concentração for quebrada ou você sair do Cubo antes de terminar, todos os elementos pintados somem e o pote é desperdiçado.',
    'Terminado o trabalho, todos os objetos e elementos de terreno pintados se tornam reais. Pintar uma porta em uma parede cria uma porta de verdade, que pode ser aberta para o que houver do outro lado; pintar um fosso cria um fosso real, cuja profundidade inteira precisa caber no Cubo.',
  ]),

  mi('arco-do-juramento', 'Arco do Juramento', 'Arma', 'muito-raro', [
    'Quando você encaixa uma flecha neste arco, ele sussurra em Élfico: "Derrota veloz aos meus inimigos".',
    'Quando usar esta arma para fazer um ataque à distância, você pode proferir ou sinalizar as palavras de comando: "Morte veloz a você, que me fez mal". O alvo do seu ataque se torna seu inimigo jurado até morrer ou até o amanhecer 7 dias depois. Você só pode ter um inimigo jurado por vez; quando ele morre, você pode escolher outro depois do próximo amanhecer.',
    'Quando você fizer uma jogada de ataque à distância com esta arma contra o seu inimigo jurado, você tem Vantagem na jogada. Além disso, o alvo não se beneficia de Meia Cobertura nem de Cobertura de Três Quartos, e você não sofre Desvantagem por alcance longo. Se o ataque acertar, o inimigo jurado sofre 3d6 de dano Perfurante extra.',
    'Enquanto o seu inimigo jurado viver, você tem Desvantagem em jogadas de ataque com todas as outras armas.',
  ], { sint: true, detalhe: 'Arco Longo ou Arco Curto' }),

  mi('oleo-da-etereidade', 'Óleo da Etereidade', 'Poção', 'raro', [
    'Um frasco deste óleo cobre uma criatura Média ou menor, junto com o equipamento que ela está vestindo e carregando (um frasco adicional é necessário para cada categoria de tamanho acima de Média). Aplicar o óleo leva 10 minutos. A criatura afetada então ganha o efeito da magia Forma Etérea por 1 hora.',
    'Gotas deste óleo cinzento e turvo se formam do lado de fora do recipiente e evaporam rapidamente.',
  ]),

  mi('oleo-do-afiamento', 'Óleo do Afiamento', 'Poção', 'muito-raro', [
    'Um frasco deste óleo pode revestir uma arma Corpo a Corpo ou vinte unidades de munição, mas só afeta munição e armas corpo a corpo não mágicas que causem dano Cortante ou Perfurante.',
    'Aplicar o óleo leva 1 minuto, depois do qual ele se infiltra magicamente no que reveste, transformando a arma revestida em uma Arma +3 ou a munição revestida em Munição +3.',
    'Este óleo transparente e gelatinoso brilha com minúsculos fragmentos de prata ultrafinos.',
  ]),

  mi('oleo-do-escorregadio', 'Óleo do Escorregadio', 'Poção', 'incomum', [
    'Um frasco deste óleo cobre uma criatura Média ou menor, junto com o equipamento que ela está vestindo e carregando (um frasco adicional é necessário para cada categoria de tamanho acima de Média). Aplicar o óleo leva 10 minutos. A criatura afetada então ganha o efeito da magia Movimentação Livre por 8 horas.',
    'Como alternativa, o óleo pode ser derramado no chão com uma ação Usar Magia, cobrindo um quadrado de 3 metros e duplicando o efeito da magia Graxa naquela área por 8 horas.',
  ]),

  mi('orbe-da-direcao', 'Orbe da Direção', 'Item Maravilhoso', 'comum', [
    'Este orbe pode ser usado como Foco Arcano.',
    'Segurando o orbe, você pode executar uma ação Usar Magia para determinar onde fica o norte magnético. Nada acontece se ele for usado em um lugar que não tenha norte magnético.',
  ]),

  mi('orbes-do-poder-dracontico', 'Orbes do Poder Dracôntico', 'Item Maravilhoso', 'artefato', [
    'Há muito tempo, elfos e humanos travaram uma guerra terrível contra dragões cromáticos. Quando o mundo parecia condenado, os magos das Torres da Alta Feitiçaria forjaram cinco Orbes do Poder Dracôntico para ajudar a derrotá-los. Apenas três teriam sobrevivido.',
    'Cada orbe contém a essência de um dragão maligno, uma presença que se ressente de qualquer tentativa de arrancar magia dele. Quem tenta usar a magia de um orbe sem força de personalidade suficiente pode acabar sob o controle dele.',
    'Sintonizar-se ao Orbe. Para se sintonizar, você deve segurá-lo e realizar um teste de Carisma (Arcanismo) CD 15. Se falhar, você fica Enfeitiçado pelo orbe até o início do seu próximo turno e o orbe tenta dominá-lo.',
    'Propriedades. Enquanto sintonizado, você tem Vantagem em jogadas de ataque contra Dragões e pode conjurar magias a partir do orbe, gastando cargas. O orbe tem 7 cargas e recupera 1d4 + 3 diariamente ao amanhecer.',
    'Chamar Dragões. Com uma ação Usar Magia, você pode fazer o orbe emitir um chamado telepático que se estende por até 64 km. Dragões malignos nessa área vêm até o orbe o mais rápido possível.',
    'Propriedades Aleatórias. Cada orbe tem 2 propriedades benéficas menores, 1 propriedade prejudicial menor e 1 propriedade prejudicial maior.',
  ], { sint: true }),

  mi('orbe-do-tempo', 'Orbe do Tempo', 'Item Maravilhoso', 'comum', [
    'Este orbe pode ser usado como Foco Arcano.',
    'Segurando o orbe, você pode executar uma ação Usar Magia para determinar se é manhã, tarde, anoitecer ou noite. Esta propriedade só funciona no Plano Material.',
  ]),

  mi('perola-do-poder', 'Pérola do Poder', 'Item Maravilhoso', 'incomum', [
    'Enquanto esta pérola estiver com você, você pode executar uma ação Usar Magia para recuperar um espaço de magia gasto de 3º círculo ou menor. Depois de usada, a pérola só volta a funcionar no próximo amanhecer.',
  ], { sint: 'por um conjurador' }),

  mi('perfume-do-enfeitico', 'Perfume do Enfeitiço', 'Item Maravilhoso', 'comum', [
    'Este frasquinho contém perfume mágico, o suficiente para um uso. Você pode executar uma ação Usar Magia para aplicá-lo em si mesmo, e o efeito dura 1 hora.',
    'Durante a duração, você tem Vantagem em todos os testes de Carisma (Enganação e Persuasão) feitos para influenciar uma criatura a até 1,5 metro de você.',
  ]),

  mi('periapta-da-saude', 'Periapta da Saúde', 'Item Maravilhoso', 'incomum', [
    'Enquanto usar este pingente, você pode executar uma ação Usar Magia para recuperar 2d4 + 2 Pontos de Vida. Depois de usada, esta propriedade só volta a funcionar no próximo amanhecer.',
    'Além disso, você tem Vantagem em salvaguardas para evitar ou encerrar a condição Envenenado enquanto usar o pingente.',
  ], { sint: true }),

  mi('periapta-contra-veneno', 'Periapta de Proteção contra Veneno', 'Item Maravilhoso', 'raro', [
    'Esta delicada corrente de prata tem um pingente de gema negra de lapidação brilhante. Enquanto a usar, você tem Imunidade à condição Envenenado e a dano Venenoso.',
  ], { sint: true }),
  mi('periapta-do-fechamento-de-feridas', 'Periapta do Fechamento de Feridas', 'Item Maravilhoso', 'incomum', [
    'Enquanto usar este pingente, você ganha:',
    'Preservação da Vida. Sempre que fizer uma Salvaguarda contra a Morte, você pode transformar um resultado 9 ou menor em 10, convertendo uma falha em sucesso.',
    'Cura Natural Reforçada. Sempre que rolar um Dado de Pontos de Vida para recuperar Pontos de Vida, dobre o número de Pontos de Vida restaurados.',
  ], { sint: true }),

  mi('filtro-do-amor', 'Filtro do Amor', 'Poção', 'incomum', [
    'Na próxima vez em que você vir uma criatura até 10 minutos depois de beber este filtro, você fica encantado por ela e recebe a condição Enfeitiçado por 1 hora.',
    'Este líquido efervescente e rosado contém uma bolha fácil de não notar, em formato de coração.',
  ]),

  mi('cachimbo-de-monstros-de-fumaca', 'Cachimbo de Monstros de Fumaça', 'Item Maravilhoso', 'comum', [
    'Enquanto fuma este cachimbo, você pode executar uma ação Usar Magia para soprar uma baforada de fumaça que assume a forma de uma criatura, como um dragão, um flumph ou um slaad. A forma precisa ser pequena o bastante para caber em um cubo de 30 cm e perde o formato depois de alguns segundos, virando uma baforada comum.',
  ]),

  mi('flauta-assombrosa', 'Flauta Assombrosa', 'Item Maravilhoso', 'incomum', [
    'Esta flauta tem 3 cargas e recupera 1d3 cargas gastas diariamente ao amanhecer.',
    'Você pode executar uma ação Usar Magia para tocá-la e gastar 1 carga, criando uma melodia sinistra e hipnótica. Cada criatura à sua escolha a até 9 metros de você deve passar em uma salvaguarda de Sabedoria CD 15 ou recebe a condição Amedrontado por 1 minuto, repetindo a salvaguarda no fim de cada turno dela. Uma criatura que passar na salvaguarda fica imune ao efeito desta flauta por 24 horas.',
  ]),

  mi('flauta-dos-esgotos', 'Flauta dos Esgotos', 'Item Maravilhoso', 'incomum', [
    'Enquanto esta flauta estiver com você, ratos comuns e ratos gigantes são Indiferentes a você e não o atacam, a menos que você os ameace ou os fira.',
    'A flauta tem 3 cargas e recupera 1d3 cargas gastas diariamente ao amanhecer. Se você tocá-la com uma ação Usar Magia, pode executar uma ação Bônus para gastar de 1 a 3 cargas, chamando um Enxame de Ratos por carga gasta, desde que haja ratos suficientes a até 800 metros de você. Se não houver ratos suficientes para formar um enxame, a carga é desperdiçada.',
    'Os enxames chamados se movem em direção à música pelo caminho mais curto, mas fora isso não estão sob o seu controle. Sempre que um Enxame de Ratos que não esteja sob o controle de outra criatura chegar a até 9 metros de você enquanto você toca, ele realiza uma salvaguarda de Sabedoria CD 15; se falhar, fica Enfeitiçado por você e obedece aos seus comandos enquanto você continuar tocando.',
  ], { sint: true }),

  mi('armadura-de-placas-da-etereidade', 'Armadura de Placas da Etereidade', 'Armadura', 'lendario', [
    'Enquanto veste esta armadura, você pode executar uma ação Usar Magia e dizer uma palavra de comando para ganhar o efeito da magia Forma Etérea. A magia termina imediatamente se você tirar a armadura ou executar uma ação Usar Magia para repetir a palavra de comando. Esta propriedade só volta a funcionar no próximo amanhecer.',
  ], { sint: true, detalhe: 'Meia Armadura ou Armadura de Placas' }),

  mi('vara-de-pesca', 'Vara de Pescaria', 'Item Maravilhoso', 'comum', [
    'Este item funciona como uma Vara. Enquanto a segura, você pode executar uma ação Usar Magia para transformá-la em uma vara de pescar com anzol, linha e molinete, ou fazer a vara de pescar voltar a ser uma Vara.',
  ]),

  mi('vara-retratil', 'Vara Retrátil', 'Item Maravilhoso', 'comum', [
    'Este item funciona como uma Vara. Enquanto a segura, você pode executar uma ação Usar Magia para retraí-la em um bastão de 30 cm para facilitar o transporte (o peso não muda) ou fazer o bastão voltar a ser uma Vara. O bastão só se estende até onde o espaço ao redor permitir.',
  ]),

  mi('buraco-portatil', 'Buraco Portátil', 'Item Maravilhoso', 'raro', [
    'Este tecido preto fino, macio como seda, é dobrado até o tamanho de um lenço. Desdobrado, vira uma folha circular de 1,8 metro de diâmetro.',
    'Você pode executar uma ação Usar Magia para desdobrar o Buraco Portátil e colocá-lo sobre ou contra uma superfície sólida, criando um buraco extradimensional de 3 metros de profundidade. O espaço cilíndrico dentro dele existe em outro plano de existência, então não pode ser usado para criar passagens abertas. Qualquer criatura dentro de um Buraco Portátil aberto pode sair escalando.',
    'Você pode executar uma ação Usar Magia para fechar o buraco segurando as bordas do tecido e dobrando-o. Dobrar o tecido fecha o buraco, e criaturas ou objetos lá dentro permanecem no espaço extradimensional. Seja lá o que contenha, o buraco praticamente não pesa.',
    'Se o buraco estiver dobrado, uma criatura dentro do espaço extradimensional pode executar uma ação para realizar um teste de Força (Atletismo) CD 10 e sair, abrindo o buraco de dentro para fora.',
  ]),

  mi('pocao-de-amizade-animal', 'Poção de Amizade Animal', 'Poção', 'incomum', [
    'Quando você bebe esta poção, pode conjurar a versão de 3º círculo da magia Amizade Animal (CD de salvaguarda 13).',
    'Agitar o líquido barrento desta poção revela pedacinhos: uma escama de peixe, uma pena de beija-flor, uma garra de gato ou um pelo de esquilo.',
  ]),

  mi('pocao-de-clarividencia', 'Poção de Clarividência', 'Poção', 'raro', [
    'Quando você bebe esta poção, ganha o efeito da magia Clarividência (sem exigir Concentração).',
    'Um globo ocular boia no líquido amarelado desta poção, mas some quando ela é aberta.',
  ]),

  mi('pocao-de-escalada', 'Poção de Escalada', 'Poção', 'comum', [
    'Quando você bebe esta poção, ganha Deslocamento de Escalada igual ao seu deslocamento por 1 hora. Durante esse tempo, você tem Vantagem em testes de Força (Atletismo) para escalar.',
    'Esta poção é separada em camadas marrom, prateada e cinza, parecidas com faixas de pedra. Sacudir o frasco não mistura as cores.',
  ]),

  mi('pocao-de-compreensao', 'Poção de Compreensão', 'Poção', 'comum', [
    'Quando você bebe esta poção, ganha o efeito da magia Compreender Idiomas por 1 hora.',
    'O líquido desta poção é uma mistura transparente com pedacinhos de sal e fuligem rodopiando dentro.',
  ]),

  mi('pocao-de-diminuicao', 'Poção de Diminuição', 'Poção', 'raro', [
    'Quando você bebe esta poção, ganha o efeito "reduzir" da magia Aumentar/Reduzir por 1d4 horas (sem exigir Concentração).',
    'O vermelho no líquido da poção se contrai continuamente até virar uma bolinha e depois se expande para colorir o líquido transparente ao redor. Sacudir o frasco não interrompe o processo.',
  ]),

  mi('pocao-de-sopro-de-fogo', 'Poção de Sopro de Fogo', 'Poção', 'incomum', [
    'Depois de beber esta poção, você pode executar uma ação Bônus para expelir fogo contra um alvo a até 9 metros de você. O alvo realiza uma salvaguarda de Destreza CD 13, sofrendo 4d6 de dano Ígneo se falhar, ou metade em caso de sucesso. O efeito termina depois de você expelir fogo três vezes ou quando 1 hora tiver passado.',
    'O líquido alaranjado desta poção tremeluz, e fumaça enche o topo do recipiente e escapa sempre que ele é aberto.',
  ]),

  mi('pocao-de-voo', 'Poção de Voo', 'Poção', 'muito-raro', [
    'Quando você bebe esta poção, ganha Deslocamento de Voo igual ao seu deslocamento por 1 hora e consegue pairar. Se estiver no ar quando o efeito acabar, você cai, a menos que tenha outro meio de se manter no alto.',
    'O líquido transparente desta poção flutua no topo do recipiente e tem impurezas brancas e turvas à deriva.',
  ]),

  mi('pocao-de-forma-gasosa', 'Poção de Forma Gasosa', 'Poção', 'raro', [
    'Quando você bebe esta poção, ganha o efeito da magia Forma Gasosa por 1 hora (sem exigir Concentração) ou até encerrar o efeito como ação Bônus.',
    'O recipiente desta poção parece conter névoa que se move e escorre como água.',
  ]),

  mi('pocao-de-forca-do-gigante', 'Poção de Força do Gigante', 'Poção', 'varia', [
    'Quando você bebe esta poção, sua Força muda por 1 hora. O tipo de gigante determina o valor. A poção não tem efeito se sua Força for igual ou maior que esse valor.',
    'Gigante da Colina: Força 21 (Incomum). Gigante do Gelo ou da Pedra: Força 23 (Rara). Gigante do Fogo: Força 25 (Rara). Gigante das Nuvens: Força 27 (Muito Rara). Gigante da Tempestade: Força 29 (Lendária).',
  ]),

  mi('pocao-de-invisibilidade-maior', 'Poção de Invisibilidade Maior', 'Poção', 'muito-raro', [
    'O recipiente desta poção parece vazio, mas dá a sensação de conter líquido. Quando você bebe a poção, você recebe a condição Invisível por 1 hora.',
  ]),

  mi('pocao-de-crescimento', 'Poção de Crescimento', 'Poção', 'incomum', [
    'Quando você bebe esta poção, ganha o efeito "aumentar" da magia Aumentar/Reduzir por 10 minutos (sem exigir Concentração).',
    'O vermelho no líquido da poção se expande continuamente de uma bolinha para colorir o líquido transparente ao redor e depois se contrai. Sacudir o frasco não interrompe o processo.',
  ]),

  mi('pocao-de-cura', 'Poção de Cura', 'Poção', 'varia', [
    'Ação Bônus para beber. Preço de tabela da versão comum: 50 PO.',
    'Você recupera Pontos de Vida quando bebe esta poção. A quantidade depende da raridade dela.',
    'Poção de Cura: 2d4 + 2 (Comum). Poção de Cura (maior): 4d4 + 4 (Incomum). Poção de Cura (superior): 8d4 + 8 (Rara). Poção de Cura (suprema): 10d4 + 20 (Muito Rara).',
    'Seja qual for a potência, o líquido vermelho da poção cintila quando agitado.',
  ], { resumo: 'Ação Bônus: recupere 2d4+2 PV (versão comum).', preco: '50 PO' }),

  mi('pocao-de-heroismo', 'Poção de Heroísmo', 'Poção', 'raro', [
    'Quando você bebe esta poção, ganha 10 Pontos de Vida Temporários que duram 1 hora. Pela mesma duração, você fica sob o efeito da magia Bênção (sem exigir Concentração).',
    'O líquido azul desta poção borbulha e solta vapor como se estivesse fervendo.',
  ]),

  mi('pocao-de-invisibilidade', 'Poção de Invisibilidade', 'Poção', 'raro', [
    'O recipiente desta poção parece vazio, mas dá a sensação de conter líquido. Quando você bebe a poção, você recebe a condição Invisível por 1 hora. O efeito termina antes se você fizer uma jogada de ataque, causar dano ou conjurar uma magia.',
  ]),

  mi('pocao-de-invulnerabilidade', 'Poção de Invulnerabilidade', 'Poção', 'raro', [
    'Por 1 minuto depois de beber esta poção, você tem Resistência a todo tipo de dano.',
    'O líquido xaroposo desta poção parece ferro liquefeito.',
  ]),

  mi('pocao-de-longevidade', 'Poção de Longevidade', 'Poção', 'muito-raro', [
    'Quando você bebe esta poção, sua idade física é reduzida em 1d6 + 6 anos, até o mínimo de 13 anos. A cada nova Poção de Longevidade que você beber depois disso, há uma chance cumulativa de 10% de que, em vez disso, você envelheça 1d6 + 6 anos.',
    'Suspenso neste líquido âmbar há um coração minúsculo que, contra toda a razão, ainda bate. Esses ingredientes somem quando a poção é aberta.',
  ]),

  mi('pocao-de-leitura-mental', 'Poção de Leitura Mental', 'Poção', 'raro', [
    'Quando você bebe esta poção, ganha o efeito da magia Detectar Pensamentos (CD de salvaguarda 13) por 10 minutos (sem exigir Concentração).',
    'O líquido roxo e denso desta poção tem uma nuvem oval rosada flutuando dentro.',
  ]),

  mi('pocao-de-veneno', 'Poção de Veneno', 'Poção', 'incomum', [
    'Esta mistura parece, cheira e tem gosto de uma Poção de Cura ou de outra poção benéfica. Na verdade, é veneno mascarado por magia de ilusão; Identificar revela a verdadeira natureza dela.',
    'Se você beber esta poção, sofre 4d6 de dano Venenoso e deve passar em uma salvaguarda de Constituição CD 13 ou recebe a condição Envenenado por 1 hora.',
  ]),

  mi('pocao-de-pugilismo', 'Poção de Pugilismo', 'Poção', 'incomum', [
    'Depois de beber esta poção, cada Ataque Desarmado que você fizer causa 1d6 de dano de Força extra em um acerto. Este efeito dura 10 minutos.',
    'Esta poção é um fluido verde e espesso com gosto de espinafre.',
  ]),

  mi('pocao-de-resistencia', 'Poção de Resistência', 'Poção', 'incomum', [
    'Quando você bebe esta poção, tem Resistência a um tipo de dano por 1 hora. O Mestre escolhe o tipo ou o determina aleatoriamente entre Ácido, Gélido, Ígneo, de Força, Elétrico, Necrótico, Venenoso, Psíquico, Radiante e Trovejante.',
  ]),

  mi('pocao-de-velocidade', 'Poção de Velocidade', 'Poção', 'muito-raro', [
    'Quando você bebe esta poção, ganha o efeito da magia Celeridade por 1 minuto (sem exigir Concentração), sem sofrer a onda de letargia que normalmente ocorre quando o efeito termina.',
    'O fluido amarelo desta poção é riscado de preto e rodopia sozinho.',
  ]),

  mi('pocao-de-vitalidade', 'Poção de Vitalidade', 'Poção', 'muito-raro', [
    'Quando você bebe esta poção, ela remove todos os níveis de Exaustão que você tiver e encerra a condição Envenenado. Pelas 24 horas seguintes, você recupera o número máximo de Pontos de Vida para qualquer Dado de Pontos de Vida que gastar.',
    'O líquido carmesim desta poção pulsa regularmente com uma luz fraca, lembrando um batimento cardíaco.',
  ]),

  mi('pocao-de-respiracao-aquatica', 'Poção de Respiração Aquática', 'Poção', 'incomum', [
    'Você pode respirar debaixo d\'água por 24 horas depois de beber esta poção.',
    'O fluido verde e turvo desta poção cheira a mar e tem uma bolha parecida com uma água-viva flutuando dentro.',
  ]),

  mi('vaso-do-despertar', 'Vaso do Despertar', 'Item Maravilhoso', 'comum', [
    'Se você plantar um arbusto comum neste vaso de barro de 4,5 kg e deixá-lo crescer por 30 dias, o arbusto se transforma magicamente em um Arbusto Desperto ao fim desse período. Quando o arbusto desperta, as raízes quebram o vaso, destruindo-o.',
    'O arbusto desperto é Amigável a você e obedece aos seus comandos. Sem comandos seus, ele não faz nada.',
  ]),
  mi('membro-protetico', 'Membro Protético', 'Item Maravilhoso', 'comum', [
    'Este item mágico substitui um membro perdido — uma mão, um braço, um pé, uma perna ou parte do corpo semelhante. Enquanto a prótese estiver presa, ela funciona exatamente como a parte que substitui.',
    'Você pode soltá-la ou prendê-la de novo com uma ação Usar Magia, e ela não pode ser removida contra a sua vontade enquanto você estiver vivo.',
  ]),

  mi('ficha-de-pena-de-quaal', 'Ficha de Pena de Quaal', 'Item Maravilhoso', 'varia', [
    'Este objeto parece uma pena. Existem vários tipos de fichas de pena, cada uma com um efeito de uso único, e o tipo determina a raridade.',
    'Âncora (Incomum). Com uma ação Usar Magia, encoste a ficha em um barco ou navio: pelas 24 horas seguintes, a embarcação não pode ser movida por nenhum meio.',
    'Pássaro (Rara). Com uma ação Usar Magia, lance a ficha 1,5 metro no ar: ela some e um pássaro enorme e multicolorido toma o lugar dela, com as estatísticas de um Roc, mas incapaz de atacar. Ele obedece a comandos simples e carrega até 225 kg voando.',
    'Chicote (Rara). Com uma ação Usar Magia, a ficha vira um chicote flutuante que ataca sozinho as criaturas que você indicar.',
    'Barco (Rara). Com uma ação Usar Magia, a ficha vira um navio de 18 metros de comprimento que dura 24 horas.',
    'Árvore (Incomum). Com uma ação Usar Magia, a ficha plantada em solo desocupado vira um carvalho de 18 metros de altura.',
    'Leque (Rara). Com uma ação Usar Magia a bordo de uma embarcação, a ficha cria um vento forte que enche as velas por 8 horas.',
    'Escada (Incomum). Com uma ação Usar Magia, a ficha vira uma escada de madeira de 15 metros.',
    'Cisne (Incomum). Com uma ação Usar Magia, a ficha vira um barco em forma de cisne que se move sozinho por 24 horas.',
  ]),

  mi('bordao-do-acrobata', 'Bordão do Acrobata', 'Arma', 'muito-raro', [
    'Você tem +2 nas jogadas de ataque e de dano feitas com esta arma mágica.',
    'Segurando a arma, você pode fazê-la emitir penumbra verde a até 3 metros, como ação Bônus ou logo depois de rolar Iniciativa, ou apagar a luz como ação Bônus.',
    'Segurando a arma, você pode executar uma ação Bônus para alterar a forma dela, transformando-a em um bastão de 15 cm (para facilitar o transporte) ou em uma vara de 3 metros, ou fazendo-a voltar a ser um Bordão; ela só se alonga até onde o espaço ao redor permitir.',
    'Auxílio Acrobático (formas de Bordão ou vara de 3 metros). Segurando a arma, você tem Vantagem em testes de Destreza (Acrobacia).',
    'Desviar Ataque (forma de Bordão). Quando você for atingido por um ataque enquanto segura a arma, pode executar uma Reação para ganhar +5 na Classe de Armadura contra esse ataque, o que pode fazê-lo errar.',
  ], { sint: true, detalhe: 'Bordão', efeitos: { attackBonus: 2 } }),

  mi('aljava-de-ehlonna', 'Aljava de Ehlonna', 'Item Maravilhoso', 'incomum', [
    'Cada um dos três compartimentos desta aljava liga-se a um espaço extradimensional que permite guardar muitos itens sem nunca pesar mais de 1 kg.',
    'O compartimento mais curto comporta até 60 Flechas, Virotes ou objetos semelhantes. O intermediário comporta até 18 Azagaias ou objetos semelhantes. O mais longo comporta até 6 objetos compridos, como arcos, Bordões ou Lanças.',
    'Você pode sacar qualquer item da aljava como se o fizesse de uma aljava ou bainha comum.',
  ]),

  mi('anel-de-influencia-animal', 'Anel de Influência Animal', 'Anel', 'raro', [
    'Este anel tem 3 cargas e recupera 1d3 cargas gastas diariamente ao amanhecer.',
    'Enquanto o usar, você pode gastar 1 carga para conjurar uma destas magias a partir dele (CD de salvaguarda 13): Amizade Animal, Medo (afeta apenas Bestas) ou Falar com Animais.',
  ]),

  mi('anel-de-invocacao-de-djinni', 'Anel de Invocação de Djinni', 'Anel', 'lendario', [
    'Enquanto usar este anel, você pode executar uma ação Usar Magia para convocar um Djinni específico do Plano Elemental do Ar. Ele aparece em um espaço desocupado à sua escolha a até 36 metros de você e permanece enquanto você mantiver Concentração, no máximo por 1 hora, ou até cair a 0 Pontos de Vida.',
    'Enquanto convocado, o djinni é Amigável a você e aos seus aliados e obedece aos seus comandos. Se você não o comandar, ele se defende dos atacantes, mas não executa outras ações.',
    'Depois que o djinni parte, ele não pode ser convocado de novo por 24 horas, e o anel se torna não mágico se o djinni morrer.',
  ], { sint: true }),

  mi('anel-de-comando-elemental', 'Anel de Comando Elemental', 'Anel', 'lendario', [
    'Cada Anel de Comando Elemental está ligado a um dos quatro Planos Elementais, escolhido ou determinado aleatoriamente pelo Mestre.',
    'Perdição Elemental. Enquanto usar o anel, você tem Vantagem em jogadas de ataque contra Elementais, e eles têm Desvantagem em jogadas de ataque contra você.',
    'Compulsão Elemental. Enquanto usar o anel, você pode executar uma ação Usar Magia para tentar dominar um Elemental que veja a até 18 metros de você. Ele realiza uma salvaguarda de Sabedoria CD 18; se falhar, recebe a condição Enfeitiçado até o início do seu próximo turno e você determina o que ele faz com o movimento e a ação dele no próximo turno.',
    'Foco Elemental. Enquanto usar o anel, você ganha benefícios adicionais conforme o plano ligado: resistência ao dano correspondente, deslocamentos especiais (voo, escalada, natação ou escavação), capacidade de respirar no elemento e magias temáticas conjuráveis a partir do anel, gastando cargas.',
  ], { sint: true }),

  mi('anel-de-evasao', 'Anel de Evasão', 'Anel', 'raro', [
    'Este anel tem 3 cargas e recupera 1d3 cargas gastas diariamente ao amanhecer.',
    'Quando você falhar em uma salvaguarda de Destreza enquanto usa o anel, pode executar uma Reação para gastar 1 carga e passar nessa salvaguarda em vez disso.',
  ], { sint: true }),

  mi('anel-de-queda-suave', 'Anel de Queda Suave', 'Anel', 'raro', [
    'Quando você cair enquanto usa este anel, você desce 18 metros por rodada e não sofre dano de queda.',
  ], { sint: true }),

  mi('anel-de-movimentacao-livre', 'Anel de Movimentação Livre', 'Anel', 'raro', [
    'Enquanto usar este anel, Terreno Difícil não custa movimento extra para você. Além disso, a magia não pode reduzir nenhum dos seus deslocamentos nem fazer você receber as condições Paralisado ou Contido.',
  ], { sint: true }),

  mi('anel-da-invisibilidade', 'Anel da Invisibilidade', 'Anel', 'lendario', [
    'Enquanto usar este anel, você pode executar uma ação Usar Magia para receber a condição Invisível. Você permanece Invisível até o anel ser retirado ou até executar uma ação Bônus para ficar visível de novo.',
  ], { sint: true }),

  mi('anel-do-salto', 'Anel do Salto', 'Anel', 'incomum', [
    'Enquanto usar este anel, você pode conjurar Salto a partir dele, mas só pode mirar em si mesmo ao fazê-lo.',
  ], { sint: true }),

  mi('anel-de-blindagem-mental', 'Anel de Blindagem Mental', 'Anel', 'incomum', [
    'Enquanto usar este anel, você é imune a magias que permitem a outras criaturas ler seus pensamentos, determinar se você está mentindo, saber seu alinhamento ou saber seu tipo de criatura. Criaturas só podem se comunicar telepaticamente com você se você permitir.',
    'Você pode executar uma ação Usar Magia para tornar o anel imperceptível, até executar outra ação Usar Magia para torná-lo perceptível, até retirá-lo ou até morrer.',
    'Se você morrer usando o anel, sua alma entra nele, a menos que ele já abrigue uma alma. Você pode permanecer no anel ou partir para a vida após a morte. Enquanto a sua alma estiver no anel, você pode se comunicar telepaticamente com qualquer criatura que o use, e ela não pode impedir essa comunicação.',
  ], { sint: true }),

  mi('anel-de-protecao', 'Anel de Proteção', 'Anel', 'raro', [
    'Você ganha +1 na Classe de Armadura e nas salvaguardas enquanto usar este anel.',
  ], { sint: true, resumo: '+1 na CA e em salvaguardas.', efeitos: { acBonus: 1, saveBonus: 1 } }),

  mi('anel-de-regeneracao', 'Anel de Regeneração', 'Anel', 'muito-raro', [
    'Enquanto usar este anel, você recupera 1d6 Pontos de Vida a cada 10 minutos, desde que tenha pelo menos 1 Ponto de Vida.',
    'Se você perder uma parte do corpo, o anel faz a parte perdida crescer de volta e voltar a funcionar plenamente depois de 1d6 + 1 dias, desde que você tenha pelo menos 1 Ponto de Vida o tempo todo.',
  ], { sint: true }),

  mi('anel-de-resistencia', 'Anel de Resistência', 'Anel', 'raro', [
    'Você tem Resistência a um tipo de dano enquanto usar este anel. A gema do anel indica o tipo, escolhido pelo Mestre ou determinado aleatoriamente: pérola (Ácido), turmalina (Gélido), granada (Ígneo), safira (de Força), citrino (Elétrico), azeviche (Necrótico), ametista (Venenoso), jade (Psíquico), topázio (Radiante) e espinélio (Trovejante).',
  ], { sint: true }),

  mi('anel-das-estrelas-cadentes', 'Anel das Estrelas Cadentes', 'Anel', 'muito-raro', [
    'Você pode conjurar Luzes Dançantes ou Luz a partir do anel. Ele tem 6 cargas e recupera 1d6 cargas gastas diariamente ao amanhecer.',
    'Fogo das Fadas. Você pode gastar 1 carga para conjurar Fogo das Fadas a partir do anel.',
    'Esferas Elétricas. Você pode gastar 2 cargas com uma ação Usar Magia para criar até quatro esferas de eletricidade de 90 cm de diâmetro. Cada uma aparece em um espaço desocupado que você possa ver a até 36 metros de você e dura enquanto você mantiver Concentração, até 1 minuto, emitindo penumbra num raio de 9 metros. Como ação Bônus, você pode mover cada esfera até 9 metros, sem passar de 36 metros de você. Na primeira vez que uma esfera chegar a até 1,5 metro de uma criatura que não seja você e que não esteja atrás de Cobertura Total, ela descarrega eletricidade nessa criatura e desaparece: a criatura realiza uma salvaguarda de Destreza CD 15, sofrendo 4d12 de dano Elétrico se falhar, ou metade em caso de sucesso.',
    'Estrelas Cadentes. Você pode gastar de 1 a 3 cargas com uma ação Usar Magia para lançar uma estrela cadente por carga, causando 5d4 de dano Radiante em uma Esfera de 4,5 metros de raio (salvaguarda de Destreza CD 15 para metade do dano).',
  ], { sint: true }),

  mi('anel-de-armazenar-magias', 'Anel de Armazenar Magias', 'Anel', 'raro', [
    'Este anel guarda magias conjuradas nele, mantendo-as até quem estiver sintonizado usá-las. O anel comporta até 5 círculos de magias por vez. Quando encontrado, ele contém 1d6 − 1 círculos de magias guardadas, escolhidas pelo Mestre.',
    'Qualquer criatura pode conjurar uma magia de 1º a 5º círculo dentro do anel tocando nele enquanto a conjura. A magia não tem efeito além de ficar guardada. Se o anel não puder guardá-la, a magia é gasta sem efeito. O círculo do espaço usado determina quanto espaço ela ocupa.',
    'Enquanto usar este anel, você pode conjurar qualquer magia guardada nele. A magia usa o círculo do espaço, a CD de salvaguarda, o bônus de ataque e o atributo de conjuração do conjurador original, mas fora isso é tratada como se você a tivesse conjurado. A magia conjurada pelo anel deixa de estar guardada, liberando espaço.',
  ], { sint: true }),

  mi('anel-de-reflexao-de-magias', 'Anel de Reflexão de Magias', 'Anel', 'lendario', [
    'Enquanto usar este anel, você tem Vantagem em salvaguardas contra magias. Se você passar na salvaguarda de uma magia de 7º círculo ou menor, a magia não tem efeito sobre você.',
    'Se essa magia mirava apenas você e não criava uma área de efeito, você pode executar uma Reação para refleti-la de volta contra o conjurador; ele deve realizar uma salvaguarda contra a magia usando a própria CD de salvaguarda de magia.',
  ], { sint: true }),

  mi('anel-de-natacao', 'Anel de Natação', 'Anel', 'incomum', [
    'Você tem Deslocamento de Natação de 12 metros enquanto usar este anel.',
  ]),

  mi('anel-de-telecinese', 'Anel de Telecinese', 'Anel', 'muito-raro', [
    'Enquanto usar este anel, você pode conjurar Telecinese a partir dele.',
  ], { sint: true }),

  mi('anel-do-aries', 'Anel do Aríete', 'Anel', 'raro', [
    'Este anel tem 3 cargas e recupera 1d3 cargas gastas diariamente ao amanhecer.',
    'Enquanto o usar, você pode executar uma ação Usar Magia para gastar de 1 a 3 cargas e fazer um ataque de magia à distância contra uma criatura que possa ver a até 18 metros de você. O anel produz uma cabeça espectral de carneiro e faz a jogada de ataque com +7. Se acertar, para cada carga gasta o alvo sofre 2d10 de dano de Força e é empurrado 1,5 metro para longe de você.',
    'Como alternativa, você pode gastar de 1 a 3 cargas com uma ação Usar Magia para tentar quebrar um objeto não mágico que possa ver a até 18 metros e que não esteja sendo vestido nem carregado. O anel realiza um teste de Força com +5 para cada carga gasta.',
  ], { sint: true }),

  mi('anel-dos-tres-desejos', 'Anel dos Três Desejos', 'Anel', 'lendario', [
    'Enquanto usar este anel, você pode gastar 1 das 3 cargas dele para conjurar Desejo a partir dele. O anel se torna não mágico quando você usa a última carga.',
  ]),

  mi('anel-do-aquecimento', 'Anel do Aquecimento', 'Anel', 'incomum', [
    'Se você sofrer dano Gélido enquanto usa este anel, ele reduz o dano sofrido em 2d8.',
    'Além disso, enquanto usar este anel, você e tudo o que veste e carrega não sofrem com temperaturas de −18 °C ou menos.',
  ], { sint: true }),

  mi('anel-de-caminhar-sobre-aguas', 'Anel de Caminhar sobre as Águas', 'Anel', 'incomum', [
    'Enquanto usar este anel, você pode conjurar Caminhar Sobre as Águas a partir dele, mirando apenas em si mesmo.',
  ]),

  mi('anel-de-visao-de-raio-x', 'Anel de Visão de Raio X', 'Anel', 'raro', [
    'Enquanto usar este anel, você pode executar uma ação Usar Magia para ganhar visão de raio X com alcance de 9 metros por 1 minuto. Para você, objetos sólidos nesse raio parecem transparentes e não impedem a passagem da luz. A visão penetra 30 cm de pedra, 2,5 cm de metal comum ou até 90 cm de madeira ou terra. Substâncias mais espessas ou uma fina folha de chumbo bloqueiam a visão.',
    'Sempre que você usar o anel de novo antes de terminar um Descanso Longo, deve passar em uma salvaguarda de Constituição CD 15 ou ganha 1 nível de Exaustão.',
  ], { sint: true }),

  mi('moeda-rival', 'Moeda Rival', 'Item Maravilhoso', 'comum', [
    'Esta moeda de ouro tem uma criatura gravada em cada lado, e as duas retratadas são rivais ou inimigas famosas uma da outra. Uma das figuras fica na "cara" da moeda, a outra na "coroa".',
    'A moeda tem 1 carga e a recupera diariamente ao amanhecer. Você pode executar uma ação Usar Magia para lançar a moeda, gastando a carga. Role qualquer dado para saber se deu cara (número par) ou coroa (número ímpar). A rolagem também determina o efeito:',
    'Cara. Mire uma criatura que possa ver a até 18 metros de você. Ela realiza uma salvaguarda de Sabedoria CD 13; se falhar, sofre 2d4 de dano Psíquico e tem Desvantagem na próxima jogada de ataque que fizer antes do fim do próximo turno dela.',
    'Coroa. Escolha uma criatura que possa ver a até 18 metros de você (pode ser você mesmo). Ela ganha 2d4 Pontos de Vida Temporários e tem Vantagem na próxima jogada de ataque que fizer antes do fim do próximo turno dela.',
  ]),

  mi('manto-de-olhos', 'Manto de Olhos', 'Item Maravilhoso', 'raro', [
    'Este manto é adornado com padrões que lembram olhos. Enquanto o usar, você ganha:',
    'Visão Panorâmica. O manto lhe dá Vantagem em testes de Sabedoria (Percepção) que dependem da visão.',
    'Sentidos Especiais. Você tem Visão no Escuro e Visão Verdadeira, ambas com alcance de 36 metros.',
    'Desvantagens. Uma magia Luz conjurada sobre o manto, ou uma magia Luz do Dia conjurada a até 1,5 metro dele, dá a você a condição Cego por 1 minuto. No fim de cada turno seu, você realiza uma salvaguarda de Constituição (CD 11 para Luz ou CD 15 para Luz do Dia), encerrando a condição em caso de sucesso.',
  ], { sint: true }),

  mi('manto-de-cores-cintilantes', 'Manto de Cores Cintilantes', 'Item Maravilhoso', 'muito-raro', [
    'Este manto tem 3 cargas e recupera 1d3 cargas gastas diariamente ao amanhecer.',
    'Enquanto o usar, você pode executar uma ação Usar Magia e gastar 1 carga para fazer a peça exibir um padrão mutante de tons ofuscantes até o fim do seu próximo turno. Durante esse tempo, o manto emite luz plena num raio de 9 metros e penumbra por mais 9 metros, e criaturas que possam ver você têm Desvantagem em jogadas de ataque contra você.',
    'Qualquer criatura na luz plena que possa ver você quando o poder do manto é ativado deve passar em uma salvaguarda de Sabedoria CD 15 ou recebe a condição Atordoado até o efeito terminar.',
  ], { sint: true }),

  mi('manto-de-estrelas', 'Manto de Estrelas', 'Item Maravilhoso', 'muito-raro', [
    'Este manto preto ou azul-escuro é bordado com pequenas estrelas brancas ou prateadas. Você ganha +1 nas salvaguardas enquanto o usar.',
    'Seis estrelas, na parte frontal superior do manto, são particularmente grandes. Enquanto o usar, você pode executar uma ação Usar Magia para remover uma delas e gastá-la para conjurar a versão de 5º círculo de Mísseis Mágicos. Todo dia ao anoitecer, 1d6 estrelas removidas reaparecem no manto.',
    'Enquanto o usar, você pode executar uma ação Usar Magia para entrar no Plano Astral junto com tudo o que estiver vestindo e carregando. Você permanece lá até executar uma ação Usar Magia para voltar ao plano em que estava, reaparecendo no último espaço que ocupou ou, se estiver ocupado, no espaço desocupado mais próximo.',
  ], { sint: true, efeitos: { saveBonus: 1 } }),

  mi('manto-do-arquimago', 'Manto do Arquimago', 'Item Maravilhoso', 'lendario', [
    'Esta peça elegante é feita de tecido primoroso e adornada com runas. Enquanto a usar, você ganha:',
    'Armadura. Se não estiver usando armadura, sua Classe de Armadura base é 15 + o seu modificador de Destreza.',
    'Resistência a Magia. Você tem Vantagem em salvaguardas contra magias e outros efeitos mágicos.',
    'Mago de Guerra. Sua CD de salvaguarda de magia e o seu bônus de ataque mágico aumentam em 2 cada.',
  ], { sint: 'por um Feiticeiro, Bruxo ou Mago' }),

  mi('manto-de-itens-uteis', 'Manto de Itens Úteis', 'Item Maravilhoso', 'incomum', [
    'Este manto é coberto por remendos de tecido de vários formatos e cores. Enquanto o usar, você pode executar uma ação Usar Magia para destacar um remendo, fazendo-o virar o objeto ou a criatura que representa. Quando o último remendo é removido, o manto vira uma peça comum.',
    'O manto tem dois remendos de cada um destes: Lanterna Furta-Fogo (cheia e acesa), Adaga, Espelho, Vara, Corda (enrolada) e Saco.',
    'Além disso, o manto tem outros 4d4 remendos, escolhidos pelo Mestre ou determinados aleatoriamente: bolsa com 100 PO, cofre de prata no valor de 500 PO, porta de ferro, 10 gemas de 100 PO, escada de madeira de 7,5 metros, pônei com sela, fosso de 3 metros quadrados por 3 metros de profundidade, poção de cura, bote a remo, mastim de guerra, janela e árvore.',
  ]),

  mi('bastao-da-absorcao', 'Bastão da Absorção', 'Bastão', 'muito-raro', [
    'Segurando este bastão, você pode executar uma Reação para absorver uma magia que esteja mirando apenas você e que não crie uma área de efeito. O efeito da magia absorvida é cancelado e a energia dela — não a magia em si — fica guardada no bastão, com o mesmo círculo que a magia tinha ao ser conjurada. A magia cancelada se dissipa sem efeito e os recursos usados para conjurá-la são desperdiçados.',
    'O bastão pode absorver e guardar até 50 círculos de energia ao longo da existência dele. Depois disso, não absorve mais nada, e magias que ele não consiga guardar não são afetadas.',
    'Ao se sintonizar ao bastão, você sabe quantos círculos de energia ele já absorveu e quantos círculos estão guardados no momento. Se você for um conjurador segurando o bastão, pode converter a energia guardada nele em espaços de magia para conjurar magias que tenha preparado, até o limite dos espaços que você normalmente possui.',
  ], { sint: true }),
  mi('bastao-do-alerta', 'Bastão do Alerta', 'Bastão', 'muito-raro', [
    'Alerta. Enquanto segura o bastão, você tem Vantagem em testes de Sabedoria (Percepção) e em jogadas de Iniciativa.',
    'Magias. Enquanto segura o bastão, você pode conjurar estas magias a partir dele: Detectar o Bem e o Mal, Detectar Magia, Detectar Veneno e Doença e Ver o Invisível.',
    'Aura Protetora. Com uma ação Usar Magia, você pode fincar a ponta do cabo no chão, e então a cabeça do bastão emite luz plena num raio de 18 metros e penumbra por mais 18 metros. Nessa luz plena, você e seus aliados ganham +1 na Classe de Armadura e nas salvaguardas e conseguem sentir a posição de qualquer criatura Invisível que também esteja nela.',
    'A cabeça do bastão para de brilhar e o efeito termina depois de 10 minutos ou quando uma criatura executa uma ação Usar Magia para arrancá-lo do chão. Depois de usada, esta propriedade só volta a funcionar no próximo amanhecer.',
  ], { sint: true }),

  mi('bastao-do-poder-senhorial', 'Bastão do Poder Senhorial', 'Bastão', 'lendario', [
    'Este bastão tem uma cabeça com abas e funciona como uma Maça mágica que concede +3 nas jogadas de ataque e de dano feitas com ela. Ele tem propriedades associadas a seis botões dispostos em fila ao longo do cabo.',
    'Botões. Você pode apertar um dos botões como ação Bônus; o efeito dura até você apertar outro botão ou apertar o mesmo de novo, o que faz o bastão voltar à forma normal.',
    'Botão 1: uma lâmina flamejante brota da cabeça, e o bastão vira uma Espada Longa mágica +3 que causa 2d6 de dano Ígneo extra. Botão 2: o bastão vira uma Lança mágica +3 e se alonga até 1,8 metro. Botão 3: o bastão se alonga até 3 metros e funciona como uma vara de medição. Botão 4: o bastão vira uma escada de mão de até 15 metros. Botão 5: o bastão vira um bastão de escalada com um pino que se crava e degraus. Botão 6: o bastão indica o norte magnético e o número de degraus subidos ou descidos.',
    'Drenar Vida. Quando você acerta um ataque com o bastão, pode gastar uma carga para causar 4d6 de dano Necrótico extra e recuperar Pontos de Vida iguais ao dano extra. Só volta a funcionar no próximo amanhecer.',
    'Paralisar. Você pode executar uma ação Usar Magia para forçar uma criatura que possa ver a até 18 metros a passar em uma salvaguarda de Força CD 17 ou receber a condição Paralisado por 1 minuto. Só volta a funcionar no próximo amanhecer.',
    'Aterrorizar. Você pode executar uma ação Usar Magia para forçar cada criatura à sua escolha a até 9 metros a passar em uma salvaguarda de Sabedoria CD 17 ou receber a condição Amedrontado por 1 minuto. Só volta a funcionar no próximo amanhecer.',
  ], { sint: true, efeitos: { attackBonus: 3 } }),

  mi('bastao-da-ressurreicao', 'Bastão da Ressurreição', 'Bastão', 'lendario', [
    'O bastão tem 5 cargas. Enquanto o segura, você pode conjurar uma destas magias a partir dele: Cura Completa (gasta 1 carga) ou Ressurreição (gasta 5 cargas).',
    'O bastão recupera 1 carga gasta diariamente ao amanhecer. Se você gastar a última carga, role 1d20: com 1, o bastão desaparece em um clarão inofensivo de luz.',
  ], { sint: true }),

  mi('bastao-do-governo', 'Bastão do Governo', 'Bastão', 'raro', [
    'Você pode executar uma ação Usar Magia para apresentar o bastão e exigir obediência de cada criatura à sua escolha que possa ver a até 36 metros de você. Cada alvo deve passar em uma salvaguarda de Sabedoria CD 15 ou recebe a condição Enfeitiçado por 8 horas.',
    'Enquanto Enfeitiçada assim, a criatura o considera seu líder de confiança. Se for ferida por você ou pelos seus aliados, ou comandada a fazer algo contrário à natureza dela, o alvo deixa de estar Enfeitiçado.',
    'Depois de usada, esta propriedade só volta a funcionar no próximo amanhecer.',
  ], { sint: true }),

  mi('bastao-da-seguranca', 'Bastão da Segurança', 'Bastão', 'muito-raro', [
    'Segurando este bastão, você pode executar uma ação Usar Magia para ativá-lo. Ele então transporta instantaneamente você e até 199 outras criaturas dispostas que você possa ver para um semiplano. Você escolhe a forma do semiplano: um jardim tranquilo, uma taverna alegre, um palácio imenso, uma ilha tropical ou o que mais imaginar.',
    'Seja qual for a natureza dele, o semiplano contém água e comida suficientes para sustentar os visitantes, e o ambiente não pode ferir os ocupantes. Tudo o mais com que se pode interagir lá só existe lá.',
    'Para cada hora passada no semiplano, um visitante recupera Pontos de Vida como se tivesse gasto 1 Dado de Pontos de Vida. Além disso, as criaturas não envelhecem lá, embora o tempo passe normalmente fora.',
    'Você pode permanecer no semiplano por até 200 dias divididos pelo número de criaturas presentes. Depois disso, o bastão para de funcionar e todos são devolvidos ao espaço que ocupavam antes.',
  ]),

  mi('bastao-do-guardiao-do-pacto', 'Bastão do Guardião do Pacto', 'Bastão', 'varia', [
    'Enquanto segura este bastão, você ganha um bônus nas jogadas de ataque mágico e nas CDs de salvaguarda das suas magias de Bruxo. O bônus é determinado pela raridade do bastão: +1 (Incomum), +2 (Raro) ou +3 (Muito Raro).',
    'Além disso, você pode recuperar um espaço de magia com uma ação Usar Magia enquanto segura o bastão. Você só volta a usar esta propriedade depois de terminar um Descanso Longo.',
  ], { sint: 'por um Bruxo' }),

  mi('corda-de-escalada', 'Corda de Escalada', 'Item Maravilhoso', 'incomum', [
    'Esta corda de 18 metros suporta até 1.350 kg. Segurando uma das pontas, você pode executar uma ação Usar Magia para comandar a outra ponta a se animar e se mover até um destino à sua escolha, a até o comprimento da corda de distância. Essa ponta se move 3 metros no seu turno quando você a comanda pela primeira vez e mais 3 metros no início de cada turno seu seguinte, até chegar ao destino ou até você mandá-la parar.',
    'Você também pode mandar a corda se prender com firmeza a um objeto ou se soltar, dar ou desfazer nós, ou se enrolar para transporte. Se você mandar a corda dar nós, grandes nós aparecem a cada 30 cm; enquanto estiver com nós, a corda encurta para 15 metros e concede Vantagem em testes de habilidade feitos para escalar usando-a.',
    'A corda tem CA 20, PV 20 e Imunidade a dano Venenoso e Psíquico. Ela se conserta a 1 Ponto de Vida a cada 5 minutos, desde que tenha pelo menos 1 Ponto de Vida. Se cair a 0 Pontos de Vida, a corda é destruída.',
  ]),

  mi('corda-de-enredamento', 'Corda de Enredamento', 'Item Maravilhoso', 'raro', [
    'Esta corda tem 9 metros. Segurando uma das pontas, você pode executar uma ação Usar Magia para comandar a outra ponta a disparar e enredar uma criatura que você possa ver a até 6 metros de você. O alvo deve passar em uma salvaguarda de Destreza CD 15 ou recebe a condição Contido.',
    'Você pode libertar o alvo soltando a sua ponta da corda (fazendo a corda se enrolar no espaço do alvo) ou usando uma ação Bônus para repetir o comando (fazendo a corda se enrolar na sua mão).',
    'Um alvo Contido pela corda pode executar uma ação para realizar um teste de Força (Atletismo) ou Destreza (Acrobacia) CD 15, à escolha dele; se for bem-sucedido, deixa de estar Contido pela corda.',
  ]),

  mi('corda-que-se-remenda', 'Corda que se Remenda', 'Item Maravilhoso', 'comum', [
    'Este rolo de corda de 15 metros consegue se consertar quando cortado em qualquer número de pedaços menores. Com uma ação Usar Magia, você pode fazer todos os pedaços da corda que estejam em contato entre si e não estejam em uso se unir de novo.',
    'Uma Corda que se Remenda fica permanentemente mais curta se uma parte dela for perdida ou destruída.',
  ]),

  mi('rubi-do-maca-de-guerra', 'Rubi do Mago de Guerra', 'Item Maravilhoso', 'comum', [
    'Gravado com runas místicas, este rubi de 2,5 cm de diâmetro permite que você use uma arma Simples ou Marcial como Foco de Conjuração das suas magias.',
    'Para esta propriedade funcionar, você precisa prender o rubi à arma, pressionando-o contra ela por pelo menos 10 minutos. Depois disso, o rubi não pode ser removido, a menos que você o solte com uma ação Usar Magia, a arma seja destruída ou a sua sintonização com o rubi termine.',
  ], { sint: 'por um conjurador' }),

  mi('sela-do-cavaleiro', 'Sela do Cavaleiro', 'Item Maravilhoso', 'incomum', [
    'Esta sela concede os seguintes benefícios enquanto você estiver sentado nela, montado:',
    'Montaria Protegida. Jogadas de ataque contra a montaria têm Desvantagem.',
    'Cavaleiro Seguro. Você não pode ser desmontado contra a sua vontade. Esta propriedade fica suprimida enquanto você tiver a condição Incapacitado.',
  ]),

  mi('escaravelho-de-protecao', 'Escaravelho de Proteção', 'Item Maravilhoso', 'lendario', [
    'Este medalhão em forma de besouro concede três benefícios enquanto estiver com você:',
    'Defesa. Você ganha +1 na Classe de Armadura.',
    'Preservação. O escaravelho tem 12 cargas. Se você falhar em uma salvaguarda contra uma magia de Necromancia ou contra um efeito nocivo de um Morto-vivo, pode executar uma Reação para gastar 1 carga e transformar a falha em sucesso. O escaravelho vira pó e é destruído quando a última carga é gasta.',
    'Resistência a Magia. Você tem Vantagem em salvaguardas contra magias.',
  ], { sint: true, efeitos: { acBonus: 1 } }),

  mi('cimitarra-da-velocidade', 'Cimitarra da Velocidade', 'Arma', 'muito-raro', [
    'Você ganha +2 nas jogadas de ataque e de dano feitas com esta arma mágica. Além disso, você pode fazer um ataque com ela como ação Bônus em cada turno seu.',
  ], { sint: true, detalhe: 'Cimitarra', efeitos: { attackBonus: 2 } }),

  mi('pergaminho-de-protecao', 'Pergaminho de Proteção', 'Pergaminho', 'raro', [
    'Cada Pergaminho de Proteção funciona contra criaturas de um tipo específico, escolhido pelo Mestre ou determinado aleatoriamente (Aberrações, Bestas, Celestiais, Constructos, Dragões, Elementais, Fadas, Gigantes, Humanoides, Ínferos, Limos, Monstruosidades, Mortos-vivos ou Plantas).',
    'Usar uma ação Usar Magia para ler o pergaminho cria uma Emanação de 1,5 metro com origem em você. Por 5 minutos, criaturas do tipo especificado não podem entrar na área nem afetar nada dentro dela. No entanto, se você se mover de modo que uma criatura desse tipo ficaria dentro da área, o efeito termina.',
    'Com uma ação Usar Magia, uma criatura a até 1,5 metro da Emanação pode tentar superá-la, realizando uma salvaguarda de Carisma CD 15. Se for bem-sucedida, deixa de ser afetada pelo pergaminho.',
  ]),

  mi('pergaminho-de-invocacao-de-tita', 'Pergaminho de Invocação de Titã', 'Pergaminho', 'lendario', [
    'Quando você executa uma ação Usar Magia para ler este pergaminho, um titã específico nomeado nele aparece em um espaço desocupado no chão ou na água que você possa ver a até 1,6 km de você.',
    'O Mestre escolhe um titã adequado ou o determina aleatoriamente: Senhor Animal, Bolha da Aniquilação, Colosso, Cataclismo Elemental, Empíreo, Kraken ou Tarrasque.',
    'O titã é Hostil a todas as outras criaturas e desaparece quando cai a 0 Pontos de Vida. Se for invocado em um espaço grande o bastante para contê-lo, a invocação falha e o pergaminho é desperdiçado.',
  ]),

  mi('pergaminho-magico', 'Pergaminho Mágico', 'Pergaminho', 'varia', [
    'Um Pergaminho Mágico traz as palavras de uma única magia, escritas em uma cifra mística. Se a magia estiver na lista da sua classe, você pode lê-la e conjurá-la sem fornecer os componentes Materiais. Caso contrário, o pergaminho é ininteligível.',
    'Conjurar a magia lendo o pergaminho exige o tempo de conjuração normal dela. Depois de conjurada, as palavras somem e o pergaminho vira pó. A magia usa o círculo mínimo dela, a CD de salvaguarda e o bônus de ataque indicados pelo pergaminho.',
    'Se a magia for de um círculo maior do que você consegue conjurar, você deve realizar um teste do seu atributo de conjuração (CD 10 + o círculo da magia). Se falhar, a magia se dissipa sem efeito e o pergaminho é destruído.',
    'Raridade por círculo: truque e 1º (Comum), 2º e 3º (Incomum), 4º e 5º (Raro), 6º e 7º (Muito Raro), 8º e 9º (Lendário).',
  ]),

  mi('pedras-de-comunicacao', 'Pedras de Comunicação', 'Item Maravilhoso', 'incomum', [
    'As Pedras de Comunicação vêm em pares, cada uma entalhada para combinar com a outra, de modo que o par seja fácil de reconhecer.',
    'Enquanto toca em uma pedra, você pode conjurar Mensagem a Distância a partir dela. O alvo é quem estiver com a outra pedra. Se nenhuma criatura estiver com a outra pedra, você sabe disso assim que usa a sua e não conjura a magia.',
    'Depois que a magia é conjurada por qualquer uma das pedras, elas só voltam a funcionar no próximo amanhecer. Se uma das pedras do par for destruída, a outra se torna não mágica.',
  ]),

  mi('escudo-sentinela', 'Escudo Sentinela', 'Armadura', 'incomum', [
    'Enquanto segura este Escudo, você tem Vantagem em jogadas de Iniciativa e em testes de Sabedoria (Percepção). O Escudo é ornado com o símbolo de um olho.',
  ], { detalhe: 'Escudo', efeitos: { acBonus: 2 } }),

  mi('escudo-magico', 'Escudo +1, +2 ou +3', 'Armadura', 'varia', [
    'Incomum (+1), Raro (+2) ou Muito Raro (+3).',
    'Enquanto segura este Escudo, você tem um bônus na Classe de Armadura determinado pela raridade dele, além do bônus normal de CA do Escudo.',
  ], { detalhe: 'Escudo', efeitos: { acBonus: 3 } }),

  mi('escudo-de-expressao', 'Escudo de Expressão', 'Armadura', 'comum', [
    'A frente deste Escudo tem o formato de um rosto. Enquanto o carrega, você pode executar uma ação Bônus para mudar a expressão do rosto.',
  ], { detalhe: 'Escudo', efeitos: { acBonus: 2 } }),

  mi('escudo-atrator-de-projeteis', 'Escudo Atrator de Projéteis', 'Armadura', 'raro', [
    'Enquanto segura este Escudo, você tem Resistência a dano de ataques feitos com armas à Distância.',
    'Maldição. Este Escudo é amaldiçoado. Sintonizar-se a ele o amaldiçoa até você ser alvo da magia Remover Maldição ou de magia similar; largar o Escudo não encerra a maldição. Sempre que um ataque com arma à Distância mirar uma criatura a até 3 metros de você, a maldição faz com que você se torne o alvo no lugar dela.',
  ], { sint: true, detalhe: 'Escudo', efeitos: { acBonus: 2 } }),

  mi('escudo-do-cavaleiro', 'Escudo do Cavaleiro', 'Armadura', 'muito-raro', [
    'Enquanto segura este Escudo, você tem +2 na Classe de Armadura, além do bônus normal de CA do Escudo.',
    'Golpe Contundente. Quando você executa a ação Atacar, pode fazer uma das jogadas de ataque usando o Escudo contra um alvo a até 1,5 metro de você. Aplique o seu bônus de proficiência e o seu modificador de Força à jogada. Se acertar, o Escudo causa dano de Força igual a 2d6 + 2 mais o seu modificador de Força e, se o alvo for uma criatura, você pode empurrá-lo até 3 metros para longe de você; se ele for do seu tamanho ou menor, também pode derrubá-lo, dando a ele a condição Caído.',
    'Campo Protetor. Como Reação, quando você ou um aliado que possa ver a até 1,5 metro de você sofrer dano, você pode reduzir esse dano em 2d8 + o seu modificador de Força. Você só volta a usar esta propriedade depois de terminar um Descanso Longo.',
  ], { sint: true, detalhe: 'Escudo', efeitos: { acBonus: 4 } }),

  mi('escudo-protetor-de-magias', 'Escudo Protetor de Magias', 'Armadura', 'muito-raro', [
    'Enquanto segura este Escudo, você tem Vantagem em salvaguardas contra magias e outros efeitos mágicos, e jogadas de ataque mágico contra você têm Desvantagem.',
  ], { sint: true, detalhe: 'Escudo', efeitos: { acBonus: 2 } }),

  mi('arma-prateada', 'Arma Prateada', 'Arma', 'comum', [
    'Um processo alquímico ligou prata a esta arma mágica. Quando você marca um Acerto Crítico com ela contra uma criatura que esteja metamorfoseada, a arma causa um dado adicional de dano.',
  ], { detalhe: 'Qualquer Arma Simples ou Marcial' }),

  mi('sapatilhas-de-escalada-em-aranha', 'Sapatilhas de Escalada de Aranha', 'Item Maravilhoso', 'incomum', [
    'Enquanto usar estes sapatos leves, você pode subir, descer e atravessar superfícies verticais e tetos com as mãos livres. Você tem Deslocamento de Escalada igual ao seu deslocamento.',
    'As sapatilhas não permitem que você se mova assim em superfícies escorregadias, como as cobertas de gelo ou óleo.',
  ], { sint: true }),

  mi('armadura-fumegante', 'Armadura Fumegante', 'Armadura', 'comum', [
    'Fiapos de fumaça inofensiva e sem cheiro sobem desta armadura enquanto ela está sendo vestida.',
  ], { detalhe: 'Qualquer Armadura Leve, Média ou Pesada' }),

  mi('cola-soberana', 'Cola Soberana', 'Item Maravilhoso', 'lendario', [
    'Esta substância viscosa e branca leitosa cria uma ligação permanente entre dois objetos quaisquer. Ela precisa ser guardada em um pote ou frasco revestido por dentro com Óleo do Escorregadio. Quando encontrado, o recipiente contém 1d6 + 1 medidas (cerca de 30 ml cada).',
    'Uma medida da cola cobre uma superfície de 30 cm². Aplicar uma medida exige uma ação Utilizar, e a cola aplicada leva 1 minuto para pegar. Feito isso, a ligação criada só pode ser desfeita pela aplicação de Solvente Universal ou Óleo da Etereidade, ou por uma magia Desejo.',
  ]),

  mi('esfera-da-aniquilacao', 'Esfera da Aniquilação', 'Item Maravilhoso', 'lendario', [
    'Esta esfera negra de 60 cm de diâmetro é um buraco no multiverso, pairando no espaço e estabilizada por um campo mágico ao redor dela. A esfera oblitera toda a matéria por onde passa e toda a matéria que passa por ela. Artefatos são a exceção.',
    'Qualquer outra coisa que toque a esfera sem ser inteiramente engolfada e obliterada por ela sofre 8d10 de dano de Força.',
    'Controlando a Esfera. Uma Esfera da Aniquilação fica parada até alguém assumir o controle dela. Se você estiver a até 18 metros de uma esfera, pode executar uma ação Usar Magia para realizar um teste de Inteligência (Arcanismo) CD 25. Se for bem-sucedido, você controla a esfera até o início do seu próximo turno e, se ela estava sob o controle de outra criatura, essa criatura perde o controle.',
    'Se você controlar a esfera, pode movê-la até 9 metros com o teste bem-sucedido. Se falhar por 5 ou mais, a esfera se move 3 metros na sua direção.',
  ]),

  mi('tabua-espirita', 'Tábua Espírita', 'Item Maravilhoso', 'muito-raro', [
    'Esta tábua de madeira ornamentada tem as letras do alfabeto Comum impressas de um lado, junto com as palavras "Sim" e "Não" e símbolos que representam "Bem" e "Mal". A tábua vem com uma prancheta de madeira em forma de coração, que precisa estar apoiada no lado das letras para a magia funcionar.',
    'A tábua tem 3 cargas e recupera 1 carga gasta diariamente ao amanhecer. Tocando a prancheta, você pode levar 1 minuto para conjurar uma destas magias: Augúrio (1 carga), Comunhão (3 cargas), Contato Extraplanar (2 cargas) e Falar com Mortos (2 cargas).',
    'Ao conjurar a magia, você invoca os espíritos dos mortos para guiar a prancheta pela superfície da tábua, respondendo às suas perguntas ao apontar para as letras ou palavras.',
  ]),

  mi('cajado-do-adorno', 'Cajado do Adorno', 'Cajado', 'comum', [
    'Se você colocar um objeto Minúsculo de até 500 g (como um fragmento de cristal, um ovo ou uma pedra) acima da ponta deste cajado enquanto o segura, o objeto flutua a 2,5 cm da ponta e permanece ali até ser removido ou até o cajado deixar de estar em sua posse.',
    'O cajado pode ter até três objetos flutuando sobre a ponta ao mesmo tempo. Enquanto o segura, você pode fazer um ou mais dos objetos girar ou rodar lentamente no lugar.',
  ]),

  mi('cajado-dos-cantos-de-passaro', 'Cajado dos Cantos de Pássaro', 'Cajado', 'comum', [
    'Este cajado de madeira é decorado com entalhes de pássaros e tem 10 cargas.',
    'Segurando-o, você pode executar uma ação Usar Magia para gastar 1 carga e fazê-lo criar um destes sons, audível a até 36 metros: o piado de um tentilhão, o grasnado de um corvo, o grasnar de um pato, o cacarejo de uma galinha, o gritar de um ganso, o canto de um mergulhão, o glugu de um peru, o grito de uma gaivota, o pio de uma coruja ou o guincho de uma águia.',
    'Recuperando Cargas. O cajado recupera 1d6 + 4 cargas gastas diariamente ao amanhecer. Se você gastar a última carga, role 1d20: com 1, o cajado explode em uma nuvem inofensiva de penas e se perde para sempre.',
  ]),

  mi('cajado-do-encantamento', 'Cajado do Encantamento', 'Cajado', 'raro', [
    'Este cajado tem 10 cargas. Enquanto o segura, você pode usar qualquer uma das propriedades dele:',
    'Conjurar Magia. Você pode gastar 1 carga para conjurar Enfeitiçar Pessoa, Comando ou Compreender Idiomas a partir dele, usando a sua CD de salvaguarda de magia.',
    'Refletir Encantamento. Se você passar em uma salvaguarda contra uma magia de Encantamento que mire apenas você, pode executar uma Reação para gastar 1 carga e devolver a magia ao conjurador, como se você a tivesse conjurado.',
    'Resistir a Encantamento. Se você falhar em uma salvaguarda contra uma magia de Encantamento que mire apenas você, pode transformar a falha em sucesso. Você só volta a usar esta propriedade no próximo amanhecer.',
    'Recuperando Cargas. O cajado recupera 1d8 + 2 cargas gastas diariamente ao amanhecer. Se você gastar a última carga, role 1d20: com 1, o cajado vira um Bordão não mágico.',
  ], { sint: 'por um Bardo, Clérigo, Druida, Feiticeiro, Bruxo ou Mago' }),

  mi('cajado-de-fogo', 'Cajado de Fogo', 'Cajado', 'muito-raro', [
    'Você tem Resistência a dano Ígneo enquanto segura este cajado.',
    'Magias. O cajado tem 10 cargas. Enquanto o segura, você pode conjurar estas magias a partir dele, usando a sua CD de salvaguarda: Mãos Flamejantes (1 carga), Bola de Fogo (3 cargas) e Muralha de Fogo (4 cargas).',
    'Recuperando Cargas. O cajado recupera 1d6 + 4 cargas gastas diariamente ao amanhecer. Se você gastar a última carga, role 1d20: com 1, o cajado vira cinzas e é destruído.',
  ], { sint: 'por um Druida, Feiticeiro, Bruxo ou Mago' }),

  mi('cajado-de-flores', 'Cajado de Flores', 'Cajado', 'comum', [
    'Este cajado de madeira tem 10 cargas. Segurando-o, você pode executar uma ação Usar Magia para gastar 1 carga e fazer uma flor brotar de um trecho de terra ou solo a até 1,5 metro de você, ou do próprio cajado.',
    'A menos que você escolha um tipo específico, o cajado cria uma margarida de aroma suave. A flor é inofensiva e não mágica, e cresce ou murcha como uma flor normal.',
    'Recuperando Cargas. O cajado recupera 1d6 + 4 cargas gastas diariamente ao amanhecer. Se você gastar a última carga, role 1d20: com 1, o cajado se desfaz em pétalas e se perde para sempre.',
  ]),

  mi('cajado-de-gelo', 'Cajado de Gelo', 'Cajado', 'muito-raro', [
    'Você tem Resistência a dano Gélido enquanto segura este cajado.',
    'Magias. O cajado tem 10 cargas. Enquanto o segura, você pode conjurar estas magias a partir dele, usando a sua CD de salvaguarda: Névoa Obscurecente (1 carga), Tempestade Glacial (4 cargas), Muralha de Gelo (4 cargas) e Cone de Frio (5 cargas).',
    'Recuperando Cargas. O cajado recupera 1d6 + 4 cargas gastas diariamente ao amanhecer. Se você gastar a última carga, role 1d20: com 1, o cajado vira água e é destruído.',
  ], { sint: 'por um Druida, Feiticeiro, Bruxo ou Mago' }),

  mi('cajado-da-cura', 'Cajado da Cura', 'Cajado', 'raro', [
    'Este cajado tem 10 cargas. Enquanto o segura, você pode conjurar estas magias a partir dele, usando o seu modificador de atributo de conjuração: Curar Ferimentos (1 carga por círculo da magia, máximo de 4 para uma magia de 4º círculo), Restauração Menor (2 cargas) e Curar Ferimentos em Massa (5 cargas).',
    'Recuperando Cargas. O cajado recupera 1d6 + 4 cargas gastas diariamente ao amanhecer. Se você gastar a última carga, role 1d20: com 1, o cajado some em um clarão de luz e se perde para sempre.',
  ], { sint: 'por um Bardo, Clérigo ou Druida' }),

  mi('cajado-do-poder', 'Cajado do Poder', 'Cajado', 'muito-raro', [
    'Este cajado tem 20 cargas e pode ser empunhado como um Bordão mágico que concede +2 nas jogadas de ataque e de dano feitas com ele. Enquanto o segura, você ganha +2 na Classe de Armadura, nas salvaguardas e nas jogadas de ataque mágico.',
    'Magias. Enquanto o segura, você pode conjurar estas magias a partir dele, usando a sua CD de salvaguarda: Mísseis Mágicos (1 carga), Raio do Enfraquecimento (1 carga), Levitação (2 cargas), Paralisar Monstro (5 cargas), Bola de Fogo na versão de 5º círculo (5 cargas), Relâmpago na versão de 5º círculo (5 cargas), Cone de Frio (5 cargas), Globo de Invulnerabilidade (6 cargas) e Muralha de Energia (6 cargas).',
    'Recuperando Cargas. O cajado recupera 2d8 + 4 cargas gastas diariamente ao amanhecer. Se você gastar a última carga, role 1d20: com 1, o cajado mantém o bônus de +2 nas jogadas de ataque e de dano, mas perde as demais propriedades. Com 20, ele recupera 1d8 + 2 cargas.',
    'Retribuição Destrutiva. Você pode quebrar o cajado sobre o joelho ou contra uma superfície sólida com uma ação Usar Magia, destruindo-o e liberando a magia dele em uma explosão que preenche uma Esfera de 9 metros de raio centrada nele.',
  ], { sint: 'por um Feiticeiro, Bruxo ou Mago', efeitos: { attackBonus: 2, acBonus: 2, saveBonus: 2 } }),
  mi('cajado-do-golpe', 'Cajado do Golpe', 'Cajado', 'muito-raro', [
    'Este cajado pode ser empunhado como um Bordão mágico que concede +3 nas jogadas de ataque e de dano feitas com ele.',
    'O cajado tem 10 cargas. Quando você acerta um ataque corpo a corpo com ele, pode gastar até 3 cargas: para cada carga gasta, o alvo sofre 1d6 de dano de Força extra.',
    'Recuperando Cargas. O cajado recupera 1d6 + 4 cargas gastas diariamente ao amanhecer. Se você gastar a última carga, role 1d20: com 1, o cajado vira um Bordão não mágico.',
  ], { sint: true, efeitos: { attackBonus: 3 } }),

  mi('cajado-do-enxame-de-insetos', 'Cajado do Enxame de Insetos', 'Cajado', 'raro', [
    'Este cajado tem 10 cargas.',
    'Nuvem de Insetos. Segurando o cajado, você pode executar uma ação Usar Magia e gastar 1 carga para fazer um enxame de insetos voadores inofensivos preencher uma Emanação de 9 metros com origem em você. Os insetos permanecem por 10 minutos, deixando a área Fortemente Obscurecida para criaturas que não sejam você. Um vento forte (como o da Lufada de Vento) dispersa o enxame e encerra o efeito.',
    'Magias. Segurando o cajado, você pode conjurar estas magias a partir dele, usando a sua CD de salvaguarda e o seu modificador de ataque mágico: Inseto Gigante (4 cargas) e Praga de Insetos (5 cargas).',
    'Recuperando Cargas. O cajado recupera 1d6 + 4 cargas gastas diariamente ao amanhecer. Se você gastar a última carga, role 1d20: com 1, um enxame de insetos devora e destrói o cajado e depois se dispersa.',
  ], { sint: 'por um Bardo, Clérigo, Druida, Feiticeiro, Bruxo ou Mago' }),

  mi('cajado-da-vibora', 'Cajado da Víbora', 'Cajado', 'incomum', [
    'Como ação Bônus, você pode transformar a cabeça deste cajado na de uma serpente venenosa animada por 1 minuto, ou fazer o cajado voltar à forma inanimada.',
    'Quando você executa a ação Atacar, pode fazer uma das jogadas de ataque usando a cabeça de serpente animada, que tem alcance de 1,5 metro. Aplique o seu bônus de proficiência e o seu modificador de Sabedoria à jogada. Se acertar, o alvo sofre 1d6 de dano Perfurante e 3d6 de dano Venenoso.',
    'A cabeça de serpente pode ser atacada enquanto está animada. Ela tem CA 15, PV 20 e Imunidade a dano Venenoso e Psíquico. Se cair a 0 Pontos de Vida, o cajado é destruído. Enquanto não for destruído, o cajado recupera todos os Pontos de Vida perdidos quando volta à forma inanimada.',
  ], { sint: true }),

  mi('cajado-dos-magos', 'Cajado dos Magos', 'Cajado', 'lendario', [
    'Este cajado tem 50 cargas e pode ser empunhado como um Bordão mágico que concede +2 nas jogadas de ataque e de dano feitas com ele. Enquanto o segura, você ganha +2 nas jogadas de ataque mágico.',
    'Absorção de Magia. Segurando o cajado, você tem Vantagem em salvaguardas contra magias. Além disso, você pode executar uma Reação quando outra criatura conjurar uma magia que mire apenas você: o cajado absorve a magia, cancelando o efeito e ganhando cargas iguais ao círculo da magia absorvida. Se isso levar o total acima de 50 cargas, o cajado explode como se você tivesse ativado a Retribuição Destrutiva.',
    'Magias. Segurando o cajado, você pode conjurar estas magias a partir dele, usando a sua CD de salvaguarda: Detectar Magia, Servo Invisível, Luz e Mãos Mágicas (0 cargas); Porta Dimensional, Muralha de Fogo, Passo Nebuloso, Teia, Dissipar Magia, Convocar Elemental, Bola de Fogo, Relâmpago, Muralha de Energia, Invisibilidade, Cone de Frio, Plano Astral e Telecinese (de 1 a 7 cargas cada).',
    'Recuperando Cargas. O cajado recupera 4d6 + 2 cargas gastas diariamente ao amanhecer.',
    'Retribuição Destrutiva. Você pode quebrar o cajado sobre o joelho ou contra uma superfície sólida com uma ação Usar Magia, destruindo-o e liberando a magia dele em uma explosão que preenche uma Esfera de 9 metros de raio centrada nele. Você tem 50% de chance de ser instantaneamente transportado para um plano de existência aleatório, escapando da explosão.',
  ], { sint: 'por um Feiticeiro, Bruxo ou Mago', efeitos: { attackBonus: 2 } }),

  mi('cajado-da-piton', 'Cajado da Píton', 'Cajado', 'incomum', [
    'Com uma ação Usar Magia, você pode arremessar este cajado para que ele caia em um espaço desocupado a até 3 metros de você, fazendo-o virar uma Serpente Constritora Gigante naquele espaço. A serpente fica sob o seu controle e compartilha a sua contagem de Iniciativa, agindo logo depois de você.',
    'No seu turno, você pode comandar mentalmente a serpente (não exige ação) se ela estiver a até 18 metros de você e você não tiver a condição Incapacitado. Você decide que ação ela executa e para onde se move, ou pode dar uma ordem geral, como atacar seus inimigos ou guardar um lugar. Sem comandos seus, a serpente se defende.',
    'Como ação Bônus, você pode comandar a serpente a voltar à forma de cajado no espaço atual, e não pode usar esta propriedade de novo por 1 hora. Se a serpente for reduzida a 0 Pontos de Vida, ela morre e volta à forma de cajado, que se despedaça e é destruído.',
  ], { sint: true }),

  mi('cajado-das-matas', 'Cajado das Matas', 'Cajado', 'raro', [
    'Este cajado tem 6 cargas e pode ser empunhado como um Bordão mágico que concede +2 nas jogadas de ataque e de dano feitas com ele. Enquanto o segura, você tem +2 nas jogadas de ataque mágico.',
    'Magias. Segurando o cajado, você pode conjurar estas magias a partir dele, usando a sua CD de salvaguarda: Amizade Animal (1 carga), Falar com Animais (1 carga), Localizar Animais ou Plantas (2 cargas), Pele-Casca (2 cargas), Passo Sem Rastro (2 cargas), Falar com Plantas (3 cargas), Muralha de Espinhos (6 cargas) e Despertar (5 cargas).',
    'Forma de Árvore. Você pode executar uma ação Usar Magia para plantar uma ponta do cajado na terra em um espaço desocupado e gastar 1 carga, transformando-o em uma árvore saudável de 18 metros de altura, tronco de 1,5 metro de diâmetro e copa com 6 metros de raio. A árvore parece comum, mas volta a ser cajado quando você executa uma ação Bônus tocando nela.',
    'Recuperando Cargas. O cajado recupera 1d6 cargas gastas diariamente ao amanhecer. Se você gastar a última carga, role 1d20: com 1, o cajado vira um Bordão não mágico.',
  ], { sint: 'por um Druida', efeitos: { attackBonus: 2 } }),

  mi('cajado-do-trovao-e-relampago', 'Cajado do Trovão e Relâmpago', 'Cajado', 'muito-raro', [
    'Este cajado pode ser empunhado como um Bordão mágico que concede +2 nas jogadas de ataque e de dano feitas com ele. Depois de usada, cada propriedade abaixo só volta a funcionar no próximo amanhecer.',
    'Relâmpago. Quando você acerta um ataque corpo a corpo com o cajado, pode fazer o alvo sofrer 2d6 de dano Elétrico extra (não exige ação).',
    'Trovão. Quando você acerta um ataque corpo a corpo com o cajado, pode fazê-lo emitir um estrondo audível a até 90 metros (não exige ação). O alvo atingido deve passar em uma salvaguarda de Constituição CD 17 ou recebe a condição Atordoado até o fim do seu próximo turno.',
    'Trovão e Relâmpago. Imediatamente depois de acertar um ataque corpo a corpo com o cajado, você pode executar uma ação Bônus para usar as propriedades Relâmpago e Trovão de uma vez, sem gastar os usos diários delas separadamente.',
    'Raio Relampejante. Você pode executar uma ação Usar Magia para conjurar Relâmpago (CD de salvaguarda 17) a partir do cajado.',
    'Estrondo Trovejante. Você pode executar uma ação Usar Magia para fazer o cajado emitir um estrondo audível a até 180 metros. Cada criatura a até 18 metros de você deve passar em uma salvaguarda de Constituição CD 17 ou recebe a condição Atordoado por 1 minuto.',
  ], { sint: true, efeitos: { attackBonus: 2 } }),

  mi('pedra-de-controle-de-elementais-da-terra', 'Pedra de Controle de Elementais da Terra', 'Item Maravilhoso', 'raro', [
    'Encostando esta pedra de 2,5 kg no chão, você pode executar uma ação Usar Magia para convocar um Elemental da Terra. Ele aparece em um espaço desocupado à sua escolha a até 9 metros de você, obedece aos seus comandos e age logo depois de você na Iniciativa.',
    'O elemental desaparece depois de 1 hora, quando morre ou quando você o dispensa como ação Bônus. A pedra só volta a funcionar assim no próximo amanhecer.',
  ]),

  mi('pedra-da-boa-sorte', 'Pedra da Boa Sorte', 'Item Maravilhoso', 'incomum', [
    'Enquanto esta ágata polida estiver com você, você ganha +1 em testes de habilidade e em salvaguardas.',
  ], { sint: true, resumo: '+1 em testes de habilidade e salvaguardas.', efeitos: { saveBonus: 1 } }),

  mi('lamina-solar', 'Lâmina Solar', 'Arma', 'raro', [
    'Este item parece ser apenas o punho de uma espada.',
    'Lâmina de Radiância. Segurando o punho, você pode executar uma ação Bônus para fazer surgir uma lâmina de pura radiância ou fazê-la desaparecer. Enquanto a lâmina existe, esta arma mágica funciona como uma Espada Longa com a propriedade Acuidade. Se você é proficiente com Espadas Longas ou Espadas Curtas, você é proficiente com a Lâmina Solar.',
    'Você ganha +2 nas jogadas de ataque e de dano feitas com esta arma, que causa dano Radiante em vez de Cortante. Quando você acerta um Morto-vivo com ela, o alvo sofre 1d8 de dano Radiante extra.',
    'Luz do Sol. A lâmina luminosa emite luz plena num raio de 4,5 metros e penumbra por mais 4,5 metros. Essa luz é luz solar. Enquanto a lâmina existir, você pode executar uma ação Usar Magia para expandir ou reduzir o raio da luz plena e da penumbra em 1,5 metro cada, até o máximo de 9 metros e o mínimo de 3 metros.',
  ], { sint: true, detalhe: 'Espada Longa', efeitos: { attackBonus: 2 } }),

  mi('espada-das-respostas', 'Espada das Respostas', 'Arma', 'lendario', [
    'Você ganha +3 nas jogadas de ataque e de dano feitas com esta espada.',
    'Além disso, enquanto a segura, você pode executar uma Reação para fazer um ataque corpo a corpo com ela contra qualquer criatura ao seu alcance que cause dano a você. Você tem Vantagem na jogada de ataque, e qualquer dano causado por esse ataque especial ignora qualquer Imunidade ou Resistência que o alvo tenha àquele tipo de dano.',
  ], { sint: true, detalhe: 'Espada Longa', efeitos: { attackBonus: 3 } }),

  mi('espada-de-kas', 'Espada de Kas', 'Arma', 'artefato', [
    'Kas foi um guerreiro poderoso que serviu Vecna e cuja lealdade foi recompensada com esta espada. Conforme o poder de Kas crescia, crescia também a arrogância dele, e a espada o incitou a destruir Vecna e usurpar o trono.',
    'Sede de Sangue. A espada tem sede de sangue. Se ela não provar sangue na lâmina até 1 minuto depois de ser sacada da bainha, quem a empunha realiza uma salvaguarda de Carisma CD 15. Se for bem-sucedido, sofre 3d6 de dano Psíquico; se falhar, é dominado pela espada, como pela magia Dominar Monstro, e ela exige sangue. O efeito termina quando a exigência é atendida.',
    'Arma Mágica. Você ganha +3 nas jogadas de ataque e de dano feitas com a espada. Ao acertar uma criatura, você causa 2d10 de dano Necrótico extra.',
    'Bênçãos de Kas. Enquanto sintonizado à espada, você ganha +3 na Classe de Armadura, Vantagem em jogadas de Iniciativa e a capacidade de conjurar magias poderosas a partir dela.',
    'Propriedades Aleatórias. A espada tem 2 propriedades benéficas menores, 1 propriedade benéfica maior, 2 propriedades prejudiciais menores e 1 propriedade prejudicial maior.',
  ], { sint: true, detalhe: 'Espada Longa', efeitos: { attackBonus: 3, acBonus: 3 } }),

  mi('espada-do-roubo-de-vida', 'Espada do Roubo de Vida', 'Arma', 'raro', [
    'Quando você ataca uma criatura com esta arma mágica e tira 20 no d20 da jogada de ataque, o alvo sofre 15 pontos de dano Necrótico extra, se não for um Constructo nem um Morto-vivo, e você ganha Pontos de Vida Temporários iguais ao dano Necrótico sofrido.',
  ], { sint: true, detalhe: 'Glaive, Espada Grande, Espada Longa, Rapieira, Cimitarra ou Espada Curta' }),

  mi('espada-do-afiamento', 'Espada do Afiamento', 'Arma', 'muito-raro', [
    'Quando você ataca um objeto com esta arma mágica e acerta, maximize os dados de dano da arma contra o alvo.',
    'Quando você ataca uma criatura com esta arma e tira 20 no d20 da jogada de ataque, o alvo sofre 14 pontos de dano Cortante extra e ganha 1 nível de Exaustão.',
  ], { sint: true, detalhe: 'Glaive, Espada Grande, Espada Longa ou Cimitarra' }),

  mi('espada-da-vinganca', 'Espada da Vingança', 'Arma', 'incomum', [
    'Você ganha +1 nas jogadas de ataque e de dano feitas com esta arma mágica.',
    'Maldição. Esta arma é amaldiçoada e possuída por um espírito vingativo. Sintonizar-se a ela estende a maldição a você. Enquanto permanecer amaldiçoado, você não aceita se separar da arma, mantendo-a sempre consigo, e tem Desvantagem em jogadas de ataque feitas com qualquer outra arma.',
    'Além disso, enquanto a arma estiver com você, você deve passar em uma salvaguarda de Sabedoria CD 15 sempre que sofrer dano de outra criatura em combate. Se falhar, você precisa atacar a criatura que o feriu até cair a 0 Pontos de Vida, até ela cair, ou até você não conseguir alcançá-la para um ataque corpo a corpo.',
  ], { sint: true, detalhe: 'Glaive, Espada Grande, Espada Longa, Rapieira, Cimitarra ou Espada Curta', efeitos: { attackBonus: 1 } }),

  mi('espada-do-ferimento', 'Espada do Ferimento', 'Arma', 'raro', [
    'Quando você acerta uma criatura com um ataque usando esta arma mágica, o alvo sofre 2d6 de dano Necrótico extra e deve passar em uma salvaguarda de Constituição CD 15 ou fica incapaz de recuperar Pontos de Vida por 1 hora. O alvo repete a salvaguarda no fim de cada turno dele, encerrando o efeito com um sucesso.',
  ], { sint: true, detalhe: 'Glaive, Espada Grande, Espada Longa, Rapieira, Cimitarra ou Espada Curta' }),

  mi('garra-silvestre', 'Garra Silvestre', 'Arma', 'comum', [
    'Enquanto esta arma estiver com você, você compreende a comunicação não escrita de todas as Fadas, e elas compreendem a sua.',
    'Mensagem Secreta. Com uma ação Usar Magia, você pode usar a arma para conjurar Mensagem. Depois de usada, esta propriedade só volta a funcionar no próximo amanhecer.',
  ], { sint: true, detalhe: 'Adaga, Rapieira, Cimitarra, Espada Curta, Foice Curta ou Lança' }),

  mi('talisma-do-bem-puro', 'Talismã do Bem Puro', 'Item Maravilhoso', 'lendario', [
    'Este talismã é um poderoso símbolo da bondade. Um Ínfero ou Morto-vivo que o toque sofre 8d6 de dano Radiante, e sofre o dano de novo cada vez que terminar o turno segurando ou carregando o talismã.',
    'Símbolo Sagrado. Você pode usar o talismã como Símbolo Sagrado. Você ganha +2 nas jogadas de ataque mágico enquanto o usar ou segurar.',
    'Repreensão Pura. O talismã tem 7 cargas. Enquanto o usa ou segura, você pode executar uma ação Usar Magia para gastar 1 carga e mirar uma criatura que possa ver no chão a até 36 metros de você. Uma fenda flamejante se abre sob o alvo, que realiza uma salvaguarda de Destreza CD 20 — com Desvantagem se for Ínfero ou Morto-vivo. Se falhar, o alvo cai na fenda e é destruído, sem deixar restos. Quando a última carga é gasta, o talismã vira pó.',
  ], { sint: 'por um Clérigo ou Paladino' }),

  mi('talisma-da-esfera', 'Talismã da Esfera', 'Item Maravilhoso', 'lendario', [
    'Enquanto segura ou usa este talismã, você tem Vantagem em qualquer teste de Inteligência (Arcanismo) feito para controlar uma Esfera da Aniquilação.',
    'Além disso, quando começar o turno controlando uma Esfera da Aniquilação, você pode executar uma ação Usar Magia para movê-la 3 metros mais um número adicional de metros igual a 3 vezes o seu modificador de Inteligência. Esse movimento não precisa ser em linha reta.',
  ], { sint: true }),

  mi('talisma-do-mal-supremo', 'Talismã do Mal Supremo', 'Item Maravilhoso', 'lendario', [
    'Este item simboliza o mal impenitente. Uma criatura que não seja Ínfero nem Morto-vivo e que toque o talismã sofre 8d6 de dano Necrótico, e sofre o dano de novo cada vez que terminar o turno segurando ou carregando o talismã.',
    'Símbolo Sagrado. Você pode usar o talismã como Símbolo Sagrado. Você ganha +2 nas jogadas de ataque mágico enquanto o usar ou segurar.',
    'Fim Supremo. O talismã tem 6 cargas. Enquanto o usa ou segura, você pode executar uma ação Usar Magia para gastar 1 carga e mirar uma criatura que possa ver no chão a até 36 metros de você. Uma fenda flamejante se abre sob o alvo, que realiza uma salvaguarda de Destreza CD 20 — com Desvantagem se for Celestial. Se falhar, o alvo cai na fenda e é destruído, sem deixar restos. Quando a última carga é gasta, o talismã vira pó.',
  ], { sint: true }),

  mi('boneca-falante', 'Boneca Falante', 'Item Maravilhoso', 'comum', [
    'Enquanto esta boneca estiver a até 1,5 metro de você, você pode passar um Descanso Curto ensinando-a a dizer até seis frases, nenhuma com mais de seis palavras, e definir uma condição para cada frase ser dita. Você também pode substituir frases antigas por novas.',
    'Seja qual for a condição, ela precisa ocorrer a até 1,5 metro da boneca para fazê-la falar. Por exemplo, sempre que alguém pegar a boneca, ela pode dizer: "Quero um doce". As frases da boneca se perdem quando a sua sintonização com ela termina.',
  ], { sint: true }),

  mi('caneca-da-sobriedade', 'Caneca da Sobriedade', 'Item Maravilhoso', 'comum', [
    'Esta caneca tem um rosto severo esculpido em uma das laterais. Você pode beber cerveja, vinho ou qualquer outra bebida alcoólica não mágica servida nela sem ficar embriagado.',
    'A caneca não tem efeito sobre líquidos mágicos nem sobre substâncias nocivas, como veneno.',
  ]),

  mi('bastao-de-tentaculos', 'Bastão de Tentáculos', 'Bastão', 'raro', [
    'Este bastão termina em três tentáculos emborrachados. Segurando-o, você pode executar uma ação Usar Magia para fazer os tentáculos se esticarem, cada um atacando uma criatura que você possa ver a até 4,5 metros de você.',
    'Para cada tentáculo, faça uma jogada de ataque corpo a corpo com +9. Um tentáculo causa 1d6 de dano Psíquico em um acerto. Se você acertar o mesmo alvo com os três tentáculos, ele deve passar em uma salvaguarda de Destreza CD 15 ou recebe a condição Contido até você receber a condição Incapacitado, até executar uma ação Bônus para libertá-lo, ou até ele deixar de estar a até 4,5 metros de você.',
    'Enquanto Contido assim, o alvo sofre 3d6 de dano Psíquico no início de cada turno dele. No fim de cada turno dele, o alvo repete a salvaguarda, encerrando o efeito com um sucesso.',
  ], { sint: true }),

  mi('porrete-trovejante', 'Porrete Trovejante', 'Arma', 'muito-raro', [
    'Enquanto estiver sintonizado a esta arma mágica, sua Força passa a ser 20, a menos que já seja igual ou maior.',
    'A arma causa 1d8 de dano Trovejante extra a qualquer criatura que atinge e 3d8 de dano Trovejante extra a objetos que atinge e que não estejam sendo vestidos ou carregados.',
    'Estrondo Trovejante. Com uma ação Usar Magia, você pode golpear a arma contra uma superfície dura para criar um estrondo audível a até 90 metros. Você também cria um Cone de 9 metros de energia trovejante: cada criatura no Cone deve passar em uma salvaguarda de Força CD 15 ou recebe a condição Caído. Objetos não mágicos no Cone que não estejam sendo vestidos ou carregados sofrem 3d8 de dano Trovejante.',
    'Terremoto. Com uma ação Usar Magia, você pode golpear a arma contra o chão para conjurar Terremoto (CD de salvaguarda 15) a partir dela. Depois de usada, esta propriedade só volta a funcionar no próximo amanhecer.',
  ], { sint: true, detalhe: 'Porrete Grande', efeitos: { setAbility: { for: 20 } } }),

  mi('tomo-do-pensamento-claro', 'Tomo do Pensamento Claro', 'Item Maravilhoso', 'muito-raro', [
    'Este livro traz exercícios de memória e lógica, e suas palavras estão carregadas de magia. Se você passar 48 horas ao longo de 6 dias ou menos estudando o conteúdo e praticando as orientações, sua Inteligência aumenta em 2, até o máximo de 30. O tomo então perde a magia, mas a recupera em um século.',
  ]),

  mi('tomo-da-lideranca-e-influencia', 'Tomo da Liderança e Influência', 'Item Maravilhoso', 'muito-raro', [
    'Este livro traz orientações para influenciar e encantar os outros, e suas palavras estão carregadas de magia. Se você passar 48 horas ao longo de 6 dias ou menos estudando o conteúdo e praticando as orientações, seu Carisma aumenta em 2, até o máximo de 30. O tomo então perde a magia, mas a recupera em um século.',
  ]),

  mi('tomo-da-lingua-silenciada', 'Tomo da Língua Silenciada', 'Item Maravilhoso', 'lendario', [
    'Este livro tem uma língua ressecada presa à capa. Existem cinco desses tomos, e não se sabe qual é o original. As primeiras páginas de cada um estão cobertas de rabiscos indecifráveis; as demais estão em branco.',
    'Enquanto sintonizado a este item, você pode usá-lo como Grimório e como Foco Arcano. Além disso, segurando o tomo, você pode executar uma ação Bônus para conjurar uma magia escrita nele, sem gastar espaço de magia e sem usar componentes Verbais ou Somáticos. Depois de usada, esta propriedade só volta a funcionar no próximo amanhecer.',
    'A língua presa à capa às vezes se anima e revela segredos ao portador — ou mentiras convenientes ao lich Vecna.',
  ], { sint: 'por um Mago' }),

  mi('tomo-da-compreensao', 'Tomo da Compreensão', 'Item Maravilhoso', 'muito-raro', [
    'Este livro traz exercícios de intuição e percepção, e suas palavras estão carregadas de magia. Se você passar 48 horas ao longo de 6 dias ou menos estudando o conteúdo e praticando as orientações, sua Sabedoria aumenta em 2, até o máximo de 30. O tomo então perde a magia, mas a recupera em um século.',
  ]),

  mi('tridente-do-comando-de-peixes', 'Tridente do Comando de Peixes', 'Arma', 'incomum', [
    'Esta arma mágica tem 3 cargas e recupera 1d3 cargas gastas diariamente ao amanhecer.',
    'Enquanto a carrega, você pode gastar 1 carga para conjurar Dominar Fera (CD de salvaguarda 15) a partir dela em uma Besta que tenha Deslocamento de Natação.',
  ], { sint: true, detalhe: 'Tridente' }),

  mi('solvente-universal', 'Solvente Universal', 'Item Maravilhoso', 'lendario', [
    'Este tubo contém um líquido leitoso com forte cheiro de álcool. Quando encontrado, um tubo contém 1d6 + 1 medidas (cerca de 30 ml cada).',
    'Você pode executar uma ação Utilizar para derramar 1 ou mais medidas do solvente sobre uma superfície ao seu alcance. Cada medida dissolve instantaneamente até 900 cm² de adesivo que tocar, inclusive Cola Soberana.',
  ]),

  mi('bengala-do-veterano', 'Bengala do Veterano', 'Item Maravilhoso', 'comum', [
    'Como ação Bônus, você pode transformar esta bengala em uma Espada Longa comum, ou fazer a Espada Longa voltar a ser uma bengala. Nos dois casos, você precisa estar segurando o item.',
  ]),

  mi('arma-viciosa', 'Arma Viciosa', 'Arma', 'raro', [
    'Esta arma mágica causa 2d6 pontos de dano extra a qualquer criatura que ela atinge. Esse dano extra é do mesmo tipo do dano normal da arma.',
  ], { detalhe: 'Qualquer Arma Simples ou Marcial' }),

  mi('espada-vorpal', 'Espada Vorpal', 'Arma', 'lendario', [
    'Você ganha +3 nas jogadas de ataque e de dano feitas com esta arma mágica. Além disso, a arma ignora Resistência a dano Cortante.',
    'Quando você usa esta arma para atacar uma criatura que tenha pelo menos uma cabeça e tira 20 no d20 da jogada de ataque, você corta fora uma das cabeças da criatura. A criatura morre se não conseguir sobreviver sem a cabeça perdida.',
    'Uma criatura é imune a este efeito se tiver Imunidade a dano Cortante, se não tiver nem precisar de cabeça, ou se o Mestre decidir que ela é grande demais para ter a cabeça cortada por esta arma. Nesses casos, ela sofre 30 pontos de dano Cortante extra do acerto. Se a criatura tiver Resistência Lendária, pode gastar um uso diário dessa característica para evitar perder a cabeça, sofrendo o dano extra no lugar.',
  ], { sint: true, detalhe: 'Glaive, Espada Grande, Espada Longa ou Cimitarra', efeitos: { attackBonus: 3 } }),

  mi('municao-esmagadora', 'Munição Esmagadora', 'Munição', 'comum', [
    'Uma criatura atingida por esta munição deve passar em uma salvaguarda de Força CD 10 ou recebe a condição Caído.',
  ], { detalhe: 'Qualquer Munição' }),
  mi('varinha-de-aprisionamento', 'Varinha de Aprisionamento', 'Varinha', 'raro', [
    'Esta varinha tem 7 cargas.',
    'Magias. Segurando a varinha, você pode conjurar estas magias a partir dela (CD de salvaguarda 17): Paralisar Pessoa (2 cargas) e Paralisar Monstro (5 cargas).',
    'Recuperando Cargas. A varinha recupera 1d6 + 1 cargas gastas diariamente ao amanhecer. Se você gastar a última carga, role 1d20: com 1, a varinha vira cinzas e é destruída.',
  ], { sint: true }),

  mi('varinha-de-regencia', 'Varinha de Regência', 'Varinha', 'comum', [
    'Esta varinha tem 3 cargas. Segurando-a, você pode executar uma ação Usar Magia para gastar 1 carga e criar música orquestral agitando-a no ar. A música pode ser ouvida a até 36 metros e termina quando você para de agitar a varinha.',
    'Recuperando Cargas. A varinha recupera todas as cargas gastas diariamente ao amanhecer. Se você gastar a última carga, role 1d20: com 1, uma nota triste soa e a varinha é destruída.',
  ]),

  mi('varinha-de-deteccao-de-inimigos', 'Varinha de Detecção de Inimigos', 'Varinha', 'raro', [
    'Esta varinha tem 7 cargas. Segurando-a, você pode executar uma ação Usar Magia para gastar 1 carga. Por 1 minuto, você sabe a direção da criatura Hostil mais próxima a até 18 metros de você, mas não a distância dela.',
    'A varinha detecta criaturas Hostis que estejam Invisíveis, etéreas, disfarçadas ou escondidas, além das que estão à vista. O efeito termina se você parar de segurar a varinha.',
    'Recuperando Cargas. A varinha recupera 1d6 + 1 cargas gastas diariamente ao amanhecer. Se você gastar a última carga, role 1d20: com 1, a varinha vira cinzas e é destruída.',
  ], { sint: true }),

  mi('varinha-do-medo', 'Varinha do Medo', 'Varinha', 'raro', [
    'Esta varinha tem 7 cargas.',
    'Magias. Segurando a varinha, você pode conjurar estas magias a partir dela (CD de salvaguarda 15): Comando (apenas "fuja" ou "ajoelhe-se", 1 carga) e Medo (Cone de 18 metros, 3 cargas).',
    'Recuperando Cargas. A varinha recupera 1d6 + 1 cargas gastas diariamente ao amanhecer. Se você gastar a última carga, role 1d20: com 1, a varinha vira cinzas e é destruída.',
  ], { sint: true }),

  mi('varinha-de-bolas-de-fogo', 'Varinha de Bolas de Fogo', 'Varinha', 'raro', [
    'Esta varinha tem 7 cargas. Segurando-a, você pode gastar até 3 cargas para conjurar Bola de Fogo (CD de salvaguarda 15) a partir dela. Com 1 carga, você conjura a versão de 3º círculo da magia; o círculo aumenta em 1 para cada carga adicional gasta.',
    'Recuperando Cargas. A varinha recupera 1d6 + 1 cargas gastas diariamente ao amanhecer. Se você gastar a última carga, role 1d20: com 1, a varinha vira cinzas e é destruída.',
  ], { sint: true }),

  mi('varinha-de-relampagos', 'Varinha de Relâmpagos', 'Varinha', 'raro', [
    'Esta varinha tem 7 cargas. Segurando-a, você pode gastar até 3 cargas para conjurar Relâmpago (CD de salvaguarda 15) a partir dela. Com 1 carga, você conjura a versão de 3º círculo da magia; o círculo aumenta em 1 para cada carga adicional gasta.',
    'Recuperando Cargas. A varinha recupera 1d6 + 1 cargas gastas diariamente ao amanhecer. Se você gastar a última carga, role 1d20: com 1, a varinha vira cinzas e é destruída.',
  ], { sint: true }),

  mi('varinha-de-deteccao-de-magia', 'Varinha de Detecção de Magia', 'Varinha', 'incomum', [
    'Esta varinha tem 3 cargas. Segurando-a, você pode gastar 1 carga para conjurar Detectar Magia a partir dela. A varinha recupera 1d3 cargas gastas diariamente ao amanhecer.',
  ]),

  mi('varinha-de-misseis-magicos', 'Varinha de Mísseis Mágicos', 'Varinha', 'incomum', [
    'Esta varinha tem 7 cargas. Segurando-a, você pode gastar até 3 cargas para conjurar Mísseis Mágicos a partir dela. Com 1 carga, você conjura a versão de 1º círculo da magia; o círculo aumenta em 1 para cada carga adicional gasta.',
    'Recuperando Cargas. A varinha recupera 1d6 + 1 cargas gastas diariamente ao amanhecer. Se você gastar a última carga, role 1d20: com 1, a varinha vira cinzas e é destruída.',
  ]),

  mi('varinha-de-orcus', 'Varinha de Orcus', 'Varinha', 'artefato', [
    'Criada e empunhada por Orcus, esta varinha medonha escapa das garras do príncipe demônio de tempos em tempos e reaparece magicamente onde ele sente uma oportunidade de cumprir algum objetivo sinistro. Ela é encimada por um crânio que pertenceu a um herói humano morto por Orcus.',
    'Toda Água Benta a até 3 metros da varinha é destruída. Qualquer criatura além de Orcus que tente se sintonizar a ela realiza uma salvaguarda de Constituição CD 17: se for bem-sucedida, sofre 10d6 de dano Necrótico; se falhar, morre e, se for um Humanoide, vira um Zumbi.',
    'Arma Mágica. Você pode empunhar a varinha como uma Maça mágica que concede +3 nas jogadas de ataque e de dano feitas com ela. A varinha causa 2d12 de dano Necrótico extra em um acerto.',
    'Propriedades. Enquanto sintonizado à varinha, você ganha +2 na Classe de Armadura, Imunidade a dano Necrótico e Venenoso, e pode conjurar magias de Necromancia poderosas a partir dela, gastando cargas.',
    'Convocar Mortos-Vivos. Você pode executar uma ação Usar Magia para convocar mortos-vivos que obedecem aos seus comandos por 1 hora.',
    'Propriedades Aleatórias. A varinha tem 2 propriedades benéficas menores, 1 propriedade benéfica maior, 2 propriedades prejudiciais menores e 1 propriedade prejudicial maior.',
  ], { sint: true, efeitos: { attackBonus: 3, acBonus: 2 } }),

  mi('varinha-da-paralisia', 'Varinha da Paralisia', 'Varinha', 'raro', [
    'Esta varinha tem 7 cargas. Segurando-a, você pode executar uma ação Usar Magia para gastar 1 carga e fazer um fino raio azul disparar da ponta em direção a uma criatura que possa ver a até 18 metros de você.',
    'O alvo deve passar em uma salvaguarda de Constituição CD 15 ou recebe a condição Paralisado por 1 minuto. No fim de cada turno dele, o alvo repete a salvaguarda, encerrando o efeito com um sucesso.',
    'Recuperando Cargas. A varinha recupera 1d6 + 1 cargas gastas diariamente ao amanhecer. Se você gastar a última carga, role 1d20: com 1, a varinha vira cinzas e é destruída.',
  ], { sint: true }),

  mi('varinha-de-polimorfia', 'Varinha de Polimorfia', 'Varinha', 'muito-raro', [
    'Esta varinha tem 7 cargas. Segurando-a, você pode gastar 1 carga para conjurar Polimorfia (CD de salvaguarda 15) a partir dela.',
    'Recuperando Cargas. A varinha recupera 1d6 + 1 cargas gastas diariamente ao amanhecer. Se você gastar a última carga, role 1d20: com 1, a varinha vira cinzas e é destruída.',
  ], { sint: true }),

  mi('varinha-de-pirotecnia', 'Varinha de Pirotecnia', 'Varinha', 'comum', [
    'Esta varinha tem 7 cargas. Segurando-a, você pode executar uma ação Usar Magia para gastar 1 carga e criar uma explosão inofensiva de luz multicolorida em um ponto que possa ver a até 36 metros. A explosão vem acompanhada de um estalo audível a até 90 metros. A luz é tão intensa quanto a chama de uma tocha, mas dura apenas um segundo.',
    'Recuperando Cargas. A varinha recupera 1d6 + 1 cargas gastas diariamente ao amanhecer. Se você gastar a última carga, role 1d20: com 1, a varinha explode em um espetáculo pirotécnico inofensivo e é destruída.',
  ]),

  mi('varinha-de-segredos', 'Varinha de Segredos', 'Varinha', 'incomum', [
    'Esta varinha tem 3 cargas e recupera 1d3 cargas gastas diariamente ao amanhecer.',
    'Segurando-a, você pode executar uma ação Usar Magia para gastar 1 carga: se houver uma porta secreta ou armadilha a até 18 metros de você, a varinha vibra e aponta para a mais próxima.',
  ]),

  mi('varinha-do-mago-de-guerra', 'Varinha do Mago de Guerra +1, +2 ou +3', 'Varinha', 'varia', [
    'Incomum (+1), Rara (+2) ou Muito Rara (+3).',
    'Enquanto segura esta varinha, você ganha um bônus nas jogadas de ataque mágico determinado pela raridade dela. Além disso, você ignora Meia Cobertura ao fazer uma jogada de ataque mágico.',
  ], { sint: 'por um conjurador' }),

  mi('varinha-de-teias', 'Varinha de Teias', 'Varinha', 'incomum', [
    'Esta varinha tem 7 cargas. Segurando-a, você pode gastar 1 carga para conjurar Teia (CD de salvaguarda 13) a partir dela.',
    'Recuperando Cargas. A varinha recupera 1d6 + 1 cargas gastas diariamente ao amanhecer. Se você gastar a última carga, role 1d20: com 1, a varinha vira cinzas e é destruída.',
  ], { sint: 'por um conjurador' }),

  mi('varinha-das-maravilhas', 'Varinha das Maravilhas', 'Varinha', 'raro', [
    'Esta varinha tem 7 cargas. Segurando-a, você pode executar uma ação Usar Magia para gastar 1 carga escolhendo um ponto a até 36 metros de você. Esse local se torna o ponto de origem de uma magia ou de outro efeito mágico determinado aleatoriamente.',
    'Magias conjuradas pela varinha têm CD de salvaguarda 15. Se o alcance máximo de uma magia for normalmente menor que 36 metros, ele passa a ser 36 metros quando conjurada pela varinha. Se um efeito tiver vários alvos possíveis, o Mestre determina aleatoriamente quais são afetados.',
    'Entre os efeitos possíveis estão: conjurar magias como Escuridão, Luz do Dia, Bola de Fogo, Lentidão, Sugestão, Enfeitiçar Pessoa, Levitação ou Mísseis Mágicos; fazer chover manteiga, borboletas ou 600 kg de folhas; transformar você ou o alvo em outra criatura por 1 minuto; ou fazer surgir um rinoceronte, um elefante ou um rato.',
    'Recuperando Cargas. A varinha recupera 1d6 + 1 cargas gastas diariamente ao amanhecer. Se você gastar a última carga, role 1d20: com 1, a varinha vira pó e é destruída.',
  ], { sint: true }),

  mi('onda', 'Onda (Wave)', 'Arma', 'artefato', [
    'Guardada na masmorra do Monte Pluma Branca, Onda é gravada com imagens de ondas, conchas e criaturas marinhas.',
    'Você ganha +3 nas jogadas de ataque e de dano feitas com esta arma mágica. Quando você tira 20 no d20 de uma jogada de ataque com ela, o alvo sofre 21 pontos de dano Necrótico extra.',
    'Pronto para o Combate. Você tem Vantagem em jogadas de Iniciativa.',
    'Adaptação Aquática. Uma bolha de ar se forma em volta da sua cabeça enquanto você está debaixo d\'água, permitindo que respire normalmente.',
    'Comando Aquático. Onda tem 3 cargas e recupera 1d3 cargas gastas diariamente ao amanhecer. Enquanto a carrega, você pode gastar 1 carga para conjurar Dominar Fera (CD de salvaguarda 20) a partir dela em uma Besta que tenha Deslocamento de Natação.',
    'Globo de Invulnerabilidade. Segurando Onda, você pode conjurar Globo de Invulnerabilidade a partir dela. Só volta a funcionar no próximo amanhecer.',
    'Propriedades Aleatórias. A arma tem 2 propriedades benéficas menores e 1 propriedade prejudicial menor.',
  ], { sint: true, detalhe: 'Tridente', efeitos: { attackBonus: 3 } }),

  mi('arma-magica', 'Arma +1, +2 ou +3', 'Arma', 'varia', [
    'Incomum (+1), Rara (+2) ou Muito Rara (+3).',
    'Você tem um bônus nas jogadas de ataque e de dano feitas com esta arma mágica. O bônus é determinado pela raridade da arma.',
  ], { detalhe: 'Qualquer Arma Simples ou Marcial', efeitos: { attackBonus: 1 } }),

  mi('arma-do-aviso', 'Arma do Aviso', 'Arma', 'incomum', [
    'Enquanto esta arma estiver ao seu alcance e você estiver sintonizado a ela, você e os aliados a até 9 metros de você ganham:',
    'Alarme. A arma acorda magicamente cada um que estiver dormindo naturalmente quando o combate começa. Este benefício não desperta ninguém de um sono induzido por magia.',
    'Prontidão Sobrenatural. Cada um tem Vantagem nas jogadas de Iniciativa.',
  ], { sint: true, detalhe: 'Qualquer Arma Simples ou Marcial' }),

  mi('poco-de-muitos-mundos', 'Poço de Muitos Mundos', 'Item Maravilhoso', 'lendario', [
    'Este tecido preto fino, macio como seda, é dobrado até o tamanho de um lenço. Desdobrado, vira uma folha circular de 1,8 metro de diâmetro.',
    'Você pode executar uma ação Usar Magia para desdobrar o Poço de Muitos Mundos e colocá-lo sobre uma superfície sólida, onde ele forma um portal circular de mão dupla, com 1,8 metro de diâmetro, para outro mundo ou plano de existência. Cada vez que o item abre um portal, o Mestre decide para onde ele leva.',
    'O portal permanece aberto até uma criatura a até 1,5 metro dele executar uma ação Usar Magia para fechá-lo, segurando as bordas do tecido e dobrando-o. Depois de abrir um portal, o Poço de Muitos Mundos só volta a fazê-lo depois de 1d8 horas.',
  ]),

  mi('whelm', 'Whelm', 'Arma', 'artefato', [
    'Whelm é uma arma poderosa forjada pelos anões e perdida na masmorra do Monte Pluma Branca.',
    'Você ganha +3 nas jogadas de ataque e de dano feitas com esta arma mágica.',
    'Arremessar. Whelm tem a propriedade Arremesso, com alcance normal de 18 metros e longo de 54 metros. Quando você acerta um ataque à distância com ela, o alvo sofre 1d8 de dano de Força extra — ou 4d8 se for um Constructo, um Elemental ou um Gigante. Imediatamente após acertar ou errar, a arma volta voando para a sua mão.',
    'Onda de Choque. Você pode executar uma ação Usar Magia para golpear o chão com Whelm e enviar uma onda de choque a partir do ponto de impacto. Cada criatura à sua escolha que esteja no chão a até 18 metros desse ponto deve passar em uma salvaguarda de Constituição CD 20 ou recebe a condição Atordoado por 1 minuto. Só volta a funcionar no próximo amanhecer.',
    'Sentido Sísmico. Enquanto segura Whelm, você tem Sentido Sísmico com alcance de 18 metros.',
    'Propriedades Aleatórias. A arma tem 1 propriedade benéfica menor e 1 propriedade prejudicial menor.',
    'Maldição. Whelm é amaldiçoada: enquanto sintonizado a ela, você tem medo de espaços abertos e prefere ficar sob abrigo.',
  ], { sint: 'por um anão ou por uma criatura sintonizada a um Cinturão Anão', detalhe: 'Martelo de Guerra', efeitos: { attackBonus: 3 } }),

  mi('leque-de-vento', 'Leque de Vento', 'Item Maravilhoso', 'incomum', [
    'Enquanto segura este leque, você pode conjurar Lufada de Vento (CD de salvaguarda 13) a partir dele.',
    'Cada vez que o leque é usado de novo antes do próximo amanhecer, há uma chance cumulativa de 20% de que ele não funcione; se falhar, ele se rasga em farrapos inúteis e não mágicos.',
  ]),

  mi('botas-aladas', 'Botas Aladas', 'Item Maravilhoso', 'incomum', [
    'Estas botas têm 4 cargas e recuperam 1d4 cargas gastas diariamente ao amanhecer.',
    'Enquanto as usar, você pode executar uma ação Usar Magia para gastar 1 carga, ganhando Deslocamento de Voo de 9 metros por 1 hora. Se estiver voando quando a duração acabar, você desce a 9 metros por rodada até pousar.',
  ], { sint: true }),

  mi('asas-de-voo', 'Asas de Voo', 'Item Maravilhoso', 'raro', [
    'Enquanto usar este manto, você pode executar uma ação Usar Magia para transformá-lo em um par de asas nas suas costas. As asas duram 1 hora ou até você encerrar o efeito antes com uma ação Usar Magia, e concedem Deslocamento de Voo de 18 metros.',
    'Se você estiver no ar quando as asas desaparecerem, você cai. Quando elas desaparecem, você não pode usá-las de novo por 1d12 horas.',
  ], { sint: true }),

  mi('faixas-de-poder-desarmado', 'Faixas de Poder Desarmado +1, +2 ou +3', 'Item Maravilhoso', 'varia', [
    'Incomuns (+1), Raras (+2) ou Muito Raras (+3).',
    'Enquanto usar estas faixas, você tem um bônus nas jogadas de ataque e de dano feitas com seus Ataques Desarmados. O bônus é determinado pela raridade das faixas, e esses ataques causam dano de Força ou o tipo de dano normal deles, à sua escolha.',
  ], { sint: true, efeitos: { attackBonus: 1 } }),
]

export const magicItemById = (id: string) => MAGIC_ITEMS.find((i) => i.id === id)
