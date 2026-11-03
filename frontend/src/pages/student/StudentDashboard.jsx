import { useState, useEffect } from 'react'
import api from '../../api/axiosConfig'
import { useAuth } from '../../auth/AuthContext'
import {
  HiCurrencyRupee, HiChartBar, HiClipboardDocumentList,
  HiIdentification, HiDocumentText, HiTruck, HiSparkles,
  HiTrophy, HiBookOpen, HiBuildingOffice, HiUserGroup, HiDocumentCheck,
  HiArrowRight, HiAcademicCap, HiCheckBadge
} from 'react-icons/hi2'
import NoticeBoard from '../../components/ui/NoticeBoard'
import DashboardAlerts from '../../components/ui/DashboardAlerts'
import IdCardModal from '../../components/IdCardModal'
import ReportCardModal from '../../components/ReportCardModal'
import TransportPassModal from '../../components/TransportPassModal'
import AiStudyTutorModal from '../../components/AiStudyTutorModal'
import HouseLeaderboardModal from '../../components/HouseLeaderboardModal'
import EBookReaderModal from '../../components/EBookReaderModal'
import HostelGatePassModal from '../../components/HostelGatePassModal'
import SubstitutionScheduleModal from '../../components/SubstitutionScheduleModal'
import CertificateRequestModal from '../../components/CertificateRequestModal'
import StudentTimetableModal from '../../components/StudentTimetableModal'
import { Link } from 'react-router-dom'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [showIdCard, setShowIdCard] = useState(false)
  const [showReportCard, setShowReportCard] = useState(false)
  const [showTransportPass, setShowTransportPass] = useState(false)
  const [showAiTutor, setShowAiTutor] = useState(false)
  const [showHouseLeaderboard, setShowHouseLeaderboard] = useState(false)
  const [showEBookReader, setShowEBookReader] = useState(false)
  const [showHostel, setShowHostel] = useState(false)
  const [showSubstitutions, setShowSubstitutions] = useState(false)
  const [showCertificates, setShowCertificates] = useState(false)
  const [showClassTimetable, setShowClassTimetable] = useState(false)

  // Academic Performance State
  const [academicGrades, setAcademicGrades] = useState([])
  const [loadingGrades, setLoadingGrades] = useState(true)
  const [reportCardStatus, setReportCardStatus] = useState(null)
  const [loadingStatus, setLoadingStatus] = useState(true)

  const studentId = user?.profileId || user?.userId || 1

  useEffect(() => {
    const fetchStudentGrades = async () => {
      try {
        const { data } = await api.get(`/academics/grades/student/${studentId}`)
        setAcademicGrades(data || [])
      } catch (err) {
        console.error('Error fetching dashboard student grades:', err)
        setAcademicGrades([])
      } finally {
        setLoadingGrades(false)
      }
    }

    const fetchReportCardStatus = async () => {
      try {
        const { data } = await api.get(`/reportcard/student/${studentId}/status`)
        setReportCardStatus(data)
      } catch (err) {
        console.debug('No published report card status:', err)
      } finally {
        setLoadingStatus(false)
      }
    }

    if (studentId) {
      fetchStudentGrades()
      fetchReportCardStatus()
    }
  }, [studentId])

  const quickServices = [
    { label: 'My Class Timetable', icon: HiAcademicCap, action: () => setShowClassTimetable(true), highlight: true },
    { label: 'Institutional ID Pass', icon: HiIdentification, action: () => setShowIdCard(true) },
    { label: reportCardStatus?.published ? 'Official Marksheet ★' : 'Term Report Card', icon: HiDocumentText, action: () => setShowReportCard(true), highlight: !!reportCardStatus?.published },
    { label: 'House Points', icon: HiTrophy, action: () => setShowHouseLeaderboard(true) },
    { label: 'Digital Library', icon: HiBookOpen, action: () => setShowEBookReader(true) },
    { label: 'AI Revision Tutor', icon: HiSparkles, action: () => setShowAiTutor(true) },
    { label: 'Transit Bus Pass', icon: HiTruck, action: () => setShowTransportPass(true) },
    { label: 'Faculty Timetable', icon: HiUserGroup, action: () => setShowSubstitutions(true) },
    { label: 'Bonafide Certificates', icon: HiDocumentCheck, action: () => setShowCertificates(true) },
  ]

  const mainDesks = [
    {
      title: 'Fee Dues & Receipts',
      desc: 'Verify tuition balance, term installment schedules, and download signed fee receipts.',
      link: '/student/fees',
      icon: HiCurrencyRupee,
      action: 'View Fee Statement'
    },
    {
      title: 'Scholastic Academic Record',
      desc: 'Continuous assessments, term grades, teacher remarks, and cumulative performance track.',
      link: '/student/academics',
      icon: HiChartBar,
      action: 'View Grades'
    },
    {
      title: 'Attendance Register',
      desc: 'Monthly attendance percentage, verified day-wise roll logs, and statutory minimum status.',
      link: '/student/attendance',
      icon: HiClipboardDocumentList,
      action: 'Check Attendance'
    },
    {
      title: 'Coursework & Homework',
      desc: 'Active assignment submissions, upcoming deadlines, uploaded essays, and faculty grades.',
      link: '/student/assignments',
      icon: HiDocumentText,
      action: 'View Assignments'
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Editorial Scholar Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-[#E8E6DF] gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#8C6837] tracking-[0.2em] uppercase">
            <span>Scholar Desk</span>
            <span>•</span>
            <span>Apex International Academy</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#0B1B2B] mt-1 tracking-tight">
            Scholar Academic Portal
          </h1>
          <p className="text-sm text-[#5A6878] mt-1 max-w-2xl">
            Welcome, <span className="font-semibold text-[#0B1B2B]">{user?.fullName}</span>. Access your coursework, term schedules, digital credentials, and academic standing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowIdCard(true)}
            className="btn-primary text-xs !py-2.5 !px-4 flex items-center gap-1.5"
          >
            <HiIdentification className="w-4 h-4 text-[#DFBF77]" />
            <span>Digital ID Card</span>
          </button>
          <button
            onClick={() => setShowReportCard(true)}
            className="btn-secondary text-xs !py-2.5 !px-4"
          >
            Term Report
          </button>
        </div>
      </div>

      {/* Quick Institutional Services Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E8E6DF] shadow-sm">
        <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#7A889B] mb-2.5">
          Institutional Quick Credentials & Services
        </p>
        <div className="flex flex-wrap gap-2">
          {quickServices.map((svc, i) => (
            <button
              key={i}
              onClick={svc.action}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                svc.highlight
                  ? 'bg-gradient-to-r from-[#0B1B2B] to-[#1A2E44] text-[#DFBF77] border border-[#C5A059] shadow-sm hover:brightness-110'
                  : 'bg-[#FAF9F5] text-[#0B1B2B] hover:bg-[#F0EEE4] border border-[#E2DFD2]'
              }`}
            >
              <svc.icon className={`w-3.5 h-3.5 ${svc.highlight ? 'text-[#DFBF77]' : 'text-[#8C6837]'}`} />
              <span>{svc.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 🌟 Official Published Report Card Announcement Banner */}
      {reportCardStatus?.published && (
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#0B1B2B] via-[#0F2942] to-[#1A365D] text-white border-2 border-amber-400/50 shadow-2xl relative overflow-hidden animate-fade-in">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-56 h-56 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <HiCheckBadge className="w-3.5 h-3.5 text-emerald-400" />
                  Official Marksheet Published
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold">
                  {reportCardStatus.term} Assessment • Session {reportCardStatus.academicYear || '2025-2026'}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
                Your Official CBSE Term Marksheet is Live!
              </h2>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-300 pt-0.5">
                {reportCardStatus.classRank && (
                  <span className="font-extrabold text-amber-300 flex items-center gap-1 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                    <span>🏆</span> Class Rank: #{reportCardStatus.classRank} of {reportCardStatus.totalStudents || 60}
                  </span>
                )}
                {reportCardStatus.percentage != null && (
                  <span className="text-slate-200">
                    Aggregate Score: <strong className="text-white font-mono font-bold">{reportCardStatus.percentage}%</strong> ({reportCardStatus.overallGrade || 'A1'})
                  </span>
                )}
                {reportCardStatus.resultStatus && (
                  <span className="text-emerald-300 font-semibold">
                    • {reportCardStatus.resultStatus}
                  </span>
                )}
                {reportCardStatus.publishedBy && (
                  <span className="text-slate-400 text-[11px]">
                    • Published by {reportCardStatus.publishedBy}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setShowReportCard(true)}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-amber-500/25 transition-all hover:scale-105 active:scale-95"
              >
                <HiDocumentCheck className="w-4 h-4 text-slate-950" />
                <span>View &amp; Print Official Marksheet</span>
                <HiArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-Time Live Dashboard Alerts */}
      <DashboardAlerts />

      {/* Continuous Academic Standing & Visual Performance Tracker */}
      <div className="bg-gradient-to-br from-[#0B1B2B] via-[#102438] to-[#1E3A5F] text-white p-6 rounded-2xl border border-[#C5A059]/40 shadow-xl relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#DFBF77]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#DFBF77]/20 border border-[#DFBF77]/40 text-[#DFBF77] text-[10px] font-bold tracking-widest uppercase">
                Academic Performance Track
              </span>
              <span className="text-xs text-slate-300">Continuous Assessment & Evaluations</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
              Scholastic Progress & Performance Visualizer
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Track your evaluated coursework assignments, exam grades, cumulative GPA, and faculty feedback graphs in real-time.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/student/academics"
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#DFBF77] text-[#0B1B2B] font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-black/20 hover:brightness-105 active:scale-[0.98] transition-all"
            >
              <HiChartBar className="w-5 h-5" />
              <span>Open Performance Analytics & Graphs</span>
              <HiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Dynamic Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10 relative z-10">
          <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-xl border border-white/10">
            <p className="text-[10px] font-bold text-[#DFBF77] uppercase tracking-wider">Cumulative GPA</p>
            <p className="text-2xl font-extrabold text-white mt-0.5">
              {academicGrades.length > 0
                ? (academicGrades.reduce((sum, g) => sum + (g.gpa || 0), 0) / academicGrades.length).toFixed(2)
                : '—'}
            </p>
            <p className="text-[10px] text-slate-400">Scale 0.0 - 4.0</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-xl border border-white/10">
            <p className="text-[10px] font-bold text-[#DFBF77] uppercase tracking-wider">Overall Average</p>
            <p className="text-2xl font-extrabold text-emerald-400 mt-0.5">
              {academicGrades.length > 0
                ? (academicGrades.reduce((sum, g) => sum + (g.percentage || 0), 0) / academicGrades.length).toFixed(1) + '%'
                : '—'}
            </p>
            <p className="text-[10px] text-slate-400">Evaluated score</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-xl border border-white/10">
            <p className="text-[10px] font-bold text-[#DFBF77] uppercase tracking-wider">Evaluated Work</p>
            <p className="text-2xl font-extrabold text-white mt-0.5">
              {academicGrades.length}
            </p>
            <p className="text-[10px] text-slate-400">
              {academicGrades.filter(g => g.assessmentType === 'ASSIGNMENT').length} Coursework, {academicGrades.filter(g => g.assessmentType === 'EXAMINATION').length} Exams
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-xl border border-white/10">
            <p className="text-[10px] font-bold text-[#DFBF77] uppercase tracking-wider">Latest Evaluation</p>
            {academicGrades.length > 0 ? (
              <div className="mt-0.5">
                <p className="text-xs font-bold text-white truncate">
                  {academicGrades[academicGrades.length - 1].assessmentName}
                </p>
                <p className="text-[11px] font-extrabold text-amber-300">
                  {academicGrades[academicGrades.length - 1].marksObtained}/{academicGrades[academicGrades.length - 1].maxMarks} ({academicGrades[academicGrades.length - 1].letterGrade || 'Graded'})
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-1">Awaiting evaluations</p>
            )}
          </div>
        </div>
      </div>

      {/* Primary Scholastic Desks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-serif font-bold text-[#0B1B2B]">
            Primary Academic Desks
          </h2>
          <span className="text-xs text-[#7A889B]">Session 2026–2027</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {mainDesks.map((desk, idx) => (
            <Link
              key={idx}
              to={desk.link}
              className="bg-white p-6 rounded-xl border border-[#E8E6DF] hover:border-[#0B1B2B] shadow-[0_2px_8px_-2px_rgba(11,27,43,0.04)] hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#FAF9F5] border border-[#E8E6DF] text-[#0B1B2B] group-hover:bg-[#0B1B2B] group-hover:text-[#DFBF77] transition-all flex items-center justify-center mb-3">
                  <desk.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-serif font-bold text-[#0B1B2B]">
                  {desk.title}
                </h3>
                <p className="text-xs text-[#5A6878] mt-1.5 leading-relaxed">
                  {desk.desc}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-[#F2F0E8] flex items-center justify-between text-xs font-semibold text-[#0B1B2B] group-hover:text-[#C5A059]">
                <span>{desk.action}</span>
                <HiArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Notice Board */}
      <NoticeBoard />

      {/* Modals */}
      {showIdCard && <IdCardModal studentId={studentId} onClose={() => setShowIdCard(false)} />}
      {showReportCard && <ReportCardModal studentId={studentId} onClose={() => setShowReportCard(false)} />}
      {showTransportPass && <TransportPassModal studentId={studentId} onClose={() => setShowTransportPass(false)} />}
      {showAiTutor && <AiStudyTutorModal onClose={() => setShowAiTutor(false)} />}
      {showHouseLeaderboard && <HouseLeaderboardModal onClose={() => setShowHouseLeaderboard(false)} />}
      {showEBookReader && <EBookReaderModal onClose={() => setShowEBookReader(false)} />}
      {showHostel && <HostelGatePassModal onClose={() => setShowHostel(false)} />}
      {showSubstitutions && <SubstitutionScheduleModal onClose={() => setShowSubstitutions(false)} />}
      {showCertificates && <CertificateRequestModal studentId={studentId} onClose={() => setShowCertificates(false)} />}
      {showClassTimetable && <StudentTimetableModal onClose={() => setShowClassTimetable(false)} />}
    </div>
  )
}
