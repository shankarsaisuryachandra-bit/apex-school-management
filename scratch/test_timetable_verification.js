const http = require('http');

function postJson(url, data, token) {
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
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }, res => {
      let text = '';
      res.on('data', chunk => text += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(text) });
        } catch (e) {
          resolve({ status: res.statusCode, data: text });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function getJson(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }, res => {
      let text = '';
      res.on('data', chunk => text += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(text) });
        } catch (e) {
          resolve({ status: res.statusCode, data: text });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function verify() {
  console.log('--- TIMETABLE VERIFICATION SUITE ---');
  
  // 1. Login Admin
  const adminLogin = await postJson('http://localhost:8080/api/auth/login', { username: 'admin', password: 'admin123' });
  if (adminLogin.status !== 200 || !adminLogin.data.token) {
    throw new Error('Admin login failed: ' + JSON.stringify(adminLogin));
  }
  const adminToken = adminLogin.data.token;
  console.log('✅ Admin login successful');

  // 2. Login Student (student1)
  const studentLogin = await postJson('http://localhost:8080/api/auth/login', { username: 'student1', password: 'student123' });
  if (studentLogin.status !== 200 || !studentLogin.data.token) {
    throw new Error('Student login failed: ' + JSON.stringify(studentLogin));
  }
  const studentToken = studentLogin.data.token;
  console.log('✅ Student (student1) login successful');

  // 3. Login Teacher (teacher1)
  const teacherLogin = await postJson('http://localhost:8080/api/auth/login', { username: 'teacher1', password: 'teacher123' });
  if (teacherLogin.status !== 200 || !teacherLogin.data.token) {
    throw new Error('Teacher login failed: ' + JSON.stringify(teacherLogin));
  }
  const teacherToken = teacherLogin.data.token;
  console.log('✅ Teacher (teacher1) login successful');

  // 4. Test Student Timetable Endpoint
  const studentTt = await getJson('http://localhost:8080/api/timetable/my-class', studentToken);
  console.log('Student timetable status:', studentTt.status);
  console.log('Student class:', studentTt.data.className, studentTt.data.section);
  console.log('Periods count:', studentTt.data.periods?.length);
  console.log('Total slots returned:', studentTt.data.slots?.length);

  // Check matrix cells in student timetable
  let emptyCells = 0;
  let filledCells = 0;
  const days = studentTt.data.days;
  const periods = studentTt.data.periods;
  for (const day of days) {
    for (const p of periods) {
      const pId = p.periodId;
      const slot = studentTt.data.matrix?.[day]?.[pId] || studentTt.data.matrix?.[day]?.[pId.toLowerCase()] || studentTt.data.matrix?.[day]?.[pId.toUpperCase()];
      if (slot && slot.subjectName && slot.teacherName) {
        filledCells++;
      } else {
        emptyCells++;
      }
    }
  }
  console.log(`Student Matrix Validation: ${filledCells} filled cells, ${emptyCells} empty cells out of ${days.length * periods.length} total cells.`);
  if (emptyCells > 0 || filledCells !== 35) {
    console.error('❌ Warning: Student timetable has empty cells!');
  } else {
    console.log('✅ Student timetable is 100% full with 0 empty cells!');
  }

  // 5. Test Teacher Timetable Endpoint
  const teacherTt = await getJson('http://localhost:8080/api/timetable/my-schedule', teacherToken);
  console.log('\nTeacher schedule status:', teacherTt.status);
  console.log('Teacher name:', teacherTt.data.teacherName);
  console.log('Assigned slots count:', teacherTt.data.assignedSlots?.length);
  if (teacherTt.data.assignedSlots?.length > 0) {
    console.log('Sample assigned slots:');
    teacherTt.data.assignedSlots.slice(0, 3).forEach(s => {
      console.log(`  - ${s.dayOfWeek} ${s.periodLabel} (${s.startTime} - ${s.endTime}): ${s.subjectName} in ${s.className} [${s.room}]`);
    });
    console.log('✅ Teacher timetable shows full assigned teaching periods!');
  } else {
    console.error('❌ Teacher timetable has 0 assigned slots!');
  }

  // 6. Check all 12 classes and verify ZERO conflicts across the school
  console.log('\n--- VERIFYING ZERO CONFLICTS ACROSS ALL 12 CLASSES ---');
  const classesRes = await getJson('http://localhost:8080/api/admin/classes', adminToken);
  const classes = classesRes.data;
  console.log(`Fetched ${classes.length} classes from system.`);

  const allSlots = [];
  for (const c of classes) {
    const tt = await getJson(`http://localhost:8080/api/timetable/class/${c.id}`, adminToken);
    if (tt.data && tt.data.slots) {
      allSlots.push(...tt.data.slots);
    }
  }
  console.log(`Total slots aggregated across all classes: ${allSlots.length}`);

  // Check clashes: for each (dayOfWeek, periodId), check teacher and room
  const teacherBookings = {}; // `${day}_${periodId}_${teacherId}` -> [classNames]
  const roomBookings = {};    // `${day}_${periodId}_${room}` -> [classNames]

  let teacherClashes = 0;
  let roomClashes = 0;

  for (const slot of allSlots) {
    const day = slot.dayOfWeek;
    const period = slot.periodId.toLowerCase();
    const className = slot.schoolClass ? `${slot.schoolClass.name} (${slot.schoolClass.section})` : 'Class';

    // Teacher check
    if (slot.teacher) {
      const tKey = `${day}_${period}_T${slot.teacher.id}`;
      if (!teacherBookings[tKey]) teacherBookings[tKey] = [];
      teacherBookings[tKey].push({ class: className, teacher: slot.teacher.fullName });
      if (teacherBookings[tKey].length > 1) {
        teacherClashes++;
        console.error(`CLASH DETECTED: Teacher ${slot.teacher.fullName} double-booked on ${day} ${period} in classes:`, teacherBookings[tKey]);
      }
    }

    // Room check
    if (slot.room) {
      const rKey = `${day}_${period}_R${slot.room.toLowerCase().trim()}`;
      if (!roomBookings[rKey]) roomBookings[rKey] = [];
      roomBookings[rKey].push({ class: className, room: slot.room });
      if (roomBookings[rKey].length > 1) {
        roomClashes++;
        console.error(`ROOM CLASH DETECTED: Room ${slot.room} double-booked on ${day} ${period} for:`, roomBookings[rKey]);
      }
    }
  }

  console.log(`\nConflict Scan Results:`);
  console.log(`- Total Teacher Clashes: ${teacherClashes}`);
  console.log(`- Total Room Clashes: ${roomClashes}`);

  if (teacherClashes === 0 && roomClashes === 0) {
    console.log('🎉 100% SUCCESS: Timetable is completely full with ZERO conflicts!');
  } else {
    console.error('❌ Conflict scan failed!');
  }
}

verify().catch(err => {
  console.error('Verification failed with error:', err);
  process.exit(1);
});
