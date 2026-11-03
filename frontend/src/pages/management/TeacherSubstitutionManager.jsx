import { useState, useEffect } from 'react'
import api from '../../api/axiosConfig'
import {
  HiArrowsUpDown, HiCalendarDays, HiUserMinus, HiUserPlus,
  HiCheckCircle, HiExclamationTriangle, HiTrash, HiArrowPath,
  HiAcademicCap, HiClock, HiBuildingOffice, HiSparkles, HiQueueList
} from 'react-icons/hi2'

export default function TeacherSubstitutionManager() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [teachers, setTeachers] = useState([])
  const [dailyCovers, setDailyCovers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAbsentTeacher, setSelectedAbsentTeacher] = useState('')
  const [affectedSlots, setAffectedSlots] = useState([])
  const [availableCandidates, setAvailableCandidates] = useState({}) // { [slotKey]: teacherArray }
  const [selectedSubstitutes, setSelectedSubstitutes] = useState({}) // { [slotKey]: substituteId }
  const [assigningSlot, setAssigningSlot] = useState(null)
  const [actionMessage, setActionMessage] = useState(null)
  const [activeTab, setActiveTab] = useState('workstation') // 'workstation' | 'log'

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    fetchDailyCovers()
    if (selectedAbsentTeacher) {
      loadAffectedSlots(selectedAbsentTeacher, selectedDate)
    }
  }, [selectedDate])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      const [tRes, cRes] = await Promise.all([
        api.get('/admin/teachers'),
        api.get(`/substitutions/daily?date=${selectedDate}`)
      ])
      setTeachers(tRes.data)
      setDailyCovers(cRes.data)
    } catch (err) {
      console.error('Failed to load substitution manager initial data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchDailyCovers = async () => {
    try {
      const res = await api.get(`/substitutions/daily?date=${selectedDate}`)
      setDailyCovers(res.data)
    } catch (err) {
      console.error('Failed to fetch daily covers:', err)
    }
  }

  const handleSelectAbsentTeacher = (teacherId) => {
    setSelectedAbsentTeacher(teacherId)
    setAffectedSlots([])
    setAvailableCandidates({})
    setSelectedSubstitutes({})
    if (teacherId) {
      loadAffectedSlots(teacherId, selectedDate)
    }
  }

  const loadAffectedSlots = async (teacherId, date) => {
    try {
      const res = await api.get(`/substitutions/affected-slots?teacherId=${teacherId}&date=${date}`)
      const slots = res.data || []
      setAffectedSlots(slots)

      // Fetch candidates for each slot
      for (const slot of slots) {
        fetchCandidatesForSlot(slot, teacherId, date)
      }
    } catch (err) {
      console.error('Failed to fetch affected slots for teacher:', err)
    }
  }

  const fetchCandidatesForSlot = async (slot, absentTeacherId, date) => {
    const slotKey = `${slot.periodId}_${slot.classId}`
    try {
      const res = await api.get('/substitutions/available-teachers', {
        params: {
          date,
          dayOfWeek: slot.dayOfWeek,
          periodId: slot.periodId,
          absentTeacherId
        }
      })
      const candidates = res.data || []
      setAvailableCandidates(prev => ({ ...prev, [slotKey]: candidates }))
      if (candidates.length > 0) {
        const firstId = candidates[0].teacherId || candidates[0].id
        setSelectedSubstitutes(prev => ({ ...prev, [slotKey]: firstId }))
      }
    } catch (err) {
      console.error(`Failed to fetch candidates for slot ${slotKey}:`, err)
    }
  }

  const handleAssignCover = async (slot) => {
    const slotKey = `${slot.periodId}_${slot.classId}`
    const subTeacherId = selectedSubstitutes[slotKey]
    if (!subTeacherId) {
      setActionMessage({ type: 'error', text: 'Please select an available substitute teacher first.' })
      return
    }

    setAssigningSlot(slotKey)
    setActionMessage(null)
    try {
      await api.post('/substitutions/assign', {
        date: selectedDate,
        periodId: slot.periodId,
        classId: slot.classId,
        subjectId: slot.subjectId,
        absentTeacherId: Number(selectedAbsentTeacher),
        substituteTeacherId: Number(subTeacherId)
      })

      setActionMessage({ type: 'success', text: `Cover teacher assigned successfully for Period ${slot.periodLabel || slot.periodId}!` })
      await fetchDailyCovers()
      await loadAffectedSlots(selectedAbsentTeacher, selectedDate)
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to assign substitution.'
      setActionMessage({ type: 'error', text: errMsg })
    } finally {
      setAssigningSlot(null)
    }
  }

  const handleCancelCover = async (substitutionId) => {
    if (!window.confirm('Are you sure you want to cancel this daily cover assignment?')) return
    try {
      await api.delete(`/substitutions/${substitutionId}`)
      setActionMessage({ type: 'success', text: 'Cover assignment revoked.' })
      fetchDailyCovers()
      if (selectedAbsentTeacher) {
        loadAffectedSlots(selectedAbsentTeacher, selectedDate)
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Failed to revoke cover assignment.' })
    }
  }

  const selectedTeacherObj = teachers.find(t => t.id === Number(selectedAbsentTeacher))

  return (
    <div className="animate-fade-in space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Header Banner */}
      <div className="bg-[#0F2942] rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-[#1B324D]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <HiSparkles className="w-4 h-4" /> Daily Operations & Absence Management
            </div>
            <h1 className="text-3xl font-display font-extrabold tracking-tight text-white">
              Teacher Substitution & Daily Cover Manager
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Automated clash detection & fair workload distribution. Instantly calculate substitute teacher availability, manage daily class covers, and push live schedule updates to teacher & student portals.
            </p>
          </div>

          {/* Date Picker Widget */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex flex-col gap-1 min-w-[220px]">
            <label className="text-[11px] font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
              <HiCalendarDays className="w-4 h-4" /> Select Operating Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white text-slate-900 font-bold px-3 py-2 rounded-xl text-sm border-0 focus:ring-2 focus:ring-amber-500 shadow-inner"
            />
            <span className="text-[10px] text-slate-300 text-right mt-0.5 font-mono">
              Day: {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })}
            </span>
          </div>
        </div>
      </div>

      {/* Overview Stat Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border-l-4 border-amber-500 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <HiUserMinus className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Daily Absences Logged</p>
            <h3 className="text-2xl font-black text-[#0F2942]">
              {Array.from(new Set(dailyCovers.map(c => c.absentTeacher?.id))).length}
            </h3>
          </div>
        </div>

        <div className="card p-5 border-l-4 border-blue-500 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <HiArrowsUpDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Covers Assigned Today</p>
            <h3 className="text-2xl font-black text-[#0F2942]">{dailyCovers.length}</h3>
          </div>
        </div>

        <div className="card p-5 border-l-4 border-emerald-500 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <HiUserPlus className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Active Faculty Roster</p>
            <h3 className="text-2xl font-black text-[#0F2942]">{teachers.length}</h3>
          </div>
        </div>

        <div className="card p-5 border-l-4 border-indigo-500 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <HiQueueList className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Target Date</p>
            <h3 className="text-sm font-black text-[#0F2942] font-mono">{selectedDate}</h3>
          </div>
        </div>
      </div>

      {/* System Action Messages */}
      {actionMessage && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between animate-fade-in ${
          actionMessage.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <div className="flex items-center gap-2">
            {actionMessage.type === 'error' ? (
              <HiExclamationTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <HiCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="underline text-[11px]">Dismiss</button>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('workstation')}
          className={`px-5 py-2.5 rounded-2xl font-extrabold text-xs transition-all flex items-center gap-2 ${
            activeTab === 'workstation'
              ? 'bg-[#0F2942] text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <HiArrowsUpDown className="w-4 h-4 text-amber-400" />
          Assign Cover Workstation
        </button>
        <button
          onClick={() => setActiveTab('log')}
          className={`px-5 py-2.5 rounded-2xl font-extrabold text-xs transition-all flex items-center gap-2 ${
            activeTab === 'log'
              ? 'bg-[#0F2942] text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <HiQueueList className="w-4 h-4 text-amber-400" />
          Active Daily Covers Log ({dailyCovers.length})
        </button>
      </div>

      {/* TAB 1: WORKSTATION */}
      {activeTab === 'workstation' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Panel: Absent Teacher Selection */}
          <div className="card p-6 space-y-4 border border-slate-200 shadow-sm h-fit">
            <div>
              <h3 className="text-base font-extrabold text-[#0F2942] flex items-center gap-2">
                <HiUserMinus className="w-5 h-5 text-amber-600" />
                1. Select Absent Teacher
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Choose the faculty member on leave for <strong>{selectedDate}</strong> to view affected class periods.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase">Faculty Roster</label>
              <select
                value={selectedAbsentTeacher}
                onChange={(e) => handleSelectAbsentTeacher(e.target.value)}
                className="input-field font-semibold py-2.5 border-slate-300"
              >
                <option value="">-- Choose Absent Teacher --</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.fullName} ({t.department || 'Faculty'}) - ID: {t.employeeId}
                  </option>
                ))}
              </select>
            </div>

            {selectedTeacherObj && (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2 text-xs">
                <div className="font-extrabold text-[#0F2942] flex items-center justify-between">
                  <span>{selectedTeacherObj.fullName}</span>
                  <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-mono text-[10px]">
                    ID: {selectedTeacherObj.employeeId}
                  </span>
                </div>
                <p className="text-slate-600">
                  <strong>Department:</strong> {selectedTeacherObj.department || 'General Faculty'}
                </p>
                <p className="text-slate-600">
                  <strong>Specialization:</strong> {selectedTeacherObj.qualification || 'Teaching Staff'}
                </p>
                <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-amber-900 font-bold text-[11px]">
                  <span>Affected Regular Periods Today:</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white">
                    {affectedSlots.length} slots
                  </span>
                </div>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-[11px] text-slate-600">
              <span className="font-bold text-[#0F2942] block flex items-center gap-1">
                <HiCheckCircle className="w-4 h-4 text-emerald-600" /> Clash Prevention Guarantee
              </span>
              The substitution engine automatically screens available teachers to ensure zero scheduling overlaps and balances workload distribution.
            </div>
          </div>

          {/* Right Panel: Affected Slots & Substitute Selection */}
          <div className="lg:col-span-2 space-y-4">
            {!selectedAbsentTeacher ? (
              <div className="card p-12 text-center text-slate-500 space-y-3 border-2 border-dashed border-slate-200">
                <HiUserMinus className="w-12 h-12 mx-auto text-slate-300" />
                <h4 className="text-sm font-bold text-slate-700">No Absent Teacher Selected</h4>
                <p className="text-xs max-w-sm mx-auto text-slate-400">
                  Select a faculty member from the left dropdown panel to analyze their timetable for {selectedDate} and assign available cover teachers.
                </p>
              </div>
            ) : affectedSlots.length === 0 ? (
              <div className="card p-8 text-center text-slate-600 space-y-2 border border-slate-200">
                <HiCheckCircle className="w-10 h-10 mx-auto text-emerald-500" />
                <h4 className="text-sm font-bold text-slate-800">No Regular Classes Scheduled</h4>
                <p className="text-xs text-slate-500">
                  {selectedTeacherObj?.fullName} does not have any regular teaching periods assigned on 
                  <strong> {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })}s</strong>.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-sm font-extrabold text-[#0F2942] uppercase tracking-wider">
                    Affected Timetable Period Slots ({affectedSlots.length})
                  </h3>
                  <button
                    onClick={() => loadAffectedSlots(selectedAbsentTeacher, selectedDate)}
                    className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 underline"
                  >
                    <HiArrowPath className="w-3.5 h-3.5" /> Re-sync Availability
                  </button>
                </div>

                {affectedSlots.map(slot => {
                  const slotKey = `${slot.periodId}_${slot.classId}`
                  const candidates = availableCandidates[slotKey] || []
                  const currentSubTeacherId = selectedSubstitutes[slotKey] || ''

                  return (
                    <div 
                      key={slotKey}
                      className={`card p-5 border transition-all space-y-4 ${
                        slot.existingCover
                          ? 'bg-emerald-50/40 border-emerald-300'
                          : 'border-slate-200 hover:border-amber-400 shadow-sm'
                      }`}
                    >
                      {/* Slot Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-xl bg-[#0F2942] text-amber-400 font-black text-sm flex items-center justify-center shrink-0">
                            {slot.periodLabel ? slot.periodLabel.replace('Period ', 'P') : 'P'}
                          </span>
                          <div>
                            <h4 className="text-base font-extrabold text-[#0F2942]">
                              {slot.subjectName} — <span className="text-amber-700">{slot.className} {slot.section ? `(${slot.section})` : ''}</span>
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                              <span className="flex items-center gap-1">
                                <HiClock className="w-3.5 h-3.5 text-slate-400" />
                                {slot.startTime && slot.endTime ? `${slot.startTime} - ${slot.endTime}` : slot.periodId}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <HiBuildingOffice className="w-3.5 h-3.5 text-slate-400" />
                                {slot.room || 'Main Classroom'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {slot.existingCover && (
                          <div className="px-3 py-1 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto shadow-sm">
                            <HiCheckCircle className="w-4 h-4" /> Cover Active: {slot.existingCover.substituteTeacher?.fullName}
                          </div>
                        )}
                      </div>

                      {/* Substitution Controls */}
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-extrabold text-[#0F2942] uppercase tracking-wide">
                            Available Free Teachers ({candidates.length})
                          </label>
                          <span className="text-[11px] text-slate-400 italic">
                            Filtered for zero scheduling conflicts
                          </span>
                        </div>

                        {candidates.length === 0 ? (
                          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                            <HiExclamationTriangle className="w-4 h-4 shrink-0" />
                            No available free teachers found for this period slot. All faculty members are currently assigned to regular classes or daily covers.
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                            <select
                              value={currentSubTeacherId}
                              onChange={(e) => setSelectedSubstitutes(prev => ({ ...prev, [slotKey]: e.target.value }))}
                              className="input-field font-semibold py-2.5 text-xs flex-1 border-slate-300"
                            >
                              {candidates.map(c => {
                                const cId = c.teacherId || c.id
                                const count = c.todaySubstitutionCount ?? c.todayCoverCount ?? 0
                                return (
                                  <option key={cId} value={cId}>
                                    {c.fullName} ({c.qualification || c.department || 'Faculty'}) — Covers Today: {count}
                                  </option>
                                )
                              })}
                            </select>

                            <button
                              onClick={() => handleAssignCover(slot)}
                              disabled={assigningSlot === slotKey}
                              className="btn-primary py-2.5 px-5 text-xs font-extrabold flex items-center justify-center gap-2 shrink-0 bg-gradient-to-r from-[#0F2942] to-[#1B324D] hover:from-amber-600 hover:to-amber-700"
                            >
                              {assigningSlot === slotKey ? (
                                <span>Assigning...</span>
                              ) : (
                                <>
                                  <HiUserPlus className="w-4 h-4 text-amber-400" />
                                  <span>{slot.existingCover ? 'Update Cover Teacher' : 'Assign Daily Cover'}</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: ACTIVE DAILY LOG */}
      {activeTab === 'log' && (
        <div className="card p-6 space-y-4 border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-[#0F2942]">Active Daily Covers for {selectedDate}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete log of substitute cover arrangements recorded in database for this date.
              </p>
            </div>
            <button
              onClick={fetchDailyCovers}
              className="btn-secondary text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
            >
              <HiArrowPath className="w-4 h-4" /> Refresh Log
            </button>
          </div>

          {dailyCovers.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <HiQueueList className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No Daily Cover Assignments Found</p>
              <p className="text-xs max-w-sm mx-auto text-slate-400">
                No substitutions have been logged for {selectedDate} yet. Use the Assign Cover Workstation tab to schedule covers.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#0F2942] text-white font-extrabold uppercase text-[11px]">
                  <tr>
                    <th className="p-3 border border-slate-700">Period</th>
                    <th className="p-3 border border-slate-700">Class & Room</th>
                    <th className="p-3 border border-slate-700">Subject</th>
                    <th className="p-3 border border-slate-700">Absent Teacher</th>
                    <th className="p-3 border border-slate-700">Substitute Cover Teacher</th>
                    <th className="p-3 border border-slate-700">Assigned At</th>
                    <th className="p-3 border border-slate-700 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {dailyCovers.map((cov, idx) => (
                    <tr key={cov.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                      <td className="p-3 font-extrabold text-[#0F2942] border border-slate-200">
                        {cov.periodLabel || cov.periodId}
                      </td>
                      <td className="p-3 border border-slate-200 font-bold text-slate-800">
                        {cov.schoolClass?.className} {cov.schoolClass?.section ? `(${cov.schoolClass.section})` : ''}
                        <span className="block text-[10px] text-slate-500 font-normal">
                          Room: {cov.schoolClass?.roomNumber || 'Main Class'}
                        </span>
                      </td>
                      <td className="p-3 border border-slate-200 font-extrabold text-amber-800">
                        {cov.subject?.name || 'Subject'}
                      </td>
                      <td className="p-3 border border-slate-200 font-medium text-rose-800 bg-rose-50/50">
                        {cov.absentTeacher?.fullName}
                        <span className="block text-[10px] text-rose-600 font-mono">
                          ID: {cov.absentTeacher?.employeeId}
                        </span>
                      </td>
                      <td className="p-3 border border-slate-200 font-bold text-emerald-900 bg-emerald-50/50">
                        {cov.substituteTeacher?.fullName}
                        <span className="block text-[10px] text-emerald-700 font-mono">
                          ID: {cov.substituteTeacher?.employeeId}
                        </span>
                      </td>
                      <td className="p-3 border border-slate-200 text-slate-500 font-mono text-[11px]">
                        {cov.createdAt ? new Date(cov.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                      </td>
                      <td className="p-3 border border-slate-200 text-center">
                        <button
                          onClick={() => handleCancelCover(cov.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 transition-colors font-bold text-[11px] inline-flex items-center gap-1"
                          title="Revoke cover assignment"
                        >
                          <HiTrash className="w-3.5 h-3.5" /> Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
