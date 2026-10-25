import { useState } from 'react'
import type { FormEvent } from 'react'
import { AppScreen } from '../design-system/components/AppScreen'
import { BrushCircle } from '../design-system/components/BrushCircle'
import { BrushLink } from '../design-system/components/BrushLink'
import { Button } from '../design-system/components/Button'
import { Input } from '../design-system/components/Input'
import { ToastViewport } from '../design-system/components/ToastViewport'
import type { ActiveToast } from '../design-system/useToast'
import { useWideLayout } from '../design-system/useWideLayout'

interface AuthScreenProps {
  // Titre du formulaire, affiché sur grand écran seulement (S20-C-connexion).
  title: string
  submitLabel: string
  pendingLabel: string
  passwordHint?: string
  // Mot de passe à 8 caractères au moins (inscription), comme l'exige l'API.
  passwordMinLength?: number
  // Inscription (CON-56) : champ « Prénom (facultatif) » au-dessus de l'e-mail.
  withFirstName?: boolean
  switchPrompt: string
  switchLabel: string
  switchTo: string
  toast: ActiveToast | null
  onDismissToast: () => void
  // Prénom tel que saisi (chaîne vide sans withFirstName) : la page le valide.
  onSubmit: (email: string, password: string, firstName: string) => Promise<void>
}

// Connexion et inscription (CON-71, S15-connexion), même écran : cercle qui se
// trace à chaque ouverture, nom de l'app et sa phrase, champs au pinceau. Les
// erreurs passent en notification pour ne jamais décaler le formulaire.
export function AuthScreen({
  title,
  submitLabel,
  pendingLabel,
  passwordHint,
  passwordMinLength,
  withFirstName,
  switchPrompt,
  switchLabel,
  switchTo,
  toast,
  onDismissToast,
  onSubmit,
}: AuthScreenProps) {
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const wide = useWideLayout()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      await onSubmit(email.trim(), password, firstName)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppScreen tallNoren withTabs={false} wideNoren>
      <ToastViewport toast={toast} onDismiss={onDismissToast} placement="bottom" />

      {/* Grand écran (S20-C-connexion) : l'ensō et le nom à gauche, un trait, le
          formulaire de 380px à droite, centrés dans la hauteur. */}
      <div className="flex flex-col gap-8 px-3 pt-4 lg:flex-1 lg:flex-row lg:items-center lg:justify-center lg:gap-30 lg:px-0 lg:pt-0 lg:pb-16">
        <div className="flex flex-col items-center gap-2 lg:gap-4">
          {/* Purement décoratif : retiré de l'arbre d'accessibilité. */}
          <span aria-hidden="true" className="flex">
            <BrushCircle value={100} label="Ensō" size={wide ? 'enso' : 'lg'} playClose delayMs={300} />
          </span>
          <h1 className="m-0 font-display text-display-xl lg:text-hero-card">Constemps</h1>
          <p className="m-0 font-display text-body-md text-inksoft lg:text-scroll lg:font-normal">Un peu, chaque jour.</p>
        </div>

        <span aria-hidden="true" className="hidden lg:block w-thread h-80 bg-linear-to-b from-transparent via-rope/45 to-transparent" />

        <div className="contents lg:flex lg:flex-col lg:gap-6 lg:w-95">
          {wide ? <h2 className="m-0 font-display text-display-lg">{title}</h2> : null}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {withFirstName ? (
              <Input
                label="Prénom (facultatif)"
                hint="40 caractères au plus"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={loading}
              />
            ) : null}
            <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
            <Input
              label="Mot de passe"
              type="password"
              hint={passwordHint}
              minLength={passwordMinLength}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <Button type="submit" disabled={loading} className="w-full mt-1">
              <span className="grid">
                <span className={`col-start-1 row-start-1 ${loading ? 'invisible' : ''}`}>{submitLabel}</span>
                <span className={`col-start-1 row-start-1 ${loading ? '' : 'invisible'}`}>{pendingLabel}</span>
              </span>
            </Button>
          </form>

          <div className="flex flex-col items-center text-body-sm text-inksoft">
            <span>{switchPrompt}</span>
            <span className="self-center">
              <BrushLink size="md" chevron={false} to={switchTo}>
                {switchLabel}
              </BrushLink>
            </span>
          </div>
        </div>
      </div>
    </AppScreen>
  )
}
