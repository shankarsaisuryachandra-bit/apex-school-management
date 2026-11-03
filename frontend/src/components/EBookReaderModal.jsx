import { useState, useEffect } from 'react'
import api from '../api/axiosConfig'
import {
  HiXMark, HiBookOpen, HiArrowTopRightOnSquare, HiMagnifyingGlass,
  HiAcademicCap, HiPhoto, HiDocumentText, HiPlus, HiEye, HiSparkles,
  HiTrash, HiArrowDownTray
} from 'react-icons/hi2'
import { useAuth } from '../auth/AuthContext'

export default function EBookReaderModal({ onClose }) {
  const { user } = useAuth()
  const isTeacher = user?.role === 'TEACHER'
  const isManagement = user?.role === 'MANAGEMENT'
  const isStudent = user?.role === 'STUDENT'
  const isStaff = isTeacher || isManagement
  const studentId = user?.profileId || user?.userId || 1
  const teacherId = user?.profileId || user?.userId || 1

  const [activeTab, setActiveTab] = useState('teacher') // 'teacher' | 'textbooks'
  const [teacherMaterials, setTeacherMaterials] = useState([])
  const [digitalBooks, setDigitalBooks] = useState([])
  const [search, setSearch] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('ALL')
  const [loading, setLoading] = useState(true)

  // Upload modal state (for teachers / staff)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [uploadFormData, setUploadFormData] = useState({
    title: '',
    description: '',
    classId: '',
    subjectId: '',
    fileType: 'PDF'
  })
  const [selectedFile, setSelectedFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  // Media Preview Modal (PDF / Photo)
  const [previewMedia, setPreviewMedia] = useState(null) // { url, title, type: 'image' | 'pdf' }

  useEffect(() => {
    fetchMaterialsAndBooks()
    if (isStaff) {
      fetchTeacherClassesAndSubjects()
    }
  }, [])

  const fetchMaterialsAndBooks = async () => {
    setLoading(true)
    try {
      const url = isStudent
        ? `/library/e-books?studentId=${studentId}`
        : `/library/e-books`
      const res = await api.get(url)
      const data = res.data || {}
      setTeacherMaterials(data.teacherMaterials || [])
      setDigitalBooks(data.digitalBooks || [])
    } catch (err) {
      console.error('Failed to load study materials and e-books:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeacherClassesAndSubjects = async () => {
    try {
      if (isTeacher) {
        const myClassesRes = await api.get('/academics/my-classes')
        const tAssignments = myClassesRes.data || []
        const classMap = new Map()
        const subMap = new Map()
        tAssignments.forEach(item => {
          if (item.schoolClass && !classMap.has(item.schoolClass.id)) {
            classMap.set(item.schoolClass.id, item.schoolClass)
          }
          if (item.subject && !subMap.has(item.subject.id)) {
            subMap.set(item.subject.id, item.subject)
          }
        })
        setClasses(Array.from(classMap.values()))
        setSubjects(Array.from(subMap.values()))
      } else {
        const [cRes, sRes] = await Promise.all([
          api.get('/academics/classes'),
          api.get('/academics/subjects')
        ])
        setClasses(cRes.data || [])
        setSubjects(sRes.data || [])
      }
    } catch (err) {
      console.error('Failed to load classes for upload modal:', err)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (ev) => setFilePreview(ev.target.result)
      reader.readAsDataURL(file)
      setUploadFormData(prev => ({ ...prev, fileType: 'IMAGE' }))
    } else {
      setFilePreview(null)
      setUploadFormData(prev => ({ ...prev, fileType: 'PDF' }))
    }
  }

  const handleUploadMaterial = async (e) => {
    e.preventDefault()
    if (!uploadFormData.title || !selectedFile) return
    setUploading(true)
    setMessage('')

    try {
      // 1. Upload file
      const uploadData = new FormData()
      uploadData.append('file', selectedFile)
      const uploadRes = await api.post('/cms/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const fileUrl = uploadRes.data?.url

      // 2. Save study material record
      await api.post('/library/e-books', {
        title: uploadFormData.title,
        description: uploadFormData.description,
        classId: uploadFormData.classId ? parseInt(uploadFormData.classId) : null,
        subjectId: uploadFormData.subjectId ? parseInt(uploadFormData.subjectId) : null,
        teacherId: teacherId,
        fileUrl: fileUrl,
        fileType: uploadFormData.fileType
      })

      setMessage('Study material published successfully for your class!')
      setTimeout(() => {
        setMessage('')
        setShowUploadModal(false)
        setSelectedFile(null)
        setFilePreview(null)
        setUploadFormData({
          title: '',
          description: '',
          classId: '',
          subjectId: '',
          fileType: 'PDF'
        })
        fetchMaterialsAndBooks()
      }, 1400)
    } catch (err) {
      console.error('Failed to upload material:', err)
      setMessage(err.response?.data?.message || 'Failed to upload study material')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteMaterial = async (id) => {
    if (!window.confirm('Are you sure you want to delete this study material?')) return
    try {
      await api.delete(`/library/e-books/${id}`)
      setTeacherMaterials(prev => prev.filter(m => m.id !== id))
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete study material')
    }
  }

  const openPreview = (url, title, type = 'pdf') => {
    if (!url) return
    const isImg = type === 'IMAGE' || url.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i)
    setPreviewMedia({
      url,
      title,
      type: isImg ? 'image' : 'pdf'
    })
  }

  // Filter lists
  const filteredTeacherMaterials = teacherMaterials.filter((m) => {
    const matchSearch =
      m.title?.toLowerCase().includes(search.toLowerCase()) ||
      m.description?.toLowerCase().includes(search.toLowerCase()) ||
      m.subject?.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.authorOrSource?.toLowerCase().includes(search.toLowerCase())
    const matchSubject =
      selectedSubject === 'ALL' || m.subject?.id === parseInt(selectedSubject)
    return matchSearch && matchSubject
  })

  const filteredDigitalBooks = digitalBooks.filter((b) => {
    const matchSearch =
      b.title?.toLowerCase().includes(search.toLowerCase()) ||
      b.subject?.toLowerCase().includes(search.toLowerCase()) ||
      b.author?.toLowerCase().includes(search.toLowerCase())
    return matchSearch
  })

  // Extract distinct subjects
  const allAvailableSubjects = Array.from(
    new Set(teacherMaterials.map(m => m.subject).filter(Boolean).map(s => JSON.stringify({ id: s.id, name: s.name })))
  ).map(s => JSON.parse(s))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-full border border-slate-200 relative max-h-[90vh] flex flex-col">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-[#0F2942] to-slate-900 text-white px-6 py-5 flex items-center justify-between border-b-4 border-amber-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md">
              <HiBookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-display font-extrabold tracking-tight">
                Digital E-Book & Study Material Library
              </h3>
              <p className="text-xs text-amber-200">
                {isStudent
                  ? 'Access study materials, handwritten notes & PDFs updated by your class faculty'
                  : 'Manage and access digital study materials, lecture diagrams, and reference textbooks'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isStaff && (
              <button
                onClick={() => {
                  setShowUploadModal(true)
                  setSelectedFile(null)
                  setFilePreview(null)
                  setMessage('')
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all hover:scale-[1.02]"
              >
                <HiPlus className="w-4 h-4 stroke-2" />
                <span>Upload Material (PDF/Photo)</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-300 hover:bg-white/10 transition-colors"
            >
              <HiXMark className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tab Navigation & Search Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-2 bg-slate-200/80 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('teacher')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                activeTab === 'teacher'
                  ? 'bg-[#0F2942] text-amber-400 shadow-md'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <HiAcademicCap className="w-4 h-4" />
              <span>Faculty Notes & Materials ({teacherMaterials.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('textbooks')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                activeTab === 'textbooks'
                  ? 'bg-[#0F2942] text-amber-400 shadow-md'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <HiBookOpen className="w-4 h-4" />
              <span>Reference E-Books ({digitalBooks.length})</span>
            </button>
          </div>

          {/* Search & Subject Filter */}
          <div className="flex items-center gap-2 flex-1 sm:max-w-md justify-end">
            {activeTab === 'teacher' && allAvailableSubjects.length > 0 && (
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="py-2 px-3 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-800"
              >
                <option value="ALL">All Subjects</option>
                {allAvailableSubjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}

            <div className="relative flex-1">
              <HiMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search notes, topics, formulas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-20 text-center text-slate-400 font-medium animate-pulse">
              Loading library materials and faculty notes...
            </div>
          ) : activeTab === 'teacher' ? (
            /* TAB 1: TEACHER STUDY MATERIALS (PDFs & PHOTOS) */
            filteredTeacherMaterials.length === 0 ? (
              <div className="text-center py-16 p-8 rounded-3xl border border-dashed border-slate-300 bg-slate-50/50">
                <HiAcademicCap className="w-14 h-14 mx-auto mb-2 text-slate-300" />
                <h4 className="font-bold text-slate-800 text-base">No Faculty Notes Uploaded Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  {isTeacher
                    ? 'Upload PDF worksheets, handwritten notes, or whiteboard photo diagrams for your class using the "Upload Material" button above!'
                    : 'Your class teachers have not posted any supplementary study materials yet.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTeacherMaterials.map((m) => {
                  const isImage = m.fileType === 'IMAGE' || (m.fileUrl && m.fileUrl.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i))
                  return (
                    <div
                      key={m.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-amber-400 transition-all shadow-sm flex flex-col justify-between space-y-3 group"
                    >
                      <div>
                        {/* Top Badges */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase">
                              {m.subject?.name || 'General Subject'}
                            </span>
                            {m.schoolClass?.name && (
                              <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-bold">
                                {m.schoolClass.name} {m.schoolClass.section ? `(${m.schoolClass.section})` : ''}
                              </span>
                            )}
                          </div>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold flex items-center gap-1 ${
                            isImage ? 'bg-indigo-100 text-indigo-900' : 'bg-rose-100 text-rose-900'
                          }`}>
                            {isImage ? <HiPhoto className="w-3 h-3" /> : <HiDocumentText className="w-3 h-3" />}
                            {isImage ? 'PHOTO / DIAGRAM' : 'PDF DOCUMENT'}
                          </span>
                        </div>

                        {/* Title & Description */}
                        <h4 className="font-display font-bold text-slate-900 text-base leading-snug group-hover:text-amber-700 transition-colors">
                          {m.title}
                        </h4>
                        {m.description && (
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
                            {m.description}
                          </p>
                        )}
                      </div>

                      {/* Footer & Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="text-[11px] text-slate-500 font-medium">
                          <span>By <strong>{m.authorOrSource || m.teacher?.fullName || 'Faculty'}</strong></span>
                          <span className="mx-1">•</span>
                          <span>{m.uploadedDate}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isStaff && (
                            <button
                              onClick={() => handleDeleteMaterial(m.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Material"
                            >
                              <HiTrash className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => openPreview(m.fileUrl, m.title, m.fileType)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1 shadow-sm transition-all hover:scale-[1.02]"
                          >
                            <HiEye className="w-3.5 h-3.5 stroke-2" />
                            <span>{isImage ? 'View Photo' : 'Read PDF'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          ) : (
            /* TAB 2: DIGITAL REFERENCE TEXTBOOKS */
            filteredDigitalBooks.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-500">
                No matching reference e-books found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDigitalBooks.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 transition-all shadow-sm flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <span className="inline-block px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-900 text-[10px] font-extrabold uppercase">
                        {b.subject}
                      </span>
                      <h4 className="text-sm font-extrabold text-slate-900 truncate">{b.title}</h4>
                      <p className="text-xs text-slate-500 font-medium">
                        Author: {b.author} • Est. Read: {b.readTime}
                      </p>
                    </div>
                    <button
                      onClick={() => openPreview(b.pdfUrl, b.title, 'pdf')}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors flex-shrink-0 shadow-sm"
                    >
                      <span>Read</span>
                      <HiArrowTopRightOnSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TEACHER UPLOAD MATERIAL MODAL */}
      {/* ========================================================================= */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="card-glass w-full max-w-lg bg-white p-6 sm:p-7 rounded-3xl shadow-2xl relative border border-surface-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowUploadModal(false)}
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
                  Publish Study Material / E-Book
                </h3>
                <p className="text-xs text-surface-500">
                  Share notes, worksheets, formula sheets (PDF or Photo) with your class
                </p>
              </div>
            </div>

            {message && (
              <div className="my-4 p-3.5 rounded-2xl bg-amber-100 border border-amber-200 text-amber-900 text-sm font-semibold flex items-center gap-2">
                <HiSparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            <form onSubmit={handleUploadMaterial} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-1.5">
                  Material Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 5 — Organic Chemistry Mechanisms Diagram"
                  value={uploadFormData.title}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, title: e.target.value })}
                  className="input-field py-2.5 text-sm"
                />
              </div>

              {/* Class & Subject Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-1.5">
                    Target Class *
                  </label>
                  <select
                    required
                    value={uploadFormData.classId}
                    onChange={(e) => setUploadFormData({ ...uploadFormData, classId: e.target.value })}
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
                    value={uploadFormData.subjectId}
                    onChange={(e) => setUploadFormData({ ...uploadFormData, subjectId: e.target.value })}
                    className="input-field py-2 text-sm"
                  >
                    <option value="">-- Choose Subject --</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code || 'SUB'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-1.5">
                  Brief Summary / Topics Covered
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Important formulas for upcoming mid-term board tests..."
                  value={uploadFormData.description}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, description: e.target.value })}
                  className="input-field py-2 text-sm"
                />
              </div>

              {/* Upload File Input (PDF or Photo) */}
              <div>
                <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-1.5">
                  Attach Study Document or Photo (PDF / JPG / PNG) *
                </label>
                <div className="border-2 border-dashed border-amber-300 rounded-2xl p-5 text-center hover:bg-amber-50/40 transition-colors relative">
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    required
                    onChange={handleFileSelect}
                    className="hidden"
                    id="material-file-upload"
                  />
                  <label htmlFor="material-file-upload" className="cursor-pointer flex flex-col items-center">
                    <HiPhoto className="w-8 h-8 text-amber-600 mb-1.5" />
                    <span className="text-sm font-bold text-slate-900">
                      {selectedFile ? selectedFile.name : 'Click to select PDF notes or Photo diagram'}
                    </span>
                    <span className="text-xs text-slate-500 mt-0.5">
                      Supports PDF, PNG, JPG (up to 25MB). Students will be able to view and study this file.
                    </span>
                  </label>

                  {filePreview && (
                    <div className="mt-3 p-2 bg-white rounded-xl border border-surface-200 inline-block">
                      <img src={filePreview} alt="Preview" className="max-h-36 rounded-lg object-contain mx-auto" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="btn-secondary flex-1 py-2.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="btn-primary flex-1 py-2.5 font-bold flex items-center justify-center gap-2"
                >
                  {uploading ? 'Publishing...' : 'Publish to Students'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MEDIA PREVIEW MODAL (PDF / PHOTO VIEWER) */}
      {/* ========================================================================= */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 animate-fade-in">
          <div className="bg-white w-full max-w-4xl p-4 sm:p-6 rounded-3xl shadow-2xl relative border border-slate-200 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="min-w-0 pr-4">
                <h4 className="font-display font-bold text-slate-900 text-base truncate">
                  {previewMedia.title}
                </h4>
                <p className="text-xs text-slate-500">
                  {previewMedia.type === 'image' ? 'Image / Photo Diagram Viewer' : 'PDF Document Viewer'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewMedia.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <HiArrowTopRightOnSquare className="w-4 h-4" />
                  <span>Open in Tab</span>
                </a>
                <button
                  onClick={() => setPreviewMedia(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <HiXMark className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center p-2 bg-slate-900/5 rounded-2xl min-h-[350px]">
              {previewMedia.type === 'image' ? (
                <img
                  src={previewMedia.url}
                  alt={previewMedia.title}
                  className="max-h-[72vh] w-auto object-contain rounded-xl shadow-md"
                />
              ) : (
                <iframe
                  src={previewMedia.url}
                  title={previewMedia.title}
                  className="w-full h-[72vh] rounded-xl border border-slate-200 shadow-inner"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
