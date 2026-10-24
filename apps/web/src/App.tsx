import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Decks from './pages/Decks'
import DeckDetail from './pages/DeckDetail'
import Review from './pages/Review'
import Stats from './pages/Stats'
import Profile from './pages/Profile'
import { useAppearance } from './design-system/useAppearance'

// Page de démonstration du design system (CON-57), servie seulement en
// développement : en build, import.meta.env.DEV vaut false, la branche est
// éliminée et le module n'est jamais emporté dans le bundle.
const Fondations = import.meta.env.DEV ? lazy(() => import('./pages/Fondations')) : null

function App() {
  // Apparence suivie sur tous les écrans (Auto qui change avec le système).
  useAppearance()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/decks" element={<Decks />} />
        <Route path="/decks/:id" element={<DeckDetail />} />
        <Route path="/decks/:id/stats" element={<Stats />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/decks/:id/review" element={<Review />} />
        {Fondations ? (
          <Route
            path="/fondations"
            element={
              <Suspense fallback={null}>
                <Fondations />
              </Suspense>
            }
          />
        ) : null}
      </Routes>
    </BrowserRouter>
  )
}

export default App
