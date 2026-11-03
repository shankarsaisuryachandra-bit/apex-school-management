import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'

/**
 * FeeBarChart — Renders the fee dashboard bar graph.
 *
 * ANTI-BUG DESIGN: This chart renders directly from the independently-computed
 * paidCount, partialCount, and unpaidCount values returned by the API.
 * It NEVER derives any bar segment from subtracting other values.
 * Each bar segment maps 1:1 to an independent COUNT query result from the database.
 */
export default function FeeBarChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-surface-700/50">
        No fee data available
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum, entry) => sum + entry.value, 0)
      return (
        <div className="bg-white rounded-xl shadow-lg border border-surface-200 p-4 min-w-48">
          <p className="font-semibold text-surface-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm py-0.5">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}
              </span>
              <span className="font-medium">{entry.value}</span>
            </div>
          ))}
          <div className="border-t border-surface-200 mt-2 pt-2 flex justify-between text-sm font-semibold">
            <span>Total</span>
            <span>{total}</span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        barCategoryGap="20%"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="className"
          tick={{ fontSize: 12, fill: '#64748b' }}
          angle={-30}
          textAnchor="end"
          height={60}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#64748b' }}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: '10px' }}
          iconType="circle"
        />
        {/* Each bar renders directly from independent DB counts — NEVER derived */}
        <Bar dataKey="paidCount" name="Paid" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
        <Bar dataKey="partialCount" name="Partial" stackId="a" fill="#f59e0b" />
        <Bar dataKey="unpaidCount" name="Unpaid" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
