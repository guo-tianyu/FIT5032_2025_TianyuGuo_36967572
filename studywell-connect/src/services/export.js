function safeCsvValue(value) {
  let text = String(value ?? '').replace(/\r?\n/g, ' ')
  if (/^[=+\-@]/.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}

export function createCsvContent(columns, rows) {
  const header = columns.map((column) => safeCsvValue(column.label)).join(',')
  const body = rows.map((row) => columns
    .map((column) => safeCsvValue(typeof column.value === 'function' ? column.value(row) : row[column.key]))
    .join(','))

  return `\uFEFF${[header, ...body].join('\r\n')}`
}

export function downloadCsv(filename, columns, rows) {
  const blob = new Blob([createCsvContent(columns, rows)], { type: 'text/csv;charset=utf-8' })
  const downloadUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = downloadUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(downloadUrl)
}
