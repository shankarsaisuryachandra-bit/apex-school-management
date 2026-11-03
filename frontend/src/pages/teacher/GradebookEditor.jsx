import { useState, useEffect } from 'react'
import api from '../../api/axiosConfig'
import {
  HiBookOpen,
  HiPlus,
  HiChartBar,
  HiTableCells,
  HiSparkles,
  HiCheckCircle,
  HiArrowPath,
  HiExclamationTriangle,
  HiXMark,
  HiDocumentCheck
} from 'react-icons/hi2'
import {
  ClassGradeDistributionChart,
  StudentMarksRankingChart
} from '../../components/charts/StudentPerformanceCharts'
import ClassReportCardGeneratorModal from '../../components/ClassReportCardGeneratorModal'

export default function GradebookEditor() {
  const [classes, setClasses] = useState([])
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [assessments, setAssessments] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newAssessment, setNewAssessment] = useState({ name: '', maxMarks: 100, assessmentDate: '' })
  const [grades, setGrades] = useState({})
  const [students, setStudents] = useState([])
  const [activeAssessment, setActiveAssessment] = useState(null)
  const [message, setMessage] = useState('')
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [viewMode, setViewMode] = useState('both') // 'table' | 'charts' | 'both'
  const [showReportCardGenerator, setShowReportCardGenerator] = useState(false)

  useEffect(() => {
    fetchAssignedClasses()
  }, [])

  const fetchAssignedClasses = async () => {
    try {
      const { data } = await api.get('/academics/my-classes')
      setClasses(data || [])
    } catch (error) {
      console.error('Failed to fetch classes:', error)
    }
  }

  const handleAssignmentSelect = async (assignment) => {
    setSelectedAssignment(assignment)
    setActiveAssessment(null)
    setStudents([])
    setGrades({})
    const classId = assignment.schoolClass?.id || assignment.classId
    const subjectId = assignment.subject?.id || assignment.subjectId
    try {
      const { data } = await api.get(`/academics/assessments?classId=${classId}&subjectId=${subjectId}`)
      setAssessments(data || [])
    } catch (error) {
      console.error('Failed to fetch assessments:', error)
    }
  }

  const createAssessment = async () => {
    if (!newAssessment.name || !newAssessment.name.trim()) {
      setMessage('Assessment name is required and cannot be blank.')
      return
    }
    const max = parseFloat(newAssessment.maxMarks)
    if (isNaN(max) || max < 1 || max > 1000) {
      setMessage('Maximum marks must be in the permitted range [1 - 1000].')
      return
    }
    try {
      const classId = selectedAssignment.schoolClass?.id || selectedAssignment.classId
      const subjectId = selectedAssignment.subject?.id || selectedAssignment.subjectId
      await api.post('/academics/assessments', {
        ...newAssessment,
        name: newAssessment.name.trim(),
        maxMarks: max,
        classId,
        subjectId,
      })
      setShowCreateForm(false)
      setNewAssessment({ name: '', maxMarks: 100, assessmentDate: '' })
      handleAssignmentSelect(selectedAssignment)
      setMessage('Assessment created successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to create assessment')
    }
  }

  const handleAssessmentSelect = async (assessment) => {
    setActiveAssessment(assessment)
    setLoadingStudents(true)
    try {
      const { data } = await api.get(`/academics/assessments/${assessment.id}/students`)
      setStudents(data || [])
      // Pre-populate grades map with existing marks if present
      const gradeMap = {}
      ;(data || []).forEach((s) => {
        gradeMap[s.studentId] = s.marksObtained !== null && s.marksObtained !== undefined ? s.marksObtained : ''
      })
      setGrades(gradeMap)
    } catch (error) {
      console.error('Failed to fetch students for assessment:', error)
      setStudents([])
    } finally {
      setLoadingStudents(false)
    }
  }

  const saveGrades = async () => {
    if (!activeAssessment) return
    const maxMarks = parseFloat(activeAssessment.maxMarks) || 100

    // Validate marks against permitted range [0, maxMarks]
    for (const [studentId, marks] of Object.entries(grades)) {
      if (marks !== '' && marks !== null && marks !== undefined) {
        const val = parseFloat(marks)
        if (isNaN(val) || val < 0 || val > maxMarks) {
          const studentObj = students.find(s => s.studentId === parseInt(studentId))
          const stName = studentObj ? studentObj.studentName : `Student #${studentId}`
          setMessage(`Marks for ${stName} (${marks}) is outside the permitted range [0 - ${maxMarks}]. System rejected input.`)
          return
        }
      }
    }

    try {
      const gradeEntries = Object.entries(grades)
        .filter(([_, marks]) => marks !== '')
        .map(([studentId, marks]) => ({
          studentId: parseInt(studentId),
          marksObtained: parseFloat(marks),
        }))
      if (gradeEntries.length === 0) {
        setMessage('Please enter at least one grade to save')
        setTimeout(() => setMessage(''), 3000)
        return
      }
      await api.post('/academics/grades/bulk', {
        assessmentHeaderId: activeAssessment.id,
        grades: gradeEntries,
      })
      setMessage(`Grades successfully saved for ${gradeEntries.length} student(s)!`)
      setTimeout(() => setMessage(''), 3000)
      // Refresh current student marks
      handleAssessmentSelect(activeAssessment)
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to save grades')
    }
  }

  const max = activeAssessment?.maxMarks || 100

  // Combine loaded students with active input changes for real-time visualization.
  // Reject out-of-range marks from polluting class statistics and analytics charts.
  const liveEvaluatedStudents = students.map(s => {
    const currentVal = grades[s.studentId]
    const raw = currentVal !== undefined && currentVal !== '' ? currentVal : s.marksObtained
    const num = parseFloat(raw)
    const isOutOfRange = raw !== null && raw !== undefined && raw !== '' && (isNaN(num) || num < 0 || num > max)
    return {
      ...s,
      fullName: s.studentName,
      marksObtained: isOutOfRange ? null : (!isNaN(num) ? num : null),
      rawMarks: raw,
      isOutOfRange
    }
  })

  // Quick Stats strictly for valid permitted marks
  const validMarks = liveEvaluatedStudents
    .filter(s => s.marksObtained !== null && s.marksObtained !== undefined && !isNaN(s.marksObtained) && s.marksObtained >= 0 && s.marksObtained <= max)
    .map(s => s.marksObtained)

  const avg = validMarks.length > 0 ? (validMarks.reduce((a, b) => a + b, 0) / validMarks.length).toFixed(1) : '—'
  const avgPct = validMarks.length > 0 ? Math.round(((parseFloat(avg) / max) * 100)) : 0
  const highest = validMarks.length > 0 ? Math.max(...validMarks) : '—'
  const lowest = validMarks.length > 0 ? Math.min(...validMarks) : '—'
  const passCount = validMarks.filter(m => (m / max) * 100 >= 50).length
  const passRate = validMarks.length > 0 ? Math.round((passCount / validMarks.length) * 100) : 0

  return (
    <div className="animate-fade-in space-y-7 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-200">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-primary-600 tracking-wider uppercase mb-1">
            <span>Faculty Instruction Console</span>
            <span>•</span>
            <span>Scholastic Gradebook & Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-surface-900 tracking-tight">
            Class Gradebook & Performance Tracking
          </h1>
          <p className="text-surface-600 text-sm mt-0.5">
            Record assessment marks, evaluate class distribution, and track individual student performance trajectories.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowReportCardGenerator(true)}
            className="btn-primary text-xs !py-2.5 !px-4 flex items-center gap-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            title="Generate, compute grades & ranks, and publish official CBSE report cards for the entire class"
          >
            <HiDocumentCheck className="w-4 h-4 text-emerald-200" />
            <span>⚡ 1-Click Class Report Cards</span>
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between gap-3 animate-fade-in shadow-sm ${
          message.toLowerCase().includes('failed') || message.toLowerCase().includes('outside') || message.toLowerCase().includes('error') || message.toLowerCase().includes('rejected') || message.toLowerCase().includes('must be')
            ? 'bg-rose-50 border-rose-300 text-rose-800'
            : 'bg-emerald-50 border-emerald-300 text-emerald-800'
        }`}>
          <div className="flex items-center gap-2.5">
            {message.toLowerCase().includes('failed') || message.toLowerCase().includes('outside') || message.toLowerCase().includes('error') || message.toLowerCase().includes('rejected') || message.toLowerCase().includes('must be') ? (
              <HiExclamationTriangle className="w-5 h-5 shrink-0 text-rose-600" />
            ) : (
              <HiCheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
            )}
            <span>{message}</span>
          </div>
          <button
            onClick={() => setMessage('')}
            className="p-1 rounded-lg hover:bg-black/5 text-surface-500 hover:text-surface-800 transition-colors"
            title="Dismiss message"
          >
            <HiXMark className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Class/Subject Selector */}
      <div className="card p-5 sm:p-6 border border-surface-200">
        <h2 className="text-base font-display font-bold text-surface-900 mb-3">Your Assigned Classes & Subjects</h2>
        <div className="flex flex-wrap gap-2.5">
          {classes.map((c, i) => {
            const cName = c.schoolClass ? `${c.schoolClass.name} - ${c.schoolClass.section}` : 'Class'
            const sName = c.subject?.name || 'All Subjects'
            const isSelected = selectedAssignment?.id === c.id || selectedAssignment === c
            return (
              <button
                key={i}
                onClick={() => handleAssignmentSelect(c)}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-amber-400 shadow-md scale-[1.02]'
                    : 'bg-surface-100 text-surface-700 hover:bg-surface-200 hover:text-surface-900'
                }`}
              >
                <span>{cName}</span> <span className="opacity-60">•</span> <span>{sName}</span>
              </button>
            )
          })}
          {classes.length === 0 && (
            <p className="text-surface-500 text-sm">No class assignments found for your faculty account.</p>
          )}
        </div>
      </div>

      {/* Assessments List */}
      {selectedAssignment && (
        <div className="card p-5 sm:p-6 border border-surface-200">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-base font-display font-bold text-surface-900">
                Assessments for {selectedAssignment.schoolClass?.name} ({selectedAssignment.subject?.name})
              </h2>
              <p className="text-xs text-surface-500">Select an assessment to view student marks and performance charts</p>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="btn-accent text-xs flex items-center gap-1.5 shrink-0"
            >
              <HiPlus className="w-4 h-4" />
              <span>New Assessment</span>
            </button>
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200 mb-5 space-y-3 animate-fade-in">
              <h3 className="text-xs font-bold uppercase tracking-wider text-surface-700">Create Assessment Header</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  className="input-field text-xs"
                  placeholder="Assessment Name (e.g. Unit Test 1, Term 1 Exam)"
                  value={newAssessment.name}
                  onChange={(e) => setNewAssessment({ ...newAssessment, name: e.target.value })}
                />
                <input
                  className="input-field text-xs"
                  type="number"
                  placeholder="Max Marks"
                  value={newAssessment.maxMarks}
                  onChange={(e) => setNewAssessment({ ...newAssessment, maxMarks: e.target.value })}
                />
                <input
                  className="input-field text-xs"
                  type="date"
                  value={newAssessment.assessmentDate}
                  onChange={(e) => setNewAssessment({ ...newAssessment, assessmentDate: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowCreateForm(false)} className="btn-secondary text-xs !py-1.5 !px-3">Cancel</button>
                <button onClick={createAssessment} className="btn-primary text-xs !py-1.5 !px-4">Save Assessment</button>
              </div>
            </div>
          )}

          {/* Assessment Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {assessments.map((a) => (
              <button
                key={a.id}
                onClick={() => handleAssessmentSelect(a)}
                className={`p-4 rounded-2xl text-left transition-all border ${
                  activeAssessment?.id === a.id
                    ? 'bg-indigo-50/70 border-indigo-500 shadow-md shadow-indigo-500/10 scale-[1.01]'
                    : 'bg-white border-surface-200 hover:border-surface-300 hover:bg-surface-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-surface-900 truncate">{a.name}</h4>
                    <p className="text-xs text-surface-500 mt-1">
                      Max Marks: <strong className="text-slate-800">{a.maxMarks}</strong>
                    </p>
                    <p className="text-[11px] text-surface-400 mt-0.5 font-mono">
                      {a.assessmentDate || 'No date scheduled'}
                    </p>
                  </div>
                  <HiBookOpen className={`w-5 h-5 shrink-0 ${activeAssessment?.id === a.id ? 'text-indigo-600' : 'text-surface-400'}`} />
                </div>
              </button>
            ))}
            {assessments.length === 0 && (
              <p className="text-surface-500 text-xs col-span-3 py-4 text-center">
                No assessments created yet for this class and subject. Click "+ New Assessment" to create one.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Active Assessment Workspace: KPIs, Visualizations, and Grade Entry Table */}
      {activeAssessment && (
        <div className="space-y-6">
          {/* Class KPI Summary Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card p-4 border border-surface-200 bg-white">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Class Average</span>
              <span className="text-2xl font-extrabold text-indigo-700 font-mono mt-1 block">
                {avg} <span className="text-xs font-semibold text-slate-400">({avgPct}%)</span>
              </span>
            </div>
            <div className="card p-4 border border-surface-200 bg-white">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Highest Mark</span>
              <span className="text-2xl font-extrabold text-emerald-600 font-mono mt-1 block">
                {highest} <span className="text-xs font-semibold text-slate-400">/ {max}</span>
              </span>
            </div>
            <div className="card p-4 border border-surface-200 bg-white">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Lowest Mark</span>
              <span className="text-2xl font-extrabold text-amber-600 font-mono mt-1 block">
                {lowest} <span className="text-xs font-semibold text-slate-400">/ {max}</span>
              </span>
            </div>
            <div className="card p-4 border border-surface-200 bg-white">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Passing Rate</span>
              <span className="text-2xl font-extrabold text-blue-600 font-mono mt-1 block">
                {passRate}%
              </span>
            </div>
          </div>

          {/* View Mode Switcher Header */}
          <div className="card p-5 sm:p-6 border border-surface-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-5 border-b border-surface-100">
              <div>
                <h2 className="text-lg font-display font-bold text-surface-900 flex items-center gap-2">
                  <HiChartBar className="w-5 h-5 text-indigo-600" />
                  <span>Scholastic Performance Workspace — {activeAssessment.name}</span>
                </h2>
                <p className="text-xs text-surface-500 mt-0.5">
                  Max Marks: <strong>{activeAssessment.maxMarks}</strong> • Date: <strong>{activeAssessment.assessmentDate || 'Current'}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* View Mode Toggle */}
                <div className="flex items-center p-1 bg-surface-100 rounded-xl">
                  <button
                    onClick={() => setViewMode('both')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      viewMode === 'both' ? 'bg-white text-indigo-600 shadow-sm' : 'text-surface-600 hover:text-surface-900'
                    }`}
                  >
                    Side-by-Side
                  </button>
                  <button
                    onClick={() => setViewMode('charts')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      viewMode === 'charts' ? 'bg-white text-indigo-600 shadow-sm' : 'text-surface-600 hover:text-surface-900'
                    }`}
                  >
                    Visual Analytics
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-surface-600 hover:text-surface-900'
                    }`}
                  >
                    Marks Entry Table
                  </button>
                </div>

                <button onClick={saveGrades} className="btn-primary text-xs !py-2 !px-4 shadow-md shadow-primary-500/20" id="save-grades-btn">
                  Save All Grades
                </button>
              </div>
            </div>

            {/* Visual Analytics Charts */}
            {(viewMode === 'charts' || viewMode === 'both') && (
              <div className="mb-6 p-4 sm:p-5 bg-surface-50/70 rounded-2xl border border-surface-200">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700 mb-4">
                  <HiSparkles className="w-4 h-4 text-indigo-600" />
                  <span>Real-Time Student Performance Tracking Charts</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Chart 1: Grade Tier Distribution */}
                  <div className="bg-white p-4 rounded-xl border border-surface-200 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                      Class Grade Distribution (A+ to F)
                    </h3>
                    <ClassGradeDistributionChart students={liveEvaluatedStudents} maxMarks={activeAssessment.maxMarks} />
                  </div>

                  {/* Chart 2: Student Score Ranking Comparative */}
                  <div className="bg-white p-4 rounded-xl border border-surface-200 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                      Student Performance Ranking vs Class Benchmark
                    </h3>
                    <StudentMarksRankingChart students={liveEvaluatedStudents} maxMarks={activeAssessment.maxMarks} />
                  </div>
                </div>
              </div>
            )}

            {/* Marks Entry Table */}
            {(viewMode === 'table' || viewMode === 'both') && (
              <div>
                <div className="flex items-center justify-between mb-3 text-xs">
                  <span className="font-bold text-slate-800">Enrolled Student Roll ({students.length} Students)</span>
                  <span className="text-slate-500">Inputs automatically update performance graphs above</span>
                </div>

                {loadingStudents ? (
                  <div className="py-12 text-center text-surface-400 font-medium animate-pulse text-sm">
                    Loading student class roster...
                  </div>
                ) : students.length === 0 ? (
                  <div className="py-10 text-center text-surface-500 text-sm">
                    No active students enrolled in this class.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-surface-200 rounded-2xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-900 text-white select-none">
                        <tr>
                          <th className="py-2.5 px-3 font-bold border-r border-slate-700 w-10 text-center">#</th>
                          <th className="py-2.5 px-3 font-bold border-r border-slate-700 w-32">Admission No</th>
                          <th className="py-2.5 px-3 font-bold border-r border-slate-700 min-w-[180px]">Student Name</th>
                          <th className="py-2.5 px-3 font-bold border-r border-slate-700 w-44">Marks (out of {activeAssessment.maxMarks})</th>
                          <th className="py-2.5 px-3 font-bold border-r border-slate-700 w-24 text-center">Score %</th>
                          <th className="py-2.5 px-3 font-bold border-r border-slate-700 w-20 text-center">Grade</th>
                          <th className="py-2.5 px-3 font-bold text-center w-28">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-200 bg-white">
                        {students.map((st, idx) => {
                          const currentVal = grades[st.studentId]
                          const marks = currentVal !== undefined && currentVal !== '' ? parseFloat(currentVal) : (st.marksObtained !== null ? parseFloat(st.marksObtained) : null)
                          const isOutOfRange = marks !== null && !isNaN(marks) && (marks < 0 || marks > activeAssessment.maxMarks)
                          const pct = marks !== null && !isNaN(marks) && !isOutOfRange ? Math.round((marks / activeAssessment.maxMarks) * 100) : null
                          const gradeLetter = isOutOfRange ? 'OUT OF RANGE' : (pct !== null ? (pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F') : '—')

                          return (
                            <tr
                              key={st.studentId}
                              className={`hover:bg-indigo-50/20 transition-colors ${
                                isOutOfRange ? 'bg-rose-50/60' : (idx % 2 === 0 ? 'bg-white' : 'bg-surface-50/50')
                              }`}
                            >
                              <td className="py-2.5 px-3 border-r border-surface-200 text-center font-mono text-surface-400 font-semibold">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3 border-r border-surface-200 font-mono font-bold text-slate-800">
                                {st.admissionNumber || '—'}
                              </td>
                              <td className="py-2.5 px-3 border-r border-surface-200 font-semibold text-surface-900">
                                {st.studentName}
                              </td>
                              <td className="py-2.5 px-3 border-r border-surface-200">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      min="0"
                                      max={activeAssessment.maxMarks}
                                      step="0.5"
                                      value={grades[st.studentId] ?? ''}
                                      onChange={(e) => setGrades({ ...grades, [st.studentId]: e.target.value })}
                                      className={`input-field py-1.5 px-2 text-xs font-mono font-bold w-28 transition-all ${
                                        isOutOfRange ? 'border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-300' : ''
                                      }`}
                                      placeholder="Enter marks"
                                    />
                                    <span className="text-slate-400 text-xs">/ {activeAssessment.maxMarks}</span>
                                  </div>
                                  {isOutOfRange && (
                                    <span className="text-[10px] text-rose-600 font-bold animate-pulse">
                                      ⚠️ Range: 0 - {activeAssessment.maxMarks}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 border-r border-surface-200 text-center font-mono font-extrabold">
                                {isOutOfRange ? (
                                  <span className="text-rose-600 font-bold text-[11px]">REJECTED</span>
                                ) : (
                                  <span className={pct !== null ? (pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-indigo-600' : pct >= 50 ? 'text-amber-600' : 'text-rose-600') : 'text-slate-400'}>
                                    {pct !== null ? `${pct}%` : '—'}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 border-r border-surface-200 text-center">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                                  isOutOfRange ? 'bg-rose-200 text-rose-900 border border-rose-300' :
                                  gradeLetter === 'A+' ? 'bg-emerald-100 text-emerald-800' :
                                  gradeLetter === 'A' ? 'bg-blue-100 text-blue-800' :
                                  gradeLetter === 'B' ? 'bg-indigo-100 text-indigo-800' :
                                  gradeLetter === 'C' ? 'bg-amber-100 text-amber-800' :
                                  gradeLetter === 'F' ? 'bg-rose-100 text-rose-800' : 'text-slate-400'
                                }`}>
                                  {gradeLetter}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {isOutOfRange ? (
                                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] border border-rose-200">
                                    Out of Range
                                  </span>
                                ) : marks !== null && !isNaN(marks) ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                    Evaluated
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold text-[10px]">
                                    Pending
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {/* 1-Click Class Report Card Generator Modal */}
      {showReportCardGenerator && (
        <ClassReportCardGeneratorModal
          initialClassId={selectedAssignment?.schoolClass?.id || selectedAssignment?.classId}
          onClose={() => setShowReportCardGenerator(false)}
        />
      )}
    </div>
  )
}
