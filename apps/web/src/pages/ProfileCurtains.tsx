import { useState } from 'react'
import type { FormEvent } from 'react'
import { authApi, ApiError } from '../services/api'
import type { User } from '../types/user'
import { Button } from '../design-system/components/Button'
import { Curtain } from '../design-system/components/Curtain'
import { Input } from '../design-system/components/Input'
import type { ToastState } from '../design-system/useToast'
import { frenchSpacing } from '../lib/typography'
import { FIRST_NAME_MESSAGE, isValidFirstName, normalizeFirstName } from '../lib/profile'

interface ProfileCurtainProps {
  user: User
  onClose: () => void
  notify: (toast: ToastState) => void
}

// Libellé du bouton d'envoi, les deux états superposés : le bouton garde sa
// largeur pendant l'enregistrement.
function SubmitLabel({ busy, idle, pending }: { busy: boolean; idle: string; pending: string }) {
  return (
    <span className="grid">
      <span className={`col-start-1 row-start-1 ${busy ? 'invisible' : ''}`}>{idle}</span>
      <span className={`col-start-1 row-start-1 ${busy ? '' : 'invisible'}`}>{pending}</span>
    </span>
  )
}

// Changement d'adresse e-mail (CON-71) en deux temps dans le même rideau :
// saisie, puis confirmation de l'adresse de connexion qui change (gardée de la v2).
export function EmailCurtain({ user, onClose, onSaved, notify }: ProfileCurtainProps & { onSaved: (user: User) => void }) {
  const [email, setEmail] = useState(user.email)
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const next = email.trim()
  const unchanged = !next || next === user.email

  function handleNext(event: FormEvent) {
    event.preventDefault()
    if (unchanged) return
    setConfirming(true)
  }

  async function handleConfirm(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      const updated = await authApi.updateProfile({ email: next })
      onSaved(updated)
      notify({ tone: 'success', title: 'Adresse e-mail mise à jour', message: `Ton adresse est maintenant ${updated.email}.` })
    } catch (err) {
      notify({ tone: 'danger', title: 'Modification impossible', message: err instanceof ApiError ? err.message : 'Une erreur est survenue' })
      setSaving(false)
    }
  }

  return (
    <Curtain title="Adresse e-mail" onClose={onClose}>
      {confirming ? (
        <form onSubmit={handleConfirm} className="flex flex-col gap-5">
          <p className="m-0 text-body-md text-ink break-words">
            {frenchSpacing(`Ton adresse de connexion passera de « ${user.email} » à « ${next} ».`)}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="curtain-ghost" disabled={saving} onClick={() => setConfirming(false)}>
              Retour
            </Button>
            <Button type="submit" variant="curtain" disabled={saving}>
              <SubmitLabel busy={saving} idle="Confirmer" pending="Envoi..." />
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleNext} className="flex flex-col gap-5">
          <Input label="Nouvelle adresse e-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Button type="submit" variant="curtain" disabled={unchanged} className="w-full">
            Changer d’adresse
          </Button>
        </form>
      )}
    </Curtain>
  )
}

// Prénom (CON-76) : ajout, modification, ou retrait en vidant le champ. Mêmes
// règles qu'à l'API, vérifiées avant l'envoi ; l'erreur part en notification.
export function FirstNameCurtain({ user, onClose, onSaved, notify }: ProfileCurtainProps & { onSaved: (user: User) => void }) {
  const [firstName, setFirstName] = useState(user.firstName ?? '')
  const [saving, setSaving] = useState(false)
  const next = normalizeFirstName(firstName)
  const unchanged = next === user.firstName

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (saving || unchanged) return
    if (!isValidFirstName(next)) {
      notify({ tone: 'danger', title: 'Prénom non valide', message: FIRST_NAME_MESSAGE })
      return
    }
    setSaving(true)
    try {
      const updated = await authApi.updateProfile({ firstName: next })
      onSaved(updated)
      notify(
        updated.firstName
          ? { tone: 'success', title: 'Prénom enregistré', message: frenchSpacing(`Bonjour, ${updated.firstName} !`) }
          : { tone: 'success', title: 'Prénom retiré', message: 'Ton profil affiche de nouveau ton adresse e-mail.' },
      )
    } catch (err) {
      notify({ tone: 'danger', title: 'Modification impossible', message: err instanceof ApiError ? err.message : 'Une erreur est survenue' })
      setSaving(false)
    }
  }

  return (
    <Curtain title="Prénom" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          label="Prénom"
          hint="40 caractères au plus · laisse vide pour le retirer"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          disabled={saving}
        />
        <Button type="submit" variant="curtain" disabled={saving || unchanged} className="w-full">
          <SubmitLabel busy={saving} idle="Enregistrer" pending="Enregistrement..." />
        </Button>
      </form>
    </Curtain>
  )
}

// Changement de mot de passe (CON-71) : mot de passe actuel exigé par l'API, qui
// révoque aussi les autres sessions (CON-46).
export function PasswordCurtain({ onClose, notify }: Omit<ProfileCurtainProps, 'user'>) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const mismatch = confirmPassword !== '' && confirmPassword !== newPassword

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (saving || !currentPassword || !newPassword || newPassword !== confirmPassword) return
    setSaving(true)
    try {
      await authApi.updateProfile({ currentPassword, newPassword })
      notify({ tone: 'success', title: 'Mot de passe mis à jour', message: 'Ton nouveau mot de passe est actif dès maintenant.' })
      onClose()
    } catch (err) {
      notify({ tone: 'danger', title: 'Modification impossible', message: err instanceof ApiError ? err.message : 'Une erreur est survenue' })
      setSaving(false)
    }
  }

  return (
    <Curtain title="Mot de passe" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input label="Mot de passe actuel" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required disabled={saving} />
        <Input
          label="Nouveau mot de passe"
          type="password"
          hint="8 caractères minimum"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={8}
          required
          disabled={saving}
        />
        <Input
          label="Confirmation"
          type="password"
          error={mismatch ? 'Les deux mots de passe ne correspondent pas.' : undefined}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          minLength={8}
          required
          disabled={saving}
        />
        <Button type="submit" variant="curtain" disabled={saving || !currentPassword || newPassword.length < 8 || newPassword !== confirmPassword} className="w-full">
          <SubmitLabel busy={saving} idle="Changer de mot de passe" pending="Enregistrement..." />
        </Button>
      </form>
    </Curtain>
  )
}
