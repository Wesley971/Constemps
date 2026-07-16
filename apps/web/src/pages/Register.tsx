import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi, ApiError } from '../services/api'
import { Card } from '../design-system/components/Card'
import { Input } from '../design-system/components/Input'
import { Button } from '../design-system/components/Button'
import { Notification } from '../design-system/components/Notification'

function Register() {
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
      await authApi.register(email, password)
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
          Créer un compte
        </h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16, textAlign: 'left' }}>
            <Input label="Email" id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div style={{ marginBottom: 16, textAlign: 'left' }}>
            <Input
              label="Mot de passe (8 caractères minimum)"
              id="password"
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <div style={{ marginBottom: 16, textAlign: 'left' }}>
              <Notification tone="danger" title="Inscription impossible" message={error} />
            </div>
          )}
          <Button type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Création...' : 'Créer mon compte'}
          </Button>
        </form>
        <p style={{ font: 'var(--text-body-sm)', color: 'var(--inksoft)', marginTop: 20 }}>
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </Card>
    </div>
  )
}

export default Register
