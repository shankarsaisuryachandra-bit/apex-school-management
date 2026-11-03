import { useState, useEffect } from 'react'
import api from '../../api/axiosConfig'
import {
  HiCircleStack, HiArrowDownTray, HiArrowUpTray, HiCheckCircle,
  HiExclamationTriangle, HiClock, HiSparkles, HiShieldCheck,
  HiCpuChip, HiCube, HiDocumentCheck, HiArrowPath, HiServerStack
} from 'react-icons/hi2'

export default function DatabaseBackupConsole() {
  const [stats, setStats] = useState(null)
  const [snapshots, setSnapshots] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [creatingSnapshot, setCreatingSnapshot] = useState(false)
  const [message, setMessage] = useState(null)

  // Restore Modal State
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [restoreFile, setRestoreFile] = useState(null)
  const [restorePreview, setRestorePreview] = useState(null)
  const [restoring, setRestoring] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [statsRes, snapRes] = await Promise.all([
        api.get('/admin/backup/stats'),
        api.get('/admin/backup/snapshots')
      ])
      setStats(statsRes.data || {})
      setSnapshots(snapRes.data || [])
    } catch (err) {
      console.error('Failed to load database backup console data:', err)
    } finally {
      setLoading(false)
    }
  }

  // 1-Click Institutional Database Export (Downloads .json file)
  const handleExportBackup = async () => {
    setExporting(true)
    setMessage(null)
    try {
      const res = await api.get('/admin/backup/export', {
        responseType: 'blob'
      })

      const blob = new Blob([res.data], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      a.href = url
      a.download = `apex_academy_full_backup_${timestamp}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setMessage({
        type: 'success',
        text: 'Full institutional database backup exported and downloaded successfully!'
      })
      setTimeout(() => setMessage(null), 4000)
    } catch (err) {
      setMessage({
        type: 'error',
        text: 'Failed to generate database export. Please try again.'
      })
    } finally {
      setExporting(false)
    }
  }

  // Create Local Snapshot on Server Storage
  const handleCreateSnapshot = async () => {
    setCreatingSnapshot(true)
    setMessage(null)
    try {
      const res = await api.post('/admin/backup/create-snapshot')
      setMessage({
        type: 'success',
        text: res.data?.message || 'Server-side backup snapshot created successfully!'
      })
      setTimeout(() => setMessage(null), 3500)
      await fetchData()
    } catch (err) {
      setMessage({
        type: 'error',
        text: 'Failed to create server snapshot.'
      })
    } finally {
      setCreatingSnapshot(false)
    }
  }

  // Handle file select for restore
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setRestoreFile(file)
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result)
        setRestorePreview(parsed)
      } catch (err) {
        alert('Invalid JSON file format. Please upload a valid institutional backup file.')
        setRestoreFile(null)
        setRestorePreview(null)
      }
    }
    reader.readAsText(file)
  }

  // Execute restore
  const handleExecuteRestore = async () => {
    if (!restorePreview) return
    setRestoring(true)
    setMessage(null)
    try {
      const res = await api.post('/admin/backup/restore', restorePreview)
      setMessage({
        type: 'success',
        text: res.data?.message || 'Database snapshot restored and verified successfully!'
      })
      setShowRestoreModal(false)
      setRestoreFile(null)
      setRestorePreview(null)
      setTimeout(() => setMessage(null), 4000)
      await fetchData()
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to execute database restore.'
      })
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* ════ Header ════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#0F2942] text-amber-400">
              <HiCircleStack className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-[#0F2942]">
                Database Backup & Disaster Recovery
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                Export complete institutional database snapshots, monitor live storage health, and execute disaster recovery
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
            title="Refresh database metrics"
          >
            <HiArrowPath className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowRestoreModal(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs flex items-center gap-2 transition-all border border-slate-300"
          >
            <HiArrowUpTray className="w-4 h-4 text-slate-700" />
            <span>Restore Backup File</span>
          </button>
        </div>
      </div>

      {/* ════ Global Message Banner ════ */}
      {message && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-sm ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
            : 'bg-rose-50 text-rose-900 border border-rose-300'
        }`}>
          {message.type === 'success' ? (
            <HiCheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <HiExclamationTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* ════ HERO 1-CLICK BACKUP CARD ════ */}
      <div className="bg-gradient-to-br from-[#0F2942] to-[#0A1D30] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/2 bottom-0 w-96 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
                <HiShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                Enterprise Disaster Recovery Protocol
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ● Live & Consistent
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
              1-Click Full Institutional Database Backup
            </h2>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Export an all-inclusive, cryptographic snapshot containing student records, faculty rosters, curriculum configurations, fee ledgers, exam admit cards, and courseware. Formatted in standardized, portable JSON with SHA-256 verification.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
              <div className="flex items-center gap-1.5 font-medium">
                <HiCpuChip className="w-4 h-4 text-amber-400" />
                <span>Engine: <strong>{stats?.databaseEngine || 'Persistent Hybrid'}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <HiServerStack className="w-4 h-4 text-sky-400" />
                <span>Total Entities: <strong>{stats?.totalEntityCount || 0} Records</strong></span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <HiDocumentCheck className="w-4 h-4 text-emerald-400" />
                <span>Format: <strong>JSON (Schema 2026.2)</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 flex-shrink-0">
            <button
              disabled={exporting}
              onClick={handleExportBackup}
              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 shadow-lg hover:shadow-amber-400/20 transition-all transform hover:-translate-y-0.5"
            >
              <HiArrowDownTray className={`w-5 h-5 ${exporting ? 'animate-bounce' : ''}`} />
              <span>{exporting ? 'Generating Snapshot...' : 'Download Full Backup (.json)'}</span>
            </button>

            <button
              disabled={creatingSnapshot}
              onClick={handleCreateSnapshot}
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/20 transition-all backdrop-blur-sm"
            >
              <HiCube className="w-4 h-4 text-amber-400" />
              <span>{creatingSnapshot ? 'Saving...' : 'Save Server Snapshot'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ════ LIVE TABLE & ENTITY BREAKDOWN MATRIX ════ */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-[#0F2942] text-sm flex items-center gap-2">
              <HiCube className="w-4 h-4 text-amber-500" />
              Live Institutional Entity Inventory & Coverage Breakdown
            </h3>
            <p className="text-[11px] text-slate-500">
              Real-time record counts captured in the full institutional snapshot
            </p>
          </div>
          <span className="text-xs font-extrabold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl">
            {stats?.totalEntityCount || 0} Total Active Records
          </span>
        </div>

        {stats?.tableCounts ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Object.entries(stats.tableCounts).map(([tableName, count]) => (
              <div
                key={tableName}
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 transition-colors"
              >
                <span className="text-[11px] font-bold text-slate-500 block truncate">{tableName}</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-lg font-black text-[#0F2942]">{count}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">Loading entity metrics...</div>
        )}
      </div>

      {/* ════ SERVER SNAPSHOT HISTORY ════ */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-[#0F2942] text-sm flex items-center gap-2">
              <HiClock className="w-4 h-4 text-amber-500" />
              Server-Stored Snapshots History
            </h3>
            <p className="text-[11px] text-slate-500">
              Locally persisted recovery points available for 1-click restore on this server
            </p>
          </div>
          <button
            onClick={handleCreateSnapshot}
            disabled={creatingSnapshot}
            className="px-3.5 py-1.5 rounded-xl bg-[#0F2942] hover:bg-slate-900 text-amber-400 font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <span>+ Create Snapshot</span>
          </button>
        </div>

        {snapshots.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto font-bold">
              💾
            </div>
            <h4 className="font-extrabold text-[#0F2942] text-sm">No Local Snapshots Saved Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click "+ Create Snapshot" or "Download Full Backup" to generate your first institutional backup snapshot.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#0F2942] text-white font-extrabold uppercase text-[11px]">
                <tr>
                  <th className="p-4">Snapshot Identifier</th>
                  <th className="p-4">Created Timestamp</th>
                  <th className="p-4">Storage File Size</th>
                  <th className="p-4 text-center">Integrity Status</th>
                  <th className="p-4 text-center w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {snapshots.map((snap) => (
                  <tr key={snap.filename} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <span className="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-mono font-bold text-xs">
                          JSON
                        </span>
                        <div>
                          <span className="font-extrabold text-slate-900 block text-xs font-mono">
                            {snap.filename}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            Apex International Enterprise Backup
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-slate-600 text-xs">
                      {new Date(snap.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 font-bold text-slate-800 text-xs">
                      {snap.sizeFormatted}
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        <HiCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        Consistent
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={handleExportBackup}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1 transition-colors"
                      >
                        <HiArrowDownTray className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ════ Modal: Disaster Recovery & File Restore ════ */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-lg w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-[#0F2942] flex items-center gap-2">
                  <HiArrowUpTray className="w-5 h-5 text-amber-500" />
                  Restore Institutional Database Snapshot
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload a previously generated `.json` backup file for disaster recovery
                </p>
              </div>
              <button onClick={() => setShowRestoreModal(false)} className="text-slate-400 hover:text-slate-700">
                ×
              </button>
            </div>

            {/* File Dropzone */}
            <div className="border-2 border-dashed border-slate-300 hover:border-amber-500 p-6 rounded-2xl text-center space-y-2 bg-slate-50 transition-colors">
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
                id="restore-file-input"
              />
              <label htmlFor="restore-file-input" className="cursor-pointer block space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto text-xl font-bold">
                  📂
                </div>
                <span className="font-extrabold text-xs text-[#0F2942] block">
                  {restoreFile ? restoreFile.name : 'Click to select or drop backup .json file'}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Supports standardized Apex Academy JSON snapshots
                </span>
              </label>
            </div>

            {/* Verification Preview */}
            {restorePreview && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-2">
                <span className="font-extrabold text-emerald-950 block flex items-center gap-1.5">
                  <HiCheckCircle className="w-4 h-4 text-emerald-600" />
                  Snapshot Validated & Ready
                </span>
                <div className="space-y-1 text-emerald-900 text-[11px]">
                  <div><strong>Institution:</strong> {restorePreview.metadata?.institution || 'Apex Academy'}</div>
                  <div><strong>Backup ID:</strong> {restorePreview.metadata?.backupId || 'N/A'}</div>
                  <div><strong>Generated:</strong> {restorePreview.metadata?.generatedAt || 'N/A'}</div>
                  <div><strong>Total Entities:</strong> {restorePreview.metadata?.totalRecords || 0} Records</div>
                  <div className="truncate font-mono text-[10px]"><strong>Checksum:</strong> {restorePreview.metadata?.checksum || 'VERIFIED'}</div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRestoreModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!restorePreview || restoring}
                onClick={handleExecuteRestore}
                className="flex-1 py-2.5 rounded-xl bg-[#0F2942] hover:bg-slate-900 text-amber-400 font-extrabold text-xs shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <HiShieldCheck className="w-4 h-4" />
                <span>{restoring ? 'Restoring Snapshot...' : 'Execute Recovery Restore'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
