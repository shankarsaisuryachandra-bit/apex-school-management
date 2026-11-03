import { useState, useEffect } from 'react'
import { Navigate, Outlet, Link } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useCommandPalette } from '../context/CommandPaletteContext'
import Sidebar from '../components/ui/Sidebar'
import NotificationBell from '../components/ui/NotificationBell'
import {
  HiShieldCheck,
  HiArrowTopRightOnSquare,
  HiCalendarDays,
  HiMagnifyingGlass,
  HiSun,
  HiMoon,
  HiChatBubbleLeftRight
} from 'react-icons/hi2'

export default function ProtectedRoute({ role }) {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { openPalette } = useCommandPalette()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (role) {
    const allowed = Array.isArray(role) ? role : [role]
    if (!allowed.includes(user.role)) {
      return <Navigate to="/" replace />
    }
  }

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  return (
    <div className="flex h-screen bg-[#FAF9F5] dark:bg-[#0B1120] font-sans text-[#1A1F26] dark:text-[#E2E8F0] overflow-hidden transition-colors duration-300">
      {/* Handcrafted Oxford Navy Institutional Sidebar */}
      <Sidebar role={user.role} />

      {/* Main Workspace Container */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Executive Institutional Top Bar */}
        <header className="h-14 bg-white dark:bg-[#0F172A] border-b border-[#E8E6DF] dark:border-[#1E293B] px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-[0_1px_3px_rgba(11,27,43,0.03)] z-10 transition-colors duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#0B1B2B] dark:text-[#DFBF77] font-serif truncate">
              Apex International Academy
            </span>
            <span className="text-[#C5A059] hidden sm:inline">•</span>
            <span className="text-xs text-[#5A6878] dark:text-[#94A3B8] hidden md:inline truncate">
              Academic Session 2026–2027 <span className="text-[#8C9BAE] dark:text-slate-500 font-medium">(Term II)</span>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Quick Spotlight Search Trigger (Ctrl+K or /) */}
            <button
              onClick={openPalette}
              className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-surface-100 hover:bg-surface-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-surface-200 dark:border-slate-700 text-surface-600 dark:text-slate-300 text-xs font-medium transition-all shadow-sm"
              title="Quick Search & Command Palette (Ctrl+K, Alt+K, or press /)"
            >
              <HiMagnifyingGlass className="w-4 h-4 text-primary-600 dark:text-amber-400 shrink-0" />
              <span className="hidden lg:inline text-surface-500 dark:text-slate-400">Search portal...</span>
              <div className="flex items-center gap-1">
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-surface-300 dark:border-slate-700 text-[10px] font-mono text-surface-500 dark:text-slate-400 shadow-sm">
                  Ctrl K
                </kbd>
                <kbd className="hidden xl:inline-block px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-surface-300 dark:border-slate-700 text-[10px] font-mono text-surface-500 dark:text-slate-400 shadow-sm">
                  /
                </kbd>
              </div>
            </button>

            {/* In-App Messaging Quick Launcher */}
            <Link
              to="/messages"
              className="relative p-2 rounded-xl text-surface-600 dark:text-slate-300 hover:text-primary-700 dark:hover:text-amber-400 hover:bg-surface-100 dark:hover:bg-slate-800 transition-colors"
              title="In-App Messaging & Parent-Teacher Chat Hub"
            >
              <HiChatBubbleLeftRight className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
            </Link>

            {/* Global Dark / Light Mode Switcher Pill */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface-100 hover:bg-surface-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-surface-200 dark:border-slate-700 text-surface-700 dark:text-slate-200 text-xs font-bold transition-all shadow-sm"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode (Ctrl+J)`}
            >
              {theme === 'dark' ? (
                <>
                  <HiSun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline text-amber-300">Dark</span>
                </>
              ) : (
                <>
                  <HiMoon className="w-4 h-4 text-slate-700" />
                  <span className="hidden sm:inline text-surface-700">Light</span>
                </>
              )}
            </button>

            {/* Live Term Date */}
            <div className="hidden xl:flex items-center gap-1.5 text-xs text-[#5A6878] dark:text-slate-400 px-2.5 py-1 rounded-lg bg-[#F6F5EF] dark:bg-slate-800 border border-[#E5E2D6] dark:border-slate-700">
              <HiCalendarDays className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>{todayStr}</span>
            </div>

            {/* Real-time Notification Bell */}
            <NotificationBell />

            {/* User Avatar Circle */}
            <div className="flex items-center gap-2 pl-2 border-l border-[#E8E6DF] dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-[#0B1B2B] dark:bg-amber-500 text-[#DFBF77] dark:text-slate-950 font-serif font-bold text-xs flex items-center justify-center border border-[#C5A059]/40 shadow-sm">
                {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="hidden xl:block text-left">
                <p className="text-xs font-semibold text-[#0B1B2B] dark:text-white leading-tight truncate max-w-[120px]">{user?.fullName}</p>
                <p className="text-[10px] text-[#7A889B] dark:text-slate-400 uppercase font-bold tracking-wider">{user?.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#FAF9F5] dark:bg-[#0B1120] transition-colors duration-300">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

