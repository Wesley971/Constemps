import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { authApi, ApiError } from '../services/api'
import { useToast } from '../design-system/useToast'
import { AuthScreen } from './AuthScreen'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast, notify, dismiss } = useToast()
  // Message transmis par une autre page lors de la redirection (après la
  // suppression du compte, CON-64). Lu une seule fois, à l'initialisation : en
  // développement, StrictMode rejoue l'effet ci-dessous, qui a déjà effacé l'état.
  const [notice] = useState(() => (location.state as { notice?: string } | null)?.notice ?? null)

  useEffect(() => {
    if (!notice) return
    notify({ tone: 'success', title: notice })
    // Efface l'état d'historique : un rechargement de /login ne doit plus
    // réafficher le message (CON-71).
    navigate(location.pathname, { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notice])

  async function handleLogin(email: string, password: string) {
    try {
      await authApi.login(email, password)
      navigate('/dashboard')
    } catch (err) {
      notify({ tone: 'danger', title: 'Connexion impossible', message: err instanceof ApiError ? err.message : 'Une erreur est survenue' })
    }
  }

  return (
    <AuthScreen
      title="Connexion"
      submitLabel="Se connecter"
      pendingLabel="Connexion..."
      switchPrompt={'Pas encore de compte ?'}
      switchLabel="Créer un compte"
      switchTo="/register"
      toast={toast}
      onDismissToast={dismiss}
      onSubmit={handleLogin}
    />
  )
}

export default Login
