import { useState, useEffect } from 'react'
import api from '../../api/axiosConfig'
import { HiAcademicCap, HiMagnifyingGlass, HiPhone, HiCalendar } from 'react-icons/hi2'

export default function AlumniDirectory() {
  const [alumni, setAlumni] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedYear, setSelectedYear] = useState('')

  useEffect(() => {
    fetchAlumni()
  }, [selectedYear])

  const fetchAlumni = async () => {
    try {
      const url = selectedYear ? `/alumni?graduationYear=${selectedYear}` : '/alumni'
      const { data } = await api.get(url)
      setAlumni(data)
    } catch (error) {
      console.error('Failed to fetch alumni records:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAlumni = alumni.filter(a =>
    a.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.finalClass?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-900">Alumni Directory</h1>
          <p className="text-surface-700/60 mt-1">Archive of graduated students and pass-out batches</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-surface-700 uppercase">Batch Year:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="input-field py-1.5 text-sm w-40"
          >
            <option value="">All Batches</option>
            <option value="2024-2025">2024-2025</option>
            <option value="2023-2024">2023-2024</option>
            <option value="2022-2023">2022-2023</option>
          </select>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card p-4 flex items-center gap-3">
        <HiMagnifyingGlass className="w-5 h-5 text-surface-400 ml-2" />
        <input
          type="text"
          placeholder="Search by alumni name, admission number, or final class..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent text-sm focus:outline-none text-surface-900 placeholder:text-surface-400"
        />
      </div>

      {/* Alumni Table */}
      <div className="card p-6">
        {loading ? (
          <div className="animate-pulse text-surface-700/50 py-4">Loading alumni records...</div>
        ) : filteredAlumni.length === 0 ? (
          <div className="text-center py-8 text-surface-700/50">
            <HiAcademicCap className="w-12 h-12 mx-auto mb-2 text-surface-300" />
            <p>No alumni records found. Students will be archived here automatically upon end-of-year promotion!</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Admission No</th>
                  <th>Student Name</th>
                  <th>Graduation Batch</th>
                  <th>Final Class</th>
                  <th>Parent Phone</th>
                  <th>Archived Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlumni.map((a, idx) => (
                  <tr key={a.id}>
                    <td className="text-surface-400 text-xs font-semibold">{idx + 1}</td>
                    <td className="font-mono text-sm font-semibold text-primary-700">{a.admissionNumber || '—'}</td>
                    <td className="font-medium text-surface-900">{a.fullName}</td>
                    <td>
                      <span className="badge badge-paid flex items-center gap-1 w-fit">
                        <HiAcademicCap className="w-3.5 h-3.5" />
                        {a.graduationYear}
                      </span>
                    </td>
                    <td className="text-sm font-medium">{a.finalClass || 'Grade 12'}</td>
                    <td className="text-sm text-surface-700/70">
                      {a.parentPhone ? (
                        <span className="flex items-center gap-1">
                          <HiPhone className="w-3.5 h-3.5 text-surface-400" />
                          {a.parentPhone}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="text-xs text-surface-700/50">
                      <span className="flex items-center gap-1">
                        <HiCalendar className="w-3.5 h-3.5" />
                        {a.migratedAt ? new Date(a.migratedAt).toLocaleDateString() : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
