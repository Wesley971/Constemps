import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi, ApiError } from '../services/api'
import type { User } from '../types/user'
import { Card } from '../design-system/components/Card'
import { Input } from '../design-system/components/Input'
import { Button } from '../design-system/components/Button'
import { ConfirmModal } from '../design-system/components/Modal'
import { ToastViewport } from '../design-system/components/ToastViewport'
import { PageSkeleton } from '../design-system/components/PageSkeleton'
import { useToast } from '../design-system/useToast'

function Profile() {
  const navigate = useNavigate()
  const { toast, notify } = useToast()

  const [checkingAuth, setCheckingAuth] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  const [emailInput, setEmailInput] = useState('')
  const [emailConfirmOpen, setEmailConfirmOpen] = useState(false)
  const [savingEmail, setSavingEmail] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    async function init() {
      try {
        const me = await authApi.me()
        setUser(me)
        setEmailInput(me.email)
      } catch {
        navigate('/login')
        return
      } finally {
        setCheckingAuth(false)
      }
    }

    void init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate])

  function handleEmailSubmit(event: FormEvent) {
    event.preventDefault()
    if (!user || emailInput.trim() === user.email) return
    setEmailConfirmOpen(true)
  }

  async function confirmEmailChange() {
    setEmailConfirmOpen(false)
    setSavingEmail(true)
    try {
      const updated = await authApi.updateProfile({ email: emailInput.trim() })
      setUser(updated)
      setEmailInput(updated.email)
      notify({ tone: 'success', title: 'Adresse e-mail mise à jour', message: `Ton adresse est maintenant ${updated.email}.` })
    } catch (err) {
      notify({
        tone: 'danger',
        title: 'Modification impossible',
        message: err instanceof ApiError ? err.message : 'Une erreur est survenue',
      })
    } finally {
      setSavingEmail(false)
    }
  }

  async function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault()

    if (newPassword !== confirmNewPassword) {
      notify({
        tone: 'danger',
        title: 'Les mots de passe ne correspondent pas',
        message: 'Le nouveau mot de passe et sa confirmation doivent être identiques.',
      })
      return
    }

    setSavingPassword(true)
    try {
      await authApi.updateProfile({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      notify({ tone: 'success', title: 'Mot de passe mis à jour', message: 'Ton nouveau mot de passe est actif dès maintenant.' })
    } catch (err) {
      notify({
        tone: 'danger',
        title: 'Modification impossible',
        message: err instanceof ApiError ? err.message : 'Une erreur est survenue',
      })
    } finally {
      setSavingPassword(false)
    }
  }

  if (checkingAuth) {
    return <PageSkeleton />
  }

  return (
    <div className="max-w-140 mx-auto">
      <ToastViewport toast={toast} />

      <p className="mt-1 mb-5">
        <Link to="/dashboard">Retour au dashboard</Link>
      </p>

      <h1 className="font-display text-display-lg text-ink tracking-tight m-0 mb-8">Mon profil</h1>

      <Card className="p-6 mb-6">
        <h2 className="font-display text-display-sm text-ink m-0 mb-1">Adresse e-mail</h2>
        <p className="font-body text-body-sm text-inksoft mt-0 mb-5">Connecté avec {user?.email}</p>
        <form onSubmit={handleEmailSubmit}>
          <div className="mb-4">
            <Input
              label="Nouvelle adresse e-mail"
              id="email"
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={savingEmail || !user || emailInput.trim() === user.email}>
            {savingEmail ? 'Enregistrement...' : 'Changer d\'adresse e-mail'}
          </Button>
        </form>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="font-display text-display-sm text-ink m-0 mb-5">Mot de passe</h2>
        <form onSubmit={handlePasswordSubmit}>
          <div className="mb-4">
            <Input
              label="Mot de passe actuel"
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <Input
              label="Nouveau mot de passe"
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <div className="mb-4">
            <Input
              label="Confirmer le nouveau mot de passe"
              id="confirmNewPassword"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <Button type="submit" disabled={savingPassword || !currentPassword || !newPassword || !confirmNewPassword}>
            {savingPassword ? 'Enregistrement...' : 'Changer de mot de passe'}
          </Button>
        </form>
      </Card>

      {emailConfirmOpen && (
        <ConfirmModal
          title="Confirmer le changement d'adresse e-mail ?"
          confirmLabel="Confirmer"
          onConfirm={confirmEmailChange}
          onClose={() => setEmailConfirmOpen(false)}
        >
          Ton adresse de connexion passera de "{user?.email}" à "{emailInput.trim()}".
        </ConfirmModal>
      )}
    </div>
  )
}

export default Profile
