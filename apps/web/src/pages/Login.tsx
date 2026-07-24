import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi, ApiError } from '../services/api'
import { Card } from '../design-system/components/Card'
import { Input } from '../design-system/components/Input'
import { Button } from '../design-system/components/Button'
import { Notification } from '../design-system/components/Notification'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await authApi.login(email, password)
      navigate('/decks')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-100 mt-20 mx-auto">
      <Card className="p-8 text-center">
        <h1 className="font-display text-display-md text-ink tracking-tight m-0 mb-6">Connexion</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4 text-left">
            <Input label="Email" id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="mb-4 text-left">
            <Input
              label="Mot de passe"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="mb-4 text-left">
              <Notification tone="danger" title="Connexion impossible" message={error} />
            </div>
          )}
          <Button type="submit" disabled={loading} className="w-full justify-center">
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>
        <p className="font-body text-body-sm text-inksoft mt-5">
          Pas encore de compte ? <Link to="/register">Créer un compte</Link>
        </p>
      </Card>
    </div>
  )
}

export default Login
