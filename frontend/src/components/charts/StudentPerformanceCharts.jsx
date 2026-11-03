import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts'

const TIER_COLORS = {
  'A+': '#10b981', // emerald
  'A': '#3b82f6',  // blue
  'B': '#6366f1',  // indigo
  'C': '#f59e0b',  // amber
  'D': '#f97316',  // orange
  'F': '#ef4444'   // red
}

const PALETTE = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6']

/**
 * Custom Tooltip for Timeline Area Chart
 */
function TimelineTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-slate-900 text-white rounded-2xl shadow-xl p-3 border border-slate-700 text-xs min-w-[200px]">
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 mb-1.5">
          <span className="font-bold text-slate-200 truncate">{data.assessmentName}</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
            data.assessmentType === 'ASSIGNMENT' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'
          }`}>
            {data.assessmentType === 'ASSIGNMENT' ? 'Assignment' : 'Exam'}
          </span>
        </div>
        <div className="space-y-1 text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-400">Subject:</span>
            <span className="font-semibold text-slate-200">{data.subjectName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Marks:</span>
            <span className="font-semibold text-white">{data.marksObtained} / {data.maxMarks}</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-slate-800">
            <span className="text-slate-400">Percentage:</span>
            <span className="font-extrabold text-sm text-emerald-400">{data.percentage}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Grade & GPA:</span>
            <span className="font-bold text-amber-300">{data.letterGrade} ({data.gpa?.toFixed(1)} GPA)</span>
          </div>
          {data.remarks && (
            <div className="pt-1 text-[11px] text-slate-400 italic">
              "{data.remarks}"
            </div>
          )}
        </div>
      </div>
    )
  }
  return null
}

/**
 * Chronological Performance Trend (Area Chart)
 */
export function PerformanceTrendAreaChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-surface-400">
        <p className="text-sm font-medium">No performance records recorded yet</p>
      </div>
    )
  }

  // Reverse so earliest assessment is on left, latest on right
  const chronologicalData = [...data].reverse().map((item, idx) => ({
    ...item,
    chartIndex: idx + 1,
    displayName: item.assessmentName?.length > 18 ? item.assessmentName.substring(0, 16) + '...' : item.assessmentName
  }))

  return (
    <div className="w-full">
      <div className="h-72 sm:h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chronologicalData} margin={{ top: 20, right: 25, left: -10, bottom: 25 }}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="displayName"
              tick={{ fontSize: 11, fill: '#64748b' }}
              angle={-20}
              textAnchor="end"
              height={50}
              stroke="#cbd5e1"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#64748b' }}
              stroke="#cbd5e1"
              ticks={[0, 25, 50, 75, 90, 100]}
            />
            <Tooltip content={<TimelineTooltip />} />
            <ReferenceLine y={90} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Distinction (90%)', fill: '#10b981', fontSize: 10, position: 'right' }} />
            <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Pass (50%)', fill: '#f59e0b', fontSize: 10, position: 'right' }} />
            <Area
              type="monotone"
              dataKey="percentage"
              name="Percentage"
              stroke="#4f46e5"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#scoreGradient)"
              dot={{ r: 5, fill: '#4f46e5', strokeWidth: 2, stroke: '#ffffff' }}
              activeDot={{ r: 8, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-6 mt-2 text-xs text-slate-500 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block" />
          <span>Evaluation Score (%)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 border-t border-dashed border-emerald-500 inline-block" />
          <span>90% Distinction Benchmark</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 border-t border-dashed border-amber-500 inline-block" />
          <span>50% Minimum Passing Criteria</span>
        </span>
      </div>
    </div>
  )
}

/**
 * Subject-wise Performance Breakdown (Bar Chart)
 */
export function SubjectBreakdownBarChart({ grades }) {
  if (!grades || grades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-surface-400">
        <p className="text-sm font-medium">No subject data available</p>
      </div>
    )
  }

  // Group and average percentage per subject
  const subjectMap = {}
  grades.forEach(g => {
    const sName = g.subjectName || 'General'
    if (!subjectMap[sName]) {
      subjectMap[sName] = { totalPct: 0, count: 0, highest: 0 }
    }
    const pct = g.percentage || 0
    subjectMap[sName].totalPct += pct
    subjectMap[sName].count += 1
    if (pct > subjectMap[sName].highest) subjectMap[sName].highest = pct
  })

  const data = Object.keys(subjectMap).map((subject, idx) => {
    const avg = Math.round((subjectMap[subject].totalPct / subjectMap[subject].count) * 10) / 10
    return {
      subject,
      average: avg,
      highest: subjectMap[subject].highest,
      count: subjectMap[subject].count,
      color: PALETTE[idx % PALETTE.length]
    }
  })

  return (
    <div className="w-full">
      <div className="h-72 sm:h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 25, left: -10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
            <Tooltip
              formatter={(value, name) => [`${value}%`, name === 'average' ? 'Subject Average' : 'Highest Score']}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', color: '#fff', fontSize: '12px' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="average" name="Subject Average (%)" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/**
 * Teacher Portal: Grade Distribution & Student Ranking Charts
 */
export function ClassGradeDistributionChart({ students, maxMarks = 100 }) {
  if (!students || students.length === 0) {
    return <div className="text-center py-10 text-slate-400 text-sm">No student evaluations loaded</div>
  }

  // Calculate grade tiers
  const tiers = {
    'A+ (90-100%)': { count: 0, color: TIER_COLORS['A+'] },
    'A (80-89%)': { count: 0, color: TIER_COLORS['A'] },
    'B (70-79%)': { count: 0, color: TIER_COLORS['B'] },
    'C (60-69%)': { count: 0, color: TIER_COLORS['C'] },
    'D (50-59%)': { count: 0, color: TIER_COLORS['D'] },
    'F (<50%)': { count: 0, color: TIER_COLORS['F'] }
  }

  let gradedCount = 0
  let totalScorePct = 0

  students.forEach(st => {
    if (st.marksObtained !== null && st.marksObtained !== undefined && st.marksObtained !== '') {
      const marks = parseFloat(st.marksObtained)
      const max = parseFloat(maxMarks) || 100
      if (isNaN(marks) || marks < 0 || marks > max) return // Reject out-of-range marks
      const pct = (marks / max) * 100
      gradedCount++
      totalScorePct += pct

      if (pct >= 90) tiers['A+ (90-100%)'].count++
      else if (pct >= 80) tiers['A (80-89%)'].count++
      else if (pct >= 70) tiers['B (70-79%)'].count++
      else if (pct >= 60) tiers['C (60-69%)'].count++
      else if (pct >= 50) tiers['D (50-59%)'].count++
      else tiers['F (<50%)'].count++
    }
  })

  const tierData = Object.entries(tiers).map(([tier, val]) => ({
    tier,
    count: val.count,
    color: val.color
  }))

  const classAvg = gradedCount > 0 ? (totalScorePct / gradedCount).toFixed(1) : '—'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs px-1">
        <span className="font-semibold text-slate-500">Evaluated: <strong className="text-slate-800">{gradedCount}</strong> / {students.length} Students</span>
        <span className="font-semibold text-slate-500">Class Average: <strong className="text-indigo-600 font-bold">{classAvg}%</strong></span>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={tierData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="tier" tick={{ fontSize: 10, fill: '#64748b' }} angle={-15} textAnchor="end" height={45} stroke="#cbd5e1" />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
            <Tooltip
              formatter={(value) => [`${value} Student(s)`, 'Count']}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '11px' }}
            />
            <Bar dataKey="count" name="Students" radius={[6, 6, 0, 0]}>
              {tierData.map((entry, index) => (
                <Cell key={`tier-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/**
 * Teacher Portal: Individual Student Marks Ranking Chart
 */
export function StudentMarksRankingChart({ students, maxMarks = 100 }) {
  const max = parseFloat(maxMarks) || 100
  const gradedStudents = (students || [])
    .filter(st => st.marksObtained !== null && st.marksObtained !== undefined && st.marksObtained !== '')
    .filter(st => {
      const marks = parseFloat(st.marksObtained)
      return !isNaN(marks) && marks >= 0 && marks <= max // Reject out-of-range marks
    })
    .map(st => {
      const marks = parseFloat(st.marksObtained)
      const pct = Math.round((marks / max) * 1000) / 10
      return {
        name: st.fullName || st.studentName || 'Student',
        admissionNo: st.admissionNumber,
        percentage: pct,
        marks: marks,
        maxMarks: max
      }
    })
    .sort((a, b) => b.percentage - a.percentage)

  if (gradedStudents.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-surface-400 text-xs">
        No student marks entered yet to plot comparative rankings.
      </div>
    )
  }

  const avgPct = gradedStudents.reduce((sum, s) => sum + s.percentage, 0) / gradedStudents.length

  return (
    <div className="w-full">
      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={gradedStudents} margin={{ top: 15, right: 20, left: -10, bottom: 35 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: '#64748b' }}
              angle={-25}
              textAnchor="end"
              height={50}
              stroke="#cbd5e1"
            />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
            <Tooltip
              formatter={(val, name, entry) => [`${val}% (${entry.payload.marks} / ${entry.payload.maxMarks})`, 'Score']}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '11px' }}
            />
            <ReferenceLine y={Math.round(avgPct)} stroke="#ef4444" strokeDasharray="3 3" label={{ value: `Class Avg: ${Math.round(avgPct)}%`, fill: '#ef4444', fontSize: 10, position: 'top' }} />
            <Bar dataKey="percentage" name="Student Score (%)" radius={[6, 6, 0, 0]}>
              {gradedStudents.map((entry, index) => {
                const color = entry.percentage >= 90 ? '#10b981' : entry.percentage >= 80 ? '#3b82f6' : entry.percentage >= 70 ? '#6366f1' : entry.percentage >= 50 ? '#f59e0b' : '#ef4444'
                return <Cell key={`student-bar-${index}`} fill={color} />
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
