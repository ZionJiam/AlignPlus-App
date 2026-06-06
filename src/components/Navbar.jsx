import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const links = [
  { to: '/', label: 'Home' },
  { to: '/leads', label: 'Follow Up Leads' },
  { to: '/calculator', label: 'Calculator Proposal' },
  { to: '/catalogue', label: 'Catalogue' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" onClick={() => setOpen(false)}>
            <img
              src="/images/align-plus-logo-full.png"
              alt="AlignPlus"
              className="h-9 w-auto"
            />
          </Link>

          {/* Desktop links + user */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === l.to
                    ? 'bg-brand-mint-light text-brand-mint-dark font-semibold'
                    : 'text-brand-charcoal hover:bg-slate-100'
                }`}
              >
                {l.label}
              </Link>
            ))}

            {/* User + Sign out */}
            {user && (
              <div className="flex items-center gap-2 ml-3 pl-3 border-l border-slate-200">
                <span className="text-xs text-slate-400 max-w-[140px] truncate">{user.email}</span>
                <button
                  onClick={signOut}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>

          {/* Burger — mobile only */}
          <button
            onClick={() => setOpen(v => !v)}
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-lg hover:bg-slate-100 transition-colors gap-1.5"
            aria-label="Toggle menu"
          >
            <span className={`block w-5 h-0.5 bg-brand-charcoal transition-all duration-300 ${open ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-brand-charcoal transition-all duration-300 ${open ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-brand-charcoal transition-all duration-300 ${open ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>

        {/* Mobile dropdown */}
        {open && (
          <div className="md:hidden border-t border-slate-100 py-3 space-y-1">
            {links.map(l => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === l.to
                    ? 'bg-brand-mint-light text-brand-mint-dark font-semibold'
                    : 'text-brand-charcoal hover:bg-slate-100'
                }`}
              >
                {l.label}
              </Link>
            ))}

            {/* Mobile sign out */}
            {user && (
              <div className="px-4 pt-2 pb-1 border-t border-slate-100 mt-2 flex items-center justify-between">
                <span className="text-xs text-slate-400 truncate">{user.email}</span>
                <button
                  onClick={() => { signOut(); setOpen(false) }}
                  className="text-xs font-medium text-slate-500 hover:text-red-500 transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
