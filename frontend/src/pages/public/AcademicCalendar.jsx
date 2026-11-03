import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axiosConfig'
import { HiCalendar, HiBell, HiArrowLeft } from 'react-icons/hi2'

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

export default function AcademicCalendar() {
  const [events, setEvents] = useState([])
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [eRes, nRes] = await Promise.all([
        api.get('/events'),
        api.get('/notices')
      ])
      setEvents(eRes.data || [])
      setNotices(nRes.data || [])
    } catch (err) {
      console.error('Failed to load events/notices:', err)
    } finally {
      setLoading(false)
    }
  }

  const defaultEvents = [
    { id: 1, title: 'Term II Commencement & Matriculation Assembly', eventDate: '2026-10-15', eventType: 'ACADEMIC', description: 'Formal inauguration of the winter academic term for all forms with opening address in the Main Quadrangle.' },
    { id: 2, title: 'Annual Inter-House Forensic & Debate Championship', eventDate: '2026-10-24', eventType: 'CO-CURRICULAR', description: 'Parliamentary debates across Tagore, Raman, Curie, and Newton houses in the Tagore Memorial Auditorium.' },
    { id: 3, title: 'CBSE Senior Secondary Science Olympiad Trials', eventDate: '2026-11-04', eventType: 'EXAMINATION', description: 'Practical and theoretical selection round for national and international scholastic olympiads.' },
    { id: 4, title: 'Parent-Teacher Council Term Review Meets', eventDate: '2026-11-18', eventType: 'CONFERENCE', description: 'Departmental faculty conferences with guardians to evaluate scholar academic portfolios.' },
  ]

  const displayEvents = events.length > 0 ? events : defaultEvents

  return (
    <div className="min-h-screen bg-[#FAF9F5] font-sans text-[#1A1F26]">
      {/* Top Academic Strip */}
      <div className="bg-[#071320] text-slate-300 text-xs py-2 px-6 border-b border-[#1B2F44]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="font-serif tracking-widest text-[11px] uppercase text-[#DFBF77]">
            Academic Calendar & Circular Gazette • Session 2026–2027
          </span>
          <span className="text-slate-400 text-xs hidden sm:inline">
            CBSE Affiliation #198042 | Term II Active
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
                Excellence in Education & Leadership
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
            Institutional Master Calendar
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight mb-3">
            Term Timetable, Key Dates & Official Circulars
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed max-w-2xl mx-auto">
            Official schedules for term examinations, academic convocations, inter-house competitions, and gazetted school holidays.
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Events Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E8E6DF]">
            <h2 className="text-xl font-serif font-bold text-[#0B1B2B] flex items-center gap-2">
              <HiCalendar className="w-5 h-5 text-[#C5A059]" />
              <span>Upcoming Institutional Convocations</span>
            </h2>
            <span className="text-xs font-bold text-[#7A889B] uppercase tracking-wider">Session 2026–2027</span>
          </div>

          <div className="space-y-4">
            {displayEvents.map((evt) => (
              <div
                key={evt.id}
                className="bg-white p-6 rounded-xl border border-[#E8E6DF] shadow-sm hover:border-[#0B1B2B] transition-all flex items-start gap-5"
              >
                <div className="bg-[#0B1B2B] text-white p-3 rounded-lg text-center min-w-[75px] shrink-0 border border-[#C5A059]/40 shadow-inner">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#DFBF77] block">DATE</span>
                  <span className="text-2xl font-serif font-bold leading-none my-1 block">{evt.eventDate?.substring(8, 10) || '15'}</span>
                  <span className="text-[10px] uppercase font-semibold text-slate-300 block">{evt.eventDate?.substring(5, 7) || 'OCT'}</span>
                </div>
                <div className="space-y-1.5 min-w-0">
                  <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#FAF9F5] text-[#8C6837] border border-[#E8E6DF]">
                    {evt.eventType || 'ACADEMIC'}
                  </span>
                  <h3 className="text-base font-serif font-bold text-[#0B1B2B]">
                    {evt.title}
                  </h3>
                  <p className="text-xs text-[#5A6878] leading-relaxed">
                    {evt.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Circulars Column */}
        <div className="space-y-6">
          <div className="pb-4 border-b border-[#E8E6DF]">
            <h2 className="text-xl font-serif font-bold text-[#0B1B2B] flex items-center gap-2">
              <HiBell className="w-5 h-5 text-[#C5A059]" />
              <span>Gazetted Circulars</span>
            </h2>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[#E8E6DF] shadow-sm space-y-4">
            <div className="p-4 rounded-lg bg-[#FAF9F5] border border-[#E8E6DF] space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-[#8C6837] bg-[#FAF9F5] border border-[#C5A059]/40 px-2 py-0.5 rounded">
                CIRCULAR #2026/08
              </span>
              <h4 className="text-sm font-serif font-bold text-[#0B1B2B]">Winter Academic Uniform Protocol</h4>
              <p className="text-xs text-[#5A6878] leading-relaxed">All scholars are instructed to adhere to the formal blazer and institutional crest code effective Monday.</p>
            </div>

            <div className="p-4 rounded-lg bg-[#FAF9F5] border border-[#E8E6DF] space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                EXAM BLUEPRINT
              </span>
              <h4 className="text-sm font-serif font-bold text-[#0B1B2B]">Term II Assessment Blueprint</h4>
              <p className="text-xs text-[#5A6878] leading-relaxed">Form-wise question patterns, weightage matrices, and practical timetables are available via scholar portals.</p>
            </div>

            <div className="p-4 rounded-lg bg-[#FAF9F5] border border-[#E8E6DF] space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                ATHLETICS BULLETIN
              </span>
              <h4 className="text-sm font-serif font-bold text-[#0B1B2B]">Inter-School Athletics Trials</h4>
              <p className="text-xs text-[#5A6878] leading-relaxed">Trials for the senior track & field cohort begin tomorrow at 15:30 on the Olympic running grounds.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

