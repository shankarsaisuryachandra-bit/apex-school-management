import { useState, useEffect } from 'react'
import api from '../api/axiosConfig'
import { HiXMark, HiTrophy, HiStar, HiShieldCheck, HiSparkles } from 'react-icons/hi2'

export default function HouseLeaderboardModal({ onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      const res = await api.get('/leaderboard/houses')
      setData(res.data)
    } catch (err) {
      console.error('Failed to load leaderboard:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white p-6 rounded-2xl shadow-xl text-center">
          <div className="animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm font-medium text-slate-700">Loading House Points & Badges...</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-lg w-full border border-slate-200 relative max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-[#0F2942] text-white px-6 py-4 flex items-center justify-between border-b-4 border-amber-500">
          <div className="flex items-center gap-2">
            <HiTrophy className="w-6 h-6 text-amber-400" />
            <h3 className="text-base font-extrabold tracking-tight">House Points & Merit Badges</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-300 hover:bg-white/10">
            <HiXMark className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* House Leaderboard Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Inter-House Championship Standings</h4>
            <div className="space-y-2">
              {data.houses?.map((h) => (
                <div
                  key={h.houseName}
                  className="p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between bg-slate-50 hover:bg-white transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full text-white font-extrabold text-xs flex items-center justify-center shadow" style={{ backgroundColor: h.color }}>
                      #{h.rank}
                    </span>
                    <div>
                      <h5 className="text-sm font-extrabold text-slate-900">{h.houseName}</h5>
                      <span className="text-[10px] text-slate-500 italic font-medium">"{h.motto}"</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-[#0F2942]">{h.points}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">PTS</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Student Earned Merit Badges */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <HiSparkles className="w-4 h-4 text-amber-500" />
              Your Academic & Merit Badges
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {data.myBadges?.map((b, i) => (
                <div key={i} className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-1">
                  <span className="text-2xl block">{b.icon}</span>
                  <h6 className="text-xs font-extrabold text-amber-900">{b.badgeName}</h6>
                  <p className="text-[9px] text-amber-800 leading-tight">{b.description}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
