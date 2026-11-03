import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { HiClipboardDocumentList, HiBookOpen, HiDocumentText, HiAcademicCap, HiArrowRight, HiCalendarDays, HiSparkles, HiDocumentCheck } from 'react-icons/hi2'
import NoticeBoard from '../../components/ui/NoticeBoard'
import DashboardAlerts from '../../components/ui/DashboardAlerts'
import TeacherTimetableModal from '../../components/TeacherTimetableModal'
import AiStudyTutorModal from '../../components/AiStudyTutorModal'
import ClassReportCardGeneratorModal from '../../components/ClassReportCardGeneratorModal'
import { Link } from 'react-router-dom'

export default function TeacherDashboard() {
  const { user } = useAuth()
  const [showTimetable, setShowTimetable] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)
  const [showReportCardGenerator, setShowReportCardGenerator] = useState(false)

  const modules = [
    {
      title: '⚡ 1-Click Class Report Cards',
      desc: 'Instantly calculate CBSE grades, assign class ranks (1 to N), sign, and publish official marksheet cards for the entire class to the student portal.',
      customAction: () => setShowReportCardGenerator(true),
      icon: HiDocumentCheck,
      action: 'Generate Class Report Cards',
      tag: 'Official Exam Publishing',
      highlight: true
    },
    {
      title: 'E-Library & Courseware',
      desc: 'Upload subject curriculum, lecture slides, study materials and reference guides for your assigned classes.',
      link: '/teacher/library',
      icon: HiBookOpen,
      action: 'Open E-Library',
      tag: 'Curriculum & Resources'
    },
    {
      title: 'Daily Class Roll & Register',
      desc: 'Take official class attendance per period and subject slot. Maintain authorized school attendance records.',
      link: '/teacher/attendance',
      icon: HiClipboardDocumentList,
      action: 'Take Attendance',
      tag: 'Classroom Management'
    },
    {
      title: 'Continuous Assessment Gradebook',
      desc: 'Record term examination marks, practical evaluations, and grading rubrics for assigned students.',
      link: '/teacher/gradebook',
      icon: HiAcademicCap,
      action: 'Open Gradebook',
      tag: 'Marks & Assessment'
    },
    {
      title: 'Assignments & Project Desk',
      desc: 'Publish homework, coursework deadlines, evaluation rubrics, and grade submitted student files.',
      link: '/teacher/assignments',
      icon: HiDocumentText,
      action: 'Manage Homework',
      tag: 'Scholastic Assignments'
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Editorial Faculty Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-[#E8E6DF] gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#8C6837] tracking-[0.2em] uppercase">
            <span>Faculty of Academics</span>
            <span>•</span>
            <span>Instruction & Instruction Desk</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#0B1B2B] mt-1 tracking-tight">
            Faculty Teaching Console
          </h1>
          <p className="text-sm text-[#5A6878] mt-1 max-w-2xl">
            Welcome, <span className="font-semibold text-[#0B1B2B]">{user?.fullName}</span>. Access your assigned class roll registers, courseware uploads, and scholastic grading.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowReportCardGenerator(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 border border-emerald-400/30"
            title="Generate, compute grades & ranks, and publish official CBSE report cards for the entire class in 1 click"
          >
            <HiDocumentCheck className="w-4 h-4 text-emerald-200" />
            <span>⚡ 1-Click Class Report Cards</span>
          </button>
          <button
            onClick={() => setShowAiModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95"
            title="Open AI Academic Suite: Doubt Solver, Practice Quiz & Formula Cheatsheet"
          >
            <HiSparkles className="w-4 h-4 text-slate-950" />
            <span>AI Academic & Quiz Suite</span>
          </button>
          <button
            onClick={() => setShowTimetable(true)}
            className="px-4 py-2.5 rounded-xl bg-[#0F2942] hover:bg-slate-900 text-amber-400 font-bold text-xs flex items-center gap-2 transition-all shadow-md"
          >
            <HiCalendarDays className="w-4 h-4 text-amber-400" />
            <span>My Assigned Timetable</span>
          </button>
          <Link
            to="/teacher/attendance"
            className="btn-primary text-xs !py-2.5 !px-4"
          >
            Mark Period Roll
          </Link>
        </div>
      </div>

      {showTimetable && <TeacherTimetableModal onClose={() => setShowTimetable(false)} />}
      {showAiModal && <AiStudyTutorModal onClose={() => setShowAiModal(false)} />}

      {/* Real-time Alerts for Leaves, PTMs, etc. */}
      <DashboardAlerts />

      {/* Faculty Assessment & Student Performance Analytics Console */}
      <div className="bg-gradient-to-br from-[#0B1B2B] via-[#102438] to-[#1E3A5F] text-white p-6 rounded-2xl border border-[#C5A059]/40 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#DFBF77]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#DFBF77]/20 border border-[#DFBF77]/40 text-[#DFBF77] text-[10px] font-bold tracking-widest uppercase">
                Continuous Evaluation
              </span>
              <span className="text-xs text-slate-300">Scholastic Performance Tracking</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
              Class Gradebook & Performance Visualizer
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Track student marks, evaluation distributions, pass rates, and export gradebook spreadsheets for term examinations and coursework assignments.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={() => setShowReportCardGenerator(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-black/20 hover:brightness-105 active:scale-[0.98] transition-all"
            >
              <HiDocumentCheck className="w-4 h-4 text-emerald-100" />
              <span>⚡ 1-Click Class Report Cards</span>
            </button>
            <Link
              to="/teacher/gradebook"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#DFBF77] text-[#0B1B2B] font-bold text-xs flex items-center gap-2 shadow-lg shadow-black/20 hover:brightness-105 active:scale-[0.98] transition-all"
            >
              <HiAcademicCap className="w-4 h-4" />
              <span>Term Gradebook Analytics</span>
            </Link>
            <Link
              to="/teacher/assignments"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center gap-2 border border-white/20 transition-all"
            >
              <HiDocumentText className="w-4 h-4 text-emerald-400" />
              <span>Assignments & CSV Gradebook</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary Faculty Modules */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-serif font-bold text-[#0B1B2B]">
            Assigned Instruction Workspaces
          </h2>
          <span className="text-xs text-[#7A889B]">Current Term II Modules</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {modules.map((mod, idx) => {
            const CardContent = (
              <>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-md border ${
                      mod.highlight
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-[#FAF9F5] text-[#8C6837] border-[#E8E6DF]'
                    }`}>
                      {mod.tag}
                    </span>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      mod.highlight ? 'bg-emerald-700 text-white' : 'bg-[#0B1B2B] text-[#DFBF77]'
                    }`}>
                      <mod.icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-serif font-bold text-[#0B1B2B] group-hover:text-[#0B1B2B]">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-[#5A6878] mt-2 leading-relaxed">
                    {mod.desc}
                  </p>
                </div>

                <div className={`mt-5 pt-3 border-t flex items-center justify-between text-xs font-semibold ${
                  mod.highlight
                    ? 'border-emerald-100 text-emerald-800 group-hover:text-emerald-950'
                    : 'border-[#F2F0E8] text-[#0B1B2B] group-hover:text-[#C5A059]'
                }`}>
                  <span>{mod.action}</span>
                  <HiArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </>
            )

            return mod.customAction ? (
              <button
                key={idx}
                type="button"
                onClick={mod.customAction}
                className={`p-6 rounded-xl border text-left shadow-[0_2px_8px_-2px_rgba(11,27,43,0.04)] hover:shadow-md transition-all group flex flex-col justify-between ${
                  mod.highlight
                    ? 'bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-white border-emerald-300 hover:border-emerald-600'
                    : 'bg-white border-[#E8E6DF] hover:border-[#0B1B2B]'
                }`}
              >
                {CardContent}
              </button>
            ) : (
              <Link
                key={idx}
                to={mod.link}
                className="bg-white p-6 rounded-xl border border-[#E8E6DF] hover:border-[#0B1B2B] shadow-[0_2px_8px_-2px_rgba(11,27,43,0.04)] hover:shadow-md transition-all group flex flex-col justify-between"
              >
                {CardContent}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Notice Board */}
      <NoticeBoard />

      {/* Report Card Generator Modal */}
      {showReportCardGenerator && (
        <ClassReportCardGeneratorModal onClose={() => setShowReportCardGenerator(false)} />
      )}
    </div>
  )
}

