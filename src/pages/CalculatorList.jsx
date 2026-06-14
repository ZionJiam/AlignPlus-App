import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function fmt(n) {
  return '$' + Number(n || 0).toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const INTEREST_RATES = { 36: 0.04, 60: 0.04, 72: 0.044 }

function computeProfit(d) {
  const leasingPeriod = d.leasingPeriod || 60
  const monthly = parseFloat(d.monthlyRepayment) || 0
  if (!monthly) return null

  const machineCost = parseFloat(d.machineCost) || 0

  const outstanding = (() => {
    if (d.clientMachines?.length) {
      const t = d.clientMachines.reduce((s, m) =>
        s + (parseFloat(m.finalPayment) || 0) + (parseFloat(m.monthlyLease) || 0) * (parseFloat(m.monthsLeft) || 0), 0)
      if (t > 0) return t
    }
    return (parseFloat(d.outstandingFinal) || 0) + (parseFloat(d.monthlyLease) || 0) * (parseFloat(d.monthsLeft) || 0)
  })()

  const printCharges = (parseFloat(d.bwCost) || 0) * (parseFloat(d.bwUnits) || 0) +
    (parseFloat(d.colorCost) || 0) * (parseFloat(d.colorUnits) || 0)
  const nonAchieved = printCharges + Math.abs(parseFloat(d.rebate) || 0) + Math.abs(parseFloat(d.tradeIn) || 0)
  const grandTotal = machineCost + outstanding + nonAchieved
  if (!grandTotal) return null

  const rate = INTEREST_RATES[leasingPeriod] ?? 0.04
  const years = leasingPeriod / 12
  const K = years * rate * 100
  const rv = (d.residualPct || 25) / 100
  const tp = monthly * leasingPeriod
  const num = tp * (100 / (100 + K))
  const den = (1 + rv) - (200 * rv / (100 + K))
  const gtf = den > 0 ? num / den : 0
  return gtf - grandTotal
}

export default function CalculatorList() {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchRecords = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('calculator_records')
      .select('id, client_name, created_at, updated_at, data')
      .order('updated_at', { ascending: false })
    setRecords(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchRecords() }, [])

  const deleteRecord = async (e, id, name) => {
    e.stopPropagation()
    if (!window.confirm(`Delete proposal for "${name}"?`)) return
    await supabase.from('calculator_records').delete().eq('id', id)
    fetchRecords()
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Calculator Proposals</h1>
          <p className="text-slate-400 text-sm mt-1">Your saved client proposals</p>
        </div>
        <button
          onClick={() => navigate('/calculator/new')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-mint hover:bg-brand-mint-dark text-white text-sm font-semibold transition-colors shadow-sm"
        >
          <span className="text-base leading-none">+</span>
          New Proposal
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-mint border-t-transparent rounded-full animate-spin" />
        </div>
      ) : records.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">🧮</div>
          <h2 className="text-lg font-semibold text-slate-700 mb-2">No proposals yet</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-xs">
            Create your first calculator proposal to start tracking leasing deals for your clients.
          </p>
          <button
            onClick={() => navigate('/calculator/new')}
            className="px-6 py-3 rounded-xl bg-brand-mint hover:bg-brand-mint-dark text-white font-semibold text-sm transition-colors"
          >
            Create First Proposal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {records.map(r => {
            const d = r.data || {}
            const profit = computeProfit(d)
            const updatedAt = new Date(r.updated_at)

            return (
              <div
                key={r.id}
                onClick={() => navigate(`/calculator/${r.id}`)}
                className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-mint transition-all cursor-pointer overflow-hidden"
              >
                {/* Accent bar */}
                <div className={`h-1.5 w-full ${profit != null ? (profit >= 0 ? 'bg-brand-mint' : 'bg-red-400') : 'bg-brand-mint'}`} />

                <div className="p-5">
                  {/* Client name + delete */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-800 group-hover:text-brand-mint-dark transition-colors">
                        {r.client_name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Updated {updatedAt.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => deleteRecord(e, r.id, r.client_name)}
                      className="text-xs text-slate-300 hover:text-red-500 transition-colors px-1 py-0.5 -mt-0.5"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Profit */}
                  {profit != null ? (
                    <div className={`flex items-center justify-between rounded-xl px-3 py-2 ${profit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                      <span className="text-xs text-slate-400">Profit</span>
                      <span className={`text-sm font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(profit)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-xl px-3 py-2 bg-slate-50">
                      <span className="text-xs text-slate-400">Profit</span>
                      <span className="text-xs text-slate-300">—</span>
                    </div>
                  )}

                  <div className="mt-4 text-brand-mint-dark text-xs font-semibold group-hover:underline">
                    Open →
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
