/**
 * Generate a wa.me WhatsApp link with pre-filled message.
 * Zero-cost solution — opens WhatsApp Web/Desktop with the message.
 *
 * @param {string} phone - Parent's phone number
 * @param {string} studentName - Student's name
 * @param {number} prevDue - Previous year pending amount
 * @param {number} currentDue - Current year due amount
 * @returns {string} wa.me URL
 */
export function generateFeeReminderLink(phone, studentName, prevDue, currentDue) {
  const totalPending = prevDue + currentDue
  const message =
    `Dear Parent,\n\n` +
    `Fee reminder for ${studentName}:\n` +
    `Previous Year Dues: ₹${prevDue.toFixed(2)}\n` +
    `Current Year Fee: ₹${currentDue.toFixed(2)}\n` +
    `Total Pending: ₹${totalPending.toFixed(2)}\n\n` +
    `Please clear the dues at the earliest. Thank you.`

  const cleanPhone = phone.replace(/[^0-9]/g, '')
  const fullPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone
  const encoded = encodeURIComponent(message)

  return `https://wa.me/${fullPhone}?text=${encoded}`
}

/**
 * Generate a WhatsApp absence alert link.
 */
export function generateAbsenceAlertLink(phone, studentName, date) {
  const message =
    `Dear Parent,\n\n` +
    `This is to inform you that ${studentName} was marked ABSENT on ${date}.\n\n` +
    `If this is unexpected, please contact the school office.\n\n` +
    `Regards,\nSchool Management`

  const cleanPhone = phone.replace(/[^0-9]/g, '')
  const fullPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone
  const encoded = encodeURIComponent(message)

  return `https://wa.me/${fullPhone}?text=${encoded}`
}
