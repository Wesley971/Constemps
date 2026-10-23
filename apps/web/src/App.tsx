import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Decks from './pages/Decks'
import DeckDetail from './pages/DeckDetail'
import Review from './pages/Review'
import Stats from './pages/Stats'
import Profile from './pages/Profile'
import { TabBar } from './design-system/components/TabBar'

// Page de démonstration du design system (CON-57), servie seulement en
// développement : en build, import.meta.env.DEV vaut false, la branche est
// éliminée et le module n'est jamais emporté dans le bundle.
const Fondations = import.meta.env.DEV ? lazy(() => import('./pages/Fondations')) : null

// Marge des écrans pas encore refondus (CON-57) : reprend celle que portait le
// body avant la refonte, le temps que chaque lot fasse sortir ses écrans d'ici.
// Seule la révision y vit encore depuis CON-71, avec les onglets (CON-68).
function LegacyLayout() {
  return (
    <div className="min-h-dvh flex flex-col">
      <div className="flex-1 p-8 max-[720px]:p-4">
        <Outlet />
      </div>
      <div className="w-full max-w-120 mx-auto">
        <TabBar />
      </div>
    </div>
  )
}

function App() {
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
        <Route element={<LegacyLayout />}>
          <Route path="/decks/:id/review" element={<Review />} />
        </Route>
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
