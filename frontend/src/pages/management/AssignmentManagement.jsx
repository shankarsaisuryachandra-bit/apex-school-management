import { useState, useEffect } from 'react'
import api from '../../api/axiosConfig'
import {
  HiDocumentText, HiPlus, HiXMark, HiCalendar, HiBookOpen,
  HiArrowUpTray, HiCheckCircle, HiClock, HiEye, HiAcademicCap,
  HiSparkles, HiArrowTopRightOnSquare, HiCheckBadge, HiExclamationTriangle,
  HiMagnifyingGlass, HiTrash, HiArrowDownTray, HiTableCells, HiArrowPath,
  HiChartBar, HiPrinter
} from 'react-icons/hi2'
import {
  ClassGradeDistributionChart,
  StudentMarksRankingChart
} from '../../components/charts/StudentPerformanceCharts'
import { useAuth } from '../../auth/AuthContext'
import { getSolutionByUrlOrTitle } from '../../data/assignmentSolutionsData'

export default function AssignmentManagement() {
  const { user } = useAuth()
  const isTeacher = user?.role === 'TEACHER'
  const isManagement = user?.role === 'MANAGEMENT'
  const isStudent = user?.role === 'STUDENT'
  const isStaff = isTeacher || isManagement
  const studentId = user?.profileId || user?.userId || 1
  const teacherId = user?.profileId || user?.userId || 1

  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState({}) // student map: assignmentId -> submission
  const [classes, setClasses] = useState([])
  const [teacherClassAssignments, setTeacherClassAssignments] = useState([])
  const [allSubjects, setAllSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterClass, setFilterClass] = useState('ALL')

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(null)
  const [viewSubmissionsModal, setViewSubmissionsModal] = useState(null)
  const [previewMediaModal, setPreviewMediaModal] = useState(null) // { url, title, type }
  const [gradebookModal, setGradebookModal] = useState(null) // Assignment object
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null) // Assignment object to delete

  // Gradebook / CSV Spreadsheet state
  const [gradebookData, setGradebookData] = useState(null) // { assignment, totalStudents, submittedCount, evaluatedCount, students: [] }
  const [loadingGradebook, setLoadingGradebook] = useState(false)
  const [gradebookSearch, setGradebookSearch] = useState('')
  const [gradebookStatusFilter, setGradebookStatusFilter] = useState('ALL')
  const [gradebookEdits, setGradebookEdits] = useState({}) // submissionId -> { marks, feedback, status, saving, saved }
  const [showGradebookCharts, setShowGradebookCharts] = useState(false)

  // Teacher submissions state (Evaluation modal)
  const [teacherSubmissions, setTeacherSubmissions] = useState([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  const [gradingState, setGradingState] = useState({}) // submissionId -> { marks, feedback, status, saving, saved }

  // Form states
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingAssignment, setDeletingAssignment] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)

  // AI Worksheet Generator state
  const [generatingAiWorksheet, setGeneratingAiWorksheet] = useState(false)
  const [aiTopicInput, setAiTopicInput] = useState('')
  const [showAiTopicPrompt, setShowAiTopicPrompt] = useState(false)

  const [formData, setFormData] = useState({
    classId: '',
    subjectId: '',
    title: '',
    instructions: '',
    dueDate: '',
    maxMarks: 100
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (isTeacher) {
        // 1. Fetch teacher's assigned classes & subjects
        const [asgRes, myClassesRes] = await Promise.all([
          api.get(`/assignments?teacherId=${teacherId}`),
          api.get('/academics/my-classes')
        ])
        setAssignments(asgRes.data || [])
        const tAssignments = myClassesRes.data || []
        setTeacherClassAssignments(tAssignments)

        // Deduplicate classes from teacher assignments
        const classMap = new Map()
        tAssignments.forEach(item => {
          if (item.schoolClass && !classMap.has(item.schoolClass.id)) {
            classMap.set(item.schoolClass.id, item.schoolClass)
          }
        })
        setClasses(Array.from(classMap.values()))
      } else if (isManagement) {
        // Management gets all classes and subjects
        const [asgRes, cRes, sRes] = await Promise.all([
          api.get('/assignments'),
          api.get('/academics/classes'),
          api.get('/academics/subjects')
        ])
        setAssignments(asgRes.data || [])
        setClasses(cRes.data || [])
        setAllSubjects(sRes.data || [])
      } else {
        // Student gets class assignments and their own submissions
        const [asgRes, subRes] = await Promise.all([
          api.get(`/assignments?studentId=${studentId}`),
          api.get(`/assignments/my-submissions?studentId=${studentId}`)
        ])
        setAssignments(asgRes.data || [])
        const subMap = {}
        ;(subRes.data || []).forEach(sub => {
          if (sub.assignment?.id) {
            subMap[sub.assignment.id] = sub
          }
        })
        setSubmissions(subMap)
      }
    } catch (error) {
      console.error('Failed to fetch assignment portal data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Determine available subjects based on selected class in Create Assignment modal
  const availableSubjectsForSelectedClass = () => {
    if (!formData.classId) return []
    const selectedClassId = parseInt(formData.classId)
    if (isTeacher) {
      const subs = teacherClassAssignments
        .filter(item => item.schoolClass?.id === selectedClassId)
        .map(item => item.subject)
        .filter(Boolean)
      const seen = new Set()
      return subs.filter(s => {
        if (seen.has(s.id)) return false
        seen.add(s.id)
        return true
      })
    }
    return allSubjects
  }

  // Handle file selection in Create or Submit modal
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (ev) => setFilePreview(ev.target.result)
      reader.readAsDataURL(file)
    } else {
      setFilePreview(null)
    }
  }

  // Open Create Assignment modal with preselected teacher class & subject
  const handleOpenCreateModal = () => {
    setSelectedFile(null)
    setFilePreview(null)
    setMessage('')
    let defaultClassId = ''
    let defaultSubjectId = ''
    if (isTeacher && classes.length > 0) {
      defaultClassId = classes[0].id.toString()
      const subs = teacherClassAssignments
        .filter(item => item.schoolClass?.id === classes[0].id)
        .map(item => item.subject)
        .filter(Boolean)
      if (subs.length > 0) {
        defaultSubjectId = subs[0].id.toString()
      }
    }
    setFormData({
      classId: defaultClassId,
      subjectId: defaultSubjectId,
      title: '',
      instructions: '',
      dueDate: '',
      maxMarks: 100
    })
    setAiTopicInput('')
    setShowAiTopicPrompt(false)
    setShowCreateModal(true)
  }

  // AI Worksheet Auto-Draft
  const handleAutoGenerateAiWorksheet = async () => {
    const selClass = classes.find(c => c.id.toString() === formData.classId)
    const gradeLevel = selClass ? `${selClass.name} ${selClass.section || ''}`.trim() : 'Class 10'
    const selSub = allSubjects.find(s => s.id.toString() === formData.subjectId)
    const subName = selSub ? selSub.name : 'Mathematics'
    const topic = (aiTopicInput.trim() || formData.title.trim()) || 'Curriculum Problem Set'
    const localApiKey = localStorage.getItem('sms_gemini_api_key') || ''

    setGeneratingAiWorksheet(true)
    try {
      const res = await api.post('/ai/worksheet', {
        subject: subName,
        topic,
        gradeLevel,
        apiKey: localApiKey.trim() || undefined
      }, {
        headers: localApiKey.trim() ? { 'X-Gemini-Key': localApiKey.trim() } : {}
      })
      const ws = res.data
      if (ws) {
        const fullInstructions = `${ws.instructions || ''}\n\nQuestions:\n${(ws.questions || []).join('\n')}\n\nRubric:\n${ws.rubric || ''}`
        setFormData(prev => ({
          ...prev,
          title: ws.title || prev.title || `${gradeLevel}: ${topic} Worksheet`,
          instructions: fullInstructions.trim(),
          maxMarks: ws.maxMarks || 50,
          dueDate: prev.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }))
        setShowAiTopicPrompt(false)
        setMessage('✨ AI Worksheet drafted with curriculum problems & rubric!')
      }
    } catch (err) {
      console.error('Error generating AI worksheet:', err)
      setMessage('Failed to generate AI worksheet. Please try again.')
    } finally {
      setGeneratingAiWorksheet(false)
    }
  }

  // Teacher: Create Assignment
  const handleCreateAssignment = async (e) => {
    e.preventDefault()
    if (!formData.classId || !formData.title || !formData.dueDate) return
    const maxMarksNum = parseInt(formData.maxMarks || 100, 10)
    if (isNaN(maxMarksNum) || maxMarksNum < 1 || maxMarksNum > 1000) {
      alert('Maximum marks must be in the permitted range [1 - 1000]. System rejected input.')
      return
    }
    setSubmitting(true)
    setMessage('')

    try {
      let attachmentUrl = null

      // If teacher attached a file (PDF or photo), upload it first
      if (selectedFile) {
        const uploadData = new FormData()
        uploadData.append('file', selectedFile)
        const uploadRes = await api.post('/cms/upload', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        attachmentUrl = uploadRes.data?.url
      }

      await api.post('/assignments', {
        ...formData,
        classId: parseInt(formData.classId),
        subjectId: formData.subjectId ? parseInt(formData.subjectId) : null,
        maxMarks: parseInt(formData.maxMarks || 100),
        fileUrl: attachmentUrl,
        teacherId: teacherId
      })

      setMessage('Assignment published successfully with attached material!')
      setTimeout(() => {
        setMessage('')
        setShowCreateModal(false)
        setSelectedFile(null)
        setFilePreview(null)
        setFormData({
          classId: '',
          subjectId: '',
          title: '',
          instructions: '',
          dueDate: '',
          maxMarks: 100
        })
        fetchData()
      }, 1400)
    } catch (error) {
      console.error('Error creating assignment:', error)
      setMessage(error.response?.data?.message || 'Failed to create assignment')
    } finally {
      setSubmitting(false)
    }
  }

  // Teacher / Staff: Delete Assignment
  const handleDeleteAssignment = async () => {
    if (!deleteConfirmModal) return
    setDeletingAssignment(true)
    try {
      await api.delete(`/assignments/${deleteConfirmModal.id}`)
      setAssignments(prev => prev.filter(a => a.id !== deleteConfirmModal.id))
      setMessage('Assignment and all related student submissions deleted successfully.')
      setDeleteConfirmModal(null)
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Failed to delete assignment:', error)
      alert(error.response?.data?.message || 'Failed to delete assignment')
    } finally {
      setDeletingAssignment(false)
    }
  }

  // Student: Submit Assignment (PDF or Photo)
  const handleSubmitAssignment = async (e) => {
    e.preventDefault()
    if (!selectedFile || !showSubmitModal) return
    setSubmitting(true)
    setMessage('')

    try {
      // 1. Upload completed PDF or image
      const uploadData = new FormData()
      uploadData.append('file', selectedFile)
      const uploadRes = await api.post('/cms/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const fileUrl = uploadRes.data?.url

      // 2. Submit to backend
      await api.post(`/assignments/${showSubmitModal.id}/submit`, {
        studentId: studentId,
        fileUrl: fileUrl
      })

      setMessage('Completed assignment submitted successfully to your teacher!')
      setTimeout(() => {
        setMessage('')
        setShowSubmitModal(null)
        setSelectedFile(null)
        setFilePreview(null)
        fetchData()
      }, 1500)
    } catch (error) {
      console.error('Submission error:', error)
      setMessage(error.response?.data?.message || 'Failed to submit assignment')
    } finally {
      setSubmitting(false)
    }
  }

  // Teacher: View submissions for an assignment (Evaluation Modal)
  const handleOpenSubmissionsModal = async (asg) => {
    setViewSubmissionsModal(asg)
    setLoadingSubmissions(true)
    setTeacherSubmissions([])
    try {
      const res = await api.get(`/assignments/${asg.id}/submissions`)
      const list = res.data || []
      setTeacherSubmissions(list)

      const stateMap = {}
      list.forEach(sub => {
        stateMap[sub.id] = {
          marks: sub.marksObtained !== null && sub.marksObtained !== undefined ? sub.marksObtained : '',
          feedback: sub.feedback || '',
          status: sub.status || 'APPROVED',
          saving: false,
          saved: false
        }
      })
      setGradingState(stateMap)
    } catch (error) {
      console.error('Failed to load submissions:', error)
    } finally {
      setLoadingSubmissions(false)
    }
  }

  // Teacher: Grade, approve, request resubmission, allot marks
  const handleSaveGrade = async (submissionId, customState = null) => {
    const state = customState || gradingState[submissionId]
    if (!state) return

    const asgMax = gradebookModal?.maxMarks || viewSubmissionsModal?.maxMarks || 100
    if (state.marks !== '' && state.marks !== null && state.marks !== undefined) {
      const marksNum = parseInt(state.marks, 10)
      if (isNaN(marksNum) || marksNum < 0 || marksNum > asgMax) {
        alert(`Marks obtained (${state.marks}) is outside the permitted range [0 - ${asgMax}]. System rejected input.`)
        return
      }
    }

    if (!customState) {
      setGradingState(prev => ({
        ...prev,
        [submissionId]: { ...prev[submissionId], saving: true, saved: false }
      }))
    } else {
      setGradebookEdits(prev => ({
        ...prev,
        [submissionId]: { ...prev[submissionId], saving: true, saved: false }
      }))
    }

    try {
      const payload = {
        marksObtained: state.marks !== '' && state.marks !== null && state.marks !== undefined ? parseInt(state.marks) : null,
        feedback: state.feedback,
        status: state.status || 'APPROVED'
      }

      const res = await api.put(`/assignments/submissions/${submissionId}/grade`, payload)

      // Update submissions list if open
      setTeacherSubmissions(prev =>
        prev.map(sub => (sub.id === submissionId ? res.data : sub))
      )

      // Update gradebook data if open
      if (gradebookData) {
        setGradebookData(prev => {
          if (!prev) return prev
          return {
            ...prev,
            students: prev.students.map(st => {
              if (st.submissionId === submissionId) {
                return {
                  ...st,
                  marksObtained: res.data.marksObtained,
                  feedback: res.data.feedback,
                  status: res.data.status
                }
              }
              return st
            })
          }
        })
      }

      if (!customState) {
        setGradingState(prev => ({
          ...prev,
          [submissionId]: { ...prev[submissionId], saving: false, saved: true }
        }))
        setTimeout(() => {
          setGradingState(prev => ({
            ...prev,
            [submissionId]: { ...prev[submissionId], saved: false }
          }))
        }, 2500)
      } else {
        setGradebookEdits(prev => ({
          ...prev,
          [submissionId]: { ...prev[submissionId], saving: false, saved: true }
        }))
        setTimeout(() => {
          setGradebookEdits(prev => ({
            ...prev,
            [submissionId]: { ...prev[submissionId], saved: false }
          }))
        }, 2500)
      }
    } catch (error) {
      console.error('Error grading submission:', error)
      alert(error.response?.data?.message || 'Failed to save marks and feedback')
      if (!customState) {
        setGradingState(prev => ({
          ...prev,
          [submissionId]: { ...prev[submissionId], saving: false }
        }))
      } else {
        setGradebookEdits(prev => ({
          ...prev,
          [submissionId]: { ...prev[submissionId], saving: false }
        }))
      }
    }
  }

  // Teacher: Open Class Gradebook (CSV Table UI)
  const handleOpenGradebook = async (asg) => {
    setGradebookModal(asg)
    setLoadingGradebook(true)
    setGradebookData(null)
    setGradebookSearch('')
    setGradebookStatusFilter('ALL')
    try {
      const res = await api.get(`/assignments/${asg.id}/gradebook`)
      const data = res.data || {}
      setGradebookData(data)

      // Initialize inline gradebook edits for all submissions
      const edits = {}
      ;(data.students || []).forEach(st => {
        if (st.submissionId) {
          edits[st.submissionId] = {
            marks: st.marksObtained !== null && st.marksObtained !== undefined ? st.marksObtained : '',
            feedback: st.feedback || '',
            status: st.status || 'SUBMITTED',
            saving: false,
            saved: false
          }
        }
      })
      setGradebookEdits(edits)
    } catch (error) {
      console.error('Failed to load gradebook:', error)
      alert('Unable to load gradebook spreadsheet for this assignment.')
    } finally {
      setLoadingGradebook(false)
    }
  }

  // Teacher: Export Class Gradebook to real CSV file
  const handleExportCSV = () => {
    if (!gradebookData || !gradebookData.students) return
    const asg = gradebookData.assignment || gradebookModal
    const className = asg?.schoolClass?.name || 'Class'
    const section = asg?.schoolClass?.section ? `_${asg.schoolClass.section}` : ''
    const subject = asg?.subject?.name ? `_${asg.subject.name}` : ''

    const headers = [
      '#',
      'Admission Number',
      'Student Name',
      'Gender',
      'Submission Status',
      'Submission Date',
      'Marks Obtained',
      'Max Marks',
      'Percentage (%)',
      'Teacher Remarks / Resubmission Reason',
      'Attachment URL'
    ]

    const rows = gradebookData.students.map((st, idx) => {
      const marks = st.marksObtained !== null && st.marksObtained !== undefined ? st.marksObtained : ''
      const max = asg?.maxMarks || 100
      const pct = marks !== '' ? ((marks / max) * 100).toFixed(1) + '%' : 'N/A'

      return [
        idx + 1,
        st.admissionNumber || '',
        st.fullName || '',
        st.gender || '',
        st.status || 'PENDING',
        st.submissionDate || '',
        marks,
        max,
        pct,
        st.feedback || '',
        st.fileUrl || ''
      ]
    })

    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(row =>
        row.map(cell => {
          const str = String(cell ?? '').replace(/"/g, '""')
          return `"${str}"`
        }).join(',')
      )
    ].join('\r\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    const safeTitle = (asg?.title || 'Assignment').replace(/[^a-zA-Z0-9_-]/g, '_')
    link.setAttribute('download', `Gradebook_${safeTitle}_${className}${section}${subject}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const [pdfViewTab, setPdfViewTab] = useState('dossier') // 'dossier' | 'frame'

  // Open Preview Modal
  const openFilePreview = (url, title = 'Attached Document', asgContext = null) => {
    if (!url) return
    const isImage = url.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i)
    const asgTitle = asgContext?.title || (typeof title === 'string' ? title : '')
    const solutionData = getSolutionByUrlOrTitle(url, asgTitle)
    setPdfViewTab('dossier')
    setPreviewMediaModal({
      url,
      title,
      type: isImage ? 'image' : 'pdf',
      solutionData
    })
  }

  // Filtered assignments
  const filteredAssignments = assignments.filter(asg => {
    // If logged in as Teacher: strictly ensure only assignments authored by this teacher are shown
    if (isTeacher) {
      const isMyAssignment =
        (asg.teacher && (asg.teacher.id === teacherId || asg.teacher.id === user?.profileId)) ||
        (asg.teacher?.user && (asg.teacher.user.id === user?.userId || asg.teacher.user.username === user?.username))
      if (!isMyAssignment) return false
    }

    const matchClass = filterClass === 'ALL' || asg.schoolClass?.id === parseInt(filterClass)
    const matchSearch =
      asg.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asg.subject?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asg.instructions?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchClass && matchSearch
  })

  // Filtered Gradebook Students
  const filteredGradebookStudents = (gradebookData?.students || []).filter(st => {
    const matchesSearch =
      !gradebookSearch ||
      st.fullName?.toLowerCase().includes(gradebookSearch.toLowerCase()) ||
      st.admissionNumber?.toLowerCase().includes(gradebookSearch.toLowerCase())

    const matchesStatus =
      gradebookStatusFilter === 'ALL' ||
      (gradebookStatusFilter === 'PENDING' && (!st.hasSubmitted || st.status === 'PENDING')) ||
      (gradebookStatusFilter === 'SUBMITTED' && st.status === 'SUBMITTED') ||
      (gradebookStatusFilter === 'NEEDS_RESUBMISSION' && (st.status === 'NEEDS_RESUBMISSION' || st.status === 'NEEDS_REVISION')) ||
      (gradebookStatusFilter === 'APPROVED' && (st.status === 'APPROVED' || st.status === 'GRADED'))

    return matchesSearch && matchesStatus
  })

  return (
    <div className="animate-fade-in space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-[#0F2942] to-slate-900 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <HiAcademicCap className="w-4 h-4" />
              {isTeacher ? 'Teacher Assignment Management' : isStudent ? 'Student Homework Portal' : 'Academic Assignment Desk'}
            </span>
            {isTeacher && (
              <span className="text-xs text-slate-300">
                • {classes.length} Assigned Class{classes.length === 1 ? '' : 'es'}
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-extrabold tracking-tight text-white">
            Class Assignments & Submissions
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            {isTeacher
              ? 'Publish worksheets with PDF or photo materials for your assigned classes, review student submissions, request resubmissions with remarks, allot marks, and view spreadsheet gradebooks.'
              : isStudent
              ? 'Access question papers and study materials from teachers, upload completed solutions, and check teacher feedback or resubmission requests.'
              : 'Institutional overview of all ongoing class assignments, coursework materials, and evaluation progress.'}
          </p>
        </div>

        {isStaff && (
          <div className="relative z-10 flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleOpenCreateModal}
              className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <HiPlus className="w-5 h-5 stroke-2" />
              <span>Create New Assignment</span>
            </button>
          </div>
        )}
      </div>

      {/* Toast / Global Message */}
      {message && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-bold flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <HiSparkles className="w-5 h-5 text-amber-600 shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="text-amber-700 hover:text-amber-900">
            <HiXMark className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Controls & Filtering Bar */}
      <div className="card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <HiMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search by title, subject, instructions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10 py-2 text-sm w-full"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {classes.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-surface-500 uppercase tracking-wide">Class:</span>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="input-field py-1.5 px-3 text-sm rounded-xl"
              >
                <option value="ALL">All Assigned Classes ({classes.length})</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={fetchData}
            className="px-3 py-1.5 rounded-xl border border-surface-200 text-surface-700 hover:bg-surface-50 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <HiArrowPath className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Assignment Cards List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(n => (
            <div key={n} className="card p-6 h-64 bg-surface-100/60 rounded-3xl"></div>
          ))}
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="text-center py-16 card p-8 rounded-3xl border border-dashed border-surface-300">
          <HiDocumentText className="w-16 h-16 mx-auto mb-3 text-surface-300" />
          <h3 className="text-lg font-bold text-surface-800">No Assignments Found</h3>
          <p className="text-surface-500 text-sm mt-1 max-w-md mx-auto">
            {isTeacher
              ? 'You have not created any assignments for your assigned classes yet. Click "Create New Assignment" above to upload a worksheet!'
              : 'No coursework assignments are currently pending for your class.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.map((asg) => {
            const submission = submissions[asg.id]
            const isSubmitted = !!submission
            const isApproved = submission?.status === 'APPROVED' || submission?.status === 'GRADED'
            const isResubmissionNeeded = submission?.status === 'NEEDS_RESUBMISSION' || submission?.status === 'NEEDS_REVISION'
            const hasMaterial = !!asg.fileUrl

            return (
              <div
                key={asg.id}
                className={`card p-6 flex flex-col justify-between rounded-3xl transition-all duration-200 hover:shadow-xl border-l-4 ${
                  isStudent
                    ? isResubmissionNeeded
                      ? 'border-l-amber-500 bg-amber-50/20 shadow-sm'
                      : isApproved
                      ? 'border-l-emerald-500'
                      : isSubmitted
                      ? 'border-l-blue-500'
                      : 'border-l-accent-500'
                    : 'border-l-[#0F2942]'
                }`}
              >
                <div>
                  {/* Top Badges & Delete Button */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-extrabold uppercase tracking-wide truncate">
                        {asg.schoolClass?.name || 'Class'} {asg.schoolClass?.section ? `(${asg.schoolClass.section})` : ''}
                      </span>
                      <span className="text-xs font-semibold text-surface-600 flex items-center gap-1.5 bg-surface-50 px-2.5 py-1 rounded-xl shrink-0">
                        <HiCalendar className="w-3.5 h-3.5 text-accent-600" />
                        Due: {asg.dueDate}
                      </span>
                    </div>

                    {/* Delete Assignment Option (Management or Assignment Author Teacher) */}
                    {(isManagement || (isTeacher && (asg.teacher?.id === teacherId || asg.teacher?.id === user?.profileId || asg.teacher?.user?.id === user?.userId))) && (
                      <button
                        onClick={() => setDeleteConfirmModal(asg)}
                        className="p-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors shrink-0"
                        title="Delete Assignment"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Title & Subject */}
                  <h3 className="font-display font-bold text-surface-900 text-lg leading-snug mb-1">
                    {asg.title}
                  </h3>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="text-xs font-bold text-accent-700 bg-accent-50 px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <HiBookOpen className="w-3.5 h-3.5" />
                      {asg.subject?.name || 'General Subject'}
                    </span>
                    {isTeacher ? (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                        My Assignment
                      </span>
                    ) : asg.teacher?.fullName ? (
                      <span className="text-xs text-surface-500 font-medium">
                        by {asg.teacher.fullName}
                      </span>
                    ) : null}
                  </div>

                  {/* Instructions */}
                  <p className="text-surface-700 text-sm leading-relaxed line-clamp-3 mb-4">
                    {asg.instructions || 'No detailed instructions provided.'}
                  </p>

                  {/* Teacher's Uploaded Attachment (Worksheet PDF or Photo) */}
                  {hasMaterial && (
                    <div className="mb-4 p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs">
                          {asg.fileUrl.endsWith('.pdf') ? 'PDF' : 'IMG'}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            Worksheet / Question Paper
                          </p>
                          <p className="text-[11px] text-slate-600">Attached by Teacher</p>
                        </div>
                      </div>
                      <button
                        onClick={() => openFilePreview(asg.fileUrl, `${asg.title} - Question Material`, asg)}
                        className="px-2.5 py-1 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-100 flex items-center gap-1 shrink-0 transition-colors shadow-sm"
                      >
                        <HiEye className="w-3.5 h-3.5" />
                        View
                      </button>
                    </div>
                  )}

                  {/* Student View: Resubmission Request Banner OR Graded/Submitted Banner */}
                  {isStudent && isSubmitted && (
                    <div className="mb-4 space-y-2">
                      {isResubmissionNeeded ? (
                        /* RESUBMISSION REQUIRED NOTICE WITH TEACHER REMARKS */
                        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-400 text-amber-950 space-y-2 shadow-sm animate-fade-in">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs font-black text-amber-900 uppercase tracking-wide">
                              <HiExclamationTriangle className="w-4 h-4 text-amber-600 animate-pulse" />
                              Resubmission Requested by Teacher
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                              Action Required
                            </span>
                          </div>

                          {submission.feedback ? (
                            <div className="p-3 rounded-xl bg-white border border-amber-200 shadow-xs space-y-1">
                              <p className="text-[11px] font-extrabold uppercase tracking-wide text-amber-800">
                                Teacher's Remarks / Reason:
                              </p>
                              <p className="italic text-slate-800 text-xs font-medium leading-relaxed">
                                "{submission.feedback}"
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-amber-800 font-medium">
                              Your teacher has asked you to review and resubmit your solution.
                            </p>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-amber-800 font-medium pt-1 border-t border-amber-200/60">
                            <span>Previous submission file:</span>
                            <button
                              onClick={() => openFilePreview(submission.fileUrl, 'My Previous Solution', asg)}
                              className="text-amber-900 font-bold underline hover:text-amber-700 flex items-center gap-1"
                            >
                              <HiEye className="w-3.5 h-3.5" />
                              View Previous File
                            </button>
                          </div>
                        </div>
                      ) : isApproved ? (
                        /* APPROVED & GRADED CARD */
                        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold flex items-center gap-1">
                              <HiCheckCircle className="w-4 h-4 text-emerald-600" />
                              Approved & Graded
                            </span>
                            <span className="text-sm font-extrabold text-emerald-700">
                              {submission.marksObtained} / {asg.maxMarks} Marks
                            </span>
                          </div>
                          {submission.feedback && (
                            <div className="mt-2 pt-2 border-t border-emerald-200/60 text-xs text-emerald-800">
                              <span className="font-bold">Teacher Feedback: </span>
                              <span className="italic">"{submission.feedback}"</span>
                            </div>
                          )}
                          <div className="mt-2 text-right">
                            <button
                              onClick={() => openFilePreview(submission.fileUrl, 'My Evaluated Solution', asg)}
                              className="text-xs text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
                            >
                              <HiEye className="w-3.5 h-3.5" />
                              View My Solution
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* PENDING TEACHER REVIEW */
                        <div className="p-3 rounded-2xl bg-surface-50 border border-surface-200 text-surface-700 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 font-medium text-amber-700">
                              <HiClock className="w-4 h-4 text-amber-600 shrink-0" />
                              Submitted! Awaiting teacher review.
                            </span>
                            <button
                              onClick={() => openFilePreview(submission.fileUrl, 'My Submitted Work', asg)}
                              className="text-accent-600 font-bold hover:underline flex items-center gap-1 text-[11px]"
                            >
                              <HiEye className="w-3.5 h-3.5" />
                              View File
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="border-t border-surface-100 pt-4 mt-2 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-surface-500">
                      Total Weightage: <strong className="text-surface-900 font-bold">{asg.maxMarks} Marks</strong>
                    </span>
                    {!isStaff && (
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                        isApproved
                          ? 'bg-emerald-100 text-emerald-800'
                          : isResubmissionNeeded
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : isSubmitted
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isApproved
                          ? 'Graded ✓'
                          : isResubmissionNeeded
                          ? 'Resubmission Required ⚠️'
                          : isSubmitted
                          ? 'Submitted'
                          : 'Pending'}
                      </span>
                    )}
                  </div>

                  {/* Staff Actions: Spreadsheet CSV Gradebook & Evaluation Modal */}
                  {isStaff && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => handleOpenGradebook(asg)}
                        className="flex-1 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        title="View Full Class Gradebook & CSV"
                      >
                        <HiTableCells className="w-4 h-4 text-emerald-200" />
                        <span>Class Gradebook (CSV)</span>
                      </button>
                      <button
                        onClick={() => handleOpenSubmissionsModal(asg)}
                        className="px-3 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <HiDocumentText className="w-4 h-4 text-amber-400" />
                        <span>Evaluate Submissions</span>
                      </button>
                    </div>
                  )}

                  {/* Student Action Buttons */}
                  {isStudent && (
                    <div>
                      {isResubmissionNeeded ? (
                        <button
                          onClick={() => {
                            setShowSubmitModal(asg)
                            setSelectedFile(null)
                            setFilePreview(null)
                            setMessage('')
                          }}
                          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.01]"
                        >
                          <HiArrowUpTray className="w-4 h-4 stroke-2" />
                          <span>Upload Revised Assignment (PDF / Photo)</span>
                        </button>
                      ) : !isSubmitted ? (
                        <button
                          onClick={() => {
                            setShowSubmitModal(asg)
                            setSelectedFile(null)
                            setFilePreview(null)
                            setMessage('')
                          }}
                          className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:scale-[1.01]"
                        >
                          <HiArrowUpTray className="w-4 h-4" />
                          <span>Upload Completed Assignment (PDF / Photo)</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setShowSubmitModal(asg)
                            setSelectedFile(null)
                            setFilePreview(null)
                            setMessage('')
                          }}
                          className="btn-secondary w-full py-1.5 text-xs text-surface-600 hover:text-surface-900 flex items-center justify-center gap-1.5"
                        >
                          <HiArrowUpTray className="w-3.5 h-3.5" />
                          <span>Re-upload / Update Solution</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CLASS GRADEBOOK (CSV SPREADSHEET UI) MODAL */}
      {/* ========================================================================= */}
      {gradebookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 animate-fade-in">
          <div className="card-glass w-full max-w-6xl bg-white p-5 sm:p-7 rounded-3xl shadow-2xl relative border border-surface-200 max-h-[94vh] flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-200">
              <div className="min-w-0 pr-6">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wide">
                    {gradebookModal.schoolClass?.name} - {gradebookModal.schoolClass?.section}
                  </span>
                  <span className="text-xs font-bold text-slate-600">
                    • {gradebookModal.subject?.name || 'General Subject'}
                  </span>
                  <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                    Max Marks: {gradebookModal.maxMarks}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-display font-extrabold text-surface-900 truncate">
                  📊 Class Gradebook & Spreadsheet View: {gradebookModal.title}
                </h3>
              </div>

              {/* Top Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowGradebookCharts(!showGradebookCharts)}
                  className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                    showGradebookCharts
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'border border-surface-200 text-surface-700 bg-white hover:bg-surface-50'
                  }`}
                  title="Toggle Analytics & Performance Charts"
                >
                  <HiChartBar className="w-4 h-4" />
                  <span>{showGradebookCharts ? 'Hide Visuals' : 'Performance Analytics'}</span>
                </button>

                <button
                  onClick={handleExportCSV}
                  disabled={loadingGradebook || !gradebookData?.students?.length}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  title="Export complete class gradebook as .CSV spreadsheet file"
                >
                  <HiArrowDownTray className="w-4 h-4 stroke-2" />
                  <span>Download CSV</span>
                </button>

                <button
                  onClick={() => handleOpenGradebook(gradebookModal)}
                  className="p-2 rounded-xl border border-surface-200 text-surface-600 hover:bg-surface-50 transition-colors"
                  title="Refresh Gradebook Data"
                >
                  <HiArrowPath className={`w-4 h-4 ${loadingGradebook ? 'animate-spin' : ''}`} />
                </button>

                <button
                  onClick={() => setGradebookModal(null)}
                  className="p-2 rounded-xl text-surface-400 hover:text-surface-900 hover:bg-surface-100 transition-colors"
                >
                  <HiXMark className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Summary Metrics Bar */}
            {gradebookData && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 py-3 border-b border-surface-100">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-[11px] font-bold text-slate-500 uppercase">Enrolled Students</p>
                  <p className="text-lg font-extrabold text-slate-900">{gradebookData.totalStudents}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200">
                  <p className="text-[11px] font-bold text-blue-600 uppercase">Turned In</p>
                  <p className="text-lg font-extrabold text-blue-900">
                    {gradebookData.submittedCount}
                    <span className="text-xs font-normal text-blue-600 ml-1">
                      ({gradebookData.totalStudents ? Math.round((gradebookData.submittedCount / gradebookData.totalStudents) * 100) : 0}%)
                    </span>
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <p className="text-[11px] font-bold text-emerald-600 uppercase">Graded / Approved</p>
                  <p className="text-lg font-extrabold text-emerald-900">{gradebookData.evaluatedCount}</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                  <p className="text-[11px] font-bold text-amber-700 uppercase">Needs Resubmission</p>
                  <p className="text-lg font-extrabold text-amber-900">
                    {gradebookData.students?.filter(s => s.status === 'NEEDS_RESUBMISSION' || s.status === 'NEEDS_REVISION').length || 0}
                  </p>
                </div>
                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 col-span-2 sm:col-span-1">
                  <p className="text-[11px] font-bold text-rose-600 uppercase">Pending Submissions</p>
                  <p className="text-lg font-extrabold text-rose-900">
                    {gradebookData.students?.filter(s => !s.hasSubmitted || s.status === 'PENDING').length || 0}
                  </p>
                </div>
              </div>
            )}

            {/* Visual Performance Analytics Section */}
            {gradebookData && showGradebookCharts && (
              <div className="p-4 bg-gradient-to-br from-slate-50 to-indigo-50/40 rounded-2xl border border-indigo-100 my-2 animate-fade-in space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                    <HiChartBar className="w-4 h-4 text-indigo-600" />
                    Assignment Performance Analytics & Grade Distribution
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Evaluated: <strong className="text-slate-800">{gradebookData.evaluatedCount}</strong> / {gradebookData.totalStudents}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h5 className="text-xs font-bold text-slate-700 mb-2">Class Grade Tier Breakdown</h5>
                    <ClassGradeDistributionChart
                      students={gradebookData.students || []}
                      maxMarks={gradebookModal.maxMarks}
                    />
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h5 className="text-xs font-bold text-slate-700 mb-2">Student Score Comparison vs Class Average</h5>
                    <StudentMarksRankingChart
                      students={gradebookData.students || []}
                      maxMarks={gradebookModal.maxMarks}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Filter and Search Bar for Gradebook */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3">
              <div className="relative w-full sm:w-72">
                <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="text"
                  placeholder="Filter student name or admission no..."
                  value={gradebookSearch}
                  onChange={(e) => setGradebookSearch(e.target.value)}
                  className="input-field pl-9 py-1.5 text-xs w-full"
                />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
                <span className="text-xs font-bold text-surface-500 mr-1">Status:</span>
                {[
                  { key: 'ALL', label: 'All Students' },
                  { key: 'PENDING', label: 'Pending' },
                  { key: 'SUBMITTED', label: 'Submitted' },
                  { key: 'NEEDS_RESUBMISSION', label: 'Resubmission' },
                  { key: 'APPROVED', label: 'Graded' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setGradebookStatusFilter(tab.key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                      gradebookStatusFilter === tab.key
                        ? 'bg-slate-900 text-white'
                        : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Spreadsheet Table Grid */}
            <div className="flex-1 overflow-auto border border-surface-200 rounded-2xl">
              {loadingGradebook ? (
                <div className="py-20 text-center text-surface-400 font-medium animate-pulse">
                  Loading class gradebook spreadsheet...
                </div>
              ) : filteredGradebookStudents.length === 0 ? (
                <div className="py-16 text-center text-surface-500">
                  <p className="font-bold">No students match current search / filter criteria</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-900 text-white sticky top-0 z-10 select-none">
                    <tr>
                      <th className="py-2.5 px-3 font-bold border-r border-slate-700 w-10 text-center">#</th>
                      <th className="py-2.5 px-3 font-bold border-r border-slate-700 w-28">Admission No</th>
                      <th className="py-2.5 px-3 font-bold border-r border-slate-700 min-w-[160px]">Student Name</th>
                      <th className="py-2.5 px-3 font-bold border-r border-slate-700 w-36 text-center">Submission Status</th>
                      <th className="py-2.5 px-3 font-bold border-r border-slate-700 w-28">Turned In Date</th>
                      <th className="py-2.5 px-3 font-bold border-r border-slate-700 w-28 text-center">Attached Solution</th>
                      <th className="py-2.5 px-3 font-bold border-r border-slate-700 w-32">Marks / Max</th>
                      <th className="py-2.5 px-3 font-bold border-r border-slate-700 min-w-[200px]">Teacher Remarks</th>
                      <th className="py-2.5 px-3 font-bold w-24 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-200 bg-white">
                    {filteredGradebookStudents.map((st, idx) => {
                      const edit = st.submissionId ? gradebookEdits[st.submissionId] : null
                      const isPending = !st.hasSubmitted || st.status === 'PENDING'
                      const isResubmit = st.status === 'NEEDS_RESUBMISSION' || st.status === 'NEEDS_REVISION'
                      const isGraded = st.status === 'APPROVED' || st.status === 'GRADED'

                      return (
                        <tr
                          key={st.studentId}
                          className={`hover:bg-amber-50/30 transition-colors ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-surface-50/60'
                          }`}
                        >
                          {/* Row # */}
                          <td className="py-2.5 px-3 border-r border-surface-200 text-center font-mono text-surface-500 font-semibold">
                            {idx + 1}
                          </td>

                          {/* Admission No */}
                          <td className="py-2.5 px-3 border-r border-surface-200 font-mono font-bold text-slate-800">
                            {st.admissionNumber || '—'}
                          </td>

                          {/* Student Name */}
                          <td className="py-2.5 px-3 border-r border-surface-200 font-semibold text-surface-900">
                            <div className="flex items-center gap-1.5">
                              <span>{st.fullName}</span>
                              {st.gender && (
                                <span className="text-[10px] text-surface-400 font-normal">
                                  ({st.gender[0]})
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="py-2.5 px-3 border-r border-surface-200 text-center">
                            {isPending ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px]">
                                Not Submitted
                              </span>
                            ) : isResubmit ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] inline-flex items-center gap-1">
                                <HiExclamationTriangle className="w-3 h-3 text-amber-600" />
                                Resubmission
                              </span>
                            ) : isGraded ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                                Graded ✓
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px]">
                                Submitted
                              </span>
                            )}
                          </td>

                          {/* Turned In Date */}
                          <td className="py-2.5 px-3 border-r border-surface-200 text-surface-600">
                            {st.submissionDate || '—'}
                          </td>

                          {/* Attached Solution File */}
                          <td className="py-2.5 px-3 border-r border-surface-200 text-center">
                            {st.fileUrl ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => openFilePreview(st.fileUrl, `${st.fullName}'s Solution`, gradebookData?.assignment || gradebookModal)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 font-bold text-[11px] inline-flex items-center gap-1 shadow-sm transition-all"
                                  title="View solution dossier and preview"
                                >
                                  <HiEye className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>View PDF</span>
                                </button>
                                <a
                                  href={st.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded-lg bg-surface-100 text-surface-600 hover:text-emerald-700 hover:bg-emerald-50 border border-surface-200 transition-colors"
                                  title="Open raw PDF file in a new browser tab"
                                >
                                  <HiArrowTopRightOnSquare className="w-3.5 h-3.5" />
                                </a>
                                <a
                                  href={st.fileUrl}
                                  download
                                  className="p-1 rounded-lg bg-surface-100 text-surface-600 hover:text-blue-700 hover:bg-blue-50 border border-surface-200 transition-colors"
                                  title="Download PDF to computer"
                                >
                                  <HiArrowDownTray className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            ) : (
                              <span className="text-surface-400">—</span>
                            )}
                          </td>

                          {/* Marks Allotted */}
                          <td className="py-2.5 px-3 border-r border-surface-200">
                            {st.submissionId && edit ? (
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="0"
                                    max={gradebookModal.maxMarks}
                                    placeholder="Marks"
                                    value={edit.marks !== undefined ? edit.marks : ''}
                                    onChange={(e) =>
                                      setGradebookEdits(prev => ({
                                        ...prev,
                                        [st.submissionId]: { ...prev[st.submissionId], marks: e.target.value }
                                      }))
                                    }
                                    className={`input-field py-1 px-1.5 text-xs w-16 text-center font-bold ${
                                      edit.marks !== '' && edit.marks !== undefined && (parseInt(edit.marks, 10) < 0 || parseInt(edit.marks, 10) > gradebookModal.maxMarks)
                                        ? 'border-rose-500 bg-rose-50 text-rose-700 ring-1 ring-rose-400'
                                        : ''
                                    }`}
                                  />
                                  <span className="text-surface-400 font-medium">/{gradebookModal.maxMarks}</span>
                                </div>
                                {edit.marks !== '' && edit.marks !== undefined && (parseInt(edit.marks, 10) < 0 || parseInt(edit.marks, 10) > gradebookModal.maxMarks) && (
                                  <span className="text-[10px] text-rose-600 font-bold">0-{gradebookModal.maxMarks}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-surface-400 font-mono">
                                {st.marksObtained !== null && st.marksObtained !== undefined ? `${st.marksObtained}/${gradebookModal.maxMarks}` : '—'}
                              </span>
                            )}
                          </td>

                          {/* Teacher Remarks / Feedback */}
                          <td className="py-2.5 px-3 border-r border-surface-200">
                            {st.submissionId && edit ? (
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  placeholder="Enter remarks or resubmission instructions..."
                                  value={edit.feedback || ''}
                                  onChange={(e) =>
                                    setGradebookEdits(prev => ({
                                      ...prev,
                                      [st.submissionId]: { ...prev[st.submissionId], feedback: e.target.value }
                                    }))
                                  }
                                  className="input-field py-1 px-2 text-xs w-full"
                                />
                                <select
                                  value={edit.status || 'APPROVED'}
                                  onChange={(e) =>
                                    setGradebookEdits(prev => ({
                                      ...prev,
                                      [st.submissionId]: { ...prev[st.submissionId], status: e.target.value }
                                    }))
                                  }
                                  className="input-field py-0.5 px-1 text-[11px] w-full bg-surface-50 font-medium"
                                >
                                  <option value="APPROVED">Set Status: Approved ✓</option>
                                  <option value="GRADED">Set Status: Graded</option>
                                  <option value="NEEDS_RESUBMISSION">Set Status: Needs Resubmission ⚠️</option>
                                  <option value="SUBMITTED">Set Status: Submitted</option>
                                </select>
                              </div>
                            ) : (
                              <span className="text-surface-500 italic text-[11px]">
                                {st.feedback || (isPending ? 'Awaiting student submission' : 'No remarks')}
                              </span>
                            )}
                          </td>

                          {/* Action Button */}
                          <td className="py-2.5 px-3 text-center">
                            {st.submissionId && edit ? (
                              <button
                                onClick={() => handleSaveGrade(st.submissionId, edit)}
                                disabled={edit.saving}
                                className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-all flex items-center justify-center gap-1 mx-auto ${
                                  edit.saved
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-[#0F2942] text-amber-400 hover:bg-slate-900 shadow-sm'
                                }`}
                              >
                                {edit.saving ? 'Saving...' : edit.saved ? 'Saved ✓' : 'Save'}
                              </button>
                            ) : (
                              <span className="text-surface-300 text-[11px]">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE ASSIGNMENT CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="card-glass w-full max-w-md bg-white p-6 rounded-3xl shadow-2xl relative border border-rose-200">
            <div className="flex items-center gap-3 mb-3 text-rose-600">
              <span className="p-2 rounded-2xl bg-rose-100">
                <HiTrash className="w-6 h-6" />
              </span>
              <h3 className="text-lg font-display font-bold text-surface-900">
                Delete Assignment?
              </h3>
            </div>

            <p className="text-sm text-surface-700 mb-2">
              Are you sure you want to permanently delete:
            </p>
            <p className="p-3 bg-surface-50 rounded-xl border border-surface-200 font-bold text-slate-900 text-sm mb-4">
              "{deleteConfirmModal.title}"
            </p>
            <p className="text-xs text-rose-600 font-medium mb-5 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
              ⚠️ Warning: This will delete the assignment and all student submissions, files, marks, and feedback associated with it. This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal(null)}
                className="btn-secondary flex-1 py-2.5 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAssignment}
                disabled={deletingAssignment}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex-1 transition-all flex items-center justify-center gap-2 shadow-md shadow-rose-600/20"
              >
                {deletingAssignment ? 'Deleting...' : 'Yes, Delete Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE ASSIGNMENT MODAL (TEACHER / MANAGEMENT) */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="card-glass w-full max-w-lg bg-white p-6 sm:p-7 rounded-3xl shadow-2xl relative border border-surface-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-surface-400 hover:text-surface-900 hover:bg-surface-100 transition-colors"
            >
              <HiXMark className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-2xl bg-amber-500 text-slate-950 font-bold">
                <HiAcademicCap className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-xl font-display font-extrabold text-surface-900">
                  Create Class Assignment
                </h3>
                <p className="text-xs text-surface-500">
                  {isTeacher ? 'Assign homework to your allocated classes' : 'Institutional assignment publishing'}
                </p>
              </div>
            </div>

            {message && (
              <div className="my-4 p-3.5 rounded-2xl bg-amber-100 border border-amber-200 text-amber-900 text-sm font-semibold flex items-center gap-2">
                <HiSparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {/* AI Auto-Draft Assistant Tool */}
            <div className="mt-3 mb-2 p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100/70 border border-amber-200">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                    <HiSparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-950">AI Worksheet & Problem Generator</p>
                    <p className="text-[10px] text-amber-800">Draft CBSE/ICSE questions, problems & rubrics</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAiTopicPrompt(!showAiTopicPrompt)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <HiSparkles className="w-3.5 h-3.5" />
                  <span>{showAiTopicPrompt ? 'Hide Assistant' : '⚡ AI Auto-Draft'}</span>
                </button>
              </div>

              {showAiTopicPrompt && (
                <div className="mt-3 pt-3 border-t border-amber-200/80 space-y-2 animate-fade-in">
                  <p className="text-[11px] text-amber-900 font-medium">
                    Enter the topic to auto-generate questions, rubric, and recommended marks for the chosen class:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Quadratic Equations, Newton Laws, Java OOP..."
                      value={aiTopicInput}
                      onChange={(e) => setAiTopicInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                    />
                    <button
                      type="button"
                      disabled={generatingAiWorksheet}
                      onClick={handleAutoGenerateAiWorksheet}
                      className="px-3 py-1.5 rounded-lg bg-[#0F2942] hover:bg-slate-900 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      {generatingAiWorksheet ? (
                        <>
                          <HiSparkles className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <HiSparkles className="w-3.5 h-3.5" />
                          <span>Generate</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-1.5">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 4 - Calculus & Integrals Worksheet"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field py-2.5 text-sm"
                />
              </div>

              {/* Class & Subject Selector with Teacher RBAC filtering */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-1.5">
                    Assigned Class *
                  </label>
                  <select
                    required
                    value={formData.classId}
                    onChange={(e) => {
                      const newClassId = e.target.value
                      let newSubjectId = ''
                      if (isTeacher && newClassId) {
                        const subs = teacherClassAssignments
                          .filter(item => item.schoolClass?.id === parseInt(newClassId))
                          .map(item => item.subject)
                          .filter(Boolean)
                        if (subs.length === 1) {
                          newSubjectId = subs[0].id.toString()
                        }
                      }
                      setFormData({ ...formData, classId: newClassId, subjectId: newSubjectId })
                    }}
                    className="input-field py-2 text-sm"
                  >
                    <option value="">-- Choose Class --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} - Section {c.section}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-1.5">
                    Subject *
                  </label>
                  <select
                    required
                    disabled={!formData.classId}
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="input-field py-2 text-sm disabled:opacity-50"
                  >
                    <option value="">-- Choose Subject --</option>
                    {availableSubjectsForSelectedClass().map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code || 'SUB'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-1.5">
                    Submission Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="input-field py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-1.5">
                    Max Marks *
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="1000"
                    required
                    value={formData.maxMarks}
                    onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
                    className="input-field py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-1.5">
                  Detailed Instructions & Guidelines
                </label>
                <textarea
                  rows="3"
                  placeholder="Outline questions, problem references, neatness expectations, or guidelines..."
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="input-field py-2 text-sm"
                />
              </div>

              {/* Upload Worksheet / Question Paper (PDF or Photo) */}
              <div>
                <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-1.5">
                  Attach Question Paper / Worksheet (PDF or Photo)
                </label>
                <div className="border-2 border-dashed border-amber-300 rounded-2xl p-4 text-center hover:bg-amber-50/40 transition-colors relative">
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="teacher-file-upload"
                  />
                  <label htmlFor="teacher-file-upload" className="cursor-pointer flex flex-col items-center">
                    <HiArrowUpTray className="w-8 h-8 text-amber-600 mb-1.5" />
                    <span className="text-sm font-bold text-slate-900">
                      {selectedFile ? selectedFile.name : 'Click to select PDF document or Photo'}
                    </span>
                    <span className="text-xs text-slate-500 mt-0.5">
                      Supports PDF, PNG, JPG (up to 25MB). Students will be able to view and download this file.
                    </span>
                  </label>

                  {filePreview && (
                    <div className="mt-3 p-2 bg-white rounded-xl border border-surface-200 inline-block">
                      <img src={filePreview} alt="Preview" className="max-h-32 rounded-lg object-contain mx-auto" />
                    </div>
                  )}

                  {selectedFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null)
                        setFilePreview(null)
                      }}
                      className="mt-2 text-xs text-rose-600 font-bold hover:underline"
                    >
                      Remove Attachment
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary flex-1 py-2.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex-1 py-2.5 font-bold flex items-center justify-center gap-2"
                >
                  {submitting ? 'Publishing...' : 'Publish to Students'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBMIT / RESUBMIT ASSIGNMENT MODAL (STUDENTS) */}
      {/* ========================================================================= */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="card-glass w-full max-w-md bg-white p-6 sm:p-7 rounded-3xl shadow-2xl relative border border-surface-200">
            <button
              onClick={() => {
                setShowSubmitModal(null)
                setSelectedFile(null)
                setFilePreview(null)
                setMessage('')
              }}
              className="absolute top-5 right-5 p-1.5 rounded-full text-surface-400 hover:text-surface-900 hover:bg-surface-100 transition-colors"
            >
              <HiXMark className="w-6 h-6" />
            </button>

            {/* Modal Title */}
            <div className="flex items-center gap-2 mb-1">
              <span className={`p-2 rounded-2xl text-white font-bold ${
                submissions[showSubmitModal.id]?.status === 'NEEDS_RESUBMISSION'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}>
                <HiArrowUpTray className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-xl font-display font-extrabold text-surface-900">
                  {submissions[showSubmitModal.id]?.status === 'NEEDS_RESUBMISSION'
                    ? 'Upload Revised Work'
                    : 'Upload Completed Work'}
                </h3>
                <p className="text-xs text-surface-500">{showSubmitModal.title}</p>
              </div>
            </div>

            {/* If Resubmission: Highlight Teacher Remarks */}
            {submissions[showSubmitModal.id]?.status === 'NEEDS_RESUBMISSION' && submissions[showSubmitModal.id]?.feedback && (
              <div className="my-3 p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-1">
                <span className="font-extrabold flex items-center gap-1 text-amber-900 uppercase">
                  <HiExclamationTriangle className="w-4 h-4 text-amber-600" />
                  Teacher's Resubmission Remarks:
                </span>
                <p className="italic bg-white p-2 rounded-xl border border-amber-200 font-medium text-slate-800">
                  "{submissions[showSubmitModal.id].feedback}"
                </p>
              </div>
            )}

            {message && (
              <div className="my-4 p-3 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
                <HiCheckBadge className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            <form onSubmit={handleSubmitAssignment} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-1.5">
                  Select Completed Solution File (PDF or Photo) *
                </label>
                <div className="border-2 border-dashed border-emerald-300 rounded-2xl p-6 text-center hover:bg-emerald-50/40 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    required
                    onChange={handleFileSelect}
                    className="hidden"
                    id="student-file-upload"
                  />
                  <label htmlFor="student-file-upload" className="cursor-pointer flex flex-col items-center">
                    <HiArrowUpTray className="w-10 h-10 text-emerald-600 mb-2" />
                    <span className="text-sm font-bold text-slate-900">
                      {selectedFile ? selectedFile.name : 'Tap to browse or drop file here'}
                    </span>
                    <span className="text-xs text-slate-500 mt-1">
                      Upload clear photo of your handwritten work or scanned PDF (Max 25MB)
                    </span>
                  </label>

                  {filePreview && (
                    <div className="mt-3 p-2 bg-white rounded-xl border border-surface-200 inline-block">
                      <img src={filePreview} alt="Preview" className="max-h-40 rounded-lg object-contain mx-auto" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSubmitModal(null)
                    setSelectedFile(null)
                    setFilePreview(null)
                    setMessage('')
                  }}
                  className="btn-secondary flex-1 py-2.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedFile}
                  className="btn-primary flex-1 py-2.5 font-bold flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500"
                >
                  {submitting ? 'Uploading Work...' : 'Turn In Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TEACHER SUBMISSIONS & GRADING MODAL (INDIVIDUAL DETAIL VIEW) */}
      {/* ========================================================================= */}
      {viewSubmissionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="card-glass w-full max-w-4xl bg-white p-6 sm:p-8 rounded-3xl shadow-2xl relative border border-surface-200 max-h-[90vh] flex flex-col">
            <button
              onClick={() => setViewSubmissionsModal(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-surface-400 hover:text-surface-900 hover:bg-surface-100 transition-colors"
            >
              <HiXMark className="w-6 h-6" />
            </button>

            {/* Modal Header */}
            <div className="mb-4 pb-4 border-b border-surface-100 pr-10">
              <span className="px-2.5 py-0.5 rounded-lg bg-accent-100 text-accent-800 text-xs font-bold uppercase">
                {viewSubmissionsModal.schoolClass?.name} - {viewSubmissionsModal.schoolClass?.section} • {viewSubmissionsModal.subject?.name}
              </span>
              <h3 className="text-2xl font-display font-extrabold text-surface-900 mt-1">
                Student Submissions & Evaluation
              </h3>
              <p className="text-sm text-surface-500">
                Assignment: <strong>{viewSubmissionsModal.title}</strong> (Total Marks: {viewSubmissionsModal.maxMarks})
              </p>
            </div>

            {/* Submissions List */}
            <div className="overflow-y-auto flex-1 pr-2 space-y-4">
              {loadingSubmissions ? (
                <div className="py-12 text-center text-surface-400 animate-pulse font-medium">
                  Loading student submissions...
                </div>
              ) : teacherSubmissions.length === 0 ? (
                <div className="text-center py-12 card p-6 bg-surface-50 rounded-2xl border border-dashed border-surface-200">
                  <HiDocumentText className="w-12 h-12 text-surface-300 mx-auto mb-2" />
                  <p className="text-surface-700 font-bold text-sm">No Student Submissions Yet</p>
                  <p className="text-surface-500 text-xs mt-0.5">
                    Students from this class have not turned in any work for this assignment so far.
                  </p>
                </div>
              ) : (
                teacherSubmissions.map((sub) => {
                  const studentName = sub.student?.fullName || sub.student?.user?.fullName || 'Student'
                  const admissionNo = sub.student?.admissionNumber || 'ADM'
                  const currentGrade = gradingState[sub.id] || {}

                  return (
                    <div
                      key={sub.id}
                      className="p-5 border border-surface-200 rounded-2xl bg-white hover:border-surface-300 transition-all shadow-sm space-y-3"
                    >
                      {/* Student info & File trigger */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-display font-bold text-surface-900 text-base">
                              {studentName}
                            </h4>
                            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono font-semibold">
                              {admissionNo}
                            </span>
                          </div>
                          <p className="text-xs text-surface-500 mt-0.5 flex items-center gap-2">
                            <span>Turned in: {sub.submissionDate || 'Recently'}</span>
                            <span>•</span>
                            <span className={`font-bold ${
                              sub.status === 'APPROVED' || sub.status === 'GRADED'
                                ? 'text-emerald-600'
                                : sub.status === 'NEEDS_RESUBMISSION'
                                ? 'text-amber-600'
                                : 'text-blue-600'
                            }`}>
                              Status: {sub.status || 'SUBMITTED'}
                            </span>
                          </p>
                        </div>

                        {/* View Attached File Button */}
                        {sub.fileUrl && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => openFilePreview(sub.fileUrl, `${studentName}'s Submission`, viewSubmissionsModal)}
                              className="px-3.5 py-1.5 rounded-xl bg-accent-50 text-accent-800 border border-accent-200 hover:bg-accent-100 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                            >
                              <HiEye className="w-4 h-4" />
                              <span>View Solution</span>
                            </button>
                            <a
                              href={sub.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-xl bg-surface-100 text-surface-600 hover:text-accent-700 hover:bg-accent-50 border border-surface-200 transition-colors"
                              title="Open PDF directly in new tab"
                            >
                              <HiArrowTopRightOnSquare className="w-4 h-4" />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Grading Form Bar */}
                      <div className="p-3.5 bg-surface-50/80 rounded-xl border border-surface-200/60 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        {/* Marks Allotted */}
                        <div className="sm:col-span-3">
                          <label className="block text-[11px] font-bold text-surface-600 uppercase mb-1">
                            Marks Allotted (Max {viewSubmissionsModal.maxMarks})
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={viewSubmissionsModal.maxMarks}
                            placeholder="e.g. 95"
                            value={currentGrade.marks !== undefined ? currentGrade.marks : ''}
                            onChange={(e) =>
                              setGradingState(prev => ({
                                ...prev,
                                [sub.id]: { ...prev[sub.id], marks: e.target.value }
                              }))
                            }
                            className={`input-field py-1.5 px-3 text-sm w-full ${
                              currentGrade.marks !== '' && currentGrade.marks !== undefined && (parseInt(currentGrade.marks, 10) < 0 || parseInt(currentGrade.marks, 10) > viewSubmissionsModal.maxMarks)
                                ? 'border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-400'
                                : ''
                            }`}
                          />
                          {currentGrade.marks !== '' && currentGrade.marks !== undefined && (parseInt(currentGrade.marks, 10) < 0 || parseInt(currentGrade.marks, 10) > viewSubmissionsModal.maxMarks) && (
                            <p className="text-[10px] text-rose-600 font-bold mt-1">⚠️ Range: 0 to {viewSubmissionsModal.maxMarks}</p>
                          )}
                        </div>

                        {/* Status dropdown */}
                        <div className="sm:col-span-3">
                          <label className="block text-[11px] font-bold text-surface-600 uppercase mb-1">
                            Evaluation Status
                          </label>
                          <select
                            value={currentGrade.status || 'APPROVED'}
                            onChange={(e) =>
                              setGradingState(prev => ({
                                ...prev,
                                [sub.id]: { ...prev[sub.id], status: e.target.value }
                              }))
                            }
                            className="input-field py-1.5 px-3 text-sm w-full"
                          >
                            <option value="APPROVED">APPROVED ✓</option>
                            <option value="GRADED">GRADED</option>
                            <option value="NEEDS_RESUBMISSION">NEEDS RESUBMISSION ⚠️</option>
                            <option value="SUBMITTED">SUBMITTED (Pending)</option>
                          </select>
                        </div>

                        {/* Feedback / Remarks textarea */}
                        <div className="sm:col-span-4">
                          <label className="block text-[11px] font-bold text-surface-600 uppercase mb-1">
                            {currentGrade.status === 'NEEDS_RESUBMISSION'
                              ? 'Resubmission Instructions / Remarks *'
                              : 'Teacher Feedback / Remarks'}
                          </label>
                          <input
                            type="text"
                            placeholder={
                              currentGrade.status === 'NEEDS_RESUBMISSION'
                                ? 'State required corrections (e.g. Redo question 3 with steps)...'
                                : 'e.g. Well done! Detailed calculations.'
                            }
                            value={currentGrade.feedback || ''}
                            onChange={(e) =>
                              setGradingState(prev => ({
                                ...prev,
                                [sub.id]: { ...prev[sub.id], feedback: e.target.value }
                              }))
                            }
                            className={`input-field py-1.5 px-3 text-sm w-full ${
                              currentGrade.status === 'NEEDS_RESUBMISSION' ? 'border-amber-400 bg-amber-50/20' : ''
                            }`}
                          />
                        </div>

                        {/* Save Button */}
                        <div className="sm:col-span-2">
                          <button
                            type="button"
                            onClick={() => handleSaveGrade(sub.id)}
                            disabled={currentGrade.saving}
                            className={`w-full py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm ${
                              currentGrade.saved
                                ? 'bg-emerald-600 text-white'
                                : currentGrade.status === 'NEEDS_RESUBMISSION'
                                ? 'bg-amber-600 text-slate-950 hover:bg-amber-500'
                                : 'bg-[#0F2942] text-amber-400 hover:bg-slate-900'
                            }`}
                          >
                            {currentGrade.saving ? (
                              'Saving...'
                            ) : currentGrade.saved ? (
                              <>
                                <HiCheckCircle className="w-4 h-4" />
                                Saved!
                              </>
                            ) : currentGrade.status === 'NEEDS_RESUBMISSION' ? (
                              'Request Resubmit'
                            ) : (
                              'Allot Marks'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MEDIA PREVIEW MODAL (PHOTO / PDF VIEWER) */}
      {/* ========================================================================= */}
      {previewMediaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 animate-fade-in">
          <div className="card-glass w-full max-w-5xl bg-white p-4 sm:p-6 rounded-3xl shadow-2xl relative border border-surface-200 max-h-[94vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between pb-3 mb-3 border-b border-surface-200 gap-2">
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider">
                    {previewMediaModal.type === 'image' ? 'Image Attachment' : 'Official Evaluated Solution'}
                  </span>
                  <span className="text-xs text-surface-400">•</span>
                  <span className="text-xs text-surface-500 font-medium">Apex International Academy</span>
                </div>
                <h4 className="font-display font-bold text-surface-900 text-base sm:text-lg truncate mt-0.5">
                  {previewMediaModal.title}
                </h4>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2">
                {previewMediaModal.type === 'pdf' && (
                  <div className="flex items-center bg-surface-100 p-0.5 rounded-xl border border-surface-200 mr-1 text-xs">
                    <button
                      onClick={() => setPdfViewTab('dossier')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all ${
                        pdfViewTab === 'dossier'
                          ? 'bg-white text-surface-900 shadow-sm'
                          : 'text-surface-600 hover:text-surface-900'
                      }`}
                    >
                      Interactive Dossier
                    </button>
                    <button
                      onClick={() => setPdfViewTab('frame')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all ${
                        pdfViewTab === 'frame'
                          ? 'bg-white text-surface-900 shadow-sm'
                          : 'text-surface-600 hover:text-surface-900'
                      }`}
                    >
                      PDF Frame
                    </button>
                  </div>
                )}

                <a
                  href={previewMediaModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                  title="Open full PDF directly in a new browser tab"
                >
                  <HiArrowTopRightOnSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Open in Tab</span>
                </a>

                <a
                  href={previewMediaModal.url}
                  download
                  className="px-3 py-1.5 rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Download PDF to computer"
                >
                  <HiArrowDownTray className="w-4 h-4" />
                  <span className="hidden sm:inline">Download</span>
                </a>

                <button
                  onClick={() => setPreviewMediaModal(null)}
                  className="p-1.5 rounded-full text-surface-400 hover:text-surface-900 hover:bg-surface-100 transition-colors"
                  title="Close"
                >
                  <HiXMark className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto bg-slate-900/5 rounded-2xl p-2 sm:p-4 min-h-[400px]">
              {previewMediaModal.type === 'image' ? (
                <div className="flex items-center justify-center min-h-[300px]">
                  <img
                    src={previewMediaModal.url}
                    alt={previewMediaModal.title}
                    className="max-h-[72vh] w-auto object-contain rounded-xl shadow-md"
                  />
                </div>
              ) : pdfViewTab === 'frame' ? (
                <div className="w-full h-[72vh] flex flex-col bg-white rounded-xl shadow-inner border border-surface-200 overflow-hidden">
                  <iframe
                    src={previewMediaModal.url}
                    title={previewMediaModal.title}
                    className="w-full h-full border-0"
                  />
                </div>
              ) : (
                /* Interactive Dossier View */
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-surface-200 max-w-4xl mx-auto space-y-6 text-surface-800">
                  {/* Header Banner */}
                  <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 text-xs font-extrabold tracking-widest uppercase">
                          Apex International Academy
                        </span>
                        <span className="text-white/40">•</span>
                        <span className="text-white/80 text-xs">CBSE Affiliation No. 1130492</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold font-display text-white mt-1">
                        {previewMediaModal.solutionData?.title || previewMediaModal.title}
                      </h3>
                      <p className="text-xs text-white/70 mt-0.5">
                        Official Academic Assessment Dossier & Solution Key
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-center">
                        <p className="text-[10px] uppercase font-bold text-white/70">Evaluation</p>
                        <p className="text-lg font-black text-amber-300">
                          {previewMediaModal.solutionData?.score || 88} / {previewMediaModal.solutionData?.maxMarks || 100}
                        </p>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                        <HiCheckBadge className="w-4 h-4 text-emerald-400" />
                        <span>VERIFIED & GRADED</span>
                      </div>
                    </div>
                  </div>

                  {/* Directive Box */}
                  <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs sm:text-sm">
                    <span className="font-bold text-amber-900 uppercase tracking-wide">Directive & Instructions: </span>
                    {previewMediaModal.solutionData?.instructions ||
                      'Complete all analytical components, systematic findings, and structured diagrams according to curriculum guidelines.'}
                  </div>

                  {/* Section 1: Executive Overview */}
                  <div className="space-y-2">
                    <h5 className="font-display font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2 border-b border-surface-200 pb-1">
                      <span className="w-2 h-2 rounded-full bg-primary-600"></span>
                      Section 1: Executive Overview & Problem Context
                    </h5>
                    <p className="text-surface-700 text-sm leading-relaxed">
                      {previewMediaModal.solutionData?.overview ||
                        'This submission presents an extensive, rigorous academic breakdown demonstrating comprehensive mastery over key concepts, empirical working, and structured methodology.'}
                    </p>
                  </div>

                  {/* Section 2: Core Analysis */}
                  {previewMediaModal.solutionData?.corePoints && (
                    <div className="space-y-3">
                      <h5 className="font-display font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2 border-b border-surface-200 pb-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        Section 2: Core Analysis, Solutions & Systematic Working
                      </h5>
                      <div className="grid grid-cols-1 gap-3">
                        {previewMediaModal.solutionData.corePoints.map((pt, pIdx) => (
                          <div key={pIdx} className="p-3.5 rounded-xl bg-surface-50 border border-surface-200/80 space-y-1">
                            <h6 className="font-bold text-surface-900 text-xs sm:text-sm">
                              {pIdx + 1}. {pt.title}
                            </h6>
                            <p className="text-surface-600 text-xs sm:text-sm leading-relaxed">
                              {pt.body}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section 3: Data Table */}
                  {previewMediaModal.solutionData?.table && (
                    <div className="space-y-2">
                      <h5 className="font-display font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2 border-b border-surface-200 pb-1">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        Section 3: Detailed Data Matrix & Systematic Findings
                      </h5>
                      <div className="overflow-x-auto rounded-xl border border-surface-200">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-surface-100 text-surface-700 font-bold uppercase text-[10px]">
                            <tr>
                              {previewMediaModal.solutionData.table.headers.map((h, hIdx) => (
                                <th key={hIdx} className="py-2.5 px-3 border-r border-surface-200 last:border-r-0">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-surface-100">
                            {previewMediaModal.solutionData.table.rows.map((r, rIdx) => (
                              <tr key={rIdx} className="hover:bg-surface-50">
                                {r.map((c, cIdx) => (
                                  <td key={cIdx} className="py-2 px-3 border-r border-surface-200 last:border-r-0 text-surface-700 font-medium">
                                    {c}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Section 4: Conclusion */}
                  {previewMediaModal.solutionData?.conclusion && (
                    <div className="space-y-2">
                      <h5 className="font-display font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2 border-b border-surface-200 pb-1">
                        <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                        Section 4: Student Conclusions & Reflective Synthesis
                      </h5>
                      <p className="text-surface-700 text-sm leading-relaxed bg-surface-50 p-3.5 rounded-xl border border-surface-200">
                        {previewMediaModal.solutionData.conclusion}
                      </p>
                    </div>
                  )}

                  {/* Section 5: Faculty Evaluation & Rubric */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-300 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="font-display font-bold text-emerald-950 text-sm uppercase tracking-wider flex items-center gap-1.5">
                        <HiCheckCircle className="w-4 h-4 text-emerald-600" />
                        Official Faculty Evaluation & Rubric
                      </h5>
                      <span className="text-xs font-bold text-emerald-800">
                        STATUS: VERIFIED
                      </span>
                    </div>
                    <p className="text-xs text-emerald-900 italic leading-relaxed">
                      "{previewMediaModal.solutionData?.feedback ||
                        'Outstanding analytical depth & presentation! Solutions are thorough, clear, and accurately presented.'}"
                    </p>
                    <div className="pt-2 border-t border-emerald-200/80 flex flex-wrap items-center justify-between text-[11px] text-emerald-800">
                      <span>Evaluation Division: Department of Academic Quality</span>
                      <span className="font-bold">Apex International Academy Assessment Cell</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
