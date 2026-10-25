import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Decks from './pages/Decks'
import DeckDetail from './pages/DeckDetail'
import Review from './pages/Review'
import Stats from './pages/Stats'
import Profile from './pages/Profile'
import Onboarding from './pages/Onboarding'
import { useAppearance } from './design-system/useAppearance'
import { useUiScale } from './design-system/useUiScale'
import { InkFilter } from './design-system/components/DeckSymbol'

function App() {
  // Apparence suivie sur tous les écrans (Auto qui change avec le système).
  useAppearance()
  // Échelle de l'interface sur écran ultra large (CON-75), suivie au redimensionnement.
  useUiScale()

  return (
    <BrowserRouter>
      {/* Filtre d'encre des symboles de deck (CON-92), une seule fois dans la page. */}
      <InkFilter />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/decks" element={<Decks />} />
        <Route path="/decks/:id" element={<DeckDetail />} />
        <Route path="/decks/:id/stats" element={<Stats />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/bienvenue" element={<Onboarding />} />
        <Route path="/decks/:id/review" element={<Review />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
