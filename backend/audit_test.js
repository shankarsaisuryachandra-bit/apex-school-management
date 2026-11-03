const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: body ? JSON.parse(body) : null });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

async function login(username, password) {
  const res = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username, password });
  if (res.status === 200 && res.data?.token) {
    return res.data.token;
  }
  throw new Error(`Login failed for ${username}: ${res.status} ${JSON.stringify(res.data)}`);
}

async function runAudit() {
  console.log('====================================================');
  console.log('SCHOOL MANAGEMENT SYSTEM - COMPREHENSIVE SECURITY AUDIT');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  // --- TEST 1: Public Endpoints & Unauthenticated Protection ---
  console.log('\n--- 1. Testing Public Endpoints & Unauthorized Blocks ---');
  
  // 1.1 Unauthenticated GET CMS Hero
  const publicHero = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/cms/hero',
    method: 'GET'
  });
  assert(publicHero.status === 200, 'Public visitors can view CMS Hero section');

  // 1.2 Unauthenticated PUT CMS Hero (Must be blocked)
  const unauthHeroPut = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/cms/hero',
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' }
  }, { headline: 'Hacked Title' });
  assert(unauthHeroPut.status === 401 || unauthHeroPut.status === 403, 'Unauthenticated PUT to CMS Hero is blocked (401/403)', `Got ${unauthHeroPut.status}`);

  // 1.3 Unauthenticated GET Admissions Applications (Must be blocked)
  const unauthApps = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/admissions/applications',
    method: 'GET'
  });
  assert(unauthApps.status === 401 || unauthApps.status === 403, 'Unauthenticated GET /api/admissions/applications is blocked (PII protected)', `Got ${unauthApps.status}`);

  // 1.4 Public POST Admission Application (Allowed)
  const publicApply = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/admissions/apply',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    studentName: 'Prospective Student Test',
    applyingForGrade: 'Grade 9',
    parentName: 'Test Parent',
    phone: '9988776655',
    email: 'testparent@example.com'
  });
  assert(publicApply.status === 200, 'Public parents can submit admission applications (/api/admissions/apply)');

  // --- TEST 2: Logins & RBAC Enforcement ---
  console.log('\n--- 2. Testing Authentication & RBAC Boundaries ---');
  const adminToken = await login('admin', 'admin123');
  assert(!!adminToken, 'Admin login successful');

  const teacherToken = await login('teacher1', 'teacher123');
  assert(!!teacherToken, 'Teacher (Sarah Jenkins) login successful');

  const studentToken = await login('student1', 'student123');
  assert(!!studentToken, 'Student (student1) login successful');

  // 2.1 Student forbidden from Admin API
  const studentAdminAttempt = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/admin/students',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  assert(studentAdminAttempt.status === 403, 'Student blocked from /api/admin/students (403 Forbidden)', `Got ${studentAdminAttempt.status}`);

  // 2.2 Student forbidden from Admin Admissions Applications
  const studentAppsAttempt = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/admissions/applications',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  assert(studentAppsAttempt.status === 403, 'Student blocked from /api/admissions/applications (403 Forbidden)', `Got ${studentAppsAttempt.status}`);

  // 2.3 Student forbidden from creating assignments
  const studentCreateAsgAttempt = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/assignments',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${studentToken}`,
      'Content-Type': 'application/json'
    }
  }, { title: 'Fake Assignment', classId: 1, dueDate: '2026-10-30' });
  assert(studentCreateAsgAttempt.status === 403, 'Student blocked from POST /api/assignments (403 Forbidden)', `Got ${studentCreateAsgAttempt.status}`);

  // 2.4 Admin can view admissions applications
  const adminApps = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/admissions/applications',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert(adminApps.status === 200 && Array.isArray(adminApps.data), 'Admin can view admissions applications');

  // --- TEST 3: Teacher Strict Domain & Subject Isolation ---
  console.log('\n--- 3. Testing Strict Teacher Assignment & Subject Isolation ---');
  
  // 3.1 Teacher assigned classes / subjects
  const myClasses = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/academics/my-classes',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${teacherToken}` }
  });
  assert(myClasses.status === 200, 'Teacher can retrieve assigned classes');
  const assignedSubjects = (myClasses.data || []).map(a => a.subject?.name).filter(Boolean);
  console.log(`    Teacher Sarah Jenkins assigned subjects: ${JSON.stringify(assignedSubjects)}`);
  assert((assignedSubjects.includes('Maths') || assignedSubjects.includes('Mathematics')) && !assignedSubjects.includes('Artificial Intelligence & Machine Learning') && !assignedSubjects.includes('AI') && !assignedSubjects.includes('Physics'),
    'Teacher assignments strictly limited to assigned domain (Maths only, not AI/Physics)');

  // 3.2 Teacher forbidden from creating assignment in unassigned subject (Subject ID 5 = AI)
  const teacherPostUnassigned = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/assignments',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${teacherToken}`,
      'Content-Type': 'application/json'
    }
  }, {
    title: 'Unauthorized AI Assignment',
    classId: 1,
    subjectId: 5, // AI - Sarah Jenkins teaches Maths (1)
    dueDate: '2026-10-25',
    maxMarks: 50
  });
  assert(teacherPostUnassigned.status === 403, 'Teacher blocked from creating assignment for unassigned subject (403 Forbidden)', `Got ${teacherPostUnassigned.status}`);

  // 3.3 Teacher forbidden from marking attendance for unassigned subject
  const teacherMarkUnassignedAtt = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/attendance/mark',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${teacherToken}`,
      'Content-Type': 'application/json'
    }
  }, {
    classId: 1,
    subjectId: 5, // AI
    date: '2026-10-08',
    entries: [{ studentId: 1, status: 'PRESENT' }]
  });
  assert(teacherMarkUnassignedAtt.status === 403, 'Teacher blocked from marking attendance for unassigned subject (403 Forbidden)', `Got ${teacherMarkUnassignedAtt.status}`);

  // --- TEST 4: Student Privacy & Security ---
  console.log('\n--- 4. Testing Student Privacy & Authorization Checks ---');

  // 4.1 Student gets their own fees
  const myFees = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/fees/my-fees',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  assert(myFees.status === 200 && myFees.data?.studentName, 'Student can view their own fee breakdown');

  // 4.2 Student gets their own dashboard alerts
  const studentAlerts = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/dashboard/alerts',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  assert(studentAlerts.status === 200 && Array.isArray(studentAlerts.data), 'Student can retrieve personalized dashboard alerts');

  // 4.3 Student can access e-library
  const studentELibrary = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/library/e-books',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  assert(studentELibrary.status === 200 && Array.isArray(studentELibrary.data?.teacherMaterials), 'Student can access class and institute-wide e-library materials');

  // 4.4 Student can view their own ID card
  const myIdCard = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/idcards/student/1',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  assert(myIdCard.status === 200 && myIdCard.data?.fullName, 'Student can view their own digital ID card');

  // 4.5 Student can view their own report card
  const myReport = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/reportcard/student/1',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  assert(myReport.status === 200 && myReport.data?.subjectMarks, 'Student can view their official report card');

  console.log('\n====================================================');
  console.log(`AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');
  
  if (failed > 0) {
    process.exit(1);
  }
}

runAudit().catch(err => {
  console.error('Audit crashed with error:', err);
  process.exit(1);
});
