import { useState } from 'react'
import { CATALOGUE_SECTIONS } from '../data/machines'

export default function Catalogue() {
  const [activeTab, setActiveTab] = useState('all')
  const [imgErrors, setImgErrors] = useState({})
  const [lightbox, setLightbox] = useState(null) // { name, image }

  const handleImgError = (key) => setImgErrors(prev => ({ ...prev, [key]: true }))

  const sections = activeTab === 'all'
    ? CATALOGUE_SECTIONS
    : CATALOGUE_SECTIONS.filter(s => s.key === activeTab)

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Photocopier Catalogue</h1>
        <p className="text-slate-400 text-sm mt-1">Available machines for leasing proposals</p>
      </div>

      {/* Brand tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
            activeTab === 'all'
              ? 'bg-brand-charcoal text-white border-brand-charcoal'
              : 'bg-white text-slate-600 border-slate-200 hover:border-brand-mint hover:text-brand-mint-dark'
          }`}
        >
          All
        </button>
        {CATALOGUE_SECTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveTab(s.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
              activeTab === s.key
                ? 'bg-brand-charcoal text-white border-brand-charcoal'
                : 'bg-white text-slate-600 border-slate-200 hover:border-brand-mint hover:text-brand-mint-dark'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Machine sections */}
      <div className="space-y-10">
        {sections.map(s => (
          <div key={s.key}>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-base font-bold text-slate-700">{s.label}</h2>
              <span className="text-xs text-slate-400">{s.machines.length} models</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {s.machines.map(m => {
                const imgKey = `${s.key}-${m.name}`
                const failed = imgErrors[imgKey]
                return (
                  <div
                    key={m.name}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-mint transition-all overflow-hidden flex flex-col"
                  >
                    {/* Image area — clickable */}
                    <button
                      className="bg-slate-50 flex items-center justify-center p-4 h-36 w-full group relative"
                      onClick={() => !failed && setLightbox({ name: m.name, image: m.image })}
                      disabled={failed}
                    >
                      {!failed ? (
                        <>
                          <img
                            src={m.image}
                            alt={m.name}
                            className="max-h-full max-w-full object-contain transition-transform group-hover:scale-105"
                            onError={() => handleImgError(imgKey)}
                          />
                          <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 rounded-t-2xl">
                            <span className="bg-white/90 text-slate-700 text-xs font-semibold px-2 py-1 rounded-lg shadow">
                              🔍 View
                            </span>
                          </span>
                        </>
                      ) : (
                        <div className="text-4xl text-slate-300">🖨️</div>
                      )}
                    </button>

                    {/* Name */}
                    <div className="px-3 py-2.5 text-center">
                      <p className="text-sm font-semibold text-slate-700 leading-tight">{m.name}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">{lightbox.name}</h3>
              <button
                onClick={() => setLightbox(null)}
                className="text-slate-400 hover:text-slate-700 transition-colors text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Large image */}
            <div className="bg-slate-50 flex items-center justify-center p-4 min-h-80">
              <img
                src={lightbox.image}
                alt={lightbox.name}
                className="w-full max-h-96 object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
