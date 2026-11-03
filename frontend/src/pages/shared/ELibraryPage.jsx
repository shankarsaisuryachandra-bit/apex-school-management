import { useState, useEffect } from 'react'
import api from '../../api/axiosConfig'
import {
  HiBookOpen, HiMagnifyingGlass, HiPlus, HiXMark, HiTrash,
  HiAcademicCap, HiPhoto, HiDocumentText, HiSparkles, HiArrowDownTray,
  HiEye, HiGlobeAlt, HiBuildingLibrary, HiCheckBadge, HiArrowTopRightOnSquare
} from 'react-icons/hi2'
import { useAuth } from '../../auth/AuthContext'

export default function ELibraryPage() {
  const { user } = useAuth()
  const isTeacher = user?.role === 'TEACHER'
  const isManagement = user?.role === 'MANAGEMENT'
  const isStudent = user?.role === 'STUDENT'
  const isStaff = isTeacher || isManagement
  const studentId = user?.profileId || user?.userId || 1
  const teacherId = user?.profileId || user?.userId || 1

  const [activeTab, setActiveTab] = useState(isTeacher ? 'my_uploads' : 'all_materials') // 'my_uploads' | 'all_materials' | 'institute_wide' | 'textbooks'
  const [materials, setMaterials] = useState([])
  const [digitalBooks, setDigitalBooks] = useState([])
  const [search, setSearch] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('ALL')
  const [loading, setLoading] = useState(true)

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [uploadFormData, setUploadFormData] = useState({
    title: '',
    description: '',
    classId: '',
    subjectId: '',
    fileType: 'PDF',
    isInstituteWide: isManagement, // Admin can default to institute-wide
    authorOrSource: ''
  })
  const [selectedFile, setSelectedFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  // Media Preview modal (PDF / Photo)
  const [previewMedia, setPreviewMedia] = useState(null)

  useEffect(() => {
    fetchMaterialsAndBooks()
    if (isStaff) {
      fetchClassesAndSubjects()
    }
  }, [])

  const fetchMaterialsAndBooks = async () => {
    setLoading(true)
    try {
      let url = '/library/e-books'
      if (isStudent) {
        url = `/library/e-books?studentId=${studentId}`
      } else if (isTeacher) {
        url = `/library/e-books?teacherId=${teacherId}`
      }
      const res = await api.get(url)
      const data = res.data || {}
      setMaterials(data.teacherMaterials || [])
      setDigitalBooks(data.digitalBooks || [])
    } catch (err) {
      console.error('Failed to load study materials and e-books:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchClassesAndSubjects = async () => {
    try {
      if (isTeacher) {
        // Teachers only see their assigned subjects and classes
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
        const classList = Array.from(classMap.values())
        const subList = Array.from(subMap.values())
        setClasses(classList)
        setSubjects(subList)
        if (classList.length > 0) {
          setUploadFormData(prev => ({
            ...prev,
            classId: classList[0].id.toString(),
            subjectId: subList.length > 0 ? subList[0].id.toString() : ''
          }))
        }
      } else {
        // Admin / Management can access all classes and subjects
        const [cRes, sRes] = await Promise.all([
          api.get('/academics/classes'),
          api.get('/academics/subjects')
        ])
        setClasses(cRes.data || [])
        setSubjects(sRes.data || [])
      }
    } catch (err) {
      console.error('Failed to load classes and subjects:', err)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)

    const isImg = file.type.startsWith('image/')
    setUploadFormData(prev => ({
      ...prev,
      fileType: isImg ? 'IMAGE' : 'PDF'
    }))

    if (isImg) {
      const reader = new FileReader()
      reader.onloadend = () => setFilePreview(reader.result)
      reader.readAsDataURL(file)
    } else {
      setFilePreview(null)
    }
  }

  const handleUploadSubmit = async (e) => {
    e.preventDefault()
    if (!uploadFormData.title) {
      setMessage('Please provide a title for the material.')
      return
    }
    if (!selectedFile) {
      setMessage('Please select a PDF file or photo/diagram to upload.')
      return
    }
    if (isTeacher && (!uploadFormData.classId || !uploadFormData.subjectId)) {
      setMessage('Please select your assigned Class and Subject.')
      return
    }

    setUploading(true)
    setMessage('')
    try {
      // 1. Upload file via CMS endpoint
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
        classId: uploadFormData.isInstituteWide ? null : (uploadFormData.classId ? parseInt(uploadFormData.classId) : null),
        subjectId: uploadFormData.isInstituteWide ? null : (uploadFormData.subjectId ? parseInt(uploadFormData.subjectId) : null),
        teacherId: isTeacher ? teacherId : null,
        fileUrl: fileUrl,
        fileType: uploadFormData.fileType,
        isInstituteWide: isManagement ? uploadFormData.isInstituteWide : false,
        authorOrSource: uploadFormData.authorOrSource || (isTeacher ? user?.fullName : 'Academic Administration')
      })

      setMessage(
        uploadFormData.isInstituteWide
          ? 'Book / Document broadcasted to all students throughout the institute!'
          : 'Study material uploaded successfully for your class!'
      )
      setTimeout(() => {
        setMessage('')
        setShowUploadModal(false)
        setSelectedFile(null)
        setFilePreview(null)
        setUploadFormData({
          title: '',
          description: '',
          classId: classes.length > 0 ? classes[0].id.toString() : '',
          subjectId: subjects.length > 0 ? subjects[0].id.toString() : '',
          fileType: 'PDF',
          isInstituteWide: isManagement,
          authorOrSource: ''
        })
        fetchMaterialsAndBooks()
      }, 1500)
    } catch (err) {
      console.error('Upload failed:', err)
      setMessage(err.response?.data?.message || 'Failed to upload study material.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to remove "${title}"?`)) return
    try {
      await api.delete(`/library/e-books/${id}`)
      setMaterials(prev => prev.filter(m => m.id !== id))
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete material')
    }
  }

  // Filter items
  const uniqueSubjects = [
    'ALL',
    ...new Set([
      ...materials.map(m => m.subject?.name || (m.isInstituteWide ? 'General Institute' : 'General')),
      ...digitalBooks.map(b => b.subject)
    ])
  ]

  const filteredMaterials = materials.filter(item => {
    const itemSub = item.subject?.name || (item.isInstituteWide ? 'General Institute' : 'General')
    const matchSub = selectedSubject === 'ALL' || itemSub === selectedSubject
    const matchSearch =
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase()) ||
      item.authorOrSource?.toLowerCase().includes(search.toLowerCase()) ||
      item.teacher?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      itemSub.toLowerCase().includes(search.toLowerCase())

    if (activeTab === 'institute_wide') {
      return (item.isInstituteWide || !item.schoolClass) && matchSub && matchSearch
    }
    if (activeTab === 'my_uploads' && isTeacher) {
      return matchSub && matchSearch
    }
    return matchSub && matchSearch
  })

  const filteredBooks = digitalBooks.filter(book => {
    const matchSub = selectedSubject === 'ALL' || book.subject === selectedSubject
    const matchSearch =
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author.toLowerCase().includes(search.toLowerCase()) ||
      book.subject.toLowerCase().includes(search.toLowerCase())
    return matchSub && matchSearch
  })

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-900 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <HiBookOpen className="w-6 h-6" />
            </span>
            {isTeacher
              ? 'Teacher E-Library & Study Materials'
              : isManagement
              ? 'Institute E-Library & Document Distribution'
              : 'Digital E-Library & Learning Hub'}
          </h1>
          <p className="text-surface-700/60 mt-1">
            {isTeacher
              ? 'Upload and manage subject study notes, photo diagrams, and PDFs for your assigned classes'
              : isManagement
              ? 'Distribute textbooks, documents, and study materials throughout the institute to all students'
              : 'Access faculty lecture diagrams, subject notes, and digital reference textbooks'}
          </p>
        </div>

        {isStaff && (
          <button
            onClick={() => {
              setMessage('')
              setShowUploadModal(true)
            }}
            className="btn-primary text-sm flex items-center gap-2 shadow-lg shadow-primary-600/20"
            id="open-upload-material-btn"
          >
            <HiPlus className="w-4 h-4" />
            {isManagement ? 'Broadcast Book / Doc' : 'Upload Study Material'}
          </button>
        )}
      </div>

      {/* Search and Subject Pill Bar */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <HiMagnifyingGlass className="w-5 h-5 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, subject, faculty, or topic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 py-2 text-sm"
            />
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-surface-100 rounded-xl w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab(isTeacher ? 'my_uploads' : 'all_materials')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'my_uploads' || activeTab === 'all_materials'
                  ? 'bg-white text-primary-700 shadow-xs'
                  : 'text-surface-600 hover:text-surface-900'
              }`}
            >
              <HiAcademicCap className="w-4 h-4" />
              {isTeacher ? 'My Class Materials' : 'Faculty Study Notes'}
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-primary-100 text-primary-800 text-[10px]">
                {materials.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('institute_wide')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'institute_wide'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-surface-600 hover:text-surface-900'
              }`}
            >
              <HiGlobeAlt className="w-4 h-4 text-amber-600" />
              Institute-Wide Broadcasts
            </button>

            <button
              onClick={() => setActiveTab('textbooks')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'textbooks'
                  ? 'bg-white text-violet-700 shadow-xs'
                  : 'text-surface-600 hover:text-surface-900'
              }`}
            >
              <HiBookOpen className="w-4 h-4" />
              Digital Textbooks
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-violet-100 text-violet-800 text-[10px]">
                {digitalBooks.length}
              </span>
            </button>
          </div>
        </div>

        {/* Subject Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-surface-200/60 pb-1">
          <span className="text-xs font-bold text-surface-500 uppercase tracking-wider whitespace-nowrap mr-1">
            Subject:
          </span>
          {uniqueSubjects.map(sub => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedSubject === sub
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-surface-100 text-surface-700 hover:bg-surface-200'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      {loading ? (
        <div className="card p-12 text-center text-surface-400 animate-pulse">
          <HiBookOpen className="w-10 h-10 mx-auto mb-2 text-surface-300" />
          Loading digital study materials...
        </div>
      ) : activeTab === 'textbooks' ? (
        <div>
          {filteredBooks.length === 0 ? (
            <div className="card p-12 text-center text-surface-500">
              <HiBookOpen className="w-12 h-12 mx-auto mb-2 text-surface-300" />
              <p className="font-semibold">No reference textbooks match your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredBooks.map(book => (
                <div key={book.id} className="card p-5 hover:shadow-md transition-all flex flex-col justify-between border border-surface-200">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 rounded-md bg-violet-100 text-violet-800 text-xs font-bold">
                        {book.subject}
                      </span>
                      <span className="text-xs font-mono text-surface-400">{book.readTime}</span>
                    </div>
                    <h3 className="font-bold text-surface-900 line-clamp-2 mb-1">{book.title}</h3>
                    <p className="text-xs text-surface-500 mb-4">By {book.author}</p>
                  </div>
                  <div className="pt-3 border-t border-surface-200/60 flex items-center justify-between">
                    <span className="text-xs font-bold text-surface-400">PDF E-Book</span>
                    <button
                      onClick={() => setPreviewMedia({ url: book.pdfUrl, title: book.title, type: 'pdf' })}
                      className="px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <HiEye className="w-3.5 h-3.5" /> Read Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {filteredMaterials.length === 0 ? (
            <div className="card p-12 text-center text-surface-500">
              <HiDocumentText className="w-12 h-12 mx-auto mb-2 text-surface-300" />
              <p className="font-bold text-lg text-surface-800">No study materials found</p>
              <p className="text-sm text-surface-500 mt-1">
                {isTeacher
                  ? 'Click "Upload Study Material" above to share diagrams and notes with your class!'
                  : 'Check back later or change the search and subject filters.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredMaterials.map(m => {
                const isPhoto = m.fileType === 'IMAGE'
                const isInstitute = m.isInstituteWide || !m.schoolClass
                const className = m.schoolClass ? `${m.schoolClass.name} - ${m.schoolClass.section}` : 'Entire School'
                const subjectName = m.subject?.name || (isInstitute ? 'Institute Broadcast' : 'General Notes')
                const facultyName = m.authorOrSource || m.teacher?.fullName || 'Faculty'

                return (
                  <div
                    key={m.id}
                    className="card p-5 hover:shadow-lg transition-all flex flex-col justify-between border border-surface-200 relative group"
                  >
                    {/* Top Badges */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 ${
                          isInstitute
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-primary-100 text-primary-800'
                        }`}>
                          {isInstitute ? <HiGlobeAlt className="w-3.5 h-3.5" /> : <HiAcademicCap className="w-3.5 h-3.5" />}
                          {subjectName}
                        </span>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          isPhoto ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {isPhoto ? '📷 Photo' : '📄 PDF'}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="font-bold text-surface-900 text-base line-clamp-2 mb-1.5 group-hover:text-primary-600 transition-colors">
                        {m.title}
                      </h3>
                      {m.description && (
                        <p className="text-xs text-surface-600 line-clamp-2 mb-3">
                          {m.description}
                        </p>
                      )}

                      {/* Photo Thumbnail if Image */}
                      {isPhoto && m.fileUrl && (
                        <div
                          onClick={() => setPreviewMedia({ url: m.fileUrl, title: m.title, type: 'image' })}
                          className="w-full h-32 rounded-xl bg-surface-100 mb-3 overflow-hidden cursor-pointer border border-surface-200 relative group/img flex items-center justify-center"
                        >
                          <img
                            src={m.fileUrl}
                            alt={m.title}
                            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform"
                            onError={(e) => { e.target.style.display = 'none' }}
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                            <HiEye className="w-4 h-4" /> Click to Zoom
                          </div>
                        </div>
                      )}

                      {/* Meta information */}
                      <div className="space-y-1 text-xs text-surface-500 mb-3 bg-surface-50 p-2.5 rounded-xl border border-surface-100">
                        <div className="flex justify-between">
                          <span className="text-surface-400">Target Class:</span>
                          <span className="font-semibold text-surface-700">{className}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-surface-400">By:</span>
                          <span className="font-semibold text-primary-700 truncate max-w-[140px]">{facultyName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-surface-400">Date:</span>
                          <span className="font-mono text-surface-600">{m.uploadedDate || 'Recent'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-3 border-t border-surface-200/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setPreviewMedia({ url: m.fileUrl, title: m.title, type: isPhoto ? 'image' : 'pdf' })}
                          className="px-3 py-1.5 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <HiEye className="w-3.5 h-3.5" /> View
                        </button>
                        <a
                          href={m.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="p-1.5 rounded-lg bg-surface-100 hover:bg-surface-200 text-surface-600 text-xs transition-colors"
                          title="Open full file / download"
                        >
                          <HiArrowDownTray className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      {/* Delete button (Admin or owning Teacher) */}
                      {(isManagement || (isTeacher && m.teacher?.id === teacherId)) && (
                        <button
                          onClick={() => handleDelete(m.id, m.title)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                          title="Delete material"
                        >
                          <HiTrash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Upload Study Material Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in backdrop-blur-xs">
          <div className="card-glass w-full max-w-lg bg-white p-6 rounded-2xl shadow-2xl relative border border-surface-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 text-surface-400 hover:text-surface-900"
            >
              <HiXMark className="w-6 h-6" />
            </button>

            <h3 className="text-xl font-display font-bold text-surface-900 mb-1 flex items-center gap-2">
              <HiBookOpen className="w-6 h-6 text-primary-600" />
              {isManagement ? 'Broadcast Book or Document' : 'Upload Subject Study Material'}
            </h3>
            <p className="text-sm text-surface-700/60 mb-4">
              {isManagement
                ? 'Send documents or books to all students institute-wide or to a designated class'
                : 'Upload lecture PDFs, handwritten photo notes, or diagram images for your assigned class'}
            </p>

            {message && (
              <div className={`mb-4 p-3 rounded-xl text-sm font-medium border ${
                message.includes('successfully') || message.includes('broadcasted')
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : 'bg-red-100 text-red-800 border-red-200'
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Broadcast toggle for Admin */}
              {isManagement && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-amber-900 uppercase">
                    <input
                      type="checkbox"
                      checked={uploadFormData.isInstituteWide}
                      onChange={(e) => setUploadFormData({ ...uploadFormData, isInstituteWide: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-600"
                    />
                    📢 Broadcast throughout the Institute (All Students)
                  </label>
                  <p className="text-xs text-amber-800/80 pl-6">
                    When enabled, this document/e-book will be immediately accessible to every student across all grades.
                  </p>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">
                  Title / Subject Chapter *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 4: Photosynthesis & Light Reactions Diagram"
                  value={uploadFormData.title}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, title: e.target.value })}
                  className="input-field py-2 text-sm"
                />
              </div>

              {/* Class & Subject (If not institute-wide) */}
              {(!uploadFormData.isInstituteWide) && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">
                      Assigned Class *
                    </label>
                    <select
                      required
                      value={uploadFormData.classId}
                      onChange={(e) => setUploadFormData({ ...uploadFormData, classId: e.target.value })}
                      className="input-field py-2 text-sm font-medium"
                    >
                      <option value="">-- Select Class --</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.section ? `- Section ${c.section}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">
                      Subject *
                    </label>
                    <select
                      required
                      value={uploadFormData.subjectId}
                      onChange={(e) => setUploadFormData({ ...uploadFormData, subjectId: e.target.value })}
                      className="input-field py-2 text-sm font-medium"
                    >
                      <option value="">-- Select Subject --</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code || 'Sub'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">
                  Description / Study Guidelines
                </label>
                <textarea
                  rows="2"
                  placeholder="Key summary, exam preparation tips, or instructions for students..."
                  value={uploadFormData.description}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, description: e.target.value })}
                  className="input-field py-2 text-sm"
                />
              </div>

              {/* File Upload with Preview */}
              <div>
                <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">
                  Select File (PDF or Photo / Diagram) *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,image/*"
                  onChange={handleFileSelect}
                  className="block w-full text-xs text-surface-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                />
                <p className="text-[11px] text-surface-400 mt-1">
                  Supported: PDF documents, high-resolution photo notes (PNG, JPG, JPEG, WebP)
                </p>

                {filePreview && (
                  <div className="mt-2.5 p-2 rounded-xl border border-surface-200 bg-surface-50">
                    <p className="text-xs font-bold text-surface-700 mb-1">Photo Preview:</p>
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="max-h-36 rounded-lg object-contain mx-auto"
                    />
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  id="submit-study-material-btn"
                >
                  <HiPlus className="w-4 h-4" />
                  {uploading ? 'Publishing...' : 'Publish to Students'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Media Preview Modal (PDF / Photo) */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-surface-200">
            <div className="p-4 border-b border-surface-200 flex items-center justify-between bg-surface-50">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-primary-100 text-primary-700">
                  {previewMedia.type === 'image' ? <HiPhoto className="w-5 h-5" /> : <HiDocumentText className="w-5 h-5" />}
                </span>
                <div>
                  <h3 className="font-bold text-surface-900 text-base truncate max-w-md">{previewMedia.title}</h3>
                  <p className="text-xs text-surface-500 uppercase font-mono">{previewMedia.type === 'image' ? 'Photo / Diagram View' : 'PDF Document Viewer'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewMedia.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-surface-200 text-surface-700 hover:bg-surface-300 text-xs font-bold flex items-center gap-1"
                  title="Open in new tab"
                >
                  <HiArrowTopRightOnSquare className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setPreviewMedia(null)}
                  className="p-2 rounded-lg text-surface-500 hover:bg-surface-200 text-surface-700"
                >
                  <HiXMark className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-surface-900 flex items-center justify-center overflow-auto p-4">
              {previewMedia.type === 'image' ? (
                <img
                  src={previewMedia.url}
                  alt={previewMedia.title}
                  className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
                />
              ) : (
                <iframe
                  src={previewMedia.url}
                  title={previewMedia.title}
                  className="w-full h-full rounded-lg bg-white border-0"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
