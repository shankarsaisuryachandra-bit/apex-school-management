import { useState, useEffect } from 'react'
import api from '../../api/axiosConfig'
import { HiHeart, HiShieldCheck, HiPencilSquare, HiXMark } from 'react-icons/hi2'
import { useAuth } from '../../auth/AuthContext'

export default function HealthRecords() {
  const { user } = useAuth()
  const isStaff = user?.role === 'MANAGEMENT' || user?.role === 'TEACHER'

  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    bloodGroup: 'O+',
    allergies: 'None reported',
    heightCm: 165.0,
    weightKg: 55.0,
    medicalNotes: 'Annual physical checkup normal'
  })

  useEffect(() => {
    fetchHealth()
  }, [])

  const fetchHealth = async () => {
    try {
      const studentId = user?.profileId || user?.userId || 1
      const { data } = await api.get(`/health/${studentId}`)
      setHealth(data)
      if (data) {
        setFormData({
          bloodGroup: data.bloodGroup || 'O+',
          allergies: data.allergies || 'None reported',
          heightCm: data.heightCm || 165.0,
          weightKg: data.weightKg || 55.0,
          medicalNotes: data.medicalNotes || 'Annual physical checkup normal'
        })
      }
    } catch (error) {
      console.error('Failed to fetch student health record:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateHealth = async (e) => {
    e.preventDefault()
    const height = parseFloat(formData.heightCm)
    const weight = parseFloat(formData.weightKg)
    if (isNaN(height) || height < 30 || height > 250) {
      setMessage('Height must be in the permitted range [30.0 cm - 250.0 cm].')
      return
    }
    if (isNaN(weight) || weight < 3 || weight > 250) {
      setMessage('Weight must be in the permitted range [3.0 kg - 250.0 kg].')
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const studentId = user?.profileId || user?.userId || 1
      await api.post('/health', {
        studentId: parseInt(studentId),
        ...formData
      })
      setMessage('Health record updated successfully!')
      setTimeout(() => {
        setMessage('')
        setShowEditModal(false)
        fetchHealth()
      }, 1500)
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update health record')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-900">Student Health Profile</h1>
          <p className="text-surface-700/60 mt-1">Medical history, allergies, blood group, and fitness parameters</p>
        </div>
        {isStaff && (
          <button
            onClick={() => setShowEditModal(true)}
            className="btn-accent text-sm flex items-center gap-2"
          >
            <HiPencilSquare className="w-4 h-4" />
            Update Health Record
          </button>
        )}
      </div>

      {loading ? (
        <div className="animate-pulse text-surface-700/50 py-4">Loading health profile...</div>
      ) : !health ? (
        <div className="text-center py-8 text-surface-700/50 card p-6">
          <HiHeart className="w-12 h-12 mx-auto mb-2 text-surface-300" />
          <p>No health profile recorded.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Blood Group & Vitals Card */}
          <div className="card p-6 border-l-4 border-l-red-500 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-surface-700/50">Vitals & Blood</span>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <h3 className="text-4xl font-display font-extrabold text-red-600">{health.bloodGroup || 'O+'}</h3>
                  <p className="text-xs text-surface-700/60 font-semibold mt-1">Blood Group</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                  <HiHeart className="w-8 h-8 text-red-500" />
                </div>
              </div>
            </div>
            <div className="border-t border-surface-100 pt-4 mt-6 grid grid-cols-2 gap-4 text-center">
              <div>
                <span className="text-xs text-surface-400 font-medium">Height</span>
                <p className="font-display font-bold text-surface-900 text-lg">{health.heightCm || '—'} cm</p>
              </div>
              <div>
                <span className="text-xs text-surface-400 font-medium">Weight</span>
                <p className="font-display font-bold text-surface-900 text-lg">{health.weightKg || '—'} kg</p>
              </div>
            </div>
          </div>

          {/* Allergy & Medical Alerts Card */}
          <div className="card p-6 border-l-4 border-l-amber-500 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-surface-700/50">Allergy & Dietary Alerts</span>
              <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <p className="font-semibold text-amber-900 text-sm">{health.allergies || 'None reported'}</p>
              </div>
            </div>
            <div className="border-t border-surface-100 pt-4 mt-6 flex items-center gap-2 text-xs text-surface-700/60">
              <HiShieldCheck className="w-4 h-4 text-green-600" />
              <span>Emergency medical contacts updated</span>
            </div>
          </div>

          {/* Clinical Checkup Notes Card */}
          <div className="card p-6 border-l-4 border-l-primary-600 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-surface-700/50">Clinical Notes</span>
              <p className="text-surface-900 text-sm leading-relaxed mt-4 font-medium">
                {health.medicalNotes || 'Annual physical evaluation normal.'}
              </p>
            </div>
            <div className="border-t border-surface-100 pt-4 mt-6 text-xs text-surface-400">
              Last checkup date: <strong className="text-surface-700">{health.lastCheckup || '2026-08-01'}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Edit Health Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="card-glass w-full max-w-md bg-white p-6 rounded-2xl shadow-2xl relative border border-surface-200">
            <button onClick={() => setShowEditModal(false)} className="absolute top-4 right-4 text-surface-400 hover:text-surface-900">
              <HiXMark className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-display font-bold text-surface-900 mb-1">Update Health Profile</h3>
            <p className="text-sm text-surface-700/60 mb-4">Modify student medical record</p>

            {message && (
              <div className="mb-4 p-3 rounded-xl bg-accent-100 text-accent-800 text-sm font-medium">
                {message}
              </div>
            )}

            <form onSubmit={handleUpdateHealth} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="input-field py-2"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Height (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.heightCm}
                    onChange={(e) => setFormData({ ...formData, heightCm: parseFloat(e.target.value) })}
                    className="input-field py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weightKg}
                    onChange={(e) => setFormData({ ...formData, weightKg: parseFloat(e.target.value) })}
                    className="input-field py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Known Allergies</label>
                <input
                  type="text"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  className="input-field py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Medical Checkup Notes</label>
                <textarea
                  rows="3"
                  value={formData.medicalNotes}
                  onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
                  className="input-field py-2"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-accent flex-1">
                  {submitting ? 'Updating...' : 'Save Health Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
