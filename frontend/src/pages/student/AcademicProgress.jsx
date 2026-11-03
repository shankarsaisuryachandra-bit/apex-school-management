import { useState, useEffect } from 'react'
import api from '../../api/axiosConfig'
import {
  PerformanceTrendAreaChart,
  SubjectBreakdownBarChart
} from '../../components/charts/StudentPerformanceCharts'
import {
  HiChartBar,
  HiPrinter,
  HiAcademicCap,
  HiDocumentText,
  HiTrophy,
  HiSparkles,
  HiArrowPath,
  HiDocumentCheck,
  HiCheckBadge,
  HiArrowRight
} from 'react-icons/hi2'
import ReportCardModal from '../../components/ReportCardModal'
import { useAuth } from '../../auth/AuthContext'

export default function AcademicProgress() {
  const { user } = useAuth()
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSubject, setSelectedSubject] = useState('All')
  const [selectedType, setSelectedType] = useState('ALL') // 'ALL', 'EXAMINATION', 'ASSIGNMENT'
  const [chartView, setChartView] = useState('trend') // 'trend' | 'subject'
  const [showReportCard, setShowReportCard] = useState(false)
  const [reportCardStatus, setReportCardStatus] = useState(null)

  const targetId = user?.profileId || user?.userId || 1

  useEffect(() => {
    fetchGrades()
    fetchReportCardStatus()
  }, [])

  const fetchGrades = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/academics/grades/student/${targetId}`)
      setGrades(data || [])
    } catch (error) {
      console.error('Failed to fetch grades:', error)
      setGrades([])
    } finally {
      setLoading(false)
    }
  }

  const fetchReportCardStatus = async () => {
    try {
      const { data } = await api.get(`/reportcard/student/${targetId}/status`)
      setReportCardStatus(data)
    } catch (error) {
      console.debug('No published report card status:', error)
    }
  }

  const handlePrintReportCard = () => {
    setShowReportCard(true)
  }

  // Get unique subjects
  const subjects = ['All', ...new Set(grades.map(g => g.subjectName).filter(Boolean))]

  // Filter grades
  const filteredGrades = grades.filter(g => {
    const matchSubject = selectedSubject === 'All' || g.subjectName === selectedSubject
    const matchType = selectedType === 'ALL' || g.assessmentType === selectedType
    return matchSubject && matchType
  })

  // KPI Calculations
  const totalItems = grades.length
  const examsCount = grades.filter(g => g.assessmentType === 'EXAMINATION').length
  const assignmentsCount = grades.filter(g => g.assessmentType === 'ASSIGNMENT').length

  const avgPercentage = totalItems > 0
    ? (grades.reduce((sum, g) => sum + (g.percentage || 0), 0) / totalItems).toFixed(1)
    : '0.0'

  const avgGpa = totalItems > 0
    ? (grades.reduce((sum, g) => sum + (g.gpa || 0), 0) / totalItems).toFixed(2)
    : '0.00'

  // Highest scoring subject
  const subjectAverages = {}
  grades.forEach(g => {
    if (!subjectAverages[g.subjectName]) subjectAverages[g.subjectName] = { total: 0, count: 0 }
    subjectAverages[g.subjectName].total += (g.percentage || 0)
    subjectAverages[g.subjectName].count += 1
  })
  let topSubject = 'N/A'
  let topSubjectAvg = 0
  Object.entries(subjectAverages).forEach(([subj, data]) => {
    const avg = data.total / data.count
    if (avg > topSubjectAvg) {
      topSubjectAvg = avg
      topSubject = subj
    }
  })

  return (
    <div className="animate-fade-in space-y-7 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-200">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-primary-600 tracking-wider uppercase mb-1">
            <span>Scholar Academic Standing</span>
            <span>•</span>
            <span>Continuous Evaluation Portfolio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-surface-900 tracking-tight">
            Academic Progress & Performance Track
          </h1>
          <p className="text-surface-600 text-sm mt-0.5">
            Student: <strong className="text-surface-900">{user?.fullName}</strong> — Real-time continuous assessments & assignment grading.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 print:hidden">
          <button
            onClick={fetchGrades}
            className="p-2.5 rounded-xl border border-surface-200 text-surface-600 hover:bg-surface-50 transition-colors"
            title="Refresh grades"
          >
            <HiArrowPath className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handlePrintReportCard}
            className="btn-primary text-xs !py-2.5 !px-4 flex items-center gap-2 shadow-md shadow-primary-500/20"
          >
            <HiPrinter className="w-4 h-4" />
            <span>Print Report Card</span>
          </button>
        </div>
      </div>

      {/* 🌟 Official Published Report Card Announcement */}
      {reportCardStatus?.published && (
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#0B1B2B] via-[#0F2942] to-[#1A365D] text-white border-2 border-amber-400/50 shadow-xl relative overflow-hidden animate-fade-in print:hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-56 h-56 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5 max-w-2xl">
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
                Official CBSE Board Report Card &amp; Marksheet
              </h2>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-300 pt-0.5">
                {reportCardStatus.classRank && (
                  <span className="font-extrabold text-amber-300 flex items-center gap-1 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                    <span>🏆</span> Class Rank: #{reportCardStatus.classRank} of {reportCardStatus.totalStudents || 60}
                  </span>
                )}
                {reportCardStatus.percentage != null && (
                  <span className="text-slate-200">
                    Aggregate: <strong className="text-white font-mono font-bold">{reportCardStatus.percentage}%</strong> ({reportCardStatus.overallGrade || 'A1'})
                  </span>
                )}
                {reportCardStatus.resultStatus && (
                  <span className="text-emerald-300 font-semibold">
                    • {reportCardStatus.resultStatus}
                  </span>
                )}
                {reportCardStatus.publishedBy && (
                  <span className="text-slate-400 text-[11px]">
                    • Authorized by {reportCardStatus.publishedBy}
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
                <span>View / Print Official Marksheet</span>
                <HiArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 print:hidden">
        {/* Cumulative GPA */}
        <div className="card p-4 sm:p-5 border-l-4 border-l-indigo-600 bg-gradient-to-br from-indigo-50/50 to-white">
          <div className="flex items-center justify-between text-indigo-700 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Cumulative GPA</span>
            <HiAcademicCap className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">{avgGpa}</span>
            <span className="text-xs text-slate-500 font-semibold">/ 4.00</span>
          </div>
          <div className="mt-2 text-[11px] font-bold text-indigo-700 flex items-center gap-1">
            <HiCheckBadge className="w-3.5 h-3.5" />
            <span>{parseFloat(avgGpa) >= 3.7 ? 'Honor Roll / Distinction' : parseFloat(avgGpa) >= 3.0 ? 'First Class Standard' : 'Regular Standing'}</span>
          </div>
        </div>

        {/* Overall Percentage */}
        <div className="card p-4 sm:p-5 border-l-4 border-l-emerald-600 bg-gradient-to-br from-emerald-50/50 to-white">
          <div className="flex items-center justify-between text-emerald-700 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Overall Average</span>
            <HiChartBar className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">{avgPercentage}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(parseFloat(avgPercentage), 100)}%` }}
            />
          </div>
        </div>

        {/* Total Tasks Evaluated */}
        <div className="card p-4 sm:p-5 border-l-4 border-l-blue-600 bg-gradient-to-br from-blue-50/50 to-white">
          <div className="flex items-center justify-between text-blue-700 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Evaluated Work</span>
            <HiDocumentCheck className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">{totalItems}</span>
            <span className="text-xs text-slate-500 font-semibold">Total Evaluated</span>
          </div>
          <p className="mt-2 text-[11px] font-semibold text-slate-500">
            {assignmentsCount} Assignments • {examsCount} Exams
          </p>
        </div>

        {/* Top Subject */}
        <div className="card p-4 sm:p-5 border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50/50 to-white">
          <div className="flex items-center justify-between text-amber-700 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Strongest Subject</span>
            <HiTrophy className="w-5 h-5 text-amber-600" />
          </div>
          <div className="truncate">
            <span className="text-lg sm:text-xl font-extrabold text-slate-900 truncate block">{topSubject}</span>
            <span className="text-xs font-bold text-amber-600">{topSubjectAvg > 0 ? `${Math.round(topSubjectAvg)}% Average` : 'Pending'}</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 font-medium">Leading academic domain</p>
        </div>
      </div>

      {/* Visual Performance Charts Section */}
      <div className="card p-5 sm:p-6 print:hidden border border-surface-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-surface-100">
          <div>
            <h2 className="text-lg font-display font-bold text-surface-900 flex items-center gap-2">
              <HiSparkles className="w-5 h-5 text-indigo-600" />
              <span>Academic Performance Tracking & Visual Analytics</span>
            </h2>
            <p className="text-xs text-surface-500 mt-0.5">
              Interactive graphical charts reflecting graded coursework, homework submissions, and term examinations.
            </p>
          </div>

          {/* Chart View Toggle */}
          <div className="flex items-center p-1 bg-surface-100 rounded-xl shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setChartView('trend')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                chartView === 'trend'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-surface-600 hover:text-surface-900'
              }`}
            >
              Timeline Trend
            </button>
            <button
              onClick={() => setChartView('subject')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                chartView === 'subject'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-surface-600 hover:text-surface-900'
              }`}
            >
              Subject Mastery
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-surface-400 font-medium animate-pulse text-sm">
            Calculating real-time scholastic graph...
          </div>
        ) : grades.length === 0 ? (
          <div className="py-14 text-center text-surface-500 text-sm">
            <p className="font-semibold">No graded assignments or exams found yet.</p>
            <p className="text-xs text-surface-400 mt-1">Once your teacher evaluates and awards marks, your visual performance curve will populate automatically.</p>
          </div>
        ) : (
          <div>
            {chartView === 'trend' ? (
              <PerformanceTrendAreaChart data={grades} />
            ) : (
              <SubjectBreakdownBarChart grades={grades} />
            )}
          </div>
        )}
      </div>

      {/* Official Marksheet Table Card */}
      <div className="card p-5 sm:p-6 print:shadow-none print:border-none border border-surface-200">
        {/* Printable Header */}
        <div className="hidden print:block text-center pb-6 border-b border-slate-300 mb-6">
          <h1 className="text-2xl font-bold uppercase tracking-wide">Apex International Academy</h1>
          <p className="text-xs text-surface-600 uppercase tracking-widest mt-0.5">Official Student Cumulative Scholastic Transcript</p>
          <div className="grid grid-cols-2 gap-2 mt-4 text-left text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
            <p><strong>Student Name:</strong> {user?.fullName}</p>
            <p><strong>Academic Year:</strong> 2025-2026</p>
            <p><strong>Cumulative GPA:</strong> {avgGpa} / 4.00</p>
            <p><strong>Overall Score:</strong> {avgPercentage}%</p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 print:hidden">
          <div>
            <h2 className="text-lg font-display font-bold text-surface-900">
              Evaluated Assessments & Submissions Record
            </h2>
            <p className="text-xs text-surface-500">
              Itemized grades recorded by faculty across term exams and continuous coursework
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Type Filter */}
            <div className="flex items-center p-1 bg-surface-100 rounded-xl">
              {[
                { key: 'ALL', label: 'All Items' },
                { key: 'ASSIGNMENT', label: 'Assignments' },
                { key: 'EXAMINATION', label: 'Exams' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedType(tab.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedType === tab.key
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-surface-600 hover:text-surface-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Subject Dropdown / Pills */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="input-field !py-1 !px-3 text-xs w-auto font-medium"
            >
              {subjects.map(s => (
                <option key={s} value={s}>{s === 'All' ? 'All Subjects' : s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Content */}
        {filteredGrades.length === 0 ? (
          <div className="py-12 text-center text-surface-500 text-sm">
            <p className="font-semibold">No evaluation records match current filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-surface-200 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-white select-none">
                <tr>
                  <th className="py-3 px-3.5 font-bold border-r border-slate-700 w-10 text-center">#</th>
                  <th className="py-3 px-3.5 font-bold border-r border-slate-700 min-w-[180px]">Assessment / Task</th>
                  <th className="py-3 px-3.5 font-bold border-r border-slate-700 w-28 text-center">Type</th>
                  <th className="py-3 px-3.5 font-bold border-r border-slate-700 w-28">Subject</th>
                  <th className="py-3 px-3.5 font-bold border-r border-slate-700 w-24">Date</th>
                  <th className="py-3 px-3.5 font-bold border-r border-slate-700 w-28 text-center">Marks / Max</th>
                  <th className="py-3 px-3.5 font-bold border-r border-slate-700 w-28 text-center">Percentage</th>
                  <th className="py-3 px-3.5 font-bold border-r border-slate-700 w-20 text-center">Grade</th>
                  <th className="py-3 px-3.5 font-bold border-r border-slate-700 w-20 text-center">GPA</th>
                  <th className="py-3 px-3.5 font-bold min-w-[200px]">Teacher Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200 bg-white">
                {filteredGrades.map((g, idx) => {
                  const isAsg = g.assessmentType === 'ASSIGNMENT'
                  const pct = g.percentage != null ? g.percentage : 0

                  return (
                    <tr
                      key={g.gradeId || idx}
                      className={`hover:bg-indigo-50/20 transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-surface-50/50'
                      }`}
                    >
                      <td className="py-3 px-3.5 border-r border-surface-200 text-center font-mono text-surface-400 font-semibold">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-3.5 border-r border-surface-200 font-bold text-surface-900">
                        {g.assessmentName}
                      </td>

                      <td className="py-3 px-3.5 border-r border-surface-200 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          isAsg
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-blue-100 text-blue-900 border border-blue-300'
                        }`}>
                          {isAsg ? 'Assignment' : 'Exam'}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 border-r border-surface-200 font-semibold text-surface-700">
                        {g.subjectName || 'General'}
                      </td>

                      <td className="py-3 px-3.5 border-r border-surface-200 text-surface-500 font-mono text-[11px]">
                        {g.assessmentDate || '—'}
                      </td>

                      <td className="py-3 px-3.5 border-r border-surface-200 text-center font-mono font-bold text-slate-800">
                        {g.marksObtained ?? '—'} <span className="text-slate-400 font-normal">/ {g.maxMarks}</span>
                      </td>

                      <td className="py-3 px-3.5 border-r border-surface-200 text-center">
                        <span className={`font-mono font-extrabold ${
                          pct >= 90 ? 'text-emerald-600' :
                          pct >= 80 ? 'text-blue-600' :
                          pct >= 60 ? 'text-indigo-600' :
                          pct >= 50 ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                          {g.percentage != null ? `${g.percentage}%` : '—'}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 border-r border-surface-200 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-black ${
                          g.letterGrade === 'A+' ? 'bg-emerald-100 text-emerald-800' :
                          g.letterGrade === 'A' ? 'bg-blue-100 text-blue-800' :
                          g.letterGrade === 'B' ? 'bg-indigo-100 text-indigo-800' :
                          g.letterGrade === 'C' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {g.letterGrade || '—'}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 border-r border-surface-200 text-center font-mono font-bold text-slate-700">
                        {g.gpa != null ? g.gpa.toFixed(1) : '—'}
                      </td>

                      <td className="py-3 px-3.5 text-surface-600 italic">
                        {g.remarks || 'No remarks provided'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Official CBSE Report Card Marksheet Modal */}
      {showReportCard && (
        <ReportCardModal studentId={targetId} onClose={() => setShowReportCard(false)} />
      )}
    </div>
  )
}
