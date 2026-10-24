import { useState } from 'react'
import type { FormEvent } from 'react'
import { AppScreen } from '../design-system/components/AppScreen'
import { BrushCircle } from '../design-system/components/BrushCircle'
import { BrushLink } from '../design-system/components/BrushLink'
import { Button } from '../design-system/components/Button'
import { Input } from '../design-system/components/Input'
import { ToastViewport } from '../design-system/components/ToastViewport'
import type { ActiveToast } from '../design-system/useToast'

interface AuthScreenProps {
  submitLabel: string
  pendingLabel: string
  passwordHint?: string
  // Mot de passe à 8 caractères au moins (inscription), comme l'exige l'API.
  passwordMinLength?: number
  switchPrompt: string
  switchLabel: string
  switchTo: string
  toast: ActiveToast | null
  onDismissToast: () => void
  onSubmit: (email: string, password: string) => Promise<void>
}

// Connexion et inscription (CON-71, S15-connexion), même écran : cercle qui se
// trace à chaque ouverture, nom de l'app et sa phrase, champs au pinceau. Les
// erreurs passent en notification pour ne jamais décaler le formulaire.
export function AuthScreen({
  submitLabel,
  pendingLabel,
  passwordHint,
  passwordMinLength,
  switchPrompt,
  switchLabel,
  switchTo,
  toast,
  onDismissToast,
  onSubmit,
}: AuthScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      await onSubmit(email.trim(), password)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppScreen tallNoren withTabs={false}>
      <ToastViewport toast={toast} onDismiss={onDismissToast} placement="bottom" />

      <div className="flex flex-col gap-8 px-3 pt-4">
        <div className="flex flex-col items-center gap-2">
          {/* Purement décoratif : retiré de l'arbre d'accessibilité. */}
          <span aria-hidden="true" className="flex">
            <BrushCircle value={100} label="Ensō" size="lg" playClose delayMs={300} />
          </span>
          <h1 className="m-0 font-display text-display-xl">Constemps</h1>
          <p className="m-0 font-display text-body-md text-inksoft">Un peu, chaque jour.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
    </AppScreen>
  )
}
