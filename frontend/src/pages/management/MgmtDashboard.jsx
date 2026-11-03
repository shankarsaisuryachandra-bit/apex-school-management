import { useState, useEffect } from 'react'
import { useAuth } from '../../auth/AuthContext'
import api from '../../api/axiosConfig'
import { HiUsers, HiBanknotes, HiClipboardDocumentList, HiAcademicCap, HiArrowRight, HiShieldCheck, HiDocumentCheck } from 'react-icons/hi2'
import NoticeBoard from '../../components/ui/NoticeBoard'
import DashboardAlerts from '../../components/ui/DashboardAlerts'
import ClassReportCardGeneratorModal from '../../components/ClassReportCardGeneratorModal'
import { Link } from 'react-router-dom'

export default function MgmtDashboard() {
  const { user } = useAuth()
  const [showReportCardGenerator, setShowReportCardGenerator] = useState(false)
  const [stats, setStats] = useState({
    totalStudents: '—',
    totalFeeCollection: '—',
    todayAttendance: '—',
    totalTeachers: '—',
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/dashboard/stats')
      setStats({
        totalStudents: data.totalStudents?.toLocaleString() || '0',
        totalFeeCollection: '₹' + (data.totalFeeCollection?.toLocaleString() || '0'),
        todayAttendance: data.todayAttendance?.toLocaleString() || '0',
        totalTeachers: data.totalTeachers?.toLocaleString() || '0',
      })
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    }
  }

  const statCards = [
    { label: 'Enrolled Scholars', sub: 'Active academic body', value: stats.totalStudents, icon: HiUsers },
    { label: 'Fee Collections (YTD)', sub: 'Bursar account receipts', value: stats.totalFeeCollection, icon: HiBanknotes },
    { label: 'Today’s Attendance', sub: 'Verified roll call', value: stats.todayAttendance, icon: HiClipboardDocumentList },
    { label: 'Appointed Faculty', sub: 'Teaching & research staff', value: stats.totalTeachers, icon: HiAcademicCap },
  ]

  const quickActions = [
    {
      title: 'Fee Ledger & Bursar',
      desc: 'Audit invoices, track dues & export fiscal registers.',
      link: '/management/fees',
      icon: HiBanknotes,
    },
    {
      title: 'Institute E-Library',
      desc: 'Publish digital textbooks & syllabus to scholar body.',
      link: '/management/library',
      icon: HiAcademicCap,
    },
    {
      title: 'Academy CMS & Press',
      desc: 'Curate front-page announcements, gallery & faculty news.',
      link: '/management/cms',
      icon: HiShieldCheck,
    },
    {
      title: 'Promotions & Matriculation',
      desc: 'Manage term promotions, cohort progression & alumni.',
      link: '/management/promotions',
      icon: HiUsers,
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-[#E8E6DF] gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#8C6837] tracking-[0.2em] uppercase">
            <span>Directorate Governance</span>
            <span>•</span>
            <span>Apex International Academy</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#0B1B2B] mt-1 tracking-tight">
            Administrative Command
          </h1>
          <p className="text-sm text-[#5A6878] mt-1 max-w-2xl">
            Welcome back, <span className="font-semibold text-[#0B1B2B]">{user?.fullName}</span>. Overview of institutional operations, scholar registers, and daily governance.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowReportCardGenerator(true)}
            className="btn-primary text-xs !py-2.5 !px-4 flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            title="Generate and publish whole class report cards in 1 click"
          >
            <HiDocumentCheck className="w-4 h-4 text-emerald-200" />
            <span>⚡ 1-Click Class Report Cards</span>
          </button>
          <Link
            to="/management/students"
            className="btn-primary text-xs !py-2.5 !px-4"
          >
            Manage Student Records
          </Link>
          <Link
            to="/management/audit-logs"
            className="btn-secondary text-xs !py-2.5 !px-4"
          >
            Audit Logs
          </Link>
        </div>
      </div>

      {/* Real-time Alerts */}
      <DashboardAlerts />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-5 border border-[#E8E6DF] shadow-[0_2px_8px_-2px_rgba(11,27,43,0.05)] hover:border-[#C5A059] transition-all group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#7A889B]">{stat.label}</p>
                <p className="text-2xl font-serif font-bold text-[#0B1B2B] mt-1.5 group-hover:text-[#0B1B2B]">{stat.value}</p>
                <p className="text-[11px] text-[#8C9BAE] mt-0.5">{stat.sub}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#FAF9F5] border border-[#E8E6DF] flex items-center justify-center text-[#0B1B2B] group-hover:border-[#C5A059] group-hover:text-[#C5A059] transition-colors">
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-serif font-bold text-[#0B1B2B]">
            Operational Key Consoles
          </h2>
          <span className="text-xs text-[#7A889B]">Institutional Quick Links</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, i) => (
            <Link
              key={i}
              to={action.link}
              className="bg-white p-5 rounded-xl border border-[#E8E6DF] hover:border-[#0B1B2B] shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#0B1B2B] text-[#DFBF77] flex items-center justify-center mb-3">
                  <action.icon className="w-5 h-5" />
                </div>
                <h3 className="font-serif font-bold text-[#0B1B2B] text-sm group-hover:text-[#0B1B2B]">
                  {action.title}
                </h3>
                <p className="text-xs text-[#5A6878] mt-1 leading-relaxed">
                  {action.desc}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#F2F0E8] flex items-center justify-between text-xs font-semibold text-[#0B1B2B] group-hover:text-[#C5A059]">
                <span>Access Console</span>
                <HiArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Advanced Performance Forecasting & Institutional Insights */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8E6DF] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F2F0E8]">
          <div>
            <h2 className="text-lg font-serif font-bold text-[#0B1B2B] flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#C5A059]"></span>
              Institutional Performance & Financial Forecast Matrix
            </h2>
            <p className="text-xs text-[#5A6878] mt-0.5">Automated predictive analytics for academic term pass rates, fee recovery targets, and attendance trends.</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#FAF9F5] text-[#8C6837] text-xs font-bold border border-[#E8E6DF]">
            Target AY 2025-2026
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          {/* Card 1: Academic Pass Rate Trend */}
          <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E8E6DF] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-[#7A889B] text-[10px]">Academic Pass Projection</span>
              <span className="text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                +4.2% YoY
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-serif font-bold text-[#0B1B2B]">94.8%</span>
              <span className="text-slate-500 font-medium">Projected Distinction Rate</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-600 h-full w-[94%] rounded-full"></div>
            </div>
            <p className="text-[11px] text-[#5A6878]">Grade 10 & 12 mock examination scores indicate highest performance in Mathematics and Computer Science.</p>
          </div>

          {/* Card 2: Fee Recovery Forecast */}
          <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E8E6DF] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-[#7A889B] text-[10px]">Fiscal Fee Recovery Forecast</span>
              <span className="text-amber-800 font-extrabold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                88% Collected
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-serif font-bold text-[#0B1B2B]">₹18,45,000</span>
              <span className="text-slate-500 font-medium">/ ₹21,00,000 Total Dues</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full w-[88%] rounded-full"></div>
            </div>
            <p className="text-[11px] text-[#5A6878]">Q3 fee collection cycle on track. Automated WhatsApp reminders issued to pending balance accounts.</p>
          </div>

          {/* Card 3: Attendance Consistency */}
          <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E8E6DF] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-[#7A889B] text-[10px]">Scholar Attendance Stability</span>
              <span className="text-blue-700 font-extrabold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                96.2% Avg
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-serif font-bold text-[#0B1B2B]">96.2%</span>
              <span className="text-slate-500 font-medium">Daily Roll Call Average</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full w-[96%] rounded-full"></div>
            </div>
            <p className="text-[11px] text-[#5A6878]">Class attendance verified across all sections. Zero unauthorized absence spikes reported this week.</p>
          </div>
        </div>
      </div>

      {/* Official Notice Board */}
      <NoticeBoard />

      {/* 1-Click Class Report Card Generator Modal */}
      {showReportCardGenerator && (
        <ClassReportCardGeneratorModal onClose={() => setShowReportCardGenerator(false)} />
      )}
    </div>
  )
}

