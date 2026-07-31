import type { Feat } from '../types'

export const FEATS: Feat[] = [
  // ---------- Talentos de Origem (PHB 2024) ----------
  { id: 'alerta', name: 'Alerta', category: 'origem', desc: 'Adicione seu bônus de proficiência à Iniciativa. Após rolar Iniciativa, você pode trocar seu resultado com o de um aliado disposto.' },
  { id: 'artesao-talento', name: 'Artífice', category: 'origem', desc: 'Proficiência com três ferramentas de artesão. Desconto de 20% ao comprar itens não mágicos. Ao terminar um descanso longo, pode fabricar um item simples da lista do talento.' },
  { id: 'curandeiro', name: 'Curandeiro', category: 'origem', desc: 'Com um kit de curandeiro, use uma ação para permitir que uma criatura gaste um Dado de Vida e role-o + seu bônus de proficiência em cura. Pode rerrolar 1s em dados de cura.' },
  { id: 'sortudo-talento', name: 'Sortudo', category: 'origem', desc: 'Você tem pontos de sorte = bônus de proficiência (recupera em descanso longo). Gaste 1 para ter Vantagem num Teste D20 seu ou impor Desvantagem a um ataque contra você.' },
  { id: 'iniciado-em-magia', name: 'Iniciado em Magia', category: 'origem', desc: 'Escolha a lista de Clérigo, Druida ou Mago: aprenda 2 truques e uma magia de 1º nível dessa lista (conjurável 1×/descanso longo sem gastar espaço, ou usando espaços).', repeatable: true },
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
  { id: 'perito-em-escudos', name: 'Mestre em Escudos', category: 'geral', desc: '+1 FOR. Após acertar ataque corpo a corpo, use Bônus para empurrar ou derrubar com o escudo; adicione a CA do escudo em salvaguardas de DES contra efeitos que atingem só você.', abilityIncrease: ['for'] },
  { id: 'resiliente', name: 'Resiliente', category: 'geral', desc: '+1 em uma habilidade em que você não tenha proficiência em salvaguardas; ganhe proficiência nas salvaguardas dessa habilidade.', abilityIncrease: ['for', 'des', 'con', 'int', 'sab', 'car'] },
  { id: 'observador', name: 'Observador', category: 'geral', desc: '+1 INT ou SAB. Proficiência (ou Perícia Aprimorada) em Intuição, Investigação ou Percepção.', abilityIncrease: ['int', 'sab'] },
  { id: 'sentinela', name: 'Sentinela', category: 'geral', desc: '+1 FOR ou DES. Reação: ataque contra quem atacar outro alvo ou usar Desengajar; seu ataque de oportunidade reduz o deslocamento do alvo a 0.', abilityIncrease: ['for', 'des'] },
  { id: 'conjurador-de-guerra', name: 'Conjurador de Guerra', category: 'geral', desc: '+1 INT, SAB ou CAR. Vantagem em salvaguardas de concentração; conjure truques como ataques de oportunidade; componentes somáticos mesmo com as mãos ocupadas.', abilityIncrease: ['int', 'sab', 'car'] },
  { id: 'aparador-duplo', name: 'Lutador com Duas Armas', category: 'geral', desc: '+1 FOR ou DES. Some o modificador de habilidade ao dano do ataque extra ao lutar com duas armas; saque duas armas de uma vez.', abilityIncrease: ['for', 'des'] },
  { id: 'adepto-elemental', name: 'Adepto Elemental', category: 'geral', desc: '+1 INT, SAB ou CAR. Escolha um tipo de dano (ácido, elétrico, fogo, frio ou trovão): suas magias ignoram resistência a ele e tratam 1s nos dados de dano como 2s.', abilityIncrease: ['int', 'sab', 'car'], repeatable: true },
  { id: 'tocado-pela-sombra', name: 'Tocado pela Sombra', category: 'geral', desc: '+1 INT, SAB ou CAR. Aprenda Invisibilidade e uma magia de 1º nível de Ilusão ou Necromancia; conjure cada uma 1×/descanso longo sem gastar espaço.', abilityIncrease: ['int', 'sab', 'car'] },
  { id: 'tocado-pelo-feerico', name: 'Tocado pelo Feérico', category: 'geral', desc: '+1 INT, SAB ou CAR. Aprenda Passo Nebuloso e uma magia de 1º nível de Adivinhação ou Encantamento; conjure cada uma 1×/descanso longo sem gastar espaço.', abilityIncrease: ['int', 'sab', 'car'] },
]

export const featById = (id: string) => FEATS.find((f) => f.id === id)
export const ORIGIN_FEATS = FEATS.filter((f) => f.category === 'origem')
export const GENERAL_FEATS = FEATS.filter((f) => f.category === 'geral')
