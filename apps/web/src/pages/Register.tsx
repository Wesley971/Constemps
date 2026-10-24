import { useNavigate } from 'react-router-dom'
import { authApi, ApiError } from '../services/api'
import { useToast } from '../design-system/useToast'
import { AuthScreen } from './AuthScreen'

// Même écran que la connexion (CON-71).
function Register() {
  const navigate = useNavigate()
  const { toast, notify, dismiss } = useToast()

  async function handleRegister(email: string, password: string) {
    try {
      await authApi.register(email, password)
      navigate('/dashboard')
    } catch (err) {
      notify({ tone: 'danger', title: 'Inscription impossible', message: err instanceof ApiError ? err.message : 'Une erreur est survenue' })
    }
  }

  return (
    <AuthScreen
      submitLabel="Créer mon compte"
      pendingLabel="Création..."
      passwordHint="8 caractères minimum"
      passwordMinLength={8}
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
