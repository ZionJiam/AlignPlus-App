import { Link } from 'react-router-dom'

const modules = [
  {
    to: '/leads',
    icon: '📋',
    title: 'Follow Up Leads',
    description: 'Track and manage your sales leads and follow-up tasks.',
    accent: 'bg-brand-mint',
    badge: 'Coming Soon',
  },
  {
    to: '/calculator',
    icon: '🧮',
    title: 'Calculator Proposal',
    description: 'Calculate monthly repayment values for photocopier machine leasing.',
    accent: 'bg-brand-mint',
    badge: null,
  },
  {
    to: '/catalogue',
    icon: '📖',
    title: 'Photocopier Catalogue',
    description: 'Browse the full range of photocopier machines available.',
    accent: 'bg-brand-mint',
    badge: 'Coming Soon',
  },
]

export default function Home() {
  return (
    <div>
      <div className="mb-10">
        <img
          src="/images/align-plus-logo-full.png"
          alt="AlignPlus"
          className="h-12 w-auto mb-4"
        />
        <h1 className="text-2xl font-semibold text-brand-charcoal">Sales CRM</h1>
        <p className="text-slate-400 mt-1 text-sm">Select a module to get started.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {modules.map(m => (
          <Link
            key={m.to}
            to={m.to}
            className="group bg-white rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-slate-200 hover:border-brand-mint"
          >
            <div className={`h-1.5 w-full ${m.accent}`} />
            <div className="p-6">
              <div className="text-4xl mb-4">{m.icon}</div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-semibold text-brand-charcoal">{m.title}</h2>
                {m.badge && (
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                    {m.badge}
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">{m.description}</p>
              <div className="mt-5 text-brand-mint-dark text-sm font-semibold group-hover:underline">
                Open →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
