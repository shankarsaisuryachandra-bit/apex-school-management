// Central Timetable Data Store (Syncs across Management, Teacher, and Student views)

const STORAGE_KEY = 'sms_master_timetable_v2'

export const DEFAULT_TIMETABLE_CONFIG = {
  days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  periods: [
    { id: 'p1', label: 'Period 1', time: '08:30 AM - 09:15 AM' },
    { id: 'p2', label: 'Period 2', time: '09:15 AM - 10:00 AM' },
    { id: 'p3', label: 'Period 3', time: '10:15 AM - 11:00 AM' },
    { id: 'p4', label: 'Period 4', time: '11:00 AM - 11:45 AM' },
    { id: 'p5', label: 'Period 5', time: '12:30 PM - 01:15 PM' },
    { id: 'p6', label: 'Period 6', time: '01:15 PM - 02:00 PM' },
    { id: 'p7', label: 'Period 7', time: '02:00 PM - 02:45 PM' },
  ],
  // schedule[classId][day][periodId] = { subject, teacherName, teacherId, room, className }
  schedule: {}
}

export function getTimetableConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch (err) {
    console.error('Error loading timetable store:', err)
  }
  return DEFAULT_TIMETABLE_CONFIG
}

export function saveTimetableConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    // Trigger custom event for instant cross-component re-rendering
    window.dispatchEvent(new Event('timetable_updated'))
  } catch (err) {
    console.error('Error saving timetable store:', err)
  }
}

// Get timetable filtered specifically for a single class (Student View)
export function getClassTimetable(classId) {
  const config = getTimetableConfig()
  
  // Lookup class schedule across string and numeric keys, or fallback to first available schedule
  let classSchedule = config.schedule[classId] || config.schedule[String(classId)] || {}
  
  if (Object.keys(classSchedule).length === 0) {
    const firstKey = Object.keys(config.schedule)[0]
    if (firstKey) {
      classSchedule = config.schedule[firstKey]
    }
  }

  return {
    days: config.days,
    periods: config.periods,
    matrix: classSchedule
  }
}

// Helper for fuzzy string matching (handles usernames, full names, partial titles)
function isNameMatch(str1, str2) {
  if (!str1 || !str2) return false
  const s1 = String(str1).toLowerCase().trim()
  const s2 = String(str2).toLowerCase().trim()
  return s1.includes(s2) || s2.includes(s1)
}

// Get timetable filtered specifically for a single teacher (Teacher View)
export function getTeacherTimetable(userObj, teacherAssignments = []) {
  const config = getTimetableConfig()
  const teacherSchedule = []

  const teacherName = userObj?.fullName || ''
  const username = userObj?.username || ''
  const teacherId = userObj?.profileId || userObj?.userId

  // Collect subjects and classes assigned to this teacher from backend assignments
  const assignedSubjects = teacherAssignments.map(a => a.subjectName || a.subject?.name).filter(Boolean)

  config.days.forEach((day, dIdx) => {
    config.periods.forEach((period, pIdx) => {
      let foundSlot = null

      // 1. SCAN ALL CLASS SCHEDULES FOR PERIOD SLOTS ASSIGNED BY MANAGEMENT TO THIS TEACHER
      Object.entries(config.schedule).forEach(([classId, classDays]) => {
        const slot = classDays?.[day]?.[period.id]
        if (slot) {
          const matchBySlotName = isNameMatch(slot.teacherName, teacherName) || isNameMatch(slot.teacherName, username)
          const matchBySlotId = teacherId && slot.teacherId && String(slot.teacherId) === String(teacherId)
          
          if (matchBySlotName || matchBySlotId) {
            foundSlot = {
              day,
              periodId: period.id,
              periodLabel: period.label,
              periodTime: period.time,
              classId,
              className: slot.className || `Class ${classId}`,
              subject: slot.subject,
              room: slot.room || 'Room 101'
            }
          }
        }
      })

      // 2. IF MANAGEMENT HAS NOT EXPLICITLY EDITED THIS CELL YET, MAP FROM TEACHER'S DOMAIN ASSIGNMENTS
      if (!foundSlot) {
        if (assignedSubjects.length > 0) {
          const sub = assignedSubjects[(dIdx + pIdx) % assignedSubjects.length]
          const cls = 'Grade 10 - Section A'
          if ((pIdx % 2 === 0 || dIdx % 2 === 0) && (pIdx !== 3)) {
            foundSlot = {
              day,
              periodId: period.id,
              periodLabel: period.label,
              periodTime: period.time,
              classId: '1',
              className: cls,
              subject: sub,
              room: `Room ${101 + (pIdx % 4)}`
            }
          }
        } else {
          // Default fallback for initial load if no data has been saved yet
          const defaultFacultySubjects = ['Mathematics', 'Physics', 'Science & Lab', 'Computer Science']
          const isAssignedPeriod = (dIdx + pIdx) % 2 === 0
          if (isAssignedPeriod) {
            foundSlot = {
              day,
              periodId: period.id,
              periodLabel: period.label,
              periodTime: period.time,
              classId: '1',
              className: 'Grade 10 - Section A',
              subject: defaultFacultySubjects[(dIdx + pIdx) % defaultFacultySubjects.length],
              room: `Room ${101 + (pIdx % 3)}`
            }
          }
        }
      }

      if (foundSlot) {
        teacherSchedule.push(foundSlot)
      }
    })
  })

  return {
    days: config.days,
    periods: config.periods,
    assignedSlots: teacherSchedule
  }
}
