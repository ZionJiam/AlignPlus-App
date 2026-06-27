import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { MACHINE_CATALOGUE } from '../data/machines'

const COPIER_PRESETS = {
  small: { bwCost: 0.015, colorCost: 0.24 },
  big: { bwCost: 0.008, colorCost: 0.13 },
}

function SectionCard({ title, children, collapsible = false, open, onToggle, summary }) {
  if (collapsible) {
    return (
      <div className="mb-5 rounded-2xl overflow-hidden">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between py-3 transition-colors"
        >
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{title}</h2>
          <div className="flex items-center gap-3">
            {!open && summary && (
              <span className="text-sm font-semibold text-brand-mint-dark">{summary}</span>
            )}
            <span className="text-slate-300 text-xs">{open ? '▲' : '▼'}</span>
          </div>
        </button>
        {open && (
          <div className="pb-2 pt-1">
            {children}
          </div>
        )}
      </div>
    )
  }
  return (
    <div className="mb-8">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4 pb-2 border-b border-slate-200">
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
      className={`flex justify-between items-center ${highlight ? 'border-t border-slate-200 mt-1 pt-3' : ''}`}
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

// Collect all calculator state into a plain object for saving
function buildSnapshot(state) {
  return {
    monthlyLease: state.monthlyLease,
    monthsLeft: state.monthsLeft,
    outstandingFinal: state.outstandingFinal,
    machineCost: state.machineCost,
    machineBrand: state.machineBrand,
    selectedMachine: state.selectedMachine,
    copierType: state.copierType,
    bwCost: state.bwCost,
    bwUnits: state.bwUnits,
    colorCost: state.colorCost,
    colorUnits: state.colorUnits,
    rebate: state.rebate,
    rebatePerMonth: state.rebatePerMonth,
    tradeIn: state.tradeIn,
    leasingPeriod: state.leasingPeriod,
    residualValueAmt: state.residualValueAmt,
    monthlyRepayment: state.monthlyRepayment,
    residualPct: state.residualPct,
    clientMachines: state.clientMachines,
    clientBwUnits: state.clientBwUnits,
    clientBwCost: state.clientBwCost,
    clientColorUnits: state.clientColorUnits,
    clientColorCost: state.clientColorCost,
    clientPrintMode: state.clientPrintMode,
    clientTotalPrintCost: state.clientTotalPrintCost,
    clientBwSplitPct: state.clientBwSplitPct,
    clientSimpleBwRate: state.clientSimpleBwRate,
    clientSimpleColorRate: state.clientSimpleColorRate,
    monthsLeftEnd: state.monthsLeftEnd,
  }
}

// Calculate months remaining from a "YYYY-MM" end date string vs today
function calcMonthsLeft(leaseEnd) {
  if (!leaseEnd) return ''
  const [yyyy, mm] = leaseEnd.split('-').map(Number)
  const now = new Date()
  const diff = (yyyy - now.getFullYear()) * 12 + (mm - (now.getMonth() + 1))
  return String(Math.max(0, diff))
}

// Floor to nearest number whose ones digit is 0, 5, or 8  (e.g. 283 → 280, 287 → 285, 289 → 288)
function niceFloor(n) {
  const f = Math.floor(n)
  const d = f % 10
  if (d >= 8) return f - (d - 8)
  if (d >= 5) return f - (d - 5)
  return f - d
}

// Normalise a raw data object to the same shape as buildSnapshot (fills in defaults)
function normalizeSnapshot(d) {
  return buildSnapshot({
    monthlyLease: d.monthlyLease ?? '',
    monthsLeft: d.monthsLeft ?? '',
    outstandingFinal: d.outstandingFinal ?? '',
    machineCost: d.machineCost ?? '',
    machineBrand: d.machineBrand ?? 'konica',
    selectedMachine: d.selectedMachine ?? null,
    copierType: d.copierType ?? 'big',
    bwCost: d.bwCost ?? COPIER_PRESETS.big.bwCost,
    bwUnits: d.bwUnits ?? '',
    colorCost: d.colorCost ?? COPIER_PRESETS.big.colorCost,
    colorUnits: d.colorUnits ?? '',
    rebate: d.rebate ?? '',
    rebatePerMonth: d.rebatePerMonth ?? 0,
    tradeIn: d.tradeIn ?? '',
    leasingPeriod: d.leasingPeriod ?? 60,
    residualValueAmt: d.residualValueAmt ?? '',
    monthlyRepayment: d.monthlyRepayment ?? '',
    residualPct: d.residualPct ?? 25,
    clientMachines: d.clientMachines ?? [{ id: 1, name: '', ownership: 'lease', purchaseCost: '', years: '5', monthlyLease: '', monthsLeft: '', finalPayment: '', leaseEnd: '' }],
    clientBwUnits: d.clientBwUnits ?? '',
    clientBwCost: d.clientBwCost ?? '',
    clientColorUnits: d.clientColorUnits ?? '',
    clientColorCost: d.clientColorCost ?? '',
    clientPrintMode: d.clientPrintMode ?? 'detailed',
    clientTotalPrintCost: d.clientTotalPrintCost ?? '',
    clientBwSplitPct: d.clientBwSplitPct ?? 50,
    clientSimpleBwRate: d.clientSimpleBwRate ?? '0.01',
    clientSimpleColorRate: d.clientSimpleColorRate ?? '0.14',
    monthsLeftEnd: d.monthsLeftEnd ?? '',
  })
}

const BLANK_SNAPSHOT = JSON.stringify(normalizeSnapshot({}))

export default function Calculator() {
  const { user } = useAuth()
  const { id } = useParams()          // 'new' or a record UUID
  const navigate = useNavigate()

  // --- Record metadata ---
  const [clientName, setClientName] = useState('')
  const [showNameModal, setShowNameModal] = useState(id === 'new')
  const [draftName, setDraftName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [cleanSnapshot, setCleanSnapshot] = useState(BLANK_SNAPSHOT)

  // --- Outstanding ---
  const [monthlyLease, setMonthlyLease] = useState('')
  const [monthsLeft, setMonthsLeft] = useState('')
  const [monthsLeftEnd, setMonthsLeftEnd] = useState('')  // "YYYY-MM" end date for Section 1
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
  const [nettCost, setNettCost] = useState('')
  const [tradeIn, setTradeIn] = useState('')

  const handleNettCostChange = (val) => {
    setNettCost(val)
    const repayment = parseFloat(monthlyRepayment) || 0
    const net = parseFloat(val) || 0
    const perMonth = Math.max(0, repayment - net)
    setRebatePerMonth(perMonth)
    setRebate(perMonth > 0 ? String(-(perMonth * 30)) : '')
  }

  const handleRebateTotalChange = (val) => {
    const total = parseFloat(val) || 0
    const perMonth = total / 30
    setRebate(total > 0 ? String(-total) : '')
    setRebatePerMonth(perMonth)
    const repayment = parseFloat(monthlyRepayment) || 0
    setNettCost(perMonth > 0 ? String(repayment - perMonth) : '')
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
    { id: 1, name: '', ownership: 'lease', purchaseCost: '', years: '5', monthlyLease: '', monthsLeft: '', finalPayment: '', leaseEnd: '' }
  ])
  const [clientBwUnits, setClientBwUnits] = useState('')
  const [clientBwCost, setClientBwCost] = useState('')
  const [clientColorUnits, setClientColorUnits] = useState('')
  const [clientColorCost, setClientColorCost] = useState('')
  const [clientPrintMode, setClientPrintMode] = useState('detailed') // 'detailed' | 'simple'
  const [clientTotalPrintCost, setClientTotalPrintCost] = useState('')
  const [clientBwSplitPct, setClientBwSplitPct] = useState(50)
  const [clientSimpleBwRate, setClientSimpleBwRate] = useState('0.01')
  const [clientSimpleColorRate, setClientSimpleColorRate] = useState('0.14')

  const addClientMachine = () => setClientMachines(prev => [
    ...prev,
    { id: Date.now(), name: '', ownership: 'lease', purchaseCost: '', years: '5', monthlyLease: '', monthsLeft: '', finalPayment: '', leaseEnd: '' }
  ])
  const removeClientMachine = (id) => setClientMachines(prev => prev.filter(m => m.id !== id))
  const updateClientMachine = (id, field, value) => setClientMachines(prev =>
    prev.map(m => m.id === id ? { ...m, [field]: value } : m)
  )

  // --- Comparison ---
  const [showComparison, setShowComparison] = useState(false)

  // --- Smart Quote tool (UI only, not snapshotted) ---
  const [quoteMode, setQuoteMode] = useState('no-rebate')
  const [quoteSavingPct, setQuoteSavingPct] = useState(25)
  const [quoteChargeRaw, setQuoteChargeRaw] = useState(0) // 0 = default to ceiling

  // --- Collapsible sections ---
  const [showGrandTotal, setShowGrandTotal] = useState(false)
  const [showLeasing, setShowLeasing] = useState(false)

  // --- Sticky save bar ---
  const saveButtonRef = useRef(null)
  const [saveButtonVisible, setSaveButtonVisible] = useState(true)
  useEffect(() => {
    const el = saveButtonRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setSaveButtonVisible(entry.isIntersecting), { threshold: 0.5 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // --- Load record from URL param on mount ---
  const applyData = useCallback((d) => {
    setMonthlyLease(d.monthlyLease ?? '')
    setMonthsLeft(d.monthsLeft ?? '')
    setOutstandingFinal(d.outstandingFinal ?? '')
    setMachineCost(d.machineCost ?? '')
    setMachineBrand(d.machineBrand ?? 'konica')
    setSelectedMachine(d.selectedMachine ?? null)
    setCopierType(d.copierType ?? 'big')
    setBwCost(d.bwCost ?? COPIER_PRESETS.big.bwCost)
    setBwUnits(d.bwUnits ?? '')
    setColorCost(d.colorCost ?? COPIER_PRESETS.big.colorCost)
    setColorUnits(d.colorUnits ?? '')
    setRebate(d.rebate ?? '')
    setRebatePerMonth(d.rebatePerMonth ?? 0)
    setTradeIn(d.tradeIn ?? '')
    setLeasingPeriod(d.leasingPeriod ?? 60)
    setResidualValueAmt(d.residualValueAmt ?? '')
    setMonthlyRepayment(d.monthlyRepayment ?? '')
    setResidualPct(d.residualPct ?? 25)
    setClientMachines(d.clientMachines ?? [{ id: 1, name: '', ownership: 'lease', purchaseCost: '', years: '5', monthlyLease: '', monthsLeft: '', finalPayment: '', leaseEnd: '' }])
    setClientBwUnits(d.clientBwUnits ?? '')
    setClientBwCost(d.clientBwCost ?? '')
    setClientColorUnits(d.clientColorUnits ?? '')
    setClientColorCost(d.clientColorCost ?? '')
    setClientPrintMode(d.clientPrintMode ?? 'detailed')
    setClientTotalPrintCost(d.clientTotalPrintCost ?? '')
    setClientBwSplitPct(d.clientBwSplitPct ?? 50)
    setClientSimpleBwRate(d.clientSimpleBwRate ?? '0.01')
    setClientSimpleColorRate(d.clientSimpleColorRate ?? '0.14')
    setMonthsLeftEnd(d.monthsLeftEnd ?? '')
    setCleanSnapshot(JSON.stringify(normalizeSnapshot(d)))
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (id && id !== 'new') {
      supabase
        .from('calculator_records')
        .select('client_name, data')
        .eq('id', id)
        .single()
        .then(({ data: record, error }) => {
          if (error || !record) { navigate('/calculator'); return }
          setClientName(record.client_name)
          applyData(record.data)
        })
    }
  }, [id, applyData, navigate])

  // --- Save / update ---
  const saveRecord = async () => {
    if (!clientName.trim()) { setSaveMsg('Enter a client name first'); setTimeout(() => setSaveMsg(''), 2500); return }
    setSaving(true)
    const snapshot = buildSnapshot({
      monthlyLease, monthsLeft, outstandingFinal,
      machineCost, machineBrand, selectedMachine,
      copierType, bwCost, bwUnits, colorCost, colorUnits,
      rebate, rebatePerMonth, tradeIn,
      leasingPeriod, residualValueAmt,
      monthlyRepayment, residualPct,
      clientMachines, clientBwUnits, clientBwCost, clientColorUnits, clientColorCost,
      clientPrintMode, clientTotalPrintCost, clientBwSplitPct, clientSimpleBwRate, clientSimpleColorRate,
    })
    if (id !== 'new') {
      const { error } = await supabase
        .from('calculator_records')
        .update({ client_name: clientName.trim(), data: snapshot, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (!error) { setSaveMsg('Saved ✓'); setCleanSnapshot(JSON.stringify(snapshot)) }
    } else {
      const { data: inserted, error } = await supabase
        .from('calculator_records')
        .insert({ user_id: user.id, client_name: clientName.trim(), data: snapshot })
        .select('id')
        .single()
      if (!error) {
        setSaveMsg('Saved ✓')
        setCleanSnapshot(JSON.stringify(snapshot))
        navigate(`/calculator/${inserted.id}`, { replace: true })
      }
    }
    setSaving(false)
    setTimeout(() => setSaveMsg(''), 2500)
  }

  const handleCopierToggle = (type) => {
    setCopierType(type)
    setBwCost(COPIER_PRESETS[type].bwCost)
    setColorCost(COPIER_PRESETS[type].colorCost)
  }

  // --- Dirty tracking ---
  const isDirty = useMemo(() => {
    const current = JSON.stringify(buildSnapshot({
      monthlyLease, monthsLeft, outstandingFinal,
      machineCost, machineBrand, selectedMachine,
      copierType, bwCost, bwUnits, colorCost, colorUnits,
      rebate, rebatePerMonth, tradeIn,
      leasingPeriod, residualValueAmt,
      monthlyRepayment, residualPct,
      clientMachines, clientBwUnits, clientBwCost, clientColorUnits, clientColorCost,
      clientPrintMode, clientTotalPrintCost, clientBwSplitPct, clientSimpleBwRate, clientSimpleColorRate,
      monthsLeftEnd,
    }))
    return current !== cleanSnapshot
  }, [cleanSnapshot, monthlyLease, monthsLeft, outstandingFinal,
    machineCost, machineBrand, selectedMachine,
    copierType, bwCost, bwUnits, colorCost, colorUnits,
    rebate, rebatePerMonth, tradeIn,
    leasingPeriod, residualValueAmt,
    monthlyRepayment, residualPct,
    clientMachines, clientBwUnits, clientBwCost, clientColorUnits, clientColorCost,
    clientPrintMode, clientTotalPrintCost, clientBwSplitPct, clientSimpleBwRate, clientSimpleColorRate,
    monthsLeftEnd])

  useEffect(() => {
    const handler = (e) => { if (isDirty) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

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
  // Part A: total interest charged on the residual value (fixed multiplier 2 × 5)
  const leasingPartA = leasingRV * leasingRate * 2 * 5
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

  // Simple mode: back-calculate monthly copy volume from cost share ÷ per-copy rate
  const simpleBwUnitsPerMonth = useMemo(() => {
    if (clientPrintMode !== 'simple') return 0
    const total = parseFloat(clientTotalPrintCost) || 0
    const rate = parseFloat(clientSimpleBwRate) || 0.01
    return rate > 0 ? Math.round((total * clientBwSplitPct / 100) / rate) : 0
  }, [clientPrintMode, clientTotalPrintCost, clientBwSplitPct, clientSimpleBwRate])

  const simpleColorUnitsPerMonth = useMemo(() => {
    if (clientPrintMode !== 'simple') return 0
    const total = parseFloat(clientTotalPrintCost) || 0
    const rate = parseFloat(clientSimpleColorRate) || 0.14
    return rate > 0 ? Math.round((total * (100 - clientBwSplitPct) / 100) / rate) : 0
  }, [clientPrintMode, clientTotalPrintCost, clientBwSplitPct, clientSimpleColorRate])

  const clientBwMonthly = clientPrintMode === 'simple'
    ? simpleBwUnitsPerMonth * 30
    : (parseFloat(clientBwUnits) || 0) * 30
  const clientColorMonthly = clientPrintMode === 'simple'
    ? simpleColorUnitsPerMonth * 30
    : (parseFloat(clientColorUnits) || 0) * 30

  const hasClientProfile = clientMachines.some(m => m.name || m.purchaseCost || m.monthlyLease) || clientBwUnits || clientColorUnits || clientTotalPrintCost

  const clientMonthlyPrintCost = useMemo(() => {
    if (clientPrintMode === 'simple') return parseFloat(clientTotalPrintCost) || 0
    return (parseFloat(clientBwCost) || 0) * (parseFloat(clientBwUnits) || 0) +
      (parseFloat(clientColorCost) || 0) * (parseFloat(clientColorUnits) || 0)
  }, [clientPrintMode, clientTotalPrintCost, clientBwCost, clientBwUnits, clientColorCost, clientColorUnits])

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
  // Helper: reverse leasing formula → principal financed from a given monthly amount
  const calcGTF = (monthly) => {
    if (!monthly) return 0
    const tp = monthly * leasingPeriod
    const num = tp * (100 / (100 + K))
    const den = (1 + rvFraction) - (200 * rvFraction / (100 + K))
    return den > 0 ? num / den : 0
  }
  // Floor: minimum monthly to break even (leasing formula)
  const breakEvenMonthly = leasingMonthly
  // Target: highest monthly that saves client ~25%, net of any existing rebate
  const rawSavingTarget = currentMonthlyCost > 0
    ? currentMonthlyCost * 0.75 + rebateSavingPerMonth
    : null
  const savingTarget25 = rawSavingTarget  // alias used in JSX
  // Recommended: nice number ≤ target, capped at ceiling
  const rawRecommendedMonthly = rawSavingTarget !== null
    ? Math.min(rawSavingTarget, repaymentCeiling)
    : repaymentCeiling
  const recommendedMonthly = niceFloor(rawRecommendedMonthly)
  // Is the recommended quote profitable (above break-even)?
  const quoteIsProfitable = recommendedMonthly >= breakEvenMonthly
  // What % does client actually save at this nice number?
  const recommendedNetCost = recommendedMonthly - rebateSavingPerMonth
  const recommendedSavingPct = currentMonthlyCost > 0
    ? ((currentMonthlyCost - recommendedNetCost) / currentMonthlyCost) * 100
    : null
  // Profit at recommended monthly
  const recommendedProfit = calcGTF(recommendedMonthly) - grandTotal

  // --- Ceiling + Rebate scenario (when quote is unprofitable) ---
  const grandTotalExRebate = grandTotal - Math.abs(parseFloat(rebate) || 0)
  const ceilMonthly = niceFloor(repaymentCeiling)
  // Rebate per month needed (rounded to $10 = $300 total increments) to save client ~25%
  const rawCeilRebatePerMonth = currentMonthlyCost > 0
    ? Math.max(0, ceilMonthly - currentMonthlyCost * 0.75)
    : 0
  const ceilRebatePerMonth = Math.round(rawCeilRebatePerMonth / 10) * 10
  const ceilRebateTotal = ceilRebatePerMonth * 30
  const ceilGrandTotal = grandTotalExRebate + ceilRebateTotal
  const ceilProfit = calcGTF(ceilMonthly) - ceilGrandTotal
  const ceilClientNetCost = ceilMonthly - ceilRebatePerMonth
  const ceilSavingPct = currentMonthlyCost > 0
    ? ((currentMonthlyCost - ceilClientNetCost) / currentMonthlyCost) * 100
    : null

  // --- Interactive Smart Quote tool ---
  const quoteCharge = quoteChargeRaw > 0 ? quoteChargeRaw : ceilMonthly

  // No-rebate path: slider drives saving %, output is a nice monthly number
  const noRebateMonthly = currentMonthlyCost > 0
    ? niceFloor(currentMonthlyCost * (1 - quoteSavingPct / 100))
    : 0
  const noRebateActualSavingPct = currentMonthlyCost > 0 && noRebateMonthly > 0
    ? ((currentMonthlyCost - noRebateMonthly) / currentMonthlyCost) * 100
    : 0
  const noRebateProfit = grandTotal > 0 ? calcGTF(noRebateMonthly) - grandTotal : 0

  // Rebate path: two sliders — saving % + monthly charge
  const rebateTargetNetCost = currentMonthlyCost * (1 - quoteSavingPct / 100)
  const rawQuoteRebatePerMonth = Math.max(0, quoteCharge - rebateTargetNetCost)
  const quoteRebatePerMonth = Math.round(rawQuoteRebatePerMonth / 10) * 10
  const quoteRebateTotal = quoteRebatePerMonth * 30
  const quoteClientNet = quoteCharge - quoteRebatePerMonth
  const quoteClientSavingPct = currentMonthlyCost > 0
    ? ((currentMonthlyCost - quoteClientNet) / currentMonthlyCost) * 100
    : 0
  const quoteRebateProfit = grandTotal > 0
    ? calcGTF(quoteCharge) - (grandTotalExRebate + quoteRebateTotal)
    : 0

  // Slider range for the repayment charge slider
  const chargeSliderMin = Math.max(50, Math.round((breakEvenMonthly || 50) / 10) * 10)
  const chargeSliderMax = Math.max(chargeSliderMin + 10, Math.round((repaymentCeiling || chargeSliderMin + 500) / 10) * 10)

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
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
              <h2 className="text-sm font-semibold text-slate-700">Client Setup</h2>
              <button
                onClick={() => setShowClientProfile(false)}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Client Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Client Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="Enter client name"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-mint"
                />
              </div>

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
                              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${m.ownership === o.key
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
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-xs text-slate-500">Months Remaining</label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (m.leaseEnd) {
                                      updateClientMachine(m.id, 'leaseEnd', '')
                                    } else {
                                      const now = new Date()
                                      const defaultEnd = `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}`
                                      updateClientMachine(m.id, 'leaseEnd', defaultEnd)
                                      updateClientMachine(m.id, 'monthsLeft', calcMonthsLeft(defaultEnd))
                                    }
                                  }}
                                  className="text-xs text-brand-mint-dark hover:underline"
                                >
                                  {m.leaseEnd ? '✏️' : '📅'}
                                </button>
                              </div>
                              {m.leaseEnd ? (
                                <div className="flex gap-1">
                                  <select
                                    value={m.leaseEnd.split('-')[1] || ''}
                                    onChange={e => {
                                      const updated = `${m.leaseEnd.split('-')[0]}-${e.target.value}`
                                      updateClientMachine(m.id, 'leaseEnd', updated)
                                      updateClientMachine(m.id, 'monthsLeft', calcMonthsLeft(updated))
                                    }}
                                    className="w-1/2 border border-slate-300 rounded-lg px-1.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-mint"
                                  >
                                    {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((mo, i) => (
                                      <option key={mo} value={mo}>{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}</option>
                                    ))}
                                  </select>
                                  <select
                                    value={m.leaseEnd.split('-')[0] || ''}
                                    onChange={e => {
                                      const updated = `${e.target.value}-${m.leaseEnd.split('-')[1]}`
                                      updateClientMachine(m.id, 'leaseEnd', updated)
                                      updateClientMachine(m.id, 'monthsLeft', calcMonthsLeft(updated))
                                    }}
                                    className="w-1/2 border border-slate-300 rounded-lg px-1.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-mint"
                                  >
                                    {Array.from({ length: 9 }, (_, i) => new Date().getFullYear() + i).map(y => (
                                      <option key={y} value={y}>{y}</option>
                                    ))}
                                  </select>
                                </div>
                              ) : (
                                <NumInput value={m.monthsLeft} onChange={v => updateClientMachine(m.id, 'monthsLeft', v)} placeholder="23" />
                              )}
                              {m.leaseEnd && m.monthsLeft !== '' && (
                                <p className="text-xs text-brand-mint-dark mt-0.5">{m.monthsLeft} months</p>
                              )}
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
                                {fmt((parseFloat(m.finalPayment) || 0) + (parseFloat(m.monthlyLease) || 0) * (parseFloat(m.monthsLeft) || 0))}
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

              {/* Current Print Cost */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-slate-600">Current Print Cost</p>
                  <div className="flex gap-1">
                    {[{ key: 'simple', label: 'Simple' }, { key: 'detailed', label: 'Detailed' }].map(m => (
                      <button
                        key={m.key}
                        onClick={() => setClientPrintMode(m.key)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${clientPrintMode === m.key
                          ? 'bg-brand-charcoal text-white border-brand-charcoal'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-brand-mint hover:text-brand-mint-dark'
                          }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {clientPrintMode === 'simple' ? (
                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="mb-4">
                        <label className="block text-xs text-slate-500 mb-1">Total Monthly Print Cost ($)</label>
                        <NumInput value={clientTotalPrintCost} onChange={setClientTotalPrintCost} prefix="$" placeholder="200" />
                      </div>

                      {/* Per-copy rates */}
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">B/W rate ($/copy)</label>
                          <NumInput value={clientSimpleBwRate} onChange={setClientSimpleBwRate} prefix="$" placeholder="0.01" />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Color rate ($/copy)</label>
                          <NumInput value={clientSimpleColorRate} onChange={setClientSimpleColorRate} prefix="$" placeholder="0.14" />
                        </div>
                      </div>

                      {(parseFloat(clientTotalPrintCost) || 0) > 0 && (
                        <>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-slate-500">B/W — {clientBwSplitPct}%</span>
                            <span className="text-xs font-semibold text-slate-500">Color — {100 - clientBwSplitPct}%</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={10}
                            value={clientBwSplitPct}
                            onChange={e => setClientBwSplitPct(Number(e.target.value))}
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#595f6e] bg-slate-200"
                          />
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <div className="bg-slate-200 rounded-lg px-3 py-2">
                              <p className="text-xs text-slate-500 mb-0.5">B/W — {fmt((parseFloat(clientTotalPrintCost) || 0) * clientBwSplitPct / 100)}/mo</p>
                              <p className="text-sm font-bold text-slate-700">{simpleBwUnitsPerMonth.toLocaleString()} copies/mo</p>
                            </div>
                            <div className="bg-brand-mint-light rounded-lg px-3 py-2">
                              <p className="text-xs text-brand-mint-dark mb-0.5">Color — {fmt((parseFloat(clientTotalPrintCost) || 0) * (100 - clientBwSplitPct) / 100)}/mo</p>
                              <p className="text-sm font-bold text-brand-mint-dark">{simpleColorUnitsPerMonth.toLocaleString()} copies/mo</p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {(parseFloat(clientTotalPrintCost) || 0) > 0 && (
                      <div className="bg-brand-mint-light border border-brand-mint rounded-xl px-4 py-3">
                        <p className="text-xs font-semibold text-brand-mint-dark mb-1">Total Monthly Print Cost</p>
                        <p className="text-lg font-bold text-brand-charcoal">{fmt(clientTotalPrintCost)}</p>
                      </div>
                    )}
                  </div>
                ) : (
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

                    {(clientBwUnits || clientColorUnits) && (
                      <div className="bg-brand-mint-light border border-brand-mint rounded-xl px-4 py-3">
                        <p className="text-xs font-semibold text-brand-mint-dark mb-2">Total Monthly Print Cost</p>
                        <p className="text-lg font-bold text-brand-charcoal">
                          {fmt((parseFloat(clientBwCost) || 0) * (parseFloat(clientBwUnits) || 0) +
                            (parseFloat(clientColorCost) || 0) * (parseFloat(clientColorUnits) || 0))}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New proposal name modal */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
            <h2 className="text-lg font-bold text-slate-800 mb-1">New Proposal</h2>
            <p className="text-sm text-slate-400 mb-5">Enter the client's name to get started</p>
            <input
              autoFocus
              type="text"
              value={draftName}
              onChange={e => setDraftName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && draftName.trim()) { setClientName(draftName.trim()); setShowNameModal(false) }
                if (e.key === 'Escape') navigate('/calculator')
              }}
              placeholder="Client name"
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-mint mb-5"
            />
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/calculator')}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { if (draftName.trim()) { setClientName(draftName.trim()); setShowNameModal(false) } }}
                disabled={!draftName.trim()}
                className="flex-1 py-2.5 rounded-xl bg-brand-mint text-white text-sm font-semibold hover:bg-brand-mint-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Create Proposal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back button */}
      <button
        onClick={() => {
          if (isDirty && !window.confirm('You have unsaved changes. Leave without saving?')) return
          navigate('/calculator')
        }}
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-brand-mint-dark transition-colors font-medium mb-4"
      >
        ← All Proposals
      </button>

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-800">{clientName || 'Unnamed'}</h1>
          {isDirty && (
            <span className="text-xs text-amber-500 font-medium">● Unsaved</span>
          )}
        </div>
        <button
          onClick={() => setShowClientProfile(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-mint-dark transition-colors"
        >
          Edit Client
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-24">
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
                  <span className="text-xs text-slate-400">from client setup</span>
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
                <div className="space-y-3">
                  <Field label="Monthly Lease ($)">
                    <NumInput value={monthlyLease} onChange={setMonthlyLease} prefix="$" placeholder="200" />
                  </Field>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-slate-600">Months Remaining</label>
                      <button
                        type="button"
                        onClick={() => {
                          if (monthsLeftEnd) {
                            setMonthsLeftEnd('')
                          } else {
                            const now = new Date()
                            const defaultEnd = `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}`
                            setMonthsLeftEnd(defaultEnd)
                            setMonthsLeft(calcMonthsLeft(defaultEnd))
                          }
                        }}
                        className="text-xs text-brand-mint-dark hover:underline"
                      >
                        {monthsLeftEnd ? '✏️ Enter manually' : '📅 Pick end date'}
                      </button>
                    </div>
                    {monthsLeftEnd ? (
                      <div className="flex gap-2">
                        <select
                          value={monthsLeftEnd.split('-')[1] || ''}
                          onChange={e => {
                            const updated = `${monthsLeftEnd.split('-')[0]}-${e.target.value}`
                            setMonthsLeftEnd(updated)
                            setMonthsLeft(calcMonthsLeft(updated))
                          }}
                          className="flex-1 border border-slate-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-mint"
                        >
                          {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((m, i) => (
                            <option key={m} value={m}>{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}</option>
                          ))}
                        </select>
                        <select
                          value={monthsLeftEnd.split('-')[0] || ''}
                          onChange={e => {
                            const updated = `${e.target.value}-${monthsLeftEnd.split('-')[1]}`
                            setMonthsLeftEnd(updated)
                            setMonthsLeft(calcMonthsLeft(updated))
                          }}
                          className="flex-1 border border-slate-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-mint"
                        >
                          {Array.from({ length: 9 }, (_, i) => new Date().getFullYear() + i).map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <NumInput value={monthsLeft} onChange={setMonthsLeft} placeholder="23" />
                    )}
                    {monthsLeftEnd && monthsLeft !== '' && (
                      <p className="text-xs text-brand-mint-dark mt-1">{monthsLeft} months remaining</p>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <Field label="Outstanding Final Payment ($)">
                    <NumInput value={outstandingFinal} onChange={setOutstandingFinal} prefix="$" placeholder="3000" />
                  </Field>
                </div>
                <div className="bg-slate-50 rounded-lg py-3 mt-2">
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
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
              {[
                { key: 'konica', label: 'KN', sub: 'Rebuilt' },
                { key: 'fujifilm', label: 'FF', sub: 'Rebuilt' },
                { key: 'fujifilm_new', label: 'FF', sub: 'Brand New' },
                { key: 'epson', label: 'Epson', sub: 'Brand New' },
              ].map(b => (
                <button
                  key={b.key}
                  onClick={() => { setMachineBrand(b.key); setSelectedMachine(null) }}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left border ${machineBrand === b.key
                    ? 'bg-brand-mint text-white border-brand-mint'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-brand-mint hover:bg-brand-mint-light hover:text-brand-mint-dark'
                    }`}
                >
                  <span className="font-semibold text-xs">{b.label} <span className={`font-normal ${machineBrand === b.key ? 'text-white/70' : 'text-slate-400'}`}>({b.sub})</span></span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1.5 mb-4">
              {MACHINE_CATALOGUE[machineBrand].map(m => (
                <button
                  key={m.name}
                  onClick={() => { setSelectedMachine(m.name); setMachineCost(String(m.cost)) }}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-colors ${selectedMachine === m.name
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
            <Field label="Trade-in Value ($)" hint="Enter as negative to reduce total">
              <NumInput value={tradeIn} onChange={setTradeIn} prefix="$" placeholder="-1000" />
            </Field>
          </SectionCard>

          {/* 3. Free Copies / Print Charges */}
          <SectionCard title="3. Free Copy Charges">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => handleCopierToggle('small')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${copierType === 'small'
                  ? 'bg-brand-mint text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                Small Copier
              </button>
              <button
                onClick={() => handleCopierToggle('big')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${copierType === 'big'
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

            <div className="bg-slate-50 rounded-lg py-3 mt-2">
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

            {(clientPrintMode === 'simple' ? simpleBwUnitsPerMonth > 0 || simpleColorUnitsPerMonth > 0 : clientBwUnits || clientColorUnits) && (
              <div className="mt-3 border border-brand-mint rounded-xl overflow-hidden">
                <div className="bg-brand-mint-light px-4 py-2 flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-brand-mint-dark">👤 Client Volume Reference</span>
                  <span className="text-xs text-brand-mint">(monthly × 30 months)</span>
                </div>
                <div className="px-4 py-3 bg-white space-y-2">
                  {(clientPrintMode === 'simple' ? simpleBwUnitsPerMonth > 0 : !!clientBwUnits) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">
                        B&amp;W — {(clientPrintMode === 'simple' ? simpleBwUnitsPerMonth : Number(clientBwUnits)).toLocaleString()}/mo × 30
                      </span>
                      <span className="font-semibold text-brand-mint-dark">{clientBwMonthly.toLocaleString()} copies</span>
                    </div>
                  )}
                  {(clientPrintMode === 'simple' ? simpleColorUnitsPerMonth > 0 : !!clientColorUnits) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">
                        Colour — {(clientPrintMode === 'simple' ? simpleColorUnitsPerMonth : Number(clientColorUnits)).toLocaleString()}/mo × 30
                      </span>
                      <span className="font-semibold text-brand-mint-dark">{clientColorMonthly.toLocaleString()} copies</span>
                    </div>
                  )}
                </div>
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
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${leasingPeriod === m
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
                  {(leasingRate * 100).toFixed(1)}% × {leasingYears} + 1
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
                    RV × r × 2 × 5 = {fmt(leasingRV)} × {(leasingRate * 100).toFixed(1)}% × 2 × 5
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

          {/* 8. Profit Calculator — merged with Smart Quote */}
          <SectionCard title="8. Profit Calculator">

            {/* ── Smart Quote Reference ── */}
            {grandTotal > 0 && leasingMonthly > 0 && (() => {
              const saving25 = currentMonthlyCost > 0 ? currentMonthlyCost * 0.75 : null
              const needsRebate = saving25 !== null && saving25 < breakEvenMonthly

              const points = [
                { key: 'breakeven', label: 'Break-even', value: breakEvenMonthly, color: 'text-red-500', dot: 'bg-red-500' },
                ...(saving25 !== null ? [{ key: 'saving25', label: '25% Saving', value: saving25, color: needsRebate ? 'text-red-400' : 'text-green-600', dot: needsRebate ? 'bg-red-300' : 'bg-green-400' }] : []),
                ...(currentMonthlyCost > 0 ? [{ key: 'client', label: 'Client Cost', value: currentMonthlyCost, color: 'text-brand-mint-dark', dot: 'bg-brand-mint' }] : []),
                ...(repaymentCeiling > 0 ? [{ key: 'ceiling', label: 'Ceiling', value: repaymentCeiling, color: 'text-amber-600', dot: 'bg-amber-400' }] : []),
              ].sort((a, b) => a.value - b.value)
              const minVal = points[0]?.value || 0
              const maxVal = points[points.length - 1]?.value || 1
              const range = maxVal - minVal || 1
              const pct = (v) => Math.min(100, Math.max(0, ((v - minVal) / range) * 100))

              return (
                <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">💡 Price Reference</p>

                  {/* Text rows */}
                  <div className="space-y-2">
                    {points.map(p => (
                      <div key={p.key} className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${p.color}`}>{p.label}</span>
                        <span className={`text-sm font-bold ${p.color}`}>{fmt(p.value)}<span className="text-xs font-normal text-slate-400">/mo</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            <Field label="Monthly Repayment ($)">
              <NumInput value={monthlyRepayment} onChange={setMonthlyRepayment} prefix="$" placeholder="300" />
            </Field>

            {(parseFloat(monthlyRepayment) || 0) > 0 && (
              <Field label="Nett Cost ($)" hint="Rebate auto-calculated from Monthly Repayment − Nett Cost × 30">
                <NumInput value={nettCost} onChange={handleNettCostChange} prefix="$" placeholder="250" />
              </Field>
            )}

            {/* ── Rebate ── */}
            {(parseFloat(monthlyRepayment) || 0) > 0 && (
              <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Rebate</p>
                  <span className="text-sm font-bold text-amber-700">
                    {rebatePerMonth > 0 ? `${fmt(rebatePerMonth)}/mo` : '—'}
                  </span>
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Total Rebate (30 months) ($)</label>
                  <NumInput
                    value={Math.abs(parseFloat(rebate) || 0) > 0 ? String(Math.abs(parseFloat(rebate) || 0)) : ''}
                    onChange={handleRebateTotalChange}
                    prefix="$"
                    placeholder="0"
                  />
                </div>

                {currentMonthlyCost > 0 && (() => {
                  const net = netCostPerMonth
                  const diff = currentMonthlyCost - net
                  const pct = (diff / currentMonthlyCost) * 100
                  const saving = diff >= 0
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-slate-100 rounded-xl px-4 py-3">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Client's Current Monthly Cost</p>
                        <span className="text-xl font-bold text-slate-700">{fmt(currentMonthlyCost)}</span>
                      </div>
                      <div className={`flex items-center justify-between rounded-xl px-4 py-3 border ${saving ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div>
                          <p className={`text-xs font-semibold ${saving ? 'text-green-700' : 'text-red-700'}`}>
                            Net Cost / Month
                            <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-bold ${saving ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                              {saving ? '▼' : '▲'} {Math.abs(pct).toFixed(1)}% · {saving ? '−' : '+'}{fmt(Math.abs(diff))}/mo
                            </span>
                          </p>
                        </div>
                        <span className={`text-xl font-bold ${saving ? 'text-green-700' : 'text-red-700'}`}>{fmt(net)}</span>
                      </div>
                    </div>
                  )
                })()}

                {currentMonthlyCost === 0 && rebatePerMonth > 0 && (
                  <div className="flex items-center justify-between bg-brand-mint-light border border-brand-mint rounded-xl px-4 py-3">
                    <div>
                      <p className="text-xs font-semibold text-brand-mint-dark">Net Cost / Month</p>
                      <p className="text-xs text-brand-mint mt-0.5">{fmt(parseFloat(monthlyRepayment))} − {fmt(rebatePerMonth)} rebate</p>
                    </div>
                    <span className="text-xl font-bold text-brand-mint-dark">{fmt(netCostPerMonth)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Profit */}
            {(parseFloat(monthlyRepayment) || 0) > 0 && (
              <div className={`flex items-center justify-between rounded-xl px-4 py-3 mb-4 border ${profit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <span className="font-bold text-slate-700">Profit</span>
                <span className={`text-lg font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(profit)}</span>
              </div>
            )}

            {/* Residual Value toggle */}
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-slate-600">Residual Value %</label>
              <div className="flex gap-1.5">
                {[0, 25, 30].map(pct => (
                  <button
                    key={pct}
                    onClick={() => setResidualPct(pct)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${residualPct === pct
                      ? 'bg-brand-charcoal text-white border-brand-charcoal'
                      : 'bg-white text-slate-600 border-slate-300 hover:border-brand-mint hover:text-brand-mint-dark'
                      }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl py-4 space-y-2">
              <ResultRow label="Grand Total Financed (principal)" value={fmt(grandTotalFinanced)} />
              <ResultRow label={`Residual Value — ${residualPct}% of GTF`} value={fmt(residualValue)} />
              <ResultRow label="Grand Total Price (your cost)" value={fmt(grandTotal)} />
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
                                ? fmt((parseFloat(m.purchaseCost) || 0) / ((parseFloat(m.years) || 5) * 12))
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

            {/* Save / Update */}
            <div ref={saveButtonRef} className="mt-6 flex items-center gap-3">
              <button
                onClick={saveRecord}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-brand-mint hover:bg-brand-mint-dark text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {id && id !== 'new' ? 'Update Proposal' : 'Save Proposal'}
              </button>
              {saveMsg && (
                <span className={`text-sm font-medium ${saveMsg.startsWith('Saved') ? 'text-brand-mint-dark' : 'text-red-500'}`}>
                  {saveMsg}
                </span>
              )}
            </div>
          </SectionCard>

        </div>
      </div>

      {/* Sticky save bar — appears when original button scrolls out of view */}
      <div className={`fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-sm border-t border-slate-200 px-4 py-3 flex items-center gap-3 shadow-lg transition-all duration-300 ${saveButtonVisible ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
        <button
          onClick={saveRecord}
          disabled={saving}
          className="flex-1 py-3 rounded-xl bg-brand-mint hover:bg-brand-mint-dark text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {id && id !== 'new' ? 'Update Proposal' : 'Save Proposal'}
        </button>
        {saveMsg && (
          <span className={`text-sm font-medium ${saveMsg.startsWith('Saved') ? 'text-brand-mint-dark' : 'text-red-500'}`}>
            {saveMsg}
          </span>
        )}
      </div>

      {/* Saving overlay */}
      {saving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
          <div className="bg-white rounded-2xl shadow-xl px-8 py-6 flex items-center gap-4">
            <div className="w-6 h-6 border-[3px] border-brand-mint border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold text-slate-700">Saving…</span>
          </div>
        </div>
      )}
    </div>
  )
}
