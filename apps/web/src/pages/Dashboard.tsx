import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi, dashboardApi, ApiError } from '../services/api'
import type { DashboardSummary } from '../types/dashboard'
import { AppHeader } from '../design-system/components/AppHeader'
import { AccountMilestoneBanner } from '../design-system/components/AccountMilestoneBanner'
import { Button, LinkButton } from '../design-system/components/Button'
import { Notification } from '../design-system/components/Notification'
import { PageSkeleton } from '../design-system/components/PageSkeleton'

function Dashboard() {
  const navigate = useNavigate()

  const [checkingAuth, setCheckingAuth] = useState(true)
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      try {
        await authApi.me()
      } catch {
        navigate('/login')
        return
      }

      try {
        const summaryData = await dashboardApi.getSummary()
        setSummary(summaryData)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Impossible de charger ton espace de reconnaissance')
      } finally {
        setCheckingAuth(false)
      }
    }

    void init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate])

  async function handleLogout() {
    await authApi.logout()
    navigate('/login')
  }

  if (checkingAuth) {
    return <PageSkeleton />
  }

  return (
    <div className="max-w-wrap mx-auto">
      <AppHeader
        actions={
          <Button variant="ghost" icon="ph:sign-out-bold" onClick={handleLogout}>
            Se déconnecter
          </Button>
        }
      />

      {error ? (
        <Notification tone="danger" title="Chargement impossible" message={error} />
      ) : (
        <>
          <div className="mt-3 mb-8">
            <p className="font-display text-display-md text-ink tracking-tight m-0 max-w-165">{summary?.message}</p>
            <div className="mt-5">
              <LinkButton to="/decks" icon="ph:cards-bold">
                Voir mes decks
              </LinkButton>
            </div>
          </div>

          {summary?.milestone && (
            <div className="max-w-165">
              <AccountMilestoneBanner message={summary.milestone.message} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Dashboard
