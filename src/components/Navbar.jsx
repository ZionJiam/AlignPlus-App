import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home' },
  { to: '/leads', label: 'Follow Up Leads' },
  { to: '/calculator', label: 'Calculator Proposal' },
  { to: '/catalogue', label: 'Catalogue' },
]

export default function Navbar() {
  const { pathname } = useLocation()
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

          {/* Desktop links */}
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
          </div>
        )}
      </div>
    </nav>
  )
}
