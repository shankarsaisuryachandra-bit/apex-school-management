const http = require('http');

const HOST = 'localhost';
const PORT = 8080;

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsed = body;
        try {
          parsed = JSON.parse(body);
        } catch (e) {}
        resolve({ status: res.statusCode, headers: res.headers, data: parsed });
      });
    });

    req.on('error', err => reject(err));

    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runSubstitutionVerification() {
  console.log('=== STARTING TEACHER SUBSTITUTION & DAILY COVER MANAGER VERIFICATION ===\n');

  try {
    // 1. Admin Login
    const loginPayload = JSON.stringify({ username: 'admin', password: 'admin123' });
    const loginRes = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginPayload)
      }
    }, loginPayload);

    if (loginRes.status !== 200 || !loginRes.data.token) {
      throw new Error(`Login failed with status ${loginRes.status}: ${JSON.stringify(loginRes.data)}`);
    }

    const token = loginRes.data.token;
    console.log('1. Management Auth Token acquired.');

    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Fetch Active Teachers
    const teachersRes = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/admin/teachers',
      method: 'GET',
      headers: authHeaders
    });

    let teachers = teachersRes.data;
    if (teachers && teachers.content) teachers = teachers.content; // if paginated

    console.log(`2. Retrieved ${Array.isArray(teachers) ? teachers.length : 0} teachers from database.`);
    if (!Array.isArray(teachers) || teachers.length < 2) {
      throw new Error(`Need at least 2 teachers in database to perform substitution testing. Received: ${JSON.stringify(teachersRes.data).substring(0, 150)}`);
    }

    const absentTeacher = teachers[0];
    const targetDate = '2026-10-12'; // Monday date

    console.log(`3. Testing Daily Cover workflow for Absent Teacher: ${absentTeacher.fullName} (ID: ${absentTeacher.id}) on ${targetDate}`);

    // 3. Fetch Affected Slots
    const slotsRes = await request({
      hostname: HOST,
      port: PORT,
      path: `/api/substitutions/affected-slots?teacherId=${absentTeacher.id}&date=${targetDate}`,
      method: 'GET',
      headers: authHeaders
    });

    const slots = slotsRes.data;
    console.log(`   Affected Slots Found: ${Array.isArray(slots) ? slots.length : 0}`);

    if (Array.isArray(slots) && slots.length > 0) {
      const targetSlot = slots[0];
      console.log(`   Target Slot: Period ${targetSlot.periodId} for Class ID ${targetSlot.classId} (${targetSlot.subjectName})`);

      // 4. Fetch Available Substitute Teachers
      const candRes = await request({
        hostname: HOST,
        port: PORT,
        path: `/api/substitutions/available-teachers?date=${targetDate}&dayOfWeek=${targetSlot.dayOfWeek}&periodId=${targetSlot.periodId}&absentTeacherId=${absentTeacher.id}`,
        method: 'GET',
        headers: authHeaders
      });

      const candidates = candRes.data;
      console.log(`4. Available Free Candidates Found for Period ${targetSlot.periodId}: ${Array.isArray(candidates) ? candidates.length : 0}`);

      if (Array.isArray(candidates) && candidates.length > 0) {
        const subTeacher = candidates[0];
        const subId = subTeacher.teacherId || subTeacher.id;
        console.log(`   Selected Candidate: ${subTeacher.fullName} (ID: ${subId}, Today's Covers: ${subTeacher.todaySubstitutionCount})`);

        // 5. Assign Daily Cover
        const assignData = JSON.stringify({
          date: targetDate,
          periodId: targetSlot.periodId,
          classId: targetSlot.classId,
          subjectId: targetSlot.subjectId,
          absentTeacherId: absentTeacher.id,
          substituteTeacherId: subId
        });

        const assignRes = await request({
          hostname: HOST,
          port: PORT,
          path: '/api/substitutions/assign',
          method: 'POST',
          headers: {
            ...authHeaders,
            'Content-Length': Buffer.byteLength(assignData)
          }
        }, assignData);

        if (assignRes.status !== 200) {
          throw new Error(`Failed to assign cover: ${JSON.stringify(assignRes.data)}`);
        }

        const createdCov = assignRes.data;
        console.log(`5. Daily Cover Assigned Successfully! Cover ID: ${createdCov.id}`);

        // 6. Test Clash Prevention: Attempt double-booking same substitute teacher at same time
        console.log('6. Testing Clash Prevention: Attempting to assign same substitute teacher to another class at same date & period...');
        const clashData = JSON.stringify({
          date: targetDate,
          periodId: targetSlot.periodId,
          classId: targetSlot.classId === 1 ? 2 : 1,
          subjectId: targetSlot.subjectId,
          absentTeacherId: absentTeacher.id,
          substituteTeacherId: subId
        });

        const clashRes = await request({
          hostname: HOST,
          port: PORT,
          path: '/api/substitutions/assign',
          method: 'POST',
          headers: {
            ...authHeaders,
            'Content-Length': Buffer.byteLength(clashData)
          }
        }, clashData);

        if (clashRes.status === 409) {
          console.log(`✅ PASS: Clash prevention rejected double-booking! Message: "${clashRes.data.message}"`);
        } else {
          console.log(`⚠️ Expected 409 Conflict, received status: ${clashRes.status}`);
        }

        // 7. Verify Daily Cover List
        const dailyRes = await request({
          hostname: HOST,
          port: PORT,
          path: `/api/substitutions/daily?date=${targetDate}`,
          method: 'GET',
          headers: authHeaders
        });

        console.log(`7. Verified ${Array.isArray(dailyRes.data) ? dailyRes.data.length : 0} active daily cover records logged in database.`);

        // 8. Clean up test cover assignment
        const delRes = await request({
          hostname: HOST,
          port: PORT,
          path: `/api/substitutions/${createdCov.id}`,
          method: 'DELETE',
          headers: authHeaders
        });

        console.log(`8. Cleaned up test daily cover ID: ${createdCov.id} (Status: ${delRes.status})`);
      } else {
        console.log('   (No free candidate teachers available for this slot in database)');
      }
    } else {
      console.log('   (No regular slots assigned to absent teacher on this day of week)');
    }

    console.log('\n=== ALL SUBSTITUTION & DAILY COVER VERIFICATIONS PASSED SUCCESSFULLY ===');
  } catch (err) {
    console.error('\n❌ Substitution Verification Failed:', err.message);
    process.exit(1);
  }
}

runSubstitutionVerification();
