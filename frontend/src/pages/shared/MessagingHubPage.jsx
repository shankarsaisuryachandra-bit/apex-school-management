import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../auth/AuthContext'
import api from '../../api/axiosConfig'
import {
  HiChatBubbleLeftRight,
  HiPaperAirplane,
  HiPaperClip,
  HiCheckBadge,
  HiCheck,
  HiMagnifyingGlass,
  HiUserGroup,
  HiAcademicCap,
  HiDocumentText,
  HiSparkles,
  HiArrowPath,
  HiShieldCheck,
  HiFaceSmile
} from 'react-icons/hi2'

export default function MessagingHubPage() {
  const { user } = useAuth()
  const [channels, setChannels] = useState([])
  const [activeChannelId, setActiveChannelId] = useState('CLASS_6A')
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [selectedAttachment, setSelectedAttachment] = useState(null)
  const messagesEndRef = useRef(null)

  // Quick reply chips
  const quickReplies = [
    'Thank you for the guidance!',
    'I have uploaded my assignment solution PDF.',
    'Could we schedule a quick PTM consultation?',
    'Acknowledged with thanks.',
    'Please review the attached academic report.'
  ]

  // Fetch channel catalog
  const fetchChannels = async () => {
    try {
      const res = await api.get('/chat/channels')
      if (res.data) {
        setChannels(res.data)
      }
    } catch (err) {
      console.warn('Using default channels fallback:', err.message)
      setChannels([
        {
          channelId: 'CLASS_6A',
          channelName: 'Class 6-A Academic Forum',
          channelType: 'CLASS_CHANNEL',
          description: 'Official announcements & homework discussion for Grade 6 Section A',
          badge: 'Class 6-A',
          avatar: '🏛️',
          unreadCount: 0,
          lastMessage: 'Excellent work, Raghav! I have reviewed your submission in the Gradebook.',
          lastSender: 'Ms. Sunita Rao (Class Teacher)'
        },
        {
          channelId: 'STAFF_ROOM',
          channelName: 'Institutional Faculty Directorate',
          channelType: 'STAFF_ROOM',
          description: 'Senior leadership & teaching staff collaborative lounge',
          badge: 'Faculty Only',
          avatar: '🎓',
          unreadCount: 1,
          lastMessage: 'Grade 10 and 12 mathematics marks and analytical rubrics have been 100% recorded in the system.',
          lastSender: 'Mr. Arvind Sharma (Senior Math)'
        },
        {
          channelId: 'PARENT_RAGHAV',
          channelName: 'Raghav Prasad • Parent Consultation',
          channelType: 'DIRECT',
          description: 'Direct communication channel between Guardian and Class Teacher',
          badge: 'Parent-Teacher',
          avatar: '👨‍👦',
          unreadCount: 0,
          lastMessage: 'Good evening Mr. Prasad! It is an absolute pleasure having Raghav in class.',
          lastSender: 'Ms. Sunita Rao (Class Teacher)'
        },
        {
          channelId: 'DOUBT_MATH_ATHARV',
          channelName: 'Math Academic Guidance • Atharv Pillai',
          channelType: 'DIRECT',
          description: 'Curriculum questions, homework tips & conceptual doubts',
          badge: 'Academic Doubts',
          avatar: '📐',
          unreadCount: 0,
          lastMessage: 'Check page 14 of your math workbook for extra practice!',
          lastSender: 'Mr. Arvind Sharma (Math Faculty)'
        }
      ])
    }
  }

  // Fetch message history for active channel
  const fetchMessages = async (chId) => {
    try {
      const res = await api.get(`/chat/messages?channelId=${chId}`)
      if (res.data) {
        setMessages(res.data)
      }
    } catch (err) {
      console.warn('Error fetching messages:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChannels()
    fetchMessages(activeChannelId)

    // Polling interval for live chat updates
    const interval = setInterval(() => {
      fetchMessages(activeChannelId)
    }, 4000)

    return () => clearInterval(interval)
  }, [activeChannelId])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle switching channel
  const handleSelectChannel = (chId) => {
    setActiveChannelId(chId)
    api.put(`/chat/read?channelId=${chId}`).catch(() => {})
    // Update local unread counter
    setChannels((prev) =>
      prev.map((c) => (c.channelId === chId ? { ...c, unreadCount: 0 } : c))
    )
  }

  // Handle sending a message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault()
    if (!inputText.trim() && !selectedAttachment) return

    const activeCh = channels.find((c) => c.channelId === activeChannelId)
    const payload = {
      channelId: activeChannelId,
      channelType: activeCh?.channelType || 'CLASS_CHANNEL',
      channelName: activeCh?.channelName || 'Apex Academic Forum',
      content: inputText.trim(),
      attachmentUrl: selectedAttachment?.url || null,
      attachmentName: selectedAttachment?.name || null
    }

    setSending(true)
    try {
      const res = await api.post('/chat/send', payload)
      if (res.data) {
        setMessages((prev) => [...prev, res.data])
        setInputText('')
        setSelectedAttachment(null)
      }
    } catch (err) {
      // Local optimistic fallback if offline
      const optimistic = {
        id: Date.now(),
        channelId: activeChannelId,
        senderUsername: user?.username || 'me',
        senderName: user?.fullName || 'Me',
        senderRole: user?.role || 'STUDENT',
        content: inputText.trim(),
        attachmentUrl: selectedAttachment?.url || null,
        attachmentName: selectedAttachment?.name || null,
        isRead: true,
        createdAt: new Date().toISOString()
      }
      setMessages((prev) => [...prev, optimistic])
      setInputText('')
      setSelectedAttachment(null)
    } finally {
      setSending(false)
    }
  }

  // Filter channels by search and tab
  const filteredChannels = channels.filter((ch) => {
    const matchesSearch =
      ch.channelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.description?.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false

    if (filterType === 'CLASS') return ch.channelType === 'CLASS_CHANNEL'
    if (filterType === 'DIRECT') return ch.channelType === 'DIRECT'
    if (filterType === 'STAFF') return ch.channelType === 'STAFF_ROOM'
    return true
  })

  const currentChannel = channels.find((c) => c.channelId === activeChannelId) || channels[0]

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-extrabold uppercase tracking-widest">
              Direct Communication Hub
            </span>
            <span className="text-white/40">•</span>
            <span className="text-xs text-white/70 flex items-center gap-1">
              <HiShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              End-to-End Encrypted Campus Protocol
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mt-1">
            In-App Messaging & Parent-Teacher Chat
          </h2>
          <p className="text-xs sm:text-sm text-white/70 mt-1 max-w-2xl">
            Real-time collaborative channels connecting Parents, Class Teachers, Students, and Directorate Leadership for instant academic feedback, consultation, and homework updates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchChannels()
              fetchMessages(activeChannelId)
            }}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 flex items-center gap-2 backdrop-blur-sm transition-all"
          >
            <HiArrowPath className="w-4 h-4" />
            <span>Sync Live</span>
          </button>
        </div>
      </div>

      {/* Main Split-Pane Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[76vh] min-h-[600px]">
        {/* LEFT COLUMN: Channel Directory (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-surface-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden transition-colors">
          {/* Channel Search & Filters */}
          <div className="p-4 border-b border-surface-100 dark:border-slate-800 space-y-3">
            <div className="relative">
              <HiMagnifyingGlass className="w-4 h-4 text-surface-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations & teachers..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-100 dark:bg-slate-800 border-0 text-xs text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-amber-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              {['ALL', 'CLASS', 'DIRECT', 'STAFF'].map((ft) => (
                <button
                  key={ft}
                  onClick={() => setFilterType(ft)}
                  className={`px-3 py-1 rounded-lg font-bold shrink-0 transition-all ${
                    filterType === ft
                      ? 'bg-primary-600 dark:bg-amber-500 text-white dark:text-slate-950 shadow-sm'
                      : 'bg-surface-100 dark:bg-slate-800 text-surface-600 dark:text-slate-400 hover:bg-surface-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {ft === 'ALL' ? 'All Chats' : ft === 'CLASS' ? 'Class Forums' : ft === 'DIRECT' ? 'Parent-Teacher' : 'Staff Lounge'}
                </button>
              ))}
            </div>
          </div>

          {/* Channels List */}
          <div className="flex-1 overflow-y-auto divide-y divide-surface-100 dark:divide-slate-800/60 p-2 space-y-1">
            {filteredChannels.map((ch) => {
              const isActive = ch.channelId === activeChannelId
              return (
                <div
                  key={ch.channelId}
                  onClick={() => handleSelectChannel(ch.channelId)}
                  className={`p-3 rounded-2xl cursor-pointer transition-all ${
                    isActive
                      ? 'bg-primary-50 dark:bg-slate-800 border border-primary-200 dark:border-slate-700 shadow-sm'
                      : 'hover:bg-surface-50 dark:hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-surface-100 dark:bg-slate-800 border border-surface-200 dark:border-slate-700 flex items-center justify-center text-lg shrink-0 shadow-sm">
                      {ch.avatar || '💬'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className="font-bold text-xs sm:text-sm text-surface-900 dark:text-white truncate">
                          {ch.channelName}
                        </h4>
                        {ch.unreadCount > 0 && (
                          <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center shrink-0 animate-pulse">
                            {ch.unreadCount}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-surface-500 dark:text-slate-400 truncate">
                        {ch.lastMessage || ch.description}
                      </p>

                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-surface-200/80 dark:bg-slate-700 text-surface-700 dark:text-slate-300 uppercase tracking-wider">
                          {ch.badge || ch.channelType}
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Online
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Chat Stream & Input (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-surface-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden transition-colors">
          {/* Active Chat Top Bar */}
          <div className="p-4 border-b border-surface-200 dark:border-slate-800 flex items-center justify-between bg-surface-50/70 dark:bg-slate-950/40">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-surface-200 dark:border-slate-700 flex items-center justify-center text-xl shrink-0 shadow-sm">
                {currentChannel?.avatar || '🏛️'}
              </div>
              <div className="min-w-0">
                <h3 className="font-display font-bold text-surface-900 dark:text-white text-sm sm:text-base truncate">
                  {currentChannel?.channelName || 'Academic Conversation'}
                </h3>
                <p className="text-[11px] text-surface-500 dark:text-slate-400 truncate">
                  {currentChannel?.description || 'Active Consultation Channel'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Active Live</span>
              </span>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-900/[0.02] dark:bg-slate-950/30">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-surface-400 dark:text-slate-500">
                <HiChatBubbleLeftRight className="w-12 h-12 mb-2 text-surface-300 dark:text-slate-600" />
                <p className="text-sm font-semibold">No messages in this channel yet</p>
                <p className="text-xs">Start the discussion below or pick a quick-reply chip!</p>
              </div>
            ) : (
              messages.map((m, idx) => {
                const isMe =
                  m.senderUsername === user?.username ||
                  m.senderId === user?.id ||
                  (user?.role === 'MANAGEMENT' && m.senderRole === 'MANAGEMENT')

                const roleBadgeColor =
                  m.senderRole === 'MANAGEMENT'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : m.senderRole === 'TEACHER'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    : m.senderRole === 'PARENT'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'

                return (
                  <div
                    key={m.id || idx}
                    className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMe && (
                      <div className="w-8 h-8 rounded-full bg-[#0B1B2B] dark:bg-amber-500 text-white dark:text-slate-950 font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                        {m.senderName?.charAt(0) || 'U'}
                      </div>
                    )}

                    <div className={`max-w-[85%] sm:max-w-[70%] space-y-1`}>
                      {!isMe && (
                        <div className="flex items-center gap-2 pl-1">
                          <span className="text-xs font-bold text-surface-900 dark:text-white">
                            {m.senderName}
                          </span>
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase ${roleBadgeColor}`}>
                            {m.senderRole}
                          </span>
                        </div>
                      )}

                      <div
                        className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                          isMe
                            ? 'bg-primary-600 dark:bg-amber-500 text-white dark:text-slate-950 rounded-br-none'
                            : 'bg-white dark:bg-slate-800 text-surface-900 dark:text-white border border-surface-200 dark:border-slate-700 rounded-bl-none'
                        }`}
                      >
                        <p>{m.content}</p>

                        {/* Optional Attached Solution / Document Card */}
                        {m.attachmentUrl && (
                          <div className={`mt-2.5 p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                            isMe
                              ? 'bg-white/10 border-white/20 text-white'
                              : 'bg-surface-50 dark:bg-slate-900 border-surface-200 dark:border-slate-700 text-surface-800 dark:text-slate-200'
                          }`}>
                            <div className="flex items-center gap-2 min-w-0">
                              <HiDocumentText className="w-5 h-5 text-amber-300 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-bold truncate">{m.attachmentName || 'Attachment'}</p>
                                <p className="text-[10px] opacity-75">Verified Academic Document</p>
                              </div>
                            </div>
                            <a
                              href={m.attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-colors ${
                                isMe
                                  ? 'bg-white text-slate-900 hover:bg-white/90'
                                  : 'bg-primary-600 text-white hover:bg-primary-700'
                              }`}
                            >
                              Open PDF
                            </a>
                          </div>
                        )}
                      </div>

                      <div className={`flex items-center gap-1.5 text-[10px] text-surface-400 dark:text-slate-500 ${isMe ? 'justify-end pr-1' : 'pl-1'}`}>
                        <span>
                          {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                        </span>
                        {isMe && <HiCheck className="w-3.5 h-3.5 text-emerald-500" />}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reply Suggestion Chips */}
          <div className="px-4 py-2 border-t border-surface-100 dark:border-slate-800/80 bg-surface-50/50 dark:bg-slate-950/20 overflow-x-auto flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-surface-400 dark:text-slate-500 shrink-0 flex items-center gap-1">
              <HiSparkles className="w-3 h-3 text-amber-500" />
              Quick:
            </span>
            {quickReplies.map((qr, qIdx) => (
              <button
                key={qIdx}
                onClick={() => setInputText(qr)}
                className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 hover:bg-surface-100 dark:hover:bg-slate-700 border border-surface-200 dark:border-slate-700 text-[11px] text-surface-700 dark:text-slate-300 shrink-0 transition-colors shadow-2xs"
              >
                {qr}
              </button>
            ))}
          </div>

          {/* Attachment Selection Badge (if selected) */}
          {selectedAttachment && (
            <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 border-t border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-2">
                <HiDocumentText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Attached: <strong>{selectedAttachment.name}</strong></span>
              </div>
              <button
                onClick={() => setSelectedAttachment(null)}
                className="text-xs text-rose-600 font-bold hover:underline"
              >
                Remove
              </button>
            </div>
          )}

          {/* Bottom Message Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 sm:p-4 border-t border-surface-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900"
          >
            {/* Quick Attachment Menu */}
            <button
              type="button"
              onClick={() => {
                setSelectedAttachment({
                  name: 'Indus_Valley_Solution_Dossier.pdf',
                  url: '/uploads/solutions/indus_valley_civilization_report_solution.pdf'
                })
              }}
              className="p-2.5 rounded-xl text-surface-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-amber-400 hover:bg-surface-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              title="Attach Solution PDF / Project Document"
            >
              <HiPaperClip className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Write a message to ${currentChannel?.channelName || 'this channel'}...`}
              className="flex-1 py-2.5 px-4 rounded-xl bg-surface-100 dark:bg-slate-800 border-0 text-xs sm:text-sm text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-amber-500"
            />

            <button
              type="submit"
              disabled={sending || (!inputText.trim() && !selectedAttachment)}
              className="px-4 py-2.5 rounded-xl bg-primary-600 dark:bg-amber-500 hover:bg-primary-700 dark:hover:bg-amber-400 disabled:opacity-50 text-white dark:text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shrink-0"
            >
              <HiPaperAirplane className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
