import { useState, useMemo } from 'react'

const COPIER_PRESETS = {
  small: { bwCost: 0.015, colorCost: 0.24 },
  big: { bwCost: 0.008, colorCost: 0.13 },
}

const MACHINE_CATALOGUE = {
  konica: [
    { name: '3550i (Rebuilt)', cost: 2800 },
    { name: '300i (Rebuilt)', cost: 5000 },
    { name: '458 (Rebuilt)', cost: 4500 },
    { name: '360i (Rebuilt)', cost: 5300 },
    { name: '450i (Rebuilt)', cost: 9300 },
    { name: '550i (Rebuilt)', cost: 7300 },
    { name: '558 (Rebuilt)', cost: 4800 },
    { name: 'C250i (Rebuilt)', cost: 4300 },
  ],
  fujifilm: [
    { name: '3570 (Rebuilt)', cost: 4500 },
    { name: 'C4570 (Rebuilt)', cost: 6500 },
  ],
  fujifilm_new: [
    { name: 'C3061', cost: 6500 },
    { name: 'C3567', cost: 6500 },
    { name: 'C35571', cost: 11300 },
  ],
  epson: [
    { name: 'SC-T3130', cost: 6200 },
    { name: 'SC-T3435', cost: 7500 },
    { name: 'SC-T5130', cost: 7200 },
    { name: 'SC-T5130M', cost: 8000 },
  ],
}

function SectionCard({ title, children, collapsible = false, open, onToggle, summary }) {
  if (collapsible) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-5 overflow-hidden">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
        >
          <h2 className="text-base font-semibold text-brand-charcoal">{title}</h2>
          <div className="flex items-center gap-3">
            {!open && summary && (
              <span className="text-sm font-semibold text-brand-mint-dark">{summary}</span>
            )}
            <span className="text-slate-400 text-sm">{open ? '▲' : '▼'}</span>
          </div>
        </button>
        {open && (
          <div className="px-6 pb-6 border-t border-slate-100 pt-4">
            {children}
          </div>
        )}
      </div>
    )
  }
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-5">
      <h2 className="text-base font-semibold text-brand-charcoal mb-4 pb-2 border-b border-slate-100">
        {title}
      </h2>
      {children}
    </div>
  )
}

function Field({ label, children, hint }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  )
}

function NumInput({ value, onChange, prefix, placeholder, className = '' }) {
  return (
    <div className="relative flex items-center">
      {prefix && (
        <span className="absolute left-3 text-slate-400 text-sm select-none">{prefix}</span>
      )}
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || '0'}
        className={`w-full border border-slate-300 rounded-lg py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-mint ${prefix ? 'pl-7' : 'pl-3'} pr-3 ${className}`}
      />
    </div>
  )
}

function ResultRow({ label, value, highlight, sub }) {
  return (
    <div
      className={`flex justify-between items-center py-2 ${highlight ? 'border-t border-slate-200 mt-1 pt-3' : ''}`}
    >
      <span className={`text-sm ${highlight ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
        {label}
      </span>
      <span
        className={`text-sm font-medium ${sub ? 'text-red-500' : highlight ? 'text-brand-mint-dark text-base font-bold' : 'text-slate-700'}`}
      >
        {value}
      </span>
    </div>
  )
}

function fmt(n) {
  return '$' + Number(n || 0).toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function Calculator() {
  // --- Outstanding ---
  const [monthlyLease, setMonthlyLease] = useState('')
  const [monthsLeft, setMonthsLeft] = useState('')
  const [outstandingFinal, setOutstandingFinal] = useState('')

  // --- Machine ---
  const [machineCost, setMachineCost] = useState('')
  const [machineBrand, setMachineBrand] = useState('konica')
  const [selectedMachine, setSelectedMachine] = useState(null)

  // --- Print Charges ---
  const [copierType, setCopierType] = useState('big')
  const [bwCost, setBwCost] = useState(COPIER_PRESETS.big.bwCost)
  const [bwUnits, setBwUnits] = useState('')
  const [colorCost, setColorCost] = useState(COPIER_PRESETS.big.colorCost)
  const [colorUnits, setColorUnits] = useState('')

  // --- Adjustments ---
  const [rebate, setRebate] = useState('')
  const [rebatePerMonth, setRebatePerMonth] = useState(0)
  const [tradeIn, setTradeIn] = useState('')

  const handleSliderChange = (val) => {
    const n = Number(val)
    setRebatePerMonth(n)
    setRebate(n > 0 ? String(-(n * 30)) : '')
  }

  const handleRebateManual = (val) => {
    setRebate(val)
    const abs = Math.abs(parseFloat(val) || 0)
    const nearest = Math.min(500, Math.max(0, Math.round(abs / 30 / 10) * 10))
    setRebatePerMonth(nearest)
  }

  // --- Leasing Calculator ---
  const [leasingPeriod, setLeasingPeriod] = useState(60)
  const [residualValueAmt, setResidualValueAmt] = useState('')

  // --- Profit ---
  const [monthlyRepayment, setMonthlyRepayment] = useState('')
  const [residualPct, setResidualPct] = useState(25)

  // --- Client Profile ---
  const [showClientProfile, setShowClientProfile] = useState(false)
  const [clientMachines, setClientMachines] = useState([
    { id: 1, name: '', ownership: 'lease', purchaseCost: '', years: '5', monthlyLease: '', monthsLeft: '', finalPayment: '' }
  ])
  const [clientBwUnits, setClientBwUnits] = useState('')
  const [clientBwCost, setClientBwCost] = useState('')
  const [clientColorUnits, setClientColorUnits] = useState('')
  const [clientColorCost, setClientColorCost] = useState('')

  const addClientMachine = () => setClientMachines(prev => [
    ...prev,
    { id: Date.now(), name: '', ownership: 'lease', purchaseCost: '', years: '5', monthlyLease: '', monthsLeft: '', finalPayment: '' }
  ])
  const removeClientMachine = (id) => setClientMachines(prev => prev.filter(m => m.id !== id))
  const updateClientMachine = (id, field, value) => setClientMachines(prev =>
    prev.map(m => m.id === id ? { ...m, [field]: value } : m)
  )

  // --- Comparison ---
  const [showComparison, setShowComparison] = useState(false)

  // --- Collapsible sections ---
  const [showGrandTotal, setShowGrandTotal] = useState(false)
  const [showLeasing, setShowLeasing] = useState(false)

  const handleCopierToggle = (type) => {
    setCopierType(type)
    setBwCost(COPIER_PRESETS[type].bwCost)
    setColorCost(COPIER_PRESETS[type].colorCost)
  }

  const totalClientOutstanding = useMemo(() => {
    return clientMachines.reduce((sum, m) => {
      return sum + (parseFloat(m.finalPayment) || 0) + (parseFloat(m.monthlyLease) || 0) * (parseFloat(m.monthsLeft) || 0)
    }, 0)
  }, [clientMachines])

  const outstanding = useMemo(() => {
    if (totalClientOutstanding > 0) return totalClientOutstanding
    const lease = parseFloat(monthlyLease) || 0
    const months = parseFloat(monthsLeft) || 0
    const final = parseFloat(outstandingFinal) || 0
    return final + lease * months
  }, [totalClientOutstanding, monthlyLease, monthsLeft, outstandingFinal])

  const printCharges = useMemo(() => {
    const bw = (parseFloat(bwCost) || 0) * (parseFloat(bwUnits) || 0)
    const color = (parseFloat(colorCost) || 0) * (parseFloat(colorUnits) || 0)
    return bw + color
  }, [bwCost, bwUnits, colorCost, colorUnits])

  const nonAchievedPrice = useMemo(() => {
    return printCharges + Math.abs(parseFloat(rebate) || 0) + Math.abs(parseFloat(tradeIn) || 0)
  }, [printCharges, rebate, tradeIn])

  const grandTotal = useMemo(() => {
    return (parseFloat(machineCost) || 0) + outstanding + nonAchievedPrice
  }, [machineCost, outstanding, nonAchievedPrice])

  // Total payments (monthly × period) — used as intermediate in GTF formula
  const totalPayments = useMemo(() => {
    return (parseFloat(monthlyRepayment) || 0) * leasingPeriod
  }, [monthlyRepayment, leasingPeriod])

  const repaymentCeiling = useMemo(() => {
    const mc = parseFloat(machineCost) || 0
    return (outstanding + mc * 3) / 60
  }, [outstanding, machineCost])

  // --- Leasing Calculator computed values ---
  const INTEREST_RATES = { 36: 0.04, 60: 0.04, 72: 0.044 }
  const leasingRate = INTEREST_RATES[leasingPeriod]                         // r
  const leasingYears = leasingPeriod / 12                                   // y = months / 12
  const normalizedRate = leasingRate * leasingYears + 1                     // r × y + 1
  const defaultResidual = grandTotal * 0.25
  const leasingRV = parseFloat(residualValueAmt) || defaultResidual         // editable RV
  const leasingRVPct = grandTotal > 0 ? (leasingRV / grandTotal) * 100 : 0
  // Part A: total interest charged on the residual value (held at full balloon amount throughout)
  const leasingPartA = leasingRV * leasingRate * 2 * leasingYears
  // Part B: total repayment of the non-residual balance (principal + its flat interest)
  const leasingPartB = (grandTotal - leasingRV) * normalizedRate
  // Monthly = (Part A + Part B) ÷ Period
  const leasingMonthly = (leasingPartA + leasingPartB) / leasingPeriod

  // --- Profit Calculator: Grand Total Financed (reverse leasing formula) ---
  // K = total flat interest as % of principal over full term (e.g. 5yr × 4% × 100 = 20)
  const K = leasingYears * leasingRate * 100
  const rvFraction = residualPct / 100
  const grandTotalFinanced = useMemo(() => {
    if (totalPayments === 0) return 0
    const num = totalPayments * (100 / (100 + K))
    const den = (1 + rvFraction) - (200 * rvFraction / (100 + K))
    return den > 0 ? num / den : 0
  }, [totalPayments, K, rvFraction])

  const residualValue = useMemo(() => grandTotalFinanced * rvFraction, [grandTotalFinanced, rvFraction])
  const profit = useMemo(() => grandTotalFinanced - grandTotal, [grandTotalFinanced, grandTotal])

  const rebateSavingPerMonth = useMemo(() => {
    return Math.abs(parseFloat(rebate) || 0) / 30
  }, [rebate])

  const netCostPerMonth = useMemo(() => {
    return (parseFloat(monthlyRepayment) || 0) - rebateSavingPerMonth
  }, [monthlyRepayment, rebateSavingPerMonth])

  const clientBwMonthly = (parseFloat(clientBwUnits) || 0) * 30
  const clientColorMonthly = (parseFloat(clientColorUnits) || 0) * 30
  const hasClientProfile = clientMachines.some(m => m.name || m.purchaseCost || m.monthlyLease) || clientBwUnits || clientColorUnits

  const clientMonthlyPrintCost = useMemo(() => {
    return (parseFloat(clientBwCost) || 0) * (parseFloat(clientBwUnits) || 0) +
           (parseFloat(clientColorCost) || 0) * (parseFloat(clientColorUnits) || 0)
  }, [clientBwCost, clientBwUnits, clientColorCost, clientColorUnits])

  const currentMonthlyCost = useMemo(() => {
    const machineCosts = clientMachines.reduce((sum, m) => {
      if (m.ownership === 'purchase') {
        const years = parseFloat(m.years) || 5
        const cost = parseFloat(m.purchaseCost) || 0
        return sum + (cost / (years * 12))
      }
      return sum + (parseFloat(m.monthlyLease) || 0)
    }, 0)
    return machineCosts + clientMonthlyPrintCost
  }, [clientMachines, clientMonthlyPrintCost])

  const newMonthlyCost = useMemo(() => {
    return rebateSavingPerMonth > 0 ? netCostPerMonth : (parseFloat(monthlyRepayment) || 0)
  }, [rebateSavingPerMonth, netCostPerMonth, monthlyRepayment])

  const monthlySavings = useMemo(() => currentMonthlyCost - newMonthlyCost, [currentMonthlyCost, newMonthlyCost])
  const savingsPct = useMemo(() => {
    if (!currentMonthlyCost) return 0
    return (monthlySavings / currentMonthlyCost) * 100
  }, [monthlySavings, currentMonthlyCost])

  // --- Smart Quote Recommendation ---
  // Floor: minimum monthly to break even (leasing formula)
  const breakEvenMonthly = leasingMonthly
  // Target: highest monthly that still saves client 25% (net of rebate)
  const savingTarget25 = currentMonthlyCost > 0
    ? currentMonthlyCost * 0.75 + rebateSavingPerMonth
    : null
  // Recommended: max we can charge while saving client 25%, capped at ceiling
  const recommendedMonthly = savingTarget25 !== null
    ? Math.min(savingTarget25, repaymentCeiling)
    : repaymentCeiling
  // Is the recommended quote profitable (above break-even)?
  const quoteIsProfitable = recommendedMonthly >= breakEvenMonthly
  // What % does client actually save at recommended monthly?
  const recommendedNetCost = recommendedMonthly - rebateSavingPerMonth
  const recommendedSavingPct = currentMonthlyCost > 0
    ? ((currentMonthlyCost - recommendedNetCost) / currentMonthlyCost) * 100
    : null
  // Helper: reverse leasing formula → principal financed from a given monthly amount
  const calcGTF = (monthly) => {
    if (!monthly) return 0
    const tp = monthly * leasingPeriod
    const num = tp * (100 / (100 + K))
    const den = (1 + rvFraction) - (200 * rvFraction / (100 + K))
    return den > 0 ? num / den : 0
  }
  // Profit at recommended monthly
  const recommendedProfit = calcGTF(recommendedMonthly) - grandTotal

  // --- Ceiling + Rebate scenario (when quote is unprofitable) ---
  // Push monthly to ceiling, then calculate rebate needed to still give client 25% saving
  const grandTotalExRebate = grandTotal - Math.abs(parseFloat(rebate) || 0)
  const ceilMonthly = repaymentCeiling
  // Rebate per month needed: ceiling − (client cost × 75%)
  const ceilRebatePerMonth = currentMonthlyCost > 0
    ? Math.max(0, ceilMonthly - currentMonthlyCost * 0.75)
    : 0
  const ceilRebateTotal = ceilRebatePerMonth * 30
  // Grand total with this recommended rebate (swap out existing rebate for the new one)
  const ceilGrandTotal = grandTotalExRebate + ceilRebateTotal
  const ceilProfit = calcGTF(ceilMonthly) - ceilGrandTotal
  const ceilClientNetCost = ceilMonthly - ceilRebatePerMonth
  const ceilSavingPct = currentMonthlyCost > 0
    ? ((currentMonthlyCost - ceilClientNetCost) / currentMonthlyCost) * 100
    : null

  return (
    <div>
      {/* Client Profile Drawer */}
      {showClientProfile && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowClientProfile(false)}
          />
          <div className="relative z-50 w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white">
              <div>
                <h2 className="text-base font-bold text-slate-800">Client's Current Setup</h2>
                <p className="text-xs text-slate-400 mt-0.5">Record existing machine &amp; usage for comparison</p>
              </div>
              <button
                onClick={() => setShowClientProfile(false)}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Client Machines — multiple */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-slate-600">Client's Machines</p>
                  <button
                    onClick={addClientMachine}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-brand-mint text-white text-xs font-semibold hover:bg-brand-mint-dark transition-colors"
                  >
                    + Add Machine
                  </button>
                </div>

                <div className="space-y-4">
                  {clientMachines.map((m, idx) => (
                    <div key={m.id} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 px-3 py-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Machine {idx + 1}</span>
                        {clientMachines.length > 1 && (
                          <button
                            onClick={() => removeClientMachine(m.id)}
                            className="text-xs text-red-400 hover:text-red-600"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="p-3 space-y-3">
                        {/* Name */}
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Machine Name</label>
                          <input
                            type="text"
                            value={m.name}
                            onChange={e => updateClientMachine(m.id, 'name', e.target.value)}
                            placeholder="e.g. Konica 458, Ricoh 2501..."
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-mint"
                          />
                        </div>

                        {/* Ownership toggle */}
                        <div className="flex gap-2">
                          {[{ key: 'lease', label: 'Leased' }, { key: 'purchase', label: 'Purchased' }].map(o => (
                            <button
                              key={o.key}
                              onClick={() => updateClientMachine(m.id, 'ownership', o.key)}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                m.ownership === o.key
                                  ? 'bg-brand-charcoal text-white border-brand-charcoal'
                                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {o.label}
                            </button>
                          ))}
                        </div>

                        {/* Purchase: price + years */}
                        {m.ownership === 'purchase' && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">Purchase Price ($)</label>
                              <NumInput value={m.purchaseCost} onChange={v => updateClientMachine(m.id, 'purchaseCost', v)} prefix="$" placeholder="8000" />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">Years in Use</label>
                              <NumInput value={m.years} onChange={v => updateClientMachine(m.id, 'years', v)} placeholder="5" />
                            </div>
                            {m.purchaseCost && (
                              <div className="col-span-2 bg-brand-mint-light border border-brand-mint rounded-lg px-3 py-1.5 text-xs text-brand-mint-dark">
                                Monthly depreciation: {fmt((parseFloat(m.purchaseCost) || 0) / ((parseFloat(m.years) || 5) * 12))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Outstanding fields — required for lease, optional for purchase */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-slate-400 uppercase">
                            {m.ownership === 'lease' ? 'Outstanding' : 'Outstanding (if any)'}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">Monthly Lease ($)</label>
                              <NumInput value={m.monthlyLease} onChange={v => updateClientMachine(m.id, 'monthlyLease', v)} prefix="$" placeholder="200" />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">Months Remaining</label>
                              <NumInput value={m.monthsLeft} onChange={v => updateClientMachine(m.id, 'monthsLeft', v)} placeholder="23" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Outstanding Final Payment ($)</label>
                            <NumInput value={m.finalPayment} onChange={v => updateClientMachine(m.id, 'finalPayment', v)} prefix="$" placeholder="3000" />
                          </div>
                          {(m.monthlyLease || m.monthsLeft || m.finalPayment) && (
                            <div className="bg-slate-50 rounded-lg px-3 py-1.5 text-xs text-slate-500 flex justify-between">
                              <span>Machine outstanding</span>
                              <span className="font-semibold text-slate-700">
                                {fmt((parseFloat(m.finalPayment)||0) + (parseFloat(m.monthlyLease)||0) * (parseFloat(m.monthsLeft)||0))}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total machine monthly cost */}
                {clientMachines.some(m => m.purchaseCost || m.monthlyLease) && (
                  <div className="mt-3 bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-500 flex justify-between">
                    <span>Combined machine monthly cost</span>
                    <span className="font-semibold text-slate-700">
                      {fmt(clientMachines.reduce((sum, m) => {
                        if (m.ownership === 'purchase') return sum + (parseFloat(m.purchaseCost) || 0) / ((parseFloat(m.years) || 5) * 12)
                        return sum + (parseFloat(m.monthlyLease) || 0)
                      }, 0))}
                    </span>
                  </div>
                )}

                {/* Total outstanding across all machines */}
                {(() => {
                  const totalOutstanding = clientMachines.reduce((sum, m) => {
                    return sum + (parseFloat(m.finalPayment) || 0) + (parseFloat(m.monthlyLease) || 0) * (parseFloat(m.monthsLeft) || 0)
                  }, 0)
                  return totalOutstanding > 0 ? (
                    <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs flex justify-between">
                      <span className="text-amber-700 font-semibold">Total Outstanding (all machines)</span>
                      <span className="font-bold text-amber-800">{fmt(totalOutstanding)}</span>
                    </div>
                  ) : null
                })()}
              </div>

              {/* Current Print Volume */}
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-3">Current Print Volume</p>
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Black &amp; White</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Monthly Units</label>
                        <NumInput value={clientBwUnits} onChange={setClientBwUnits} placeholder="500" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Cost per Copy ($)</label>
                        <NumInput value={clientBwCost} onChange={setClientBwCost} prefix="$" placeholder="0.015" />
                      </div>
                    </div>
                    {clientBwUnits && (
                      <div className="mt-2 text-xs text-brand-mint-dark font-medium">
                        Monthly spend: {fmt((parseFloat(clientBwCost) || 0) * (parseFloat(clientBwUnits) || 0))}
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Colour</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Monthly Units</label>
                        <NumInput value={clientColorUnits} onChange={setClientColorUnits} placeholder="200" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Cost per Copy ($)</label>
                        <NumInput value={clientColorCost} onChange={setClientColorCost} prefix="$" placeholder="0.24" />
                      </div>
                    </div>
                    {clientColorUnits && (
                      <div className="mt-2 text-xs text-brand-mint-dark font-medium">
                        Monthly spend: {fmt((parseFloat(clientColorCost) || 0) * (parseFloat(clientColorUnits) || 0))}
                      </div>
                    )}
                  </div>
                </div>

                {(clientBwUnits || clientColorUnits) && (
                  <div className="mt-3 bg-brand-mint-light border border-brand-mint rounded-xl px-4 py-3">
                    <p className="text-xs font-semibold text-brand-mint-dark mb-2">Total Monthly Print Cost</p>
                    <p className="text-lg font-bold text-brand-charcoal">
                      {fmt(
                        (parseFloat(clientBwCost) || 0) * (parseFloat(clientBwUnits) || 0) +
                        (parseFloat(clientColorCost) || 0) * (parseFloat(clientColorUnits) || 0)
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Calculator Proposal</h1>
          <p className="text-slate-400 text-sm mt-1">Photocopier Leasing Monthly Repayment</p>
        </div>
        <button
          onClick={() => setShowClientProfile(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium shadow-sm border transition-colors ${
            hasClientProfile
              ? 'bg-brand-charcoal text-white border-brand-charcoal hover:bg-brand-charcoal-dark'
              : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
          }`}
        >
          <span>👤</span>
          <span>Client's Current Setup</span>
          {hasClientProfile && <span className="w-2 h-2 rounded-full bg-white/70 inline-block" />}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          {/* 1. Outstanding */}
          <SectionCard title="1. Current Outstanding">
            {totalClientOutstanding > 0 ? (
              /* Auto-populated from Client Setup */
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xs bg-brand-mint-light text-brand-mint-dark font-semibold px-2 py-0.5 rounded-full">
                    👤 From Client Setup
                  </span>
                  <span className="text-xs text-slate-400">auto-calculated from machines</span>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden mb-3">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Per Machine Breakdown</p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {clientMachines.map((m, idx) => {
                      const machineOutstanding = (parseFloat(m.finalPayment) || 0) + (parseFloat(m.monthlyLease) || 0) * (parseFloat(m.monthsLeft) || 0)
                      if (machineOutstanding === 0) return null
                      return (
                        <div key={m.id} className="px-4 py-2.5 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-700">{m.name || `Machine ${idx + 1}`}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {m.monthlyLease && m.monthsLeft
                                ? `${fmt(m.monthlyLease)}/mo × ${m.monthsLeft} mo`
                                : ''}
                              {m.finalPayment ? ` + ${fmt(m.finalPayment)} final` : ''}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-slate-700">{fmt(machineOutstanding)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex justify-between items-center">
                  <span className="text-sm font-semibold text-amber-700">Total Outstanding</span>
                  <span className="text-lg font-bold text-amber-800">{fmt(totalClientOutstanding)}</span>
                </div>
              </div>
            ) : (
              /* Manual entry fallback */
              <div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Monthly Lease ($)">
                    <NumInput value={monthlyLease} onChange={setMonthlyLease} prefix="$" placeholder="200" />
                  </Field>
                  <Field label="Months Remaining">
                    <NumInput value={monthsLeft} onChange={setMonthsLeft} placeholder="23" />
                  </Field>
                </div>
                <Field label="Outstanding Final Payment ($)">
                  <NumInput value={outstandingFinal} onChange={setOutstandingFinal} prefix="$" placeholder="3000" />
                </Field>
                <div className="bg-slate-50 rounded-lg px-4 py-3 mt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Remaining Lease</span>
                    <span className="font-medium text-slate-700">
                      {fmt((parseFloat(monthlyLease) || 0) * (parseFloat(monthsLeft) || 0))}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-slate-500">Final Payment</span>
                    <span className="font-medium text-slate-700">{fmt(outstandingFinal)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t border-slate-200 mt-2 pt-2">
                    <span className="text-slate-700">Total Outstanding</span>
                    <span className="text-brand-mint-dark">{fmt(outstanding)}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  💡 Fill in <strong>Client's Current Setup</strong> to auto-populate from machine data.
                </p>
              </div>
            )}
          </SectionCard>

          {/* 2. Machine Cost */}
          <SectionCard title="2. Machine Cost">
            {clientMachines.some(m => m.name) && (
              <div className="mb-4 bg-brand-mint-light border border-brand-mint rounded-xl overflow-hidden">
                <div className="px-3 py-2 bg-brand-mint/20">
                  <p className="text-xs font-semibold text-brand-mint-dark">👤 Client's Current Machines</p>
                </div>
                <div className="divide-y divide-brand-mint/30">
                  {clientMachines.filter(m => m.name).map(m => (
                    <div key={m.id} className="px-3 py-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-brand-charcoal">{m.name}</span>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${m.ownership === 'purchase' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                          {m.ownership === 'purchase' ? 'Purchased' : 'Leased'}
                        </span>
                        <span>
                          {m.ownership === 'purchase'
                            ? fmt((parseFloat(m.purchaseCost) || 0) / ((parseFloat(m.years) || 5) * 12)) + '/mo'
                            : fmt(m.monthlyLease) + '/mo'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { key: 'konica',       label: 'Konica Minolta',    sub: 'Rebuilt' },
                { key: 'fujifilm',     label: 'FujiFilm',          sub: 'Rebuilt' },
                { key: 'fujifilm_new', label: 'FujiFilm',          sub: 'Brand New' },
                { key: 'epson',        label: 'Epson',              sub: 'Brand New' },
              ].map(b => (
                <button
                  key={b.key}
                  onClick={() => { setMachineBrand(b.key); setSelectedMachine(null) }}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left border ${
                    machineBrand === b.key
                      ? 'bg-brand-mint text-white border-brand-mint'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-brand-mint hover:bg-brand-mint-light hover:text-brand-mint-dark'
                  }`}
                >
                  <span className="block font-semibold">{b.label}</span>
                  <span className={`text-xs ${machineBrand === b.key ? 'text-white/70' : 'text-slate-400'}`}>{b.sub}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-1.5 mb-4">
              {MACHINE_CATALOGUE[machineBrand].map(m => (
                <button
                  key={m.name}
                  onClick={() => { setSelectedMachine(m.name); setMachineCost(String(m.cost)) }}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-colors ${
                    selectedMachine === m.name
                      ? 'border-brand-mint bg-brand-mint-light text-brand-mint-dark font-medium'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-brand-mint hover:bg-brand-mint-light'
                  }`}
                >
                  <span className="font-medium">{m.name}</span>
                  <span className="text-slate-400">${m.cost.toLocaleString()}</span>
                </button>
              ))}
            </div>
            <Field label="Machine Price ($)" hint="Select above or enter manually">
              <NumInput value={machineCost} onChange={v => { setMachineCost(v); setSelectedMachine(null) }} prefix="$" placeholder="5000" />
            </Field>
          </SectionCard>

          {/* 3. Free Copies / Print Charges */}
          <SectionCard title="3. Free Copy Charges">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => handleCopierToggle('small')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  copierType === 'small'
                    ? 'bg-brand-mint text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Small Copier
              </button>
              <button
                onClick={() => handleCopierToggle('big')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  copierType === 'big'
                    ? 'bg-brand-mint text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Big Copier
              </button>
            </div>

            <div className="grid grid-cols-2 gap-x-4">
              <p className="col-span-2 text-xs font-semibold text-slate-400 uppercase mb-2">Black &amp; White</p>
              <Field label="Cost per Copy ($)">
                <NumInput value={bwCost} onChange={setBwCost} prefix="$" placeholder="0.008" />
              </Field>
              <Field label="Free Units">
                <NumInput value={bwUnits} onChange={setBwUnits} placeholder="1000" />
              </Field>

              <p className="col-span-2 text-xs font-semibold text-slate-400 uppercase mb-2 mt-1">Colour</p>
              <Field label="Cost per Copy ($)">
                <NumInput value={colorCost} onChange={setColorCost} prefix="$" placeholder="0.08" />
              </Field>
              <Field label="Free Units">
                <NumInput value={colorUnits} onChange={setColorUnits} placeholder="500" />
              </Field>
            </div>

            <div className="bg-slate-50 rounded-lg px-4 py-3 mt-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">B&amp;W Charge</span>
                <span className="font-medium text-slate-700">
                  {fmt((parseFloat(bwCost) || 0) * (parseFloat(bwUnits) || 0))}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-slate-500">Colour Charge</span>
                <span className="font-medium text-slate-700">
                  {fmt((parseFloat(colorCost) || 0) * (parseFloat(colorUnits) || 0))}
                </span>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t border-slate-200 mt-2 pt-2">
                <span className="text-slate-700">Total Print Charges</span>
                <span className="text-brand-mint-dark">{fmt(printCharges)}</span>
              </div>
            </div>

            {(clientBwUnits || clientColorUnits) && (
              <div className="mt-3 border border-brand-mint rounded-xl overflow-hidden">
                <div className="bg-brand-mint-light px-4 py-2 flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-brand-mint-dark">👤 Client Volume Reference</span>
                  <span className="text-xs text-brand-mint">(monthly × 30 months)</span>
                </div>
                <div className="px-4 py-3 bg-white space-y-2">
                  {clientBwUnits && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">B&amp;W — {Number(clientBwUnits).toLocaleString()}/mo × 30</span>
                      <span className="font-semibold text-brand-mint-dark">{clientBwMonthly.toLocaleString()} copies</span>
                    </div>
                  )}
                  {clientColorUnits && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Colour — {Number(clientColorUnits).toLocaleString()}/mo × 30</span>
                      <span className="font-semibold text-brand-mint-dark">{clientColorMonthly.toLocaleString()} copies</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </SectionCard>

          {/* 4 & 5. Rebate & Trade-in */}
          <SectionCard title="4. Adjustments">
            {/* Rebate Slider */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-600">Rebate per Month</label>
                <div className="flex items-center gap-2">
                  {rebatePerMonth > 0 && (
                    <span className="text-xs text-slate-400">→ Total rebate: <span className="font-semibold text-slate-600">{fmt(rebatePerMonth * 30)}</span></span>
                  )}
                  <span className={`text-base font-bold px-2 py-0.5 rounded-lg ${rebatePerMonth > 0 ? 'text-green-700 bg-green-100' : 'text-slate-400 bg-slate-100'}`}>
                    {rebatePerMonth > 0 ? `$${rebatePerMonth}/mo` : 'None'}
                  </span>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={500}
                step={10}
                value={rebatePerMonth}
                onChange={e => handleSliderChange(e.target.value)}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-green-600 bg-slate-200"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>None</span>
                <span>$30/mo ($900)</span>
                <span>$250/mo</span>
                <span>$500/mo ($15,000)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Rebate ($)" hint="Or type manually">
                <NumInput value={rebate} onChange={handleRebateManual} prefix="$" placeholder="-900" />
              </Field>
              <Field label="Trade-in Value ($)" hint="Enter as negative to reduce total">
                <NumInput value={tradeIn} onChange={setTradeIn} prefix="$" placeholder="-1000" />
              </Field>
            </div>
            {(parseFloat(rebate) || 0) !== 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mt-1">
                <p className="text-xs font-semibold text-green-700 mb-0.5">Customer Saving from Rebate</p>
                <p className="text-base font-bold text-green-700">
                  {fmt(rebateSavingPerMonth)} <span className="text-sm font-normal">/ month</span>
                </p>
                <p className="text-xs text-green-600 mt-0.5">
                  Rebate {fmt(Math.abs(parseFloat(rebate) || 0))} ÷ 30 months renewal cycle
                </p>
              </div>
            )}
          </SectionCard>
        </div>

        <div>
          {/* Grand Total Summary */}
          <SectionCard title="6. Grand Total Summary" collapsible open={showGrandTotal} onToggle={() => setShowGrandTotal(v => !v)} summary={fmt(grandTotal)}>
            <ResultRow label="Machine Cost" value={fmt(machineCost)} />
            <ResultRow label="Total Outstanding" value={fmt(outstanding)} />

            {/* Non-Achieved Price block */}
            <div className="my-3 border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-2">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Non-Achieved Price</p>
                  <span className="text-sm font-semibold text-slate-700">{fmt(nonAchievedPrice)}</span>
                </div>
              </div>
              <div className="px-4 py-3 space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Free Copy Charges</span>
                  <span className="font-medium text-slate-600">{fmt(printCharges)}</span>
                </div>
                {Math.abs(parseFloat(rebate) || 0) > 0 && (
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Rebate</span>
                    <span className="font-medium text-slate-600">{fmt(Math.abs(parseFloat(rebate) || 0))}</span>
                  </div>
                )}
                {Math.abs(parseFloat(tradeIn) || 0) > 0 && (
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Trade-in</span>
                    <span className="font-medium text-slate-600">{fmt(Math.abs(parseFloat(tradeIn) || 0))}</span>
                  </div>
                )}
              </div>
            </div>

            <ResultRow label="Grand Total (Financed)" value={fmt(grandTotal)} highlight />
          </SectionCard>

          {/* Leasing Calculator */}
          <SectionCard title="7. Leasing Repayment Calculator" collapsible open={showLeasing} onToggle={() => setShowLeasing(v => !v)} summary={grandTotal > 0 ? `${fmt(leasingMonthly)}/mo` : undefined}>

            {/* Row 30 — Finance Amount */}
            <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 mb-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Finance Amount</p>
                <p className="text-xs text-slate-400 mt-0.5">= Grand Total Price</p>
              </div>
              <span className="text-base font-bold text-brand-charcoal">{fmt(grandTotal)}</span>
            </div>

            {/* Row 31 — Leasing Period + Normalized Rate */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-600 mb-2">Leasing Period</label>
              <div className="flex gap-2">
                {[36, 60, 72].map(m => {
                  const r = INTEREST_RATES[m]
                  const y = m / 12
                  const nr = r * y + 1
                  return (
                    <button
                      key={m}
                      onClick={() => { setLeasingPeriod(m); setResidualValueAmt('') }}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                        leasingPeriod === m
                          ? 'bg-brand-charcoal text-white border-brand-charcoal'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-brand-mint hover:text-brand-mint-dark'
                      }`}
                    >
                      <span className="block">{m} mo</span>
                      <span className={`text-xs font-normal ${leasingPeriod === m ? 'text-slate-300' : 'text-slate-400'}`}>
                        ×{nr.toFixed(3)}
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Normalized rate = r × (months÷12) + 1 — the total repayment factor per $1 financed
              </p>
            </div>

            {/* Row 32 — Interest Rate */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 rounded-xl px-4 py-3">
                <p className="text-xs text-slate-400 mb-1">Interest Rate (p.a.)</p>
                <p className="text-lg font-bold text-brand-charcoal">{(leasingRate * 100).toFixed(1)}%</p>
              </div>
              <div className="bg-brand-mint-light border border-brand-mint rounded-xl px-4 py-3">
                <p className="text-xs text-brand-mint-dark mb-1">Normalized Rate</p>
                <p className="text-lg font-bold text-brand-charcoal">{normalizedRate.toFixed(3)}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {(leasingRate*100).toFixed(1)}% × {leasingYears} + 1
                </p>
              </div>
            </div>

            {/* Row 33 — Residual Value */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-slate-600">Residual Value</label>
                <div className="flex items-center gap-2">
                  {leasingRVPct > 0 && (
                    <span className="text-xs text-slate-400">{leasingRVPct.toFixed(1)}% of FA</span>
                  )}
                  <button
                    onClick={() => setResidualValueAmt('')}
                    className="text-xs text-brand-mint-dark hover:underline"
                  >
                    Reset to 25%
                  </button>
                </div>
              </div>
              <NumInput
                value={residualValueAmt || defaultResidual.toFixed(2)}
                onChange={setResidualValueAmt}
                prefix="$"
                placeholder={defaultResidual.toFixed(2)}
              />
              <p className="text-xs text-slate-400 mt-1">Balloon payment due at end of lease. Max 25% of Finance Amount ({fmt(defaultResidual)})</p>
            </div>

            {/* Row 34 — Monthly Repayment full breakdown */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase">Monthly Repayment Breakdown</p>
              </div>
              <div className="p-4 space-y-3">

                {/* Part A */}
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Part A — Interest on Residual Value</p>
                  <p className="text-xs text-slate-400 font-mono mb-2">
                    RV × r × 2 × y = {fmt(leasingRV)} × {(leasingRate*100).toFixed(1)}% × 2 × {leasingYears}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Part A result</span>
                    <span className="text-base font-bold text-brand-charcoal">{fmt(leasingPartA)}</span>
                  </div>
                </div>

                {/* Part B */}
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Part B — Total Balance Repayment</p>
                  <p className="text-xs text-slate-400 font-mono mb-1">
                    (FA − RV) × NR = ({fmt(grandTotal)} − {fmt(leasingRV)}) × {normalizedRate.toFixed(3)}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Part B total</span>
                    <span className="text-base font-bold text-brand-charcoal">{fmt(leasingPartB)}</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <div>
                    <p className="text-sm font-bold text-slate-800">Monthly Repayment</p>
                    <p className="text-xs text-slate-400">(Part A + Part B) ÷ {leasingPeriod} months</p>
                  </div>
                  <span className="text-lg font-bold text-brand-mint-dark">{fmt(leasingMonthly)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400 pt-1">
                  <span>Residual Value (due end of lease)</span>
                  <span className="font-medium">{fmt(leasingRV)}</span>
                </div>
              </div>
            </div>

            {/* Apply button */}
            {grandTotal > 0 && (
              <button
                onClick={() => setMonthlyRepayment(leasingMonthly.toFixed(2))}
                className="mt-4 w-full py-2.5 rounded-xl bg-brand-mint text-white text-sm font-semibold hover:bg-brand-mint-dark transition-colors"
              >
                → Apply to Profit Calculator
              </button>
            )}
          </SectionCard>

          {/* Profit */}
          <SectionCard title="8. Profit Calculator">
            {currentMonthlyCost > 0 && (
              <div className="mb-4 bg-slate-100 rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Client's Current Monthly Cost</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {`Machine cost + Print (${clientMachines.filter(m=>m.name).map(m=>m.name).join(', ') || 'client machines'})`}
                  </p>
                </div>
                <span className="text-xl font-bold text-slate-700">{fmt(currentMonthlyCost)}</span>
              </div>
            )}

            <Field label="Monthly Repayment ($)" hint="Set your desired monthly repayment amount">
              <NumInput value={monthlyRepayment} onChange={setMonthlyRepayment} prefix="$" placeholder="300" />
            </Field>

            {(parseFloat(monthlyRepayment) || 0) > 0 && currentMonthlyCost > 0 && (() => {
              const compareVal = rebateSavingPerMonth > 0 ? netCostPerMonth : (parseFloat(monthlyRepayment) || 0)
              const diff = currentMonthlyCost - compareVal
              const pct = (diff / currentMonthlyCost) * 100
              const saving = diff >= 0
              return (
                <div className={`flex items-center justify-between rounded-xl px-4 py-3 -mt-1 mb-4 border ${saving ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div>
                    <p className={`text-xs font-semibold ${saving ? 'text-green-700' : 'text-red-700'}`}>
                      {rebateSavingPerMonth > 0 ? 'Net Cost Per Month' : 'New Monthly Cost'}
                      {currentMonthlyCost > 0 && (
                        <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-bold ${saving ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                          {saving ? '▼' : '▲'} {Math.abs(pct).toFixed(1)}%
                        </span>
                      )}
                    </p>
                    <p className={`text-xs mt-0.5 ${saving ? 'text-green-500' : 'text-red-500'}`}>
                      {saving
                        ? `Saves client ${fmt(diff)}/mo vs current`
                        : `${fmt(Math.abs(diff))}/mo more than current`}
                      {rebateSavingPerMonth > 0 && ` · after ${fmt(rebateSavingPerMonth)} rebate saving`}
                    </p>
                  </div>
                  <span className={`text-xl font-bold ${saving ? 'text-green-700' : 'text-red-700'}`}>{fmt(compareVal)}</span>
                </div>
              )
            })()}

            {rebateSavingPerMonth > 0 && (parseFloat(monthlyRepayment) || 0) > 0 && currentMonthlyCost === 0 && (
              <div className="flex items-center justify-between bg-brand-mint-light border border-brand-mint rounded-xl px-4 py-3 -mt-1 mb-4">
                <div>
                  <p className="text-xs font-semibold text-brand-mint-dark">Net Cost Per Month</p>
                  <p className="text-xs text-brand-mint mt-0.5">
                    Monthly Repayment − Rebate Saving ({fmt(rebateSavingPerMonth)}/mo)
                  </p>
                </div>
                <span className="text-xl font-bold text-brand-mint-dark">{fmt(netCostPerMonth)}</span>
              </div>
            )}

            {/* Residual Value toggle */}
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-slate-600">Residual Value %</label>
              <div className="flex gap-1.5">
                {[25, 30].map(pct => (
                  <button
                    key={pct}
                    onClick={() => setResidualPct(pct)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                      residualPct === pct
                        ? 'bg-brand-charcoal text-white border-brand-charcoal'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-brand-mint hover:text-brand-mint-dark'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 space-y-2 mt-4">
              <ResultRow label="Grand Total Financed (principal)" value={fmt(grandTotalFinanced)} />
              <ResultRow label={`Residual Value — ${residualPct}% of GTF`} value={fmt(residualValue)} />
              <ResultRow label="Grand Total Price (your cost)" value={fmt(grandTotal)} />
              <div
                className={`flex justify-between items-center py-3 px-4 rounded-xl mt-2 ${
                  profit >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}
              >
                <span className="font-bold text-slate-700">Profit</span>
                <span className={`text-lg font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {fmt(profit)}
                </span>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-400 leading-relaxed">
              Grand Total Financed = principal the client actually borrows (reverse of leasing formula) &nbsp;|&nbsp;
              Profit = Grand Total Financed − Grand Total Price
            </div>

            {(outstanding > 0 || (parseFloat(machineCost) || 0) > 0) && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-amber-700 mb-0.5">⚠ Max Monthly Repayment Ceiling</p>
                <p className="text-lg font-bold text-amber-800">{fmt(repaymentCeiling)}</p>
                <p className="text-xs text-amber-600 mt-1">
                  (Outstanding {fmt(outstanding)} + Machine Cost {fmt(machineCost)} × 3) ÷ 60 months
                </p>
              </div>
            )}

            {/* Comparison */}
            {newMonthlyCost > 0 && currentMonthlyCost > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setShowComparison(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-brand-charcoal hover:bg-brand-charcoal-dark text-white text-sm font-semibold transition-colors"
                >
                  <span>📊 View Cost Comparison</span>
                  <span>{showComparison ? '▲' : '▼'}</span>
                </button>

                {showComparison && (
                  <div className="mt-3 border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-2">
                      {/* Current */}
                      <div className="bg-slate-50 px-4 py-4 border-r border-slate-200">
                        <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Current</p>
                        {clientMachines.map(m => (
                          <div key={m.id} className="text-xs text-slate-500 mb-1">
                            {m.name || (m.ownership === 'purchase' ? 'Purchased' : 'Leased')}
                            <span className="float-right font-medium text-slate-700">
                              {m.ownership === 'purchase'
                                ? fmt((parseFloat(m.purchaseCost)||0)/((parseFloat(m.years)||5)*12))
                                : fmt(m.monthlyLease)}/mo
                            </span>
                          </div>
                        ))}
                        <div className="text-xs text-slate-500 mb-3">
                          Print cost/mo
                          <span className="float-right font-medium text-slate-700">{fmt(clientMonthlyPrintCost)}</span>
                        </div>
                        <div className="border-t border-slate-200 pt-2">
                          <p className="text-xs text-slate-400">Total/month</p>
                          <p className="text-xl font-bold text-slate-700">{fmt(currentMonthlyCost)}</p>
                        </div>
                      </div>

                      {/* New */}
                      <div className="bg-brand-mint-light px-4 py-4">
                        <p className="text-xs font-semibold text-brand-mint uppercase mb-3">Proposed</p>
                        <div className="text-xs text-slate-500 mb-1">
                          Monthly repayment
                          <span className="float-right font-medium text-slate-700">{fmt(monthlyRepayment)}</span>
                        </div>
                        {rebateSavingPerMonth > 0 && (
                          <div className="text-xs text-green-600 mb-3">
                            Rebate saving/mo
                            <span className="float-right font-medium">−{fmt(rebateSavingPerMonth)}</span>
                          </div>
                        )}
                        <div className="border-t border-brand-mint pt-2">
                          <p className="text-xs text-brand-mint">Net cost/month</p>
                          <p className="text-xl font-bold text-brand-mint-dark">{fmt(newMonthlyCost)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Savings Banner */}
                    <div className={`px-4 py-4 text-center ${monthlySavings >= 0 ? 'bg-green-600' : 'bg-red-500'}`}>
                      {monthlySavings >= 0 ? (
                        <>
                          <p className="text-green-100 text-xs font-medium mb-1">Client saves every month</p>
                          <p className="text-3xl font-bold text-white">{fmt(monthlySavings)}<span className="text-base font-normal">/mo</span></p>
                          <p className="text-green-200 text-sm mt-1 font-semibold">{savingsPct.toFixed(1)}% reduction in monthly cost</p>
                        </>
                      ) : (
                        <>
                          <p className="text-red-100 text-xs font-medium mb-1">New plan costs more</p>
                          <p className="text-3xl font-bold text-white">{fmt(Math.abs(monthlySavings))}<span className="text-base font-normal">/mo extra</span></p>
                          <p className="text-red-200 text-sm mt-1 font-semibold">{Math.abs(savingsPct).toFixed(1)}% increase</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          {/* Smart Quote Recommendation */}
          {grandTotal > 0 && leasingMonthly > 0 && (
            <SectionCard title="💡 Smart Quote Recommendation">
              {currentMonthlyCost === 0 && (
                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
                  Fill in <strong>Client's Current Setup</strong> to unlock personalised saving recommendations.
                </div>
              )}

              {/* Three reference lines */}
              <div className="space-y-2 mb-5">
                <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">🔴 Break-even (Floor)</p>
                    <p className="text-xs text-slate-400 mt-0.5">Min to cover leasing cost — below this = loss</p>
                  </div>
                  <span className="text-base font-bold text-slate-700">{fmt(breakEvenMonthly)}</span>
                </div>

                {repaymentCeiling > 0 && (
                  <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <p className="text-xs font-semibold text-slate-500">🟡 Repayment Ceiling</p>
                      <p className="text-xs text-slate-400 mt-0.5">(Outstanding + Machine × 3) ÷ 60</p>
                    </div>
                    <span className="text-base font-bold text-slate-700">{fmt(repaymentCeiling)}</span>
                  </div>
                )}

                {savingTarget25 !== null && (
                  <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-brand-mint-light border border-brand-mint">
                    <div>
                      <p className="text-xs font-semibold text-brand-mint-dark">🎯 25% Saving Target</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Client cost × 75% + rebate saving ({fmt(rebateSavingPerMonth)}/mo)
                      </p>
                    </div>
                    <span className="text-base font-bold text-brand-mint-dark">{fmt(savingTarget25)}</span>
                  </div>
                )}
              </div>

              {/* Recommended quote */}
              {quoteIsProfitable ? (
                /* ✅ Profitable path — standard recommendation */
                <div className="rounded-2xl overflow-hidden border-2 border-brand-mint">
                  <div className="px-4 py-3 bg-brand-mint">
                    <p className="text-white text-sm font-bold">✅ Recommended Quote</p>
                    <p className="text-white/80 text-xs mt-0.5">Maximises your profit while saving client ≥25%</p>
                  </div>
                  <div className="p-4 bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-slate-400">Monthly Repayment to Quote</p>
                        <p className="text-3xl font-bold text-brand-charcoal mt-0.5">{fmt(recommendedMonthly)}</p>
                      </div>
                      {recommendedSavingPct !== null && (
                        <div className={`text-center px-4 py-2 rounded-xl ${recommendedSavingPct >= 25 ? 'bg-green-100' : 'bg-amber-100'}`}>
                          <p className={`text-2xl font-bold ${recommendedSavingPct >= 25 ? 'text-green-700' : 'text-amber-700'}`}>
                            {recommendedSavingPct.toFixed(1)}%
                          </p>
                          <p className={`text-xs ${recommendedSavingPct >= 25 ? 'text-green-600' : 'text-amber-600'}`}>client saves</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      {currentMonthlyCost > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Client current cost</span>
                          <span className="font-medium text-slate-700">{fmt(currentMonthlyCost)}/mo</span>
                        </div>
                      )}
                      {currentMonthlyCost > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Client new net cost</span>
                          <span className="font-medium text-green-600">{fmt(recommendedNetCost)}/mo</span>
                        </div>
                      )}
                      {currentMonthlyCost > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Client saves</span>
                          <span className="font-medium text-green-600">{fmt(currentMonthlyCost - recommendedNetCost)}/mo</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-slate-100 pt-2 mt-1">
                        <span className="text-slate-400">Your profit ({leasingPeriod}mo × {fmt(recommendedMonthly)} − Grand Total)</span>
                        <span className="font-bold text-green-600">{fmt(recommendedProfit)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setMonthlyRepayment(recommendedMonthly.toFixed(2))}
                      className="mt-4 w-full py-2.5 rounded-xl bg-brand-charcoal text-white text-sm font-semibold hover:bg-brand-charcoal-dark transition-colors"
                    >
                      → Apply to Profit Calculator
                    </button>
                  </div>
                </div>
              ) : (
                /* ⚠️ Unprofitable path — push to ceiling + give rebate for 25% saving */
                <div className="rounded-2xl overflow-hidden border-2 border-red-300">
                  <div className="px-4 py-3 bg-red-500">
                    <p className="text-white text-sm font-bold">⚠️ Deal is Tight — Best Possible Quote</p>
                    <p className="text-white/80 text-xs mt-0.5">
                      Charge the maximum ceiling &amp; offset with rebate to still give client 25% saving
                    </p>
                  </div>
                  <div className="p-4 bg-white space-y-4">

                    {/* Two-column: Monthly + Rebate */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 rounded-xl px-3 py-3 text-center">
                        <p className="text-xs text-slate-400 mb-1">Charge (ceiling)</p>
                        <p className="text-2xl font-bold text-brand-charcoal">{fmt(ceilMonthly)}</p>
                        <p className="text-xs text-slate-400 mt-0.5">/month</p>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-3 text-center">
                        <p className="text-xs text-amber-600 mb-1">Give Rebate</p>
                        <p className="text-2xl font-bold text-amber-700">
                          {ceilRebatePerMonth > 0 ? fmt(ceilRebatePerMonth) : '—'}
                        </p>
                        <p className="text-xs text-amber-500 mt-0.5">
                          {ceilRebatePerMonth > 0 ? `/mo (${fmt(ceilRebateTotal)} total)` : 'none needed'}
                        </p>
                      </div>
                    </div>

                    {/* Client saving result */}
                    {ceilSavingPct !== null && (
                      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                        <div>
                          <p className="text-xs font-semibold text-green-700">Client Net Cost After Rebate</p>
                          <p className="text-xs text-green-500 mt-0.5">
                            {fmt(ceilMonthly)} − {fmt(ceilRebatePerMonth)}/mo rebate
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-700">{fmt(ceilClientNetCost)}/mo</p>
                          <p className="text-xs text-green-500 font-semibold">saves {ceilSavingPct.toFixed(1)}%</p>
                        </div>
                      </div>
                    )}

                    {/* Cost breakdown */}
                    <div className="space-y-2 text-sm border-t border-slate-100 pt-3">
                      {currentMonthlyCost > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Client current cost</span>
                          <span className="font-medium text-slate-700">{fmt(currentMonthlyCost)}/mo</span>
                        </div>
                      )}
                      {ceilRebatePerMonth > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Rebate cost to you ({fmt(ceilRebateTotal)} total)</span>
                          <span className="font-medium text-red-500">−{fmt(ceilRebateTotal)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-1 border-t border-slate-100">
                        <span className="text-slate-500 font-medium">Your profit</span>
                        <span className={`font-bold ${ceilProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {fmt(ceilProfit)}
                          {ceilProfit < 0 && <span className="text-xs font-normal ml-1">(loss)</span>}
                        </span>
                      </div>
                    </div>

                    {ceilProfit < 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-600">
                        <p className="font-semibold mb-0.5">⚠️ This deal results in a loss</p>
                        <p>Even at the maximum ceiling with optimal rebate, costs exceed revenue. Consider renegotiating the machine price or outstanding amount.</p>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setMonthlyRepayment(ceilMonthly.toFixed(2))
                        if (ceilRebatePerMonth > 0) {
                          setRebate(String(-(ceilRebateTotal)))
                          setRebatePerMonth(Math.min(500, Math.round(ceilRebatePerMonth / 10) * 10))
                        }
                      }}
                      className="w-full py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
                    >
                      → Apply Ceiling + Rebate to Calculator
                    </button>
                  </div>
                </div>
              )}
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  )
}
