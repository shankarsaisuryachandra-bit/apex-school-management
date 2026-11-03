import { useState } from 'react'
import api from '../api/axiosConfig'
import { HiChatBubbleLeftRight, HiXMark, HiPaperAirplane, HiSparkles } from 'react-icons/hi2'

export default function ParentFaqWidget() {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! I am the School Admissions & Helpdesk Assistant. How can I help you regarding admissions, fee structure, or campus facilities?'
    }
  ])
  const [loading, setLoading] = useState(false)

  const handleAsk = async (e) => {
    e.preventDefault()
    if (!question.trim()) return

    const userQ = { sender: 'user', text: question }
    setMessages((prev) => [...prev, userQ])
    const qText = question
    setQuestion('')
    setLoading(true)

    try {
      const res = await api.post('/faq/ask', { question: qText })
      setMessages((prev) => [...prev, { sender: 'bot', text: res.data.answer }])
    } catch (err) {
      setMessages((prev) => [...prev, { sender: 'bot', text: 'Thank you. Please call our admissions desk at +91 98765 43210.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-3 rounded-full bg-[#003366] hover:bg-[#002244] text-white font-bold text-xs flex items-center space-x-2 shadow-lg transition-all transform hover:scale-105"
        >
          <HiChatBubbleLeftRight className="w-5 h-5 text-amber-400" />
          <span>Admissions Enquiry</span>
        </button>
      ) : (
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-80 sm:w-96 border border-slate-200 flex flex-col h-96 animate-fade-in">
          
          {/* Top Bar */}
          <div className="bg-[#003366] text-white p-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <HiChatBubbleLeftRight className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wide">Admissions Helpdesk</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-300 hover:text-white">
              <HiXMark className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-slate-50 text-xs">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] p-3 rounded-2xl ${
                    m.sender === 'user' ? 'bg-amber-600 text-white font-medium' : 'bg-white text-slate-800 border border-slate-200 shadow-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div className="text-[10px] text-slate-400 italic">Helpdesk bot is responding...</div>}
          </div>

          {/* Input */}
          <form onSubmit={handleAsk} className="p-2 bg-white border-t border-slate-200 flex gap-2">
            <input
              type="text"
              placeholder="Ask about admissions, fees..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="px-3 py-2 rounded-xl bg-[#0F2942] text-amber-400 font-bold text-xs"
            >
              <HiPaperAirplane className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

    </div>
  )
}
