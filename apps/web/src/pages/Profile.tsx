import { Fragment, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi, ApiError } from '../services/api'
import type { User } from '../types/user'
import { AppearancePicker } from '../design-system/components/AppearancePicker'
import { AppScreen } from '../design-system/components/AppScreen'
import { BrushLink } from '../design-system/components/BrushLink'
import { CurtainConfirm } from '../design-system/components/Curtain'
import { InkRule } from '../design-system/components/InkRule'
import { Input } from '../design-system/components/Input'
import { Label } from '../design-system/components/Label'
import { PageSkeleton } from '../design-system/components/PageSkeleton'
import { Scroll } from '../design-system/components/Scroll'
import { Seal } from '../design-system/components/Seal'
import { ToastViewport } from '../design-system/components/ToastViewport'
import { useToast } from '../design-system/useToast'
import { initialsFromEmail, initialsFromFirstName, languageLabel, memberSinceLabel } from '../lib/profile'
import { EmailCurtain, FirstNameCurtain, PasswordCurtain } from './ProfileCurtains'

type OpenCurtain = 'firstName' | 'email' | 'password' | 'delete' | null

interface AccountRowProps {
  label: string
  value: string
  // Valeur absente (prénom non renseigné, CON-76) : texte secondaire.
  empty?: boolean
  // Absent : valeur affichée seulement (langue apprise, CON-71).
  onEdit?: () => void
  editLabel?: string
  // Mot du bouton : « Modifier » par défaut, « Ajouter » pour une valeur absente.
  editText?: string
}

// Ligne du rouleau (S14-profil) : étiquette vermillon, valeur sur une ligne
// tronquée, « Modifier » à droite avec sa cible de 44px.
function AccountRow({ label, value, empty, onEdit, editLabel, editText = 'Modifier' }: AccountRowProps) {
  return (
    <div className="w-full flex items-center justify-between gap-3 min-h-hit py-1 text-left">
      <div className="min-w-0 flex flex-col">
        <Label>{label}</Label>
        <span className={`text-body-md truncate ${empty ? 'text-inksoft' : ''}`}>{value}</span>
      </div>
      {onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          aria-label={editLabel}
          className="shrink-0 min-h-hit px-0 bg-transparent border-none font-body text-label font-bold text-indigo cursor-pointer hover:text-indigo-deep"
        >
          {editText}
        </button>
      ) : null}
    </div>
  )
}

// Coupures permises après le @ et avant chaque point : un e-mail long passe à la
// ligne entre ses parties plutôt qu'au milieu d'un mot (break-words en dernier recours).
function EmailBreaks({ email }: { email: string }) {
  const parts = email.split(/(?<=@)|(?=\.)/)
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i > 0 ? <wbr /> : null}
          {part}
        </Fragment>
      ))}
    </>
  )
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// Profil refondu (CON-71, S14-profil) : sceau à initiales et prénom en titre
// (CON-76), e-mail à la place tant qu'il n'y a pas de prénom, compte dans le
// rouleau, apparence en blasons (CON-73), déconnexion et suppression en bas.
function Profile() {
  const navigate = useNavigate()
  const { toast, notify, dismiss } = useToast()

  const [user, setUser] = useState<User | null>(null)
  const [curtain, setCurtain] = useState<OpenCurtain>(null)
  const [deletePassword, setDeletePassword] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)

  useEffect(() => {
    async function init() {
      try {
        setUser(await authApi.me())
      } catch {
        navigate('/login')
      }
    }

    void init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate])

  function closeDeleteConfirm() {
    if (deletingAccount) return
    setCurtain(null)
    setDeletePassword('')
  }

  async function confirmAccountDeletion() {
    if (deletingAccount) return
    if (!deletePassword) {
      notify({ tone: 'danger', title: 'Mot de passe requis', message: 'Saisis ton mot de passe pour confirmer la suppression.' })
      return
    }

    setDeletingAccount(true)
    try {
      await authApi.deleteAccount(deletePassword)
      navigate('/login', { replace: true, state: { notice: 'Ton compte a été supprimé.' } })
    } catch (err) {
      notify({
        tone: 'danger',
        title: 'Suppression impossible',
        message: err instanceof ApiError ? err.message : 'Une erreur est survenue',
      })
      setDeletingAccount(false)
    }
  }

  async function handleLogout() {
    try {
      await authApi.logout()
      navigate('/login')
    } catch (err) {
      notify({ tone: 'danger', title: 'Déconnexion impossible', message: err instanceof ApiError ? err.message : 'Réessaie dans un instant.' })
    }
  }

  if (!user) {
    return <PageSkeleton />
  }

  return (
    <AppScreen>
      <ToastViewport toast={toast} onDismiss={dismiss} />

      {/* Grand écran (S20-C-profil) : identité et compte à gauche, apparence et
          déconnexion à droite ; sur mobile, les enveloppes sont transparentes. */}
      <div className="contents lg:flex lg:items-start lg:gap-16">
        <div className="contents lg:flex lg:flex-col lg:gap-6 lg:shrink-0">
          <div className="flex items-center gap-4 px-1">
            <Seal initials={user.firstName ? initialsFromFirstName(user.firstName) : initialsFromEmail(user.email)} />
            <div className="min-w-0 flex flex-col gap-1">
              <h1 className="m-0 font-display text-display-md break-words lg:text-display-xl">
                {user.firstName ?? <EmailBreaks email={user.email} />}
              </h1>
              <span className="font-display text-body-sm text-inksoft">Avec Constemps {memberSinceLabel(user.createdAt)}</span>
            </div>
          </div>

          <Scroll label="Mon compte" wide>
            <AccountRow
              label="Prénom"
              value={user.firstName ?? 'Aucun prénom'}
              empty={!user.firstName}
              onEdit={() => setCurtain('firstName')}
              editText={user.firstName ? 'Modifier' : 'Ajouter'}
              editLabel={user.firstName ? 'Modifier le prénom' : 'Ajouter un prénom'}
            />
            <InkRule />
            <AccountRow label="E-mail" value={user.email} onEdit={() => setCurtain('email')} editLabel="Modifier l’adresse e-mail" />
            <InkRule />
            <AccountRow label="Mot de passe" value="••••••••••" onEdit={() => setCurtain('password')} editLabel="Modifier le mot de passe" />
            <InkRule />
            <AccountRow label="Langue apprise" value={capitalize(languageLabel(user.learningLanguage))} />
          </Scroll>
        </div>

        <div className="contents lg:flex lg:flex-1 lg:min-w-0 lg:flex-col lg:gap-8 lg:pt-32">
          <AppearancePicker />

          {/* Seule déconnexion de l'app depuis CON-69 : ne jamais la retirer. */}
          <div className="flex items-center justify-between gap-4 px-1 lg:flex-col lg:items-start lg:justify-start lg:gap-2">
            <BrushLink size="md" chevron={false} onClick={handleLogout}>
              Se déconnecter
            </BrushLink>
            <button
              type="button"
              onClick={() => setCurtain('delete')}
              className="min-h-hit px-0 bg-transparent border-none font-body text-label font-bold text-vermillon cursor-pointer hover:underline"
            >
              Supprimer mon compte
            </button>
          </div>
        </div>
      </div>

      {curtain === 'firstName' && (
        <FirstNameCurtain
          user={user}
          notify={notify}
          onClose={() => setCurtain(null)}
          onSaved={(updated) => {
            setUser(updated)
            setCurtain(null)
          }}
        />
      )}

      {curtain === 'email' && (
        <EmailCurtain
          user={user}
          notify={notify}
          onClose={() => setCurtain(null)}
          onSaved={(updated) => {
            setUser(updated)
            setCurtain(null)
          }}
        />
      )}

      {curtain === 'password' && <PasswordCurtain notify={notify} onClose={() => setCurtain(null)} />}

      {curtain === 'delete' && (
        <CurtainConfirm
          title={'Supprimer ton compte ?'}
          confirmLabel={deletingAccount ? 'Suppression...' : 'Supprimer'}
          danger
          busy={deletingAccount}
          onConfirm={confirmAccountDeletion}
          onClose={closeDeleteConfirm}
        >
          <p className="m-0">Ton compte, tes decks, tes cartes et tout ton historique seront supprimés. Cette action est irréversible.</p>
          <Input label="Mot de passe" type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} required />
        </CurtainConfirm>
      )}
    </AppScreen>
  )
}

export default Profile
