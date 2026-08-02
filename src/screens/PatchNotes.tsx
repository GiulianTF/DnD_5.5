import { APP_VERSION, PATCH_NOTES, formatarData } from '../data/patch-notes'
import { useStore } from '../store/store'
import { Card } from '../components/ui'

/**
 * Tela Novidades: o que mudou em cada versão, em linguagem de jogador.
 * Abrir a tela marca a versão atual como vista e apaga o selo de novidade.
 */
export function PatchNotes() {
  const versaoVista = useStore((s) => s.versaoVista)

  return (
    <div>
      {versaoVista !== APP_VERSION && (
        <div className="banner ok">
          🎉 Boas novas! Você está na versão <strong>{APP_VERSION}</strong> — veja o que chegou.
        </div>
      )}

      {PATCH_NOTES.map((nota, i) => (
        <Card key={nota.version}>
          <div className="spread" style={{ marginBottom: 6 }}>
            <h3 style={{ margin: 0 }}>{nota.titulo}</h3>
            <span className={`pill${i === 0 ? ' gold' : ''}`}>{`v${nota.version}`}</span>
          </div>
          <div className="tiny muted">{formatarData(nota.date)}{i === 0 && ' · versão atual'}</div>
          <p className="tiny" style={{ margin: '10px 0 4px', lineHeight: 1.6 }}>{nota.resumo}</p>
          <ul className="notas">
            {nota.destaques.map((d, j) => (
              <li key={j}>
                <span className="ico">{d.icone}</span>
                <span>{d.texto}</span>
              </li>
            ))}
          </ul>
        </Card>
      ))}

      <p className="muted tiny center" style={{ marginBottom: 24 }}>
        Achou um bug ou alguma regra torta? Fala com o mestre. 🐉
      </p>
    </div>
  )
}

/**
 * Selo de versão clicável. Fica no cabeçalho de Minhas Fichas e ganha um ponto
 * dourado enquanto o jogador não abriu as notas da versão que está rodando.
 */
export function VersionBadge({ onClick }: { onClick: () => void }) {
  const versaoVista = useStore((s) => s.versaoVista)
  const novidade = versaoVista !== APP_VERSION
  return (
    <button
      className={`sm ghost version-badge${novidade ? ' novo' : ''}`}
      onClick={onClick}
      title={novidade ? 'Novidades desta versão' : 'Ver as notas de atualização'}
    >
      {novidade ? `✨ v${APP_VERSION}` : `v${APP_VERSION}`}
    </button>
  )
}
