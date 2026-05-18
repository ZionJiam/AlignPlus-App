import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Leads from './pages/Leads'
import Calculator from './pages/Calculator'
import Catalogue from './pages/Catalogue'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/catalogue" element={<Catalogue />} />
        </Routes>
      </main>
    </div>
  )
}
