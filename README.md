# Fichas D&D 2024

Aplicativo web responsivo (mobile-first, PWA com funcionamento offline) para criação, evolução e
gerenciamento de fichas de **D&D 5ª Edição — Livro do Jogador 2024**, 100% em Português (PT-BR).

Funciona sem internet, guarda tudo no próprio aparelho e sincroniza opcionalmente com o Supabase.
Pronto para publicar na Vercel.

---

## Como rodar

```bash
npm install
npm run dev       # http://localhost:5173
```

Outros comandos:

| Comando | O que faz |
| --- | --- |
| `npm run build` | Verifica os tipos e gera a versão de produção em `dist/` |
| `npm run preview` | Serve o `dist/` localmente (útil para testar o modo offline) |
| `npm test` | Roda os testes de regras e de renderização |

---

## Publicar na Vercel

1. Suba o repositório para o GitHub.
2. Na Vercel, clique em **Add New → Project** e importe o repositório.
3. A Vercel detecta o Vite sozinho (build `npm run build`, saída `dist`). Basta clicar em **Deploy**.

O arquivo [vercel.json](vercel.json) já redireciona todas as rotas para `index.html`, o que a
aplicação precisa por ser uma página única.

As credenciais do Supabase são **opcionais**. Se quiser deixá-las embutidas no site, cadastre em
**Settings → Environment Variables**:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

Sem essas variáveis o app continua funcionando: cada jogador informa as credenciais na aba **Nuvem**,
ou simplesmente usa tudo offline.

---

## Configurar o Supabase (opcional)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Abra o **SQL Editor** e rode o conteúdo de [supabase/schema.sql](supabase/schema.sql).
3. Em **Settings → API**, copie a **Project URL** e a chave **anon**.
4. No app, vá em **Nuvem**, cole as duas e toque em **Sincronizar agora**.

A sincronização é bidirecional. Quando a mesma ficha existe no aparelho e na nuvem, vence a versão
editada mais recentemente (comparação por data de atualização).

O schema vem com segurança em nível de linha ligada, no modo autenticado: cada usuário só enxerga as
próprias fichas. Se o grupo prefere uma mesa compartilhada sem login, o arquivo traz uma política
alternativa comentada — leia o aviso antes de usá-la, porque ela libera leitura e escrita para
qualquer pessoa que tenha a chave anon.

---

## Uso offline

O app é um PWA e funciona sem conexão desde o primeiro carregamento:

- **Fichas no aparelho.** Tudo é gravado em `localStorage` — criar, editar, subir de nível, rolar
  dados e descansar funcionam sem internet.
- **Service Worker.** Os arquivos do site ficam em cache, então ele abre offline e se atualiza
  sozinho quando você volta a ter conexão.
- **Instalação.** Na aba **Nuvem** há um botão para instalar o app. No iPhone, use
  *Compartilhar → Adicionar à Tela de Início*.
- **Backup manual.** Exporte e importe todas as fichas em um arquivo JSON, sem depender de nuvem.

---

## O que o app faz

**Criação assistida (nível 1)** — assistente de 8 passos com as 10 espécies, 16 antecedentes (cada um
já concede o talento de origem e a distribuição de +2/+1 ou +1/+1/+1) e as 12 classes de 2024.
Atributos por Array Padrão, Compra de Pontos ou inserção manual — este último com um botão de rolar
4d6 descartando o menor, para quem rola na mesa com o Mestre.

**Evolução do nível 1 ao 20** — o botão **⬆ Nível** mostra as habilidades destravadas segundo a
tabela da classe, abre a escolha de subclasse (nível 3), conduz o Incremento de Atributo ou Talento
(níveis 4, 8, 12, 16 e 19), avisa os novos espaços de magia e abre a seleção de truques e magias
aprendidas. Os Pontos de Vida podem usar a média fixa ou a rolagem do dado.

**Equipamentos com cálculo automático** — catálogo do PHB 2024 com armas simples e marciais
(incluindo a propriedade de Maestria), armaduras leves, médias e pesadas, escudos e equipamento
geral. Equipar uma armadura ou escudo recalcula a Classe de Armadura respeitando o limite de
Destreza da categoria; equipar uma arma cria a entrada na aba **Ações** com o bônus de ataque
(atributo + proficiência + bônus mágico) e a rolagem de dano com o tipo correto.

**Itens mágicos com bônus dinâmicos** — armas e armaduras podem receber +1, +2 ou +3, que entram
automaticamente no ataque, no dano e na CA. O catálogo traz Anel de Proteção, Braçadeiras de Defesa
(que só valem sem armadura), Manto de Proteção, Pedra da Boa Sorte e itens que substituem atributos,
como o Amuleto da Saúde (CON 19) e os Cinturões de Força do Gigante — estes recalculam o modificador,
as salvaguardas e os Pontos de Vida máximos. A sintonização é controlada com o limite de 3 itens.

**Magias e espaços** — catálogo em PT-BR do truque ao 9º nível, com escola, tempo de conjuração,
alcance, componentes, duração, concentração e ritual. Rastreador visual de espaços por nível, com
espaços de Pacto separados para o Bruxo.

**Recursos limitados e descansos** — Fúria, Retomar o Fôlego, Surto de Ação, Inspiração de Bardo,
Canalizar Divindade, Forma Selvagem, Pontos de Foco e outros aparecem com contador de usos e marca de
esgotado. O **Descanso Curto** recarrega o que recupera nele e permite gastar Dados de Vida para
curar; o **Descanso Longo** restaura todos os Pontos de Vida, metade dos Dados de Vida, todos os
espaços de magia e todas as habilidades.

**Rolador de dados** — botão flutuante com d4 a d100, quantidade, modificador, vantagem e
desvantagem, com destaque de acerto crítico e falha crítica e histórico das rolagens. Na aba de
Ações, cada arma tem os botões **Atacar** e **Dano**; quando o ataque sai 20 natural, o botão de dano
passa a rolar o crítico com os dados dobrados.

---

## Como o projeto está organizado

```
src/
  data/        Conteúdo do PHB 2024 em PT-BR (espécies, antecedentes, classes, magias, itens, talentos)
  engine/      Regras puras: CA, PV, ataques, espaços de magia, recursos, evolução, dados
  store/       Estado global com persistência em localStorage e sincronização Supabase
  screens/     Telas: lista, criação, ficha (abas), evolução, nuvem
  components/  Peças de interface reutilizáveis e o rolador de dados
supabase/      schema.sql para criar a tabela e as políticas de acesso
scripts/       Executor dos testes
```

A pasta `engine/` não depende de React: são funções puras sobre a ficha, o que deixa as regras
testáveis fora do navegador e fáceis de conferir contra o livro.

### Testes

`npm test` roda duas suítes sem precisar de navegador:

- **Regras** — confere cálculos contra casos conhecidos (CA com armadura média limitando Destreza,
  bônus de arma mágica no ataque e no dano, Amuleto da Saúde alterando os PV máximos, Braçadeiras de
  Defesa sendo ignoradas com armadura, tabelas de espaços de magia, contadores de recursos e o que o
  assistente de evolução oferece em cada nível), além da integridade dos dados das 12 classes.
- **Renderização** — monta cada tela do aplicativo, incluindo as quatro abas da ficha e o assistente
  de evolução, para as 12 classes do nível 1 ao 20.

---

## Observações sobre o conteúdo

O texto das regras foi resumido e traduzido para orientar o jogo na mesa; ele não substitui o Livro
do Jogador. Alguns pontos são simplificações deliberadas, para manter o app utilizável:

- Multiclasse não é suportada — cada ficha tem uma classe.
- As características de subclasse aparecem resumidas, com o efeito principal.
- Itens mágicos com efeitos condicionais complexos são descritos em texto; o app calcula
  automaticamente apenas os bônus numéricos (ataque, dano, CA, salvaguardas e substituição de
  atributo).
