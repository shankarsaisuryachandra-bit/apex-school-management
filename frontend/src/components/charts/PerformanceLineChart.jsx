import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

/**
 * PerformanceLineChart — Plots student scores chronologically across dynamic assessments.
 * Supports multiple subjects with different colored lines.
 */
export default function PerformanceLineChart({ data, subjects }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-surface-700/50">
        No grade data available
      </div>
    )
  }

  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-xl shadow-lg border border-surface-200 p-4">
          <p className="font-semibold text-surface-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm py-0.5">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}
              </span>
              <span className="font-medium">{entry.value}%</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  // If subjects provided, render multi-line chart
  const subjectList = subjects || ['Score']

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="assessmentName"
          tick={{ fontSize: 12, fill: '#64748b' }}
          angle={-20}
          textAnchor="end"
          height={60}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#64748b' }}
          domain={[0, 100]}
          label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" />
        {subjectList.map((subject, index) => (
          <Line
            key={subject}
            type="monotone"
            dataKey={subject === 'Score' ? 'percentage' : subject}
            name={subject}
            stroke={colors[index % colors.length]}
            strokeWidth={2.5}
            dot={{ r: 4, fill: colors[index % colors.length], strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
