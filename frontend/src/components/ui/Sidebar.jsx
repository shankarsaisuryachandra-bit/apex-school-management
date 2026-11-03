import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import AiStudyTutorModal from '../AiStudyTutorModal'
import {
  HiHome, HiBanknotes, HiPaintBrush, HiArrowsUpDown,
  HiClipboardDocumentList, HiBookOpen, HiChartBar,
  HiCurrencyRupee, HiAcademicCap, HiArrowRightOnRectangle,
  HiUserGroup, HiBuildingLibrary, HiSparkles, HiTruck,
  HiCalendar, HiClipboardDocumentCheck, HiPhoto, HiCube, HiHeart, HiCommandLine, HiIdentification,
  HiDocumentText, HiCreditCard, HiArrowTopRightOnSquare, HiShieldCheck, HiCircleStack, HiChatBubbleLeftRight,
  HiSun, HiMoon
} from 'react-icons/hi2'

function SchoolCrest({ className = "w-9 h-9" }) {
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

const categorizedNav = {
  MANAGEMENT: [
    {
      section: 'DIRECTORATE & OVERVIEW',
      items: [
        { path: '/management', label: 'Principal Executive Cockpit', icon: HiHome, permission: 'DASHBOARD' },
        { path: '/messages', label: 'In-App Messages & Chat', icon: HiChatBubbleLeftRight },
        { path: '/management/audit-logs', label: 'System Audit Trail', icon: HiCommandLine, permission: 'AUDIT_LOGS' },
      ]
    },
    {
      section: 'SECURITY & GOVERNANCE',
      items: [
        { path: '/management/roles', label: 'Staff Roles & Permissions', icon: HiShieldCheck, permission: 'RBAC' },
        { path: '/management/backup', label: 'Database Backup & Recovery', icon: HiCircleStack, permission: 'BACKUP' },
      ]
    },
    {
      section: 'PEOPLE & CLASSES',
      items: [
        { path: '/management/students', label: 'Student Directory', icon: HiUserGroup, permission: 'STUDENTS' },
        { path: '/management/teachers', label: 'Faculty Roster', icon: HiAcademicCap, permission: 'TEACHERS' },
        { path: '/management/classes', label: 'Classes & Subjects', icon: HiBuildingLibrary, permission: 'CLASSES' },
        { path: '/management/promotions', label: 'Batch Promotions', icon: HiArrowsUpDown, permission: 'PROMOTIONS' },
      ]
    },
    {
      section: 'ACADEMICS & CURRICULUM',
      items: [
        { path: '/management/assignments', label: 'Assignments Desk', icon: HiDocumentText, permission: 'ASSIGNMENTS' },
        { path: '/management/library', label: 'Institutional E-Library', icon: HiBookOpen, permission: 'LIBRARY' },
        { path: '/management/admit-cards', label: 'Exam Admit Cards', icon: HiIdentification, permission: 'ADMIT_CARDS' },
        { path: '/management/events', label: 'Master Calendar', icon: HiCalendar, permission: 'EVENTS' },
      ]
    },
    {
      section: 'GOVERNANCE & APPROVALS',
      items: [
        { path: '/management/substitutions', label: 'Daily Cover Manager', icon: HiArrowsUpDown, permission: 'SUBSTITUTIONS' },
        { path: '/management/leaves', label: 'Leave Authorizations', icon: HiClipboardDocumentCheck, permission: 'LEAVES' },
        { path: '/management/ptm', label: 'PTM Conferences', icon: HiUserGroup, permission: 'PTM' },
        { path: '/management/health', label: 'Health Dispensary', icon: HiHeart, permission: 'HEALTH' },
      ]
    },
    {
      section: 'BURSAR & OPERATIONS',
      items: [
        { path: '/management/fees', label: 'Fee Accounts Ledger', icon: HiBanknotes, permission: 'FEES' },
        { path: '/management/payroll', label: 'Faculty Payroll', icon: HiCurrencyRupee, permission: 'PAYROLL' },
        { path: '/management/transport', label: 'Fleet & Transport', icon: HiTruck, permission: 'TRANSPORT' },
        { path: '/management/inventory', label: 'Campus Inventory', icon: HiCube, permission: 'INVENTORY' },
      ]
    },
    {
      section: 'OUTREACH & HERITAGE',
      items: [
        { path: '/management/cms', label: 'Website CMS & News', icon: HiPaintBrush, permission: 'CMS' },
        { path: '/management/gallery', label: 'Campus Photo Archive', icon: HiPhoto, permission: 'GALLERY' },
        { path: '/management/alumni', label: 'Alumni Fellowship', icon: HiSparkles, permission: 'ALUMNI' },
      ]
    }
  ],
  TEACHER: [
    {
      section: 'ACADEMIC PORTAL',
      items: [
        { path: '/teacher', label: 'Faculty Dashboard', icon: HiHome },
        { path: '/teacher/library', label: 'E-Library & Courseware', icon: HiBookOpen },
        { path: '/teacher/attendance', label: 'Daily Register / Roll', icon: HiClipboardDocumentList },
        { path: '/teacher/gradebook', label: 'Academic Gradebook', icon: HiBookOpen },
        { path: '/teacher/assignments', label: 'Assignments Desk', icon: HiDocumentText },
      ]
    },
    {
      section: 'EXAMS & LOGISTICS',
      items: [
        { path: '/teacher/admit-cards', label: 'Exam Hall Tickets', icon: HiIdentification },
        { path: '/teacher/events', label: 'Term Calendar', icon: HiCalendar },
      ]
    },
    {
      section: 'ENGAGEMENT & REQUESTS',
      items: [
        { path: '/messages', label: 'Parent & Class Messages', icon: HiChatBubbleLeftRight },
        { path: '/teacher/leaves', label: 'Leave Requests', icon: HiClipboardDocumentCheck },
        { path: '/teacher/ptm', label: 'Parent-Teacher Meets', icon: HiUserGroup },
        { path: '/teacher/health', label: 'Student Wellness', icon: HiHeart },
      ]
    }
  ],
  STUDENT: [
    {
      section: 'SCHOLAR DESK',
      items: [
        { path: '/student', label: 'Student Overview', icon: HiHome },
        { path: '/student/academics', label: 'Marks & Academic Record', icon: HiChartBar },
        { path: '/student/attendance', label: 'My Attendance Register', icon: HiClipboardDocumentList },
        { path: '/student/assignments', label: 'Homework & Submissions', icon: HiDocumentText },
        { path: '/student/library', label: 'Digital Library & Notes', icon: HiBookOpen },
      ]
    },
    {
      section: 'ACCOUNTS & CREDENTIALS',
      items: [
        { path: '/student/fees', label: 'Fee Dues & Receipts', icon: HiCurrencyRupee },
        { path: '/student/admit-cards', label: 'Exam Hall Pass', icon: HiIdentification },
        { path: '/student/id-card', label: 'Digital Student ID', icon: HiCreditCard },
      ]
    },
    {
      section: 'STUDENT LIFE & CALENDAR',
      items: [
        { path: '/messages', label: 'Teacher & Class Chat', icon: HiChatBubbleLeftRight },
        { path: '/student/events', label: 'School Calendar', icon: HiCalendar },
        { path: '/student/leaves', label: 'Apply Leave Request', icon: HiClipboardDocumentCheck },
        { path: '/student/ptm', label: 'PTM Schedule', icon: HiUserGroup },
        { path: '/student/gallery', label: 'Campus Gallery', icon: HiPhoto },
        { path: '/student/health', label: 'Medical Profile', icon: HiHeart },
      ]
    }
  ],
  PARENT: [
    {
      section: 'FAMILY & WARDS',
      items: [
        { path: '/parent', label: 'Parent Cockpit & Children', icon: HiHome },
        { path: '/parent/attendance', label: 'Ward Attendance & Live Bus', icon: HiClipboardDocumentList },
        { path: '/parent/academics', label: 'Term Marks & Report Card', icon: HiChartBar },
        { path: '/parent/fees', label: 'Fee Ledger & Online Pay', icon: HiCurrencyRupee },
      ]
    },
    {
      section: 'COMMUNICATION & REQUESTS',
      items: [
        { path: '/messages', label: 'Direct Teacher Chat', icon: HiChatBubbleLeftRight },
        { path: '/parent/ptm', label: 'PTM Conferences', icon: HiUserGroup },
        { path: '/parent/leaves', label: 'Absence & Leave Notes', icon: HiClipboardDocumentCheck },
      ]
    }
  ],
  BUS_OPERATOR: [
    {
      section: 'FLEET OPERATIONS',
      items: [
        { path: '/bus-console', label: 'On-Board GPS Console', icon: HiTruck },
      ]
    }
  ]
}

const roleMeta = {
  MANAGEMENT: {
    portalName: 'DIRECTORATE PORTAL',
    badge: 'Executive Administration',
    badgeColor: 'bg-[#C5A059]/20 text-[#DFBF77] border border-[#C5A059]/40',
  },
  TEACHER: {
    portalName: 'FACULTY OF ACADEMICS',
    badge: 'Faculty Member',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  },
  STUDENT: {
    portalName: 'SCHOLAR PORTAL',
    badge: 'Student / Scholar',
    badgeColor: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
  },
  PARENT: {
    portalName: 'GUARDIAN & FAMILY PORTAL',
    badge: 'Parent / Legal Guardian',
    badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  },
  BUS_OPERATOR: {
    portalName: 'TRANSPORT DISPATCH',
    badge: 'On-Board Bus Operator',
    badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  },
}

export default function Sidebar({ role, onClose }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [showAiModal, setShowAiModal] = useState(false)
  const navigate = useNavigate()
  const rawSections = categorizedNav[role] || []
  const meta = roleMeta[role] || roleMeta.STUDENT

  // Check RBAC permission for management items
  const hasPermission = (permission) => {
    if (!permission) return true
    if (role !== 'MANAGEMENT') return true
    if (!user) return true
    if (user.staffRole === 'SUPER_ADMIN') return true
    const perms = user.permissions || []
    if (perms.includes('*')) return true
    return perms.includes(permission)
  }

  // Filter sections and items based on permissions
  const sections = rawSections
    .map((sec) => ({
      ...sec,
      items: sec.items.filter((item) => hasPermission(item.permission))
    }))
    .filter((sec) => sec.items.length > 0)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Dynamic badge for staff roles
  const displayBadge = (role === 'MANAGEMENT' && user?.staffRole)
    ? user.staffRole.replace(/_/g, ' ')
    : meta.badge

  return (
    <aside className="w-72 bg-[#0B1B2B] text-slate-300 flex flex-col h-full border-r border-[#1B2F44] shadow-2xl shrink-0 select-none">
      {/* Brand & Crest Header */}
      <div className="p-4 sm:p-5 border-b border-[#1B2F44] bg-[#071320]/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 p-1 rounded-lg bg-[#0B1B2B] border border-[#C5A059]/40 shadow-inner">
            <SchoolCrest className="w-8 h-8" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] tracking-[0.2em] font-serif font-bold text-[#C5A059] uppercase truncate">
              Apex International
            </div>
            <h2 className="font-serif font-bold text-white text-xs tracking-wide leading-tight truncate">
              {meta.portalName}
            </h2>
            <span className={`inline-block mt-1 text-[9px] font-semibold px-2 py-0.5 rounded-full ${meta.badgeColor} uppercase tracking-wider`}>
              {displayBadge}
            </span>
          </div>
        </div>

        {/* Close Button for Sidebar — Simple Logo (not an 'X') */}
        {onClose && (
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-xl text-slate-400 hover:text-[#DFBF77] hover:bg-[#122336] border border-[#1B2F44] hover:border-[#C5A059]/40 transition-all group shrink-0 active:scale-95 shadow-sm"
            title="Close / Hide Sidebar"
            aria-label="Close Sidebar"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5 transition-transform group-hover:-translate-x-0.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <polyline points="14 9 11 12 14 15" />
            </svg>
          </button>
        )}
      </div>

      {/* AI Academic Suite Quick Launcher */}
      <div className="px-3.5 pt-3 pb-1 shrink-0">
        <button
          onClick={() => setShowAiModal(true)}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-[#C5A059]/20 to-amber-600/10 hover:from-amber-500/30 hover:to-amber-600/20 border border-amber-500/40 text-amber-300 transition-all group shadow-sm active:scale-[0.98]"
          title="Open AI Academic Suite: Doubt Solver, Practice Quiz & Formula Cheatsheet"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-sm">
              <HiSparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div className="text-left truncate">
              <p className="text-[11px] font-bold text-white tracking-wide truncate">
                AI Academic Suite
              </p>
              <p className="text-[9px] text-amber-300 font-semibold uppercase tracking-wider truncate">
                Tutor • Quiz • Formulas
              </p>
            </div>
          </div>
          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 uppercase tracking-tighter">
            AI
          </span>
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 p-3.5 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-[#1B2F44]">
        {sections.map((sec, idx) => (
          <div key={idx} className="space-y-1">
            <p className="px-3 text-[10px] font-bold text-[#8C9BAE] tracking-[0.16em] uppercase">
              {sec.section}
            </p>
            <div className="space-y-0.5">
              {sec.items.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.path === `/${role.toLowerCase()}`}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#1B324D] to-[#122336] text-white border-l-2 border-[#C5A059] shadow-sm font-semibold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-[#122336]/60'
                    }`
                  }
                >
                  <link.icon className="w-4 h-4 shrink-0 text-[#C5A059]" />
                  <span className="truncate">{link.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User Information & Sign Out Footer */}
      <div className="p-3.5 border-t border-[#1B2F44] bg-[#071320]/80 space-y-2">
        <div className="px-3 py-2 rounded-lg bg-[#0F2236] border border-[#1E3752] flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-semibold text-white truncate">{user?.fullName || 'User'}</p>
            <p className="text-[10px] text-slate-400 truncate">ID: {user?.username || '—'}</p>
          </div>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            title="Open Public Academy Website"
            className="text-slate-400 hover:text-[#DFBF77] transition-colors p-1"
          >
            <HiArrowTopRightOnSquare className="w-4 h-4" />
          </a>
        </div>

        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-[#0F2236] hover:bg-[#152e4a] border border-[#1E3752] transition-all"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode (Ctrl+J)`}
        >
          <span className="flex items-center gap-2">
            {theme === 'dark' ? (
              <HiSun className="w-4 h-4 text-amber-400" />
            ) : (
              <HiMoon className="w-4 h-4 text-slate-400" />
            )}
            <span>Theme Mode</span>
          </span>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#071320] text-[#DFBF77] border border-[#C5A059]/30">
            {theme === 'dark' ? 'Dark' : 'Light'}
          </span>
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-300 hover:text-white hover:bg-rose-950/50 border border-rose-900/30 transition-all"
          id="logout-btn"
        >
          <HiArrowRightOnRectangle className="w-4 h-4" />
          <span>Sign Out of Portal</span>
        </button>
      </div>

      {showAiModal && <AiStudyTutorModal onClose={() => setShowAiModal(false)} />}
    </aside>
  )
}

