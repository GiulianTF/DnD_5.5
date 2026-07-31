import type { Species } from '../types'

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
      { name: 'Linhagem Élfica', desc: 'Escolha: Drow (Globos de Luz; depois Escuridão e Fogo das Fadas, visão no escuro 36 m), Alto Elfo (truque de mago; depois Detectar Magia e Passo Nebuloso) ou Elfo da Floresta (Druidismo; depois Passo Longo e Passar sem Rastro, deslocamento 10,5 m).' },
    ],
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
      { name: 'Legado Infernal', desc: 'Escolha: Abissal (resistência a veneno; Rajada de Veneno, depois Raio do Enfraquecimento), Ctônico (resistência necrótica; Toque Gélido, depois Toque Vampírico) ou Infernal (resistência a fogo; Rajada de Fogo, depois Repreensão Infernal e Escuridão).' },
      { name: 'Presença Sobrenatural', desc: 'Você conhece o truque Taumaturgia.' },
    ],
  },
]

export const speciesById = (id: string) => SPECIES.find((s) => s.id === id)
