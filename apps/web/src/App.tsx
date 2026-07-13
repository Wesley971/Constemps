import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Decks from './pages/Decks'
import DeckDetail from './pages/DeckDetail'
import Review from './pages/Review'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/decks" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/decks" element={<Decks />} />
        <Route path="/decks/:id" element={<DeckDetail />} />
        <Route path="/decks/:id/review" element={<Review />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
