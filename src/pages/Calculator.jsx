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
  ],
  fujifilm: [
    { name: '3570 (Rebuilt)', cost: 4500 },
  ],
}

function SectionCard({ title, children }) {
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

  // --- Client Profile ---
  const [showClientProfile, setShowClientProfile] = useState(false)
  const [clientMachine, setClientMachine] = useState('')
  const [clientOwnership, setClientOwnership] = useState('lease')
  const [clientPurchaseCost, setClientPurchaseCost] = useState('')
  const [clientYears, setClientYears] = useState('')
  const [clientBwUnits, setClientBwUnits] = useState('')
  const [clientBwCost, setClientBwCost] = useState('')
  const [clientColorUnits, setClientColorUnits] = useState('')
  const [clientColorCost, setClientColorCost] = useState('')

  // --- Comparison ---
  const [showComparison, setShowComparison] = useState(false)

  const handleCopierToggle = (type) => {
    setCopierType(type)
    setBwCost(COPIER_PRESETS[type].bwCost)
    setColorCost(COPIER_PRESETS[type].colorCost)
  }

  const outstanding = useMemo(() => {
    const lease = parseFloat(monthlyLease) || 0
    const months = parseFloat(monthsLeft) || 0
    const final = parseFloat(outstandingFinal) || 0
    return final + lease * months
  }, [monthlyLease, monthsLeft, outstandingFinal])

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

  const financeAmt = useMemo(() => {
    return (parseFloat(monthlyRepayment) || 0) * 60
  }, [monthlyRepayment])

  const residualValue = useMemo(() => financeAmt * 0.25, [financeAmt])

  const profit = useMemo(() => financeAmt - grandTotal, [financeAmt, grandTotal])

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
  // Monthly = Part A + Part B
  // Part A: interest on residual value (held at full amount throughout lease)
  const leasingPartA = leasingRV * leasingRate * 2 * leasingYears
  // Part B: (FA - RV) × normalized rate / period
  const leasingPartB = (grandTotal - leasingRV) * normalizedRate / leasingPeriod
  const leasingMonthly = leasingPartA + leasingPartB

  const rebateSavingPerMonth = useMemo(() => {
    return Math.abs(parseFloat(rebate) || 0) / 30
  }, [rebate])

  const netCostPerMonth = useMemo(() => {
    return (parseFloat(monthlyRepayment) || 0) - rebateSavingPerMonth
  }, [monthlyRepayment, rebateSavingPerMonth])

  const clientBwMonthly = (parseFloat(clientBwUnits) || 0) * 30
  const clientColorMonthly = (parseFloat(clientColorUnits) || 0) * 30
  const hasClientProfile = clientMachine || clientBwUnits || clientColorUnits || clientPurchaseCost

  const clientMonthlyPrintCost = useMemo(() => {
    return (parseFloat(clientBwCost) || 0) * (parseFloat(clientBwUnits) || 0) +
           (parseFloat(clientColorCost) || 0) * (parseFloat(clientColorUnits) || 0)
  }, [clientBwCost, clientBwUnits, clientColorCost, clientColorUnits])

  const currentMonthlyCost = useMemo(() => {
    if (clientOwnership === 'purchase') {
      const years = parseFloat(clientYears) || 0
      const pc = parseFloat(clientPurchaseCost) || 0
      const monthlyDepreciation = years > 0 ? pc / (years * 12) : 0
      return monthlyDepreciation + clientMonthlyPrintCost
    }
    return (parseFloat(monthlyLease) || 0) + clientMonthlyPrintCost
  }, [clientOwnership, clientPurchaseCost, clientYears, monthlyLease, clientMonthlyPrintCost])

  const newMonthlyCost = useMemo(() => {
    return rebateSavingPerMonth > 0 ? netCostPerMonth : (parseFloat(monthlyRepayment) || 0)
  }, [rebateSavingPerMonth, netCostPerMonth, monthlyRepayment])

  const monthlySavings = useMemo(() => currentMonthlyCost - newMonthlyCost, [currentMonthlyCost, newMonthlyCost])
  const savingsPct = useMemo(() => {
    if (!currentMonthlyCost) return 0
    return (monthlySavings / currentMonthlyCost) * 100
  }, [monthlySavings, currentMonthlyCost])

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
              {/* Current Machine */}
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Current Machine</label>
                <input
                  type="text"
                  value={clientMachine}
                  onChange={e => setClientMachine(e.target.value)}
                  placeholder="e.g. Konica 458, Ricoh 2501..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-mint"
                />
              </div>

              {/* Ownership Type */}
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-2">Machine Ownership</p>
                <div className="flex gap-2">
                  {[{ key: 'lease', label: 'Leased' }, { key: 'purchase', label: 'Purchased' }].map(o => (
                    <button
                      key={o.key}
                      onClick={() => setClientOwnership(o.key)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        clientOwnership === o.key
                          ? 'bg-brand-charcoal text-white border-brand-charcoal'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>

                {clientOwnership === 'purchase' && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Purchase Price ($)</label>
                      <NumInput value={clientPurchaseCost} onChange={setClientPurchaseCost} prefix="$" placeholder="8000" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Years in Use</label>
                      <NumInput value={clientYears} onChange={setClientYears} placeholder="3" />
                    </div>
                    {clientPurchaseCost && clientYears && (
                      <div className="bg-brand-mint-light border border-brand-mint rounded-lg px-3 py-2 text-xs text-brand-mint-dark">
                        Monthly depreciation: {fmt((parseFloat(clientPurchaseCost) || 0) / ((parseFloat(clientYears) || 1) * 12))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Current Outstanding — shares main calculator state */}
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-3">
                  {clientOwnership === 'lease' ? 'Current Outstanding' : 'Lease Outstanding (if any)'}
                </p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Monthly Lease ($)</label>
                    <NumInput value={monthlyLease} onChange={setMonthlyLease} prefix="$" placeholder="200" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Months Remaining</label>
                    <NumInput value={monthsLeft} onChange={setMonthsLeft} placeholder="23" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Outstanding Final Payment ($)</label>
                  <NumInput value={outstandingFinal} onChange={setOutstandingFinal} prefix="$" placeholder="3000" />
                </div>
                <div className="bg-slate-50 rounded-lg px-3 py-2 mt-2 text-xs text-slate-500 flex justify-between">
                  <span>Total Outstanding</span>
                  <span className="font-semibold text-slate-700">{fmt(outstanding)}</span>
                </div>
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
          </SectionCard>

          {/* 2. Machine Cost */}
          <SectionCard title="2. Machine Cost">
            {clientMachine && (
              <div className="flex items-center gap-2 mb-3 text-xs text-brand-mint-dark bg-brand-mint-light border border-brand-mint rounded-lg px-3 py-2">
                <span>👤 Client currently uses:</span>
                <span className="font-semibold">{clientMachine}</span>
              </div>
            )}
            <div className="flex gap-2 mb-4">
              {[{ key: 'konica', label: 'Konica Minolta' }, { key: 'fujifilm', label: 'FujiFilm' }].map(b => (
                <button
                  key={b.key}
                  onClick={() => { setMachineBrand(b.key); setSelectedMachine(null) }}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    machineBrand === b.key
                      ? 'bg-brand-mint text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {MACHINE_CATALOGUE[machineBrand].map(m => (
                <button
                  key={m.name}
                  onClick={() => { setSelectedMachine(m.name); setMachineCost(String(m.cost)) }}
                  className={`text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                    selectedMachine === m.name
                      ? 'border-brand-mint bg-brand-mint-light text-brand-mint-dark font-medium'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-brand-mint hover:bg-brand-mint-light'
                  }`}
                >
                  <span className="block font-medium">{m.name}</span>
                  <span className="text-xs text-slate-400">${m.cost.toLocaleString()}</span>
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
          <SectionCard title="6. Grand Total Summary">
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
          <SectionCard title="7. Leasing Repayment Calculator">

            {/* Row 30 — Finance Amount */}
            <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 mb-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Finance Amount</p>
                <p className="text-xs text-slate-400 mt-0.5">= Grand Total Price</p>
              </div>
              <span className="text-xl font-bold text-brand-charcoal">{fmt(grandTotal)}</span>
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
                <p className="text-2xl font-bold text-brand-charcoal">{(leasingRate * 100).toFixed(1)}%</p>
              </div>
              <div className="bg-brand-mint-light border border-brand-mint rounded-xl px-4 py-3">
                <p className="text-xs text-brand-mint-dark mb-1">Normalized Rate</p>
                <p className="text-2xl font-bold text-brand-charcoal">{normalizedRate.toFixed(3)}</p>
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
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Part B — Financed Balance</p>
                  <p className="text-xs text-slate-400 font-mono mb-2">
                    (FA − RV) × NR ÷ Period = ({fmt(grandTotal)} − {fmt(leasingRV)}) × {normalizedRate.toFixed(3)} ÷ {leasingPeriod}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Part B result</span>
                    <span className="text-base font-bold text-brand-charcoal">{fmt(leasingPartB)}</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <div>
                    <p className="text-sm font-bold text-slate-800">Monthly Repayment</p>
                    <p className="text-xs text-slate-400">Part A + Part B</p>
                  </div>
                  <span className="text-2xl font-bold text-brand-mint-dark">{fmt(leasingMonthly)}</span>
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
                    {clientOwnership === 'purchase'
                      ? `Depreciation + Print (${clientMachine || 'purchased'})`
                      : `Lease + Print (${clientMachine || 'leased'})`}
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

            <div className="bg-slate-50 rounded-xl p-4 space-y-2 mt-4">
              <ResultRow label="Finance Amount (Monthly × 60)" value={fmt(financeAmt)} />
              <ResultRow label="Residual Value — 25% of Finance Amt" value={fmt(residualValue)} />
              <ResultRow label="Grand Total (Financed)" value={fmt(grandTotal)} />
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
              Finance Amount = Monthly Repayment × 60 &nbsp;|&nbsp;
              Grand Total includes all costs (machine, outstanding, print charges, rebate, trade-in) &nbsp;|&nbsp;
              Profit = Finance Amount − Grand Total
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
                        {clientOwnership === 'purchase' ? (
                          <>
                            <div className="text-xs text-slate-500 mb-1">
                              Depreciation/mo
                              <span className="float-right font-medium text-slate-700">
                                {fmt((parseFloat(clientPurchaseCost) || 0) / ((parseFloat(clientYears) || 1) * 12))}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="text-xs text-slate-500 mb-1">
                            Lease/mo
                            <span className="float-right font-medium text-slate-700">{fmt(monthlyLease)}</span>
                          </div>
                        )}
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
        </div>
      </div>
    </div>
  )
}
