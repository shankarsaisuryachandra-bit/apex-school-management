const http = require('http');

function post(url, data, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = JSON.stringify(data);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      }
    }, res => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch(e) { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function get(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      }
    }, res => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch(e) { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function del(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'DELETE',
      headers: {
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      }
    }, res => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch(e) { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('       TIMETABLE LOGIC & TEACHER MAPPING TEST SUITE             ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // Step 1: Admin Login
  console.log('1. Authenticating Admin, Teacher, and Student...');
  const adminLogin = await post('http://localhost:8080/api/auth/login', { username: 'admin', password: 'admin123' });
  assert(adminLogin.status === 200 && adminLogin.body.token, 'Admin logged in successfully');
  const adminToken = adminLogin.body.token;

  const teacherLogin = await post('http://localhost:8080/api/auth/login', { username: 'teacher1', password: 'teacher123' });
  assert(teacherLogin.status === 200 && teacherLogin.body.token, 'Teacher logged in successfully');
  const teacherToken = teacherLogin.body.token;

  const studentLogin = await post('http://localhost:8080/api/auth/login', { username: 'student1', password: 'student123' });
  assert(studentLogin.status === 200 && studentLogin.body.token, 'Student logged in successfully');
  const studentToken = studentLogin.body.token;

  // Step 2: Fetch Class & Teacher IDs
  console.log('\n2. Fetching Classes, Subjects, and Teachers...');
  const classesRes = await get('http://localhost:8080/api/admin/classes', adminToken);
  const teachersRes = await get('http://localhost:8080/api/admin/teachers', adminToken);
  const subjectsRes = await get('http://localhost:8080/api/admin/subjects', adminToken);

  assert(classesRes.status === 200 && classesRes.body.length > 0, `Found ${classesRes.body.length} classes`);
  assert(teachersRes.status === 200 && teachersRes.body.length > 0, `Found ${teachersRes.body.length} teachers`);
  assert(subjectsRes.status === 200 && subjectsRes.body.length > 0, `Found ${subjectsRes.body.length} subjects`);

  const class1 = classesRes.body[0]; // e.g. Grade 10 A
  const class2 = classesRes.body.length > 1 ? classesRes.body[1] : classesRes.body[0]; // e.g. Grade 9 A
  const teacher1 = teachersRes.body[0]; // e.g. Sarah Jenkins
  const subject1 = subjectsRes.body[0]; // e.g. Mathematics
  const subject2 = subjectsRes.body.length > 1 ? subjectsRes.body[1] : subjectsRes.body[0];

  console.log(`   Test entities: Class1=${class1.name} (ID:${class1.id}), Class2=${class2.name} (ID:${class2.id}), Teacher=${teacher1.fullName} (ID:${teacher1.id}), Subject=${subject1.name} (ID:${subject1.id})`);

  // Step 3: Teacher-Subject-Class Mapping Test
  console.log('\n3. Testing Teacher-Subject-Class Mapping Matrix...');
  const assignRes = await post('http://localhost:8080/api/admin/assign-teacher', {
    teacherId: teacher1.id,
    classId: class1.id,
    subjectId: subject1.id,
    academicYear: '2025-2026'
  }, adminToken);
  assert(assignRes.status === 200 || (assignRes.status === 400 && assignRes.body.message.includes('already assigned')),
    'Teacher mapped to Class & Subject successfully');

  const allAssignments = await get('http://localhost:8080/api/admin/teacher-assignments', adminToken);
  const hasAssignment = allAssignments.body.some(a => 
    a.teacher?.id === teacher1.id && a.schoolClass?.id === class1.id && a.subject?.id === subject1.id);
  assert(hasAssignment, 'Verified assignment is persisted and returned in teacher-assignments list');

  // Step 4: Timetable Configuration Test
  console.log('\n4. Testing Timetable Configuration Endpoint...');
  const configRes = await get('http://localhost:8080/api/timetable/config', adminToken);
  assert(configRes.status === 200, 'Timetable config endpoint returned 200 OK');
  assert(configRes.body.days && configRes.body.days.length >= 5, `Configured ${configRes.body.days?.length} active days`);
  assert(configRes.body.periods && configRes.body.periods.length >= 6, `Configured ${configRes.body.periods?.length} periods`);

  // Step 5: Assigning Timetable Slot for Class 1
  console.log('\n5. Assigning Timetable Slot (Class1: Monday Period 1)...');
  const slotPayload1 = {
    classId: class1.id,
    dayOfWeek: 'Monday',
    periodId: 'p1',
    periodLabel: 'Period 1',
    startTime: '09:00 AM',
    endTime: '09:45 AM',
    subjectId: subject1.id,
    subjectName: subject1.name,
    teacherId: teacher1.id,
    teacherName: teacher1.fullName,
    room: 'Room 101',
    academicYear: '2025-2026'
  };
  const saveSlotRes1 = await post('http://localhost:8080/api/timetable/slot', slotPayload1, adminToken);
  assert(saveSlotRes1.status === 200 && saveSlotRes1.body.id, 'Slot saved successfully into database');

  // Step 6: Verify Student Class Timetable Reflection (Direct DB Query)
  console.log('\n6. Testing Student Portal Timetable Sync (/api/timetable/my-class)...');
  const studentTimetableRes = await get('http://localhost:8080/api/timetable/my-class', studentToken);
  assert(studentTimetableRes.status === 200, 'Student portal /api/timetable/my-class returned 200 OK');
  const studentSlot = studentTimetableRes.body.matrix?.['Monday']?.['p1'];
  assert(studentSlot && studentSlot.subjectName === subject1.name,
    `Student timetable correctly reflects Monday Period 1: ${studentSlot?.subjectName}`);
  assert(studentSlot && (studentSlot.teacherName === teacher1.fullName || studentSlot.teacher?.id === teacher1.id),
    `Student timetable correctly reflects teacher: ${studentSlot?.teacherName || studentSlot?.teacher?.fullName}`);

  // Step 7: Verify Teacher Schedule Reflection (/api/timetable/my-schedule)
  console.log('\n7. Testing Teacher Portal Schedule Sync (/api/timetable/my-schedule)...');
  const teacherScheduleRes = await get('http://localhost:8080/api/timetable/my-schedule', teacherToken);
  assert(teacherScheduleRes.status === 200, 'Teacher portal /api/timetable/my-schedule returned 200 OK');
  const teacherAssignedSlot = teacherScheduleRes.body.assignedSlots?.find(s => s.dayOfWeek === 'Monday' && s.periodId === 'p1');
  assert(teacherAssignedSlot !== undefined, 'Teacher portal reflects Monday Period 1 in assigned schedule');
  assert(teacherAssignedSlot && teacherAssignedSlot.classId === class1.id,
    `Teacher slot assigned to Class: ${teacherAssignedSlot?.className}`);

  // Step 8: TEACHER CLASH DETECTION TEST
  console.log('\n8. Testing STRICT TEACHER CLASH DETECTION (Different Class, Same Day & Time)...');
  if (class1.id !== class2.id) {
    const clashingPayload = {
      classId: class2.id, // DIFFERENT class!
      dayOfWeek: 'Monday', // SAME day!
      periodId: 'p1',      // SAME period!
      periodLabel: 'Period 1',
      startTime: '09:00 AM',
      endTime: '09:45 AM',
      subjectId: subject2.id,
      subjectName: subject2.name,
      teacherId: teacher1.id, // SAME teacher!
      teacherName: teacher1.fullName,
      room: 'Room 202',
      academicYear: '2025-2026'
    };

    const clashRes = await post('http://localhost:8080/api/timetable/slot', clashingPayload, adminToken);
    assert(clashRes.status === 409, `Backend correctly rejected with HTTP 409 CONFLICT (status=${clashRes.status})`);
    assert(typeof clashRes.body.message === 'string' && clashRes.body.message.includes('Schedule Conflict'),
      `Conflict error message contains details: "${clashRes.body.message}"`);

    // Verify Class 2 slot was NOT overwritten or saved
    const class2Timetable = await get(`http://localhost:8080/api/timetable/class/${class2.id}`, adminToken);
    const class2Slot = class2Timetable.body.matrix?.['Monday']?.['p1'];
    assert(!class2Slot || class2Slot.teacher?.id !== teacher1.id,
      'Verified clashing teacher was NOT assigned to Class 2');
  } else {
    console.log('   (Skipped different-class clash test: only 1 class exists in database)');
  }

  // Step 9: Permitted Assignment (Different Period)
  console.log('\n9. Testing Permitted Non-Clashing Assignment (Same Teacher, Different Period)...');
  if (class1.id !== class2.id) {
    const nonClashingPayload = {
      classId: class2.id,
      dayOfWeek: 'Monday',
      periodId: 'p2', // DIFFERENT period!
      periodLabel: 'Period 2',
      startTime: '09:45 AM',
      endTime: '10:30 AM',
      subjectId: subject2.id,
      subjectName: subject2.name,
      teacherId: teacher1.id,
      teacherName: teacher1.fullName,
      room: 'Room 202',
      academicYear: '2025-2026'
    };

    const nonClashRes = await post('http://localhost:8080/api/timetable/slot', nonClashingPayload, adminToken);
    assert(nonClashRes.status === 200 && nonClashRes.body.id,
      'Teacher successfully scheduled in Class 2 for Period 2 without conflict');
  }

  // Step 10: Slot Update & Cross-Portal Sync
  console.log('\n10. Testing Slot Update & Immediate Real-Time Reflection...');
  const updatedPayload = {
    classId: class1.id,
    dayOfWeek: 'Monday',
    periodId: 'p1',
    periodLabel: 'Period 1',
    startTime: '09:00 AM',
    endTime: '09:45 AM',
    subjectId: subject2.id,
    subjectName: subject2.name,
    teacherId: teacher1.id,
    teacherName: teacher1.fullName,
    room: 'Advanced Science Lab',
    academicYear: '2025-2026'
  };
  const updateRes = await post('http://localhost:8080/api/timetable/slot', updatedPayload, adminToken);
  assert(updateRes.status === 200, 'Slot updated successfully');

  const studentCheckAfterUpdate = await get('http://localhost:8080/api/timetable/my-class', studentToken);
  const updatedStudentSlot = studentCheckAfterUpdate.body.matrix?.['Monday']?.['p1'];
  assert(updatedStudentSlot && updatedStudentSlot.room === 'Advanced Science Lab',
    `Student immediately sees updated room: "${updatedStudentSlot?.room}"`);

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
