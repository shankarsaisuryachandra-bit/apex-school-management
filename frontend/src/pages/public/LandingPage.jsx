import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { HiSun, HiMoon } from 'react-icons/hi2'
import api from '../../api/axiosConfig'

/* ── Animated Counter Component ── */
function Counter({ end, suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        let cur = 0
        const step = Math.ceil(end / 50)
        const t = setInterval(() => {
          cur = Math.min(cur + step, end)
          setCount(cur)
          if (cur >= end) clearInterval(t)
        }, 20)
      }
    }, { threshold: 0.2 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [end])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

/* ── Heraldic Crest SVG Component ── */
function SchoolCrest({ className = "w-10 h-10" }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 5 L88 20 V52 C88 75 50 94 50 94 C50 94 12 75 12 52 V20 L50 5 Z" fill="#0B1B2B" stroke="#C5A059" strokeWidth="3" />
      <path d="M50 12 L80 24 V50 C80 69 50 85 50 85 C50 85 20 69 20 50 V24 L50 12 Z" stroke="#DFBF77" strokeWidth="1" strokeDasharray="3 2" />
      {/* Book */}
      <path d="M34 46 C42 43 48 45 50 49 C52 45 58 43 66 46 V65 C58 62 52 64 50 67 C48 64 42 62 34 65 V46 Z" fill="#C5A059" />
      <path d="M50 49 V67" stroke="#0B1B2B" strokeWidth="1.5" />
      {/* Torch Flame */}
      <path d="M50 24 C53 29 55 32 50 38 C45 32 47 29 50 24 Z" fill="#DFBF77" />
      <circle cx="50" cy="39" r="2.5" fill="#C5A059" />
      {/* Stars */}
      <circle cx="34" cy="35" r="1.5" fill="#DFBF77" />
      <circle cx="66" cy="35" r="1.5" fill="#DFBF77" />
    </svg>
  )
}

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme()
  const [schoolInfo, setSchoolInfo] = useState(null)
  const [stats, setStats] = useState([])
  const [navOpen, setNavOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeTab, setActiveTab] = useState('labs')
  const [heroImageUrl, setHeroImageUrl] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    async function loadAll() {
      try {
        const [infoRes, statsRes] = await Promise.allSettled([
          api.get('/cms/info'),
          api.get('/cms/stats'),
        ])
        if (infoRes.status === 'fulfilled') setSchoolInfo(infoRes.value.data)
        if (statsRes.status === 'fulfilled' && Array.isArray(statsRes.value.data)) setStats(statsRes.value.data)
      } catch (_) {}
    }
    loadAll()
  }, [])

  useEffect(() => {
    async function fetchHero() {
      try {
        const res = await api.get('/cms/hero')
        if (res.data?.heroImageUrl) setHeroImageUrl(res.data.heroImageUrl)
      } catch (_) {}
    }
    fetchHero()
  }, [])

  const name = schoolInfo?.schoolName || 'Apex International Academy'
  const phone = schoolInfo?.phone || '+91 (044) 2834-5678'
  const email = schoolInfo?.email || 'admissions@apexacademy.edu.in'
  const address = schoolInfo?.address || '14, Education Boulevard, Anna Nagar, Chennai – 600040'

  const defaultStats = [
    { value: 1250, label: 'Scholars Enrolled', suffix: '+' },
    { value: 92, label: 'Distinguished Faculty', suffix: '' },
    { value: 27, label: 'Years of Heritage', suffix: '' },
    { value: 100, label: 'Board Examination Pass', suffix: '%' },
  ]
  const displayStats = stats.length > 0
    ? stats.map(s => ({ value: parseInt(s.value), label: s.label, suffix: s.value?.includes('+') ? '+' : s.value?.includes('%') ? '%' : '' }))
    : defaultStats

  const heroSrc = (() => {
    const url = heroImageUrl || '/uploads/hero_campus_quad.png'
    return url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')
      ? url
      : (url.startsWith('/') ? url : `/${url}`)
  })()

  // Curated facilities data with real architectural photography
  const facilities = {
    labs: {
      title: 'Advanced AI & STEM Discovery Center',
      desc: 'Featuring state-of-the-art physics, molecular chemistry, biotechnology chambers, and a specialized robotics lab equipped with humanoid automation kits.',
      image: 'https://images.unsplash.com/photo-1581093458791-9f3c3250a8b0?auto=format&fit=crop&w=1200&q=80',
      specs: ['12 High-Precision Spectrometers', 'Robotics Simulation Suite', 'Clean-Room Safety Protocol']
    },
    library: {
      title: 'The Tagore Memorial Central Library',
      desc: 'A serene double-height reading rotunda housing over 35,000 academic titles, rare manuscripts, and private carrels with access to JSTOR and IEEE digital repositories.',
      image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80',
      specs: ['35,000+ Print Volumes', '100+ Journal Subscriptions', 'Acoustic Silent Study Lounges']
    },
    sports: {
      title: 'Olympic Athletics & Aquatics Pavilion',
      desc: 'An international standard 8-lane 400m synthetic running track, all-weather FIFA-certified football turf, heated indoor swimming pool, and dedicated squash courts.',
      image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
      specs: ['FIFA-Standard Football Turf', 'Semi-Olympic Indoor Pool', 'Professional NIS Certified Coaches']
    },
    arts: {
      title: 'Philharmonic Conservatory & Theatre',
      desc: 'An acoustically engineered 900-seat amphitheatre with Steinway concert grand pianos, vocal practice studios, and professional digital music recording gear.',
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
      specs: ['900-Seat Proscenium Theatre', 'Orchestra Practice Suites', 'Stage Lighting & Sound Grid']
    }
  }

  const faculties = [
    {
      code: 'STEM',
      title: 'Natural Sciences & Robotics',
      desc: 'Comprehensive research-based pedagogy across Physics, Molecular Chemistry, Genetic Biology, and Machine Intelligence.',
      grades: 'Grades 6–12'
    },
    {
      code: 'MATH',
      title: 'Mathematics & Computational Logic',
      desc: 'Rigorous foundation in Discrete Mathematics, Advanced Calculus, Probability, and Algorithmic Problem Solving.',
      grades: 'Grades 1–12'
    },
    {
      code: 'HUM',
      title: 'Humanities, Economics & Diplomacy',
      desc: 'Critical inquiry into World History, Geopolitics, Constitutional Law, Macroeconomics, and Rhetorical Debate.',
      grades: 'Grades 9–12'
    },
    {
      code: 'LANG',
      title: 'Languages & World Literature',
      desc: 'Classical English literature alongside Sanskrit, French, German, and Hindi fostering bilingual cultural fluency.',
      grades: 'All Grades'
    },
    {
      code: 'ARTS',
      title: 'Philharmonic Music & Visual Arts',
      desc: 'Western Classical symphony, Indian Carnatic vocal, oil canvas painting, ceramics, and theatrical drama.',
      grades: 'All Grades'
    },
    {
      code: 'LEAD',
      title: 'Civic Leadership & Moral Ethics',
      desc: 'Community outreach, environmental conservation projects, Model UN delegation, and Duke of Edinburgh leadership.',
      grades: 'Grades 8–12'
    }
  ]

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#1A1F26] selection:bg-[#C5A059] selection:text-[#0B1B2B]">

      {/* ═══════ TOP INSTITUTIONAL ACCREDITATION STRIP ═══════ */}
      <div className="bg-[#0B1B2B] text-[#D8D4C7] text-[11px] font-medium border-b border-[#C5A059]/20 hidden md:block">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-[#DFBF77]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DFBF77] animate-pulse"></span>
              Affiliated with CBSE, New Delhi • Affiliation No. 198042 (School Code: 45012)
            </span>
            <span className="text-[#8E9CA8]">|</span>
            <span className="text-gray-300">Admissions Helpline: <a href={`tel:${phone}`} className="hover:text-white transition-colors">{phone}</a></span>
          </div>
          <div className="flex items-center gap-5 text-gray-300">
            <span>Campus Office: Mon–Sat 8:00 AM – 4:30 PM</span>
            <span className="text-[#8E9CA8]">|</span>
            <Link to="/admissions" className="text-[#DFBF77] hover:underline font-semibold flex items-center gap-1">
              Admissions 2025–26 Open →
            </Link>
          </div>
        </div>
      </div>

      {/* ═══════ MAIN EXECUTIVE NAVBAR ═══════ */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-md py-3' : 'bg-white border-b border-[#E8E6DF] py-4'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          
          {/* Brand Identity / Crest */}
          <Link to="/" className="flex items-center gap-3.5 group">
            <SchoolCrest className="w-11 h-11 transform group-hover:scale-105 transition-transform duration-300" />
            <div>
              <span className="font-serif font-bold text-[#0B1B2B] text-base md:text-lg tracking-tight block leading-none">
                {name}
              </span>
              <span className="text-[10px] tracking-widest text-[#8C6837] font-semibold uppercase mt-1 block">
                Excellence • Virtue • Leadership • Est. 1998
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-8 text-[13px] font-semibold text-[#374151]">
            <a href="#about" className="hover:text-[#0B1B2B] transition-colors py-1 border-b-2 border-transparent hover:border-[#C5A059]">The Academy</a>
            <a href="#faculties" className="hover:text-[#0B1B2B] transition-colors py-1 border-b-2 border-transparent hover:border-[#C5A059]">Academics</a>
            <a href="#facilities" className="hover:text-[#0B1B2B] transition-colors py-1 border-b-2 border-transparent hover:border-[#C5A059]">Campus Life</a>
            <a href="#admissions" className="hover:text-[#0B1B2B] transition-colors py-1 border-b-2 border-transparent hover:border-[#C5A059]">Admissions</a>
            <a href="#contact" className="hover:text-[#0B1B2B] transition-colors py-1 border-b-2 border-transparent hover:border-[#C5A059]">Contact</a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-[#F6F5EF] dark:bg-slate-800 text-[#0B1B2B] dark:text-amber-400 border border-[#DCD9CE] dark:border-slate-700 hover:border-[#0B1B2B] transition-all flex items-center justify-center"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode (Ctrl+J)`}
            >
              {theme === 'dark' ? <HiSun className="w-4 h-4 text-amber-400" /> : <HiMoon className="w-4 h-4 text-slate-700" />}
            </button>

            <Link
              to="/admissions"
              className="px-4 py-2 bg-[#F6F5EF] text-[#0B1B2B] border border-[#DCD9CE] hover:border-[#0B1B2B] rounded-lg text-xs font-semibold tracking-wide transition-all"
            >
              Apply Online
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 bg-[#0B1B2B] hover:bg-[#162E48] text-white rounded-lg text-xs font-semibold tracking-wide border border-[#0B1B2B] shadow-sm hover:shadow transition-all flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 text-[#DFBF77]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Institutional Portals
            </Link>
          </div>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setNavOpen(!navOpen)}
            className="lg:hidden p-2 text-gray-700 hover:text-[#0B1B2B]"
            aria-label="Toggle Menu"
          >
            <span className="text-2xl">{navOpen ? '✕' : '☰'}</span>
          </button>
        </div>

        {/* Mobile Dropdown */}
        {navOpen && (
          <div className="lg:hidden border-t border-[#E8E6DF] bg-white px-6 py-5 space-y-3 animate-fade-in shadow-xl">
            <a href="#about" onClick={() => setNavOpen(false)} className="block py-1.5 text-sm font-semibold text-gray-700">The Academy</a>
            <a href="#faculties" onClick={() => setNavOpen(false)} className="block py-1.5 text-sm font-semibold text-gray-700">Academics &amp; Curricula</a>
            <a href="#facilities" onClick={() => setNavOpen(false)} className="block py-1.5 text-sm font-semibold text-gray-700">Campus Facilities</a>
            <a href="#admissions" onClick={() => setNavOpen(false)} className="block py-1.5 text-sm font-semibold text-gray-700">Admissions &amp; Fees</a>
            <a href="#contact" onClick={() => setNavOpen(false)} className="block py-1.5 text-sm font-semibold text-gray-700">Contact &amp; Location</a>
            <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
              <Link to="/admissions" onClick={() => setNavOpen(false)} className="w-full text-center py-2.5 bg-[#F6F5EF] text-[#0B1B2B] rounded-lg font-semibold text-sm border border-[#DCD9CE]">
                Online Admissions
              </Link>
              <Link to="/login" onClick={() => setNavOpen(false)} className="w-full text-center py-2.5 bg-[#0B1B2B] text-white rounded-lg font-semibold text-sm">
                Sign in to Institutional Portal
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ═══════ HERO: EDITORIAL MAJESTIC BANNER ═══════ */}
      <section id="about" className="relative bg-[#0B1B2B] text-white pt-16 pb-24 md:py-24 overflow-hidden border-b border-[#C5A059]/20">
        
        {/* Subtle Architectural Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#DFBF77_1px,transparent_1px)] [background-size:24px_24px]"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Manifesto & Narrative */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Accreditation Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#162E48]/80 border border-[#C5A059]/40 text-[#DFBF77] text-xs font-semibold tracking-wide">
              <svg className="w-3.5 h-3.5 text-[#DFBF77]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Ranked #1 Co-Educational Academy in Tamil Nadu</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white leading-[1.15] tracking-tight">
              Where Intellectual Rigor Meets <span className="text-[#DFBF77] italic font-normal">Moral Character</span> &amp; Global Leadership.
            </h1>

            {/* Mission paragraph */}
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-xl font-normal">
              For over 27 years, Apex International Academy has provided an extraordinary educational journey from Nursery through Grade XII. We cultivate independent thinkers, scientific innovators, and compassionate citizens prepared to excel in the world’s leading universities.
            </p>

            {/* Actions & Proof */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                to="/admissions"
                className="btn-gold flex items-center gap-2 group"
              >
                <span>Apply for 2025–26 Session</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link
                to="/login"
                className="btn-outline-white flex items-center gap-2"
              >
                <span>Enter Institutional Portal</span>
                <svg className="w-4 h-4 text-[#DFBF77]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </Link>
            </div>

            {/* Accreditation Icons */}
            <div className="pt-6 border-t border-white/10 flex flex-wrap items-center gap-6 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                <span>CBSE Senior Secondary Affiliation</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C5A059]"></span>
                <span>British Council International Dimension</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#3b82f6]"></span>
                <span>Atal Tinkering STEM Lab</span>
              </div>
            </div>

          </div>

          {/* Right Column: Architectural Campus Vista Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-[#C5A059]/30 shadow-2xl bg-[#071320]">
              <img
                src={heroSrc}
                alt="Apex Academy Quadrangle Campus"
                className="w-full h-80 sm:h-96 object-cover object-center filter brightness-95 hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B2B] via-transparent to-transparent opacity-80"></div>
              
              {/* Floating Architectural Badge */}
              <div className="absolute bottom-5 left-5 right-5 p-4 rounded-xl bg-[#0B1B2B]/90 backdrop-blur-md border border-[#C5A059]/40 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-[#DFBF77]">Main Heritage Campus</div>
                  <div className="text-xs font-semibold text-white mt-0.5">18-Acre Central Quadrangle &amp; Science Park</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-white">Est. 1998</div>
                  <div className="text-[10px] text-gray-400">Anna Nagar, Chennai</div>
                </div>
              </div>
            </div>

            {/* Subtle Accent Glow Ring */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#C5A059]/10 rounded-full blur-2xl pointer-events-none"></div>
          </div>

        </div>
      </section>

      {/* ═══════ STATISTICAL INTEGRITY BAR ═══════ */}
      <section className="bg-white border-b border-[#E8E6DF] py-10 shadow-sm relative z-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          {displayStats.map((s, idx) => (
            <div key={idx} className={`pt-4 md:pt-0 ${idx > 0 ? 'md:pl-8' : ''} text-center md:text-left`}>
              <div className="text-3xl lg:text-4xl font-serif font-bold text-[#0B1B2B]">
                <Counter end={s.value} suffix={s.suffix} />
              </div>
              <div className="text-xs uppercase font-semibold tracking-wider text-[#8C6837] mt-1.5">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ PRINCIPAL'S WELCOME ADDRESS ═══════ */}
      <section className="py-20 bg-[#FAF9F5]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="card p-8 md:p-12 bg-white border border-[#E5E2D6] relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              <div className="lg:col-span-4 text-center lg:text-left">
                <div className="relative inline-block">
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80"
                    alt="Dr. Eleanor Vance, Principal"
                    className="w-44 h-44 sm:w-52 sm:h-52 rounded-xl object-cover border-2 border-[#C5A059]/40 shadow-md mx-auto"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-[#0B1B2B] text-[#DFBF77] p-2 rounded-lg border border-[#C5A059]/50 shadow">
                    <SchoolCrest className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="font-serif font-bold text-base text-[#0B1B2B]">Dr. Eleanor Vance</h4>
                  <p className="text-xs text-[#8C6837] font-semibold mt-0.5">Ph.D. Education (Oxford) • Principal</p>
                  <p className="text-[11px] text-gray-500 mt-1">Academic Director &amp; Trustee</p>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-4">
                <div className="text-[#C5A059] font-serif text-3xl leading-none">“</div>
                <h3 className="text-2xl font-serif font-bold text-[#0B1B2B] leading-snug">
                  Education is not merely the transmission of information; it is the awakening of curiosity, conscience, and purpose.
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Welcome to Apex International Academy. For over two decades, our campus has provided an intellectual sanctuary where timeless values merge with 21st-century technological fluency. We do not assess children purely by standardized test marks, but by the tenacity of their questioning, the generosity of their character, and their resolve to leave the world better than they found it.
                </p>
                <div className="pt-2 flex items-center gap-4 text-xs font-semibold text-[#0B1B2B]">
                  <span>Office of the Principal</span>
                  <span>•</span>
                  <span>Apex Academic Council</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ═══════ ACADEMIC DISCIPLINES & FACULTIES ═══════ */}
      <section id="faculties" className="py-20 bg-white border-t border-[#E8E6DF]">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase font-bold tracking-widest text-[#8C6837] block mb-2">Curriculum of Distinction</span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#0B1B2B]">
              Rigorous Faculties for Inquiring Minds
            </h2>
            <p className="text-sm text-gray-600 mt-3 leading-relaxed">
              Structured to follow the CBSE Senior Secondary syllabus, enriched with interdisciplinary research, laboratory immersion, and international collegiate standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {faculties.map((f, i) => (
              <div key={i} className="card p-7 hover:border-[#C5A059] group transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded bg-[#0B1B2B] text-[#DFBF77] tracking-wider">
                      {f.code}
                    </span>
                    <span className="text-[11px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                      {f.grades}
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-lg text-[#0B1B2B] mb-2 group-hover:text-[#8C6837] transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-[#0B1B2B] font-semibold">
                  <span>Learn Curriculum Scope</span>
                  <span className="text-[#C5A059] group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ═══════ INTERACTIVE ARCHITECTURAL CAMPUS TOUR ═══════ */}
      <section id="facilities" className="py-20 bg-[#FAF9F5] border-t border-[#E8E6DF]">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-[#8C6837] block mb-2">Built for Exploration</span>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#0B1B2B]">
                World-Class Campus Infrastructure
              </h2>
            </div>
            
            {/* Tab Controls */}
            <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
              {Object.keys(facilities).map(key => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide capitalize transition-all ${
                    activeTab === key
                      ? 'bg-[#0B1B2B] text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-[#E2E0D8] hover:border-[#0B1B2B]'
                  }`}
                >
                  {key === 'labs' ? 'STEM Discovery' : key === 'library' ? 'Central Library' : key === 'sports' ? 'Athletics & Sports' : 'Conservatory Arts'}
                </button>
              ))}
            </div>
          </div>

          {/* Active Facility Card */}
          <div className="card overflow-hidden bg-white border border-[#E2E0D8]">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-7 h-72 sm:h-96 lg:h-[420px] overflow-hidden">
                <img
                  src={facilities[activeTab].image}
                  alt={facilities[activeTab].title}
                  className="w-full h-full object-cover filter brightness-95 hover:scale-105 transition-transform duration-700 ease-out"
                />
              </div>
              <div className="lg:col-span-5 p-8 lg:p-12 flex flex-col justify-between bg-white">
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-[#C5A059] uppercase block mb-1">Architectural Highlight</span>
                  <h3 className="text-2xl font-serif font-bold text-[#0B1B2B] mb-3">
                    {facilities[activeTab].title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-6">
                    {facilities[activeTab].desc}
                  </p>
                  
                  <div className="space-y-2.5">
                    {facilities[activeTab].specs.map((spec, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-xs text-gray-700">
                        <svg className="w-4 h-4 text-[#8C6837] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">Campus Block 02</span>
                  <Link to="/calendar" className="text-xs font-semibold text-[#0B1B2B] hover:text-[#8C6837] flex items-center gap-1">
                    Book Campus Walkthrough →
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ═══════ UNIVERSITY PLACEMENTS & ALUMNI GLORY ═══════ */}
      <section className="py-16 bg-[#0B1B2B] text-white border-t border-b border-[#C5A059]/20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <span className="text-xs uppercase font-bold tracking-widest text-[#DFBF77] block mb-2">The Apex Legacy</span>
          <h3 className="text-2xl md:text-3xl font-serif font-bold text-white mb-8">
            Graduates Matriculating to the World’s Premier Universities
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 text-sm font-serif text-gray-300 opacity-90">
            <span className="border-b border-[#C5A059]/40 pb-1">University of Oxford</span>
            <span className="border-b border-[#C5A059]/40 pb-1">Massachusetts Institute of Technology</span>
            <span className="border-b border-[#C5A059]/40 pb-1">Stanford University</span>
            <span className="border-b border-[#C5A059]/40 pb-1">Indian Institute of Technology (IIT)</span>
            <span className="border-b border-[#C5A059]/40 pb-1">University of Cambridge</span>
            <span className="border-b border-[#C5A059]/40 pb-1">National University of Singapore</span>
          </div>
        </div>
      </section>

      {/* ═══════ ADMISSIONS CALL TO ACTION ═══════ */}
      <section id="admissions" className="py-20 bg-[#F6F5EF] relative">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <SchoolCrest className="w-12 h-12 mx-auto mb-4" />
          <span className="text-xs uppercase font-bold tracking-widest text-[#8C6837] block mb-1">Admissions Open 2025–2026</span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#0B1B2B] mb-4">
            Begin Your Child’s Journey at Apex Academy
          </h2>
          <p className="text-sm text-gray-600 max-w-xl mx-auto mb-8 leading-relaxed">
            Applications are invited for Nursery through Grade XI. We invite discerning parents to explore our campus, meet our faculty heads, and experience our community firsthand.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4">
            <Link
              to="/admissions"
              className="btn-gold"
            >
              Submit Online Admission Form
            </Link>
            <a
              href={`tel:${phone}`}
              className="btn-secondary flex items-center gap-2"
            >
              <span>Speak with Admissions Desk</span>
              <span className="text-gray-400">({phone})</span>
            </a>
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER & STATUTORY MANDATORY DISCLOSURES ═══════ */}
      <footer id="contact" className="bg-[#0B1B2B] text-gray-400 pt-16 pb-10 border-t border-[#C5A059]/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 mb-12">
            
            {/* School Profile */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <SchoolCrest className="w-10 h-10" />
                <div>
                  <h4 className="font-serif font-bold text-white text-base leading-tight">{name}</h4>
                  <p className="text-[11px] text-[#DFBF77] tracking-wider uppercase font-semibold">Affiliated to CBSE, New Delhi</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
                Dedicated to scholarly excellence, character, and selfless leadership since 1998. Recognized under the Tamil Nadu Private Schools Directorate and CBSE Framework.
              </p>
              <div className="text-[11px] text-gray-400 space-y-1 pt-1">
                <div>Affiliation No: <strong className="text-gray-200">198042</strong> | School Code: <strong className="text-gray-200">45012</strong></div>
                <div>UDISE No: <strong className="text-gray-200">33020701402</strong></div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="lg:col-span-3 space-y-3">
              <h5 className="font-serif font-bold text-white text-sm">Academy Portals</h5>
              <ul className="text-xs space-y-2 text-gray-400">
                <li><Link to="/login" className="hover:text-[#DFBF77] transition-colors">Parent &amp; Student Portal</Link></li>
                <li><Link to="/login" className="hover:text-[#DFBF77] transition-colors">Faculty &amp; Teacher Workspace</Link></li>
                <li><Link to="/login" className="hover:text-[#DFBF77] transition-colors">Management Directorate</Link></li>
                <li><Link to="/admissions" className="hover:text-[#DFBF77] transition-colors">Admissions Prospectus 2025–26</Link></li>
                <li><Link to="/calendar" className="hover:text-[#DFBF77] transition-colors">Institutional Calendar &amp; Terms</Link></li>
              </ul>
            </div>

            {/* Contact & Hours */}
            <div className="lg:col-span-4 space-y-3">
              <h5 className="font-serif font-bold text-white text-sm">Administrative Secretariat</h5>
              <div className="text-xs text-gray-400 space-y-2">
                <p>📍 {address}</p>
                <p>📞 Phone: <a href={`tel:${phone}`} className="text-gray-200 hover:text-white">{phone}</a></p>
                <p>✉️ Admissions: <a href={`mailto:${email}`} className="text-gray-200 hover:text-white">{email}</a></p>
                <p className="text-gray-500 pt-1">Campus gates open Mon–Sat 07:30 AM to 05:00 PM</p>
              </div>
            </div>

          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <div>
              © {new Date().getFullYear()} {name}. All rights reserved. Registered Educational Trust.
            </div>
            <div className="flex items-center gap-6">
              <span className="hover:text-gray-400 cursor-pointer">CBSE Mandatory Disclosure</span>
              <span className="hover:text-gray-400 cursor-pointer">Privacy Charter</span>
              <span className="hover:text-gray-400 cursor-pointer">Anti-Bullying Policy</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
