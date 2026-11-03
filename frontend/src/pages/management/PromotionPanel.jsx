import { useState } from 'react'
import api from '../../api/axiosConfig'
import { HiArrowsUpDown, HiExclamationTriangle, HiCheckCircle } from 'react-icons/hi2'

export default function PromotionPanel() {
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const academicYear = '2025-2026'

  const fetchPreview = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/promotions/preview?academicYear=${academicYear}`)
      setPreview(data)
    } catch (error) {
      console.error('Preview failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const executePromotion = async () => {
    setLoading(true)
    try {
      const { data } = await api.post(`/promotions/promote-all?academicYear=${academicYear}`)
      setResult(data)
      setConfirming(false)
    } catch (error) {
      console.error('Promotion failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-display font-bold text-surface-900">Year-End Promotions</h1>
        <p className="text-surface-700/60 mt-1">Promote students and manage alumni registry</p>
      </div>

      {/* Preview */}
      <div className="card p-6">
        <h2 className="text-lg font-display font-bold text-surface-900 mb-4 flex items-center gap-2">
          <HiArrowsUpDown className="w-5 h-5 text-primary-600" />
          Promotion Preview
        </h2>
        <p className="text-sm text-surface-700/60 mb-4">
          Review the impact before executing the year-end promotion workflow.
        </p>
        <button onClick={fetchPreview} disabled={loading} className="btn-primary" id="preview-promotion-btn">
          {loading ? 'Loading...' : 'Generate Preview'}
        </button>

        {preview && (
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-surface-50">
              <p className="text-sm text-surface-700/60">Current Year</p>
              <p className="text-xl font-bold">{preview.currentYear}</p>
            </div>
            <div className="p-4 rounded-xl bg-primary-50">
              <p className="text-sm text-primary-600">Next Year</p>
              <p className="text-xl font-bold text-primary-700">{preview.nextYear}</p>
            </div>
            <div className="p-4 rounded-xl bg-accent-50">
              <p className="text-sm text-accent-600">Students to Promote</p>
              <p className="text-xl font-bold text-accent-700">{preview.promotingStudents}</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50">
              <p className="text-sm text-amber-600">Graduating (Grade 10 → Alumni)</p>
              <p className="text-xl font-bold text-amber-700">{preview.graduatingStudents}</p>
            </div>
          </div>
        )}
      </div>

      {/* Execute */}
      {preview && !result && (
        <div className="card p-6 border-amber-200 bg-amber-50/50">
          <div className="flex items-start gap-3">
            <HiExclamationTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-surface-900">Confirm Promotion</h3>
              <p className="text-sm text-surface-700/70 mt-1">
                This will promote {preview.promotingStudents} students, graduate {preview.graduatingStudents} students
                to the alumni registry, and roll over pending fees. This action cannot be easily undone.
              </p>
              {!confirming ? (
                <button onClick={() => setConfirming(true)} className="btn-danger mt-4">
                  I understand, proceed
                </button>
              ) : (
                <div className="flex gap-3 mt-4">
                  <button onClick={executePromotion} disabled={loading} className="btn-danger">
                    {loading ? 'Processing...' : 'Execute Promote All'}
                  </button>
                  <button onClick={() => setConfirming(false)} className="btn-secondary">Cancel</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="card p-6 border-accent-200 bg-accent-50/50">
          <div className="flex items-start gap-3">
            <HiCheckCircle className="w-6 h-6 text-accent-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-surface-900">Promotion Complete!</h3>
              <div className="mt-2 space-y-1 text-sm text-surface-700">
                <p>✅ <strong>{result.promoted}</strong> students promoted</p>
                <p>🎓 <strong>{result.graduated}</strong> students graduated to alumni</p>
                <p>📅 New academic year: <strong>{result.nextAcademicYear}</strong></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
