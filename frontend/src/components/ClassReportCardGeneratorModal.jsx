import { useState, useEffect } from 'react'
import api from '../api/axiosConfig'
import {
  HiXMark, HiSparkles, HiCheckCircle, HiArrowPath,
  HiDocumentText, HiAcademicCap, HiUserGroup, HiTrophy,
  HiPrinter, HiMagnifyingGlass, HiEye
} from 'react-icons/hi2'
import ReportCardModal from './ReportCardModal'

export default function ClassReportCardGeneratorModal({ initialClassId, onClose, onSuccess }) {
  const [classes, setClasses] = useState([])
  const [selectedClassId, setSelectedClassId] = useState(initialClassId || '')
  const [selectedTerm, setSelectedTerm] = useState('FINAL')
  const [academicYear, setAcademicYear] = useState('2025-2026')
  const [loadingClasses, setLoadingClasses] = useState(true)

  // Generation states
  const [generating, setGenerating] = useState(false)
  const [generationStep, setGenerationStep] = useState(0)
  const [generatedResult, setGeneratedResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  // Preview individual student report card
  const [previewStudentId, setPreviewStudentId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Global Escape key listener to exit modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Fetch available classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        let classList = []
        try {
          const { data } = await api.get('/academics/my-classes')
          if (Array.isArray(data) && data.length > 0) {
            classList = data.map(item => item.schoolClass || item).filter(Boolean)
          }
        } catch (e) {
          console.debug('Failed to load my-classes, trying admin classes:', e)
        }

        if (classList.length === 0) {
          const { data } = await api.get('/admin/classes')
          if (Array.isArray(data)) classList = data
        }

        // De-duplicate classes by id
        const unique = Array.from(new Map(classList.map(c => [c.id, c])).values())
        setClasses(unique)
        if (!selectedClassId && unique.length > 0) {
          setSelectedClassId(unique[0].id.toString())
        }
      } catch (err) {
        console.error('Error fetching classes:', err)
        setErrorMsg('Failed to load class roster. Please check your connection.')
      } finally {
        setLoadingClasses(false)
      }
    }
    fetchClasses()
  }, [])

  const handleGenerate = async () => {
    if (!selectedClassId) {
      setErrorMsg('Please select a class to generate report cards.')
      return
    }

    setGenerating(true)
    setErrorMsg('')
    setGeneratedResult(null)
    setGenerationStep(1)

    // Visual animated progress steps
    const stepInterval = setInterval(() => {
      setGenerationStep(prev => (prev < 4 ? prev + 1 : prev))
    }, 600)

    try {
      const res = await api.post(
        `/reportcard/class/${selectedClassId}/generate?term=${selectedTerm}&academicYear=${academicYear}`
      )
      clearInterval(stepInterval)
      setGenerationStep(4)
      setGeneratedResult(res.data)
      if (onSuccess) onSuccess(res.data)
    } catch (err) {
      clearInterval(stepInterval)
      console.error('Error generating report cards:', err)
      setErrorMsg(err.response?.data?.message || 'Failed to generate class report cards. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const filteredStudents = (generatedResult?.students || []).filter(s => {
    if (!searchTerm.trim()) return true
    const q = searchTerm.toLowerCase()
    return (
      s.studentName?.toLowerCase().includes(q) ||
      s.rollNo?.toLowerCase().includes(q) ||
      s.overallGrade?.toLowerCase().includes(q) ||
      s.resultStatus?.toLowerCase().includes(q)
    )
  })

  return (
    <>
      <div
        onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 animate-fade-in"
      >
        {/* Floating Fixed Close Button (pinned to viewport, always visible) */}
        <button
          onClick={onClose}
          className="fixed top-3 right-3 sm:top-5 sm:right-6 z-[80] flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xl cursor-pointer hover:scale-105 transition-all"
          title="Exit / Close (Esc)"
        >
          <HiXMark className="w-5 h-5 stroke-[2.5]" />
          <span>Exit (Esc)</span>
        </button>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-full border border-slate-200 flex flex-col max-h-[92vh] relative">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0B1B2B] via-[#0F2942] to-[#1E3A5F] text-white px-6 py-4 flex items-center justify-between border-b-4 border-amber-500 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/30">
                <HiSparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-serif font-extrabold tracking-tight">
                    1-Click Class Report Card Generator & Publisher
                  </h3>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold uppercase tracking-wider">
                    CBSE / ICSE Marksheets
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium">
                  Batch calculate grades, class rankings, attendance compliance, and instantly publish to Student & Parent Portals
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
              title="Close Generator (Esc)"
            >
              <HiXMark className="w-4 h-4 stroke-[2.5]" />
              <span>Exit</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
            
            {/* Control Panel */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Class Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <HiAcademicCap className="w-4 h-4 text-amber-600" /> Target Class *
                  </label>
                  <select
                    disabled={generating}
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {loadingClasses ? (
                      <option value="">Loading assigned classes...</option>
                    ) : (
                      classes.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} - Section {c.section || 'A'} ({c.academicYear || '2025-2026'})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Term Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <HiDocumentText className="w-4 h-4 text-amber-600" /> Evaluation Term *
                  </label>
                  <select
                    disabled={generating}
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="FINAL">Annual Final Assessment (Consolidated Marksheet)</option>
                    <option value="TERM_2">Term 2 Mid-Session Assessment Report</option>
                    <option value="TERM_1">Term 1 Periodic Progress Report</option>
                  </select>
                </div>

                {/* Academic Year */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    disabled={generating}
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Action Banner */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                <div className="text-xs text-slate-500 leading-relaxed">
                  <span className="font-semibold text-slate-800">Note:</span> Generating report cards will instantly publish official marksheets, ranks, and teacher remarks for all enrolled students in this class.
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={generating || loadingClasses || !selectedClassId}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-all disabled:opacity-50 shrink-0"
                >
                  <HiSparkles className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                  <span>{generating ? 'Processing Whole Class...' : '⚡ Generate & Publish Class Report Cards (1-Click)'}</span>
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <HiXMark className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* In-Flight Generation Progress State */}
            {generating && (
              <div className="bg-white p-6 rounded-2xl border border-amber-200 shadow-md space-y-4 text-center animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-2">
                  <HiArrowPath className="w-7 h-7 animate-spin" />
                </div>
                <h4 className="font-serif font-bold text-slate-900 text-base">
                  Publishing Class Marksheets to Student Portal...
                </h4>
                <div className="max-w-md mx-auto space-y-2 text-xs text-slate-600">
                  <div className={`p-2 rounded-lg flex items-center justify-between ${generationStep >= 1 ? 'bg-amber-50 text-amber-900 font-semibold' : 'opacity-40'}`}>
                    <span>1. Aggregating periodic tests, assessments & student roll...</span>
                    {generationStep >= 1 && <HiCheckCircle className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <div className={`p-2 rounded-lg flex items-center justify-between ${generationStep >= 2 ? 'bg-amber-50 text-amber-900 font-semibold' : 'opacity-40'}`}>
                    <span>2. Calculating CBSE percentages, CGPA & letter grades (A1 to D)...</span>
                    {generationStep >= 2 && <HiCheckCircle className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <div className={`p-2 rounded-lg flex items-center justify-between ${generationStep >= 3 ? 'bg-amber-50 text-amber-900 font-semibold' : 'opacity-40'}`}>
                    <span>3. Computing class ranks, holistic remarks & attendance %...</span>
                    {generationStep >= 3 && <HiCheckCircle className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <div className={`p-2 rounded-lg flex items-center justify-between ${generationStep >= 4 ? 'bg-amber-50 text-amber-900 font-semibold' : 'opacity-40'}`}>
                    <span>4. Applying digital seal & publishing to scholar portals...</span>
                    {generationStep >= 4 && <HiCheckCircle className="w-4 h-4 text-emerald-600" />}
                  </div>
                </div>
              </div>
            )}

            {/* Generation Results Card */}
            {generatedResult && !generating && (
              <div className="space-y-5 animate-fade-in">
                
                {/* Success Announcement Header */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center font-bold text-2xl shrink-0">
                      <HiCheckCircle className="w-7 h-7 text-emerald-200" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-white/20 uppercase tracking-widest text-emerald-100">
                          Published Successfully
                        </span>
                        <span className="text-xs text-emerald-200 font-medium">
                          {generatedResult.publishedAt ? new Date(generatedResult.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                        </span>
                      </div>
                      <h4 className="text-lg font-serif font-bold mt-0.5">
                        {generatedResult.className} • {generatedResult.termLabel}
                      </h4>
                      <p className="text-xs text-emerald-100">
                        Official marksheets are now visible on every enrolled student's portal and parent cockpit.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2.5 rounded-xl bg-white text-emerald-950 font-bold text-xs flex items-center gap-2 shadow-md hover:bg-emerald-50 transition-all shrink-0"
                  >
                    <HiPrinter className="w-4 h-4 text-emerald-800" />
                    <span>Print Batch Marksheets</span>
                  </button>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Students</span>
                    <span className="text-2xl font-serif font-extrabold text-slate-900 mt-1 block">
                      {generatedResult.totalGenerated}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                      <HiCheckCircle className="w-3.5 h-3.5" /> 100% Processed
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Class Average</span>
                    <span className="text-2xl font-serif font-extrabold text-slate-900 mt-1 block">
                      {generatedResult.classAverage}%
                    </span>
                    <span className="text-[10px] text-amber-600 font-bold block mt-1">Overall Grade: A2</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Highest Score</span>
                    <span className="text-2xl font-serif font-extrabold text-slate-900 mt-1 block">
                      {generatedResult.highestScore}%
                    </span>
                    <span className="text-[10px] text-indigo-600 font-bold block mt-1">Class Rank #1 Topper</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pass Rate</span>
                    <span className="text-2xl font-serif font-extrabold text-emerald-700 mt-1 block">
                      {generatedResult.passRate || '100%'}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold block mt-1">CBSE Statutory Standard</span>
                  </div>
                </div>

                {/* Generated Roster Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <HiUserGroup className="w-5 h-5 text-amber-600" />
                      <h5 className="font-serif font-bold text-slate-900 text-sm">
                        Class Merit Roster & Marks ({filteredStudents.length} Students)
                      </h5>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <HiMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search student or rank..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-72 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3.5">Rank</th>
                          <th className="py-2.5 px-3.5">Roll No</th>
                          <th className="py-2.5 px-3.5">Student Name</th>
                          <th className="py-2.5 px-3.5">Score (%)</th>
                          <th className="py-2.5 px-3.5">Grade</th>
                          <th className="py-2.5 px-3.5">Result Status</th>
                          <th className="py-2.5 px-3.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredStudents.map((s, idx) => (
                          <tr key={idx} className="hover:bg-amber-50/40 transition-colors font-medium">
                            <td className="py-2.5 px-3.5 font-bold">
                              {s.classRank === 1 ? (
                                <span className="inline-flex items-center gap-1 text-amber-600 font-extrabold">
                                  <HiTrophy className="w-4 h-4 text-amber-500" /> #1
                                </span>
                              ) : (
                                <span className="text-slate-700">#{s.classRank}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3.5 font-mono text-slate-500 text-[11px]">{s.rollNo}</td>
                            <td className="py-2.5 px-3.5 font-bold text-slate-900">{s.studentName}</td>
                            <td className="py-2.5 px-3.5 font-extrabold text-[#0B1B2B]">{s.percentage}%</td>
                            <td className="py-2.5 px-3.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                s.overallGrade === 'A1' ? 'bg-amber-100 text-amber-800' :
                                s.overallGrade === 'A2' ? 'bg-emerald-100 text-emerald-800' :
                                'bg-sky-100 text-sky-800'
                              }`}>
                                {s.overallGrade}
                              </span>
                            </td>
                            <td className="py-2.5 px-3.5 text-[11px] text-slate-600 truncate max-w-xs">{s.resultStatus}</td>
                            <td className="py-2.5 px-3.5 text-right">
                              <button
                                onClick={() => setPreviewStudentId(s.studentId)}
                                className="px-2.5 py-1 rounded-lg bg-[#0F2942] hover:bg-slate-900 text-amber-300 font-bold text-[11px] inline-flex items-center gap-1 transition-all shadow-xs"
                                title="View Official Report Card"
                              >
                                <HiEye className="w-3.5 h-3.5" />
                                <span>View Marksheet</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
            <span className="text-xs text-slate-500">
              {generatedResult ? `Published for ${generatedResult.className}` : 'Ready to generate'}
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors"
            >
              Done / Close
            </button>
          </div>

        </div>
      </div>

      {/* Individual Student Report Card Preview Modal */}
      {previewStudentId && (
        <ReportCardModal
          studentId={previewStudentId}
          onClose={() => setPreviewStudentId(null)}
        />
      )}
    </>
  )
}

