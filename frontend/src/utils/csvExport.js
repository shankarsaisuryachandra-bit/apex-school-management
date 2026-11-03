/**
 * Export data as CSV file download.
 *
 * @param {Array<string[]>} data - Array of rows (first row = headers)
 * @param {string} filename - Output filename
 */
export function downloadCsv(data, filename = 'export.csv') {
  const csvContent = data
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
