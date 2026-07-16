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
    <div style={{ maxWidth: 400, margin: '80px auto 0' }}>
      <Card style={{ padding: 32, textAlign: 'center' }}>
        <h1 style={{ font: 'var(--text-display-md)', color: 'var(--ink)', letterSpacing: 'var(--tracking-tight)', margin: '0 0 24px' }}>
          Connexion
        </h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16, textAlign: 'left' }}>
            <Input label="Email" id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div style={{ marginBottom: 16, textAlign: 'left' }}>
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
            <div style={{ marginBottom: 16, textAlign: 'left' }}>
              <Notification tone="danger" title="Connexion impossible" message={error} />
            </div>
          )}
          <Button type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>
        <p style={{ font: 'var(--text-body-sm)', color: 'var(--inksoft)', marginTop: 20 }}>
          Pas encore de compte ? <Link to="/register">Créer un compte</Link>
        </p>
      </Card>
    </div>
  )
}

export default Login
