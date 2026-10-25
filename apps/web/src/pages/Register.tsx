import { useNavigate } from 'react-router-dom'
import { authApi, ApiError } from '../services/api'
import { useToast } from '../design-system/useToast'
import { FIRST_NAME_MESSAGE, isValidFirstName, normalizeFirstName } from '../lib/profile'
import type { WelcomeState } from './Onboarding'
import { AuthScreen } from './AuthScreen'

// Même écran que la connexion (CON-71), avec le prénom facultatif (CON-56).
function Register() {
  const navigate = useNavigate()
  const { toast, notify, dismiss } = useToast()

  async function handleRegister(email: string, password: string, rawFirstName: string) {
    // Mêmes règles que le profil (CON-76) : erreur en notification, formulaire intact.
    const firstName = normalizeFirstName(rawFirstName)
    if (!isValidFirstName(firstName)) {
      notify({ tone: 'danger', title: 'Prénom non valide', message: FIRST_NAME_MESSAGE })
      return
    }
    try {
      await authApi.register(email, password, firstName)
      // L'onboarding ne s'ouvre que par cet état de navigation : une seule fois,
      // juste après l'inscription, sans rien garder en base.
      const welcome: WelcomeState = { welcome: true, firstName }
      navigate('/bienvenue', { state: welcome })
    } catch (err) {
      notify({ tone: 'danger', title: 'Inscription impossible', message: err instanceof ApiError ? err.message : 'Une erreur est survenue' })
    }
  }

  return (
    <AuthScreen
      title="Inscription"
      submitLabel="Créer mon compte"
      pendingLabel="Création..."
      passwordHint="8 caractères minimum"
      passwordMinLength={8}
      withFirstName
      switchPrompt={'Déjà un compte ?'}
      switchLabel="Se connecter"
      switchTo="/login"
      toast={toast}
      onDismissToast={dismiss}
      onSubmit={handleRegister}
    />
  )
}

export default Register
