import { useState, useEffect } from 'react'
import api from '../api/axiosConfig'
import { HiXMark, HiPrinter, HiAcademicCap, HiCheckBadge, HiShieldCheck } from 'react-icons/hi2'

export default function IdCardModal({ studentId, onClose }) {
  const [cardData, setCardData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchIdCard()
  }, [studentId])

  const fetchIdCard = async () => {
    try {
      const sId = studentId || 1
      const res = await api.get(`/idcards/student/${sId}`)
      setCardData(res.data)
    } catch (err) {
      console.error('Failed to load ID card:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white p-6 rounded-2xl shadow-xl text-center">
          <div className="animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm font-medium text-slate-700">Generating Digital Student ID Card...</p>
        </div>
      </div>
    )
  }

  if (!cardData) return null

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(cardData.qrPayload)}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full border border-slate-200 relative print:shadow-none print:border-none">
        
        {/* Top Actions (Hidden when printing) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <HiCheckBadge className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-bold text-slate-800">Digital Identity Pass</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <HiPrinter className="w-4 h-4" />
              Print PVC Card
            </button>
            <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:bg-slate-200 text-slate-700">
              <HiXMark className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 💳 Visual PVC Student ID Card Body */}
        <div className="p-6 bg-gradient-to-b from-slate-50 via-white to-amber-50/20">
          <div className="rounded-2xl overflow-hidden border-2 border-[#0F2942] shadow-lg bg-white relative">
            
            {/* Header Header Band */}
            <div className="bg-[#0F2942] text-white p-4 text-center relative border-b-4 border-amber-500">
              <div className="flex items-center justify-center gap-2 mb-1">
                <HiAcademicCap className="w-6 h-6 text-amber-400" />
                <h2 className="text-base font-extrabold tracking-tight uppercase">{cardData.schoolName}</h2>
              </div>
              <p className="text-[10px] text-amber-300 font-semibold tracking-widest uppercase">Official Student Identification Pass</p>
            </div>

            {/* Main Content Details */}
            <div className="p-5 flex flex-col items-center text-center">
              
              {/* Photo Avatar */}
              <div className="relative mb-4">
                <div className="w-24 h-24 rounded-full border-4 border-amber-500 overflow-hidden shadow-md bg-slate-100 flex items-center justify-center">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(cardData.fullName)}&background=0F2942&color=F59E0B&size=128&bold=true`}
                    alt={cardData.fullName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="absolute bottom-0 right-0 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-extrabold shadow">
                  VERIFIED
                </span>
              </div>

              {/* Student Name & Class */}
              <h3 className="text-xl font-extrabold text-[#0F2942] mb-0.5">{cardData.fullName}</h3>
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide bg-amber-100 px-3 py-0.5 rounded-full mb-4">
                {cardData.className}
              </p>

              {/* Data Grid */}
              <div className="w-full grid grid-cols-2 gap-2 text-left bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs mb-4">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Roll Number</span>
                  <span className="font-bold text-slate-800">{cardData.rollNo}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Admission No</span>
                  <span className="font-bold text-slate-800">{cardData.admissionNo}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Blood Group</span>
                  <span className="font-extrabold text-red-600">{cardData.bloodGroup}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Academic Session</span>
                  <span className="font-bold text-slate-800">{cardData.academicYear}</span>
                </div>
              </div>

              {/* QR Code & Signatures */}
              <div className="w-full flex items-center justify-between pt-2 border-t border-slate-200">
                <div className="flex flex-col items-center">
                  <img src={qrUrl} alt="ID QR Code" className="w-16 h-16 rounded border border-slate-300" />
                  <span className="text-[9px] text-slate-400 font-mono mt-1">Scan for Auth</span>
                </div>

                <div className="text-right space-y-1">
                  <div className="italic text-xs font-serif text-slate-700 font-bold underline decoration-amber-500">
                    {cardData.principalName}
                  </div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Principal Signature</span>
                  <div className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <HiShieldCheck className="w-3 h-3 text-amber-600" />
                    School Seal Verified
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Strip */}
            <div className="bg-[#0F2942] text-slate-300 py-1.5 px-4 text-[9px] text-center flex justify-between font-mono">
              <span>Emergency: {cardData.emergencyContact}</span>
              <span>DOB: {cardData.dob}</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
