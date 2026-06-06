import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Leads from './pages/Leads'
import CalculatorList from './pages/CalculatorList'
import Calculator from './pages/Calculator'
import Catalogue from './pages/Catalogue'
import Login from './pages/Login'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-slate-50">
                <Navbar />
                <main className="max-w-6xl mx-auto px-4 py-8">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/leads" element={<Leads />} />
                    <Route path="/calculator" element={<CalculatorList />} />
                    <Route path="/calculator/:id" element={<Calculator />} />
                    <Route path="/catalogue" element={<Catalogue />} />
                  </Routes>
                </main>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  )
}
