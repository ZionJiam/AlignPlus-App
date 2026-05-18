import { Link, useLocation } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home' },
  { to: '/leads', label: 'Follow Up Leads' },
  { to: '/calculator', label: 'Calculator Proposal' },
  { to: '/catalogue', label: 'Catalogue' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  return (
    <nav className="bg-blue-900 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 flex items-center gap-8 h-14">
        <span className="font-bold text-lg tracking-wide">AlignPlus CRM</span>
        <div className="flex gap-2">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                pathname === l.to
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
