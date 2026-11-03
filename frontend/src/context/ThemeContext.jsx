import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('sms_theme')
      if (saved === 'dark' || saved === 'light') return saved
      // Default to light mode for crisp Oxford academy theme
      return 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    const root = document.documentElement
    const body = document.body

    if (theme === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
      root.setAttribute('data-theme', 'dark')
      if (body) {
        body.classList.add('dark')
        body.classList.remove('light')
        body.setAttribute('data-theme', 'dark')
      }
    } else {
      root.classList.remove('dark')
      root.classList.add('light')
      root.setAttribute('data-theme', 'light')
      if (body) {
        body.classList.remove('dark')
        body.classList.add('light')
        body.setAttribute('data-theme', 'light')
      }
    }

    try {
      localStorage.setItem('sms_theme', theme)
    } catch (e) {
      console.warn('Could not save theme preference:', e)
    }

    // Dispatch event so any charts or canvases can re-render colors
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }))
  }, [theme])

  // Global keyboard shortcut: Ctrl+J or Cmd+J to toggle theme
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'j' || e.key === 'J' || e.code === 'KeyJ')) {
        e.preventDefault()
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
      }
    }
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const setExplicitTheme = (newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setTheme(newTheme)
    }
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme: setExplicitTheme,
        isDark: theme === 'dark',
        isLight: theme === 'light'
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
