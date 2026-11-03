import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import {
  HiMagnifyingGlass,
  HiXMark,
  HiCommandLine,
  HiAcademicCap,
  HiUserGroup,
  HiBuildingLibrary,
  HiDocumentText,
  HiBanknotes,
  HiTruck,
  HiBookOpen,
  HiSparkles,
  HiSun,
  HiMoon,
  HiChatBubbleLeftRight,
  HiArrowRight,
  HiHeart,
  HiCalendar,
  HiIdentification,
  HiClock,
  HiShieldCheck,
  HiClipboardDocumentList
} from 'react-icons/hi2'

export default function SpotlightCommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()

  // Base navigation items available per role
  const allNavItems = [
    { id: 'cockpit', title: 'Principal Executive Cockpit', category: 'Directorate', path: '/management', icon: HiAcademicCap, roles: ['MANAGEMENT'] },
    { id: 'students', title: 'Student Directory & Admissions', category: 'People', path: '/management/students', icon: HiUserGroup, roles: ['MANAGEMENT'] },
    { id: 'teachers', title: 'Faculty & Teacher Roster', category: 'People', path: '/management/teachers', icon: HiAcademicCap, roles: ['MANAGEMENT'] },
    { id: 'classes', title: 'Classes, Sections & Subjects', category: 'Curriculum', path: '/management/classes', icon: HiBuildingLibrary, roles: ['MANAGEMENT'] },
    { id: 'assignments', title: 'Assignments & Gradebook Desk', category: 'Academics', path: '/management/assignments', icon: HiDocumentText, roles: ['MANAGEMENT', 'TEACHER', 'STUDENT'] },
    { id: 'fees', title: 'Fee Accounts & Payment Ledger', category: 'Finance', path: '/management/fees', icon: HiBanknotes, roles: ['MANAGEMENT'] },
    { id: 'transport', title: 'Transport Fleet & GPS Telemetry', category: 'Operations', path: '/management/transport', icon: HiTruck, roles: ['MANAGEMENT', 'BUS_OPERATOR'] },
    { id: 'elibrary', title: 'Institutional E-Library & Texts', category: 'Academics', path: '/management/library', icon: HiBookOpen, roles: ['MANAGEMENT', 'TEACHER', 'STUDENT'] },
    { id: 'health', title: 'Health Dispensary & Medical Records', category: 'Wellness', path: '/management/health', icon: HiHeart, roles: ['MANAGEMENT', 'TEACHER', 'STUDENT'] },
    { id: 'admit-cards', title: 'Term Exam Admit Cards', category: 'Exams', path: '/management/admit-cards', icon: HiIdentification, roles: ['MANAGEMENT', 'TEACHER', 'STUDENT'] },
    { id: 'events', title: 'School Events & Master Calendar', category: 'Campus', path: '/management/events', icon: HiCalendar, roles: ['MANAGEMENT', 'TEACHER', 'STUDENT'] },
    { id: 'ptm', title: 'Parent-Teacher Conferences (PTM)', category: 'Community', path: '/management/ptm', icon: HiUserGroup, roles: ['MANAGEMENT', 'TEACHER', 'PARENT', 'STUDENT'] },
    { id: 'substitutions', title: 'Daily Teacher Cover & Substitution', category: 'Operations', path: '/management/substitutions', icon: HiClock, roles: ['MANAGEMENT'] },
    { id: 'audit-logs', title: 'System Security Audit Trail', category: 'Security', path: '/management/audit-logs', icon: HiShieldCheck, roles: ['MANAGEMENT'] },

    // Teacher Portal Paths
    { id: 't-dash', title: 'Teacher Workspace Dashboard', category: 'Faculty', path: '/teacher', icon: HiAcademicCap, roles: ['TEACHER'] },
    { id: 't-att', title: 'Daily Attendance Register', category: 'Faculty', path: '/teacher/attendance', icon: HiClipboardDocumentList, roles: ['TEACHER'] },
    { id: 't-grade', title: 'Gradebook & Assessment Scoring', category: 'Faculty', path: '/teacher/gradebook', icon: HiBookOpen, roles: ['TEACHER'] },

    // Student Portal Paths
    { id: 's-dash', title: 'Student Academic Dashboard', category: 'Student', path: '/student', icon: HiAcademicCap, roles: ['STUDENT'] },
    { id: 's-fees', title: 'My Fee Invoices & Receipts', category: 'Student', path: '/student/fees', icon: HiBanknotes, roles: ['STUDENT'] },
    { id: 's-acad', title: 'My Report Card & Exam Grades', category: 'Student', path: '/student/academics', icon: HiBookOpen, roles: ['STUDENT'] },
    { id: 's-att', title: 'My Attendance Record', category: 'Student', path: '/student/attendance', icon: HiClock, roles: ['STUDENT'] },

    // Parent Portal Paths
    { id: 'p-dash', title: 'Parent Guardian Dashboard', category: 'Parent', path: '/parent', icon: HiUserGroup, roles: ['PARENT'] },
    { id: 'p-att', title: 'Child Attendance Tracker', category: 'Parent', path: '/parent/attendance', icon: HiClock, roles: ['PARENT'] },
    { id: 'p-fees', title: 'Child Fee Clearance Portal', category: 'Parent', path: '/parent/fees', icon: HiBanknotes, roles: ['PARENT'] },

    // Messaging Hub (All Roles)
    { id: 'messages', title: 'In-App Messaging & Parent-Teacher Chat', category: 'Communication', path: '/messages', icon: HiChatBubbleLeftRight, roles: ['MANAGEMENT', 'TEACHER', 'STUDENT', 'PARENT'] },
  ]

  // Quick Action Commands
  const actionItems = [
    {
      id: 'toggle-theme',
      title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode (Ctrl+J)`,
      category: 'Preferences',
      action: () => toggleTheme(),
      icon: theme === 'dark' ? HiSun : HiMoon
    },
    {
      id: 'open-chat',
      title: 'Send a Message to Teacher / Parent',
      category: 'Communication',
      action: () => navigate('/messages'),
      icon: HiChatBubbleLeftRight
    },
    {
      id: 'quick-indus',
      title: 'View Gradebook: Ancient Indus Valley Civilization',
      category: 'Quick Access',
      action: () => navigate('/management/assignments'),
      icon: HiDocumentText
    }
  ]

  // Sample quick students list for rapid lookup
  const studentQuickItems = [
    { id: 'st-raghav', title: 'Raghav Prasad (Class 6-A • Roll 1)', category: 'Student Lookup', path: '/management/students?search=Raghav', icon: HiUserGroup },
    { id: 'st-atharv', title: 'Atharv Pillai (Class 2-A • Roll 1)', category: 'Student Lookup', path: '/management/students?search=Atharv', icon: HiUserGroup },
    { id: 'st-ananya', title: 'Ananya Sharma (Class 10-A • Roll 5)', category: 'Student Lookup', path: '/management/students?search=Ananya', icon: HiUserGroup },
    { id: 'st-aarav', title: 'Aarav Mehta (Class 8-A • Roll 3)', category: 'Student Lookup', path: '/management/students?search=Aarav', icon: HiUserGroup }
  ]

  // Filter items matching user role & search query
  const userRole = user?.role || 'STUDENT'
  const allowedNav = allNavItems.filter((i) => !i.roles || i.roles.includes(userRole))

  const allItems = [
    ...allowedNav,
    ...actionItems,
    ...(userRole === 'MANAGEMENT' || userRole === 'TEACHER' ? studentQuickItems : [])
  ]

  const filteredItems = query.trim() === ''
    ? allItems.slice(0, 9)
    : allItems.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      )

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      requestAnimationFrame(() => inputRef.current?.focus())
      const t1 = setTimeout(() => inputRef.current?.focus(), 25)
      const t2 = setTimeout(() => inputRef.current?.focus(), 80)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    }
  }, [isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyNav = (e) => {
      if (!isOpen) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredItems[selectedIndex]) {
          executeItem(filteredItems[selectedIndex])
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyNav)
    return () => window.removeEventListener('keydown', handleKeyNav)
  }, [isOpen, filteredItems, selectedIndex])

  const executeItem = (item) => {
    onClose()
    if (item.action) {
      item.action()
    } else if (item.path) {
      navigate(item.path)
    }
  }

  if (!isOpen) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-surface-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 sm:px-6 py-4 border-b border-surface-100 dark:border-slate-800 gap-3">
          <HiMagnifyingGlass className="w-5 h-5 text-primary-600 dark:text-amber-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            placeholder="Type a command, page, student name, or action... (e.g. 'Raghav', 'Gradebook', 'Chat')"
            className="w-full bg-transparent border-0 text-sm sm:text-base text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-0"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-surface-400 hover:text-surface-600 dark:hover:text-slate-300"
            >
              <HiXMark className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 rounded bg-surface-100 dark:bg-slate-800 border border-surface-200 dark:border-slate-700 text-[10px] font-mono text-surface-500 dark:text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-surface-500 dark:text-slate-400">
              <HiCommandLine className="w-10 h-10 mx-auto mb-2 text-surface-300 dark:text-slate-600" />
              <p className="text-sm font-semibold">No commands or pages found</p>
              <p className="text-xs mt-1 text-surface-400">Try searching for "Attendance", "Fees", "Class", or "Chat"</p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon || HiCommandLine
              const isSelected = index === selectedIndex

              return (
                <div
                  key={item.id}
                  onClick={() => executeItem(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer text-xs sm:text-sm transition-all ${
                    isSelected
                      ? 'bg-primary-50 dark:bg-slate-800/90 text-primary-900 dark:text-white font-semibold shadow-sm'
                      : 'text-surface-700 dark:text-slate-300 hover:bg-surface-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected
                          ? 'bg-primary-600 dark:bg-amber-500 text-white dark:text-slate-950'
                          : 'bg-surface-100 dark:bg-slate-800 text-surface-600 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="truncate">{item.title}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isSelected
                          ? 'bg-primary-200/60 dark:bg-slate-700 text-primary-800 dark:text-amber-300'
                          : 'bg-surface-100 dark:bg-slate-800 text-surface-500 dark:text-slate-400'
                      }`}
                    >
                      {item.category}
                    </span>
                    <HiArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-primary-600 dark:text-amber-400' : 'opacity-0'}`} />
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2.5 bg-surface-50 dark:bg-slate-950/60 border-t border-surface-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-surface-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-surface-200 dark:border-slate-700 font-mono text-[9px]">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-surface-200 dark:border-slate-700 font-mono text-[9px]">↵</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-surface-200 dark:border-slate-700 font-mono text-[9px]">Ctrl+K / Alt+K / /</kbd>
              Trigger
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-surface-200 dark:border-slate-700 font-mono text-[9px]">Ctrl+J</kbd>
              Toggle Dark
            </span>
          </div>
          <span className="font-semibold text-primary-700 dark:text-amber-400">Apex Spotlight</span>
        </div>
      </div>
    </div>
  )
}
