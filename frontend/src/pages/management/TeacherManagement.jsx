import { useState, useEffect } from 'react'
import api from '../../api/axiosConfig'
import {
  HiAcademicCap, HiPlus, HiXMark, HiBriefcase, HiEnvelope,
  HiPhone, HiUserPlus, HiKey, HiTrash, HiCheckBadge, HiShieldCheck,
  HiTableCells, HiUserGroup, HiSparkles, HiCheckCircle, HiExclamationTriangle,
  HiMagnifyingGlass, HiArrowPath, HiAdjustmentsHorizontal, HiCheck,
  HiPencilSquare, HiEye, HiArrowsUpDown
} from 'react-icons/hi2'

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [assignments, setAssignments] = useState([])
  const [classCurriculum, setClassCurriculum] = useState([])
  const [loading, setLoading] = useState(true)

  // Navigation Tabs: 'mapping' (Class-wise Mapping) | 'teachers' (Faculty Directory) | 'matrix' (Master Matrix)
  const [activeTab, setActiveTab] = useState('mapping')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Master Matrix Customization & Flexibility State
  const [matrixViewMode, setMatrixViewMode] = useState('active-only') // 'active-only' | 'full-grid'
  const [gradeFilter, setGradeFilter] = useState('ALL') // 'ALL' | 'PRIMARY' | 'MIDDLE' | 'SECONDARY' | 'SENIOR'
  const [matrixSearch, setMatrixSearch] = useState('')
  const [showAllSubjectsInTab1, setShowAllSubjectsInTab1] = useState(false)

  // Cell Inline Allocation Modal
  const [cellModal, setCellModal] = useState({
    open: false,
    classId: null,
    className: '',
    section: '',
    subjectId: null,
    subjectName: '',
    subjectCode: '',
    isOffered: true,
    teacherIds: []
  })

  // Teacher Subject Filter for Tab 2 (Faculty Directory)
  const [teacherSubjectFilter, setTeacherSubjectFilter] = useState('ALL')

  // Class Curriculum Batch Customizer Modal
  const [curriculumModal, setCurriculumModal] = useState({
    open: false,
    classId: null,
    className: '',
    section: '',
    selectedSubjectIds: []
  })

  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showCredModal, setShowCredModal] = useState(false)

  const [selectedTeacher, setSelectedTeacher] = useState(null)
  const [modalClassId, setModalClassId] = useState('')
  const [modalSubjectId, setModalSubjectId] = useState('')
  const [message, setMessage] = useState(null) // { type: 'success'|'error', text: '' }
  const [submitting, setSubmitting] = useState(false)

  // Teacher Registration Form
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    employeeId: '',
    phone: '',
    email: '',
    qualification: ''
  })

  // Credentials Edit Form
  const [credData, setCredData] = useState({
    userId: null,
    username: '',
    password: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [tRes, cRes, sRes, aRes, curRes] = await Promise.all([
        api.get('/admin/teachers'),
        api.get('/admin/classes'),
        api.get('/admin/subjects'),
        api.get('/admin/teacher-assignments'),
        api.get('/admin/class-curriculum')
      ])
      setTeachers(tRes.data || [])
      setClasses(cRes.data || [])
      setSubjects(sRes.data || [])
      setAssignments(aRes.data || [])
      setClassCurriculum(curRes.data || [])
      if (!selectedClassId && cRes.data?.length > 0) {
        setSelectedClassId(String(cRes.data[0].id))
      }
    } catch (error) {
      console.error('Failed to fetch teacher management data:', error)
    } finally {
      setLoading(false)
    }
  }

  // 1-Click Quick Assignment directly from Table row
  const handleQuickAssign = async (classId, subjectId, teacherId) => {
    if (!teacherId) return
    setSubmitting(true)
    setMessage(null)
    try {
      const teacherObj = teachers.find(t => String(t.id) === String(teacherId))
      const subjectObj = subjects.find(s => String(s.id) === String(subjectId))
      const classObj = classes.find(c => String(c.id) === String(classId))

      await api.post('/admin/assign-teacher', {
        teacherId: parseInt(teacherId),
        classId: parseInt(classId),
        subjectId: parseInt(subjectId),
        academicYear: '2025-2026'
      })

      setMessage({
        type: 'success',
        text: `Assigned ${teacherObj?.fullName || 'Teacher'} to teach ${subjectObj?.name || 'Subject'} in ${classObj?.name} (${classObj?.section})`
      })
      setTimeout(() => setMessage(null), 3500)
      await fetchData()
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update teacher mapping'
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Unassign a specific teacher from class & subject (or all if teacherId is null)
  const handleUnassignTeacher = async (classId, subjectId, teacherId, teacherName, subjectName) => {
    const confirmText = teacherId 
      ? `Are you sure you want to unassign ${teacherName} from teaching ${subjectName}?`
      : `Are you sure you want to unassign all teachers from teaching ${subjectName}?`
    if (!confirm(confirmText)) return
    setSubmitting(true)
    setMessage(null)
    try {
      await api.post('/admin/unassign-teacher', {
        classId: parseInt(classId),
        subjectId: parseInt(subjectId),
        teacherId: teacherId ? parseInt(teacherId) : null,
        academicYear: '2025-2026'
      })
      setMessage({ type: 'success', text: `Unassigned ${teacherName || 'faculty'} from ${subjectName} successfully` })
      setTimeout(() => setMessage(null), 3000)
      await fetchData()
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to unassign teacher' })
    } finally {
      setSubmitting(false)
    }
  }

  // Delete Grade / Class Option
  const handleDeleteClass = async (classObj) => {
    if (!classObj) return
    const confirmed = window.confirm(
      `Are you sure you want to delete Grade/Class "${classObj.name} (${classObj.section})"?\n\nThis will remove all associated curriculum configurations and faculty assignments.`
    )
    if (!confirmed) return

    setSubmitting(true)
    setMessage(null)
    try {
      const res = await api.delete(`/admin/classes/${classObj.id}`)
      setMessage({
        type: 'success',
        text: res.data.message || `Grade/Class ${classObj.name} (${classObj.section}) deleted successfully.`
      })
      setTimeout(() => setMessage(null), 4000)

      const remainingClasses = classes.filter(c => c.id !== classObj.id)
      if (String(selectedClassId) === String(classObj.id)) {
        setSelectedClassId(remainingClasses[0] ? String(remainingClasses[0].id) : '')
      }
      await fetchData()
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to delete grade/class. Please check if active students are enrolled.'
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Helper: Get all teachers who are assigned to teach a specific subject across the school
  const getTeachersAssignedToSubject = (subjectId) => {
    if (!subjectId) return []
    const subId = Number(subjectId)
    const assignedTeacherIds = new Set(
      assignments.filter(a => a.subject?.id === subId && a.teacher?.id).map(a => a.teacher.id)
    )
    return teachers.filter(t => assignedTeacherIds.has(t.id))
  }

  // Check if a subject is part of a class curriculum
  const isSubjectInClassCurriculum = (classId, subjectId) => {
    const entry = classCurriculum.find(
      c => c.schoolClass?.id === Number(classId) && c.subject?.id === Number(subjectId)
    )
    if (entry) return entry.isOffered !== false

    // Fallback: If an explicit assignment exists for this class and subject, it's offered
    const hasAssign = assignments.some(
      a => a.schoolClass?.id === Number(classId) && a.subject?.id === Number(subjectId)
    )
    return hasAssign
  }

  // Get list of offered curriculum subjects for a specific class
  const getOfferedSubjectsForClass = (classId) => {
    return subjects.filter(s => isSubjectInClassCurriculum(classId, s.id))
  }

  // Open inline cell allocation modal
  const openCellModal = (cls, sub) => {
    const isOffered = isSubjectInClassCurriculum(cls.id, sub.id)
    const cellAssigns = assignments.filter(
      a => a.schoolClass?.id === cls.id && a.subject?.id === sub.id && a.teacher?.id
    )
    const currentTeacherIds = cellAssigns.map(a => a.teacher.id)

    setCellModal({
      open: true,
      classId: cls.id,
      className: cls.name,
      section: cls.section,
      subjectId: sub.id,
      subjectName: sub.name,
      subjectCode: sub.code,
      isOffered,
      teacherIds: currentTeacherIds
    })
  }

  // Save inline cell allocation (supports co-teaching with multiple teachers)
  const handleSaveCellAllocation = async (e) => {
    if (e) e.preventDefault()
    setSubmitting(true)
    setMessage(null)
    try {
      const res = await api.post('/admin/allocate-cell', {
        classId: Number(cellModal.classId),
        subjectId: Number(cellModal.subjectId),
        teacherIds: cellModal.teacherIds,
        isOffered: cellModal.isOffered,
        academicYear: '2025-2026'
      })
      setMessage({ type: 'success', text: res.data.message || 'Allocation updated successfully!' })
      setCellModal(prev => ({ ...prev, open: false }))
      await fetchData()
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save allocation' })
    } finally {
      setSubmitting(false)
    }
  }

  // Toggle quick curriculum inclusion from grid
  const handleToggleCurriculumQuick = async (classId, subjectId, newOffered) => {
    setSubmitting(true)
    setMessage(null)
    try {
      const res = await api.post('/admin/class-curriculum/toggle', {
        classId: Number(classId),
        subjectId: Number(subjectId),
        isOffered: newOffered,
        academicYear: '2025-2026'
      })
      setMessage({ type: 'success', text: res.data.message })
      await fetchData()
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update curriculum' })
    } finally {
      setSubmitting(false)
    }
  }

  // Open Class Curriculum Batch Customizer
  const openCurriculumCustomizer = (cls) => {
    const activeSubIds = subjects
      .filter(s => isSubjectInClassCurriculum(cls.id, s.id))
      .map(s => s.id)

    setCurriculumModal({
      open: true,
      classId: cls.id,
      className: cls.name,
      section: cls.section,
      selectedSubjectIds: activeSubIds
    })
  }

  // Save Class Curriculum Batch Customizer
  const handleSaveBatchCurriculum = async () => {
    setSubmitting(true)
    setMessage(null)
    try {
      for (const sub of subjects) {
        const shouldBeOffered = curriculumModal.selectedSubjectIds.includes(sub.id)
        const currentlyOffered = isSubjectInClassCurriculum(curriculumModal.classId, sub.id)
        if (shouldBeOffered !== currentlyOffered) {
          await api.post('/admin/class-curriculum/toggle', {
            classId: Number(curriculumModal.classId),
            subjectId: Number(sub.id),
            isOffered: shouldBeOffered,
            academicYear: '2025-2026'
          })
        }
      }
      setMessage({ type: 'success', text: `Updated curriculum syllabus for ${curriculumModal.className} (${curriculumModal.section})` })
      setCurriculumModal(prev => ({ ...prev, open: false }))
      await fetchData()
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save class curriculum' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateTeacher = async (e) => {
    e.preventDefault()
    if (!formData.fullName || !formData.username || !formData.password || !formData.employeeId) return
    setSubmitting(true)
    setMessage(null)
    try {
      await api.post('/admin/teachers', formData)
      setMessage({ type: 'success', text: 'Teacher account registered with credentials!' })
      setTimeout(() => {
        setMessage(null)
        setShowAddModal(false)
        setFormData({
          fullName: '',
          username: '',
          password: '',
          employeeId: '',
          phone: '',
          email: '',
          qualification: ''
        })
        fetchData()
      }, 1500)
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to add teacher' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleAssignSubmit = async (e) => {
    e.preventDefault()
    if (!selectedTeacher || !modalClassId || !modalSubjectId) return
    setSubmitting(true)
    setMessage(null)
    try {
      await api.post('/admin/assign-teacher', {
        teacherId: selectedTeacher.id,
        classId: parseInt(modalClassId),
        subjectId: parseInt(modalSubjectId),
        academicYear: '2025-2026'
      })
      setMessage({ type: 'success', text: 'Teacher assigned to class & subject!' })
      setTimeout(() => {
        setMessage(null)
        setShowAssignModal(false)
        setSelectedTeacher(null)
        fetchData()
      }, 1500)
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to assign teacher' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoveAssignment = async (assignmentId) => {
    if (!confirm('Remove this subject assignment?')) return
    try {
      await api.delete(`/admin/assign-teacher/${assignmentId}`)
      fetchData()
    } catch (error) {
      alert('Failed to remove assignment')
    }
  }

  const handleUpdateCredentials = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)
    try {
      await api.put(`/admin/users/${credData.userId}/credentials`, {
        username: credData.username,
        password: credData.password
      })
      setMessage({ type: 'success', text: 'Credentials updated successfully!' })
      setTimeout(() => {
        setMessage(null)
        setShowCredModal(false)
        fetchData()
      }, 1500)
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update credentials' })
    } finally {
      setSubmitting(false)
    }
  }

  // Helper to categorize classes into grades
  const getClassGradeCategory = (className = '') => {
    const match = className.match(/\d+/)
    if (!match) return 'OTHER'
    const gradeNum = parseInt(match[0], 10)
    if (gradeNum >= 1 && gradeNum <= 5) return 'PRIMARY'
    if (gradeNum >= 6 && gradeNum <= 8) return 'MIDDLE'
    if (gradeNum >= 9 && gradeNum <= 10) return 'SECONDARY'
    if (gradeNum >= 11 && gradeNum <= 12) return 'SENIOR'
    return 'OTHER'
  }

  // Active Class for mapping
  const currentClass = classes.find(c => String(c.id) === String(selectedClassId)) || classes[0]
  const currentClassAssignments = currentClass ? assignments.filter(a => a.schoolClass?.id === currentClass.id) : []

  // Class-specific offered curriculum subjects
  const offeredCurriculumSubjects = currentClass ? getOfferedSubjectsForClass(currentClass.id) : subjects
  const tab1SubjectList = showAllSubjectsInTab1 ? subjects : offeredCurriculumSubjects

  // Coverage statistics for selected class (based on its actual curriculum)
  const totalCurriculumSubjects = offeredCurriculumSubjects.length
  const assignedSubjectsCount = offeredCurriculumSubjects.filter(s => 
    currentClassAssignments.some(a => a.subject?.id === s.id)
  ).length
  const unassignedSubjectsCount = Math.max(0, totalCurriculumSubjects - assignedSubjectsCount)
  const coveragePercent = totalCurriculumSubjects > 0 ? Math.round((assignedSubjectsCount / totalCurriculumSubjects) * 100) : 0

  // Filtered classes for Master Matrix
  const matrixFilteredClasses = classes.filter(cls => {
    if (gradeFilter !== 'ALL') {
      const cat = getClassGradeCategory(cls.name)
      if (cat !== gradeFilter) return false
    }
    if (matrixSearch.trim()) {
      const q = matrixSearch.toLowerCase()
      const matchesClass = cls.name?.toLowerCase().includes(q) || cls.section?.toLowerCase().includes(q)
      const matchesTeacher = cls.classTeacher?.fullName?.toLowerCase().includes(q)
      return matchesClass || matchesTeacher
    }
    return true
  })

  return (
    <div className="animate-fade-in space-y-6">
      {/* ════ Header & Action Buttons ════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-[#0F2942]">Faculty & Curriculum Allocation</h1>
          <p className="text-slate-500 text-sm mt-1">
            Easily map teachers to their specific subjects and classes with complete curriculum visibility
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#0F2942] hover:bg-slate-900 text-amber-400 font-extrabold text-xs flex items-center gap-2 shadow-md transition-all"
          >
            <HiUserPlus className="w-5 h-5" />
            Add New Teacher Account
          </button>
        </div>
      </div>

      {/* ════ Global Feedback Banner ════ */}
      {message && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all shadow-sm ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border border-emerald-300' 
            : 'bg-rose-50 text-rose-900 border border-rose-300'
        }`}>
          {message.type === 'success' ? (
            <HiCheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <HiExclamationTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* ════ Top Navigation Tabs ════ */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('mapping')}
          className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'mapping'
              ? 'border-amber-500 text-[#0F2942]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HiSparkles className="w-4 h-4 text-amber-500" />
          <span>Class-Wise Subject Mapping Matrix</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-extrabold">
            Easy View
          </span>
        </button>

        <button
          onClick={() => setActiveTab('teachers')}
          className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'teachers'
              ? 'border-amber-500 text-[#0F2942]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HiUserGroup className="w-4 h-4" />
          <span>Faculty Directory & Login IDs ({teachers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'matrix'
              ? 'border-amber-500 text-[#0F2942]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HiTableCells className="w-4 h-4" />
          <span>Master School Matrix (All Classes)</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Loading curriculum mapping data...</p>
        </div>
      ) : (
        <>
          {/* ═══════════════════════════════════════════════════════════ */}
          {/* TAB 1: CLASS-WISE CURRICULUM & TEACHER MAPPING MATRIX      */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {/* TAB 1: CLASS-WISE CURRICULUM & TEACHER MAPPING MATRIX      */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'mapping' && (
            <div className="space-y-6 animate-fade-in">
              {/* Class Selection & Metric Bar */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <label className="block text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                      Select Target Class to View & Map Curriculum:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {classes.map(c => {
                        const isSelected = String(c.id) === String(selectedClassId)
                        const cOffered = getOfferedSubjectsForClass(c.id)
                        const cAssigns = assignments.filter(a => a.schoolClass?.id === c.id && isSubjectInClassCurriculum(c.id, a.subject?.id))
                        const isFull = cOffered.length > 0 && cAssigns.length >= cOffered.length

                        return (
                          <button
                            key={c.id}
                            onClick={() => setSelectedClassId(String(c.id))}
                            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all border ${
                              isSelected
                                ? 'bg-[#0F2942] text-amber-400 border-[#0F2942] shadow-sm'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            <span>{c.name} - Section {c.section}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              isSelected
                                ? 'bg-amber-400 text-slate-900'
                                : isFull
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}>
                              {cAssigns.length}/{cOffered.length}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Class Controls & Summary Metric Cards */}
                  {currentClass && (
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => openCurriculumCustomizer(currentClass)}
                        className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold text-xs flex items-center gap-2 shadow-sm transition-all"
                        title="Add or remove subjects taught in this class"
                      >
                        <HiAdjustmentsHorizontal className="w-4 h-4 text-slate-900" />
                        <span>Customize Syllabus</span>
                      </button>

                      <button
                        disabled={submitting}
                        onClick={() => handleDeleteClass(currentClass)}
                        className="px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-xs flex items-center gap-2 shadow-sm transition-all"
                        title={`Delete Grade/Class ${currentClass.name} (${currentClass.section})`}
                      >
                        <HiTrash className="w-4 h-4 text-rose-600" />
                        <span>Delete Grade</span>
                      </button>

                      <div className="px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-center min-w-[85px]">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Class Syllabus</span>
                        <span className="text-base font-black text-[#0F2942]">{totalCurriculumSubjects} Subjects</span>
                      </div>
                      <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-center min-w-[85px]">
                        <span className="text-[10px] uppercase font-bold text-emerald-700 block">Assigned</span>
                        <span className="text-base font-black text-emerald-800">{assignedSubjectsCount}</span>
                      </div>
                      <div className="px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-center min-w-[85px]">
                        <span className="text-[10px] uppercase font-bold text-amber-700 block">Unassigned</span>
                        <span className="text-base font-black text-amber-800">{unassignedSubjectsCount}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress Bar & Filter Toggle */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-bold gap-2">
                    <span className="text-slate-600">
                      Curriculum Allocation for <span className="text-[#0F2942]">{currentClass?.name} ({currentClass?.section})</span>:
                      <span className={`ml-2 ${coveragePercent === 100 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {coveragePercent}% Covered ({assignedSubjectsCount} of {totalCurriculumSubjects} Subjects Assigned)
                      </span>
                    </span>

                    <button
                      onClick={() => setShowAllSubjectsInTab1(!showAllSubjectsInTab1)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                        showAllSubjectsInTab1
                          ? 'bg-slate-200 text-slate-800 border-slate-300'
                          : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      <HiEye className="w-3.5 h-3.5" />
                      <span>{showAllSubjectsInTab1 ? 'Showing All School Subjects (including N/A)' : `Showing Only Active Syllabus (${offeredCurriculumSubjects.length})`}</span>
                    </button>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        coveragePercent === 100 ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${coveragePercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Curriculum Subjects Table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-[#0F2942] text-sm flex items-center gap-2">
                      <HiAcademicCap className="w-5 h-5 text-amber-500" />
                      Class Subject Allocation Sheet: {currentClass?.name} - Section {currentClass?.section}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Classes only display the subjects included in their curriculum syllabus. Use "Customize Syllabus" to modify.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-medium">
                      Class Teacher: <span className="font-bold text-[#0F2942]">{currentClass?.classTeacher?.fullName || 'Not Designated'}</span>
                    </span>
                    <button
                      onClick={() => openCurriculumCustomizer(currentClass)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <HiAdjustmentsHorizontal className="w-4 h-4 text-amber-600" />
                      Edit Syllabus
                    </button>
                  </div>
                </div>

                {tab1SubjectList.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-xl font-bold">
                      📚
                    </div>
                    <h4 className="font-extrabold text-[#0F2942] text-sm">No Subjects in This Class Curriculum</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      This class does not have any active subjects configured yet. Add subjects to define its syllabus.
                    </p>
                    <button
                      onClick={() => openCurriculumCustomizer(currentClass)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold text-xs shadow-sm inline-flex items-center gap-1.5"
                    >
                      <HiPlus className="w-4 h-4" />
                      Configure Class Syllabus Now
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-[#0F2942] text-white font-extrabold uppercase text-[11px]">
                        <tr>
                          <th className="p-4 w-12 text-center">#</th>
                          <th className="p-4">Subject Name & Code</th>
                          <th className="p-4">Curriculum Status</th>
                          <th className="p-4 min-w-[220px]">Currently Assigned Faculty</th>
                          <th className="p-4 min-w-[260px]">1-Click Quick Assign / Change</th>
                          <th className="p-4 text-center w-32">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-medium">
                        {tab1SubjectList.map((subject, idx) => {
                          const isOffered = isSubjectInClassCurriculum(currentClass.id, subject.id)
                          const subjectAssignments = currentClassAssignments.filter(a => a.subject?.id === subject.id && a.teacher?.id)
                          const assignedTeachers = subjectAssignments.map(a => a.teacher)
                          const subjectSpecialists = getTeachersAssignedToSubject(subject.id)
                          const otherTeachers = teachers.filter(t => !subjectSpecialists.some(st => st.id === t.id))

                          if (!isOffered) {
                            return (
                              <tr key={subject.id} className="bg-slate-50/60 opacity-70 hover:opacity-100 transition-opacity">
                                <td className="p-4 text-center font-bold text-slate-400">
                                  {idx + 1}
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-2.5">
                                    <span className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-600 font-mono font-bold text-[11px]">
                                      {subject.code || 'SUB'}
                                    </span>
                                    <div>
                                      <span className="font-extrabold text-slate-700 block text-[13px]">
                                        {subject.name}
                                      </span>
                                      <span className="text-[10px] text-slate-400 block">
                                        Not in {currentClass.name} Syllabus
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 text-slate-600 font-bold text-[11px]">
                                    — Excluded (N/A) —
                                  </span>
                                </td>
                                <td className="p-4 text-slate-400 italic text-xs">
                                  Not taught in this grade
                                </td>
                                <td className="p-4">
                                  <button
                                    disabled={submitting}
                                    onClick={() => handleToggleCurriculumQuick(currentClass.id, subject.id, true)}
                                    className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs flex items-center gap-1.5 transition-colors border border-amber-300"
                                  >
                                    <HiPlus className="w-3.5 h-3.5" />
                                    <span>Add to {currentClass.name} Syllabus</span>
                                  </button>
                                </td>
                                <td className="p-4 text-center text-slate-300">
                                  —
                                </td>
                              </tr>
                            )
                          }

                          return (
                            <tr 
                              key={subject.id} 
                              className={`transition-colors ${
                                assignedTeachers.length > 0 ? 'hover:bg-slate-50/80' : 'bg-amber-50/30 hover:bg-amber-50/60'
                              }`}
                            >
                              {/* Row # */}
                              <td className="p-4 text-center font-bold text-slate-400">
                                {idx + 1}
                              </td>

                              {/* Subject Info */}
                              <td className="p-4">
                                <div className="flex items-center gap-2.5">
                                  <span className="px-2.5 py-1 rounded-lg bg-[#0F2942] text-amber-400 font-mono font-bold text-[11px]">
                                    {subject.code || 'SUB'}
                                  </span>
                                  <div>
                                    <span className="font-extrabold text-[#0F2942] block text-[13px]">
                                      {subject.name}
                                    </span>
                                    <span className="text-[10px] text-emerald-700 font-bold block">
                                      Active Syllabus Subject
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Status */}
                              <td className="p-4">
                                {assignedTeachers.length > 1 ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[11px]">
                                    <HiCheckCircle className="w-4 h-4 text-emerald-600" />
                                    Co-Teaching ({assignedTeachers.length} Faculty)
                                  </span>
                                ) : assignedTeachers.length === 1 ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[11px]">
                                    <HiCheckCircle className="w-4 h-4 text-emerald-600" />
                                    Faculty Assigned
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[11px] animate-pulse">
                                    <HiExclamationTriangle className="w-4 h-4 text-amber-600" />
                                    Needs Teacher
                                  </span>
                                )}
                              </td>

                              {/* Currently Assigned Faculty (Supports Multiple Co-Teachers) */}
                              <td className="p-4">
                                {assignedTeachers.length > 0 ? (
                                  <div className="space-y-1.5">
                                    {subjectAssignments.map(a => {
                                      const teacher = a.teacher
                                      return (
                                        <div key={a.id || teacher.id} className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-slate-50 border border-slate-200">
                                          <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs flex-shrink-0">
                                              {teacher.fullName?.charAt(0) || 'T'}
                                            </div>
                                            <div className="min-w-0">
                                              <span className="font-extrabold text-slate-900 block text-xs truncate">
                                                {teacher.fullName}
                                              </span>
                                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                                                <span className="font-mono">ID: {teacher.employeeId || 'FAC'}</span>
                                                {teacher.qualification && (
                                                  <>
                                                    <span>•</span>
                                                    <span className="truncate">{teacher.qualification}</span>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                          <button
                                            disabled={submitting}
                                            onClick={() => handleUnassignTeacher(currentClass.id, subject.id, teacher.id, teacher.fullName, subject.name)}
                                            className="p-1 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 flex-shrink-0 transition-colors"
                                            title={`Unassign ${teacher.fullName} from ${subject.name}`}
                                          >
                                            <HiXMark className="w-4 h-4" />
                                          </button>
                                        </div>
                                      )
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-slate-400 italic text-xs">
                                    No teacher assigned to this subject yet
                                  </div>
                                )}
                              </td>

                              {/* 1-Click Dropdown Assign / Add Faculty (Grouped with Subject Specialists First) */}
                              <td className="p-4">
                                <div className="space-y-1">
                                  <select
                                    disabled={submitting}
                                    value=""
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        handleQuickAssign(currentClass.id, subject.id, e.target.value)
                                      }
                                    }}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs bg-slate-50 text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                                  >
                                    <option value="">
                                      {assignedTeachers.length > 0 
                                        ? `+ Add Co-Teacher to ${subject.name}...` 
                                        : `— Select Teacher to Assign —`}
                                    </option>
                                    {subjectSpecialists.length > 0 && (
                                      <optgroup label={`⭐ Faculty Assigned to ${subject.name} (${subjectSpecialists.length})`}>
                                        {subjectSpecialists.map(t => {
                                          const isAlready = assignedTeachers.some(at => at.id === t.id)
                                          return (
                                            <option key={t.id} value={t.id} disabled={isAlready}>
                                              {t.fullName} ({t.qualification || t.employeeId || 'Faculty'}) {isAlready ? '✓ (Assigned)' : ''}
                                            </option>
                                          )
                                        })}
                                      </optgroup>
                                    )}
                                    <optgroup label="All Other School Faculty">
                                      {otherTeachers.map(t => {
                                        const isAlready = assignedTeachers.some(at => at.id === t.id)
                                        return (
                                          <option key={t.id} value={t.id} disabled={isAlready}>
                                            {t.fullName} ({t.qualification || t.employeeId || 'Faculty'}) {isAlready ? '✓ (Assigned)' : ''}
                                          </option>
                                        )
                                      })}
                                    </optgroup>
                                  </select>
                                  {assignedTeachers.length > 0 && (
                                    <div className="text-[10px] text-slate-500 flex items-center justify-between px-1">
                                      <span>Two or more teachers can teach this subject</span>
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Actions */}
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  {assignedTeachers.length > 0 && (
                                    <button
                                      disabled={submitting}
                                      onClick={() => handleUnassignTeacher(currentClass.id, subject.id, null, 'All Faculty', subject.name)}
                                      className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] inline-flex items-center gap-1 transition-colors border border-rose-200"
                                      title="Unassign all faculty from this subject"
                                    >
                                      <HiTrash className="w-3.5 h-3.5" />
                                      Unassign
                                    </button>
                                  )}
                                  <button
                                    disabled={submitting}
                                    onClick={() => handleToggleCurriculumQuick(currentClass.id, subject.id, false)}
                                    className="px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] inline-flex items-center gap-1 transition-colors"
                                    title="Remove this subject from this class curriculum"
                                  >
                                    <HiXMark className="w-3 h-3" />
                                    Exclude
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* TAB 2: FACULTY DIRECTORY & LOGIN CREDENTIALS               */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'teachers' && (
            <div className="space-y-6 animate-fade-in">
              {/* Subject Filter Bar in Faculty Directory */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-extrabold uppercase text-[#0F2942] tracking-wider flex items-center gap-1.5">
                      <HiSparkles className="w-4 h-4 text-amber-500" />
                      Filter Faculty by Assigned Subject:
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Select a subject to show only teachers assigned to teach that subject (e.g. Maths shows only Maths teachers).
                    </p>
                  </div>
                  {teacherSubjectFilter !== 'ALL' && (
                    <button
                      onClick={() => setTeacherSubjectFilter('ALL')}
                      className="text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-xl border border-amber-200 transition-all self-start sm:self-auto"
                    >
                      Show All Teachers ({teachers.length})
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => setTeacherSubjectFilter('ALL')}
                    className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-all border ${
                      teacherSubjectFilter === 'ALL'
                        ? 'bg-[#0F2942] text-amber-400 border-[#0F2942] shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    All Faculty ({teachers.length})
                  </button>

                  {subjects.map(s => {
                    const assignedForSub = getTeachersAssignedToSubject(s.id)
                    const count = assignedForSub.length
                    const isSelected = String(teacherSubjectFilter) === String(s.id)

                    return (
                      <button
                        key={s.id}
                        onClick={() => setTeacherSubjectFilter(isSelected ? 'ALL' : String(s.id))}
                        className={`px-3.5 py-2 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 border ${
                          isSelected
                            ? 'bg-amber-500 text-slate-900 border-amber-600 shadow-sm'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span>{s.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          isSelected ? 'bg-slate-900 text-amber-400' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {count}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {teacherSubjectFilter !== 'ALL' && (
                  <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 flex items-center justify-between">
                    <span>
                      Active Filter: Showing only faculty assigned to <strong>{subjects.find(s => String(s.id) === String(teacherSubjectFilter))?.name}</strong>.
                    </span>
                    <button
                      onClick={() => setTeacherSubjectFilter('ALL')}
                      className="text-amber-800 hover:text-amber-950 underline font-black text-[11px]"
                    >
                      Clear Filter
                    </button>
                  </div>
                )}
              </div>

              {/* Faculty Cards Grid or Empty State */}
              {(() => {
                const displayedTeachers = teachers.filter(t => {
                  if (teacherSubjectFilter === 'ALL') return true
                  const subId = Number(teacherSubjectFilter)
                  return assignments.some(a => a.teacher?.id === t.id && a.subject?.id === subId)
                })

                if (displayedTeachers.length === 0) {
                  const currentSubName = subjects.find(s => String(s.id) === String(teacherSubjectFilter))?.name || 'this subject'
                  return (
                    <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-xl font-bold">
                        👨‍🏫
                      </div>
                      <h4 className="font-extrabold text-[#0F2942] text-sm">No Teachers Assigned to {currentSubName}</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        No faculty members are currently teaching {currentSubName}. You can assign teachers to this subject in the Subject Mapping Matrix.
                      </p>
                      <button
                        onClick={() => setTeacherSubjectFilter('ALL')}
                        className="px-4 py-2 rounded-xl bg-[#0F2942] text-amber-400 font-extrabold text-xs shadow-sm"
                      >
                        Reset Filter & View All Faculty
                      </button>
                    </div>
                  )
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedTeachers.map((teacher) => {
                      const tAssignments = assignments.filter(a => a.teacher?.id === teacher.id)
                      const classTeacherClasses = classes.filter(c => c.classTeacher?.id === teacher.id)

                      return (
                        <div key={teacher.id} className="card p-6 flex flex-col justify-between hover:shadow-lg transition-all border-t-4 border-t-primary-500">
                          <div>
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center font-black text-primary-700 text-lg">
                                  {teacher.fullName?.charAt(0) || 'T'}
                                </div>
                                <div>
                                  <h3 className="font-display font-bold text-surface-900 text-base">
                                    {teacher.fullName}
                                  </h3>
                                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-surface-100 text-surface-700">
                                    ID: {teacher.employeeId || 'T-UNASSIGNED'}
                                  </span>
                                </div>
                              </div>

                              <button
                                onClick={() => {
                                  setCredData({
                                    userId: teacher.user?.id,
                                    username: teacher.user?.username || '',
                                    password: ''
                                  })
                                  setShowCredModal(true)
                                }}
                                className="p-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors text-xs font-semibold flex items-center gap-1 flex-shrink-0"
                                title="Edit Username & Password"
                              >
                                <HiKey className="w-4 h-4" />
                                Login ID
                              </button>
                            </div>

                            {/* Credentials pill */}
                            <div className="mb-3 px-3 py-1.5 rounded-xl bg-surface-50 border border-surface-200 flex items-center justify-between text-xs">
                              <span className="text-surface-500 font-medium">Username:</span>
                              <span className="font-mono font-bold text-primary-700">{teacher.user?.username || 'None'}</span>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-1.5 text-xs text-surface-700/70 py-2 border-t border-surface-100">
                              <div className="flex items-center gap-2">
                                <HiBriefcase className="w-3.5 h-3.5 text-surface-400" />
                                <span>{teacher.qualification || 'Faculty Member'}</span>
                              </div>
                              {teacher.email && (
                                <div className="flex items-center gap-2">
                                  <HiEnvelope className="w-3.5 h-3.5 text-surface-400" />
                                  <span className="truncate">{teacher.email}</span>
                                </div>
                              )}
                              {teacher.phone && (
                                <div className="flex items-center gap-2">
                                  <HiPhone className="w-3.5 h-3.5 text-surface-400" />
                                  <span>{teacher.phone}</span>
                                </div>
                              )}
                            </div>

                            {/* Class Teacher Badge */}
                            {classTeacherClasses.length > 0 && (
                              <div className="mt-2 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-1.5">
                                <HiShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                <span>Class Teacher: {classTeacherClasses.map(c => `${c.name} ${c.section}`).join(', ')}</span>
                              </div>
                            )}

                            {/* Assigned Subjects List */}
                            <div className="mt-3">
                              <p className="text-[11px] font-bold uppercase tracking-wider text-surface-500 mb-1">
                                Teaching Load ({tAssignments.length} Subjects)
                              </p>
                              {tAssignments.length === 0 ? (
                                <p className="text-xs text-surface-400 italic">No subject assigned yet</p>
                              ) : (
                                <div className="flex flex-wrap gap-1.5">
                                  {tAssignments.map(a => (
                                    <span key={a.id} className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-primary-50 text-primary-700 border border-primary-200">
                                      {a.schoolClass?.name} {a.schoolClass?.section} — {a.subject?.name}
                                      <button
                                        onClick={() => handleRemoveAssignment(a.id)}
                                        className="text-red-400 hover:text-red-600 ml-0.5"
                                        title="Remove assignment"
                                      >
                                        <HiXMark className="w-3 h-3" />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-surface-100">
                            <button
                              onClick={() => {
                                setSelectedTeacher(teacher)
                                setModalClassId(classes[0]?.id || '')
                                setModalSubjectId(subjects[0]?.id || '')
                                setShowAssignModal(true)
                              }}
                              className="btn-secondary text-xs w-full flex items-center justify-center gap-1.5 py-2"
                            >
                              <HiPlus className="w-4 h-4" />
                              Assign Class & Subject
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* TAB 3: MASTER INSTITUTIONAL ALLOCATION MATRIX              */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'matrix' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-fade-in">
              {/* Header & View Controls */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <HiTableCells className="w-6 h-6 text-amber-500" />
                    <h3 className="font-extrabold text-[#0F2942] text-lg">
                      School-Wide Curriculum Allocation Grid
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                    High-flexibility institutional matrix. Switch between clean class-specific syllabi (no empty subject clutter) and the complete master cross-tabulation table. Click any cell to assign faculty or customize curriculum.
                  </p>
                </div>

                {/* View Mode Toggle Pill */}
                <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start lg:self-auto">
                  <button
                    onClick={() => setMatrixViewMode('active-only')}
                    className={`px-3.5 py-2 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all ${
                      matrixViewMode === 'active-only'
                        ? 'bg-[#0F2942] text-amber-400 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <HiSparkles className="w-4 h-4" />
                    <span>Class Syllabi View (Active Only)</span>
                  </button>
                  <button
                    onClick={() => setMatrixViewMode('full-grid')}
                    className={`px-3.5 py-2 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all ${
                      matrixViewMode === 'full-grid'
                        ? 'bg-[#0F2942] text-amber-400 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <HiTableCells className="w-4 h-4" />
                    <span>Master Grid (All Subjects)</span>
                  </button>
                </div>
              </div>

              {/* Filters Bar: Grade Level Pills & Search */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                {/* Grade Level Buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-extrabold uppercase text-slate-500 mr-1">Grade Level:</span>
                  {[
                    { id: 'ALL', label: `All Grades (${classes.length})` },
                    { id: 'PRIMARY', label: 'Primary (1-5)' },
                    { id: 'MIDDLE', label: 'Middle (6-8)' },
                    { id: 'SECONDARY', label: 'Secondary (9-10)' },
                    { id: 'SENIOR', label: 'Senior Sec (11-12)' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setGradeFilter(f.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                        gradeFilter === f.id
                          ? 'bg-[#0F2942] text-white shadow-xs'
                          : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Search Input */}
                <div className="relative min-w-[240px]">
                  <HiMagnifyingGlass className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search class or teacher..."
                    value={matrixSearch}
                    onChange={e => setMatrixSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                  />
                  {matrixSearch && (
                    <button
                      onClick={() => setMatrixSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* VIEW MODE 1: Class-Specific Active Syllabi Cards */}
              {matrixViewMode === 'active-only' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
                    <span>
                      Displaying <strong>{matrixFilteredClasses.length}</strong> classes with custom per-grade curriculum subjects
                    </span>
                    <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      💡 Click any subject to assign faculty or adjust syllabus
                    </span>
                  </div>

                  {matrixFilteredClasses.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                      No classes found matching the selected grade or search filter.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {matrixFilteredClasses.map(cls => {
                        const offeredSubs = getOfferedSubjectsForClass(cls.id)
                        const classAssigns = assignments.filter(a => a.schoolClass?.id === cls.id && isSubjectInClassCurriculum(cls.id, a.subject?.id))
                        const assignedCount = offeredSubs.filter(s => classAssigns.some(a => a.subject?.id === s.id)).length
                        const gradeCat = getClassGradeCategory(cls.name)
                        const isComplete = offeredSubs.length > 0 && assignedCount === offeredSubs.length

                        return (
                          <div
                            key={cls.id}
                            className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                          >
                            {/* Card Header */}
                            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-extrabold text-[#0F2942] text-sm">
                                    {cls.name} - Section {cls.section}
                                  </h4>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-200 text-slate-700">
                                    {gradeCat}
                                  </span>
                                </div>
                                <span className="text-[11px] text-slate-500 block mt-0.5">
                                  Class Teacher: <strong className="text-slate-800">{cls.classTeacher?.fullName || 'Not Designated'}</strong>
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                  onClick={() => openCurriculumCustomizer(cls)}
                                  className="px-2.5 py-1 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-[11px] flex items-center gap-1 shadow-xs transition-all"
                                  title="Add or remove subjects taught in this class"
                                >
                                  <HiAdjustmentsHorizontal className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Syllabus</span>
                                </button>
                                <button
                                  disabled={submitting}
                                  onClick={() => handleDeleteClass(cls)}
                                  className="p-1.5 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-300 hover:border-rose-300 transition-colors shadow-xs"
                                  title={`Delete Grade/Class ${cls.name} (${cls.section})`}
                                >
                                  <HiTrash className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Card Body: Progress & Subjects */}
                            <div className="p-4 space-y-3 flex-1 flex flex-col">
                              {/* Progress bar */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[11px] font-extrabold">
                                  <span className="text-slate-600">Curriculum Staffing:</span>
                                  <span className={isComplete ? 'text-emerald-700' : 'text-amber-700'}>
                                    {assignedCount} / {offeredSubs.length} Allocated ({offeredSubs.length > 0 ? Math.round((assignedCount / offeredSubs.length) * 100) : 0}%)
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      isComplete ? 'bg-emerald-500' : 'bg-amber-500'
                                    }`}
                                    style={{ width: `${offeredSubs.length > 0 ? (assignedCount / offeredSubs.length) * 100 : 0}%` }}
                                  />
                                </div>
                              </div>

                              {/* Active Subjects List */}
                              {offeredSubs.length === 0 ? (
                                <div className="py-6 text-center text-slate-400 text-xs italic flex-1 flex flex-col items-center justify-center space-y-2">
                                  <span>No subjects in this syllabus yet</span>
                                  <button
                                    onClick={() => openCurriculumCustomizer(cls)}
                                    className="px-3 py-1 rounded-xl bg-amber-50 text-amber-800 font-bold text-xs border border-amber-300"
                                  >
                                    + Add Subjects
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-2 flex-1">
                                  {offeredSubs.map(sub => {
                                    const subAssigns = classAssigns.filter(a => a.subject?.id === sub.id && a.teacher?.id)
                                    const teacherList = subAssigns.map(a => a.teacher)

                                    return (
                                      <div
                                        key={sub.id}
                                        onClick={() => openCellModal(cls, sub)}
                                        className={`group p-2 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 ${
                                          teacherList.length > 0
                                            ? 'bg-emerald-50/40 hover:bg-emerald-50 border-emerald-200/60'
                                            : 'bg-amber-50/40 hover:bg-amber-50 border-amber-200/70'
                                        }`}
                                        title="Click to assign or change teachers (supports multiple teachers)"
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className="px-2 py-0.5 rounded-lg bg-[#0F2942] text-amber-400 font-mono font-bold text-[10px] flex-shrink-0">
                                            {sub.code || 'SUB'}
                                          </span>
                                          <span className="font-bold text-xs text-slate-800 truncate">
                                            {sub.name}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                          {teacherList.length > 0 ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-[11px] group-hover:ring-1 ring-emerald-400">
                                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                              <span className="max-w-[120px] truncate">
                                                {teacherList.map(t => t.fullName).join(', ')}
                                              </span>
                                              {teacherList.length > 1 && (
                                                <span className="px-1.5 py-0.2 rounded-full bg-emerald-200 text-emerald-900 text-[9px] font-black">
                                                  Co-Taught ({teacherList.length})
                                                </span>
                                              )}
                                              <HiPencilSquare className="w-3 h-3 text-emerald-600 opacity-60 group-hover:opacity-100" />
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold text-[11px] group-hover:ring-1 ring-amber-400 animate-pulse">
                                              <span>+ Assign Faculty</span>
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Card Footer */}
                            <div className="px-4 py-2.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-[11px]">
                              <span className="text-slate-500 font-medium">
                                Total: {offeredSubs.length} active syllabus subjects
                              </span>
                              <button
                                onClick={() => openCurriculumCustomizer(cls)}
                                className="text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1"
                              >
                                <HiPlus className="w-3 h-3" />
                                <span>Adjust Syllabus</span>
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* VIEW MODE 2: Master Institutional Table Cross-Tabulation */}
              {matrixViewMode === 'full-grid' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
                    <span>
                      Cross-tabulation showing all classes against all school subjects. Cells dynamically display active status.
                    </span>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300"></span> Assigned Faculty</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-300"></span> Needs Teacher</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-100 border border-slate-300"></span> Excluded / N/A</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-[#0F2942] text-white font-extrabold uppercase text-[11px]">
                        <tr>
                          <th className="p-3 border border-slate-700 min-w-[160px] sticky left-0 z-10 bg-[#0F2942]">
                            Class / Section
                          </th>
                          {subjects.map(s => (
                            <th key={s.id} className="p-3 border border-slate-700 min-w-[130px] text-center">
                              <span className="block truncate">{s.name}</span>
                              <span className="block text-[10px] text-amber-300 font-mono font-normal">
                                ({s.code})
                              </span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-medium">
                        {matrixFilteredClasses.map((cls, idx) => (
                          <tr key={cls.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                            {/* Sticky Class Name Column with Edit and Delete options */}
                            <td className="p-3 font-extrabold text-[#0F2942] border border-slate-200 bg-slate-100/90 sticky left-0 z-10">
                              <div className="flex items-center justify-between gap-1.5">
                                <div>
                                  <span className="block text-xs">{cls.name} ({cls.section})</span>
                                  <span className="text-[10px] text-slate-500 font-normal block">
                                    {getOfferedSubjectsForClass(cls.id).length} Active Subjects
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => openCurriculumCustomizer(cls)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-200 transition-colors"
                                    title="Edit Class Syllabus"
                                  >
                                    <HiAdjustmentsHorizontal className="w-4 h-4" />
                                  </button>
                                  <button
                                    disabled={submitting}
                                    onClick={() => handleDeleteClass(cls)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                    title={`Delete Grade/Class ${cls.name} (${cls.section})`}
                                  >
                                    <HiTrash className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Subject Cells */}
                            {subjects.map(sub => {
                              const isOffered = isSubjectInClassCurriculum(cls.id, sub.id)
                              const cellAssigns = assignments.filter(
                                a => a.schoolClass?.id === cls.id && a.subject?.id === sub.id && a.teacher?.id
                              )
                              const cellTeachers = cellAssigns.map(a => a.teacher)

                              if (!isOffered) {
                                return (
                                  <td
                                    key={sub.id}
                                    onClick={() => openCellModal(cls, sub)}
                                    className="p-2.5 border border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-center cursor-pointer transition-colors group"
                                    title={`Subject not taught in ${cls.name}. Click to add.`}
                                  >
                                    <span className="text-[10px] text-slate-400 group-hover:hidden font-mono block">
                                      — N/A —
                                    </span>
                                    <span className="hidden group-hover:inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                                      <HiPlus className="w-3 h-3" /> Add
                                    </span>
                                  </td>
                                )
                              }

                              return (
                                <td 
                                  key={sub.id}
                                  onClick={() => openCellModal(cls, sub)}
                                  className={`p-2.5 border border-slate-200 cursor-pointer transition-all hover:ring-2 hover:ring-inset ${
                                    cellTeachers.length > 0
                                      ? 'bg-emerald-50/60 hover:bg-emerald-100/70 hover:ring-emerald-400'
                                      : 'bg-amber-50/70 hover:bg-amber-100/80 hover:ring-amber-400'
                                  }`}
                                  title={`Click to edit faculty allocation for ${sub.name} (supports multiple teachers)`}
                                >
                                  {cellTeachers.length > 0 ? (
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between gap-1">
                                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                                          cellTeachers.length > 1 ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900'
                                        }`}>
                                          {cellTeachers.length > 1 ? `Co-Taught (${cellTeachers.length})` : 'Assigned'}
                                        </span>
                                        <HiPencilSquare className="w-3 h-3 text-emerald-600 opacity-40 hover:opacity-100 flex-shrink-0" />
                                      </div>
                                      {cellTeachers.map(t => (
                                        <div key={t.id} className="text-[11px] font-extrabold text-emerald-950 truncate leading-tight">
                                          {t.fullName}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center py-1">
                                      <span className="text-[11px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 flex items-center gap-1">
                                        <HiPlus className="w-3 h-3" /> Assign
                                      </span>
                                    </div>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ════ Modal: Assign Class & Subject ════ */}
      {showAssignModal && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full border border-slate-200 relative p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-[#0F2942]">
                Assign Class & Subject
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-700">
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Assign faculty member <span className="font-bold text-[#0F2942]">{selectedTeacher.fullName}</span> to teach in an academic class.
            </p>

            <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Target Class *</label>
                <select
                  value={modalClassId}
                  onChange={(e) => setModalClassId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - Section {c.section}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Curriculum Subject *</label>
                <select
                  value={modalSubjectId}
                  onChange={(e) => setModalSubjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#0F2942] hover:bg-slate-900 text-amber-400 font-extrabold shadow-md"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════ Modal: Add Teacher Account ════ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full border border-slate-200 relative p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-[#0F2942]">Register New Faculty Account</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeacher} className="space-y-3.5 text-xs font-medium">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Robert Brown"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Login Username *</label>
                  <input
                    type="text"
                    placeholder="e.g. rbrown"
                    required
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Password *</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    required
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Employee ID *</label>
                <input
                  type="text"
                  placeholder="e.g. EMP-2025-04"
                  required
                  value={formData.employeeId}
                  onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Qualification / Domain</label>
                <input
                  type="text"
                  placeholder="e.g. M.Sc. Mathematics, B.Ed."
                  value={formData.qualification}
                  onChange={e => setFormData({ ...formData, qualification: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="teacher@school.edu"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+1 555-0199"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#0F2942] hover:bg-slate-900 text-amber-400 font-extrabold shadow-md"
                >
                  Create Faculty Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════ Modal: Edit Login Credentials ════ */}
      {showCredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-sm w-full border border-slate-200 relative p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-[#0F2942] flex items-center gap-2">
                <HiKey className="w-5 h-5 text-amber-500" />
                Change Login Credentials
              </h3>
              <button onClick={() => setShowCredModal(false)} className="text-slate-400 hover:text-slate-700">
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCredentials} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Username *</label>
                <input
                  type="text"
                  required
                  value={credData.username}
                  onChange={e => setCredData({ ...credData, username: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password"
                  value={credData.password}
                  onChange={e => setCredData({ ...credData, password: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCredModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#0F2942] hover:bg-slate-900 text-amber-400 font-extrabold shadow-md"
                >
                  Update Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════ Modal: Direct Inline Cell Curriculum & Teacher Allocation ════ */}
      {cellModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-[#0F2942] flex items-center gap-2">
                  <HiPencilSquare className="w-5 h-5 text-amber-500" />
                  Curriculum & Teacher Allocation
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {cellModal.className} (Section {cellModal.section}) • <span className="font-bold text-slate-700">{cellModal.subjectName} ({cellModal.subjectCode})</span>
                </p>
              </div>
              <button 
                onClick={() => setCellModal(prev => ({ ...prev, open: false }))} 
                className="text-slate-400 hover:text-slate-700"
              >
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCellAllocation} className="space-y-4 text-xs font-medium">
              {/* Inclusion switch */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block font-bold text-slate-800 text-xs">Offered in Class Syllabus</span>
                    <span className="text-[11px] text-slate-500 block">
                      {cellModal.isOffered ? 'Active curriculum subject' : 'Excluded from this grade (N/A)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCellModal(prev => ({ ...prev, isOffered: !prev.isOffered }))}
                    className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1.5 ${
                      cellModal.isOffered 
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : 'bg-slate-300 text-slate-700'
                    }`}
                  >
                    {cellModal.isOffered ? <HiCheck className="w-4 h-4" /> : <HiXMark className="w-4 h-4" />}
                    {cellModal.isOffered ? 'Included' : 'Excluded'}
                  </button>
                </div>
              </div>

              {/* Multi-Teacher Allocation Selector */}
              {cellModal.isOffered ? (
                <div className="space-y-2.5 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-extrabold uppercase text-slate-600">
                      Assigned Faculty ({cellModal.teacherIds.length} Selected)
                    </label>
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      💡 Select 2 or more for co-teaching
                    </span>
                  </div>

                  {(() => {
                    const subjectSpecialists = getTeachersAssignedToSubject(cellModal.subjectId)
                    const otherTeachers = teachers.filter(t => !subjectSpecialists.some(st => st.id === t.id))

                    const toggleTeacher = (tId) => {
                      setCellModal(prev => {
                        const exists = prev.teacherIds.includes(tId)
                        return {
                          ...prev,
                          teacherIds: exists 
                            ? prev.teacherIds.filter(id => id !== tId) 
                            : [...prev.teacherIds, tId]
                        }
                      })
                    }

                    return (
                      <div className="space-y-3 max-h-64 overflow-y-auto p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
                        {/* Section 1: Subject Faculty (X, Y) */}
                        {subjectSpecialists.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider block px-1">
                              ⭐ Faculty Teaching {cellModal.subjectName} ({subjectSpecialists.length})
                            </span>
                            <div className="space-y-1">
                              {subjectSpecialists.map(t => {
                                const isChecked = cellModal.teacherIds.includes(t.id)
                                return (
                                  <label
                                    key={t.id}
                                    className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
                                      isChecked
                                        ? 'bg-emerald-50 border-emerald-300 shadow-xs'
                                        : 'bg-white border-slate-200 hover:bg-slate-100/70'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => toggleTeacher(t.id)}
                                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                                      />
                                      <div className="min-w-0">
                                        <span className="font-extrabold text-xs text-slate-900 block truncate">
                                          {t.fullName}
                                        </span>
                                        <span className="text-[10px] text-slate-500 block">
                                          ID: {t.employeeId} {t.qualification ? `• ${t.qualification}` : ''}
                                        </span>
                                      </div>
                                    </div>
                                    {isChecked && (
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-200 text-emerald-900">
                                        Selected
                                      </span>
                                    )}
                                  </label>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Section 2: Other School Faculty */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block px-1">
                            All Other School Faculty ({otherTeachers.length})
                          </span>
                          <div className="space-y-1">
                            {otherTeachers.map(t => {
                              const isChecked = cellModal.teacherIds.includes(t.id)
                              return (
                                <label
                                  key={t.id}
                                  className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
                                    isChecked
                                      ? 'bg-emerald-50 border-emerald-300 shadow-xs'
                                      : 'bg-white border-slate-200 hover:bg-slate-100/70'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleTeacher(t.id)}
                                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                                    />
                                    <div className="min-w-0">
                                      <span className="font-extrabold text-xs text-slate-900 block truncate">
                                        {t.fullName}
                                      </span>
                                      <span className="text-[10px] text-slate-500 block">
                                        ID: {t.employeeId} {t.qualification ? `• ${t.qualification}` : ''}
                                      </span>
                                    </div>
                                  </div>
                                  {isChecked && (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-200 text-emerald-900">
                                      Selected
                                    </span>
                                  )}
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-100 text-slate-500 text-center italic text-xs">
                  This subject will be marked as "Not in Curriculum" for {cellModal.className}.
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCellModal(prev => ({ ...prev, open: false }))}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#0F2942] hover:bg-slate-900 text-amber-400 font-extrabold shadow-md flex items-center justify-center gap-1.5"
                >
                  <HiCheck className="w-4 h-4" />
                  Save Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════ Modal: Class Curriculum Syllabus Batch Customizer ════ */}
      {curriculumModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-lg w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-[#0F2942] flex items-center gap-2">
                  <HiAdjustmentsHorizontal className="w-5 h-5 text-amber-500" />
                  Customize Syllabus: {curriculumModal.className} ({curriculumModal.section})
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Check all subjects taught in this class. Classes only display their active subjects.
                </p>
              </div>
              <button 
                onClick={() => setCurriculumModal(prev => ({ ...prev, open: false }))} 
                className="text-slate-400 hover:text-slate-700"
              >
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between text-xs pb-1">
              <span className="font-extrabold text-[#0F2942]">
                Active Subjects ({curriculumModal.selectedSubjectIds.length} of {subjects.length})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurriculumModal(prev => ({ ...prev, selectedSubjectIds: subjects.map(s => s.id) }))}
                  className="text-[11px] text-amber-700 hover:text-amber-900 font-bold underline"
                >
                  Select All
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => setCurriculumModal(prev => ({ ...prev, selectedSubjectIds: [] }))}
                  className="text-[11px] text-rose-700 hover:text-rose-900 font-bold underline"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Subject Checkbox Grid */}
            <div className="max-h-72 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2 border border-slate-200 rounded-2xl p-3 bg-slate-50">
              {subjects.map(sub => {
                const isChecked = curriculumModal.selectedSubjectIds.includes(sub.id)
                return (
                  <label
                    key={sub.id}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-amber-50/90 border-amber-300 shadow-xs'
                        : 'bg-white border-slate-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        setCurriculumModal(prev => {
                          const exists = prev.selectedSubjectIds.includes(sub.id)
                          return {
                            ...prev,
                            selectedSubjectIds: exists
                              ? prev.selectedSubjectIds.filter(id => id !== sub.id)
                              : [...prev.selectedSubjectIds, sub.id]
                          }
                        })
                      }}
                      className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-xs text-slate-900 block truncate">
                        {sub.name}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500 block">
                        {sub.code}
                      </span>
                    </div>
                  </label>
                )
              })}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurriculumModal(prev => ({ ...prev, open: false }))}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSaveBatchCurriculum}
                className="flex-1 py-2.5 rounded-xl bg-[#0F2942] hover:bg-slate-900 text-amber-400 font-extrabold text-xs shadow-md flex items-center justify-center gap-1.5"
              >
                <HiCheck className="w-4 h-4" />
                Save Class Syllabus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
