import { useState } from 'react'
import type { ReactNode } from 'react'
import { Noren } from '../design-system/components/Noren'
import { TabBar } from '../design-system/components/TabBar'
import { Seigaiha } from '../design-system/components/Seigaiha'
import { BrushCircle } from '../design-system/components/BrushCircle'
import { Button } from '../design-system/components/Button'
import { Input } from '../design-system/components/Input'
import { Textarea } from '../design-system/components/Textarea'
import { Label } from '../design-system/components/Label'
import { Lantern } from '../design-system/components/Lantern'
import { Scroll } from '../design-system/components/Scroll'
import { Seal } from '../design-system/components/Seal'
import { RoundCard } from '../design-system/components/RoundCard'
import { VerdictStamp } from '../design-system/components/VerdictStamp'
import { BrushLink } from '../design-system/components/BrushLink'
import { InkRule } from '../design-system/components/InkRule'
import { DeckRope } from '../design-system/components/DeckRope'
import { DeckPlaque, EmaPlaque, NewDeckPlaque } from '../design-system/components/EmaPlaque'
import { IconButton } from '../design-system/components/IconButton'
import { BackLink } from '../design-system/components/BackLink'
import { Curtain, CurtainConfirm } from '../design-system/components/Curtain'
import { ChoiceCards } from '../design-system/components/ChoiceCards'
import { Checkbox } from '../design-system/components/Checkbox'

// Démonstration des fondations du design system (CON-57). Route servie
// seulement en développement (voir App.tsx), gardée jusqu'à la fin de CON-57
// pour vérifier chaque lot à 360, 390, 430px et sur ordinateur.

const COLOR_TOKENS = [
  'canvas',
  'paper',
  'paper-sunken',
  'ink',
  'inksoft',
  'indigo',
  'indigo-deep',
  'scroll-mount',
  'vermillon',
  'wood',
  'rope',
  'seigaiha',
  'cream',
  'success',
  'warning',
  'danger',
  'season-spring',
  'season-summer',
  'season-autumn',
  'season-winter',
]

const SPACING_STEPS = [1, 2, 3, 4, 6, 8, 12, 16]

const LONG_TEXT = 'Un nom de deck particulièrement long, pour vérifier que rien ne déborde ni ne se coupe mal sur un petit écran'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="m-0 font-display text-display-md">{title}</h2>
      {children}
    </section>
  )
}

function Swatches() {
  return (
    <div className="grid grid-cols-4 gap-2">
      {COLOR_TOKENS.map((token) => (
        <div key={token} className="flex flex-col gap-1 min-w-0">
          <span className="h-12 rounded-sm border border-line" style={{ background: `var(--color-${token})` }} />
          <span className="font-body text-caption text-inksoft truncate">{token}</span>
        </div>
      ))}
    </div>
  )
}

const CLOSE_DEMO_KEY = 'fondations-demo'

export default function Fondations() {
  const [progress, setProgress] = useState(60)
  const [showError, setShowError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [closeRun, setCloseRun] = useState(0)
  const [recto, setRecto] = useState(LONG_TEXT)
  const [curtain, setCurtain] = useState<'form' | 'confirm' | null>(null)
  const [choice, setChoice] = useState<'a' | 'b'>('a')
  const [checked, setChecked] = useState(true)

  function replayClose() {
    try {
      window.localStorage.removeItem(`constemps.brushClosed.${CLOSE_DEMO_KEY}`)
    } catch {
      // Stockage indisponible : la fermeture sera rejouée de toute façon.
    }
    setCloseRun((n) => n + 1)
  }

  return (
    <div className="relative min-h-dvh flex flex-col overflow-hidden">
      <Seigaiha />
      <Noren />
      <main className="relative flex-1 w-full max-w-wrap mx-auto px-gutter py-8 flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <Label>Design system</Label>
          <h1 className="m-0 font-display text-display-xl">Fondations</h1>
          <p className="m-0 text-inksoft">Un peu, chaque jour.</p>
        </header>

        <Section title="Couleurs, jour">
          <Swatches />
        </Section>

        <Section title="Couleurs, nuit (non activé avant le lot 7)">
          <div data-theme="nuit" className="bg-canvas text-ink rounded-md p-4">
            <Swatches />
          </div>
        </Section>

        <Section title="Typographie">
          <div className="flex flex-col gap-2">
            <span className="font-display text-display-xl">Kaisei 34 · 11 cartes</span>
            <span className="font-display text-display-lg">Kaisei 26 · Mes decks</span>
            <span className="font-display text-display-md">Kaisei 20 · to come across</span>
            <span className="font-display text-display-sm">Kaisei 17 · Se connecter</span>
            <span className="text-body-lg">Zen Maru 16 · wesley@exemple.fr</span>
            <span className="text-body-md">Zen Maru 15 · texte courant</span>
            <span className="text-body-sm">Zen Maru 14 · Pas encore de compte ?</span>
            <span className="text-caption text-inksoft">Zen Maru 12 · Il y a environ un mois</span>
            <span className="font-display text-display-md break-words">{LONG_TEXT}</span>
          </div>
        </Section>

        <Section title="Grille de 4px">
          <div className="flex flex-col gap-2">
            {SPACING_STEPS.map((step) => (
              <div key={step} className="flex items-center gap-4">
                <span className="w-12 text-caption text-inksoft">{step * 4}px</span>
                <span className="h-2 bg-vermillon rounded-xs" style={{ width: `${step * 4}px` }} />
              </div>
            ))}
            <span className="text-caption text-inksoft">Gouttière : 16px sur tous les écrans.</span>
          </div>
        </Section>

        <Section title="Étiquettes">
          <div className="flex flex-col gap-2">
            <Label>Aujourd'hui</Label>
            <Label>Ta progression</Label>
            <Label>Langue apprise</Label>
          </div>
        </Section>

        <Section title="Boutons">
          <div className="flex flex-col gap-4">
            <Button className="w-full">Se connecter</Button>
            <Button className="w-full" disabled={loading} onClick={() => setLoading((v) => !v)}>
              {/* Libellés superposés : la largeur ne bouge pas pendant le chargement (CON-62). */}
              <span className="grid">
                <span className={`col-start-1 row-start-1 ${loading ? 'invisible' : ''}`}>Enregistrer</span>
                <span className={`col-start-1 row-start-1 ${loading ? '' : 'invisible'}`}>Enregistrement...</span>
              </span>
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" icon="ph:plus-bold">
                Ajouter
              </Button>
              <Button variant="secondary" icon="ph:sparkle-bold">
                Générer
              </Button>
              <Button variant="secondary" disabled>
                Désactivé
              </Button>
            </div>
            <Button variant="danger" className="w-full">
              Supprimer définitivement
            </Button>
            <div className="bg-indigo rounded-b-lg p-4 flex flex-col gap-4">
              <Button variant="curtain" className="w-full">
                Ajouter la carte
              </Button>
              <Button variant="curtain-secondary">Traduire</Button>
            </div>
            {loading ? (
              <Button variant="secondary" onClick={() => setLoading(false)}>
                Arrêter le chargement
              </Button>
            ) : null}
          </div>
        </Section>

        <Section title="Champs au pinceau">
          <form className="flex flex-col gap-2" onSubmit={(e) => e.preventDefault()}>
            <Input label="E-mail" type="email" defaultValue="wesley@exemple.fr" />
            <Input label="Mot de passe" type="password" defaultValue="un mot de passe" />
            <Input label="Nom du deck" defaultValue={LONG_TEXT} error={showError ? 'Ce nom est déjà utilisé.' : undefined} hint="Visible sur la plaquette." />
            <Textarea label="Recto" value={recto} onChange={(e) => setRecto(e.target.value)} rows={3} />
            <Button variant="secondary" onClick={() => setShowError((v) => !v)}>
              {showError ? 'Retirer l’erreur' : 'Afficher une erreur'}
            </Button>
          </form>
        </Section>

        <Section title="Lanterne, rouleau, corde">
          <div className="flex items-start gap-6">
            <Lantern value={39} label="Palier du jour : 7 cartes sur 18">
              <span className="flex flex-col items-center">
                <span className="font-display text-display-lg">7</span>
                <span className="text-micro font-normal text-wood-ink-soft">sur 18</span>
              </span>
            </Lantern>
            <div className="flex flex-col gap-1 pt-4">
              <Label>Aujourd'hui</Label>
              <span className="font-display text-hero text-indigo">11</span>
              <BrushLink to="/dashboard">Reprendre</BrushLink>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Seal initials="WA" />
            <span className="font-display text-body-sm text-inksoft">Sceau du profil (CON-71)</span>
          </div>
          <div className="flex flex-col items-center gap-4">
            <RoundCard tag={<span className="px-3 py-1 rounded-pill bg-indigo-tint text-indigo text-caption font-bold">Appréciation personnelle</span>}>
              <span className="font-display text-hero-card">to wander</span>
            </RoundCard>
            <div className="flex flex-wrap justify-center gap-3">
              <VerdictStamp verdict="compris" />
              <VerdictStamp verdict="partiellement" />
              <VerdictStamp verdict="incompris" />
              <VerdictStamp verdict={null} />
            </div>
          </div>
          <Scroll label="Cette semaine">
            <Label>Cette semaine</Label>
            <p className="m-0 font-display text-scroll text-balance">{LONG_TEXT}</p>
            <InkRule />
            <p className="m-0 font-display text-body-lg text-balance">Sept jours de régularité.</p>
          </Scroll>
          <DeckRope
            label="Démonstration de la corde"
            items={[
              ...[20, 60, 100, 0, 80].map((p, i) => ({
                key: `demo-${i}`,
                node: <EmaPlaque to="/fondations" name={i === 1 ? LONG_TEXT : `Deck ${i + 1}`} status={p === 100 ? 'À jour' : `${i + 3} à revoir`} progress={p} />,
              })),
              { key: 'demo-new', still: true, node: <NewDeckPlaque onClick={() => undefined} /> },
            ]}
          />
        </Section>

        <Section title="Rideaux">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setCurtain('form')}>
              Rideau de saisie
            </Button>
            <Button variant="secondary" onClick={() => setCurtain('confirm')}>
              Confirmation
            </Button>
          </div>
          {curtain === 'form' ? (
            <Curtain title="Démonstration" onClose={() => setCurtain(null)}>
              <ChoiceCards
                name="demo-choix"
                legend="Type de carte"
                options={[
                  { value: 'a', label: 'Appréciation personnelle', help: 'Tu notes toi-même ta réponse.' },
                  { value: 'b', label: 'Avis assisté', help: 'L’IA évalue ta réponse rédigée.' },
                ]}
                value={choice}
                onChange={setChoice}
              />
              <Input label="Recto" defaultValue={LONG_TEXT} />
              <Checkbox checked={checked} onChange={setChecked} label="Garder cette proposition" />
              <Button variant="curtain" className="w-full" onClick={() => setCurtain(null)}>
                Fermer
              </Button>
            </Curtain>
          ) : null}
          {curtain === 'confirm' ? (
            <CurtainConfirm title={'Supprimer cette carte ?'} confirmLabel="Supprimer" danger onConfirm={() => setCurtain(null)} onClose={() => setCurtain(null)}>
              <p className="m-0">{LONG_TEXT}</p>
            </CurtainConfirm>
          ) : null}
        </Section>

        <Section title="Mes decks, intérieur d'un deck">
          <BackLink to="/fondations">{LONG_TEXT}</BackLink>
          <DeckRope
            stacked
            label="Démonstration des cordes empilées"
            items={[
              ...[20, 60, 100, 0].map((p, i) => ({
                key: `stack-${i}`,
                node: (
                  <EmaPlaque
                    to="/fondations"
                    name={i === 1 ? LONG_TEXT : `Deck ${i + 1}`}
                    status={p === 100 ? 'Palier atteint' : `${i + 2} à revoir`}
                    progress={p}
                    total={`${12 * (i + 1)} cartes`}
                  />
                ),
              })),
              { key: 'stack-new', still: true, node: <NewDeckPlaque onClick={() => undefined} /> },
            ]}
          />
          <div className="flex items-start gap-5">
            <DeckPlaque remaining={2} status="à revoir" label="2 à revoir" progress={60} />
            <DeckPlaque remaining={0} status="Palier atteint" label="Palier atteint" progress={100} />
          </div>
          <div className="flex items-center gap-2">
            <IconButton icon="edit" label="Modifier" />
            <IconButton icon="delete" label="Supprimer" />
            <Button variant="compact">Enregistrer</Button>
            <BrushLink to="/fondations" disabled>
              Réviser
            </BrushLink>
          </div>
        </Section>

        <Section title="Cercles au pinceau">
          <div className="flex flex-wrap items-center gap-4">
            {[0, 20, 39, 60, 80].map((v, i) => (
              <BrushCircle key={v} value={v} size="sm" label={`${v} %`} delayMs={i * 150} />
            ))}
            <BrushCircle value={100} size="sm" label="Complet" />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <BrushCircle value={60} size="md" tone="vermillon" label="60 %" />
            <BrushCircle value={60} size="lg" label="Palier du jour : 7 cartes sur 18">
              <span className="flex flex-col items-center">
                <span className="font-display text-display-lg">7</span>
                <span className="text-caption text-inksoft">sur 18</span>
              </span>
            </BrushCircle>
            <span className="bg-indigo rounded-sm p-2 inline-flex">
              <BrushCircle value={80} size="md" tone="cream" label="80 %" />
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="progress" className="text-body-sm">
              Progression : {progress} %
            </label>
            <input id="progress" type="range" min="0" max="100" value={progress} onChange={(e) => setProgress(Number(e.target.value))} />
            <div className="flex items-center gap-4">
              <BrushCircle key={closeRun} value={progress} size="lg" label={`Démonstration : ${progress} %`} closeKey={CLOSE_DEMO_KEY} />
              <Button variant="secondary" onClick={replayClose}>
                Rejouer la fermeture
              </Button>
            </div>
            <span className="text-caption text-inksoft">À 100 %, la fermeture se joue une fois par jour, puis le cercle reste fermé.</span>
          </div>
        </Section>
      </main>
      <TabBar />
    </div>
  )
}
