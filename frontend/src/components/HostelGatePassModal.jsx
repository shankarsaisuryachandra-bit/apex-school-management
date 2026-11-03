import { useState, useEffect } from 'react'
import api from '../api/axiosConfig'
import { HiXMark, HiBuildingOffice, HiPhone, HiClock, HiCheckBadge, HiShieldCheck } from 'react-icons/hi2'

export default function HostelGatePassModal({ onClose }) {
  const [hostel, setHostel] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHostel()
  }, [])

  const fetchHostel = async () => {
    try {
      const res = await api.get('/hostel/my-room')
      setHostel(res.data)
    } catch (err) {
      console.error('Failed to load hostel:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white p-6 rounded-2xl shadow-xl text-center">
          <div className="animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm font-medium text-slate-700">Loading Hostel Room & Gate Pass...</p>
        </div>
      </div>
    )
  }

  if (!hostel) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full border border-slate-200 relative">
        
        {/* Header */}
        <div className="bg-[#0F2942] text-white px-6 py-4 flex items-center justify-between border-b-4 border-amber-500">
          <div className="flex items-center gap-2">
            <HiBuildingOffice className="w-6 h-6 text-amber-400" />
            <h3 className="text-base font-extrabold tracking-tight">Hostel & Digital Out-Pass Pass</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-300 hover:bg-white/10">
            <HiXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 space-y-2 text-center">
            <span className="text-[10px] text-amber-800 font-extrabold uppercase tracking-widest block">Digital Gate Out-Pass Status</span>
            <span className="px-3 py-1 rounded-full bg-emerald-700 text-white font-extrabold text-xs inline-block">
              {hostel.gatePassStatus}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Hostel Block</span>
              <span className="font-extrabold text-[#0F2942]">{hostel.hostelBlock}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Allocated Room</span>
              <span className="font-mono font-extrabold text-amber-700 text-sm">{hostel.roomNumber}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Chief Warden</span>
              <span className="font-bold text-slate-900">{hostel.wardenName}</span>
            </div>
            <a href={`tel:${hostel.wardenPhone}`} className="px-3 py-1.5 rounded-xl bg-[#0F2942] text-amber-400 font-bold text-[11px] flex items-center gap-1">
              <HiPhone className="w-3.5 h-3.5" /> Call
            </a>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1">
              <HiClock className="w-3.5 h-3.5 text-amber-600" /> Daily Mess Timings
            </span>
            <p className="font-medium text-slate-800">{hostel.messTimings}</p>
          </div>

        </div>

      </div>
    </div>
  )
}
