import { useState, useEffect } from 'react'
import api from '../../api/axiosConfig'
import { HiCreditCard, HiPrinter, HiAcademicCap, HiQrCode, HiShieldCheck } from 'react-icons/hi2'
import { useAuth } from '../../auth/AuthContext'

export default function IdCardGenerator() {
  const { user } = useAuth()
  const [idCard, setIdCard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchIdCard()
  }, [])

  const fetchIdCard = async () => {
    try {
      const studentId = user?.profileId || user?.userId || 1
      const { data } = await api.get(`/id-cards/${studentId}`)
      setIdCard(data)
    } catch (error) {
      console.error('Failed to fetch student ID Card:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-900">Digital Student ID Pass</h1>
          <p className="text-surface-700/60 mt-1">Official institutional identification card badge</p>
        </div>
        <button onClick={handlePrint} className="btn-primary text-sm flex items-center gap-2">
          <HiPrinter className="w-4 h-4" />
          Print ID Card
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse text-surface-700/50 py-4 print:hidden">Loading ID card badge...</div>
      ) : !idCard ? (
        <div className="text-center py-8 card p-6 text-surface-700/50 print:hidden">
          <HiCreditCard className="w-12 h-12 mx-auto mb-2 text-surface-300" />
          <p>No ID Card badge generated.</p>
        </div>
      ) : (
        <div className="flex justify-center py-6">
          {/* Printable Student ID Card Badge */}
          <div className="w-80 bg-gradient-to-br from-primary-900 via-primary-800 to-slate-900 text-white rounded-3xl p-6 shadow-2xl relative border-2 border-primary-500/30 overflow-hidden print:w-80 print:shadow-none">
            {/* Background Hologram Graphic Effect */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-accent-500/20 rounded-full blur-2xl pointer-events-none"></div>

            {/* School Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-accent-500 flex items-center justify-center text-primary-950 font-bold">
                  <HiAcademicCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-xs tracking-wider uppercase text-white">Apex International</h3>
                  <p className="text-[9px] text-accent-300 font-semibold uppercase">Student Identity Pass</p>
                </div>
              </div>
              <HiShieldCheck className="w-5 h-5 text-accent-400" />
            </div>

            {/* Profile Photo & Student Details */}
            <div className="flex flex-col items-center text-center space-y-3 mb-5">
              <div className="w-24 h-24 rounded-2xl bg-white/10 border-2 border-accent-400/50 p-1 flex items-center justify-center overflow-hidden shadow-inner">
                <div className="w-full h-full rounded-xl bg-surface-700 flex items-center justify-center text-surface-300 font-display font-bold text-2xl uppercase">
                  {idCard.student?.fullName?.substring(0, 2) || 'AM'}
                </div>
              </div>

              <div>
                <h2 className="font-display font-bold text-lg text-white leading-snug">{idCard.student?.fullName || user?.fullName}</h2>
                <p className="text-xs text-accent-300 font-mono">{idCard.cardNumber || 'IDC-ADM2025001'}</p>
              </div>
            </div>

            {/* Class & Details Grid */}
            <div className="bg-white/5 rounded-2xl p-3 border border-white/10 text-xs space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-surface-400 font-medium">Grade / Class:</span>
                <span className="font-bold text-white">{idCard.student?.schoolClass?.name || 'Grade 10'} ({idCard.student?.schoolClass?.section || 'A'})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-400 font-medium">Admission No:</span>
                <span className="font-mono text-white font-semibold">{idCard.student?.admissionNumber || 'ADM2025001'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-400 font-medium">Expiry Date:</span>
                <span className="font-mono text-white">{idCard.expiryDate || '2027-08-01'}</span>
              </div>
            </div>

            {/* Barcode & Signature Footer */}
            <div className="flex items-center justify-between border-t border-white/10 pt-3 text-[10px] text-surface-400">
              <div className="flex items-center gap-1.5 font-mono">
                <HiQrCode className="w-6 h-6 text-white" />
                <span>VERIFIED PASS</span>
              </div>
              <div className="text-right">
                <span className="italic font-bold text-white text-xs block">Dr. E. Vance</span>
                <span>Principal Signature</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
