import { useState, useEffect, useRef } from 'react'
import api from '../../api/axiosConfig'
import {
  HiPaintBrush, HiPlus, HiTrash, HiPencil, HiCheck, HiXMark,
  HiPhoto, HiGlobeAlt, HiStar, HiChartBar, HiChatBubbleLeftRight,
  HiInformationCircle, HiEye, HiArrowUpTray, HiCheckCircle,
  HiExclamationTriangle, HiSparkles, HiBuildingLibrary,
  HiArrowsUpDown, HiHome
} from 'react-icons/hi2'

/* ────────────────────────── Helpers ────────────────────────── */
const TABS = [
  { id: 'hero',         label: 'Hero Section',    icon: HiHome },
  { id: 'info',         label: 'School Info',      icon: HiGlobeAlt },
  { id: 'pillars',      label: 'Pillars of Excellence', icon: HiSparkles },
  { id: 'stats',        label: 'Stats Bar',        icon: HiChartBar },
  { id: 'facilities',   label: 'Facilities',       icon: HiBuildingLibrary },
  { id: 'achievements', label: 'Achievements',     icon: HiStar },
  { id: 'testimonials', label: 'Testimonials',     icon: HiChatBubbleLeftRight },
  { id: 'gallery',      label: 'Campus Gallery',   icon: HiPhoto },
]

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white text-sm font-semibold animate-slide-up
      ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
      {type === 'success' ? <HiCheckCircle className="w-5 h-5" /> : <HiExclamationTriangle className="w-5 h-5" />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><HiXMark className="w-4 h-4" /></button>
    </div>
  )
}

function SectionCard({ title, icon: Icon, color = 'bg-primary-600', children, action }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <h2 className="font-display font-bold text-surface-900 text-base">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function ImageUploadField({ label, value, onUpload, onUrlChange }) {
  const fileRef = useRef()
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      let uploadedUrl = ''
      try {
        const fd = new FormData()
        fd.append('file', file)
        const { data } = await api.post('/cms/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        uploadedUrl = data.url
      } catch (uploadErr) {
        console.warn('Backend upload failed, converting to data URL:', uploadErr)
        uploadedUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (ev) => resolve(ev.target.result)
          reader.onerror = (err) => reject(err)
          reader.readAsDataURL(file)
        })
      }
      onUpload(uploadedUrl)
    } catch (err) {
      alert('Failed to process image file')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-2">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="Paste URL or upload file →"
          className="input-field py-2 text-sm flex-1"
        />
        <button
          type="button"
          onClick={() => fileRef.current.click()}
          disabled={uploading}
          className="px-4 py-2 rounded-xl bg-primary-50 hover:bg-primary-100 border border-primary-200 text-primary-700 text-xs font-bold flex items-center gap-1.5 transition-colors flex-shrink-0"
        >
          <HiArrowUpTray className="w-4 h-4" />
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>
      {value && (
        <div className="mt-2 relative rounded-xl overflow-hidden border border-surface-200 h-28 bg-surface-50">
          <img src={value.startsWith('/') ? `http://localhost:8080${value}` : value} alt="preview" className="w-full h-full object-cover" />
          <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-black/50 text-white text-[10px] font-medium">Preview</span>
        </div>
      )}
    </div>
  )
}

function LabeledInput({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-1.5">{label}</label>
      <input type={type} value={value || ''} onChange={onChange} placeholder={placeholder} className="input-field py-2 text-sm" />
    </div>
  )
}

function LabeledTextarea({ label, value, onChange, rows = 3, placeholder = '' }) {
  return (
    <div>
      <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-1.5">{label}</label>
      <textarea rows={rows} value={value || ''} onChange={onChange} placeholder={placeholder} className="input-field py-2 text-sm resize-none" />
    </div>
  )
}

const DEFAULT_PILLARS = [
  {
    icon: '🚀',
    title: 'STEM & Future Tech Innovation Hub',
    tagline: 'Preparing Students for the AI & Tech-Driven Era',
    description: 'Equipped with high-end robotics hardware, 3D printing suites, and coding labs. Students learn Python, AI fundamentals, electronics, and engineering design from Class VI onwards.',
    stats: [
      { label: '3D Printers & Robotics', value: '15+ Units' },
      { label: 'Coding Curriculum', value: 'Class 1–12' },
      { label: 'Innovation Projects', value: '45+/Year' }
    ],
    features: ['Python & Web Dev', 'AI & Machine Learning Basics', '3D Design & CAD', 'Robotics Competitions'],
    badge: 'STEM Certified'
  },
  {
    icon: '🎓',
    title: 'Academic Mastery & Board Excellence',
    tagline: 'CBSE Curriculum with Personalized Learning Paths',
    description: 'Rigorously structured CBSE curriculum blended with conceptual problem solving, continuous diagnostic assessments, and dedicated JEE/NEET/CUET foundation tracks.',
    stats: [
      { label: 'Board Pass Rate', value: '100%' },
      { label: 'Distinction Rate', value: '92%' },
      { label: 'Avg Teacher Ratio', value: '1:15' }
    ],
    features: ['Diagnostic Mock Tests', 'Personalized Remedial Sessions', 'Olympiad Foundation', 'Career Counseling'],
    badge: 'CBSE Affiliated'
  },
  {
    icon: '🏅',
    title: 'Sports & Athletic Performance Academy',
    tagline: 'Building Fitness, Resilience & Team Championship',
    description: 'World-class 8-acre sporting infrastructure featuring synthetic tracks, floodlit basketball courts, football turf, and professional NIS-certified coaches.',
    stats: [
      { label: 'Sports Disciplines', value: '12+' },
      { label: 'State Champions', value: '34 Medals' },
      { label: 'Turf & Courts', value: '8 Acres' }
    ],
    features: ['Football & Cricket Turf', 'Synthetic Athletics Track', 'Indoor Badminton Arena', 'Swimming & Martial Arts'],
    badge: 'Olympic-Grade Facilities'
  },
  {
    icon: '🎨',
    title: 'Creative Arts & Cultural Conservatory',
    tagline: 'Nurturing Expression, Music & Performing Arts',
    description: 'Dedicated sound-proof music recording rooms, fine arts studio, and a 750-seat acoustic auditorium for theatrical productions, classical dance, and annual galas.',
    stats: [
      { label: 'Acoustic Auditorium', value: '750 Seats' },
      { label: 'Music & Dance Clubs', value: '8 Groups' },
      { label: 'Annual Stage Shows', value: '12+ Events' }
    ],
    features: ['Vocal & Instrumental Music', 'Classical & Contemporary Dance', 'Theater & Public Speaking', 'Fine Arts & Clay Sculpting'],
    badge: 'Expressive Arts'
  },
  {
    icon: '💻',
    title: 'Smart Campus & Digital Portal Integration',
    tagline: 'Seamless Connection for Students, Teachers & Parents',
    description: 'Powered by our custom School Management System. Real-time attendance tracking, online fee payments, instant gradebooks, and digital homework management.',
    stats: [
      { label: 'Real-time Sync', value: '100% Mobile' },
      { label: 'Paperless Office', value: 'Zero Delays' },
      { label: 'Parent Portal', value: '24/7 Access' }
    ],
    features: ['Live Attendance Alerts', 'Digital Report Cards', 'Online Fee Gateway', 'Interactive Study Notes'],
    badge: 'Integrated Portal'
  }
]

/* ────────────────────────── Main Component ────────────────────────── */
export default function CmsEditor() {
  const [activeTab, setActiveTab] = useState('hero')
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(true)

  // ── Data states ──
  const [hero, setHero] = useState({})
  const [info, setInfo] = useState({})
  const [stats, setStats] = useState([])
  const [facilities, setFacilities] = useState([])
  const [achievements, setAchievements] = useState([])
  const [testimonials, setTestimonials] = useState([])
  const [gallery, setGallery] = useState([])

  const [pillarsList, setPillarsList] = useState(() => {
    try {
      const saved = localStorage.getItem('custom_pillars')
      if (saved) return JSON.parse(saved)
    } catch (_) {}
    return DEFAULT_PILLARS
  })
  const [selectedPillarIdx, setSelectedPillarIdx] = useState(0)

  // ── Modal states ──
  const [facilityModal, setFacilityModal] = useState(null)   // null | {mode:'add'|'edit', data:{}}
  const [achModal, setAchModal] = useState(null)
  const [testModal, setTestModal] = useState(null)
  const [statModal, setStatModal] = useState(null)
  const [galleryModal, setGalleryModal] = useState(null)

  const savePillars = () => {
    try {
      localStorage.setItem('custom_pillars', JSON.stringify(pillarsList))
      window.dispatchEvent(new Event('custom_pillars_updated'))
      showToast('⭐ Pillars of Educational Excellence saved & live on Website!')
    } catch {
      showToast('Failed to save pillars', 'error')
    }
  }

  const showToast = (msg, type = 'success') => setToast({ msg, type })

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [heroR, infoR, statsR, facR, achR, testR, galR] = await Promise.all([
        api.get('/cms/hero'),
        api.get('/cms/info'),
        api.get('/cms/stats'),
        api.get('/cms/facilities/all'),
        api.get('/cms/achievements'),
        api.get('/cms/testimonials/all'),
        api.get('/cms/gallery'),
      ])
      setHero(heroR.data)
      setInfo(infoR.data)
      setStats(statsR.data)
      setFacilities(facR.data)
      setAchievements(achR.data)
      setTestimonials(testR.data)
      setGallery(galR.data)
    } catch (e) {
      showToast('Failed to load CMS data', 'error')
    } finally {
      setLoading(false)
    }
  }

  /* ── Gallery handlers ── */
  const saveGalleryItem = async (data) => {
    try {
      if (data.id) {
        await api.put(`/cms/gallery/${data.id}`, data)
        showToast('Gallery item updated!')
      } else {
        await api.post('/cms/gallery', data)
        showToast('Gallery item added!')
      }
      setGalleryModal(null)
      fetchAll()
    } catch {
      showToast('Failed to save gallery item', 'error')
    }
  }

  const deleteGalleryItem = async (id) => {
    if (!confirm('Delete this gallery photo?')) return
    try {
      await api.delete(`/cms/gallery/${id}`)
      showToast('Gallery photo deleted')
      fetchAll()
    } catch {
      showToast('Failed to delete gallery item', 'error')
    }
  }

  /* ── Save handlers ── */
  const saveHero = async () => {
    try { await api.put('/cms/hero', hero); showToast('Hero section saved!') }
    catch { showToast('Failed to save hero', 'error') }
  }

  const setAsHero = async (photoUrl) => {
    try {
      await api.put('/cms/hero/image', { imageUrl: photoUrl })
    } catch {
      // still continue even if API fails
    }
    localStorage.setItem('custom_hero_image', photoUrl)
    window.dispatchEvent(new Event('hero_image_updated'))
    setHero(prev => ({ ...prev, heroImageUrl: photoUrl }))
    showToast('⭐ Photo set as Main Website Campus Hero Image!')
  }

  const saveInfo = async () => {
    try { await api.put('/cms/info', info); showToast('School info saved!') }
    catch { showToast('Failed to save info', 'error') }
  }

  /* ── Facility CRUD ── */
  const saveFacility = async (data) => {
    try {
      if (data.id) {
        const r = await api.put(`/cms/facilities/${data.id}`, data)
        setFacilities(facilities.map(f => f.id === data.id ? r.data : f))
      } else {
        const r = await api.post('/cms/facilities', data)
        setFacilities([...facilities, r.data])
      }
      setFacilityModal(null)
      showToast('Facility saved!')
    } catch { showToast('Failed to save facility', 'error') }
  }
  const deleteFacility = async (id) => {
    if (!confirm('Delete this facility?')) return
    try {
      await api.delete(`/cms/facilities/${id}`)
      setFacilities(facilities.filter(f => f.id !== id))
      showToast('Facility deleted')
    } catch { showToast('Delete failed', 'error') }
  }

  /* ── Achievement CRUD ── */
  const saveAchievement = async (data) => {
    try {
      if (data.id) {
        const r = await api.put(`/cms/achievements/${data.id}`, data)
        setAchievements(achievements.map(a => a.id === data.id ? r.data : a))
      } else {
        const r = await api.post('/cms/achievements', data)
        setAchievements([...achievements, r.data])
      }
      setAchModal(null)
      showToast('Achievement saved!')
    } catch { showToast('Failed to save achievement', 'error') }
  }
  const deleteAchievement = async (id) => {
    if (!confirm('Delete this achievement?')) return
    try {
      await api.delete(`/cms/achievements/${id}`)
      setAchievements(achievements.filter(a => a.id !== id))
      showToast('Achievement deleted')
    } catch { showToast('Delete failed', 'error') }
  }

  /* ── Stat CRUD ── */
  const saveStat = async (data) => {
    try {
      if (data.id) {
        const r = await api.put(`/cms/stats/${data.id}`, data)
        setStats(stats.map(s => s.id === data.id ? r.data : s))
      } else {
        const r = await api.post('/cms/stats', data)
        setStats([...stats, r.data])
      }
      setStatModal(null)
      showToast('Stat saved!')
    } catch { showToast('Failed to save stat', 'error') }
  }
  const deleteStat = async (id) => {
    if (!confirm('Delete this stat?')) return
    try {
      await api.delete(`/cms/stats/${id}`)
      setStats(stats.filter(s => s.id !== id))
      showToast('Stat deleted')
    } catch { showToast('Delete failed', 'error') }
  }

  /* ── Testimonial CRUD ── */
  const saveTestimonial = async (data) => {
    try {
      if (data.id) {
        const r = await api.put(`/cms/testimonials/${data.id}`, data)
        setTestimonials(testimonials.map(t => t.id === data.id ? r.data : t))
      } else {
        const r = await api.post('/cms/testimonials', data)
        setTestimonials([...testimonials, r.data])
      }
      setTestModal(null)
      showToast('Testimonial saved!')
    } catch { showToast('Failed to save testimonial', 'error') }
  }
  const deleteTestimonial = async (id) => {
    if (!confirm('Delete this testimonial?')) return
    try {
      await api.delete(`/cms/testimonials/${id}`)
      setTestimonials(testimonials.filter(t => t.id !== id))
      showToast('Testimonial deleted')
    } catch { showToast('Delete failed', 'error') }
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-900 flex items-center gap-3">
            <HiPaintBrush className="w-8 h-8 text-primary-600" />
            Website CMS Studio
          </h1>
          <p className="text-surface-700/60 mt-1 text-sm">Full control over every section, word, and image of the public website</p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary text-sm flex items-center gap-2"
        >
          <HiEye className="w-4 h-4" />
          Preview Website
        </a>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto p-1 bg-surface-100 rounded-2xl">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200
              ${activeTab === id
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-surface-600 hover:text-surface-900 hover:bg-white/60'
              }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse text-surface-500 py-6">Loading CMS data...</div>
      ) : (
        <>
          {/* ════ HERO TAB ════ */}
          {activeTab === 'hero' && (
            <SectionCard title="Hero Section" icon={HiHome} color="bg-blue-600"
              action={
                <button onClick={saveHero} className="btn-primary text-sm px-5 py-2 flex items-center gap-2">
                  <HiCheck className="w-4 h-4" /> Save Hero
                </button>
              }
            >
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <LabeledInput label="Pill Badge / Overline" value={hero.overline} placeholder="Next-Gen School Management Platform"
                    onChange={e => setHero({ ...hero, overline: e.target.value })} />
                  <LabeledInput label="Main Headline" value={hero.headline} placeholder="Inspiring Brilliance, Nurturing Future Leaders"
                    onChange={e => setHero({ ...hero, headline: e.target.value })} />
                </div>
                <LabeledTextarea label="Sub Paragraph" rows={3} value={hero.subtext} placeholder="Empowering students, teachers, and school administration..."
                  onChange={e => setHero({ ...hero, subtext: e.target.value })} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <LabeledInput label="Primary CTA Button Label" value={hero.ctaPrimaryLabel} placeholder="Enter Institutional Portal"
                    onChange={e => setHero({ ...hero, ctaPrimaryLabel: e.target.value })} />
                  <LabeledInput label="Secondary CTA Button Label" value={hero.ctaSecondaryLabel} placeholder="Explore Features"
                    onChange={e => setHero({ ...hero, ctaSecondaryLabel: e.target.value })} />
                </div>
                <LabeledInput label="📢 Announcement Ticker Text" value={hero.marqueeText} placeholder="Admissions Open for Academic Year 2025-2026"
                  onChange={e => setHero({ ...hero, marqueeText: e.target.value })} />
                <div className="border-t border-surface-100 pt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <ImageUploadField
                    label="Hero Illustration / Right-Side Image"
                    value={hero.heroImageUrl}
                    onUpload={url => setHero({ ...hero, heroImageUrl: url })}
                    onUrlChange={url => setHero({ ...hero, heroImageUrl: url })}
                  />
                  <ImageUploadField
                    label="Background Image (optional)"
                    value={hero.backgroundImageUrl}
                    onUpload={url => setHero({ ...hero, backgroundImageUrl: url })}
                    onUrlChange={url => setHero({ ...hero, backgroundImageUrl: url })}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  <ImageUploadField
                    label="School Logo"
                    value={hero.logoUrl}
                    onUpload={url => setHero({ ...hero, logoUrl: url })}
                    onUrlChange={url => setHero({ ...hero, logoUrl: url })}
                  />
                  <ImageUploadField
                    label="Favicon (browser tab icon)"
                    value={hero.faviconUrl}
                    onUpload={url => setHero({ ...hero, faviconUrl: url })}
                    onUrlChange={url => setHero({ ...hero, faviconUrl: url })}
                  />
                </div>
              </div>
            </SectionCard>
          )}

          {/* ════ SCHOOL INFO TAB ════ */}
          {activeTab === 'info' && (
            <SectionCard title="School Info & Contact" icon={HiGlobeAlt} color="bg-violet-600"
              action={
                <button onClick={saveInfo} className="btn-primary text-sm px-5 py-2 flex items-center gap-2">
                  <HiCheck className="w-4 h-4" /> Save Info
                </button>
              }
            >
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <LabeledInput label="School Name" value={info.schoolName} placeholder="Apex Academy"
                    onChange={e => setInfo({ ...info, schoolName: e.target.value })} />
                  <LabeledInput label="Navbar Tagline" value={info.tagline} placeholder="Excellence in Education"
                    onChange={e => setInfo({ ...info, tagline: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <LabeledInput label="Principal Name" value={info.principalName} placeholder="Dr. E. Vance"
                    onChange={e => setInfo({ ...info, principalName: e.target.value })} />
                  <LabeledInput label="Established Year" value={info.establishedYear} placeholder="1995"
                    onChange={e => setInfo({ ...info, establishedYear: e.target.value })} />
                </div>
                <LabeledInput label="Affiliation / Board" value={info.affiliation} placeholder="CBSE & State Board Approved"
                  onChange={e => setInfo({ ...info, affiliation: e.target.value })} />
                <div className="border-t border-surface-100 pt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-surface-500 mb-4">Contact Details</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <LabeledInput label="Phone" value={info.phone} placeholder="+91 98765 43210"
                      onChange={e => setInfo({ ...info, phone: e.target.value })} />
                    <LabeledInput label="Email" value={info.email} placeholder="admin@school.edu"
                      onChange={e => setInfo({ ...info, email: e.target.value })} />
                    <LabeledInput label="WhatsApp Number" value={info.whatsapp} placeholder="9876543210"
                      onChange={e => setInfo({ ...info, whatsapp: e.target.value })} />
                  </div>
                  <LabeledTextarea label="Full Address" rows={2} value={info.address} placeholder="123 Education Street..."
                    onChange={e => setInfo({ ...info, address: e.target.value })} />
                </div>
                <div className="border-t border-surface-100 pt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-surface-500 mb-4">Social Media Links</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <LabeledInput label="Instagram URL" value={info.instagramUrl} placeholder="https://instagram.com/..."
                      onChange={e => setInfo({ ...info, instagramUrl: e.target.value })} />
                    <LabeledInput label="Facebook URL" value={info.facebookUrl} placeholder="https://facebook.com/..."
                      onChange={e => setInfo({ ...info, facebookUrl: e.target.value })} />
                    <LabeledInput label="Twitter / X URL" value={info.twitterUrl} placeholder="https://twitter.com/..."
                      onChange={e => setInfo({ ...info, twitterUrl: e.target.value })} />
                  </div>
                </div>
                <div className="border-t border-surface-100 pt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-surface-500 mb-4">Hero Trust Badges (shown in hero section)</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(n => (
                      <LabeledInput key={n} label={`Badge ${n}`} value={info[`trustBadge${n}`]} placeholder={`Trust Badge ${n}`}
                        onChange={e => setInfo({ ...info, [`trustBadge${n}`]: e.target.value })} />
                    ))}
                  </div>
                </div>
                <div className="border-t border-surface-100 pt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-4 flex items-center gap-2">
                    💳 Online UPI Payment Settings (Student Portal Gateway)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <LabeledInput
                      label="School UPI VPA / ID"
                      value={info.upiId}
                      placeholder="e.g. apexschool.fee@upi or 9876543210@paytm"
                      onChange={e => setInfo({ ...info, upiId: e.target.value })}
                    />
                    <ImageUploadField
                      label="Custom UPI QR Scanner Image (Optional Upload)"
                      value={info.upiQrUrl}
                      onUpload={url => setInfo({ ...info, upiQrUrl: url })}
                      onUrlChange={url => setInfo({ ...info, upiQrUrl: url })}
                    />
                  </div>
                </div>
                <div className="border-t border-surface-100 pt-4">
                  <LabeledTextarea label="Footer Tagline" rows={2} value={info.footerTagline} placeholder="Empowering future generations..."
                    onChange={e => setInfo({ ...info, footerTagline: e.target.value })} />
                </div>
              </div>
            </SectionCard>
          )}

          {/* ════ PILLARS OF EXCELLENCE TAB ════ */}
          {activeTab === 'pillars' && (
            <SectionCard
              title="Pillars of Educational Excellence"
              icon={HiSparkles}
              color="bg-amber-600"
              action={
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setPillarsList(DEFAULT_PILLARS)
                      localStorage.removeItem('custom_pillars')
                      window.dispatchEvent(new Event('custom_pillars_updated'))
                      showToast('Reset to default pillars!')
                    }}
                    className="btn-secondary text-sm px-3 py-2"
                  >
                    Reset Defaults
                  </button>
                  <button onClick={savePillars} className="btn-primary text-sm px-5 py-2 flex items-center gap-2">
                    <HiCheck className="w-4 h-4" /> Save Pillars
                  </button>
                </div>
              }
            >
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
                  <span className="text-xl">⭐</span>
                  <div>
                    <p className="font-bold">Live Homepage Synchronisation</p>
                    <p>Editing these 5 pillars updates the public website homepage instantly! You can customize icons, titles, feature lists, badges, and metrics.</p>
                  </div>
                </div>

                {/* Pillar selector tabs */}
                <div className="flex flex-wrap gap-2 p-1 bg-surface-100 rounded-xl">
                  {pillarsList.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedPillarIdx(idx)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        selectedPillarIdx === idx ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-600 hover:text-surface-900'
                      }`}
                    >
                      <span>{p.icon}</span>
                      <span>{p.title?.split('&')[0] || p.title}</span>
                    </button>
                  ))}
                </div>

                {/* Selected Pillar Editor */}
                {pillarsList[selectedPillarIdx] && (
                  <div className="space-y-4 p-5 rounded-2xl bg-surface-50 border border-surface-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-1.5">Icon (Emoji / Text)</label>
                        <input
                          type="text"
                          value={pillarsList[selectedPillarIdx].icon || ''}
                          onChange={e => {
                            const updated = [...pillarsList]
                            updated[selectedPillarIdx].icon = e.target.value
                            setPillarsList(updated)
                          }}
                          className="input-field py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-1.5">Badge Tag</label>
                        <input
                          type="text"
                          value={pillarsList[selectedPillarIdx].badge || ''}
                          onChange={e => {
                            const updated = [...pillarsList]
                            updated[selectedPillarIdx].badge = e.target.value
                            setPillarsList(updated)
                          }}
                          className="input-field py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-1.5">Pillar Category Title</label>
                        <input
                          type="text"
                          value={pillarsList[selectedPillarIdx].title || ''}
                          onChange={e => {
                            const updated = [...pillarsList]
                            updated[selectedPillarIdx].title = e.target.value
                            setPillarsList(updated)
                          }}
                          className="input-field py-2 text-sm"
                        />
                      </div>
                    </div>

                    <LabeledInput
                      label="Tagline / Subheading"
                      value={pillarsList[selectedPillarIdx].tagline}
                      onChange={e => {
                        const updated = [...pillarsList]
                        updated[selectedPillarIdx].tagline = e.target.value
                        setPillarsList(updated)
                      }}
                    />

                    <LabeledTextarea
                      label="Full Pillar Description"
                      rows={3}
                      value={pillarsList[selectedPillarIdx].description}
                      onChange={e => {
                        const updated = [...pillarsList]
                        updated[selectedPillarIdx].description = e.target.value
                        setPillarsList(updated)
                      }}
                    />

                    <div>
                      <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-1.5">
                        Feature Highlights (comma separated)
                      </label>
                      <input
                        type="text"
                        value={pillarsList[selectedPillarIdx].features?.join(', ') || ''}
                        onChange={e => {
                          const updated = [...pillarsList]
                          updated[selectedPillarIdx].features = e.target.value.split(',').map(s => s.trim())
                          setPillarsList(updated)
                        }}
                        placeholder="Python & Web Dev, AI & ML, 3D Design"
                        className="input-field py-2 text-sm"
                      />
                    </div>

                    {/* Key Metrics Stats */}
                    <div className="pt-2 border-t border-surface-200">
                      <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-2">Key Metric Stats</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {(pillarsList[selectedPillarIdx].stats || []).map((st, sIdx) => (
                          <div key={sIdx} className="p-3 bg-white rounded-xl border border-surface-200 space-y-2">
                            <input
                              type="text"
                              placeholder="Stat Label"
                              value={st.label}
                              onChange={e => {
                                const updated = [...pillarsList]
                                updated[selectedPillarIdx].stats[sIdx].label = e.target.value
                                setPillarsList(updated)
                              }}
                              className="input-field py-1 text-xs"
                            />
                            <input
                              type="text"
                              placeholder="Stat Value (e.g. 100%)"
                              value={st.value}
                              onChange={e => {
                                const updated = [...pillarsList]
                                updated[selectedPillarIdx].stats[sIdx].value = e.target.value
                                setPillarsList(updated)
                              }}
                              className="input-field py-1 text-xs font-bold text-amber-600"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* ════ STATS TAB ════ */}
          {activeTab === 'stats' && (
            <SectionCard title="Stats Counter Bar" icon={HiChartBar} color="bg-cyan-600"
              action={
                <button onClick={() => setStatModal({ mode: 'add', data: { value: '', label: '', colorClass: 'text-blue-400', sortOrder: stats.length } })}
                  className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
                  <HiPlus className="w-4 h-4" /> Add Stat
                </button>
              }
            >
              {stats.length === 0 ? (
                <p className="text-surface-500 text-sm py-4 text-center">No stats yet. Add your first counter.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stats.map(s => (
                    <div key={s.id} className="relative group p-5 rounded-2xl bg-surface-50 border border-surface-200 text-center hover:border-primary-300 transition-all">
                      <p className={`text-3xl font-black ${s.colorClass || 'text-blue-400'}`}>{s.value}</p>
                      <p className="text-xs text-surface-500 font-semibold uppercase tracking-wider mt-1">{s.label}</p>
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setStatModal({ mode: 'edit', data: { ...s } })}
                          className="p-1.5 rounded-lg bg-white shadow text-primary-600 hover:bg-primary-50">
                          <HiPencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteStat(s.id)}
                          className="p-1.5 rounded-lg bg-white shadow text-red-500 hover:bg-red-50">
                          <HiTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          )}

          {/* ════ FACILITIES TAB ════ */}
          {activeTab === 'facilities' && (
            <SectionCard title="Campus Facilities" icon={HiBuildingLibrary} color="bg-teal-600"
              action={
                <button onClick={() => setFacilityModal({ mode: 'add', data: { icon: '🏫', title: '', description: '', isActive: true, sortOrder: facilities.length } })}
                  className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
                  <HiPlus className="w-4 h-4" /> Add Facility
                </button>
              }
            >
              <div className="space-y-3">
                {facilities.map(f => (
                  <div key={f.id} className="flex items-center gap-4 p-4 rounded-xl bg-surface-50 border border-surface-200 hover:border-primary-300 transition-all group">
                    <span className="text-2xl w-10 text-center flex-shrink-0">{f.icon || '📌'}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-surface-900 text-sm">{f.title}</h4>
                      <p className="text-xs text-surface-500 truncate">{f.description}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${f.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-200 text-surface-500'}`}>
                      {f.isActive ? 'Visible' : 'Hidden'}
                    </span>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => setFacilityModal({ mode: 'edit', data: { ...f } })}
                        className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 opacity-0 group-hover:opacity-100 transition-all">
                        <HiPencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteFacility(f.id)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {facilities.length === 0 && <p className="text-surface-500 text-sm py-4 text-center">No facilities added yet.</p>}
              </div>
            </SectionCard>
          )}

          {/* ════ ACHIEVEMENTS TAB ════ */}
          {activeTab === 'achievements' && (
            <SectionCard title="Wall of Honor — Achievements" icon={HiStar} color="bg-amber-600"
              action={
                <button onClick={() => setAchModal({ mode: 'add', data: { title: '', description: '', achievementDate: '' } })}
                  className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
                  <HiPlus className="w-4 h-4" /> Add Achievement
                </button>
              }
            >
              <div className="space-y-3">
                {achievements.map(a => (
                  <div key={a.id} className="flex items-start gap-4 p-4 rounded-xl bg-surface-50 border border-surface-200 hover:border-amber-300 transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <HiStar className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-surface-900 text-sm">{a.title}</h4>
                      <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">{a.description}</p>
                      {a.achievementDate && (
                        <span className="text-[11px] text-amber-600 font-medium mt-1 inline-block">{a.achievementDate}</span>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => setAchModal({ mode: 'edit', data: { ...a, achievementDate: a.achievementDate ? String(a.achievementDate) : '' } })}
                        className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 opacity-0 group-hover:opacity-100 transition-all">
                        <HiPencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteAchievement(a.id)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {achievements.length === 0 && <p className="text-surface-500 text-sm py-4 text-center">No achievements yet.</p>}
              </div>
            </SectionCard>
          )}

          {/* ════ TESTIMONIALS TAB ════ */}
          {activeTab === 'testimonials' && (
            <SectionCard title="Community Testimonials" icon={HiChatBubbleLeftRight} color="bg-rose-600"
              action={
                <button onClick={() => setTestModal({ mode: 'add', data: { name: '', role: '', avatarInitials: '', text: '', gradientClass: 'from-blue-500 to-indigo-600', isActive: true, sortOrder: testimonials.length } })}
                  className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
                  <HiPlus className="w-4 h-4" /> Add Testimonial
                </button>
              }
            >
              <div className="space-y-3">
                {testimonials.map(t => (
                  <div key={t.id} className="flex items-start gap-4 p-4 rounded-xl bg-surface-50 border border-surface-200 hover:border-rose-300 transition-all group">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradientClass || 'from-blue-500 to-indigo-600'} flex items-center justify-center text-white font-black text-xs flex-shrink-0`}>
                      {t.avatarInitials || t.name?.substring(0, 2) || '??'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-surface-900 text-sm">{t.name}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${t.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-200 text-surface-500'}`}>
                          {t.isActive ? 'Visible' : 'Hidden'}
                        </span>
                      </div>
                      <p className="text-xs text-primary-600 font-medium">{t.role}</p>
                      <p className="text-xs text-surface-500 mt-1 line-clamp-2">"{t.text}"</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => setTestModal({ mode: 'edit', data: { ...t } })}
                        className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 opacity-0 group-hover:opacity-100 transition-all">
                        <HiPencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteTestimonial(t.id)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {testimonials.length === 0 && <p className="text-surface-500 text-sm py-4 text-center">No testimonials yet.</p>}
              </div>
            </SectionCard>
          )}

          {/* ════ CAMPUS GALLERY TAB ════ */}
          {activeTab === 'gallery' && (
            <SectionCard title="School Campus Gallery Studio" icon={HiPhoto} color="bg-indigo-600"
              action={
                <button onClick={() => setGalleryModal({ mode: 'add', data: { title: '', mediaUrl: '', category: 'Campus' } })}
                  className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
                  <HiPlus className="w-4 h-4" /> Add Photo / Media
                </button>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gallery.map(g => (
                  <div key={g.id} className="group rounded-2xl overflow-hidden bg-surface-50 border border-surface-200 hover:border-indigo-300 transition-all relative flex flex-col justify-between">
                    <div className="h-44 overflow-hidden bg-slate-900 relative">
                      <img src={g.mediaUrl?.startsWith('/') ? `http://localhost:8080${g.mediaUrl}` : g.mediaUrl} alt={g.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold">
                        {g.category || 'General'}
                      </span>
                    </div>
                    <div className="p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-surface-900 text-sm truncate flex-1">{g.title || 'Untitled Photo'}</h4>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => setGalleryModal({ mode: 'edit', data: { ...g } })}
                            className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50">
                            <HiPencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteGalleryItem(g.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50">
                            <HiTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setAsHero(g.mediaUrl)}
                        disabled={hero.heroImageUrl === g.mediaUrl}
                        className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                          hero.heroImageUrl === g.mediaUrl
                            ? 'bg-amber-500 text-white cursor-default'
                            : 'bg-amber-50 text-amber-800 hover:bg-amber-500 hover:text-white border border-amber-300'
                        }`}
                      >
                        <span>⭐</span>
                        <span>{hero.heroImageUrl === g.mediaUrl ? 'Active Website Hero Image' : 'Set as Website Hero Image'}</span>
                      </button>
                    </div>
                  </div>
                ))}
                {gallery.length === 0 && <p className="text-surface-500 text-sm py-4 text-center col-span-3">No campus gallery items yet. Click above to add photos.</p>}
              </div>
            </SectionCard>
          )}
        </>
      )}

      {/* ════ MODALS ════ */}

      {/* Facility Modal */}
      {facilityModal && (
        <ModalWrapper title={facilityModal.mode === 'add' ? 'Add Facility' : 'Edit Facility'} onClose={() => setFacilityModal(null)}>
          <FacilityForm initialData={facilityModal.data} onSave={saveFacility} onCancel={() => setFacilityModal(null)} />
        </ModalWrapper>
      )}

      {/* Achievement Modal */}
      {achModal && (
        <ModalWrapper title={achModal.mode === 'add' ? 'Add Achievement' : 'Edit Achievement'} onClose={() => setAchModal(null)}>
          <AchievementForm initialData={achModal.data} onSave={saveAchievement} onCancel={() => setAchModal(null)} />
        </ModalWrapper>
      )}

      {/* Stat Modal */}
      {statModal && (
        <ModalWrapper title={statModal.mode === 'add' ? 'Add Stat' : 'Edit Stat'} onClose={() => setStatModal(null)}>
          <StatForm initialData={statModal.data} onSave={saveStat} onCancel={() => setStatModal(null)} />
        </ModalWrapper>
      )}

      {/* Testimonial Modal */}
      {testModal && (
        <ModalWrapper title={testModal.mode === 'add' ? 'Add Testimonial' : 'Edit Testimonial'} onClose={() => setTestModal(null)}>
          <TestimonialForm initialData={testModal.data} onSave={saveTestimonial} onCancel={() => setTestModal(null)} />
        </ModalWrapper>
      )}

      {/* Gallery Modal */}
      {galleryModal && (
        <ModalWrapper title={galleryModal.mode === 'add' ? 'Add Campus Gallery Photo' : 'Edit Gallery Photo'} onClose={() => setGalleryModal(null)}>
          <GalleryForm initialData={galleryModal.data} onSave={saveGalleryItem} onCancel={() => setGalleryModal(null)} />
        </ModalWrapper>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

/* ────────────────────────── Modal Wrapper ────────────────────────── */
function ModalWrapper({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-surface-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
          <h3 className="font-display font-bold text-surface-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-surface-400 hover:text-surface-900 hover:bg-surface-100 transition-all">
            <HiXMark className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

/* ────────────────────────── Form Components ────────────────────────── */
function FacilityForm({ initialData, onSave, onCancel }) {
  const [data, setData] = useState({ ...initialData })
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <LabeledInput label="Icon (emoji)" value={data.icon} placeholder="🏫"
          onChange={e => setData({ ...data, icon: e.target.value })} />
        <div className="col-span-2">
          <LabeledInput label="Title" value={data.title} placeholder="Science Lab"
            onChange={e => setData({ ...data, title: e.target.value })} />
        </div>
      </div>
      <LabeledTextarea label="Description" rows={3} value={data.description} placeholder="Describe the facility..."
        onChange={e => setData({ ...data, description: e.target.value })} />
      <LabeledInput label="Sort Order" type="number" value={data.sortOrder}
        onChange={e => setData({ ...data, sortOrder: parseInt(e.target.value) || 0 })} />
      <div className="flex items-center gap-2">
        <input type="checkbox" id="fac-active" checked={data.isActive ?? true}
          onChange={e => setData({ ...data, isActive: e.target.checked })} className="rounded" />
        <label htmlFor="fac-active" className="text-sm text-surface-700 font-medium">Visible on website</label>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button onClick={() => onSave(data)} className="btn-primary flex-1">Save Facility</button>
      </div>
    </div>
  )
}

function AchievementForm({ initialData, onSave, onCancel }) {
  const [data, setData] = useState({ ...initialData })
  return (
    <div className="space-y-4">
      <LabeledInput label="Achievement Title" value={data.title} placeholder="National Science Olympiad Winner"
        onChange={e => setData({ ...data, title: e.target.value })} />
      <LabeledTextarea label="Description" rows={3} value={data.description} placeholder="Details about the achievement..."
        onChange={e => setData({ ...data, description: e.target.value })} />
      <LabeledInput label="Date" type="date" value={data.achievementDate}
        onChange={e => setData({ ...data, achievementDate: e.target.value })} />
      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button onClick={() => onSave(data)} className="btn-primary flex-1">Save Achievement</button>
      </div>
    </div>
  )
}

function StatForm({ initialData, onSave, onCancel }) {
  const [data, setData] = useState({ ...initialData })
  const colorOptions = [
    { label: 'Blue', value: 'text-blue-400' },
    { label: 'Violet', value: 'text-violet-400' },
    { label: 'Cyan', value: 'text-cyan-400' },
    { label: 'Amber', value: 'text-amber-400' },
    { label: 'Emerald', value: 'text-emerald-400' },
    { label: 'Rose', value: 'text-rose-400' },
  ]
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <LabeledInput label="Value (e.g. 1200+)" value={data.value} placeholder="1200+"
          onChange={e => setData({ ...data, value: e.target.value })} />
        <LabeledInput label="Sort Order" type="number" value={data.sortOrder}
          onChange={e => setData({ ...data, sortOrder: parseInt(e.target.value) || 0 })} />
      </div>
      <LabeledInput label="Label (e.g. Enrolled Students)" value={data.label} placeholder="Enrolled Students"
        onChange={e => setData({ ...data, label: e.target.value })} />
      <div>
        <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-2">Number Color</label>
        <div className="flex flex-wrap gap-2">
          {colorOptions.map(c => (
            <button key={c.value} onClick={() => setData({ ...data, colorClass: c.value })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${data.colorClass === c.value ? 'border-primary-500 bg-primary-50' : 'border-surface-200'}`}>
              <span className={c.value}>{c.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button onClick={() => onSave(data)} className="btn-primary flex-1">Save Stat</button>
      </div>
    </div>
  )
}

function TestimonialForm({ initialData, onSave, onCancel }) {
  const [data, setData] = useState({ ...initialData })
  const gradients = [
    'from-blue-500 to-indigo-600',
    'from-violet-500 to-purple-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-cyan-500 to-sky-600',
  ]
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <LabeledInput label="Full Name" value={data.name} placeholder="Dr. R. Subramaniam"
          onChange={e => setData({ ...data, name: e.target.value })} />
        <LabeledInput label="Avatar Initials (2-3 chars)" value={data.avatarInitials} placeholder="RS"
          onChange={e => setData({ ...data, avatarInitials: e.target.value })} />
      </div>
      <LabeledInput label="Role / Title" value={data.role} placeholder="Principal, Apex Academy"
        onChange={e => setData({ ...data, role: e.target.value })} />
      <LabeledTextarea label="Testimonial Text" rows={3} value={data.text} placeholder="Their review..."
        onChange={e => setData({ ...data, text: e.target.value })} />
      <div>
        <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-2">Avatar Gradient Color</label>
        <div className="flex flex-wrap gap-2">
          {gradients.map(g => (
            <button key={g} onClick={() => setData({ ...data, gradientClass: g })}
              className={`w-8 h-8 rounded-full bg-gradient-to-br ${g} border-4 transition-all ${data.gradientClass === g ? 'border-primary-500 scale-125' : 'border-transparent'}`} />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="test-active" checked={data.isActive ?? true}
          onChange={e => setData({ ...data, isActive: e.target.checked })} className="rounded" />
        <label htmlFor="test-active" className="text-sm text-surface-700 font-medium">Visible on website</label>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button onClick={() => onSave(data)} className="btn-primary flex-1">Save Testimonial</button>
      </div>
    </div>
  )
}

function GalleryForm({ initialData, onSave, onCancel }) {
  const [data, setData] = useState({ ...initialData })
  const categories = ['Hero', 'Campus', 'Classrooms', 'Laboratories', 'Playground', 'Library', 'Events']

  return (
    <div className="space-y-4">
      <LabeledInput label="Photo Title / Description" value={data.title} placeholder="e.g. Science Laboratory"
        onChange={e => setData({ ...data, title: e.target.value })} />

      <div>
        <label className="block text-xs font-bold text-surface-700 uppercase tracking-wide mb-1.5">Category</label>
        <select
          value={data.category || 'Campus'}
          onChange={e => setData({ ...data, category: e.target.value })}
          className="input-field py-2 text-sm"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <ImageUploadField
        label="Image Asset"
        value={data.mediaUrl}
        onUpload={url => setData({ ...data, mediaUrl: url })}
        onUrlChange={url => setData({ ...data, mediaUrl: url })}
      />

      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button onClick={() => onSave(data)} className="btn-primary flex-1">Save Photo</button>
      </div>
    </div>
  )
}
