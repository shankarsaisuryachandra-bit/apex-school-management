import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axiosConfig'
import { HiCheckCircle, HiArrowLeft, HiDocumentText, HiShieldCheck } from 'react-icons/hi2'

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

export default function AdmissionsPage() {
  const [formData, setFormData] = useState({
    studentName: '',
    applyingForGrade: 'Grade 1',
    parentName: '',
    phone: '',
    email: '',
    previousSchool: '',
    dateOfBirth: '',
    address: ''
  })

  const [submitting, setSubmitting] = useState(false)
  const [submittedApp, setSubmittedApp] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.dateOfBirth && formData.dateOfBirth.trim()) {
      const dobDate = new Date(formData.dateOfBirth.trim())
      const currentYear = new Date().getFullYear()
      const age = currentYear - dobDate.getFullYear()
      if (age < 2 || age > 40 || dobDate > new Date()) {
        setErrorMsg('Date of birth must represent a valid applicant age between 2 and 40 years.')
        return
      }
    }
    setSubmitting(true)
    setErrorMsg('')
    try {
      const res = await api.post('/admissions/apply', formData)
      setSubmittedApp(res.data)
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit admission application')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] font-sans text-[#1A1F26]">
      {/* Top Academic Strip */}
      <div className="bg-[#071320] text-slate-300 text-xs py-2 px-6 border-b border-[#1B2F44]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="font-serif tracking-widest text-[11px] uppercase text-[#DFBF77]">
            Admissions Secretariat • Office of the Registrar
          </span>
          <span className="text-slate-400 text-xs hidden sm:inline">
            Inquiries: admissions@apexacademy.edu | +91 (0) 80 2845 9900
          </span>
        </div>
      </div>

      {/* Institutional Header */}
      <header className="bg-[#0B1B2B] text-white py-4 px-6 border-b border-[#1B2F44] shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <SchoolCrest className="w-9 h-9" />
            <div>
              <div className="font-serif font-bold text-base tracking-wide text-white">
                APEX INTERNATIONAL ACADEMY
              </div>
              <div className="text-[10px] tracking-[0.2em] font-medium text-[#C5A059] uppercase">
                CBSE Affiliated Institution #198042
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

      {/* Main Banner */}
      <section className="bg-gradient-to-b from-[#0B1B2B] to-[#122436] text-white py-14 px-6 text-center border-b border-[#1B2F44]">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block px-3 py-1 rounded-full bg-[#C5A059]/20 text-[#DFBF77] text-xs font-bold uppercase tracking-widest mb-3 border border-[#C5A059]/40">
            Admissions Intake • Academic Session 2026–2027
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight mb-3">
            Candidate Admission & Matriculation Application
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed max-w-2xl mx-auto">
            Enrollment is open for Primary School, Middle Years, and Senior Secondary Academic Faculties. Please complete all statutory candidate credentials below.
          </p>
        </div>
      </section>

      {/* Main Form Container */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        {submittedApp ? (
          <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-sm border border-[#E8E6DF] text-center space-y-5">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
              <HiCheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-[#0B1B2B]">
              Application Dossier Registered
            </h2>
            <p className="text-sm text-[#5A6878] max-w-md mx-auto leading-relaxed">
              Your admission application has been registered with the Admissions Secretariat. Please record the reference registration dossier number below.
            </p>

            <div className="p-5 bg-[#FAF9F5] rounded-xl border border-[#E8E6DF] inline-block text-left text-xs space-y-2 max-w-md w-full">
              <div className="flex justify-between border-b border-[#E8E6DF] pb-1.5">
                <span className="text-[#7A889B] font-medium">Registration Dossier:</span>
                <strong className="font-mono text-sm text-[#0B1B2B]">{submittedApp.applicationNo}</strong>
              </div>
              <div className="flex justify-between border-b border-[#E8E6DF] pb-1.5">
                <span className="text-[#7A889B] font-medium">Candidate Name:</span>
                <strong className="text-[#0B1B2B]">{submittedApp.studentName}</strong>
              </div>
              <div className="flex justify-between border-b border-[#E8E6DF] pb-1.5">
                <span className="text-[#7A889B] font-medium">Applying Class / Grade:</span>
                <strong className="text-[#0B1B2B]">{submittedApp.applyingForGrade}</strong>
              </div>
              <div className="flex justify-between pt-0.5">
                <span className="text-[#7A889B] font-medium">Registry Status:</span>
                <span className="px-2 py-0.5 rounded bg-[#FAF9F5] text-[#8C6837] border border-[#C5A059]/40 font-bold uppercase text-[10px]">
                  UNDER ACADEMIC SCRUTINY
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Link to="/" className="btn-primary text-xs !py-3 !px-6 inline-block">
                Return to Academy Homepage
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-sm border border-[#E8E6DF]">
            <div className="flex items-center gap-3 pb-5 mb-6 border-b border-[#F2F0E8]">
              <div className="w-10 h-10 rounded-lg bg-[#0B1B2B] text-[#DFBF77] flex items-center justify-center">
                <HiDocumentText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold text-[#0B1B2B]">
                  Candidate Dossier Registration
                </h2>
                <p className="text-xs text-[#7A889B]">Official enrollment into Session 2026–2027</p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#5A6878] uppercase mb-1.5">Candidate Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ethan Eleanor Vance"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#5A6878] uppercase mb-1.5">Applying For Academic Grade *</label>
                  <select
                    value={formData.applyingForGrade}
                    onChange={(e) => setFormData({ ...formData, applyingForGrade: e.target.value })}
                    className="input-field"
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i} value={`Grade ${i + 1}`}>Grade {i + 1}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#5A6878] uppercase mb-1.5">Parent / Legal Guardian Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Arthur Vance"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#5A6878] uppercase mb-1.5">Contact Telephone Number *</label>
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
                  <label className="block text-xs font-bold text-[#5A6878] uppercase mb-1.5">Communication Email Address</label>
                  <input
                    type="email"
                    placeholder="guardian@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#5A6878] uppercase mb-1.5">Previous School Attended</label>
                  <input
                    type="text"
                    placeholder="Previous school / academy name"
                    value={formData.previousSchool}
                    onChange={(e) => setFormData({ ...formData, previousSchool: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#5A6878] uppercase mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#5A6878] uppercase mb-1.5">Permanent Residence Address</label>
                  <input
                    type="text"
                    placeholder="City, State / Postal Address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#F2F0E8]">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full btn-gold !py-3.5 text-center font-bold text-sm tracking-wide"
                >
                  {submitting ? 'Transmitting Admission Dossier...' : 'Submit Candidate Matriculation Form'}
                </button>
                <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[#7A889B]">
                  <HiShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Submissions are encrypted and reviewed under standard statutory CBSE admissions guidelines.</span>
                </div>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}

