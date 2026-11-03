import { useState, useEffect } from 'react'
import api from '../../api/axiosConfig'
import { HiClipboardDocumentList, HiCheck, HiXMark, HiClock, HiAcademicCap, HiCalendar } from 'react-icons/hi2'
import { FaWhatsapp } from 'react-icons/fa'
import { generateAbsenceAlertLink } from '../../utils/whatsappLink'

export default function AttendanceMarker() {
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState(null)
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null)
  const [selectedLabel, setSelectedLabel] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchAssignedClasses()
  }, [])

  const fetchAssignedClasses = async () => {
    try {
      const { data } = await api.get('/academics/my-classes')
      setClasses(data)
      if (data && data.length > 0) {
        const first = data[0]
        const cId = first.schoolClass?.id || first.classId
        const sId = first.subject?.id || first.subjectId || null
        const cName = first.schoolClass ? `${first.schoolClass.name} - ${first.schoolClass.section}` : 'Class'
        const sName = first.subject?.name || 'General Attendance'
        setSelectedClass(cId)
        setSelectedSubject(sId)
        setSelectedAssignmentId(first.id || `${cId}-${sId}`)
        setSelectedLabel(`${cName} (${sName})`)
        fetchAttendance(cId, sId, date)
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error)
    }
  }

  const fetchAttendance = async (classId, subjectId, targetDate = date) => {
    if (!classId) return
    try {
      const subParam = subjectId ? `&subjectId=${subjectId}` : ''
      const { data } = await api.get(`/attendance/class/${classId}?date=${targetDate}${subParam}`)
      setStudents(data)
      const existing = {}
      data.forEach((s) => {
        existing[s.studentId] = s.status !== 'NOT_MARKED' ? s.status : 'PRESENT'
      })
      setAttendance(existing)
    } catch (error) {
      console.error('Failed to fetch attendance:', error)
    }
  }

  const handleSelectAssignment = (item) => {
    const cId = item.schoolClass?.id || item.classId
    const sId = item.subject?.id || item.subjectId || null
    const cName = item.schoolClass ? `${item.schoolClass.name} - ${item.schoolClass.section}` : 'Class'
    const sName = item.subject?.name || 'General Attendance'
    setSelectedClass(cId)
    setSelectedSubject(sId)
    setSelectedAssignmentId(item.id || `${cId}-${sId}`)
    setSelectedLabel(`${cName} (${sName})`)
    fetchAttendance(cId, sId, date)
  }

  const handleDateChange = (newDate) => {
    const today = new Date().toISOString().split('T')[0]
    if (newDate > today) {
      alert(`Attendance cannot be marked for future date: ${newDate}. Only current or past dates are permitted.`)
      return
    }
    setDate(newDate)
    if (selectedClass) {
      fetchAttendance(selectedClass, selectedSubject, newDate)
    }
  }

  const toggleStatus = (studentId) => {
    const current = attendance[studentId] || 'PRESENT'
    const next = current === 'PRESENT' ? 'ABSENT' : current === 'ABSENT' ? 'LATE' : 'PRESENT'
    setAttendance({ ...attendance, [studentId]: next })
  }

  const markAll = (status) => {
    const updated = {}
    students.forEach((s) => { updated[s.studentId] = status })
    setAttendance(updated)
  }

  const saveAttendance = async () => {
    if (!selectedClass) return
    const today = new Date().toISOString().split('T')[0]
    if (date > today) {
      setMessage(`Attendance cannot be marked for future date: ${date}. System rejected request.`)
      setTimeout(() => setMessage(''), 5000)
      return
    }
    setSaving(true)
    try {
      const entries = Object.entries(attendance).map(([studentId, status]) => ({
        studentId: parseInt(studentId),
        status,
      }))
      const { data } = await api.post('/attendance/mark', {
        classId: selectedClass,
        subjectId: selectedSubject,
        date,
        entries,
      })
      setMessage(`Attendance saved for ${selectedLabel}! ${data.totalMarked} marked, ${data.absentCount} absent.`)
      setTimeout(() => setMessage(''), 5000)
    } catch (error) {
      setMessage('Failed to save attendance')
    } finally {
      setSaving(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PRESENT': return <HiCheck className="w-5 h-5" />
      case 'ABSENT': return <HiXMark className="w-5 h-5" />
      case 'LATE': return <HiClock className="w-5 h-5" />
      default: return null
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PRESENT': return 'bg-accent-500 text-white'
      case 'ABSENT': return 'bg-red-500 text-white'
      case 'LATE': return 'bg-amber-500 text-white'
      default: return 'bg-surface-200'
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-surface-900">Mark Attendance</h1>
        <p className="text-surface-700/60 mt-1">Individual subject-wise attendance register for your assigned classes</p>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-accent-100 text-accent-800 text-sm font-medium border border-accent-200">
          {message}
        </div>
      )}

      {/* Controls */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-end gap-5">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Attendance Date</label>
            <div className="relative">
              <input
                type="date"
                max={new Date().toISOString().split('T')[0]}
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="input-field w-48 font-medium"
              />
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-surface-700 mb-1">
              Assigned Class & Subject (Select one to take attendance)
            </label>
            <div className="flex flex-wrap gap-2">
              {classes.length === 0 ? (
                <span className="text-xs text-surface-400 py-2">No assigned classes found.</span>
              ) : (
                classes.map((c, i) => {
                  const classId = c.schoolClass?.id || c.classId
                  const subjectId = c.subject?.id || c.subjectId || null
                  const cName = c.schoolClass ? `${c.schoolClass.name} - ${c.schoolClass.section}` : 'Class'
                  const sName = c.subject?.name || 'General'
                  const keyId = c.id || `${classId}-${subjectId || i}`
                  const isSelected = selectedAssignmentId === keyId || (selectedClass === classId && selectedSubject === subjectId)

                  return (
                    <button
                      key={keyId}
                      onClick={() => handleSelectAssignment(c)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25 ring-2 ring-primary-400'
                          : 'bg-surface-100 text-surface-700 hover:bg-surface-200 border border-surface-200'
                      }`}
                    >
                      <HiAcademicCap className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-primary-600'}`} />
                      <span className="font-bold">{cName}</span>
                      <span className="opacity-60">|</span>
                      <span className={`text-xs px-2 py-0.5 rounded-md font-semibold ${
                        isSelected ? 'bg-primary-700 text-white' : 'bg-surface-200 text-surface-800'
                      }`}>
                        {sName}
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Register */}
      {selectedClass && (
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-surface-200/60">
            <div>
              <h2 className="text-lg font-display font-bold text-surface-900 flex items-center gap-2">
                <HiClipboardDocumentList className="w-5 h-5 text-primary-600" />
                {selectedLabel}
              </h2>
              <p className="text-xs text-surface-500 mt-0.5">
                Date: <span className="font-semibold text-surface-700">{date}</span> • Total Students: <span className="font-semibold text-surface-700">{students.length}</span>
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => markAll('PRESENT')}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-accent-100 text-accent-700 hover:bg-accent-200 transition-colors"
              >
                Mark All Present
              </button>
              <button
                onClick={() => markAll('ABSENT')}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
              >
                Mark All Absent
              </button>
            </div>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-8 text-surface-400">
              No students enrolled in this class.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {students.map((student) => {
                const currentStatus = attendance[student.studentId] || 'PRESENT'
                const isAbsent = currentStatus === 'ABSENT'
                const parentPhone = student.parentPhone || '9876543210'
                const waLink = generateAbsenceAlertLink(parentPhone, student.studentName, date)

                return (
                  <div
                    key={student.studentId}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isAbsent
                        ? 'bg-red-50/60 border-red-200 ring-1 ring-red-200'
                        : 'bg-surface-50 border-surface-200 hover:bg-surface-100'
                    }`}
                  >
                    <button
                      onClick={() => toggleStatus(student.studentId)}
                      title="Click to toggle status (Present / Absent / Late)"
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${getStatusColor(currentStatus)}`}
                    >
                      {getStatusIcon(currentStatus)}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-surface-900 truncate">{student.studentName}</p>
                      <p className="text-xs text-surface-700/50">
                        {student.admissionNumber || student.rollNumber ? `Roll: ${student.rollNumber || student.admissionNumber}` : 'Student'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isAbsent && (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Send Instant WhatsApp Absent Alert to Parent"
                          className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors"
                        >
                          <FaWhatsapp className="w-4 h-4" />
                          <span className="hidden sm:inline">Alert</span>
                        </a>
                      )}
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full border"
                        style={{
                          color: currentStatus === 'ABSENT' ? '#ef4444' : currentStatus === 'LATE' ? '#d97706' : '#10b981',
                          borderColor: currentStatus === 'ABSENT' ? '#fca5a5' : currentStatus === 'LATE' ? '#fde68a' : '#a7f3d0',
                          backgroundColor: currentStatus === 'ABSENT' ? '#fef2f2' : currentStatus === 'LATE' ? '#fffbeb' : '#ecfdf5',
                        }}
                      >
                        {currentStatus}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-surface-200 flex items-center justify-between gap-4 flex-wrap">
            <button
              onClick={saveAttendance}
              disabled={saving || students.length === 0}
              className="btn-primary flex items-center gap-2"
              id="save-attendance-btn"
            >
              <HiClipboardDocumentList className="w-5 h-5" />
              {saving ? 'Saving...' : `Save ${selectedLabel} Attendance`}
            </button>

            {/* Quick Bulk WhatsApp Alert indicator */}
            {students.filter(s => attendance[s.studentId] === 'ABSENT').length > 0 && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
                <FaWhatsapp className="w-5 h-5 text-emerald-600" />
                <span className="text-xs text-emerald-900 font-bold">
                  {students.filter(s => attendance[s.studentId] === 'ABSENT').length} Student(s) Absent for this Subject
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
