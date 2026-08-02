import { useState, type ReactNode } from 'react'
import type { AbilityKey, Character, InnateSpell, Spell } from '../../types'
import { ABILITY_NAMES } from '../../types'
import { spellById } from '../../data/spells'
import { classById } from '../../data/classes'
import {
  PREPARATION_RULES, alwaysPreparedSpells, availableCantrips, cantripLimit, casterClasses,
  classLabel, classSpellCatalog, fmtMod, innateFreeUses, innateSpellResourceId, innateSpells,
  innateUsesLabel, knownCantripIds, pactSlots, preparableSpells, preparationMode, preparedLimit,
  preparedSpellIds, spellListClasses, spellSlots, spellcasting,
} from '../../engine/rules'
import { circulosDisponiveis, dadosDaMagia } from '../../engine/uso'
import { rollExpression } from '../../engine/dice'
import { useStore } from '../../store/store'
import { Card, Empty, Sheet, SpellText } from '../../components/ui'
import { ConfirmarUso, type OpcaoDeCusto } from '../../components/ConfirmarUso'

const ORDINAIS = ['Truques', '1º Nível', '2º Nível', '3º Nível', '4º Nível', '5º Nível', '6º Nível', '7º Nível', '8º Nível', '9º Nível']

const resumoMagia = (s: Spell) =>
  `${s.school} · ${s.castingTime} · ${s.range}${s.concentration ? ' · Concentração' : ''}${s.ritual ? ' · Ritual' : ''}`

/**
 * Uma linha da lista única de magias. Independentemente de a magia vir da
 * classe, da subclasse, da espécie ou de um talento, ela é exibida no mesmo
 * formato e agrupada pelo círculo — o jogador não precisa caçar em que cartão
 * cada magia foi parar.
 */
interface LinhaMagia {
  spell: Spell
  /**
   * `classe` ocupa vaga no limite de preparadas; `sempre` está sempre pronta e
   * gasta espaço normalmente; `inata` está sempre pronta e tem conjurações
   * gratuitas (Iniciado em Magia, Tocado pelo Feérico, linhagens de espécie).
   */
  origem: 'classe' | 'sempre' | 'inata'
  /** característica que concedeu a magia ("Domínio da Vida", "Iniciado em Magia") */
  source?: string
  freeUses?: InnateSpell['freeUses']
  /** conjuração própria da magia inata, que pode diferir da CD da classe */
  ability?: AbilityKey
  saveDC?: number
  attackBonus?: number
  nota?: string
}

const ordenar = (a: LinhaMagia, b: LinhaMagia) => a.spell.name.localeCompare(b.spell.name)

/**
 * Cabeçalho de círculo que abre e fecha. Cada círculo guarda o próprio estado:
 * abrir o 3º não fecha o 1º, então dá para deixar vários abertos ao mesmo tempo
 * e recolher só os que estão atrapalhando a leitura.
 */
function SecaoCirculo({ titulo, quantas, aberta, onAlternar, children }: {
  titulo: string
  quantas: number
  aberta: boolean
  onAlternar: () => void
  children: ReactNode
}) {
  return (
    <div>
      <button className="spell-lvl-toggle" onClick={onAlternar} aria-expanded={aberta}>
        <span className="seta" aria-hidden="true">{aberta ? '▾' : '▸'}</span>
        <span className="spell-lvl">{titulo}</span>
        <span className="tiny muted">{quantas}</span>
      </button>
      {aberta && children}
    </div>
  )
}

export function SpellsTab({ char }: { char: Character }) {
  const { updateCharacter, spendSlot, spendPactSlot, useResource, pushRoll } = useStore()
  const [detail, setDetail] = useState<string | null>(null)
  /** folha aberta: preparação de magias, escolha de truques ou grimório */
  const [folha, setFolha] = useState<'preparar' | 'truques' | 'grimorio' | null>(null)
  /** id da magia que está sendo substituída numa troca */
  const [trocando, setTrocando] = useState<string | null>(null)
  /** magia esperando a confirmação de conjuração */
  const [conjurando, setConjurando] = useState<LinhaMagia | null>(null)
  /** círculos recolhidos pelo jogador — os demais ficam abertos */
  const [recolhidos, setRecolhidos] = useState<Set<number>>(new Set())

  const alternarCirculo = (lvl: number) =>
    setRecolhidos((s) => {
      const nova = new Set(s)
      if (nova.has(lvl)) nova.delete(lvl)
      else nova.add(lvl)
      return nova
    })

  const cls = classById(char.classId)
  const sc = spellcasting(char)
  const slots = spellSlots(char)
  const pact = pactSlots(char)
  const modo = preparationMode(char)
  /** Numa ficha multiclasse cada classe conjura com a habilidade e a CD dela. */
  const conjuradoras = casterClasses(char)

  // Truques e magias concedidos pela espécie, linhagem e talentos valem para qualquer classe.
  const inatas = innateSpells(char)
  const automaticas = alwaysPreparedSpells(char)

  /*
   * Linhas das magias que já vêm prontas, de qualquer fonte fora da lista da
   * classe. A mesma magia pode vir por dois caminhos — o Domínio da Vida deixa
   * Bênção sempre preparada e o Iniciado em Magia ainda dá uma conjuração
   * gratuita dela. Nesse caso ela vira uma linha só, pela fonte inata (a que
   * dispensa o espaço de magia), com as duas origens no rótulo.
   */
  const linhasConcedidas: LinhaMagia[] = [
    ...inatas.map((m): LinhaMagia => ({
      spell: m.spell, origem: 'inata', source: m.source, freeUses: m.freeUses,
      ability: m.ability, saveDC: m.saveDC, attackBonus: m.attackBonus, nota: m.nota,
    })),
    ...automaticas.map((m): LinhaMagia => ({ spell: m.spell, origem: 'sempre', source: m.source })),
  ].reduce<LinhaMagia[]>((acc, l) => {
    const anterior = acc.find((x) => x.spell.id === l.spell.id)
    if (!anterior) acc.push(l)
    else if (l.source && !anterior.source?.includes(l.source)) anterior.source += ` · ${l.source}`
    return acc
  }, [])
  const truquesConcedidos = linhasConcedidas.filter((l) => l.spell.level === 0).sort(ordenar)

  /** Marca ou desmarca uma conjuração gratuita de magia inata. */
  const gastarUsoInato = (spellId: string, delta: number) =>
    useResource(char.id, innateSpellResourceId(spellId), delta)

  const usosGastos = (spellId: string) => char.resourcesUsed[innateSpellResourceId(spellId)] ?? 0

  /**
   * Como esta magia pode ser paga. A ordem importa: o uso gratuito vem primeiro
   * porque é o mais barato, depois o Espaço de Pacto e por fim os círculos
   * normais, do menor para o maior — conjurar num espaço maior é permitido, mas
   * só faz sentido quando o jogador escolhe.
   */
  const custosDaMagia = (l: LinhaMagia): OpcaoDeCusto[] => {
    if (l.spell.level === 0) return []
    const out: OpcaoDeCusto[] = []

    const gratis = l.origem === 'inata' ? innateFreeUses(char, l.freeUses) : 0
    if (gratis > 0) {
      const restam = gratis - Math.min(gratis, usosGastos(l.spell.id))
      if (restam > 0) out.push({ id: 'inata', label: 'Uso gratuito', restantes: restam })
    }
    if (pact && l.spell.level <= pact.level && pact.count - char.pactSlotsSpent > 0) {
      out.push({
        id: 'pacto',
        label: `Espaço de Pacto (${pact.level}º)`,
        restantes: pact.count - char.pactSlotsSpent,
      })
    }
    for (const lvl of circulosDisponiveis(l.spell.level, slots, char.slotsSpent)) {
      out.push({ id: `slot-${lvl}`, label: `${lvl}º nível`, restantes: (slots[lvl - 1] ?? 0) - (char.slotsSpent[lvl] ?? 0) })
    }
    return out
  }

  /** Marca o gasto da conjuração e, se pedirem, rola o dado que o texto indica. */
  const conjurar = (l: LinhaMagia, rolar: boolean, custoId?: string) => {
    if (custoId === 'inata') gastarUsoInato(l.spell.id, 1)
    else if (custoId === 'pacto') spendPactSlot(char.id, 1)
    else if (custoId?.startsWith('slot-')) spendSlot(char.id, Number(custoId.slice(5)), 1)

    const dados = dadosDaMagia(l.spell)
    if (rolar && dados) pushRoll(rollExpression(l.spell.name, dados))
    setConjurando(null)
  }

  /** Uma linha da lista, no formato único usado por todas as origens. */
  const renderLinha = (l: LinhaMagia, acao?: ReactNode) => {
    const usosGratis = l.origem === 'inata' ? innateFreeUses(char, l.freeUses) : 0
    const gastos = usosGratis > 0 ? Math.min(usosGratis, usosGastos(l.spell.id)) : 0
    const rotuloUsos = l.origem === 'inata' ? innateUsesLabel(char, l.freeUses) : ''
    return (
      <div className="list-item eq" key={l.spell.id}>
        <div className="spread">
          <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setDetail(l.spell.id)}>
            <strong style={{ fontSize: '.92rem' }}>{l.spell.name}</strong>
            {l.origem !== 'classe' && (
              <span className="tiny gold" style={{ marginLeft: 6 }}>
                {l.origem === 'inata' ? '◈ sem espaço' : '◆ sempre preparada'}
              </span>
            )}
            <div className="tiny muted">{resumoMagia(l.spell)}</div>
            {l.source && (
              <div className="tiny gold">{l.source}{rotuloUsos && ` · ${rotuloUsos}`}</div>
            )}
            {l.origem === 'inata' && l.saveDC !== undefined && l.ability && (
              <div className="tiny muted">
                {ABILITY_NAMES[l.ability]} · CD {l.saveDC} · ataque {fmtMod(l.attackBonus ?? 0)}
              </div>
            )}
            {l.nota && <div className="tiny muted">{l.nota}</div>}
          </div>
          <div className="row" style={{ gap: 6, alignItems: 'flex-start' }}>
            <button className="sm primary" onClick={() => setConjurando(l)}>✨ Conjurar</button>
            {acao}
          </div>
        </div>
        {usosGratis > 0 && (
          <div className="spread" style={{ marginTop: 6 }}>
            <div className="slots">
              {Array.from({ length: usosGratis }, (_, i) => (
                <button
                  key={i}
                  className={`slot${i < gastos ? ' spent' : ''}`}
                  onClick={() => gastarUsoInato(l.spell.id, i < gastos ? -1 : 1)}
                  aria-label={`Uso gratuito ${i + 1} de ${l.spell.name}`}
                />
              ))}
            </div>
            <span className="tiny muted">{usosGratis - gastos}/{usosGratis} conjurações grátis</span>
          </div>
        )}
      </div>
    )
  }

  /** Cartão de truques: os da classe e os concedidos, na mesma lista. */
  const cardTruques = (limite: number, daClasse: Spell[]) => (
    <Card
      title={limite > 0 ? `Truques (${daClasse.length}/${limite})` : 'Truques'}
      action={limite > 0 ? <button className="sm primary" onClick={() => setFolha('truques')}>Escolher</button> : undefined}
    >
      {daClasse.length === 0 && truquesConcedidos.length === 0 && (
        <p className="muted tiny">Você ainda não escolheu nenhum truque.</p>
      )}
      {[...daClasse].sort((a, b) => a.name.localeCompare(b.name))
        .map((s) => renderLinha({ spell: s, origem: 'classe' }))}
      {truquesConcedidos.map((l) => renderLinha(l))}
      <div className="tiny muted" style={{ marginTop: 8 }}>
        Truques não gastam espaço de magia.
        {limite > 0 && ' Ao subir de nível você pode trocar um truque por outro.'}
        {truquesConcedidos.length > 0 && (limite > 0
          ? ' Os truques marcados vêm de traços e talentos e não contam no limite.'
          : ' Todos vêm de traços e talentos.')}
      </div>
    </Card>
  )

  // Quem não conjura pela classe ainda pode ter magias de espécie ou de subclasse.
  if (!sc || !cls || !modo) {
    if (linhasConcedidas.length === 0) {
      return (
        <Empty
          icon="✨"
          title={`${classLabel(char)} não conjura magias`}
          hint="Subclasses como Cavaleiro Místico e Trapaceiro Arcano ganham conjuração no 3º nível."
        />
      )
    }
    const comCirculo = linhasConcedidas.filter((l) => l.spell.level > 0)
    return (
      <div>
        <div className="banner">
          {cls?.name ?? 'Sua classe'} não conjura magias de classe, mas as magias abaixo vêm
          dos seus traços e características.
        </div>
        {truquesConcedidos.length > 0 && cardTruques(0, [])}
        {comCirculo.length > 0 && (
          <Card title={`Magias (${comCirculo.length})`}>
            {ORDINAIS.map((titulo, lvl) => {
              if (lvl === 0) return null
              const lista = comCirculo.filter((l) => l.spell.level === lvl).sort(ordenar)
              if (lista.length === 0) return null
              return (
                <SecaoCirculo
                  key={lvl} titulo={titulo} quantas={lista.length}
                  aberta={!recolhidos.has(lvl)} onAlternar={() => alternarCirculo(lvl)}
                >
                  {lista.map((l) => renderLinha(l))}
                </SecaoCirculo>
              )
            })}
          </Card>
        )}
        {detail && <DetalheMagia id={detail} onClose={() => setDetail(null)} />}
        {conjurando && (
          <ConfirmarUso
            titulo={conjurando.spell.name}
            subtitulo={resumoMagia(conjurando.spell)}
            dados={dadosDaMagia(conjurando.spell)}
            custos={custosDaMagia(conjurando)}
            aviso={conjurando.spell.level > 0 && custosDaMagia(conjurando).length === 0
              ? 'Você não tem espaços de magia nem usos gratuitos para esta magia.'
              : undefined}
            onUsar={(rolar, custoId) => conjurar(conjurando, rolar, custoId)}
            onFechar={() => setConjurando(null)}
          />
        )}
      </div>
    )
  }

  const regra = PREPARATION_RULES[modo]
  const trocasDisponiveis = char.spellSwaps ?? 0

  const limitePreparadas = preparedLimit(char) ?? 0
  const preparadasIds = preparedSpellIds(char)
  const preparadas = preparadasIds.map((id) => spellById(id)).filter((s): s is Spell => !!s)
  const vagasLivres = limitePreparadas - preparadas.length
  /*
   * Clérigo, Druida e Mago editam a lista à vontade. Nas demais classes a troca
   * custa um uso — exceto quando a lista está acima do limite (fichas antigas ou
   * uma perda de nível), quando tirar magias sobrando é sempre permitido.
   */
  const excedente = preparadas.length > limitePreparadas
  const trocaLivre = modo === 'descanso-todas' || modo === 'grimorio' || excedente

  const limiteTruques = cantripLimit(char)
  const truquesIds = knownCantripIds(char)
  const truques = truquesIds.map((id) => spellById(id)).filter((s): s is Spell => !!s)

  // O que a subclasse já mantém preparado sai das listas de escolha — não faz
  // sentido gastar uma vaga com uma magia que você já tem de graça.
  const jaAutomatica = new Set(automaticas.map((m) => m.spell.id))
  const candidatas = preparableSpells(char).filter((s) => !jaAutomatica.has(s.id))
  const catalogo = classSpellCatalog(char).filter((s) => !jaAutomatica.has(s.id))
  const truquesCandidatos = availableCantrips(char).filter((s) => !jaAutomatica.has(s.id))
  const grimorio = char.spellsKnown
    .map((id) => spellById(id))
    .filter((s): s is Spell => !!s && s.level > 0)

  /*
   * A lista única: magias preparadas pela classe e magias já concedidas, todas
   * juntas e separadas apenas pelo círculo. Uma magia concedida que também
   * esteja preparada aparece uma vez só, pela fonte que a torna gratuita.
   */
  const idsConcedidos = new Set(linhasConcedidas.map((l) => l.spell.id))
  const todasAsMagias: LinhaMagia[] = [
    ...preparadas.filter((s) => !idsConcedidos.has(s.id)).map((s): LinhaMagia => ({ spell: s, origem: 'classe' })),
    ...linhasConcedidas.filter((l) => l.spell.level > 0),
  ]
  /** Círculos que têm alguma magia — a base do "fechar tudo". */
  const circulosComMagia = [...new Set(todasAsMagias.map((l) => l.spell.level))]

  // ---------- Ações ----------
  /** Prepara uma magia numa vaga livre. */
  const preparar = (id: string) =>
    updateCharacter(char.id, (c) => ({
      spellsPrepared: c.spellsPrepared.includes(id) ? c.spellsPrepared : [...c.spellsPrepared, id],
      spellsKnown: c.spellsKnown.includes(id) ? c.spellsKnown : [...c.spellsKnown, id],
    }))

  /** Tira uma magia da lista. No grimório ela continua registrada no livro. */
  const despreparar = (id: string) =>
    updateCharacter(char.id, (c) => ({
      spellsPrepared: c.spellsPrepared.filter((x) => x !== id),
      spellsKnown: modo === 'grimorio' ? c.spellsKnown : c.spellsKnown.filter((x) => x !== id),
    }))

  /** Substitui `de` por `para`, gastando uma troca. */
  const trocar = (de: string, para: string) => {
    updateCharacter(char.id, (c) => ({
      spellsPrepared: [...c.spellsPrepared.filter((x) => x !== de), para],
      spellsKnown: modo === 'grimorio'
        ? (c.spellsKnown.includes(para) ? c.spellsKnown : [...c.spellsKnown, para])
        : [...c.spellsKnown.filter((x) => x !== de), para],
      spellSwaps: Math.max(0, (c.spellSwaps ?? 0) - 1),
    }))
    setTrocando(null)
  }

  const toggleTruque = (id: string) =>
    updateCharacter(char.id, (c) => ({
      spellsKnown: c.spellsKnown.includes(id) ? c.spellsKnown.filter((x) => x !== id) : [...c.spellsKnown, id],
      spellsPrepared: c.spellsPrepared.filter((x) => x !== id),
    }))

  const toggleGrimorio = (id: string) =>
    updateCharacter(char.id, (c) => ({
      spellsKnown: c.spellsKnown.includes(id) ? c.spellsKnown.filter((x) => x !== id) : [...c.spellsKnown, id],
      spellsPrepared: c.spellsPrepared.filter((x) => x !== id),
    }))

  const listasLabel = spellListClasses(char).map((c) => classById(c)?.name ?? c).join(', ')

  return (
    <div>
      <Card title="Conjuração">
        <div className="grid g3">
          <div className="ability">
            <div className="name">Habilidade</div>
            <div className="mod" style={{ fontSize: '1rem', paddingTop: 8 }}>{ABILITY_NAMES[sc.ability].slice(0, 3)}</div>
            <div className="score">{fmtMod(sc.mod)}</div>
          </div>
          <div className="ability">
            <div className="name">CD de Magia</div>
            <div className="mod">{sc.saveDC}</div>
            <div className="score">salvaguarda</div>
          </div>
          <div className="ability">
            <div className="name">Ataque</div>
            <div className="mod">{fmtMod(sc.attackBonus)}</div>
            <div className="score">mágico</div>
          </div>
        </div>
        {conjuradoras.length > 1 && (
          <div className="tiny muted" style={{ marginTop: 10 }}>
            Você conjura por mais de uma classe — cada uma tem a própria habilidade e a própria CD:
            {conjuradoras.map((c) => (
              <div key={c.classId}>
                <strong className="gold">{c.className} {c.level}</strong>{' '}
                — {ABILITY_NAMES[c.ability]} · CD {c.saveDC} · ataque {fmtMod(c.attackBonus)}
              </div>
            ))}
            Os espaços de magia abaixo são compartilhados, conforme a regra de multiclasse do PHB 2024.
          </div>
        )}
        <div className="tiny muted" style={{ marginTop: 10 }}>
          Lista de magias: <strong className="gold">{listasLabel}</strong>
          {sc.caster === 'terco' && ' · conjuração concedida pela subclasse'}
        </div>
      </Card>

      {/* --- Espaços de magia --- */}
      {pact ? (
        <Card title={`Espaços de Pacto (${pact.level}º nível)`}>
          <div className="spread">
            <div className="slots">
              {Array.from({ length: pact.count }, (_, i) => (
                <button
                  key={i}
                  className={`slot${i < char.pactSlotsSpent ? ' spent' : ''}`}
                  onClick={() => spendPactSlot(char.id, i < char.pactSlotsSpent ? -1 : 1)}
                  aria-label={`Espaço de pacto ${i + 1}`}
                />
              ))}
            </div>
            <span className="tiny muted">{pact.count - char.pactSlotsSpent}/{pact.count} disponíveis</span>
          </div>
          <div className="tiny muted" style={{ marginTop: 8 }}>
            Espaços de Pacto recarregam em <strong>descanso curto</strong>.
          </div>
        </Card>
      ) : (
        slots.some((n) => n > 0) && (
          <Card title="Espaços de Magia">
            {slots.map((total, i) => {
              if (total === 0) return null
              const lvl = i + 1
              const gastos = char.slotsSpent[lvl] ?? 0
              return (
                <div className="spread" key={lvl} style={{ marginBottom: 10 }}>
                  <span style={{ width: 70, fontSize: '.85rem' }}>{lvl}º nível</span>
                  <div className="slots" style={{ flex: 1 }}>
                    {Array.from({ length: total }, (_, j) => (
                      <button
                        key={j}
                        className={`slot${j < gastos ? ' spent' : ''}`}
                        onClick={() => spendSlot(char.id, lvl, j < gastos ? -1 : 1)}
                        aria-label={`Espaço de ${lvl}º nível`}
                      />
                    ))}
                  </div>
                  <span className="tiny muted">{total - gastos}/{total}</span>
                </div>
              )
            })}
            <div className="tiny muted" style={{ marginTop: 4 }}>
              Toque num círculo para gastar; toque num gasto para recuperar. O descanso longo restaura todos.
            </div>
          </Card>
        )
      )}

      {/* --- Truques --- */}
      {(limiteTruques > 0 || truquesConcedidos.length > 0) && cardTruques(limiteTruques, truques)}

      {/* --- Lista única de magias, separada por círculo --- */}
      <Card
        title={`Magias (${todasAsMagias.length})`}
        action={
          <div className="row" style={{ gap: 6 }}>
            <button className="sm ghost" onClick={() => setRecolhidos((s) => (
              s.size > 0 ? new Set() : new Set(circulosComMagia)
            ))}>
              {recolhidos.size > 0 ? '▾ Abrir tudo' : '▸ Fechar tudo'}
            </button>
            <button className="sm primary" onClick={() => setFolha('preparar')}>Preparar</button>
          </div>
        }
      >
        <div className="tiny muted" style={{ marginBottom: 10 }}>
          Preparadas pela classe: <strong className={excedente ? '' : 'gold'}>{preparadas.length}/{limitePreparadas}</strong>
          <div style={{ marginTop: 4 }}>
            <strong className="gold">{regra.quando}:</strong> {regra.quantas.toLowerCase()}. {regra.texto}
          </div>
          {!trocaLivre && (
            <div style={{ marginTop: 4 }}>
              Trocas disponíveis agora: <strong className={trocasDisponiveis > 0 ? 'gold' : ''}>{trocasDisponiveis}</strong>
              {modo === 'descanso-uma' ? ' (recarrega no descanso longo)' : ' (concedida a cada nível)'}
            </div>
          )}
          {todasAsMagias.some((l) => l.origem === 'sempre') && (
            <div style={{ marginTop: 4 }}>
              <strong className="gold">◆ sempre preparada</strong> vem de uma característica, gasta espaço
              de magia normalmente e não conta no limite acima.
            </div>
          )}
          {todasAsMagias.some((l) => l.origem === 'inata') && (
            <div style={{ marginTop: 4 }}>
              <strong className="gold">◈ sem espaço</strong> está sempre pronta e é conjurada de graça no
              número de usos indicado — ou gastando um espaço de magia, se você tiver.
            </div>
          )}
        </div>

        {todasAsMagias.length === 0 && (
          <p className="muted tiny">Nenhuma magia preparada — use o botão <strong>Preparar</strong>.</p>
        )}

        {ORDINAIS.map((titulo, lvl) => {
          if (lvl === 0) return null
          const lista = todasAsMagias.filter((l) => l.spell.level === lvl).sort(ordenar)
          if (lista.length === 0) return null
          const disponiveis = (slots[lvl - 1] ?? 0) - (char.slotsSpent[lvl] ?? 0)
          return (
            <SecaoCirculo
              key={lvl}
              titulo={titulo}
              quantas={lista.length}
              aberta={!recolhidos.has(lvl)}
              onAlternar={() => alternarCirculo(lvl)}
            >
              {(slots[lvl - 1] ?? 0) > 0 && (
                <div className="tiny muted" style={{ margin: '0 0 6px 2px' }}>
                  {disponiveis}/{slots[lvl - 1]} espaço(s) de {titulo.toLowerCase()} livre(s)
                </div>
              )}
              {lista.map((l) => renderLinha(
                l,
                l.origem === 'classe' ? (
                  <button
                    className="sm ghost"
                    onClick={() => {
                      if (trocaLivre) despreparar(l.spell.id)
                      else { setTrocando(l.spell.id); setFolha('preparar') }
                    }}
                    disabled={!trocaLivre && trocasDisponiveis === 0}
                  >{trocaLivre ? '✕' : '⇄'}</button>
                ) : undefined,
              ))}
            </SecaoCirculo>
          )
        })}

        {excedente && (
          <div className="banner warn">
            ⚠ Você tem {preparadas.length} magias preparadas pela classe e o seu limite é {limitePreparadas}.
            Use o ✕ para tirar as que sobram.
          </div>
        )}
      </Card>

      {/* --- Grimório do Mago --- */}
      {modo === 'grimorio' && (
        <Card
          title={`Grimório (${grimorio.length} magias)`}
          action={<button className="sm" onClick={() => setFolha('grimorio')}>Estudar</button>}
        >
          <p className="muted tiny">
            Seu grimório guarda todas as magias que você aprendeu; a cada descanso longo você
            prepara, entre elas, até {limitePreparadas} magias.
          </p>
          {grimorio.length > 0 && (
            <div className="tiny muted" style={{ marginTop: 8 }}>
              {grimorio.map((s) => s.name).join(', ')}
            </div>
          )}
        </Card>
      )}

      {/* ---------- Folha: preparar magias ---------- */}
      {folha === 'preparar' && (
        <Sheet
          title={trocando ? 'Trocar magia preparada' : 'Preparar magias'}
          onClose={() => { setFolha(null); setTrocando(null) }}
        >
          <div className="banner">
            <strong className="gold">{regra.quando}:</strong> {regra.quantas.toLowerCase()}.
            <div className="tiny" style={{ marginTop: 4 }}>{regra.texto}</div>
          </div>

          {trocando && (
            <div className="banner warn">
              Substituindo <strong>{spellById(trocando)?.name}</strong> — escolha a magia que entra no lugar.
              <button className="sm" style={{ marginTop: 8 }} onClick={() => setTrocando(null)}>Cancelar troca</button>
            </div>
          )}

          <div className="tiny muted" style={{ margin: '4px 0 10px' }}>
            Preparadas: <strong>{preparadas.length}/{limitePreparadas}</strong>
            {!trocando && vagasLivres > 0 && ` · ${vagasLivres} vaga(s) livre(s)`}
            {!trocaLivre && !trocando && vagasLivres <= 0 && trocasDisponiveis > 0
              && ' · a lista está cheia: use ⇄ numa magia preparada para trocá-la'}
          </div>

          {candidatas.length === 0 && (
            <p className="muted tiny">
              {modo === 'grimorio'
                ? 'Seu grimório ainda não tem magias — use "Estudar" para adicioná-las.'
                : 'Nenhuma magia disponível no seu nível.'}
            </p>
          )}

          {ORDINAIS.map((titulo, lvl) => {
            if (lvl === 0) return null
            const lista = candidatas.filter((s) => s.level === lvl)
            if (!lista.length) return null
            return (
              <details key={lvl} open={lvl <= 1}>
                <summary>{titulo} ({lista.length})</summary>
                <div style={{ marginTop: 8 }}>
                  {lista.map((s) => {
                    const prep = preparadasIds.includes(s.id)
                    // Sem troca em curso, só dá para preencher vagas livres.
                    const podeEntrar = trocando ? !prep : !prep && vagasLivres > 0
                    return (
                      <div className={`list-item${prep ? ' eq' : ''}`} key={s.id}>
                        <div className="spread">
                          <div style={{ flex: 1 }} onClick={() => setDetail(s.id)}>
                            <strong style={{ fontSize: '.9rem' }}>{s.name}</strong>
                            <div className="tiny muted">{resumoMagia(s)}</div>
                          </div>
                          {prep ? (
                            trocaLivre
                              ? <button className="sm gold" onClick={() => despreparar(s.id)}>✓ Preparada</button>
                              : <span className="tiny gold">✓ Preparada</span>
                          ) : (
                            <button
                              className="sm primary"
                              disabled={!podeEntrar}
                              onClick={() => (trocando ? trocar(trocando, s.id) : preparar(s.id))}
                            >{trocando ? 'Trocar' : '＋'}</button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </details>
            )
          })}
        </Sheet>
      )}

      {/* ---------- Folha: truques ---------- */}
      {folha === 'truques' && (
        <Sheet title={`Truques (${truques.length}/${limiteTruques})`} onClose={() => setFolha(null)}>
          <p className="muted tiny" style={{ marginBottom: 10 }}>
            Escolha {limiteTruques} truque(s) da lista de {listasLabel}. Sempre que ganhar um nível
            nesta classe você pode substituir um truque por outro.
          </p>
          {truquesCandidatos.map((s) => {
            const tem = truquesIds.includes(s.id)
            return (
              <div className={`list-item${tem ? ' eq' : ''}`} key={s.id}>
                <div className="spread">
                  <div style={{ flex: 1 }} onClick={() => setDetail(s.id)}>
                    <strong style={{ fontSize: '.9rem' }}>{s.name}</strong>
                    <div className="tiny muted">{resumoMagia(s)}</div>
                  </div>
                  <button
                    className={`sm${tem ? ' gold' : ' primary'}`}
                    disabled={!tem && truques.length >= limiteTruques}
                    onClick={() => toggleTruque(s.id)}
                  >{tem ? '✓' : '＋'}</button>
                </div>
              </div>
            )
          })}
        </Sheet>
      )}

      {/* ---------- Folha: grimório ---------- */}
      {folha === 'grimorio' && (
        <Sheet title="Grimório" onClose={() => setFolha(null)}>
          <p className="muted tiny" style={{ marginBottom: 10 }}>
            Você começa com 6 magias e adiciona 2 a cada nível de Mago, além das que copiar de
            pergaminhos e grimórios encontrados na aventura. Não há limite de tamanho.
          </p>
          {ORDINAIS.map((titulo, lvl) => {
            if (lvl === 0) return null
            const lista = catalogo.filter((s) => s.level === lvl)
            if (!lista.length) return null
            return (
              <details key={lvl} open={lvl <= 1}>
                <summary>{titulo} ({lista.length})</summary>
                <div style={{ marginTop: 8 }}>
                  {lista.map((s) => {
                    const tem = char.spellsKnown.includes(s.id)
                    return (
                      <div className={`list-item${tem ? ' eq' : ''}`} key={s.id}>
                        <div className="spread">
                          <div style={{ flex: 1 }} onClick={() => setDetail(s.id)}>
                            <strong style={{ fontSize: '.9rem' }}>{s.name}</strong>
                            <div className="tiny muted">{resumoMagia(s)}</div>
                          </div>
                          <button className={`sm${tem ? ' gold' : ' primary'}`} onClick={() => toggleGrimorio(s.id)}>
                            {tem ? '✓' : '＋'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </details>
            )
          })}
        </Sheet>
      )}

      {detail && <DetalheMagia id={detail} onClose={() => setDetail(null)} />}

      {/* Conjurar: escolhe como pagar, rola se quiser, e o gasto acontece sempre. */}
      {conjurando && (
        <ConfirmarUso
          titulo={conjurando.spell.name}
          subtitulo={resumoMagia(conjurando.spell)}
          dados={dadosDaMagia(conjurando.spell)}
          custos={custosDaMagia(conjurando)}
          detalhe={conjurando.spell.level === 0
            ? 'Truques não gastam espaço de magia — podem ser conjurados à vontade.'
            : undefined}
          aviso={conjurando.spell.level > 0 && custosDaMagia(conjurando).length === 0
            ? 'Sem espaços de magia disponíveis para este círculo ou acima. Um descanso longo devolve todos.'
            : undefined}
          onUsar={(rolar, custoId) => conjurar(conjurando, rolar, custoId)}
          onFechar={() => setConjurando(null)}
        />
      )}
    </div>
  )
}

/** Folha com a descrição completa de uma magia, usada nas duas variações da aba. */
function DetalheMagia({ id, onClose }: { id: string; onClose: () => void }) {
  const s = spellById(id)
  if (!s) return null
  return (
    <Sheet title={s.name} onClose={onClose}>
      <div className="muted tiny" style={{ marginBottom: 12, lineHeight: 1.7 }}>
        <strong className="gold">{s.level === 0 ? 'Truque' : `Magia de ${s.level}º nível`}</strong> · {s.school}
        <br /><strong>Tempo de Conjuração:</strong> {s.castingTime}
        <br /><strong>Alcance:</strong> {s.range}
        <br /><strong>Componentes:</strong> {s.components}
        <br /><strong>Duração:</strong> {s.duration}
        {s.concentration && <><br /><strong className="gold">Requer Concentração</strong></>}
        {s.ritual && <><br /><strong className="gold">Pode ser conjurada como Ritual</strong></>}
      </div>
      <SpellText desc={s.desc} />
      <div className="tiny muted" style={{ marginTop: 10 }}>Classes: {s.classes.map((c) => classById(c)?.name ?? c).join(', ')}</div>
    </Sheet>
  )
}
