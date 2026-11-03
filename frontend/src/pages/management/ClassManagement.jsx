import { useState, useEffect } from 'react'
import api from '../../api/axiosConfig'
import {
  HiBuildingLibrary, HiBookOpen, HiPlus, HiXMark,
  HiShieldCheck, HiUser, HiMagnifyingGlass, HiAcademicCap,
  HiCheckCircle, HiExclamationTriangle, HiTrash, HiPencilSquare,
  HiTag, HiSparkles, HiUserGroup, HiClock, HiCalendarDays, HiPencil
} from 'react-icons/hi2'

export default function ClassManagement() {
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('classes') // 'classes' | 'subjects' | 'timetable'

  // Timetable State & Config (Direct DB sync across portals)
  const [timetableData, setTimetableData] = useState(null)
  const [timetablePeriods, setTimetablePeriods] = useState([])
  const [timetableDays, setTimetableDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])
  const [selectedTimetableClassId, setSelectedTimetableClassId] = useState('')
  const [editSlotModal, setEditSlotModal] = useState({
    open: false, day: '', periodId: '', periodLabel: '', startTime: '', endTime: '',
    subject: '', subjectId: '', teacherId: '', teacherName: '', room: ''
  })
  const [editPeriodsModal, setEditPeriodsModal] = useState(false)
  const [conflictError, setConflictError] = useState(null)
  const [timetableLoading, setTimetableLoading] = useState(false)

  // Modals & Controls
  const [showAddClass, setShowAddClass] = useState(false)
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [message, setMessage] = useState(null) // { type: 'success'|'error', text: '' }
  const [submitting, setSubmitting] = useState(false)

  // Class Form State
  const [className, setClassName] = useState('')
  const [classSection, setClassSection] = useState('A')
  const [sortOrder, setSortOrder] = useState('1')
  const [selectedClassTeacherId, setSelectedClassTeacherId] = useState('')

  // Subject Form State
  const [subjectName, setSubjectName] = useState('')
  const [subjectCode, setSubjectCode] = useState('')
  const [subjectCategory, setSubjectCategory] = useState('Core Science & Math')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [cRes, sRes, tRes] = await Promise.all([
        api.get('/admin/classes'),
        api.get('/admin/subjects'),
        api.get('/admin/teachers')
      ])
      setClasses(cRes.data || [])
      setSubjects(sRes.data || [])
      setTeachers(tRes.data || [])

      if (cRes.data && cRes.data.length > 0) {
        const defaultClassId = String(cRes.data[0].id)
        setSelectedTimetableClassId(prev => prev || defaultClassId)
        fetchClassTimetable(defaultClassId)
      }
    } catch (error) {
      console.error('Failed to fetch class & subject data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClassTimetable = async (classId) => {
    if (!classId) return
    setTimetableLoading(true)
    try {
      const [tRes, cfgRes] = await Promise.all([
        api.get(`/timetable/class/${classId}`),
        api.get('/timetable/config')
      ])
      setTimetableData(tRes.data)
      setTimetablePeriods(cfgRes.data?.periods || tRes.data?.periods || [])
      setTimetableDays(cfgRes.data?.days || tRes.data?.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])
    } catch (error) {
      console.error('Failed to load class timetable:', error)
    } finally {
      setTimetableLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'timetable' && selectedTimetableClassId) {
      fetchClassTimetable(selectedTimetableClassId)
    }
  }, [activeTab, selectedTimetableClassId])

  const handleCreateClass = async (e) => {
    e.preventDefault()
    if (!className) return
    setSubmitting(true)
    setMessage(null)
    try {
      const { data: newClass } = await api.post('/admin/classes', {
        name: className,
        section: classSection.toUpperCase().trim(),
        sortOrder: parseInt(sortOrder) || 1,
        academicYear: '2025-2026'
      })

      if (selectedClassTeacherId) {
        await api.put(`/admin/classes/${newClass.id}/class-teacher?teacherId=${selectedClassTeacherId}`)
      }

      setMessage({ type: 'success', text: `Class Section "${className} - ${classSection.toUpperCase()}" created successfully!` })
      setTimeout(() => {
        setMessage(null)
        setShowAddClass(false)
        setClassName('')
        setSelectedClassTeacherId('')
        fetchData()
      }, 1200)
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to create class section' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateSubject = async (e) => {
    e.preventDefault()
    if (!subjectName || !subjectCode) return
    setSubmitting(true)
    setMessage(null)
    try {
      await api.post('/admin/subjects', {
        name: subjectName,
        code: subjectCode.toUpperCase().trim()
      })
      setMessage({ type: 'success', text: `Subject "${subjectName} (${subjectCode.toUpperCase()})" added to curriculum!` })
      setTimeout(() => {
        setMessage(null)
        setShowAddSubject(false)
        setSubjectName('')
        setSubjectCode('')
        fetchData()
      }, 1200)
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to create subject' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleAssignClassTeacher = async (classId, teacherId) => {
    try {
      await api.put(`/admin/classes/${classId}/class-teacher?teacherId=${teacherId}`)
      setMessage({ type: 'success', text: 'Class Teacher updated successfully' })
      setTimeout(() => setMessage(null), 2000)
      fetchData()
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update Class Teacher' })
    }
  }

  // Edit Class State
  const [editingClass, setEditingClass] = useState(null)

  const handleUpdateClass = async (e) => {
    e.preventDefault()
    if (!editingClass || !editingClass.name) return
    setSubmitting(true)
    setMessage(null)
    try {
      await api.put(`/admin/classes/${editingClass.id}`, {
        name: editingClass.name,
        section: editingClass.section.toUpperCase().trim(),
        sortOrder: parseInt(editingClass.sortOrder) || 1
      })

      if (editingClass.classTeacherId !== undefined) {
        await api.put(`/admin/classes/${editingClass.id}/class-teacher?teacherId=${editingClass.classTeacherId || ''}`)
      }

      setMessage({ type: 'success', text: `Class Section updated successfully!` })
      setTimeout(() => {
        setMessage(null)
        setEditingClass(null)
        fetchData()
      }, 1200)
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update class' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteClass = async (classId, className, classSection) => {
    if (!window.confirm(`Are you sure you want to delete Class "${className} - Section ${classSection}"?`)) return
    try {
      await api.delete(`/admin/classes/${classId}`)
      setMessage({ type: 'success', text: `Class "${className} - ${classSection}" deleted successfully!` })
      setTimeout(() => setMessage(null), 2000)
      fetchData()
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete class' })
    }
  }

  // Filtered lists
  const filteredClasses = classes.filter(c =>
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.section || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.classTeacher?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredSubjects = subjects.filter(s =>
    (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.code || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalAssignedTeachers = classes.filter(c => c.classTeacher?.id).length
  const teacherCoverage = classes.length > 0 ? Math.round((totalAssignedTeachers / classes.length) * 100) : 0

  return (
    <div className="animate-fade-in space-y-6 font-sans text-slate-800">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-extrabold text-[10px] uppercase tracking-wider border border-amber-500/20 flex items-center gap-1">
              <HiSparkles className="w-3.5 h-3.5 text-amber-500" /> Academic Setup Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F2942] tracking-tight">
            Classes & Curriculum Matrix
          </h1>
          <p className="text-slate-500 text-xs font-medium max-w-xl">
            Designate Class Teachers with full portal access, configure grade sections, and manage institutional subjects curriculum.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowAddClass(true)}
            className="px-4 py-2.5 rounded-xl bg-[#0F2942] hover:bg-slate-900 text-amber-400 font-extrabold text-xs flex items-center gap-2 transition-all shadow-md shadow-[#0F2942]/10"
          >
            <HiPlus className="w-4 h-4" />
            <span>Add Class Section</span>
          </button>
          <button
            onClick={() => setShowAddSubject(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 transition-all shadow-md shadow-amber-500/10"
          >
            <HiPlus className="w-4 h-4" />
            <span>Add Subject</span>
          </button>
        </div>
      </div>

      {/* KPI Analytical Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-extrabold text-xl">
            <HiBuildingLibrary className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Active Classes</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[#0F2942]">{classes.length}</span>
              <span className="text-[11px] font-semibold text-slate-500">Sections</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-extrabold text-xl">
            <HiShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Class Teacher Assigned</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[#0F2942]">{totalAssignedTeachers} / {classes.length}</span>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {teacherCoverage}% Coverage
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-extrabold text-xl">
            <HiBookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Subjects Curriculum</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[#0F2942]">{subjects.length}</span>
              <span className="text-[11px] font-semibold text-slate-500">Active Subjects</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 border transition-all ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {message.type === 'success' ? <HiCheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" /> : <HiExclamationTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Tab Controls & Search Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl text-xs font-extrabold w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('classes')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              activeTab === 'classes'
                ? 'bg-[#0F2942] text-amber-400 shadow'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HiBuildingLibrary className="w-4 h-4" />
            <span>School Classes ({classes.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              activeTab === 'subjects'
                ? 'bg-[#0F2942] text-amber-400 shadow'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HiBookOpen className="w-4 h-4" />
            <span>Subjects Curriculum ({subjects.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('timetable')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              activeTab === 'timetable'
                ? 'bg-[#0F2942] text-amber-400 shadow'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HiSparkles className="w-4 h-4 text-amber-400" />
            <span>Weekly Timetable Matrix</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <HiMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeTab === 'classes' ? 'Filter class or section...' : 'Filter subject name or code...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

      </div>

      {/* Dynamic Tab Views */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 font-semibold text-xs animate-pulse">
          Loading institutional academic data...
        </div>
      ) : activeTab === 'classes' ? (
        
        /* ═══════════════ TAB 1: SCHOOL CLASSES ═══════════════ */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-[#0F2942]">Active Class Sections</h2>
              <p className="text-xs text-slate-500 font-medium">Designate Class Teachers to grant them full access across all subjects of their class.</p>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              ⭐ Class Teacher Status Live Sync
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-6">Sort</th>
                  <th className="py-3.5 px-6">Grade / Class Name</th>
                  <th className="py-3.5 px-6">Section</th>
                  <th className="py-3.5 px-6">Assigned Class Teacher (Full Access)</th>
                  <th className="py-3.5 px-6">Academic Year</th>
                  <th className="py-3.5 px-6">Class Teacher</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClasses.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-400 font-medium">
                      No classes found matching search filter.
                    </td>
                  </tr>
                ) : (
                  filteredClasses.map((cls) => {
                    const hasTeacher = cls.classTeacher && cls.classTeacher.id
                    return (
                      <tr key={cls.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 font-mono font-bold text-slate-400">{cls.sortOrder}</td>
                        <td className="py-4 px-6 font-extrabold text-slate-900 text-sm">
                          {cls.name}
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-mono font-extrabold text-xs border border-blue-200">
                            Section {cls.section}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2.5">
                            {hasTeacher ? (
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold text-xs flex-shrink-0">
                                {cls.classTeacher.fullName.charAt(0)}
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-extrabold text-xs flex-shrink-0">
                                !
                              </div>
                            )}
                            <div>
                              <p className={`font-bold text-xs ${hasTeacher ? 'text-slate-900' : 'text-amber-800 italic'}`}>
                                {hasTeacher ? cls.classTeacher.fullName : 'Unassigned Class Teacher'}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium">
                                {hasTeacher ? `ID: ${cls.classTeacher.employeeId || 'FAC-1001'}` : 'Assign teacher below'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-medium text-slate-500">{cls.academicYear || '2025-2026'}</td>
                        <td className="py-4 px-6">
                          <select
                            value={cls.classTeacher?.id || ''}
                            onChange={(e) => handleAssignClassTeacher(cls.id, e.target.value)}
                            className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-slate-100 border border-slate-300 text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
                          >
                            <option value="">-- Assign Teacher --</option>
                            {teachers.map(t => (
                              <option key={t.id} value={t.id}>{t.fullName} ({t.employeeId || 'ID'})</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingClass({
                                id: cls.id,
                                name: cls.name,
                                section: cls.section,
                                sortOrder: cls.sortOrder,
                                classTeacherId: cls.classTeacher?.id || ''
                              })}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                              title="Edit Class Name & Section"
                            >
                              <HiPencilSquare className="w-4 h-4 text-blue-600" />
                            </button>
                            <button
                              onClick={() => handleDeleteClass(cls.id, cls.name, cls.section)}
                              className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                              title="Delete Class Section"
                            >
                              <HiTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'subjects' ? (

        /* ═══════════════ TAB 2: SUBJECTS CURRICULUM ═══════════════ */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubjects.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-400 font-medium bg-white rounded-3xl border border-slate-200">
              No subjects found matching search query.
            </div>
          ) : (
            filteredSubjects.map((sub) => (
              <div
                key={sub.id}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-extrabold text-sm border border-amber-500/20">
                    <HiBookOpen className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-[#0F2942] text-amber-400 font-mono font-extrabold text-xs">
                    {sub.code}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-[#0F2942]">{sub.name}</h3>
                  <span className="inline-block px-2.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-extrabold uppercase">
                    Core Academic Curriculum
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Status: Active</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <HiCheckCircle className="w-3.5 h-3.5" /> Assigned to Classes
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : activeTab === 'timetable' ? (
        /* ═══════════════ TAB 3: INTERACTIVE WEEKLY TIMETABLE MATRIX (DATABASE SYNCED) ═══════════════ */
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-[#0F2942] flex items-center gap-2">
                  <HiSparkles className="w-5 h-5 text-amber-500" /> Interactive Class Weekly Schedule Matrix
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                  Database Synced
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Assignments made here immediately update in student and teacher portals. System automatically prevents teacher double-booking.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setEditPeriodsModal(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all border border-slate-300"
              >
                <HiClock className="w-4 h-4 text-slate-600" />
                <span>Period Slots ({timetablePeriods.length})</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 uppercase">Class:</span>
                <select
                  value={selectedTimetableClassId || (classes[0]?.id || '')}
                  onChange={(e) => {
                    setSelectedTimetableClassId(e.target.value)
                    fetchClassTimetable(e.target.value)
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-xs bg-slate-50 text-[#0F2942] focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - Section {c.section}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {timetableLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-semibold text-slate-500">Syncing schedule matrix from database...</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#0F2942] text-white font-extrabold uppercase text-[11px]">
                  <tr>
                    <th className="p-3 border border-slate-700 w-28">Day / Period</th>
                    {timetablePeriods.map(p => (
                      <th key={p.periodId || p.id} className="p-3 border border-slate-700 min-w-[140px]">
                        <div className="flex items-center justify-between">
                          <span>{p.periodLabel || p.label}</span>
                        </div>
                        <span className="block text-[10px] text-amber-300 font-normal font-mono mt-0.5">
                          {p.startTime && p.endTime ? `${p.startTime} - ${p.endTime}` : p.time}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {timetableDays.map((day, idx) => (
                    <tr key={day} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                      <td className="p-3 font-extrabold text-[#0F2942] border border-slate-200 bg-slate-100">
                        {day}
                      </td>
                      {timetablePeriods.map(period => {
                        const pId = period.periodId || period.id
                        const pLabel = period.periodLabel || period.label
                        const pStart = period.startTime || (period.time ? period.time.split('-')[0]?.trim() : '')
                        const pEnd = period.endTime || (period.time ? period.time.split('-')[1]?.trim() : '')

                        const slot = timetableData?.matrix?.[day]?.[pId] || 
                                     timetableData?.matrix?.[day]?.[pId?.toLowerCase()] || 
                                     timetableData?.matrix?.[day]?.[pId?.toUpperCase()]

                        return (
                          <td
                            key={pId}
                            onClick={() => {
                              setConflictError(null)
                              setEditSlotModal({
                                open: true,
                                day,
                                periodId: pId,
                                periodLabel: pLabel,
                                startTime: pStart,
                                endTime: pEnd,
                                subject: slot?.subjectName || slot?.subject?.name || '',
                                subjectId: slot?.subject?.id || '',
                                teacherId: slot?.teacher?.id || '',
                                teacherName: slot?.teacherName || slot?.teacher?.fullName || '',
                                room: slot?.room || 'Room 101'
                              })
                            }}
                            className={`p-3 border border-slate-200 cursor-pointer transition-colors group relative ${
                              slot ? 'bg-amber-50/50 hover:bg-amber-100/60' : 'hover:bg-slate-100/80'
                            }`}
                            title="Click to assign or edit period slot"
                          >
                            {slot ? (
                              <div>
                                <div className="flex items-start justify-between">
                                  <span className="font-extrabold text-[#0F2942] group-hover:text-amber-800 text-[12px]">
                                    {slot.subjectName || slot.subject?.name}
                                  </span>
                                  <HiPencil className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-colors" />
                                </div>
                                <span className="text-[10px] text-emerald-800 block mt-1 font-bold flex items-center gap-1">
                                  <HiUser className="w-3 h-3 text-emerald-600" />
                                  {slot.teacherName || slot.teacher?.fullName || 'Faculty Member'}
                                </span>
                                <span className="text-[9px] text-slate-500 block mt-0.5">
                                  {slot.room || 'Room 101'}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center py-2 text-slate-400 group-hover:text-[#0F2942] italic text-[11px] font-semibold">
                                + Assign Slot
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
          )}
        </div>
      ) : null}

      {/* ═══════════════ EDIT TIMETABLE SLOT MODAL (WITH CLASH DETECTION) ═══════════════ */}
      {editSlotModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full border border-slate-200 relative">
            <div className="bg-[#0F2942] text-white px-6 py-4 flex items-center justify-between border-b-4 border-amber-500">
              <div className="flex items-center gap-2">
                <HiSparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold tracking-tight">Assign Timetable Period Slot</h3>
              </div>
              <button 
                onClick={() => {
                  setConflictError(null)
                  setEditSlotModal({ open: false, day: '', periodId: '', periodLabel: '', startTime: '', endTime: '', subject: '', subjectId: '', teacherId: '', teacherName: '', room: '' })
                }} 
                className="p-1 rounded-full text-slate-300 hover:bg-white/10"
              >
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault()
              setConflictError(null)
              setSubmitting(true)
              const activeClassId = selectedTimetableClassId || classes[0]?.id

              try {
                await api.post('/timetable/slot', {
                  classId: parseInt(activeClassId),
                  dayOfWeek: editSlotModal.day,
                  periodId: editSlotModal.periodId,
                  periodLabel: editSlotModal.periodLabel,
                  startTime: editSlotModal.startTime,
                  endTime: editSlotModal.endTime,
                  subjectId: editSlotModal.subjectId ? parseInt(editSlotModal.subjectId) : null,
                  subjectName: editSlotModal.subject,
                  teacherId: editSlotModal.teacherId ? parseInt(editSlotModal.teacherId) : null,
                  teacherName: editSlotModal.teacherName,
                  room: editSlotModal.room,
                  academicYear: '2025-2026'
                })

                setMessage({ type: 'success', text: `Timetable slot for ${editSlotModal.day} ${editSlotModal.periodLabel} updated and synced across portals!` })
                setTimeout(() => setMessage(null), 3000)
                setEditSlotModal({ open: false, day: '', periodId: '', periodLabel: '', startTime: '', endTime: '', subject: '', subjectId: '', teacherId: '', teacherName: '', room: '' })
                await fetchClassTimetable(activeClassId)
              } catch (err) {
                console.error('Save slot error:', err)
                if (err.response?.status === 409) {
                  setConflictError(err.response.data?.message || 'Schedule conflict: Teacher already assigned to another class at this time!')
                } else {
                  setConflictError(err.response?.data?.message || 'Failed to save timetable slot')
                }
              } finally {
                setSubmitting(false)
              }
            }} className="p-6 space-y-4 text-xs font-medium">
              
              {/* Slot Meta Badge */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-amber-800 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200 uppercase tracking-wider">
                  {editSlotModal.day} • {editSlotModal.periodLabel} {editSlotModal.startTime ? `(${editSlotModal.startTime} - ${editSlotModal.endTime})` : ''}
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  Class: {classes.find(c => String(c.id) === String(selectedTimetableClassId))?.name || 'Class'}
                </span>
              </div>

              {/* ⚠️ HIGH-VISIBILITY TEACHER CONFLICT ERROR BANNER */}
              {conflictError && (
                <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-400 text-rose-900 space-y-1.5 shadow-sm">
                  <div className="flex items-center gap-2 text-rose-700">
                    <HiExclamationTriangle className="w-5 h-5 flex-shrink-0" />
                    <span className="font-extrabold uppercase text-[11px] tracking-wide">Schedule Conflict Detected</span>
                  </div>
                  <p className="font-semibold text-xs leading-relaxed text-rose-950">
                    {conflictError}
                  </p>
                  <p className="text-[11px] text-rose-700">
                    A teacher cannot teach multiple classes at the same time. Please pick another faculty member or assign to a different period.
                  </p>
                </div>
              )}

              {/* Subject Selection */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Subject Name *</label>
                <select
                  required
                  value={editSlotModal.subject}
                  onChange={(e) => {
                    const selSub = subjects.find(s => s.name === e.target.value)
                    setEditSlotModal({
                      ...editSlotModal,
                      subject: e.target.value,
                      subjectId: selSub?.id || ''
                    })
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="">-- Select Subject from Curriculum --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.name}>{s.name} ({s.code})</option>
                  ))}
                  <option value="Computer Science">Computer Science</option>
                  <option value="Physical Education">Physical Education</option>
                  <option value="Library & Reading">Library & Reading</option>
                </select>
              </div>

              {/* Teacher Selection */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Assigned Teacher *</label>
                <select
                  required
                  value={editSlotModal.teacherId}
                  onChange={(e) => {
                    const found = teachers.find(t => String(t.id) === String(e.target.value))
                    setConflictError(null) // Reset conflict when teacher changes
                    setEditSlotModal({
                      ...editSlotModal,
                      teacherId: e.target.value,
                      teacherName: found?.fullName || ''
                    })
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-amber-500 outline-none text-emerald-900"
                >
                  <option value="">-- Select Assigned Faculty Member --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.qualification || t.employeeId || 'Faculty'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Room Location */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Classroom / Lab Location</label>
                <input
                  type="text"
                  placeholder="e.g. Room 101 or Science Lab A"
                  value={editSlotModal.room}
                  onChange={(e) => setEditSlotModal({ ...editSlotModal, room: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setConflictError(null)
                    setEditSlotModal({ open: false, day: '', periodId: '', periodLabel: '', startTime: '', endTime: '', subject: '', subjectId: '', teacherId: '', teacherName: '', room: '' })
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>

                {/* Clear / Free Period Button if currently occupied */}
                {editSlotModal.subject && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={async () => {
                      const activeClassId = selectedTimetableClassId || classes[0]?.id
                      setConflictError(null)
                      setSubmitting(true)
                      try {
                        await api.delete(`/timetable/slot?classId=${activeClassId}&dayOfWeek=${editSlotModal.day}&periodId=${editSlotModal.periodId}&academicYear=2025-2026`)
                        setMessage({ type: 'success', text: `Slot cleared successfully!` })
                        setTimeout(() => setMessage(null), 2500)
                        setEditSlotModal({ open: false, day: '', periodId: '', periodLabel: '', startTime: '', endTime: '', subject: '', subjectId: '', teacherId: '', teacherName: '', room: '' })
                        await fetchClassTimetable(activeClassId)
                      } catch (err) {
                        setConflictError(err.response?.data?.message || 'Failed to clear slot')
                      } finally {
                        setSubmitting(false)
                      }
                    }}
                    className="px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200"
                    title="Mark this slot as free period"
                  >
                    Clear Slot
                  </button>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#0F2942] hover:bg-slate-900 text-amber-400 font-extrabold shadow-md flex items-center justify-center gap-1.5"
                >
                  {submitting ? 'Checking & Saving...' : 'Save & Sync Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════ CONFIGURE TIMETABLE PERIODS & DAYS MODAL ═══════════════ */}
      {editPeriodsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-lg w-full border border-slate-200 relative">
            <div className="bg-[#0F2942] text-white px-6 py-4 flex items-center justify-between border-b-4 border-amber-500">
              <div className="flex items-center gap-2">
                <HiClock className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold tracking-tight">Configure Timetable Slots & Days</h3>
              </div>
              <button onClick={() => setEditPeriodsModal(false)} className="p-1 rounded-full text-slate-300 hover:bg-white/10">
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-2">Active Academic Days</label>
                <div className="flex flex-wrap gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                    const active = timetableDays.includes(day)
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const newDays = active
                            ? timetableDays.filter(d => d !== day)
                            : [...timetableDays, day]
                          setTimetableDays(newDays)
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                          active ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {day} {active ? '✓' : '+'}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-700 uppercase">
                    Configured Period Timing Slots ({timetablePeriods.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const pNum = timetablePeriods.length + 1
                      const newP = {
                        periodId: `p${pNum}`,
                        periodLabel: `Period ${pNum}`,
                        startTime: '02:30 PM',
                        endTime: '03:15 PM',
                        sortOrder: pNum
                      }
                      setTimetablePeriods([...timetablePeriods, newP])
                    }}
                    className="text-[11px] font-extrabold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200"
                  >
                    + Add Period Slot
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {timetablePeriods.map((p, pIdx) => (
                    <div key={p.periodId || p.id || pIdx} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                      <input
                        type="text"
                        value={p.periodLabel || p.label || ''}
                        onChange={(e) => {
                          const updated = [...timetablePeriods]
                          updated[pIdx].periodLabel = e.target.value
                          setTimetablePeriods(updated)
                        }}
                        className="w-24 px-2 py-1 rounded border border-slate-300 font-bold text-slate-800"
                        placeholder="Period Label"
                      />
                      <input
                        type="text"
                        value={p.startTime || ''}
                        onChange={(e) => {
                          const updated = [...timetablePeriods]
                          updated[pIdx].startTime = e.target.value
                          setTimetablePeriods(updated)
                        }}
                        className="w-24 px-2 py-1 rounded border border-slate-300 font-mono text-slate-700"
                        placeholder="Start Time"
                      />
                      <span className="text-slate-400 font-bold">-</span>
                      <input
                        type="text"
                        value={p.endTime || ''}
                        onChange={(e) => {
                          const updated = [...timetablePeriods]
                          updated[pIdx].endTime = e.target.value
                          setTimetablePeriods(updated)
                        }}
                        className="w-24 px-2 py-1 rounded border border-slate-300 font-mono text-slate-700"
                        placeholder="End Time"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditPeriodsModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await api.post('/timetable/config', timetablePeriods)
                      setEditPeriodsModal(false)
                      const activeClassId = selectedTimetableClassId || classes[0]?.id
                      await fetchClassTimetable(activeClassId)
                      setMessage({ type: 'success', text: 'Timetable period timings updated in database!' })
                      setTimeout(() => setMessage(null), 3000)
                    } catch (err) {
                      alert('Failed to save period configs')
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#0F2942] text-amber-400 font-extrabold shadow-md"
                >
                  Save Timings to DB
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ ADD CLASS MODAL ═══════════════ */}
      {showAddClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full border border-slate-200 relative">
            <div className="bg-[#0F2942] text-white px-6 py-4 flex items-center justify-between border-b-4 border-amber-500">
              <div className="flex items-center gap-2">
                <HiBuildingLibrary className="w-6 h-6 text-amber-400" />
                <h3 className="text-base font-extrabold tracking-tight">Add New Class Section</h3>
              </div>
              <button onClick={() => setShowAddClass(false)} className="p-1 rounded-full text-slate-300 hover:bg-white/10">
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Class / Grade Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grade 10 or UKG"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Section *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A"
                    value={classSection}
                    onChange={(e) => setClassSection(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-amber-500 outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Display Order</label>
                  <input
                    type="number"
                    required
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Designate Class Teacher</label>
                <select
                  value={selectedClassTeacherId}
                  onChange={(e) => setSelectedClassTeacherId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50"
                >
                  <option value="">-- Select Class Teacher --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.fullName} ({t.employeeId || 'ID'})</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1 italic">Class Teacher receives full access permissions across all subjects of this section.</p>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddClass(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#0F2942] hover:bg-slate-900 text-amber-400 font-extrabold uppercase shadow"
                >
                  {submitting ? 'Saving...' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════ EDIT CLASS MODAL ═══════════════ */}
      {editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full border border-slate-200 relative">
            <div className="bg-[#0F2942] text-white px-6 py-4 flex items-center justify-between border-b-4 border-blue-500">
              <div className="flex items-center gap-2">
                <HiPencilSquare className="w-6 h-6 text-blue-400" />
                <h3 className="text-base font-extrabold tracking-tight">Edit Class Section</h3>
              </div>
              <button onClick={() => setEditingClass(null)} className="p-1 rounded-full text-slate-300 hover:bg-white/10">
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateClass} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Class / Grade Name *</label>
                <input
                  type="text"
                  required
                  value={editingClass.name}
                  onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Section *</label>
                  <input
                    type="text"
                    required
                    value={editingClass.section}
                    onChange={(e) => setEditingClass({ ...editingClass, section: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Display Order</label>
                  <input
                    type="number"
                    required
                    value={editingClass.sortOrder}
                    onChange={(e) => setEditingClass({ ...editingClass, sortOrder: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Designate Class Teacher</label>
                <select
                  value={editingClass.classTeacherId || ''}
                  onChange={(e) => setEditingClass({ ...editingClass, classTeacherId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                >
                  <option value="">-- Select Class Teacher --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.fullName} ({t.employeeId || 'ID'})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold uppercase shadow"
                >
                  {submitting ? 'Saving...' : 'Update Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════ ADD SUBJECT MODAL ═══════════════ */}
      {showAddSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full border border-slate-200 relative">
            <div className="bg-[#0F2942] text-white px-6 py-4 flex items-center justify-between border-b-4 border-amber-500">
              <div className="flex items-center gap-2">
                <HiBookOpen className="w-6 h-6 text-amber-400" />
                <h3 className="text-base font-extrabold tracking-tight">Add Subject to Curriculum</h3>
              </div>
              <button onClick={() => setShowAddSubject(false)} className="p-1 rounded-full text-slate-300 hover:bg-white/10">
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Subject Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PHY or MATH"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-amber-500 outline-none uppercase font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Subject Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physics & Mechanics"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddSubject(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold uppercase shadow"
                >
                  {submitting ? 'Saving...' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
