import { useState, useEffect } from 'react'
import api from '../../api/axiosConfig'
import {
  HiUsers, HiMagnifyingGlass, HiAcademicCap, HiUserPlus,
  HiXMark, HiKey, HiPencilSquare, HiSparkles, HiTrash,
  HiCheckCircle, HiExclamationTriangle, HiArrowPath
} from 'react-icons/hi2'

export default function StudentManagement() {
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL')

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCredModal, setShowCredModal] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: 'student123',
    admissionNumber: '',
    classId: '',
    dateOfBirth: '',
    gender: 'MALE',
    address: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    annualFee: '45000'
  })

  // Edit Student Form State
  const [editFormData, setEditFormData] = useState({
    id: null,
    fullName: '',
    admissionNumber: '',
    classId: '',
    dateOfBirth: '',
    gender: 'MALE',
    address: '',
    parentName: '',
    parentPhone: '',
    parentEmail: ''
  })

  // Credentials Modal State
  const [credData, setCredData] = useState({
    userId: null,
    studentName: '',
    username: '',
    password: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [sRes, cRes] = await Promise.all([
        api.get('/admin/students'),
        api.get('/admin/classes')
      ])
      const studentList = sRes.data || []
      const classList = cRes.data || []
      setStudents(studentList)
      setClasses(classList)

      // Set default class for new student if none selected
      if (classList.length > 0) {
        setFormData(prev => ({
          ...prev,
          classId: prev.classId || classList[0].id
        }))
      }
    } catch (error) {
      console.error('Failed to fetch student management data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Auto-generate admission number
  const handleAutoGenerateAdmissionNo = () => {
    const nextSeq = String(students.length + 1).padStart(3, '0')
    const candidate = `ADM2025${nextSeq}`
    setFormData(prev => ({ ...prev, admissionNumber: candidate }))
  }

  // Auto-generate username from full name
  const handleNameChange = (val) => {
    const cleanBase = val.toLowerCase().replace(/[^a-z0-9]/g, '')
    setFormData(prev => ({
      ...prev,
      fullName: val,
      // Auto-suggest username if user hasn't typed a custom one
      username: prev.username && !prev.username.startsWith(cleanBase.slice(0, 4))
        ? prev.username
        : cleanBase ? `${cleanBase}` : ''
    }))
  }

  const handleOpenAddModal = () => {
    setErrorMessage('')
    setSuccessMessage('')
    const nextSeq = String(students.length + 1).padStart(3, '0')
    setFormData({
      fullName: '',
      username: '',
      password: 'student123',
      admissionNumber: `ADM2025${nextSeq}`,
      classId: classes[0]?.id || '',
      dateOfBirth: '',
      gender: 'MALE',
      address: '',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      annualFee: '45000',
      previousPendingFee: ''
    })
    setShowAddModal(true)
  }

  // Handle Create Student
  const handleCreateStudent = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!formData.fullName.trim()) {
      setErrorMessage('Please enter the student\'s full name.')
      return
    }

    if (formData.dateOfBirth && formData.dateOfBirth.trim()) {
      const dobDate = new Date(formData.dateOfBirth.trim())
      const currentYear = new Date().getFullYear()
      const age = currentYear - dobDate.getFullYear()
      if (age < 2 || age > 40 || dobDate > new Date()) {
        setErrorMessage('Date of birth must represent a valid student age between 2 and 40 years.')
        return
      }
    }

    const annualFeeVal = parseFloat(formData.annualFee) || 0
    const prevFeeVal = parseFloat(formData.previousPendingFee) || 0
    if (annualFeeVal < 0 || annualFeeVal > 5000000 || prevFeeVal < 0 || prevFeeVal > 5000000) {
      setErrorMessage('Fee amounts must be in the permitted range [₹0 - ₹5,000,000].')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        username: formData.username.trim() || undefined,
        password: formData.password.trim() || 'student123',
        admissionNumber: formData.admissionNumber.trim() || undefined,
        classId: formData.classId ? parseInt(formData.classId) : null,
        dateOfBirth: formData.dateOfBirth.trim() || null,
        gender: formData.gender,
        address: formData.address.trim(),
        parentName: formData.parentName.trim(),
        parentPhone: formData.parentPhone.trim(),
        parentEmail: formData.parentEmail.trim() || null,
        annualFee: parseFloat(formData.annualFee) || 45000,
        previousPendingFee: parseFloat(formData.previousPendingFee) || 0
      }

      const res = await api.post('/admin/students', payload)
      const data = res.data

      setSuccessMessage(`Student registered successfully! Admission No: ${data.admissionNumber}, Login: ${data.username}`)

      setTimeout(() => {
        setSuccessMessage('')
        setShowAddModal(false)
        fetchData()
      }, 1600)
    } catch (error) {
      console.error('Add student error:', error)
      setErrorMessage(error.response?.data?.message || 'Failed to add student. Please check the entered details.')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Edit Student
  const handleOpenEditModal = (s) => {
    setErrorMessage('')
    setSuccessMessage('')
    setEditFormData({
      id: s.id,
      fullName: s.fullName || '',
      admissionNumber: s.admissionNumber || '',
      classId: s.schoolClass?.id || '',
      dateOfBirth: s.dateOfBirth || '',
      gender: s.gender || 'MALE',
      address: s.address || '',
      parentName: '',
      parentPhone: '',
      parentEmail: ''
    })
    setShowEditModal(true)
  }

  const handleUpdateStudent = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setSubmitting(true)

    try {
      await api.put(`/admin/students/${editFormData.id}`, {
        fullName: editFormData.fullName,
        classId: editFormData.classId ? parseInt(editFormData.classId) : null,
        dateOfBirth: editFormData.dateOfBirth || null,
        gender: editFormData.gender,
        address: editFormData.address,
        parentName: editFormData.parentName,
        parentPhone: editFormData.parentPhone,
        parentEmail: editFormData.parentEmail
      })

      setSuccessMessage('Student details updated successfully!')
      setTimeout(() => {
        setSuccessMessage('')
        setShowEditModal(false)
        fetchData()
      }, 1400)
    } catch (error) {
      console.error('Update student error:', error)
      setErrorMessage(error.response?.data?.message || 'Failed to update student details')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Delete / Deactivate Student
  const handleDeleteStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to deactivate student "${studentName}"?`)) {
      return
    }
    try {
      await api.delete(`/admin/students/${studentId}`)
      fetchData()
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to deactivate student')
    }
  }

  // Handle Update Credentials
  const handleUpdateCredentials = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      await api.put(`/admin/users/${credData.userId}/credentials`, {
        username: credData.username,
        password: credData.password
      })
      setSuccessMessage('Login credentials updated successfully!')
      setTimeout(() => {
        setSuccessMessage('')
        setShowCredModal(false)
        fetchData()
      }, 1500)
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to update credentials')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredStudents = students.filter(s => {
    const matchClass =
      selectedClassFilter === 'ALL' ||
      s.schoolClass?.id === parseInt(selectedClassFilter)

    const matchSearch =
      s.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.schoolClass?.name?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchClass && matchSearch
  })

  return (
    <div className="animate-fade-in space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-[#0F2942] to-slate-900 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <HiUsers className="w-4 h-4" /> Student Management Directory
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-extrabold text-white">
            Student Admissions & Accounts
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Register students, allocate classes, manage login credentials, and track admissions.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98]"
        >
          <HiUserPlus className="w-5 h-5 stroke-2" />
          <span>Add New Student</span>
        </button>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 flex flex-col justify-center">
          <p className="text-xs font-bold text-surface-500 uppercase tracking-wider">Total Enrolled</p>
          <p className="text-2xl font-display font-extrabold text-surface-900 mt-1">{students.length}</p>
        </div>
        <div className="card p-4 flex flex-col justify-center">
          <p className="text-xs font-bold text-surface-500 uppercase tracking-wider">Active Classes</p>
          <p className="text-2xl font-display font-extrabold text-primary-700 mt-1">{classes.length}</p>
        </div>
        <div className="card p-4 flex flex-col justify-center">
          <p className="text-xs font-bold text-surface-500 uppercase tracking-wider">Boys</p>
          <p className="text-2xl font-display font-extrabold text-blue-600 mt-1">
            {students.filter(s => s.gender === 'MALE').length}
          </p>
        </div>
        <div className="card p-4 flex flex-col justify-center">
          <p className="text-xs font-bold text-surface-500 uppercase tracking-wider">Girls</p>
          <p className="text-2xl font-display font-extrabold text-pink-600 mt-1">
            {students.filter(s => s.gender === 'FEMALE').length}
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <HiMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search by student name, username, or admission no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 py-2 text-sm w-full"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-surface-500 uppercase tracking-wide">Class:</span>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="input-field py-1.5 px-3 text-sm rounded-xl"
            >
              <option value="ALL">All Classes ({classes.length})</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.section}</option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchData}
            className="p-2 rounded-xl border border-surface-200 text-surface-700 hover:bg-surface-50 text-xs font-semibold transition-colors"
            title="Refresh List"
          >
            <HiArrowPath className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Student Table */}
      <div className="card p-6 rounded-3xl">
        {loading ? (
          <div className="animate-pulse text-surface-500 py-8 text-center font-medium">
            Loading student records...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <HiUsers className="w-12 h-12 text-surface-300 mx-auto mb-2" />
            <p className="text-surface-700 font-bold text-sm">No students found matching your search</p>
            <p className="text-surface-500 text-xs mt-1">Try modifying your query or click "Add New Student".</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Admission No</th>
                  <th>Student Name</th>
                  <th>Login Username</th>
                  <th>Class</th>
                  <th>Gender</th>
                  <th>DOB</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s, idx) => (
                  <tr key={s.id}>
                    <td className="text-surface-400 text-xs font-semibold">{idx + 1}</td>
                    <td className="font-mono text-sm font-bold text-primary-700">{s.admissionNumber}</td>
                    <td className="font-semibold text-surface-900">{s.fullName}</td>
                    <td>
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-surface-100 text-primary-800 flex items-center gap-1.5 w-fit">
                        <HiKey className="w-3.5 h-3.5 text-amber-600" />
                        {s.user?.username || 'None'}
                      </span>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-xl bg-surface-100 text-surface-800">
                        <HiAcademicCap className="w-3.5 h-3.5 text-primary-600" />
                        {s.schoolClass ? `${s.schoolClass.name} ${s.schoolClass.section}` : 'N/A'}
                      </span>
                    </td>
                    <td className="text-xs uppercase font-semibold text-surface-600">{s.gender || '—'}</td>
                    <td className="text-sm text-surface-600">{s.dateOfBirth || '—'}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setCredData({
                              userId: s.user?.id,
                              studentName: s.fullName,
                              username: s.user?.username || '',
                              password: ''
                            })
                            setErrorMessage('')
                            setSuccessMessage('')
                            setShowCredModal(true)
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-bold flex items-center gap-1 transition-colors"
                          title="Manage Credentials"
                        >
                          <HiKey className="w-3.5 h-3.5 text-amber-600" />
                          Login
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(s)}
                          className="p-1.5 rounded-lg text-surface-600 hover:bg-surface-100 hover:text-surface-900 transition-colors"
                          title="Edit Student Profile"
                        >
                          <HiPencilSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(s.id, s.fullName)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                          title="Deactivate Student"
                        >
                          <HiTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ADD STUDENT MODAL */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="card-glass w-full max-w-lg bg-white p-6 sm:p-7 rounded-3xl shadow-2xl relative border border-surface-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-surface-400 hover:text-surface-900 hover:bg-surface-100 transition-colors"
            >
              <HiXMark className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-2xl bg-amber-500 text-slate-950 font-bold">
                <HiUserPlus className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-xl font-display font-extrabold text-surface-900">
                  Register New Student
                </h3>
                <p className="text-xs text-surface-500">Create student record and assign login credentials</p>
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="my-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2 animate-fade-in">
                <HiExclamationTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message Alert */}
            {successMessage && (
              <div className="my-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
                <HiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateStudent} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-1.5">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={formData.fullName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="input-field py-2 text-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide">
                      Admission Number *
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoGenerateAdmissionNo}
                      className="text-[11px] text-amber-700 font-bold hover:underline flex items-center gap-0.5"
                    >
                      <HiSparkles className="w-3 h-3 text-amber-600" /> Auto-Gen
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ADM2025005"
                    value={formData.admissionNumber}
                    onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                    className="input-field py-2 text-sm font-mono font-semibold"
                  />
                </div>
              </div>

              {/* Login Credentials Section */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-2">
                <p className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <HiKey className="w-4 h-4 text-amber-600" /> Student Login Credentials
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-surface-700 uppercase mb-1">
                      Username (Login ID) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. alex.morgan"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="input-field py-2 text-sm bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-surface-700 uppercase mb-1">
                      Initial Password *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Default password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="input-field py-2 text-sm bg-white font-mono"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-amber-800">
                  Student will use this username and password to log in to the student portal.
                </p>
              </div>

              {/* Class, Gender, DOB */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-1.5">
                    Assign Class
                  </label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="input-field py-2 text-sm"
                  >
                    <option value="">-- Choose Class --</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-1.5">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="input-field py-2 text-sm"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-1.5">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="input-field py-2 text-sm"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-1.5">
                  Residential Address
                </label>
                <input
                  type="text"
                  placeholder="Street, locality, city..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input-field py-2 text-sm"
                />
              </div>

              {/* Parent Info */}
              <div className="p-3.5 rounded-2xl bg-surface-50 border border-surface-200/80 space-y-2.5">
                <p className="text-xs font-bold text-surface-700 uppercase tracking-wide">
                  Parent / Guardian Details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-surface-600 uppercase mb-1">
                      Parent / Guardian Name
                    </label>
                    <input
                      type="text"
                      placeholder="Father / Mother name"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      className="input-field py-2 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-surface-600 uppercase mb-1">
                      Phone Number (WhatsApp)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210"
                      value={formData.parentPhone}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      className="input-field py-2 text-sm bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Fee Configuration */}
              <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-surface-800 uppercase tracking-wide">
                    Institutional Fee Setup
                  </p>
                  <span className="text-[10px] text-amber-700 font-extrabold bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                    Accounts Engine
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-surface-600 uppercase mb-1">
                      Annual Tuition Fee (₹) *
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 45000"
                      value={formData.annualFee}
                      onChange={(e) => setFormData({ ...formData, annualFee: e.target.value })}
                      className="input-field py-2 text-sm font-semibold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-amber-800 uppercase mb-1">
                      Previous Pending Fee (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 5000 (carried over dues)"
                      value={formData.previousPendingFee}
                      onChange={(e) => setFormData({ ...formData, previousPendingFee: e.target.value })}
                      className="input-field py-2 text-sm font-semibold bg-white text-amber-900 border-amber-300 focus:border-amber-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Any outstanding balance from past session/school
                    </p>
                  </div>
                </div>

                {/* Total Fee Preview */}
                {(formData.annualFee || formData.previousPendingFee) && (
                  <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-xs font-bold text-surface-800">
                    <span className="text-slate-500 text-[11px]">Initial Grand Total Billed:</span>
                    <span className="font-extrabold text-[#0F2942]">
                      ₹{((parseFloat(formData.annualFee) || 0) + (parseFloat(formData.previousPendingFee) || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary flex-1 py-2.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex-1 py-2.5 font-bold flex items-center justify-center gap-2"
                >
                  {submitting ? 'Registering...' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* EDIT STUDENT MODAL */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="card-glass w-full max-w-lg bg-white p-6 sm:p-7 rounded-3xl shadow-2xl relative border border-surface-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-surface-400 hover:text-surface-900 hover:bg-surface-100 transition-colors"
            >
              <HiXMark className="w-6 h-6" />
            </button>

            <h3 className="text-xl font-display font-extrabold text-surface-900 mb-1 flex items-center gap-2">
              <HiPencilSquare className="w-5 h-5 text-primary-600" />
              Edit Student Profile
            </h3>
            <p className="text-xs text-surface-500 mb-4">{editFormData.admissionNumber}</p>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <HiExclamationTriangle className="w-4 h-4 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <HiCheckCircle className="w-4 h-4 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleUpdateStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-1.5">
                  Student Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.fullName}
                  onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                  className="input-field py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-1.5">
                    Class
                  </label>
                  <select
                    value={editFormData.classId}
                    onChange={(e) => setEditFormData({ ...editFormData, classId: e.target.value })}
                    className="input-field py-2 text-sm"
                  >
                    <option value="">-- Class --</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-1.5">
                    Gender
                  </label>
                  <select
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                    className="input-field py-2 text-sm"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-1.5">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={editFormData.dateOfBirth}
                    onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                    className="input-field py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-1.5">
                  Address
                </label>
                <input
                  type="text"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="input-field py-2 text-sm"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary flex-1 py-2.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex-1 py-2.5 font-bold"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* EDIT CREDENTIALS MODAL */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {showCredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="card-glass w-full max-w-md bg-white p-6 sm:p-7 rounded-3xl shadow-2xl relative border border-surface-200">
            <button
              onClick={() => setShowCredModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-surface-400 hover:text-surface-900 hover:bg-surface-100 transition-colors"
            >
              <HiXMark className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-display font-extrabold text-surface-900 mb-1 flex items-center gap-2">
              <HiKey className="w-5 h-5 text-amber-600" />
              Update Student Login
            </h3>
            <p className="text-xs text-surface-500 mb-4">{credData.studentName}</p>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <HiExclamationTriangle className="w-4 h-4 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <HiCheckCircle className="w-4 h-4 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleUpdateCredentials} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-1.5">
                  Login Username
                </label>
                <input
                  type="text"
                  required
                  value={credData.username}
                  onChange={(e) => setCredData({ ...credData, username: e.target.value })}
                  className="input-field py-2 text-sm font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-1.5">
                  New Password (leave blank to keep unchanged)
                </label>
                <input
                  type="text"
                  placeholder="Enter new password"
                  value={credData.password}
                  onChange={(e) => setCredData({ ...credData, password: e.target.value })}
                  className="input-field py-2 text-sm font-mono"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCredModal(false)}
                  className="btn-secondary flex-1 py-2.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex-1 py-2.5 font-bold"
                >
                  {submitting ? 'Saving...' : 'Update Login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
