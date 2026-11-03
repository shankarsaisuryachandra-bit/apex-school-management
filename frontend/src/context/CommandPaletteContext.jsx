import { createContext, useContext, useState, useEffect } from 'react'
import SpotlightCommandPalette from '../components/ui/SpotlightCommandPalette'

const CommandPaletteContext = createContext()

export function CommandPaletteProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)

  const openPalette = () => setIsOpen(true)
  const closePalette = () => setIsOpen(false)
  const togglePalette = () => setIsOpen((prev) => !prev)

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isKeyK = e.key === 'k' || e.key === 'K' || e.code === 'KeyK'
      const isCtrlOrMeta = e.ctrlKey || e.metaKey
      const isCtrlK = isCtrlOrMeta && isKeyK
      const isAltK = e.altKey && isKeyK

      // Universal slash shortcut '/' (when user is not actively typing in an input/textarea)
      const isInputActive =
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) ||
        document.activeElement?.isContentEditable
      const isSlash = (e.key === '/' || e.code === 'Slash') && !isInputActive && !e.ctrlKey && !e.metaKey && !e.altKey

      if (isCtrlK || isAltK || isSlash) {
        e.preventDefault()
        e.stopPropagation()
        if (typeof e.stopImmediatePropagation === 'function') {
          e.stopImmediatePropagation()
        }
        setIsOpen((prev) => !prev)
        return false
      }
    }

    // Attach in capture phase on both window and document to intercept before browser omnibox
    window.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('keydown', handleKeyDown, true)

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [])

  return (
    <CommandPaletteContext.Provider value={{ isOpen, openPalette, closePalette, togglePalette }}>
      {children}
      <SpotlightCommandPalette isOpen={isOpen} onClose={closePalette} />
    </CommandPaletteContext.Provider>
  )
}

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext)
  if (!context) {
    throw new Error('useCommandPalette must be used within a CommandPaletteProvider')
  }
  return context
}
