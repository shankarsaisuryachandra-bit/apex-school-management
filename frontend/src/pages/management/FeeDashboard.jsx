import { useState, useEffect, useMemo } from 'react'
import api from '../../api/axiosConfig'
import FeeBarChart from '../../components/charts/FeeBarChart'
import { downloadCsv } from '../../utils/csvExport'
import {
  HiArrowDownTray, HiBanknotes, HiCreditCard, HiPencilSquare,
  HiXMark, HiCheckCircle, HiExclamationCircle, HiClock,
  HiUserGroup, HiMagnifyingGlass, HiChartBar, HiArrowPath,
  HiBuildingLibrary, HiSparkles, HiCheck, HiAcademicCap,
  HiDocumentText, HiPrinter, HiClipboardDocumentCheck,
  HiArrowUpRight, HiShieldCheck
} from 'react-icons/hi2'
import { FaWhatsapp } from 'react-icons/fa'

/* ─────────────── Helpers ─────────────── */
const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const STATUS_CONFIG = {
  PAID:    { label: 'Fully Paid', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', dot: 'bg-emerald-500', icon: HiCheckCircle },
  PARTIAL: { label: 'Partial',    bg: 'bg-amber-100',   text: 'text-amber-900',   border: 'border-amber-300',   dot: 'bg-amber-500',   icon: HiClock },
  UNPAID:  { label: 'Unpaid',     bg: 'bg-red-100',     text: 'text-red-800',     border: 'border-red-300',     dot: 'bg-red-500',     icon: HiExclamationCircle },
}

const PAYMENT_MODE_CONFIG = {
  CASH:        { label: 'Cash Counter',        icon: '💵', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  UPI:         { label: 'UPI / QR Code',       icon: '📱', badge: 'bg-blue-50 text-blue-800 border-blue-200' },
  CARD:        { label: 'Debit / Credit Card',  icon: '💳', badge: 'bg-purple-50 text-purple-800 border-purple-200' },
  NET_BANKING: { label: 'Net Banking / NEFT',  icon: '🏦', badge: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  CHEQUE:      { label: 'Cheque',              icon: '📜', badge: 'bg-amber-50 text-amber-800 border-amber-200' },
  DD:          { label: 'Demand Draft',        icon: '🏛️', badge: 'bg-slate-100 text-slate-800 border-slate-300' },
  ONLINE:      { label: 'Online Portal',       icon: '🌐', badge: 'bg-sky-50 text-sky-800 border-sky-200' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function PaymentModeBadge({ mode }) {
  const cfg = PAYMENT_MODE_CONFIG[mode] || { label: mode || 'CASH', icon: '💵', badge: 'bg-slate-100 text-slate-700 border-slate-200' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${cfg.badge}`}>
      <span>{cfg.icon}</span>
      <span>{cfg.label}</span>
    </span>
  )
}

function ProgressBar({ paid, total }) {
  const pct = total > 0 ? Math.min((paid / total) * 100, 100) : 0
  const color = pct >= 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2.5 min-w-[100px]">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-extrabold text-slate-700 tabular-nums w-9 text-right">{Math.round(pct)}%</span>
    </div>
  )
}

function KpiCard({ label, value, sub, icon: Icon, color, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-5 rounded-3xl border transition-all duration-200 w-full shadow-sm hover:shadow-md
        ${active
          ? `${color.activeBorder} ${color.activeBg} shadow-md`
          : 'border-slate-200 bg-white hover:border-slate-300'
        }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold ${active ? color.iconBg : 'bg-slate-100'}`}>
          <Icon className={`w-6 h-6 ${active ? 'text-white' : color.iconText}`} />
        </div>
        {sub !== undefined && (
          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${color.subBg} ${color.subText}`}>
            {sub} Students
          </span>
        )}
      </div>
      <p className={`text-2xl font-black tabular-nums ${active ? color.valueText : 'text-[#0F2942]'}`}>{value}</p>
      <p className={`text-xs font-extrabold uppercase tracking-wider mt-1 ${active ? color.labelText : 'text-slate-500'}`}>{label}</p>
    </button>
  )
}

/* ─────────────── Main Component ─────────────── */
export default function FeeDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [selectedClass, setSelectedClass] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [showChart, setShowChart] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Payment Collection Modal State
  const [activePaymentStudent, setActivePaymentStudent] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMode, setPaymentMode] = useState('UPI')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [paymentError, setPaymentError] = useState('')
  const [submittingPayment, setSubmittingPayment] = useState(false)

  // Post-Payment Receipt & WhatsApp Modal State
  const [receiptData, setReceiptData] = useState(null)
  const [copiedReceipt, setCopiedReceipt] = useState(false)

  // Transaction History Modal State
  const [historyStudent, setHistoryStudent] = useState(null)
  const [historyList, setHistoryList] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // Promotion & Fee Rollover Modal State
  const [promoteStudent, setPromoteStudent] = useState(null)
  const [promoteTargetClassId, setPromoteTargetClassId] = useState('')
  const [promoteCustomFee, setPromoteCustomFee] = useState('35000')
  const [promoteMessage, setPromoteMessage] = useState('')
  const [promoteError, setPromoteError] = useState('')
  const [promoting, setPromoting] = useState(false)

  // Edit Fee Modal State
  const [activeEditFeeStudent, setActiveEditFeeStudent] = useState(null)
  const [editCurrentDue, setEditCurrentDue] = useState('')
  const [editPrevPending, setEditPrevPending] = useState('')
  const [editMessage, setEditMessage] = useState('')
  const [submittingEdit, setSubmittingEdit] = useState(false)

  const academicYear = '2025-2026'

  useEffect(() => { fetchDashboard() }, [])

  const fetchDashboard = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const { data } = await api.get(`/fees/dashboard?academicYear=${academicYear}`)
      setDashboard(data)
    } catch (error) {
      console.error('Failed to fetch fee dashboard:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchStudents = async (classId, status = '') => {
    setStudentsLoading(true)
    try {
      const params = new URLSearchParams({ classId, academicYear })
      if (status) params.append('status', status)
      const { data } = await api.get(`/fees/students?${params}`)
      setStudents(data)
    } catch (error) {
      console.error('Failed to fetch students:', error)
    } finally {
      setStudentsLoading(false)
    }
  }

  const handleClassSelect = (classId) => {
    setSelectedClass(classId)
    setStatusFilter('')
    setSearch('')
    fetchStudents(classId)
  }

  const handleStatusFilter = (status) => {
    setStatusFilter(status)
    setSearch('')
    if (selectedClass) fetchStudents(selectedClass, status)
  }

  const handleExportCsv = async () => {
    try {
      const params = new URLSearchParams({ classId: selectedClass, academicYear })
      if (statusFilter) params.append('status', statusFilter)
      const { data } = await api.get(`/fees/export/csv?${params}`)
      const className = dashboard?.classSummaries?.find(c => c.classId === selectedClass)?.className || 'fees'
      downloadCsv(data, `${className}_${statusFilter || 'all'}_fees.csv`)
    } catch (error) {
      console.error('CSV export failed:', error)
    }
  }

  /* ─────────────── Payment Collection Handler ─────────────── */
  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault()
    const amt = parseFloat(paymentAmount)
    if (!amt || amt <= 0 || amt > 5000000) {
      setPaymentError('Please enter a valid payment amount in the permitted range [₹0.01 - ₹5,000,000]')
      return
    }
    if (activePaymentStudent?.balanceDue && amt > activePaymentStudent.balanceDue) {
      setPaymentError(`Payment amount (₹${amt}) exceeds outstanding balance (₹${activePaymentStudent.balanceDue}). Overpayments are not permitted.`)
      return
    }

    setSubmittingPayment(true)
    setPaymentError('')
    try {
      const { data } = await api.post('/fees/payment', {
        studentId: activePaymentStudent.studentId,
        amount: amt,
        paymentMode,
        notes: paymentNotes,
        academicYear,
      })

      // Close payment input modal and open digital receipt modal
      setActivePaymentStudent(null)
      setPaymentAmount('')
      setPaymentNotes('')
      setReceiptData(data)

      // Refresh background data
      fetchStudents(selectedClass, statusFilter)
      fetchDashboard()
    } catch (error) {
      setPaymentError(error.response?.data?.message || 'Payment submission failed')
    } finally {
      setSubmittingPayment(false)
    }
  }

  /* ─────────────── Payment History Handler ─────────────── */
  const handleOpenHistory = async (student) => {
    setHistoryStudent(student)
    setHistoryLoading(true)
    setHistoryList([])
    try {
      const { data } = await api.get(`/fees/student/${student.studentId}/history?academicYear=${academicYear}`)
      setHistoryList(data)
    } catch (error) {
      console.error('Failed to fetch payment history:', error)
    } finally {
      setHistoryLoading(false)
    }
  }

  /* ─────────────── Student Promotion & Fee Rollover Handler ─────────────── */
  const isHighestGradeStudent = (student) => {
    if (!student) return false
    const name = student.className || ''
    const allGradeNums = (dashboard?.classSummaries || []).map(c => {
      const d = (c.className || '').replace(/[^0-9]/g, '')
      return d ? parseInt(d) : 0
    })
    const maxGrade = allGradeNums.length ? Math.max(...allGradeNums) : 10
    const curGrade = parseInt(name.replace(/[^0-9]/g, '')) || 0
    return curGrade >= maxGrade || name.toLowerCase().includes('10') || name.toLowerCase().includes('12') || name.toLowerCase().includes('xii')
  }

  const handleOpenPromoteModal = (student) => {
    setPromoteStudent(student)
    setPromoteMessage('')
    setPromoteError('')
    const isHighest = isHighestGradeStudent(student)
    const currentIndex = dashboard?.classSummaries?.findIndex(c => c.classId === selectedClass)
    const nextClass = dashboard?.classSummaries?.[currentIndex + 1] || dashboard?.classSummaries?.[0]
    setPromoteTargetClassId(isHighest ? '' : (nextClass ? nextClass.classId.toString() : ''))
    // IMPORTANT: As requested by user: "After promoting a student dont add currrent year fee implicitly ."
    // Default fee is 0!
    setPromoteCustomFee('0')
  }

  const handlePromoteSubmit = async (e) => {
    e.preventDefault()
    const isHighest = isHighestGradeStudent(promoteStudent)
    if (!isHighest && !promoteTargetClassId) {
      setPromoteError('Please select a target class to promote this student to')
      return
    }

    const feeVal = parseFloat(promoteCustomFee) || 0
    if (!isHighest && (feeVal < 0 || feeVal > 5000000)) {
      setPromoteError('New class fee must be in the permitted range [₹0 - ₹5,000,000].')
      return
    }

    setPromoting(true)
    setPromoteMessage('')
    setPromoteError('')
    try {
      const payload = {
        targetClassId: isHighest ? null : (parseInt(promoteTargetClassId) || null),
        targetAcademicYear: academicYear,
        newClassFee: isHighest ? 0 : (parseFloat(promoteCustomFee) || 0),
        isAlumni: isHighest
      }

      const { data } = await api.post(`/promotions/promote-student/${promoteStudent.studentId}`, payload)

      setPromoteMessage(data.message || (isHighest ? 'Student graduated and archived into Alumni Registry!' : 'Student promoted successfully! Remaining dues converted to Previous Pending Fee.'))
      setTimeout(() => {
        setPromoteStudent(null)
        setPromoteMessage('')
        fetchStudents(selectedClass, statusFilter)
        fetchDashboard()
      }, 2200)
    } catch (error) {
      setPromoteError(error.response?.data?.message || 'Failed to promote student')
    } finally {
      setPromoting(false)
    }
  }

  /* ─────────────── Fee Structure Edit Handler ─────────────── */
  const handleEditFeeSubmit = async (e) => {
    e.preventDefault()
    const curDue = parseFloat(editCurrentDue) || 0
    const prevDue = parseFloat(editPrevPending) || 0
    if (curDue < 0 || curDue > 5000000 || prevDue < 0 || prevDue > 5000000) {
      setEditMessage('Fee amounts must be in the permitted range [₹0 - ₹5,000,000].')
      return
    }

    setSubmittingEdit(true)
    setEditMessage('')
    try {
      await api.put(`/fees/student/${activeEditFeeStudent.studentId}?academicYear=${academicYear}`, {
        currentYearDue: curDue,
        previousYearPending: prevDue,
      })
      setEditMessage('✅ Fee structure updated successfully!')
      setTimeout(() => {
        setEditMessage('')
        setActiveEditFeeStudent(null)
        fetchStudents(selectedClass, statusFilter)
        fetchDashboard()
      }, 1500)
    } catch (error) {
      setEditMessage(error.response?.data?.message || 'Failed to update fee structure')
    } finally {
      setSubmittingEdit(false)
    }
  }

  // Copy Receipt Text to Clipboard
  const handleCopyReceiptText = () => {
    if (!receiptData) return
    const text =
      `🏛️ APEX INTERNATIONAL ACADEMY — OFFICIAL BURSAR FEE RECEIPT\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📄 Receipt No: ${receiptData.receiptNumber}\n` +
      `📅 Date: ${new Date(receiptData.paymentDate).toLocaleString('en-IN')}\n\n` +
      `👤 Student: ${receiptData.studentName}\n` +
      `🎓 Class: ${receiptData.className}\n` +
      `🆔 Admission No: ${receiptData.admissionNumber}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💵 FEE STATEMENT:\n` +
      (receiptData.previousYearPending > 0 ? `• Previous Pending Dues: ${fmt(receiptData.previousYearPending)}\n` : '') +
      `• Current Academic Fee: ${fmt(receiptData.currentYearDue)}\n` +
      `• Total Overall Fee: ${fmt(receiptData.grandTotal)}\n\n` +
      `✅ Amount Paid Just Now: ${fmt(receiptData.amount)}\n` +
      `💳 Collection Method: ${receiptData.paymentMode}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `⚠️ REMAINING BALANCE DUE: ${fmt(receiptData.balanceDue)}\n` +
      `📊 Status: ${receiptData.balanceDue <= 0 ? 'FULLY PAID' : 'PARTIALLY PAID (' + receiptData.status + ')'}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `— Office of the Bursar, Apex International Academy`

    navigator.clipboard.writeText(text)
    setCopiedReceipt(true)
    setTimeout(() => setCopiedReceipt(false), 2500)
  }

  // Build General WhatsApp reminder message
  const buildWhatsAppLink = (student) => {
    if (!student.whatsappLink) return null
    const msg = encodeURIComponent(
      `🏛️ *Apex International Academy — Fee Payment Statement*\n\n` +
      `Dear Parent of *${student.studentName}*,\n\n` +
      `Please find below the current fee status for Session ${academicYear}:\n` +
      (student.previousYearPending > 0 ? `• Previous Pending Dues: ${fmt(student.previousYearPending)}\n` : '') +
      `• Current Academic Year Fee: ${fmt(student.currentYearDue)}\n` +
      `• *Total Overall Fee:* ${fmt(student.grandTotal)}\n` +
      `• Total Paid So Far: ${fmt(student.totalPaid)}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `⚠️ *Outstanding Balance Due:* *${fmt(student.balanceDue)}*\n` +
      `📊 Payment Status: *${student.status}*\n\n` +
      `Kindly clear the balance dues via our online portal or visit the accounts desk.\n\n` +
      `— Office of the Bursar, Apex International Academy`
    )
    const phone = student.whatsappLink.replace('https://wa.me/', '').split('?')[0]
    return `https://wa.me/${phone}?text=${msg}`
  }

  // Aggregated totals
  const totals = useMemo(() => {
    if (!students.length) return null
    return {
      grandTotal: students.reduce((s, st) => s + (st.grandTotal || 0), 0),
      totalPaid: students.reduce((s, st) => s + (st.totalPaid || 0), 0),
      totalBalance: students.reduce((s, st) => s + (st.balanceDue || 0), 0),
      totalPrevPending: students.reduce((s, st) => s + (st.previousYearPending || 0), 0),
      unpaid: students.filter(st => st.status === 'UNPAID').length,
      partial: students.filter(st => st.status === 'PARTIAL').length,
      paid: students.filter(st => st.status === 'PAID').length,
    }
  }, [students])

  // Filtered students by search
  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students
    const q = search.toLowerCase()
    return students.filter(s =>
      s.studentName?.toLowerCase().includes(q) ||
      s.admissionNumber?.toLowerCase().includes(q)
    )
  }, [students, search])

  // Unpaid/partial students for bulk WhatsApp
  const pendingStudents = useMemo(() => filteredStudents.filter(s => s.status !== 'PAID'), [filteredStudents])

  const selectedClassInfo = dashboard?.classSummaries?.find(c => c.classId === selectedClass)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400 font-bold text-xs animate-pulse">
        <div className="w-12 h-12 rounded-2xl bg-[#0F2942] text-amber-400 flex items-center justify-center shadow-lg">
          <HiBanknotes className="w-7 h-7 animate-bounce" />
        </div>
        <p>Loading Fee Accounts & Institutional Ledger...</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6 font-sans text-slate-800">

      {/* ── Top Header Banner ── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full bg-amber-500/10 text-amber-700 font-extrabold text-[10px] uppercase tracking-wider border border-amber-500/20 flex items-center gap-1">
              <HiSparkles className="w-3.5 h-3.5 text-amber-500" /> Institutional Fee Engine
            </span>
            <span className="text-xs text-slate-400 font-semibold">• Session {academicYear}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F2942] tracking-tight">
            Fee Management & Accounts Ledger
          </h1>
          <p className="text-slate-500 text-xs font-medium max-w-2xl">
            Track student fee collections, manage previous pending dues, promote students with automatic fee rollover, issue official receipts, and send instant WhatsApp payment vouchers to parents.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowChart(v => !v)}
            className={`px-4 py-2.5 rounded-xl border text-xs font-extrabold flex items-center gap-2 transition-all shadow-sm ${
              showChart
                ? 'bg-[#0F2942] text-amber-400 border-[#0F2942]'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
            }`}
          >
            <HiChartBar className="w-4 h-4" />
            <span>{showChart ? 'Hide Analytics' : 'Class Analytics'}</span>
          </button>
          <button
            onClick={() => { fetchDashboard(true); if (selectedClass) fetchStudents(selectedClass, statusFilter) }}
            disabled={refreshing}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 transition-all shadow-md shadow-amber-500/10"
          >
            <HiArrowPath className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Ledger</span>
          </button>
        </div>
      </div>

      {/* ── Optional Bar Chart ── */}
      {showChart && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm animate-fade-in space-y-4">
          <h2 className="text-base font-extrabold text-[#0F2942]">Class-Wise Fee Collection Breakdown</h2>
          <FeeBarChart data={dashboard?.classSummaries || []} />
        </div>
      )}

      {/* ── Class Selector Grid Hub ── */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HiBuildingLibrary className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-extrabold text-[#0F2942]">Select Class Section</h2>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            {dashboard?.classSummaries?.length || 0} Classes Registered
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {dashboard?.classSummaries?.map((cls) => {
            const isActive = selectedClass === cls.classId
            const paidPct = cls.totalStudents > 0 ? Math.round((cls.paidCount / cls.totalStudents) * 100) : 0
            return (
              <button
                key={cls.classId}
                onClick={() => handleClassSelect(cls.classId)}
                className={`flex flex-col items-center p-4 rounded-2xl border transition-all cursor-pointer group text-center relative overflow-hidden ${
                  isActive
                    ? 'border-amber-500 bg-[#0F2942] text-white shadow-lg shadow-[#0F2942]/20'
                    : 'border-slate-200 bg-white hover:border-amber-400 hover:shadow-md'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl mb-2 flex items-center justify-center font-extrabold text-sm transition-all ${
                    isActive ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-700 group-hover:bg-amber-100 group-hover:text-amber-800'
                  }`}
                >
                  {cls.className?.replace('Grade ', 'G').replace('Class ', '')}
                </div>
                <span className={`text-xs font-extrabold truncate max-w-full ${isActive ? 'text-white' : 'text-slate-900'}`}>
                  {cls.className}
                </span>
                <span className={`text-[10px] font-semibold mt-0.5 ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                  {cls.totalStudents} Students
                </span>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-200/40 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${paidPct}%` }}
                  />
                </div>
                <span className={`text-[10px] font-extrabold mt-1 ${isActive ? 'text-amber-400' : 'text-emerald-600'}`}>
                  {paidPct}% Paid
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Student Fee Details Panel ── */}
      {selectedClass && (
        <div className="space-y-6 animate-fade-in">

          {/* Class Summary KPI Cards */}
          {totals && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Total Fee Collected"
                value={fmt(totals.totalPaid)}
                icon={HiCheckCircle}
                color={{
                  activeBorder: 'border-emerald-500', activeBg: 'bg-emerald-50',
                  iconBg: 'bg-emerald-600', iconText: 'text-emerald-600',
                  valueText: 'text-emerald-800', labelText: 'text-emerald-700',
                  subBg: 'bg-emerald-100', subText: 'text-emerald-800'
                }}
                sub={totals.paid}
                active={statusFilter === 'PAID'}
                onClick={() => handleStatusFilter(statusFilter === 'PAID' ? '' : 'PAID')}
              />
              <KpiCard
                label="Partial Payments"
                value={fmt(students.filter(s => s.status === 'PARTIAL').reduce((sum, s) => sum + (s.totalPaid || 0), 0))}
                icon={HiClock}
                color={{
                  activeBorder: 'border-amber-500', activeBg: 'bg-amber-50',
                  iconBg: 'bg-amber-600', iconText: 'text-amber-600',
                  valueText: 'text-amber-800', labelText: 'text-amber-700',
                  subBg: 'bg-amber-100', subText: 'text-amber-900'
                }}
                sub={totals.partial}
                active={statusFilter === 'PARTIAL'}
                onClick={() => handleStatusFilter(statusFilter === 'PARTIAL' ? '' : 'PARTIAL')}
              />
              <KpiCard
                label="Outstanding Balance Due"
                value={fmt(totals.totalBalance)}
                icon={HiExclamationCircle}
                color={{
                  activeBorder: 'border-red-500', activeBg: 'bg-red-50',
                  iconBg: 'bg-red-600', iconText: 'text-red-600',
                  valueText: 'text-red-800', labelText: 'text-red-700',
                  subBg: 'bg-red-100', subText: 'text-red-800'
                }}
                sub={totals.unpaid}
                active={statusFilter === 'UNPAID'}
                onClick={() => handleStatusFilter(statusFilter === 'UNPAID' ? '' : 'UNPAID')}
              />
              <KpiCard
                label="Total Overall Billed"
                value={fmt(totals.grandTotal)}
                icon={HiUserGroup}
                color={{
                  activeBorder: 'border-blue-500', activeBg: 'bg-blue-50',
                  iconBg: 'bg-[#0F2942]', iconText: 'text-blue-600',
                  valueText: 'text-[#0F2942]', labelText: 'text-blue-700',
                  subBg: 'bg-blue-100', subText: 'text-blue-800'
                }}
                sub={students.length}
                active={statusFilter === ''}
                onClick={() => handleStatusFilter('')}
              />
            </div>
          )}

          {/* Search, Filters & Action Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">

            {/* Search Input */}
            <div className="relative w-full lg:w-72">
              <HiMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student or admission no..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl text-xs font-extrabold w-full lg:w-auto overflow-x-auto">
              {[
                { v: '', l: 'All Students' },
                { v: 'PAID', l: '✅ Fully Paid' },
                { v: 'PARTIAL', l: '⏳ Partial' },
                { v: 'UNPAID', l: '🔴 Unpaid' },
              ].map(({ v, l }) => (
                <button
                  key={v}
                  onClick={() => handleStatusFilter(v)}
                  className={`px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                    statusFilter === v ? 'bg-[#0F2942] text-amber-400 shadow' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2.5 w-full lg:w-auto justify-end">
              {pendingStudents.length > 0 && (
                <button
                  onClick={() => {
                    const link = buildWhatsAppLink(pendingStudents[0])
                    if (link) window.open(link, '_blank')
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow transition-all"
                  title="Send Fee Reminder to First Pending Parent"
                >
                  <FaWhatsapp className="w-4 h-4" />
                  <span>WhatsApp Reminder ({pendingStudents.length})</span>
                </button>
              )}

              <button
                onClick={handleExportCsv}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold flex items-center gap-1.5 border border-slate-300 transition-all"
              >
                <HiArrowDownTray className="w-4 h-4 text-slate-600" />
                <span>Export CSV</span>
              </button>
            </div>

          </div>

          {/* Student Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[#0F2942]">
                  {selectedClassInfo?.className || 'Class'} — Student Fee & Promotion Ledger
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Showing {filteredStudents.length} student records
                  {search && ` matching "${search}"`}
                  {statusFilter && ` • Status: ${statusFilter}`}
                </p>
              </div>
            </div>

            {studentsLoading ? (
              <div className="text-center py-12 text-slate-400 font-semibold text-xs animate-pulse">
                Loading class fee records...
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-medium">
                No student fee records found matching search or filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-200">
                      <th className="py-3.5 px-6">Student Details</th>
                      <th className="py-3.5 px-4 text-right">Prev Pending Dues</th>
                      <th className="py-3.5 px-4 text-right">Current Session Fee</th>
                      <th className="py-3.5 px-4 text-right">Total Overall Fee</th>
                      <th className="py-3.5 px-4 text-right">Total Paid</th>
                      <th className="py-3.5 px-4 text-right">Remaining Balance</th>
                      <th className="py-3.5 px-4 text-center">Collection %</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-6 text-right">Ledger Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((student) => {
                      const isUnpaidOrPartial = student.status !== 'PAID'
                      const waLink = buildWhatsAppLink(student)
                      return (
                        <tr key={student.studentId} className="hover:bg-slate-50/80 transition-colors">

                          {/* Student Info */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs text-white flex-shrink-0 shadow-sm ${
                                  student.status === 'PAID' ? 'bg-emerald-600' : student.status === 'PARTIAL' ? 'bg-amber-500' : 'bg-red-600'
                                }`}
                              >
                                {student.studentName?.charAt(0)}
                              </div>
                              <div>
                                <p className="font-extrabold text-slate-900 text-xs">{student.studentName}</p>
                                <p className="text-[10px] font-mono text-slate-400">Adm: {student.admissionNumber}</p>
                              </div>
                            </div>
                          </td>

                          {/* Previous Pending Dues */}
                          <td className="py-4 px-4 text-right font-medium">
                            {student.previousYearPending > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-extrabold text-xs border border-amber-200">
                                ⚠️ {fmt(student.previousYearPending)}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-bold">—</span>
                            )}
                          </td>

                          {/* Current Academic Session Fee */}
                          <td className="py-4 px-4 text-right font-medium text-slate-700">{fmt(student.currentYearDue)}</td>

                          {/* Grand Total Overall Fee */}
                          <td className="py-4 px-4 text-right font-black text-slate-900">{fmt(student.grandTotal)}</td>

                          {/* Total Paid */}
                          <td className="py-4 px-4 text-right font-extrabold text-emerald-700">{fmt(student.totalPaid)}</td>

                          {/* Balance Due */}
                          <td className="py-4 px-4 text-right font-black">
                            {student.balanceDue > 0 ? (
                              <span className="text-red-600">{fmt(student.balanceDue)}</span>
                            ) : (
                              <span className="text-emerald-600 font-extrabold">₹0.00</span>
                            )}
                          </td>

                          {/* Progress */}
                          <td className="py-4 px-4 text-center">
                            <ProgressBar paid={student.totalPaid} total={student.grandTotal} />
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4 text-center">
                            <StatusBadge status={student.status} />
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">

                              {/* 1. Pay Button */}
                              {isUnpaidOrPartial && (
                                <button
                                  onClick={() => {
                                    setActivePaymentStudent(student)
                                    setPaymentAmount(student.balanceDue?.toString() || '')
                                    setPaymentMode('UPI')
                                    setPaymentNotes('')
                                    setPaymentError('')
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-[#0F2942] hover:bg-slate-900 text-amber-400 font-extrabold text-[11px] flex items-center gap-1 transition-colors shadow-sm"
                                  title="Record Fee Payment & Issue Receipt"
                                >
                                  <HiCreditCard className="w-3.5 h-3.5" />
                                  <span>Pay</span>
                                </button>
                              )}

                              {/* 2. Transaction History Ledger Button */}
                              <button
                                onClick={() => handleOpenHistory(student)}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] flex items-center gap-1 transition-colors border border-slate-200"
                                title="View Complete Payment History Ledger"
                              >
                                <HiDocumentText className="w-3.5 h-3.5 text-slate-600" />
                                <span>History</span>
                              </button>

                              {/* 3. Promote Student & Rollover Balance Button */}
                              <button
                                onClick={() => handleOpenPromoteModal(student)}
                                className="p-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors"
                                title="Promote Student to Next Class & Rollover Outstanding Dues"
                              >
                                <HiAcademicCap className="w-4 h-4 text-indigo-700" />
                              </button>

                              {/* 4. Edit Fee Structure Button */}
                              <button
                                onClick={() => {
                                  setActiveEditFeeStudent(student)
                                  setEditCurrentDue(student.currentYearDue?.toString() || '0')
                                  setEditPrevPending(student.previousYearPending?.toString() || '0')
                                }}
                                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                title="Edit Student Current Fee & Previous Pending Dues"
                              >
                                <HiPencilSquare className="w-4 h-4 text-slate-600" />
                              </button>

                              {/* 5. WhatsApp Reminder Button */}
                              {isUnpaidOrPartial && waLink && (
                                <a
                                  href={waLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors"
                                  title="Send WhatsApp Fee Statement to Parent"
                                >
                                  <FaWhatsapp className="w-4 h-4" />
                                </a>
                              )}

                            </div>
                          </td>

                        </tr>
                      )
                    })}
                  </tbody>

                  {/* Summary Footer */}
                  {totals && (
                    <tfoot>
                      <tr className="bg-slate-50 border-t-2 border-slate-200 font-extrabold text-slate-900">
                        <td className="py-4 px-6 uppercase text-[10px] tracking-wider text-slate-500">
                          Class Totals ({filteredStudents.length} Students)
                        </td>
                        <td className="py-4 px-4 text-right text-amber-700">
                          {fmt(filteredStudents.reduce((s, st) => s + (st.previousYearPending || 0), 0))}
                        </td>
                        <td className="py-4 px-4 text-right">
                          {fmt(filteredStudents.reduce((s, st) => s + (st.currentYearDue || 0), 0))}
                        </td>
                        <td className="py-4 px-4 text-right text-[#0F2942]">
                          {fmt(filteredStudents.reduce((s, st) => s + (st.grandTotal || 0), 0))}
                        </td>
                        <td className="py-4 px-4 text-right text-emerald-700">
                          {fmt(filteredStudents.reduce((s, st) => s + (st.totalPaid || 0), 0))}
                        </td>
                        <td className="py-4 px-4 text-right text-red-600">
                          {fmt(filteredStudents.reduce((s, st) => s + (st.balanceDue || 0), 0))}
                        </td>
                        <td colSpan={3} />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ── Empty state when no class selected ── */}
      {!selectedClass && (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
            <HiBuildingLibrary className="w-7 h-7 text-amber-600" />
          </div>
          <h3 className="text-base font-extrabold text-[#0F2942]">Select a Class Section Above</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
            Click on any class card to view student fee accounts, record cash/online/UPI payments, view transaction histories, promote students, and send parent WhatsApp receipts.
          </p>
        </div>
      )}

      {/* ═══════════════ RECORD PAYMENT MODAL ═══════════════ */}
      {activePaymentStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-lg w-full border border-slate-200 relative text-xs">
            <div className="bg-[#0F2942] text-white px-6 py-4 flex items-center justify-between border-b-4 border-amber-500">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <HiCreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight">Record Fee Payment</h3>
                  <p className="text-[10px] text-slate-300 font-mono">
                    {activePaymentStudent.studentName} • Adm: {activePaymentStudent.admissionNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActivePaymentStudent(null)}
                className="p-1 rounded-full text-slate-300 hover:bg-white/10"
              >
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            {paymentError && (
              <div className="p-3 bg-red-50 text-red-900 border-b border-red-200 text-xs font-bold text-center">
                {paymentError}
              </div>
            )}

            <form onSubmit={handleRecordPaymentSubmit} className="p-6 space-y-4">
              
              {/* Fee Breakdown Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                  Current Institutional Statement
                </div>
                {activePaymentStudent.previousYearPending > 0 && (
                  <div className="flex justify-between font-bold text-amber-800">
                    <span>Previous Pending Dues:</span>
                    <span>{fmt(activePaymentStudent.previousYearPending)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-600">
                  <span>Current Academic Fee:</span>
                  <span>{fmt(activePaymentStudent.currentYearDue)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total Overall Billed:</span>
                  <span>{fmt(activePaymentStudent.grandTotal)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>Already Paid:</span>
                  <span>{fmt(activePaymentStudent.totalPaid)}</span>
                </div>
                <div className="flex justify-between font-black text-red-600 pt-1 border-t border-slate-200 text-sm">
                  <span>Current Outstanding Balance:</span>
                  <span>{fmt(activePaymentStudent.balanceDue)}</span>
                </div>
              </div>

              {/* Amount to Pay */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Payment Amount (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-slate-400">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter amount paid by parent"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 font-extrabold text-base focus:ring-2 focus:ring-amber-500 outline-none text-[#0F2942]"
                  />
                </div>
              </div>

              {/* Real-Time Calculation Preview */}
              {paymentAmount && !isNaN(parseFloat(paymentAmount)) && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-amber-900">
                    <span>Projected Total Paid:</span>
                    <span>{fmt((activePaymentStudent.totalPaid || 0) + parseFloat(paymentAmount))}</span>
                  </div>
                  <div className="flex items-center justify-between font-extrabold text-slate-900 text-xs">
                    <span>Remaining Balance Due:</span>
                    <span className="text-red-700 font-black">
                      {fmt(Math.max(0, (activePaymentStudent.balanceDue || 0) - parseFloat(paymentAmount)))}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-amber-800 font-semibold pt-1">
                    <HiSparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      {parseFloat(paymentAmount) >= activePaymentStudent.balanceDue
                        ? 'This payment will fully settle the outstanding fee!'
                        : 'Partial payment will update status to PARTIAL and issue an official receipt.'}
                    </span>
                  </div>
                </div>
              )}

              {/* Payment Mode (How Collected) */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Collection Method / How Fee Was Collected *
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50 text-slate-900"
                >
                  <option value="UPI">📱 UPI / QR Code (GPay, PhonePe, Paytm, BHIM)</option>
                  <option value="CASH">💵 Cash at Accounts Desk</option>
                  <option value="CARD">💳 Debit / Credit Card (POS Terminal)</option>
                  <option value="NET_BANKING">🏦 Net Banking / NEFT / RTGS / IMPS</option>
                  <option value="CHEQUE">📜 Bank Cheque</option>
                  <option value="DD">🏛️ Demand Draft (DD)</option>
                  <option value="ONLINE">🌐 Online Payment Gateway</option>
                </select>
              </div>

              {/* Transaction Notes / Ref */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Transaction Reference / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI UTR #938210398 or Cheque #10293 Bank of India"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActivePaymentStudent(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold uppercase shadow flex items-center justify-center gap-1.5"
                >
                  {submittingPayment ? (
                    <>
                      <HiArrowPath className="w-4 h-4 animate-spin" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <>
                      <HiCheck className="w-4 h-4" />
                      <span>Record Payment & Receipt</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ═══════════════ DIGITAL FEE RECEIPT & WHATSAPP MODAL ═══════════════ */}
      {receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-lg w-full border border-slate-200 relative text-xs">
            
            {/* Oxford Navy Header */}
            <div className="bg-[#0F2942] text-white px-6 py-5 border-b-4 border-amber-500 relative">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400 font-extrabold text-[10px] uppercase tracking-wider">
                    <HiShieldCheck className="w-4 h-4" /> Apex International Academy
                  </div>
                  <h3 className="text-lg font-black tracking-tight">Official Bursar Fee Receipt</h3>
                  <p className="text-[10px] text-slate-300">Office of the Accounts & Financial Administration</p>
                </div>
                <button
                  onClick={() => setReceiptData(null)}
                  className="p-1 rounded-full text-slate-300 hover:bg-white/10"
                >
                  <HiXMark className="w-5 h-5" />
                </button>
              </div>

              {/* Receipt metadata bar */}
              <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-300">
                <span className="font-mono bg-white/10 px-2 py-0.5 rounded-md font-bold text-amber-300">
                  {receiptData.receiptNumber}
                </span>
                <span className="text-slate-400 font-medium">
                  {new Date(receiptData.paymentDate).toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
            </div>

            {/* Receipt Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">

              {/* Student & Parent Info Block */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Student</span>
                  <span className="font-black text-slate-900">{receiptData.studentName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Class & Section</span>
                  <span className="font-bold text-slate-800">{receiptData.className}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Admission No</span>
                  <span className="font-mono font-bold text-slate-700">{receiptData.admissionNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Parent / Phone</span>
                  <span className="font-bold text-slate-800">{receiptData.parentPhone || '—'}</span>
                </div>
              </div>

              {/* Statement Breakdown Table */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 text-slate-600 text-[10px] font-extrabold uppercase">
                    <tr>
                      <th className="py-2.5 px-4 text-left">Fee Breakdown</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {receiptData.previousYearPending > 0 && (
                      <tr className="bg-amber-50/50">
                        <td className="py-2 px-4 text-amber-900 font-bold">Previous Pending Dues</td>
                        <td className="py-2 px-4 text-right font-extrabold text-amber-800">{fmt(receiptData.previousYearPending)}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="py-2 px-4 text-slate-700">Current Academic Fee</td>
                      <td className="py-2 px-4 text-right font-bold text-slate-800">{fmt(receiptData.currentYearDue)}</td>
                    </tr>
                    <tr className="bg-slate-50 font-black">
                      <td className="py-2 px-4 text-slate-900">Total Overall Billed</td>
                      <td className="py-2 px-4 text-right text-slate-900">{fmt(receiptData.grandTotal)}</td>
                    </tr>
                    <tr className="bg-emerald-50/70 font-extrabold text-emerald-900">
                      <td className="py-2.5 px-4 flex items-center gap-1.5">
                        <HiCheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Amount Paid Just Now</span>
                      </td>
                      <td className="py-2.5 px-4 text-right text-emerald-800 text-sm font-black">{fmt(receiptData.amount)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 text-slate-500">Collection Method</td>
                      <td className="py-2 px-4 text-right">
                        <PaymentModeBadge mode={receiptData.paymentMode} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Balance Due Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-red-50 to-amber-50 border-2 border-red-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-red-700 block">
                    Remaining Balance Due
                  </span>
                  <span className="text-xl font-black text-red-700 tabular-nums">
                    {fmt(receiptData.balanceDue)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">Status</span>
                  <StatusBadge status={receiptData.status} />
                </div>
              </div>

              {/* Primary WhatsApp Dispatch Action */}
              <div className="space-y-2 pt-2">
                <a
                  href={receiptData.whatsappReceiptLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.01]"
                >
                  <FaWhatsapp className="w-5 h-5 text-white" />
                  <span>Send Receipt & Balance to Parent via WhatsApp</span>
                  <HiArrowUpRight className="w-4 h-4" />
                </a>

                <div className="flex gap-2">
                  <button
                    onClick={handleCopyReceiptText}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition-all border border-slate-200"
                  >
                    <HiClipboardDocumentCheck className="w-4 h-4 text-slate-600" />
                    <span>{copiedReceipt ? 'Copied Receipt!' : 'Copy Receipt Text'}</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition-all border border-slate-200"
                  >
                    <HiPrinter className="w-4 h-4 text-slate-600" />
                    <span>Print</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ PAYMENT TRANSACTION HISTORY LEDGER MODAL ═══════════════ */}
      {historyStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-3xl w-full border border-slate-200 relative text-xs">
            
            {/* Header */}
            <div className="bg-[#0F2942] text-white px-6 py-4 flex items-center justify-between border-b-4 border-amber-500">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <HiDocumentText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight">Student Fee Payment History Ledger</h3>
                  <p className="text-[10px] text-slate-300 font-mono">
                    {historyStudent.studentName} • Adm: {historyStudent.admissionNumber} • {historyStudent.className}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistoryStudent(null)}
                className="p-1 rounded-full text-slate-300 hover:bg-white/10"
              >
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Balance Summary Strip */}
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Prev Dues</span>
                <span className="font-extrabold text-amber-800">{fmt(historyStudent.previousYearPending)}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Overall Fee</span>
                <span className="font-extrabold text-slate-900">{fmt(historyStudent.grandTotal)}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Collected</span>
                <span className="font-extrabold text-emerald-700">{fmt(historyStudent.totalPaid)}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Balance Due</span>
                <span className="font-black text-red-600">{fmt(historyStudent.balanceDue)}</span>
              </div>
            </div>

            {/* Transactions List */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {historyLoading ? (
                <div className="py-12 text-center text-slate-400 font-bold animate-pulse">
                  Loading payment transactions from ledger...
                </div>
              ) : historyList.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <HiBanknotes className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-slate-500 font-bold">No payment transactions recorded for this student yet.</p>
                  <p className="text-[11px] text-slate-400">Click the "Pay" button to record a payment.</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Receipt No & Date</th>
                        <th className="py-3 px-4 text-right">Amount Paid</th>
                        <th className="py-3 px-4 text-center">Collection Method</th>
                        <th className="py-3 px-4">Staff / Notes</th>
                        <th className="py-3 px-4 text-right">WhatsApp Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {historyList.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-slate-900 block">{tx.receiptNumber}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(tx.paymentDate).toLocaleString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-black text-emerald-700 text-sm">
                            {fmt(tx.amountPaid)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <PaymentModeBadge mode={tx.paymentMode} />
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-700 block">{tx.recordedByName || 'Accounts Desk'}</span>
                            {tx.notes && <span className="text-[10px] text-slate-400 italic">{tx.notes}</span>}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {tx.whatsappReceiptLink && (
                              <a
                                href={tx.whatsappReceiptLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-extrabold text-[11px] transition-colors"
                                title="Resend Official Digital Receipt to Parent via WhatsApp"
                              >
                                <FaWhatsapp className="w-3.5 h-3.5 text-emerald-600" />
                                <span>WhatsApp Receipt</span>
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setHistoryStudent(null)}
                className="px-5 py-2 rounded-xl bg-[#0F2942] hover:bg-slate-900 text-white font-extrabold uppercase text-xs"
              >
                Close Ledger
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ═══════════════ PROMOTE STUDENT & FEE ROLLOVER MODAL ═══════════════ */}
      {promoteStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-lg w-full border border-slate-200 relative text-xs">
            
            {/* Header */}
            <div className="bg-[#0F2942] text-white px-6 py-4 flex items-center justify-between border-b-4 border-indigo-500">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <HiAcademicCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight">Promote Student & Rollover Fee</h3>
                  <p className="text-[10px] text-slate-300 font-mono">
                    {promoteStudent.studentName} • Adm: {promoteStudent.admissionNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPromoteStudent(null)}
                className="p-1 rounded-full text-slate-300 hover:bg-white/10"
              >
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            {promoteMessage && (
              <div className="p-4 bg-emerald-50 text-emerald-900 border-b border-emerald-200 text-xs font-bold text-center">
                ✅ {promoteMessage}
              </div>
            )}

            {promoteError && (
              <div className="p-4 bg-red-50 text-red-900 border-b border-red-200 text-xs font-bold text-center">
                ⚠️ {promoteError}
              </div>
            )}

            <form onSubmit={handlePromoteSubmit} className="p-6 space-y-4">

              {/* Automatic Rollover / Alumni Notice */}
              {isHighestGradeStudent(promoteStudent) ? (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 text-amber-950 space-y-2">
                  <div className="flex items-center gap-2 font-black text-xs text-amber-900">
                    <HiSparkles className="w-4 h-4 text-amber-600" />
                    <span>Highest Grade Terminal Class — Graduation to Alumni Record</span>
                  </div>
                  <p className="text-[11px] leading-relaxed font-medium text-amber-900">
                    <strong>{promoteStudent.studentName}</strong> is enrolled in <strong>{promoteStudent.className}</strong> (the highest grade in the institution).
                    Promoting this student will record them into the <strong>Official Alumni Registry</strong> under their respective class (<strong>{promoteStudent.className}</strong>) and academic year (<strong>{academicYear}</strong>).
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-black text-xs">
                    <HiSparkles className="w-4 h-4 text-indigo-600" />
                    <span>Automatic Fee Transformation Engine</span>
                  </div>
                  <p className="text-[11px] text-indigo-800 leading-relaxed font-medium">
                    When this student is promoted to the next class, any remaining unpaid fee balance of{' '}
                    <strong className="text-indigo-950 font-black">{fmt(promoteStudent.balanceDue)}</strong> will be automatically converted into{' '}
                    <strong className="underline decoration-indigo-400">Previous Pending Fee</strong>. No current year fee is added implicitly.
                  </p>
                </div>
              )}

              {/* Student Summary */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Class</span>
                  <span className="font-extrabold text-slate-900">{promoteStudent.className}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Outstanding Balance</span>
                  <span className="font-black text-red-600">{fmt(promoteStudent.balanceDue)}</span>
                </div>
              </div>

              {/* Conditional Fields based on whether highest grade */}
              {isHighestGradeStudent(promoteStudent) ? (
                <div className="p-3.5 bg-amber-500/10 rounded-2xl border border-amber-500/20 space-y-2 text-xs">
                  <div className="text-[10px] uppercase font-extrabold text-amber-900">
                    Alumni Archival Statement
                  </div>
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>Respective Class:</span>
                    <span className="font-black text-slate-900">{promoteStudent.className}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>Graduation Academic Year:</span>
                    <span className="font-mono font-bold text-slate-900">{academicYear}</span>
                  </div>
                  <div className="flex justify-between font-bold text-amber-800 pt-1 border-t border-amber-200">
                    <span>Outstanding Dues (Preserved in Ledger):</span>
                    <span className="font-black text-red-600">{fmt(promoteStudent.balanceDue)}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 italic pt-1">
                    Student will be archived in the Alumni Directory with full historical credentials and zero implicit current year fee.
                  </p>
                </div>
              ) : (
                <>
                  {/* Target Class Selection */}
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Promote To Target Class Section *
                    </label>
                    <select
                      required
                      value={promoteTargetClassId}
                      onChange={(e) => setPromoteTargetClassId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 text-slate-900"
                    >
                      <option value="">Select Target Class...</option>
                      {dashboard?.classSummaries?.map((cls) => (
                        <option key={cls.classId} value={cls.classId}>
                          {cls.className} ({cls.totalStudents} Students)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* New Class Fee Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-slate-700 uppercase">
                        New Class Academic Fee (₹)
                      </label>
                      <span className="text-[10px] text-indigo-700 font-extrabold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                        Leave ₹0.00 for no implicit fee
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={promoteCustomFee}
                      onChange={(e) => setPromoteCustomFee(e.target.value)}
                      placeholder="0.00 (no implicit fee added)"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-extrabold focus:ring-2 focus:ring-indigo-500 outline-none text-[#0F2942]"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Current year fee will ONLY be added if explicitly entered above.
                    </p>
                  </div>

                  {/* Summary Calculation Preview */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      New Applicable Fee Structure Preview
                    </div>
                    <div className="flex justify-between font-bold text-amber-800">
                      <span>⚡ Previous Pending Fee (Rolled Over):</span>
                      <span>{fmt(promoteStudent.balanceDue)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>➕ New Class Academic Year Fee:</span>
                      <span>{fmt(parseFloat(promoteCustomFee) || 0)}</span>
                    </div>
                    <div className="flex justify-between font-black text-indigo-900 pt-1 border-t border-slate-200 text-sm">
                      <span>🟰 Total Overall Fee in Next Class:</span>
                      <span>{fmt((promoteStudent.balanceDue || 0) + (parseFloat(promoteCustomFee) || 0))}</span>
                    </div>
                  </div>
                </>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPromoteStudent(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={promoting}
                  className={`flex-1 py-2.5 rounded-xl font-extrabold uppercase shadow flex items-center justify-center gap-1.5 text-white ${
                    isHighestGradeStudent(promoteStudent)
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {promoting ? (
                    <>
                      <HiArrowPath className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : isHighestGradeStudent(promoteStudent) ? (
                    <>
                      <HiAcademicCap className="w-4 h-4" />
                      <span>Graduate to Alumni Registry</span>
                    </>
                  ) : (
                    <>
                      <HiAcademicCap className="w-4 h-4" />
                      <span>Confirm Promotion & Rollover</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ═══════════════ EDIT FEE STRUCTURE MODAL ═══════════════ */}
      {activeEditFeeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full border border-slate-200 relative text-xs">
            <div className="bg-[#0F2942] text-white px-6 py-4 flex items-center justify-between border-b-4 border-blue-500">
              <div className="flex items-center gap-2">
                <HiPencilSquare className="w-6 h-6 text-blue-400" />
                <div>
                  <h3 className="text-base font-extrabold tracking-tight">Edit Fee Structure</h3>
                  <p className="text-[10px] text-slate-300 font-mono">{activeEditFeeStudent.studentName}</p>
                </div>
              </div>
              <button onClick={() => setActiveEditFeeStudent(null)} className="p-1 rounded-full text-slate-300 hover:bg-white/10">
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            {editMessage && (
              <div className="p-3 bg-emerald-50 text-emerald-900 border-b border-emerald-200 text-xs font-bold text-center">
                {editMessage}
              </div>
            )}

            <form onSubmit={handleEditFeeSubmit} className="p-6 space-y-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Current Academic Year Fee (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editCurrentDue}
                  onChange={(e) => setEditCurrentDue(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-extrabold focus:ring-2 focus:ring-blue-500 outline-none text-[#0F2942]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Previous Year Pending Dues (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editPrevPending}
                  onChange={(e) => setEditPrevPending(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-extrabold focus:ring-2 focus:ring-blue-500 outline-none text-[#0F2942]"
                />
              </div>

              {/* Total preview */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between font-extrabold text-slate-800">
                <span>Calculated Grand Total:</span>
                <span>{fmt((parseFloat(editCurrentDue) || 0) + (parseFloat(editPrevPending) || 0))}</span>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveEditFeeStudent(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold uppercase shadow"
                >
                  {submittingEdit ? 'Saving...' : 'Update Fee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
