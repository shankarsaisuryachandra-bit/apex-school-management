import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axiosConfig'
import { HiBriefcase, HiArrowLeft, HiCheckCircle, HiShieldCheck } from 'react-icons/hi2'

function SchoolCrest({ className = "w-8 h-8" }) {
  return (
    <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 5 L88 22 V62 C88 90 50 115 50 115 C50 115 12 90 12 62 V22 L50 5 Z" fill="#0B1B2B" stroke="#C5A059" strokeWidth="3" />
      <path d="M50 12 L82 26 V60 C82 84 50 106 50 106 C50 106 18 84 18 60 V26 L50 12 Z" stroke="#C5A059" strokeWidth="1" strokeDasharray="3 2" fill="none" opacity="0.6" />
      <path d="M50 24 V96 M24 60 H76" stroke="#C5A059" strokeWidth="1.5" opacity="0.5" />
      <path d="M30 42 C36 40 42 42 46 45 V55 C42 52 36 50 30 52 Z M46 45 C50 42 56 40 62 42 V52 C56 50 50 52 46 55 Z" fill="#C5A059" />
      <path d="M50 32 L47 38 H53 Z M46 38 H54 L52 44 H48 Z" fill="#DFBF77" />
      <path d="M32 75 C34 82 42 88 50 90 C58 88 66 82 68 75" stroke="#C5A059" strokeWidth="2" strokeLinecap="round" />
      <circle cx="34" cy="73" r="2" fill="#C5A059" />
      <circle cx="66" cy="73" r="2" fill="#C5A059" />
      <circle cx="50" cy="90" r="2.5" fill="#DFBF77" />
    </svg>
  )
}

export default function CareersPage() {
  const [vacancies, setVacancies] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    qualification: '',
    experienceYears: '3 Years',
    position: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [successApp, setSuccessApp] = useState(null)

  useEffect(() => {
    fetchVacancies()
  }, [])

  const fetchVacancies = async () => {
    try {
      const res = await api.get('/careers/vacancies')
      setVacancies(res.data || [])
    } catch (err) {
      console.error('Failed to load vacancies:', err)
    }
  }

  const handleApply = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await api.post('/careers/apply', { ...formData, position: selectedJob?.title || formData.position })
      setSuccessApp(res.data)
    } catch (err) {
      console.error('Job application failed:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const defaultVacancies = [
    { id: 1, title: 'Head of Department - Pure Mathematics (IGCSE / CBSE)', department: 'Faculty of Mathematics', type: 'Full-Time Tenured', experience: '5+ Years in Senior Secondary', location: 'Bengaluru Campus' },
    { id: 2, title: 'Senior Faculty Fellow - Physics & Quantum Mechanics', department: 'Faculty of Physical Sciences', type: 'Full-Time', experience: '3-5 Years teaching experience', location: 'Bengaluru Campus' },
    { id: 3, title: 'Lecturer in English Literature & Rhetoric', department: 'Faculty of Humanities', type: 'Full-Time', experience: 'Post-Graduate with B.Ed.', location: 'Bengaluru Campus' },
    { id: 4, title: 'Olympic Athletics & Physical Conditioning Coach', department: 'Athletics & Physical Education', type: 'Tenured Staff', experience: 'National / State Level credentials', location: 'Olympic Sports Pavilion' },
  ]

  const displayVacancies = vacancies.length > 0 ? vacancies : defaultVacancies

  return (
    <div className="min-h-screen bg-[#FAF9F5] font-sans text-[#1A1F26]">
      {/* Top Academic Strip */}
      <div className="bg-[#071320] text-slate-300 text-xs py-2 px-6 border-b border-[#1B2F44]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="font-serif tracking-widest text-[11px] uppercase text-[#DFBF77]">
            Academic Faculty Recruitment & Appointments Secretariat
          </span>
          <span className="text-slate-400 text-xs hidden sm:inline">
            Equal Opportunity Institutional Employer | UGC & CBSE Norms
          </span>
        </div>
      </div>

      {/* Header */}
      <header className="bg-[#0B1B2B] text-white py-4 px-6 border-b border-[#1B2F44] shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <SchoolCrest className="w-9 h-9" />
            <div>
              <div className="font-serif font-bold text-base tracking-wide text-white">
                APEX INTERNATIONAL ACADEMY
              </div>
              <div className="text-[10px] tracking-[0.2em] font-medium text-[#C5A059] uppercase">
                Faculty of Teaching & Educational Research
              </div>
            </div>
          </Link>
          <Link
            to="/"
            className="text-xs font-semibold text-[#DFBF77] hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <HiArrowLeft className="w-4 h-4" />
            <span>Return to Academy Home</span>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#0B1B2B] to-[#122436] text-white py-14 px-6 text-center border-b border-[#1B2F44]">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block px-3 py-1 rounded-full bg-[#C5A059]/20 text-[#DFBF77] text-xs font-bold uppercase tracking-widest mb-3 border border-[#C5A059]/40">
            Scholastic Faculty Appointments
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight mb-3">
            Join Our Distinguished Faculty & Research Body
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed max-w-2xl mx-auto">
            Inspire the next generation of global thinkers, scholars, and innovators. We invite applications for teaching chairs, laboratory fellows, and academic administrators.
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Vacancies Column */}
        <div className="space-y-6">
          <div className="pb-4 border-b border-[#E8E6DF]">
            <h2 className="text-xl font-serif font-bold text-[#0B1B2B] flex items-center gap-2">
              <HiBriefcase className="w-5 h-5 text-[#C5A059]" />
              <span>Current Professorial & Faculty Chairs</span>
            </h2>
            <p className="text-xs text-[#7A889B] mt-1">Select a vacancy to initiate your candidate dossier.</p>
          </div>

          <div className="space-y-4">
            {displayVacancies.map((v) => (
              <div
                key={v.id}
                onClick={() => {
                  setSelectedJob(v)
                  setSuccessApp(null)
                }}
                className={`p-6 rounded-xl border transition-all cursor-pointer ${
                  selectedJob?.id === v.id
                    ? 'border-[#0B1B2B] bg-[#FAF9F5] shadow-md ring-2 ring-[#C5A059]/40'
                    : 'border-[#E8E6DF] bg-white hover:border-[#0B1B2B] shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#FAF9F5] text-[#8C6837] border border-[#E8E6DF]">
                    {v.department}
                  </span>
                  <span className="text-[11px] font-bold text-[#0B1B2B] bg-[#F6F5EF] px-2.5 py-0.5 rounded border border-[#E2DFD2]">
                    {v.type}
                  </span>
                </div>
                <h3 className="text-base font-serif font-bold text-[#0B1B2B]">{v.title}</h3>
                <p className="text-xs text-[#5A6878] mt-1.5 leading-relaxed">
                  Prerequisites: {v.experience} • Location: {v.location}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Application Form Column */}
        <div>
          {successApp ? (
            <div className="bg-white p-8 sm:p-10 rounded-2xl border border-[#E8E6DF] shadow-sm text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <HiCheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-[#0B1B2B]">
                Faculty Application Registered
              </h3>
              <p className="text-xs text-[#5A6878] leading-relaxed max-w-md mx-auto">
                {successApp.message || 'Your professorial application dossier has been successfully transmitted to the Academic Review Committee.'}
              </p>
              <div className="p-4 bg-[#FAF9F5] rounded-xl border border-[#E8E6DF] font-mono text-xs text-[#0B1B2B] inline-block font-bold">
                Application Dossier Ref: {successApp.applicationId || 'FAC-2026-092'}
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 sm:p-10 rounded-2xl border border-[#E8E6DF] shadow-sm space-y-5">
              <div className="pb-4 border-b border-[#F2F0E8]">
                <span className="text-[10px] font-bold text-[#8C6837] uppercase tracking-wider block">Candidate Application</span>
                <h3 className="text-xl font-serif font-bold text-[#0B1B2B]">
                  Apply for {selectedJob ? selectedJob.title : 'Faculty Appointment'}
                </h3>
              </div>

              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#5A6878] uppercase mb-1.5">Candidate Full Name & Honorific *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Eleanor Vance, Ph.D."
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#5A6878] uppercase mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="faculty.candidate@univ.edu"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#5A6878] uppercase mb-1.5">Contact Telephone *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#5A6878] uppercase mb-1.5">Highest Degree / Terminal Qualification</label>
                    <input
                      type="text"
                      placeholder="e.g. Ph.D. in Pure Physics / M.Sc., B.Ed."
                      value={formData.qualification}
                      onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#5A6878] uppercase mb-1.5">Years of Instruction Experience</label>
                    <input
                      type="text"
                      placeholder="e.g. 7 Years in Senior Secondary"
                      value={formData.experienceYears}
                      onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-[#F2F0E8]">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full btn-gold !py-3.5 text-center font-bold text-sm"
                  >
                    {submitting ? 'Transmitting Dossier...' : 'Submit Faculty Candidacy Application'}
                  </button>
                  <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[#7A889B]">
                    <HiShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Applications reviewed directly by Dean of Faculty & Directorate.</span>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

