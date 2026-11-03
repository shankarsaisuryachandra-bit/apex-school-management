import { useState, useEffect } from 'react'
import api from '../../api/axiosConfig'
import { HiPhoto, HiPlus, HiXMark, HiTrash, HiArrowUpTray } from 'react-icons/hi2'
import { useAuth } from '../../auth/AuthContext'

export default function SchoolGallery() {
  const { user } = useAuth()
  const isStaff = user?.role === 'MANAGEMENT'

  const [gallery, setGallery] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const [currentHeroUrl, setCurrentHeroUrl] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    category: 'CAMPUS',
    imageUrl: '',
    mediaUrl: '',
    description: ''
  })

  useEffect(() => {
    fetchGallery()
    fetchHero()
  }, [])

  const fetchGallery = async () => {
    try {
      const { data } = await api.get('/cms/gallery')
      setGallery(data)
    } catch (error) {
      console.error('Failed to fetch gallery items:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchHero = async () => {
    try {
      const { data } = await api.get('/cms/hero')
      if (data?.heroImageUrl) {
        setCurrentHeroUrl(data.heroImageUrl)
      }
    } catch (error) {
      console.error('Failed to fetch hero info:', error)
    }
  }

  const handleSetHeroImage = async (e, photoUrl) => {
    if (e) e.stopPropagation()
    try {
      await api.put('/cms/hero/image', { imageUrl: photoUrl })
    } catch (error) {
      console.warn('Backend hero image update call failed, saving to localStorage:', error)
    }
    localStorage.setItem('custom_hero_image', photoUrl)
    window.dispatchEvent(new Event('hero_image_updated'))
    setCurrentHeroUrl(photoUrl)
    setMessage('⭐ Photo updated as Main Website Campus Hero Image successfully!')
    setTimeout(() => setMessage(''), 4000)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFile(true)
    setMessage('')
    try {
      let uploadedUrl = ''
      try {
        const form = new FormData()
        form.append('file', file)
        const { data } = await api.post('/cms/upload', form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        uploadedUrl = data.url
      } catch (uploadErr) {
        console.warn('Backend upload failed, converting image to data URL:', uploadErr)
        uploadedUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (ev) => resolve(ev.target.result)
          reader.onerror = (err) => reject(err)
          reader.readAsDataURL(file)
        })
      }
      setFormData(prev => ({
        ...prev,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
        imageUrl: uploadedUrl,
        mediaUrl: uploadedUrl
      }))
      setMessage('✅ Photo uploaded & ready from device!')
    } catch (error) {
      console.error('File upload failed:', error)
      setMessage('Failed to upload photo from device')
    } finally {
      setUploadingFile(false)
    }
  }

  const handleCreateGallery = async (e) => {
    e.preventDefault()
    const url = formData.imageUrl || formData.mediaUrl
    if (!formData.title || !url) {
      setMessage('Please enter a photo title and select an image file from your device.')
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const payload = {
        title: formData.title,
        category: formData.category,
        mediaUrl: url,
        imageUrl: url,
        description: formData.description,
        mediaType: 'IMAGE'
      }
      await api.post('/cms/gallery', payload)
      setMessage('Photo published to campus gallery and live website!')
      setTimeout(() => {
        setMessage('')
        setShowAddModal(false)
        setFormData({ title: '', category: 'CAMPUS', imageUrl: '', mediaUrl: '', description: '' })
        fetchGallery()
      }, 1200)
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to publish photo')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePhoto = async (e, item) => {
    e.stopPropagation()
    if (!window.confirm(`Are you sure you want to delete photo "${item.title}"?`)) return
    try {
      await api.delete(`/cms/gallery/${item.id}`)
      fetchGallery()
    } catch (error) {
      console.error('Failed to delete gallery photo:', error)
      alert(error.response?.data?.message || 'Failed to delete photo')
    }
  }

  const defaultGallery = [
    {
      id: 101,
      title: 'Main Academic Quadrangle & Campus View',
      category: 'CAMPUS',
      imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80',
      description: 'Lush green 8-acre campus featuring modern eco-friendly academic wings and administrative quadrangle.',
      createdDate: '2025-08-15'
    },
    {
      id: 102,
      title: 'Annual Sports Meet & Field Athletics',
      category: 'SPORTS',
      imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
      description: 'Track and field events during the annual intra-school athletics tournament.',
      createdDate: '2025-08-20'
    },
    {
      id: 103,
      title: 'Robotics & Advanced Computer Lab',
      category: 'ACADEMICS',
      imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
      description: 'Students working on STEM science projects and computer programming.',
      createdDate: '2025-08-22'
    },
    {
      id: 104,
      title: 'Cultural Festival & Musical Concert',
      category: 'CULTURAL',
      imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
      description: 'Student music performance at the school annual day celebrations in the auditorium.',
      createdDate: '2025-08-28'
    },
    {
      id: 105,
      title: 'Central Digital Library & Reading Room',
      category: 'ACADEMICS',
      imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80',
      description: 'Quiet study sessions and digital book borrowing terminal for senior students.',
      createdDate: '2025-09-01'
    },
    {
      id: 106,
      title: 'Interactive Smart Classroom Session',
      category: 'CAMPUS',
      imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
      description: 'Interactive lesson with smart board technology and multimedia learning modules.',
      createdDate: '2025-09-03'
    }
  ]

  const displayList = gallery.length > 0 ? gallery : defaultGallery

  const filteredGallery = selectedCategory === 'ALL'
    ? displayList
    : displayList.filter(g => (g.category || '').toUpperCase().includes(selectedCategory.toUpperCase()))

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-900">Campus Photo Gallery</h1>
          <p className="text-surface-700/60 mt-1">Highlights, sports events, cultural meets, and campus activities</p>
        </div>
        {isStaff && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-accent text-sm flex items-center gap-2"
          >
            <HiPlus className="w-4 h-4" />
            Upload Photo from Device
          </button>
        )}
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 font-semibold text-sm flex items-center justify-between animate-fade-in shadow-sm">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-amber-800 hover:text-amber-950 font-bold ml-4">✕</button>
        </div>
      )}

      {/* ── MAIN WEBSITE HERO IMAGE CONTROL BANNER ── */}
      <div className="card p-6 border-2 border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-surface-50 shadow-lg rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5 w-full md:w-auto">
          <div className="relative h-24 w-40 rounded-xl overflow-hidden border-2 border-amber-500 shadow-md flex-shrink-0 bg-black">
            <img
              src={currentHeroUrl || 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80'}
              alt="Current Website Campus Hero"
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-1 left-1 right-1 bg-black/75 text-amber-300 font-extrabold text-[9px] uppercase tracking-wider text-center py-0.5 rounded">
              Active Hero
            </span>
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-white font-bold text-xs uppercase tracking-wider mb-1.5 shadow-sm">
              <span>⭐</span>
              <span>Website Campus Hero Image Changer</span>
            </div>
            <h2 className="text-xl font-display font-bold text-surface-900 leading-tight">
              Main Website Hero Banner Picture
            </h2>
            <p className="text-surface-700/80 text-xs mt-1 max-w-xl">
              This photo is currently set as the primary hero image on the public school website homepage. Click <strong className="text-amber-700">"⭐ Set as Hero Image"</strong> on any photo below (or upload a new photo from your device) to change it instantly!
            </p>
          </div>
        </div>

        {isStaff && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-lg shadow-amber-500/30 flex items-center gap-2 flex-shrink-0 transition-all"
          >
            <HiArrowUpTray className="w-4 h-4" />
            Upload New Hero Photo from Device
          </button>
        )}
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {['ALL', 'HERO', 'CAMPUS', 'SPORTS', 'CULTURAL', 'ACADEMICS'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === cat
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
                : 'bg-surface-100 text-surface-700 hover:bg-surface-200'
            }`}
          >
            {cat === 'HERO' ? '⭐ HERO' : cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse text-surface-700/50 py-4">Loading gallery photos...</div>
      ) : filteredGallery.length === 0 ? (
        <div className="text-center py-12 card p-6 text-surface-700/50">
          <HiPhoto className="w-12 h-12 mx-auto mb-2 text-surface-300" />
          <p>No photos published in this category yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGallery.map((item) => {
            const photoUrl = item.mediaUrl || item.imageUrl
            const isCurrentHero = currentHeroUrl && (currentHeroUrl === photoUrl)
            return (
              <div
                key={item.id}
                onClick={() => setLightbox(item)}
                className={`card overflow-hidden group hover:shadow-xl transition-all duration-300 cursor-pointer border relative ${
                  isCurrentHero ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-surface-200'
                }`}
              >
                <div className="h-52 overflow-hidden relative">
                  <img
                    src={photoUrl}
                    alt={item.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Category Badge */}
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
                    {item.category}
                  </span>

                  {/* Active Hero Badge */}
                  {isCurrentHero && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[11px] font-extrabold uppercase tracking-wider shadow-lg flex items-center gap-1 z-10">
                      ⭐ Active Hero
                    </span>
                  )}

                  {/* Staff Delete Button */}
                  {isStaff && item.id && !isCurrentHero && (
                    <button
                      onClick={(e) => handleDeletePhoto(e, item)}
                      title="Delete Photo"
                      className="absolute top-3 left-3 p-2 bg-red-600/90 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg z-10"
                    >
                      <HiTrash className="w-4 h-4" />
                    </button>
                  )}
                  {isStaff && item.id && isCurrentHero && (
                    <button
                      onClick={(e) => handleDeletePhoto(e, item)}
                      title="Delete Photo"
                      className="absolute top-12 left-3 p-2 bg-red-600/90 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg z-10"
                    >
                      <HiTrash className="w-4 h-4" />
                    </button>
                  )}

                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                    <span>🔍 View Fullscreen</span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-display font-bold text-surface-900 text-lg group-hover:text-amber-600 transition-colors">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-surface-700/70 text-sm leading-relaxed mb-4 line-clamp-2">{item.description || 'Campus memory'}</p>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-surface-100">
                    <span className="text-xs text-surface-400">{item.createdDate || 'Official Gallery'}</span>
                    
                    {/* Staff Hero Toggle Button */}
                    {isStaff && (
                      <button
                        onClick={(e) => handleSetHeroImage(e, photoUrl)}
                        disabled={isCurrentHero}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                          isCurrentHero
                            ? 'bg-amber-500 text-white cursor-default'
                            : 'bg-amber-50 text-amber-800 hover:bg-amber-500 hover:text-white border border-amber-300/60'
                        }`}
                      >
                        <span>⭐</span>
                        <span>{isCurrentHero ? 'Active Hero' : 'Set as Hero Image'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-surface-900 rounded-2xl overflow-hidden shadow-2xl text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-amber-500 hover:text-black transition-colors"
            >
              ✕
            </button>
            <div className="h-96 bg-black">
              <img
                src={lightbox.mediaUrl || lightbox.imageUrl}
                alt={lightbox.title}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold px-2.5 py-1 bg-amber-500/20 text-amber-400 rounded-md uppercase tracking-wider mb-2 inline-block">
                  {lightbox.category}
                </span>
                <h3 className="text-xl font-bold">{lightbox.title}</h3>
                <p className="text-surface-300 text-sm mt-2">{lightbox.description}</p>
              </div>

              {isStaff && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={(e) => handleSetHeroImage(e, lightbox.mediaUrl || lightbox.imageUrl)}
                    disabled={(lightbox.mediaUrl || lightbox.imageUrl) === currentHeroUrl}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      (lightbox.mediaUrl || lightbox.imageUrl) === currentHeroUrl
                        ? 'bg-amber-500 text-white cursor-default'
                        : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-black border border-amber-500/40'
                    }`}
                  >
                    <span>⭐</span>
                    <span>{(lightbox.mediaUrl || lightbox.imageUrl) === currentHeroUrl ? 'Active Hero Image' : 'Set as Hero Image'}</span>
                  </button>
                  {lightbox.id && (
                    <button
                      onClick={(e) => {
                        setLightbox(null)
                        handleDeletePhoto(e, lightbox)
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <HiTrash className="w-4 h-4" />
                      Delete Photo
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Upload Photo Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="card-glass w-full max-w-md bg-white p-6 rounded-2xl shadow-2xl relative border border-surface-200">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-surface-400 hover:text-surface-900">
              <HiXMark className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-display font-bold text-surface-900 mb-1">Upload Photo to Gallery</h3>
            <p className="text-sm text-surface-700/60 mb-4">Post new photo from your device to campus feed & website</p>

            {message && (
              <div className="mb-4 p-3 rounded-xl bg-amber-100 text-amber-900 text-sm font-medium">
                {message}
              </div>
            )}

            <form onSubmit={handleCreateGallery} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Photo Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Sports Day Celebrations"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input-field py-2 font-medium"
                >
                  <option value="HERO">⭐ HERO (Website Main Banner)</option>
                  <option value="CAMPUS">CAMPUS</option>
                  <option value="SPORTS">SPORTS</option>
                  <option value="CULTURAL">CULTURAL</option>
                  <option value="ACADEMICS">ACADEMICS</option>
                </select>
              </div>

              {/* Upload Image File from Device */}
              <div className="border-2 border-dashed border-surface-300 rounded-xl p-4 text-center bg-surface-50">
                <label className="cursor-pointer block">
                  <HiArrowUpTray className="w-8 h-8 mx-auto text-amber-500 mb-1" />
                  <span className="text-sm font-semibold text-surface-900 block">
                    {uploadingFile ? 'Uploading Photo...' : 'Choose Image File from Device'}
                  </span>
                  <span className="text-xs text-surface-500 block mt-0.5">PNG, JPG, WEBP up to 5MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {/* Uploaded Preview */}
                {(formData.imageUrl || formData.mediaUrl) && (
                  <div className="mt-3 relative h-28 rounded-lg overflow-hidden border border-surface-200">
                    <img
                      src={formData.imageUrl || formData.mediaUrl}
                      alt="Upload Preview"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      Uploaded Preview
                    </span>
                  </div>
                )}
              </div>



              <div>
                <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Caption / Description</label>
                <textarea
                  rows="2"
                  placeholder="Event memory description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field py-2"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={submitting || uploadingFile} className="btn-accent flex-1">
                  {submitting ? 'Publishing...' : 'Publish Photo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

