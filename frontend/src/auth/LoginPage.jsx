import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { HiShieldCheck, HiAcademicCap, HiBookOpen, HiLockClosed, HiArrowLeft, HiTruck, HiUserGroup } from 'react-icons/hi2'

/* ── Heraldic Crest SVG Component ── */
function SchoolCrest({ className = "w-10 h-10" }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 5 L88 20 V52 C88 75 50 94 50 94 C50 94 12 75 12 52 V20 L50 5 Z" fill="#0B1B2B" stroke="#C5A059" strokeWidth="3" />
      <path d="M50 12 L80 24 V50 C80 69 50 85 50 85 C50 85 20 69 20 50 V24 L50 12 Z" stroke="#DFBF77" strokeWidth="1" strokeDasharray="3 2" />
      <path d="M34 46 C42 43 48 45 50 49 C52 45 58 43 66 46 V65 C58 62 52 64 50 67 C48 64 42 62 34 65 V46 Z" fill="#C5A059" />
      <path d="M50 49 V67" stroke="#0B1B2B" strokeWidth="1.5" />
      <path d="M50 24 C53 29 55 32 50 38 C45 32 47 29 50 24 Z" fill="#DFBF77" />
      <circle cx="50" cy="39" r="2.5" fill="#C5A059" />
      <circle cx="34" cy="35" r="1.5" fill="#DFBF77" />
      <circle cx="66" cy="35" r="1.5" fill="#DFBF77" />
    </svg>
  )
}

const portals = [
  {
    role: 'MANAGEMENT',
    label: 'Directorate & Admin',
    desc: 'Trustees, Principal, Registrar & Bursar',
    icon: HiShieldCheck,
    badge: 'Administrative SSO',
    username: 'admin',
    password: 'admin123'
  },
  {
    role: 'TEACHER',
    label: 'Faculty & Academics',
    desc: 'Department Chairs, Teachers & Instructors',
    icon: HiBookOpen,
    badge: 'Faculty Gateway',
    username: 'teacher1',
    password: 'teacher123'
  },
  {
    role: 'STUDENT',
    label: 'Scholars Desk',
    desc: 'Students & Academic Records',
    icon: HiAcademicCap,
    badge: 'Student Portal',
    username: 'student1',
    password: 'student123'
  },
  {
    role: 'PARENT',
    label: 'Guardians & Family',
    desc: 'Parents, Wards & Real-Time Tracking',
    icon: HiUserGroup,
    badge: 'Family Gateway',
    username: 'parent1',
    password: 'parent123'
  },
  {
    role: 'BUS_OPERATOR',
    label: 'Bus Fleet Operator',
    desc: 'On-Board GPS Console & Route Dispatch',
    icon: HiTruck,
    badge: 'Transport Sub-Login',
    username: 'bus01',
    password: 'bus123'
  },
]

export default function LoginPage() {
  const { login, loading, getRoleDashboard } = useAuth()
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState('MANAGEMENT')
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')

  const activePortal = portals.find(p => p.role === selectedRole) || portals[0]

  const handleSelectRole = (role) => {
    setSelectedRole(role)
    setError('')
    const p = portals.find(item => item.role === role)
    if (p) {
      setUsername(p.username)
      setPassword(p.password)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    const result = await login(username, password)
    if (result.success) {
      navigate(getRoleDashboard(result.role))
    } else {
      setError(result.message || 'Invalid institutional credentials. Please verify your username and password.')
    }
  }

  return (
    <div className="min-h-screen bg-[#0B1B2B] text-[#D8D4C7] flex flex-col justify-between relative overflow-hidden font-sans">
      
      {/* Background Architectural Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#DFBF77_1px,transparent_1px)] [background-size:24px_24px]"></div>

      {/* Top Header Bar */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group text-gray-300 hover:text-white transition-colors">
          <HiArrowLeft className="w-4 h-4 text-[#DFBF77] group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-semibold tracking-wider uppercase">Return to Public Academy Website</span>
        </Link>
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-[#DFBF77] border border-[#C5A059]/30 px-3 py-1 rounded-full bg-[#162E48]/50">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
          <span>Single Sign-On (SSO) Operational</span>
        </div>
      </div>

      {/* Central Login Card Container */}
      <div className="relative z-10 w-full max-w-xl mx-auto px-6 py-8">
        
        {/* Heraldic Header */}
        <div className="text-center mb-8">
          <SchoolCrest className="w-14 h-14 mx-auto mb-3" />
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
            Apex International Academy
          </h1>
          <p className="text-xs text-[#8C6837] uppercase tracking-widest font-semibold mt-1">
            Unified Institutional Authentication Gateway
          </p>
        </div>

        {/* The Card */}
        <div className="bg-[#0F243A] rounded-2xl border border-[#C5A059]/30 shadow-2xl p-7 sm:p-9 relative overflow-hidden">
          
          {/* Subtle top gold accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C5A059] to-transparent"></div>

          {/* Role Selector Tabs */}
          <div className="mb-7">
            <label className="block text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-2.5">
              Select Your Access Domain
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-[#081523] p-1.5 rounded-xl border border-white/5">
              {portals.map((p) => {
                const isSelected = selectedRole === p.role
                return (
                  <button
                    key={p.role}
                    type="button"
                    onClick={() => handleSelectRole(p.role)}
                    className={`py-2.5 px-2 rounded-lg text-xs font-semibold transition-all flex flex-col items-center justify-center gap-1.5 text-center ${
                      isSelected
                        ? 'bg-[#162E48] text-[#DFBF77] border border-[#C5A059]/40 shadow-sm'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    }`}
                  >
                    <p.icon className="w-4 h-4 shrink-0" />
                    <span className="truncate text-[11px]">{p.label.split(' ')[0]}</span>
                  </button>
                )
              })}
            </div>
            <p className="text-[11px] text-gray-400 mt-2 italic text-center">
              Target Scope: <span className="text-[#DFBF77] font-medium">{activePortal.desc}</span>
            </p>
          </div>

          {/* Auto-filled Demo Passkey Strip */}
          <div className="mb-6 p-3.5 rounded-xl bg-[#081523] border border-[#C5A059]/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">
                {selectedRole === 'MANAGEMENT'
                  ? 'Select Staff Persona (Granular RBAC Demo)'
                  : selectedRole === 'BUS_OPERATOR'
                  ? 'Select Bus Fleet Unit (Sub-Login)'
                  : 'Authorized Demo Account'}
              </span>
              <span className="text-[10px] text-[#DFBF77] font-mono">
                {selectedRole === 'BUS_OPERATOR' ? 'Pass: bus123 / transport123' : 'Pass: admin123 / teacher123 / student123'}
              </span>
            </div>

            {selectedRole === 'MANAGEMENT' ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                {[
                  { label: 'Super Admin', user: 'admin', pass: 'admin123', tag: 'Full Directorate' },
                  { label: 'Accountant', user: 'bursar', pass: 'admin123', tag: 'Fees & Payroll' },
                  { label: 'Librarian', user: 'librarian', pass: 'admin123', tag: 'E-Library' },
                  { label: 'Registrar', user: 'registrar', pass: 'admin123', tag: 'Students & Classes' },
                ].map((persona) => {
                  const isActive = username === persona.user
                  return (
                    <button
                      key={persona.user}
                      type="button"
                      onClick={() => {
                        setUsername(persona.user)
                        setPassword(persona.pass)
                      }}
                      className={`px-2 py-1.5 rounded-lg text-left transition-all border ${
                        isActive
                          ? 'bg-[#162E48] border-[#C5A059] text-white shadow-sm'
                          : 'bg-[#0B1B2B]/60 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <div className="text-[11px] font-semibold text-[#DFBF77] truncate">{persona.label}</div>
                      <div className="text-[9px] text-gray-400 font-mono truncate">{persona.user}</div>
                    </button>
                  )
                })}
              </div>
            ) : selectedRole === 'BUS_OPERATOR' ? (
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {[
                  { label: 'Bus 01 (GPS-01)', user: 'bus01', pass: 'bus123', tag: 'South Corridor' },
                  { label: 'Bus 02 (GPS-02)', user: 'bus02', pass: 'bus123', tag: 'North Corridor' },
                  { label: 'Transport Head', user: 'transport_officer', pass: 'transport123', tag: 'Fleet In-Charge' },
                ].map((persona) => {
                  const isActive = username === persona.user
                  return (
                    <button
                      key={persona.user}
                      type="button"
                      onClick={() => {
                        setUsername(persona.user)
                        setPassword(persona.pass)
                      }}
                      className={`px-2 py-1.5 rounded-lg text-left transition-all border ${
                        isActive
                          ? 'bg-[#162E48] border-[#C5A059] text-white shadow-sm'
                          : 'bg-[#0B1B2B]/60 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <div className="text-[11px] font-semibold text-[#DFBF77] truncate">{persona.label}</div>
                      <div className="text-[9px] text-gray-400 font-mono truncate">{persona.user}</div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1">
                <div className="font-mono text-white text-xs">
                  <span className="text-[#DFBF77]">{activePortal.username}</span> / <span>{activePortal.password}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUsername(activePortal.username)
                    setPassword(activePortal.password)
                  }}
                  className="text-[11px] font-semibold text-[#DFBF77] hover:text-white px-2.5 py-1 rounded bg-[#162E48] border border-[#C5A059]/30 hover:border-[#C5A059] transition-all"
                >
                  Fill Credentials
                </button>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-900/30 border border-red-500/40 text-red-200 text-xs leading-relaxed">
              ⚠️ {error}
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Institutional ID / Username
              </label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#081523] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all font-mono"
                placeholder="Enter authorized username"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-300">
                  Password
                </label>
                <span className="text-[11px] text-[#DFBF77] hover:underline cursor-pointer">
                  Forgot credentials?
                </span>
              </div>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#081523] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all font-mono"
                placeholder="Enter account password"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                id="login-submit"
                className="btn-gold w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold tracking-wide disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4 text-[#0B1B2B]" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Authenticating Identity...</span>
                  </>
                ) : (
                  <>
                    <HiLockClosed className="w-4 h-4 text-[#0B1B2B]" />
                    <span>Authorize &amp; Sign In</span>
                  </>
                )}
              </button>
            </div>
          </form>

        </div>

        {/* Security & Regulatory Notice */}
        <div className="mt-8 text-center text-xs text-gray-400 space-y-1">
          <p className="flex items-center justify-center gap-2 text-[11px] text-[#8C6837]">
            <span>🔒 256-Bit SSL Secured</span>
            <span>•</span>
            <span>FERPA &amp; ISO 27001 Certified Infrastructure</span>
          </p>
          <p className="text-[11px]">
            Apex International Academy © 2026. Directorate of Digital Governance.
          </p>
        </div>

      </div>

      {/* Footer copyright space */}
      <div className="py-4"></div>
    </div>
  )
}
