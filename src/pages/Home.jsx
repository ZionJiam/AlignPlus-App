import { Link } from 'react-router-dom'

const modules = [
  {
    to: '/leads',
    icon: '📋',
    title: 'Follow Up Leads',
    description: 'Track and manage your sales leads and follow-up tasks.',
    color: 'from-green-500 to-green-700',
    badge: 'Coming Soon',
  },
  {
    to: '/calculator',
    icon: '🧮',
    title: 'Calculator Proposal',
    description: 'Calculate monthly repayment values for photocopier machine leasing.',
    color: 'from-blue-500 to-blue-700',
    badge: null,
  },
  {
    to: '/catalogue',
    icon: '📖',
    title: 'Photocopier Catalogue',
    description: 'Browse the full range of photocopier machines available.',
    color: 'from-purple-500 to-purple-700',
    badge: 'Coming Soon',
  },
]

export default function Home() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Welcome to AlignPlus CRM</h1>
        <p className="text-slate-500 mt-1">Select a module to get started.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {modules.map(m => (
          <Link
            key={m.to}
            to={m.to}
            className="group relative bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow overflow-hidden border border-slate-200"
          >
            <div className={`h-2 w-full bg-gradient-to-r ${m.color}`} />
            <div className="p-6">
              <div className="text-4xl mb-3">{m.icon}</div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-slate-800">{m.title}</h2>
                {m.badge && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    {m.badge}
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-sm">{m.description}</p>
              <div className="mt-4 text-blue-600 text-sm font-medium group-hover:underline">
                Open →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
