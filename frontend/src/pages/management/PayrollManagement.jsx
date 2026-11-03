import { useState, useEffect } from 'react'
import api from '../../api/axiosConfig'
import { HiCurrencyRupee, HiUser, HiPlus, HiXMark, HiCheckCircle } from 'react-icons/hi2'

export default function PayrollManagement() {
  const [salaries, setSalaries] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showProcessModal, setShowProcessModal] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState('August 2025')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    teacherId: '',
    monthYear: 'August 2025',
    basicSalary: '50000',
    allowances: '5000',
    deductions: '2000',
    status: 'PAID'
  })

  useEffect(() => {
    fetchData()
  }, [selectedMonth])

  const fetchData = async () => {
    try {
      const [sRes, tRes] = await Promise.all([
        api.get(`/payroll?monthYear=${selectedMonth}`),
        api.get('/admin/teachers')
      ])
      setSalaries(sRes.data)
      setTeachers(tRes.data)
    } catch (error) {
      console.error('Failed to fetch payroll data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProcessSalary = async (e) => {
    e.preventDefault()
    if (!formData.teacherId || !formData.basicSalary) return
    const basic = parseFloat(formData.basicSalary)
    const allowances = parseFloat(formData.allowances) || 0
    const deductions = parseFloat(formData.deductions) || 0
    if (isNaN(basic) || basic < 0 || basic > 10000000) {
      setMessage('Basic salary must be in the permitted range [₹0 - ₹10,000,000].')
      return
    }
    if (allowances < 0 || allowances > 10000000) {
      setMessage('Allowances must be in the permitted range [₹0 - ₹10,000,000].')
      return
    }
    if (deductions < 0 || deductions > (basic + allowances)) {
      setMessage('Deductions cannot exceed total gross salary.')
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      await api.post('/payroll', {
        ...formData,
        teacherId: parseInt(formData.teacherId),
        basicSalary: basic,
        allowances: allowances,
        deductions: deductions,
      })
      setMessage('Salary slip processed successfully!')
      setTimeout(() => {
        setMessage('')
        setShowProcessModal(false)
        fetchData()
      }, 1500)
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to process salary')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-900">Faculty Payroll</h1>
          <p className="text-surface-700/60 mt-1">Manage teacher salaries, allowances, and monthly payroll</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="input-field py-2 text-sm"
          >
            <option value="August 2025">August 2025</option>
            <option value="July 2025">July 2025</option>
            <option value="June 2025">June 2025</option>
          </select>
          <button
            onClick={() => setShowProcessModal(true)}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <HiPlus className="w-4 h-4" />
            Process Salary Slip
          </button>
        </div>
      </div>

      {/* Salary Table */}
      <div className="card p-6">
        {loading ? (
          <div className="animate-pulse text-surface-700/50 py-4">Loading payroll records...</div>
        ) : salaries.length === 0 ? (
          <div className="text-center py-8 text-surface-700/50">
            <HiCurrencyRupee className="w-12 h-12 mx-auto mb-2 text-surface-300" />
            <p>No salary slips processed for {selectedMonth} yet.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Teacher Name</th>
                  <th>Month</th>
                  <th>Basic Salary</th>
                  <th>Allowances</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                  <th>Payment Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {salaries.map((s) => (
                  <tr key={s.id}>
                    <td className="font-medium text-surface-900 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center font-bold text-accent-700 text-xs">
                        {s.teacher?.fullName?.charAt(0) || 'T'}
                      </div>
                      {s.teacher?.fullName}
                    </td>
                    <td className="text-sm font-semibold">{s.monthYear}</td>
                    <td>₹{s.basicSalary?.toFixed(2)}</td>
                    <td className="text-accent-700">+₹{s.allowances?.toFixed(2)}</td>
                    <td className="text-red-600">-₹{s.deductions?.toFixed(2)}</td>
                    <td className="font-bold text-surface-900 text-base">₹{s.netSalary?.toFixed(2)}</td>
                    <td className="text-sm text-surface-700/60">{s.paymentDate || '—'}</td>
                    <td>
                      <span className="badge badge-paid flex items-center gap-1 w-fit">
                        <HiCheckCircle className="w-3.5 h-3.5" />
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Process Salary Modal */}
      {showProcessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="card-glass w-full max-w-md bg-white p-6 rounded-2xl shadow-2xl relative border border-surface-200">
            <button onClick={() => setShowProcessModal(false)} className="absolute top-4 right-4 text-surface-400 hover:text-surface-900">
              <HiXMark className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-display font-bold text-surface-900 mb-1">Process Salary Slip</h3>
            <p className="text-sm text-surface-700/60 mb-4">Generate faculty salary disbursement</p>

            {message && (
              <div className="mb-4 p-3 rounded-xl bg-accent-100 text-accent-800 text-sm font-medium">
                {message}
              </div>
            )}

            <form onSubmit={handleProcessSalary} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Select Teacher</label>
                <select
                  required
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="input-field"
                >
                  <option value="">-- Select Teacher --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.fullName} ({t.employeeId || 'Faculty'})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Basic Salary (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.basicSalary}
                    onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Allowances (₹)</label>
                  <input
                    type="number"
                    value={formData.allowances}
                    onChange={(e) => setFormData({ ...formData, allowances: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Deductions (₹)</label>
                <input
                  type="number"
                  value={formData.deductions}
                  onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowProcessModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Processing...' : 'Disburse Salary'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
