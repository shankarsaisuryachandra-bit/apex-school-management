import { useState, useEffect } from 'react'
import api from '../api/axiosConfig'
import { HiXMark, HiDocumentCheck, HiPlus, HiClock, HiCheckCircle } from 'react-icons/hi2'

export default function CertificateRequestModal({ studentId, onClose }) {
  const [requests, setRequests] = useState([])
  const [showNewReq, setShowNewReq] = useState(false)
  const [certType, setCertType] = useState('Bonafide Certificate')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const res = await api.get('/certificates/my-requests')
      setRequests(res.data || [])
    } catch (err) {
      console.error('Failed to load certificates:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await api.post('/certificates/request', { certificateType: certType, reason })
      setRequests((prev) => [res.data, ...prev])
      setShowNewReq(false)
      setReason('')
    } catch (err) {
      console.error('Certificate request failed:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-lg w-full border border-slate-200 relative max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-[#0F2942] text-white px-6 py-4 flex items-center justify-between border-b-4 border-amber-500">
          <div className="flex items-center gap-2">
            <HiDocumentCheck className="w-6 h-6 text-amber-400" />
            <h3 className="text-base font-extrabold tracking-tight">Student Certificate Request Portal</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-300 hover:bg-white/10">
            <HiXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Action button */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-700">Official Institutional Documentation</span>
          <button
            onClick={() => setShowNewReq(!showNewReq)}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1"
          >
            <HiPlus className="w-4 h-4" />
            {showNewReq ? 'Cancel' : 'Request Certificate'}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {showNewReq && (
            <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
              <h4 className="font-extrabold text-amber-900 uppercase">Submit Certificate Application</h4>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Certificate Type</label>
                <select
                  value={certType}
                  onChange={(e) => setCertType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                >
                  <option value="Bonafide Certificate">Bonafide Certificate</option>
                  <option value="Transfer Certificate (TC)">Transfer Certificate (TC)</option>
                  <option value="Conduct & Character Certificate">Conduct & Character Certificate</option>
                  <option value="Study & Academic Certificate">Study & Academic Certificate</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Reason / Purpose</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Passport, Scholarship, Higher Admissions"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 rounded-xl bg-[#0F2942] text-amber-400 font-bold uppercase tracking-wider"
              >
                {submitting ? 'Submitting...' : 'Submit Official Request'}
              </button>
            </form>
          )}

          <div className="space-y-2">
            <h4 className="font-bold text-slate-500 uppercase text-[10px]">Your Certificate Request History</h4>
            {loading ? (
              <div className="text-center py-4 text-slate-400">Loading requests...</div>
            ) : requests.length === 0 ? (
              <div className="text-center py-4 text-slate-400">No requests submitted yet.</div>
            ) : (
              requests.map((r) => (
                <div key={r.id} className="p-3.5 rounded-2xl border border-slate-200 bg-white flex items-center justify-between">
                  <div>
                    <h5 className="font-extrabold text-slate-900">{r.certificateType}</h5>
                    <p className="text-slate-500 font-medium text-[11px]">Reason: {r.reason} • Date: {r.requestedDate}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      r.status === 'ISSUED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              ))
            )}
          </div>

        </div>

      </div>
    </div>
  )
}
