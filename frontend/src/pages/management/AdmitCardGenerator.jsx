import { useState, useEffect } from 'react'
import api from '../../api/axiosConfig'
import { HiIdentification, HiPrinter, HiPlus, HiXMark, HiAcademicCap, HiCheckBadge } from 'react-icons/hi2'
import { useAuth } from '../../auth/AuthContext'

export default function AdmitCardGenerator() {
  const { user } = useAuth()
  const isStaff = user?.role === 'MANAGEMENT' || user?.role === 'TEACHER'

  const [admitCards, setAdmitCards] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    studentId: '',
    examTitle: 'Annual Board Examination 2025-26',
    rollNumber: '',
    examCenter: 'Apex Secondary Main Campus Hall A'
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const studentId = !isStaff ? (user?.profileId || user?.userId) : null
      const url = studentId ? `/admit-cards?studentId=${studentId}` : '/admit-cards'
      const [acRes, stRes] = await Promise.all([
        api.get(url),
        isStaff ? api.get('/admin/students') : Promise.resolve({ data: [] })
      ])
      setAdmitCards(acRes.data)
      setStudents(stRes.data)
    } catch (error) {
      console.error('Failed to fetch admit cards:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateCard = async (e) => {
    e.preventDefault()
    if (!formData.studentId || !formData.examTitle) return
    setSubmitting(true)
    setMessage('')
    try {
      await api.post('/admit-cards', {
        ...formData,
        studentId: parseInt(formData.studentId)
      })
      setMessage('Exam Admit Card issued successfully!')
      setTimeout(() => {
        setMessage('')
        setShowGenerateModal(false)
        setFormData({
          studentId: '',
          examTitle: 'Annual Board Examination 2025-26',
          rollNumber: '',
          examCenter: 'Apex Secondary Main Campus Hall A'
        })
        fetchData()
      }, 1500)
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to issue admit card')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-900">Exam Hall Tickets & Admit Cards</h1>
          <p className="text-surface-700/60 mt-1">Official examination admission roll passes and hall tickets</p>
        </div>
        {isStaff && (
          <button
            onClick={() => setShowGenerateModal(true)}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <HiPlus className="w-4 h-4" />
            Issue Admit Card
          </button>
        )}
      </div>

      {loading ? (
        <div className="animate-pulse text-surface-700/50 py-4 print:hidden">Loading admit cards...</div>
      ) : admitCards.length === 0 ? (
        <div className="text-center py-8 text-surface-700/50 card p-6 print:hidden">
          <HiIdentification className="w-12 h-12 mx-auto mb-2 text-surface-300" />
          <p>No hall tickets issued yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
          {admitCards.map((card) => (
            <div key={card.id} className="card p-6 border-l-4 border-l-primary-600 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-primary-100 text-primary-800 text-xs font-extrabold uppercase">
                    {card.rollNumber || 'RL-2025'}
                  </span>
                  <span className="text-xs text-surface-400 font-mono">Issued: {card.generatedDate}</span>
                </div>

                <h3 className="font-display font-bold text-surface-900 text-lg mb-1">{card.examTitle}</h3>
                <p className="font-medium text-surface-700 text-sm">{card.student?.fullName || user?.fullName}</p>
                <p className="text-xs text-surface-400">Class: {card.student?.schoolClass?.name || 'Grade 10'} Section {card.student?.schoolClass?.section || 'A'}</p>
              </div>

              <div className="border-t border-surface-100 pt-4 mt-4 flex items-center justify-between">
                <span className="text-xs text-surface-600 font-semibold">{card.examCenter}</span>
                <button
                  onClick={() => setSelectedCard(card)}
                  className="btn-secondary text-xs flex items-center gap-1.5 py-1.5"
                >
                  <HiPrinter className="w-4 h-4 text-primary-600" />
                  View & Print
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Printable View Modal */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in print:p-0 print:static print:bg-white">
          <div className="bg-white w-full max-w-2xl p-8 rounded-3xl shadow-2xl relative border-2 border-primary-600 print:border-none print:shadow-none print:w-full">
            <button onClick={() => setSelectedCard(null)} className="absolute top-4 right-4 text-surface-400 hover:text-surface-900 print:hidden">
              <HiXMark className="w-6 h-6" />
            </button>

            {/* Hall Ticket Card Header */}
            <div className="flex items-center justify-between border-b-2 border-primary-600 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white font-bold text-xl">
                  <HiAcademicCap className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="font-display font-extrabold text-surface-900 text-xl uppercase tracking-wide">Apex International Academy</h2>
                  <p className="text-xs text-surface-700 font-semibold">Official Examination Admission Ticket</p>
                </div>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-lg text-xs font-bold font-mono">
                  {selectedCard.rollNumber}
                </span>
              </div>
            </div>

            {/* Student & Exam Details */}
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="col-span-2 space-y-2 text-sm">
                <div>
                  <span className="text-xs uppercase text-surface-400 font-semibold block">Candidate Name</span>
                  <p className="font-bold text-surface-900 text-base">{selectedCard.student?.fullName || user?.fullName}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs uppercase text-surface-400 font-semibold block">Admission No</span>
                    <p className="font-mono text-surface-900 font-semibold">{selectedCard.student?.admissionNumber || 'ADM2025001'}</p>
                  </div>
                  <div>
                    <span className="text-xs uppercase text-surface-400 font-semibold block">Grade & Section</span>
                    <p className="font-semibold text-surface-900">{selectedCard.student?.schoolClass?.name || 'Grade 10'} - {selectedCard.student?.schoolClass?.section || 'A'}</p>
                  </div>
                </div>
                <div>
                  <span className="text-xs uppercase text-surface-400 font-semibold block">Examination Title</span>
                  <p className="font-semibold text-primary-700">{selectedCard.examTitle}</p>
                </div>
                <div>
                  <span className="text-xs uppercase text-surface-400 font-semibold block">Center Venue</span>
                  <p className="font-medium text-surface-800">{selectedCard.examCenter}</p>
                </div>
              </div>

              {/* Photo & Seal Placeholder */}
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-surface-300 rounded-2xl p-4 bg-surface-50 text-center">
                <div className="w-24 h-28 rounded-xl bg-surface-200 flex items-center justify-center text-surface-400 font-semibold text-xs mb-2">
                  Photo Seal
                </div>
                <span className="text-[10px] text-surface-400 font-bold uppercase">Official Stamp</span>
              </div>
            </div>

            {/* Exam Schedule Table */}
            <div className="table-container mb-6">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-surface-100">
                    <th className="p-2 text-left">Subject</th>
                    <th className="p-2 text-left">Exam Date</th>
                    <th className="p-2 text-left">Timing</th>
                    <th className="p-2 text-left">Invigilator Sign</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 font-bold">Mathematics</td>
                    <td className="p-2">2025-09-10</td>
                    <td className="p-2 font-mono">09:00 AM - 12:00 PM</td>
                    <td className="p-2 border-b text-surface-300">____________</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold">Science</td>
                    <td className="p-2">2025-09-12</td>
                    <td className="p-2 font-mono">09:00 AM - 12:00 PM</td>
                    <td className="p-2 border-b text-surface-300">____________</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer Signature */}
            <div className="flex items-center justify-between border-t border-surface-200 pt-4">
              <div className="flex items-center gap-1.5 text-xs text-green-700 font-semibold">
                <HiCheckBadge className="w-4 h-4" />
                Verified & Digitally Approved
              </div>
              <div className="text-right">
                <div className="font-script text-lg text-primary-800 italic font-bold">Dr. E. Vance</div>
                <span className="text-[10px] uppercase text-surface-400 font-bold block">Controller of Examinations</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 print:hidden">
              <button onClick={() => setSelectedCard(null)} className="btn-secondary text-xs">
                Close
              </button>
              <button onClick={handlePrint} className="btn-primary text-xs flex items-center gap-2">
                <HiPrinter className="w-4 h-4" />
                Print Admit Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Admit Card Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="card-glass w-full max-w-md bg-white p-6 rounded-2xl shadow-2xl relative border border-surface-200">
            <button onClick={() => setShowGenerateModal(false)} className="absolute top-4 right-4 text-surface-400 hover:text-surface-900">
              <HiXMark className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-display font-bold text-surface-900 mb-1">Issue Exam Admit Card</h3>
            <p className="text-sm text-surface-700/60 mb-4">Generate official roll number hall ticket</p>

            {message && (
              <div className="mb-4 p-3 rounded-xl bg-accent-100 text-accent-800 text-sm font-medium">
                {message}
              </div>
            )}

            <form onSubmit={handleGenerateCard} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Select Student</label>
                <select
                  required
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="input-field py-2"
                >
                  <option value="">-- Select Student Candidate --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.fullName} ({s.admissionNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Examination Title</label>
                <input
                  type="text"
                  required
                  value={formData.examTitle}
                  onChange={(e) => setFormData({ ...formData, examTitle: e.target.value })}
                  className="input-field py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Roll Number</label>
                  <input
                    type="text"
                    placeholder="e.g. RL-1001"
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    className="input-field py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Exam Hall Venue</label>
                  <input
                    type="text"
                    value={formData.examCenter}
                    onChange={(e) => setFormData({ ...formData, examCenter: e.target.value })}
                    className="input-field py-2"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowGenerateModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Issuing...' : 'Issue Hall Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
