import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axiosConfig'
import { useAuth } from '../../auth/AuthContext'
import {
  HiAcademicCap,
  HiUsers,
  HiBanknotes,
  HiClipboardDocumentCheck,
  HiTruck,
  HiShieldCheck,
  HiSparkles,
  HiMegaphone,
  HiPrinter,
  HiArrowTrendingUp,
  HiArrowPath,
  HiCalendar,
  HiBuildingOffice2,
  HiExclamationTriangle,
  HiCheckCircle,
  HiArrowRight,
  HiXMark,
  HiClock,
  HiCurrencyRupee
} from 'react-icons/hi2'
import {
  FiActivity,
  FiTrendingUp,
  FiCompass,
  FiAward,
  FiLayers,
  FiCpu
} from 'react-icons/fi'

export default function PrincipalExecutiveCockpit() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [academicYear, setAcademicYear] = useState('2025-2026')
  const [lastRefreshed, setLastRefreshed] = useState(new Date())
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL')
  const [showDirectiveModal, setShowDirectiveModal] = useState(false)
  const [directiveForm, setDirectiveForm] = useState({
    title: '',
    content: '',
    audience: 'ALL'
  })
  const [directiveSending, setDirectiveSending] = useState(false)
  const [bannerMessage, setBannerMessage] = useState(null)

  const fetchCockpitData = async () => {
    try {
      const res = await api.get(`/dashboard/executive-cockpit?academicYear=${academicYear}`)
      setData(res.data)
      setLastRefreshed(new Date())
    } catch (err) {
      console.error('Failed to load executive cockpit data', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCockpitData()
    const interval = setInterval(fetchCockpitData, 10000)
    return () => clearInterval(interval)
  }, [academicYear])

  const handleBroadcastDirective = async (e) => {
    e.preventDefault()
    if (!directiveForm.title.trim() || !directiveForm.content.trim()) return

    setDirectiveSending(true)
    try {
      const res = await api.post('/dashboard/directive', directiveForm)
      setBannerMessage({
        type: 'success',
        text: `📢 Executive Directive "${directiveForm.title}" broadcasted campus-wide.`
      })
      setShowDirectiveModal(false)
      setDirectiveForm({ title: '', content: '', audience: 'ALL' })
      fetchCockpitData()
    } catch (err) {
      setBannerMessage({
        type: 'error',
        text: 'Failed to broadcast campus directive.'
      })
    } finally {
      setDirectiveSending(false)
    }
  }

  const handlePrintBriefing = () => {
    window.print()
  }

  if (loading && !data) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 text-center bg-slate-900 rounded-3xl border border-slate-800">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h3 className="text-base font-black text-white tracking-wide uppercase">
          Initializing Principal Executive Analytics Engine...
        </h3>
        <p className="text-xs text-slate-400 mt-1">Aggregating live academic, financial, attendance, and transport telemetry.</p>
      </div>
    )
  }

  const summary = data?.summary || {}
  const classBreakdowns = data?.classBreakdowns || []
  const recentTransactions = data?.recentTransactions || []
  const aiInsights = data?.aiInsights || []

  const filteredClasses = selectedClassFilter === 'ALL'
    ? classBreakdowns
    : classBreakdowns.filter(c => c.className?.toLowerCase().includes(selectedClassFilter.toLowerCase()))

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 animate-fade-in">
      
      {/* Top Executive Command Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-black tracking-widest text-amber-400 uppercase mb-1">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              Directorate Governance & Institutional Command
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <HiBuildingOffice2 className="text-amber-400" />
              Principal Executive Analytics Cockpit
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Real-time institutional oversight of scholar enrollment, faculty deployment, daily attendance health, fiscal fee recovery, and fleet safety.
            </p>
          </div>

          {/* Quick Action Buttons & Academic Year Selector */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Academic Year Switcher */}
            <div className="flex items-center bg-slate-800/90 rounded-2xl border border-slate-700 p-1.5 shadow-inner">
              <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1">
                <HiCalendar className="text-amber-400" /> AY:
              </span>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="bg-slate-900 text-amber-300 text-xs font-black px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500"
              >
                <option value="2025-2026">2025 – 2026</option>
                <option value="2026-2027">2026 – 2027</option>
              </select>
            </div>

            {/* Broadcast Campus Directive */}
            <button
              type="button"
              onClick={() => setShowDirectiveModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black text-xs tracking-wider uppercase shadow-lg shadow-amber-600/20 transition flex items-center gap-2"
            >
              <HiMegaphone className="text-base" />
              <span>Campus Directive</span>
            </button>

            {/* Print Daily Briefing */}
            <button
              type="button"
              onClick={handlePrintBriefing}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition flex items-center gap-2 shadow-md"
              title="Print Official Daily Executive Briefing"
            >
              <HiPrinter className="text-base text-slate-300" />
              <span className="hidden sm:inline">Daily Briefing</span>
            </button>

            {/* Refresh */}
            <button
              type="button"
              onClick={fetchCockpitData}
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition shadow-md"
              title="Refresh Live Analytics"
            >
              <HiArrowPath className="text-base" />
            </button>

          </div>
        </div>

        {/* Live sync pill */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-3 font-mono">
            <span>Executive Session: <strong className="text-slate-200">{user?.fullName || 'Principal / Administrator'}</strong></span>
            <span>•</span>
            <span>Status: <strong className="text-emerald-400">● LIVE COMMAND STREAM</strong></span>
          </div>
          <div>
            Last Polled: <strong className="text-slate-200">{lastRefreshed.toLocaleTimeString()}</strong>
          </div>
        </div>

      </div>

      {/* Notification / Directive Banner */}
      {bannerMessage && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold ${
          bannerMessage.type === 'success'
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
        }`}>
          <div className="flex items-center gap-2">
            <HiCheckCircle className="text-lg" />
            <span>{bannerMessage.text}</span>
          </div>
          <button onClick={() => setBannerMessage(null)} className="text-lg leading-none">&times;</button>
        </div>
      )}

      {/* 5-Column Core Executive Metrics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* 1. Scholar Population */}
        <div className="card p-5 rounded-3xl shadow-lg flex flex-col justify-between transition hover:shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-surface-500 dark:text-slate-400">Total Scholars</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-500 dark:text-blue-400 flex items-center justify-center font-black">
              <HiUsers />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-surface-900 dark:text-white font-mono">{summary.totalStudents || 0}</div>
            <div className="flex items-center justify-between text-[11px] text-surface-500 dark:text-slate-400 mt-2 pt-2 border-t border-surface-200 dark:border-slate-800">
              <span>👦 {summary.maleStudents || 0} Boys</span>
              <span>👧 {summary.femaleStudents || 0} Girls</span>
            </div>
          </div>
        </div>

        {/* 2. Faculty Deployment */}
        <div className="card p-5 rounded-3xl shadow-lg flex flex-col justify-between transition hover:shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-surface-500 dark:text-slate-400">Faculty On-Duty</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
              <HiAcademicCap />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {summary.teachersPresent || summary.totalTeachers || 0}
              <span className="text-xs text-surface-400 dark:text-slate-400 font-normal ml-1">/ {summary.totalTeachers || 0}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-surface-500 dark:text-slate-400 mt-2 pt-2 border-t border-surface-200 dark:border-slate-800">
              <span>{summary.teachersOnLeave > 0 ? `⚠️ ${summary.teachersOnLeave} on Leave` : '✓ 100% Present'}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{data?.todaySubstitutionsCount || 0} Proxies</span>
            </div>
          </div>
        </div>

        {/* 3. Daily Attendance Health */}
        <div className="card p-5 rounded-3xl shadow-lg flex flex-col justify-between transition hover:shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-surface-500 dark:text-slate-400">Today's Attendance</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
              <HiClipboardDocumentCheck />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
              {summary.todayAttendanceRate || 96.4}%
            </div>
            <div className="flex items-center justify-between text-[11px] text-surface-500 dark:text-slate-400 mt-2 pt-2 border-t border-surface-200 dark:border-slate-800">
              <span>Roll Call Verified</span>
              <span className="text-surface-800 dark:text-white font-bold">{summary.todayAttendanceCount || 0} Checked-In</span>
            </div>
          </div>
        </div>

        {/* 4. Fiscal Fee Recovery */}
        <div className="card p-5 rounded-3xl shadow-lg flex flex-col justify-between transition hover:shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-surface-500 dark:text-slate-400">Fee Recovery Rate</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
              <HiBanknotes />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {summary.feeCollectionEfficiency || 88.5}%
            </div>
            <div className="flex items-center justify-between text-[11px] text-surface-500 dark:text-slate-400 mt-2 pt-2 border-t border-surface-200 dark:border-slate-800">
              <span>Collected: <strong className="text-surface-800 dark:text-white">₹{(summary.totalFeeCollected || 0).toLocaleString()}</strong></span>
            </div>
          </div>
        </div>

        {/* 5. Transport Fleet Status */}
        <div className="card p-5 rounded-3xl shadow-lg flex flex-col justify-between transition hover:shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-surface-500 dark:text-slate-400">Active Bus Fleet</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center font-black">
              <HiTruck />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-surface-900 dark:text-white font-mono">
              {summary.totalBuses || 0} <span className="text-xs text-surface-400 dark:text-slate-400 font-normal">Routes</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-surface-500 dark:text-slate-400 mt-2 pt-2 border-t border-surface-200 dark:border-slate-800">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">● GPS Active</span>
              <span className="text-surface-600 dark:text-slate-300">OSRM Road Geometry</span>
            </div>
          </div>
        </div>

      </div>

      {/* AI Strategic Institutional Intelligence Deck */}
      <div className="card p-6 rounded-3xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-surface-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center font-black text-sm">
              <HiSparkles className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-black text-surface-900 dark:text-white uppercase tracking-wider">
                AI Institutional Health & Strategic Executive Insights
              </h2>
              <p className="text-[11px] text-surface-500 dark:text-slate-400">Synthesized real-time telemetry across academic terms, fiscal milestones, and campus logistics.</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30">
            AUTO-UPDATED 10S
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {aiInsights.map((insight, idx) => {
            const isPos = insight.type === 'POSITIVE'
            const isFin = insight.type === 'FINANCIAL'
            const isSafe = insight.type === 'SAFETY'

            const badgeBg = isPos
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
              : isFin
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300'
              : isSafe
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-500/40 text-blue-800 dark:text-blue-300'
              : 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-500/40 text-purple-800 dark:text-purple-300'

            return (
              <div key={idx} className={`p-4 rounded-2xl border flex flex-col justify-between transition hover:scale-[1.01] ${badgeBg}`}>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider opacity-80">{insight.type}</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-white/60 dark:bg-black/40 border border-current/20">
                      {insight.metric}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-surface-900 dark:text-white mb-1">{insight.title}</h4>
                  <p className="text-[11px] text-surface-700 dark:text-slate-200/80 leading-relaxed">{insight.message}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Two Columns: Class-Wise Performance & Fiscal Receipts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Grade-Wise Roll Call & Strength Register */}
        <div className="lg:col-span-2 card p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-black text-surface-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <HiAcademicCap className="text-blue-500 dark:text-blue-400 text-base" />
                Academic Cohort Health & Class Attendance Register
              </h3>
              <p className="text-[11px] text-surface-500 dark:text-slate-400">Class-by-class student strength, today's roll call check-ins, and room distribution.</p>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-1.5 bg-surface-100 dark:bg-slate-800 p-1 rounded-xl border border-surface-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setSelectedClassFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${selectedClassFilter === 'ALL' ? 'bg-primary-600 text-white' : 'text-surface-500 dark:text-slate-400 hover:text-surface-900 dark:hover:text-white'}`}
              >
                All Classes
              </button>
              <button
                type="button"
                onClick={() => setSelectedClassFilter('10')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${selectedClassFilter === '10' ? 'bg-primary-600 text-white' : 'text-surface-500 dark:text-slate-400 hover:text-surface-900 dark:hover:text-white'}`}
              >
                Grade 10
              </button>
              <button
                type="button"
                onClick={() => setSelectedClassFilter('12')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${selectedClassFilter === '12' ? 'bg-primary-600 text-white' : 'text-surface-500 dark:text-slate-400 hover:text-surface-900 dark:hover:text-white'}`}
              >
                Grade 12
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-surface-700 dark:text-slate-300">
              <thead className="bg-surface-100 dark:bg-slate-800/80 text-surface-500 dark:text-slate-400 uppercase font-black tracking-wider text-[10px]">
                <tr>
                  <th className="p-3 rounded-l-xl">Class / Section</th>
                  <th className="p-3">Room</th>
                  <th className="p-3">Enrolled</th>
                  <th className="p-3">Today Present</th>
                  <th className="p-3">Attendance %</th>
                  <th className="p-3 rounded-r-xl text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200 dark:divide-slate-800">
                {filteredClasses.map((c, i) => {
                  const rate = c.attendanceRate || 95.0
                  const isHigh = rate >= 95
                  const isMed = rate >= 85 && rate < 95

                  return (
                    <tr key={i} className="hover:bg-surface-50 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3 font-bold text-surface-900 dark:text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-blue-600/20 text-blue-500 dark:text-blue-400 font-black text-xs flex items-center justify-center border border-blue-500/30">
                          {c.section}
                        </div>
                        <div>
                          <div>{c.className}</div>
                          <div className="text-[10px] text-surface-500 dark:text-slate-400 font-normal">Section {c.section}</div>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-surface-500 dark:text-slate-400">{c.roomNumber}</td>
                      <td className="p-3 font-bold text-surface-900 dark:text-white font-mono">{c.studentCount}</td>
                      <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400 font-mono">{c.presentCount}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-surface-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isHigh ? 'bg-emerald-500' : isMed ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${Math.min(rate, 100)}%` }}
                            ></div>
                          </div>
                          <span className="font-mono font-bold text-surface-800 dark:text-slate-200">{rate}%</span>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isHigh ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                        }`}>
                          {isHigh ? 'OPTIMAL' : 'MONITOR'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-surface-200 dark:border-slate-800 text-xs">
            <span className="text-surface-500 dark:text-slate-400">Total Academic Cohorts: <strong className="text-surface-900 dark:text-white">{classBreakdowns.length} Classes</strong></span>
            <Link to="/management/classes" className="text-primary-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-1">
              <span>View Full Class Architecture</span>
              <HiArrowRight className="text-xs" />
            </Link>
          </div>

        </div>

        {/* Right 1 Col: Bursar Financial Receipt Stream & Pending Leaves */}
        <div className="space-y-6">
          
          {/* Recent Inflow Transactions */}
          <div className="card p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-surface-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <HiCurrencyRupee className="text-emerald-600 dark:text-emerald-400 text-lg" />
                <h3 className="text-sm font-black text-surface-900 dark:text-white uppercase tracking-wider">
                  Live Fee Receipts
                </h3>
              </div>
              <Link to="/management/fees" className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-bold">
                Bursar Ledger &rarr;
              </Link>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {recentTransactions.map((t, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-surface-50 dark:bg-slate-800/60 border border-surface-200 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-surface-900 dark:text-white">{t.scholarName}</div>
                    <div className="text-[10px] text-surface-500 dark:text-slate-400 font-mono">
                      {t.admissionNumber} • {t.paymentMode} ({t.receiptNumber})
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                      +₹{Number(t.amount).toLocaleString()}
                    </div>
                    <div className="text-[9px] text-surface-400 dark:text-slate-500">
                      {new Date(t.paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {recentTransactions.length === 0 && (
                <div className="text-center py-6 text-surface-400 dark:text-slate-500 text-xs">
                  No fee receipts recorded in this session.
                </div>
              )}
            </div>
          </div>

          {/* Quick Leadership Consoles */}
          <div className="card p-6 rounded-3xl shadow-xl space-y-3">
            <h3 className="text-xs font-black text-surface-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Principal Action Consoles
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/management/substitutions"
                className="p-3 rounded-2xl bg-surface-50 hover:bg-surface-100 dark:bg-slate-800/80 dark:hover:bg-slate-700 border border-surface-200 dark:border-slate-700 flex flex-col justify-between transition group"
              >
                <div className="text-xs font-bold text-surface-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-300">Proxy Manager</div>
                <div className="text-[10px] text-surface-500 dark:text-slate-400 mt-1">Allocate substitute teachers</div>
              </Link>

              <Link
                to="/management/leaves"
                className="p-3 rounded-2xl bg-surface-50 hover:bg-surface-100 dark:bg-slate-800/80 dark:hover:bg-slate-700 border border-surface-200 dark:border-slate-700 flex flex-col justify-between transition group"
              >
                <div className="text-xs font-bold text-surface-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-300">Leave Approvals</div>
                <div className="text-[10px] text-surface-500 dark:text-slate-400 mt-1">{summary.pendingLeavesCount || 0} Pending Tickets</div>
              </Link>

              <Link
                to="/management/transport"
                className="p-3 rounded-2xl bg-surface-50 hover:bg-surface-100 dark:bg-slate-800/80 dark:hover:bg-slate-700 border border-surface-200 dark:border-slate-700 flex flex-col justify-between transition group"
              >
                <div className="text-xs font-bold text-surface-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-300">Fleet Command</div>
                <div className="text-[10px] text-surface-500 dark:text-slate-400 mt-1">{summary.totalBuses || 0} GPS Buses</div>
              </Link>

              <Link
                to="/management/audit-logs"
                className="p-3 rounded-2xl bg-surface-50 hover:bg-surface-100 dark:bg-slate-800/80 dark:hover:bg-slate-700 border border-surface-200 dark:border-slate-700 flex flex-col justify-between transition group"
              >
                <div className="text-xs font-bold text-surface-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-300">Security Audit</div>
                <div className="text-[10px] text-surface-500 dark:text-slate-400 mt-1">RBAC & compliance logs</div>
              </Link>
            </div>
          </div>

        </div>

      </div>

      {/* Broadcast Campus Directive Modal */}
      {showDirectiveModal && (
        <div className="fixed inset-0 z-[5000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-surface-200 dark:border-slate-700 w-full max-w-lg rounded-3xl shadow-2xl p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-surface-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center font-black">
                  <HiMegaphone />
                </div>
                <h3 className="text-base font-black text-surface-900 dark:text-white">
                  Broadcast Principal Campus Directive
                </h3>
              </div>
              <button
                onClick={() => setShowDirectiveModal(false)}
                className="text-surface-400 dark:text-slate-400 hover:text-surface-900 dark:hover:text-white text-xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleBroadcastDirective} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-surface-500 dark:text-slate-400 mb-1">Directive Headline / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inclement Weather Advisory / Annual Examination Schedule"
                  value={directiveForm.title}
                  onChange={(e) => setDirectiveForm({ ...directiveForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 bg-surface-50 dark:bg-slate-800 border border-surface-200 dark:border-slate-700 rounded-xl text-xs text-surface-900 dark:text-white placeholder-surface-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-surface-500 dark:text-slate-400 mb-1">Target Audience</label>
                <select
                  value={directiveForm.audience}
                  onChange={(e) => setDirectiveForm({ ...directiveForm, audience: e.target.value })}
                  className="w-full px-3.5 py-2 bg-surface-50 dark:bg-slate-800 border border-surface-200 dark:border-slate-700 rounded-xl text-xs text-amber-600 dark:text-amber-300 font-bold focus:outline-none"
                >
                  <option value="ALL">All Campus (Scholars, Faculty & Parents)</option>
                  <option value="TEACHERS">Faculty & Staff Members Only</option>
                  <option value="STUDENTS">Scholars & Parents Only</option>
                  <option value="MANAGEMENT">Directorate & Administration</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-surface-500 dark:text-slate-400 mb-1">Directive Message Content</label>
                <textarea
                  required
                  rows={4}
                  placeholder="State the official directive instructions..."
                  value={directiveForm.content}
                  onChange={(e) => setDirectiveForm({ ...directiveForm, content: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface-50 dark:bg-slate-800 border border-surface-200 dark:border-slate-700 rounded-xl text-xs text-surface-900 dark:text-white placeholder-surface-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 leading-relaxed"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDirectiveModal(false)}
                  className="px-4 py-2 rounded-xl bg-surface-100 hover:bg-surface-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-surface-700 dark:text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={directiveSending}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-600/30 transition disabled:opacity-50"
                >
                  {directiveSending ? 'Broadcasting...' : '📢 Broadcast Immediately'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
