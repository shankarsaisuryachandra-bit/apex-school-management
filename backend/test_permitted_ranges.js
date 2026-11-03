const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: body ? JSON.parse(body) : null, raw: body });
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

async function runRangeAudit() {
  console.log('================================================================');
  console.log('TQM AUDIT: REJECTION OF MARKS & OTHER OUT-OF-RANGE PARAMETERS');
  console.log('================================================================\n');

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

  const adminToken = await login('admin', 'admin123');
  const teacherToken = await login('teacher1', 'teacher123');

  // --- 1. ASSESSMENT CREATION & MARKS RANGE ---
  console.log('\n--- 1. Testing Assessment Marks Permitted Range Rules ---');

  // 1.1 Assessment with maxMarks = 0 (Must reject)
  const rejectZeroMaxMarks = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/academics/assessments',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${teacherToken}`, 'Content-Type': 'application/json' }
  }, { name: 'Zero Marks Exam', classId: 1, subjectId: 1, maxMarks: 0 });
  assert(rejectZeroMaxMarks.status === 400, 'Rejects assessment creation with maxMarks <= 0 (HTTP 400)', `Got status ${rejectZeroMaxMarks.status}`);

  // 1.2 Assessment with maxMarks > 1000 (Must reject)
  const rejectHugeMaxMarks = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/academics/assessments',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${teacherToken}`, 'Content-Type': 'application/json' }
  }, { name: 'Excessive Marks Exam', classId: 1, subjectId: 1, maxMarks: 5000 });
  assert(rejectHugeMaxMarks.status === 400, 'Rejects assessment creation with maxMarks > 1000 (HTTP 400)', `Got status ${rejectHugeMaxMarks.status}`);

  // 1.3 Assessment with valid maxMarks = 50 (Must accept)
  const acceptValidAssessment = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/academics/assessments',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${teacherToken}`, 'Content-Type': 'application/json' }
  }, { name: 'TQM Unit Assessment 2026', classId: 1, subjectId: 1, maxMarks: 50, assessmentDate: '2026-10-30' });
  assert(acceptValidAssessment.status === 200 && acceptValidAssessment.data?.assessmentId, 'Creates assessment with valid maxMarks [1-1000]', `Got status ${acceptValidAssessment.status}`);

  const testAssessmentId = acceptValidAssessment.data?.assessmentId;

  // 1.4 Bulk Grade Entry: Negative marks (Must reject)
  const rejectNegativeMarks = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/academics/grades/bulk',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${teacherToken}`, 'Content-Type': 'application/json' }
  }, {
    assessmentHeaderId: testAssessmentId,
    grades: [{ studentId: 1, marksObtained: -5 }]
  });
  assert(rejectNegativeMarks.status === 400, 'Rejects negative marks obtained (< 0) (HTTP 400)', `Got status ${rejectNegativeMarks.status}`);

  // 1.5 Bulk Grade Entry: Marks exceeding assessment maxMarks (e.g. 55 out of 50) (Must reject)
  const rejectExcessMarks = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/academics/grades/bulk',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${teacherToken}`, 'Content-Type': 'application/json' }
  }, {
    assessmentHeaderId: testAssessmentId,
    grades: [{ studentId: 1, marksObtained: 75 }]
  });
  assert(rejectExcessMarks.status === 400, 'Rejects marks obtained (75) exceeding assessment ceiling (50) (HTTP 400)', `Got status ${rejectExcessMarks.status}`);

  // 1.6 Bulk Grade Entry: Valid marks (45 out of 50) (Must accept)
  const acceptValidMarks = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/academics/grades/bulk',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${teacherToken}`, 'Content-Type': 'application/json' }
  }, {
    assessmentHeaderId: testAssessmentId,
    grades: [{ studentId: 1, marksObtained: 45 }]
  });
  assert(acceptValidMarks.status === 200, 'Accepts valid marks within permitted range [0 - 50]', `Got status ${acceptValidMarks.status}`);


  // --- 2. ASSIGNMENT MARKS & EVALUATION ---
  console.log('\n--- 2. Testing Assignment Marks Permitted Range Rules ---');

  // 2.1 Assignment with maxMarks = 0 (Must reject)
  const rejectZeroAsgMarks = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/assignments',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${teacherToken}`, 'Content-Type': 'application/json' }
  }, { title: 'Zero Asg', classId: 1, subjectId: 1, dueDate: '2026-11-15', maxMarks: 0 });
  assert(rejectZeroAsgMarks.status === 400, 'Rejects assignment creation with maxMarks <= 0 (HTTP 400)', `Got status ${rejectZeroAsgMarks.status}`);

  // 2.2 Assignment with maxMarks > 1000 (Must reject)
  const rejectExcessAsgMarks = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/assignments',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${teacherToken}`, 'Content-Type': 'application/json' }
  }, { title: 'Excess Asg', classId: 1, subjectId: 1, dueDate: '2026-11-15', maxMarks: 2000 });
  assert(rejectExcessAsgMarks.status === 400, 'Rejects assignment creation with maxMarks > 1000 (HTTP 400)', `Got status ${rejectExcessAsgMarks.status}`);

  // 2.3 Assignment grading: negative marks on submission
  // Fetch existing submission
  const submissions = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/assignments/1/submissions',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const sampleSubId = submissions.data?.[0]?.id || 1;

  const rejectNegativeGrade = await request({
    hostname: 'localhost',
    port: 8080,
    path: `/api/assignments/submissions/${sampleSubId}/grade`,
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
  }, { marksObtained: -10, feedback: 'Invalid' });
  assert(rejectNegativeGrade.status === 400, 'Rejects negative assignment evaluation marks (< 0) (HTTP 400)', `Got status ${rejectNegativeGrade.status}`);

  const rejectExceedingGrade = await request({
    hostname: 'localhost',
    port: 8080,
    path: `/api/assignments/submissions/${sampleSubId}/grade`,
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
  }, { marksObtained: 9999, feedback: 'Invalid' });
  assert(rejectExceedingGrade.status === 400, 'Rejects assignment evaluation marks exceeding maximum allowed (HTTP 400)', `Got status ${rejectExceedingGrade.status}`);


  // --- 3. ATTENDANCE DATES ---
  console.log('\n--- 3. Testing Attendance Date Permitted Range Rules ---');

  // 3.1 Future attendance date (Must reject)
  const rejectFutureAttendance = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/attendance/mark',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${teacherToken}`, 'Content-Type': 'application/json' }
  }, {
    classId: 1,
    subjectId: 1,
    date: '2028-12-31',
    entries: [{ studentId: 1, status: 'PRESENT' }]
  });
  assert(rejectFutureAttendance.status === 400, 'Rejects future date attendance marking (HTTP 400)', `Got status ${rejectFutureAttendance.status}`);

  // 3.2 Ancient date attendance (older than 1 year, Must reject)
  const rejectAncientAttendance = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/attendance/mark',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${teacherToken}`, 'Content-Type': 'application/json' }
  }, {
    classId: 1,
    subjectId: 1,
    date: '2020-01-01',
    entries: [{ studentId: 1, status: 'PRESENT' }]
  });
  assert(rejectAncientAttendance.status === 400, 'Rejects attendance for dates older than 1 year (HTTP 400)', `Got status ${rejectAncientAttendance.status}`);


  // --- 4. FEE OVERPAYMENT & RANGE ---
  console.log('\n--- 4. Testing Fee Management Permitted Range Rules ---');

  // 4.1 Payment <= 0 (Must reject)
  const rejectZeroPayment = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/fees/payment',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
  }, { studentId: 1, amount: 0, paymentMode: 'CASH' });
  assert(rejectZeroPayment.status === 400, 'Rejects payment amount <= 0 (HTTP 400)', `Got status ${rejectZeroPayment.status}`);

  // 4.2 Overpayment exceeding balance due (Must reject)
  const rejectOverpayment = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/fees/payment',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
  }, { studentId: 1, amount: 999999.00, paymentMode: 'CASH' });
  assert(rejectOverpayment.status === 400, 'Rejects fee overpayment exceeding balance due (HTTP 400)', `Got status ${rejectOverpayment.status}`);

  // 4.3 Installment count outside [1-24] (Must reject)
  const rejectInvalidInstallments = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/fees/defaulters/installment-plan',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
  }, { studentId: 1, installments: 48, startDate: '2026-11-01' });
  assert(rejectInvalidInstallments.status === 400, 'Rejects installment count outside [1, 24] (HTTP 400)', `Got status ${rejectInvalidInstallments.status}`);


  // --- 5. LEAVE APPLICATION DATES ---
  console.log('\n--- 5. Testing Leave Application Date Range Rules ---');

  // 5.1 Inverted dates: endDate before startDate (Must reject)
  const rejectInvertedLeave = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/leaves',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
  }, { studentId: 1, startDate: '2026-11-10', endDate: '2026-11-02', reason: 'Vacation' });
  assert(rejectInvertedLeave.status === 400, 'Rejects inverted leave dates (endDate < startDate) (HTTP 400)', `Got status ${rejectInvertedLeave.status}`);

  // 5.2 Excessive duration (> 90 days) (Must reject)
  const rejectExcessiveLeave = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/leaves',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
  }, { studentId: 1, startDate: '2026-11-01', endDate: '2027-04-01', reason: 'Extended absence' });
  assert(rejectExcessiveLeave.status === 400, 'Rejects leave duration exceeding 90 days (HTTP 400)', `Got status ${rejectExcessiveLeave.status}`);


  // --- 6. PTM APPOINTMENT DATES ---
  console.log('\n--- 6. Testing PTM Appointment Date Range Rules ---');

  // 6.1 Past date PTM (Must reject)
  const rejectPastPtm = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/ptm',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
  }, { studentId: 1, teacherId: 1, appointmentDate: '2020-05-10', timeSlot: '10:00 AM - 10:30 AM' });
  assert(rejectPastPtm.status === 400, 'Rejects PTM scheduled for past date (HTTP 400)', `Got status ${rejectPastPtm.status}`);

  // 6.2 Distant future date PTM (> 180 days) (Must reject)
  const rejectDistantPtm = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/ptm',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
  }, { studentId: 1, teacherId: 1, appointmentDate: '2028-05-10', timeSlot: '10:00 AM - 10:30 AM' });
  assert(rejectDistantPtm.status === 400, 'Rejects PTM scheduled more than 180 days in advance (HTTP 400)', `Got status ${rejectDistantPtm.status}`);


  // --- 7. HEALTH RECORD RANGE ---
  console.log('\n--- 7. Testing Health Record Permitted Range Rules ---');

  // 7.1 Height outside [30-250 cm] (Must reject)
  const rejectInvalidHeight = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/health',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
  }, { studentId: 1, heightCm: 450.0, weightKg: 60.0 });
  assert(rejectInvalidHeight.status === 400, 'Rejects height outside permitted range [30 - 250 cm] (HTTP 400)', `Got status ${rejectInvalidHeight.status}`);

  // 7.2 Weight outside [3-250 kg] (Must reject)
  const rejectInvalidWeight = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/health',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
  }, { studentId: 1, heightCm: 160.0, weightKg: 500.0 });
  assert(rejectInvalidWeight.status === 400, 'Rejects weight outside permitted range [3 - 250 kg] (HTTP 400)', `Got status ${rejectInvalidWeight.status}`);


  // --- 8. TRANSPORT & FLEET RANGE ---
  console.log('\n--- 8. Testing Transport Permitted Range Rules ---');

  // 8.1 Vehicle capacity outside [1-150] (Must reject)
  const rejectInvalidCapacity = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/transport',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
  }, { routeName: 'Test Route', busNumber: 'KA-01-9999', capacity: 350, monthlyFee: 2000 });
  assert(rejectInvalidCapacity.status === 400, 'Rejects vehicle capacity outside permitted range [1 - 150] (HTTP 400)', `Got status ${rejectInvalidCapacity.status}`);

  // 8.2 Vehicle speed outside [0-180 km/h] (Must reject)
  const rejectInvalidSpeed = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/transport/1/gps-stream',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
  }, { latitude: 12.9716, longitude: 77.5946, speedKmh: 260, fuelLevelPercent: 80 });
  assert(rejectInvalidSpeed.status === 400, 'Rejects vehicle speed outside permitted range [0 - 180 km/h] (HTTP 400)', `Got status ${rejectInvalidSpeed.status}`);


  // --- 9. LIBRARY BOOKS RANGE ---
  console.log('\n--- 9. Testing Library Permitted Range Rules ---');

  // 9.1 Total copies outside [1-5000] (Must reject)
  const rejectInvalidCopies = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/library/books',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
  }, { title: 'Test Book', author: 'Author', totalCopies: 25000 });
  assert(rejectInvalidCopies.status === 400, 'Rejects library book copies outside permitted range [1 - 5000] (HTTP 400)', `Got status ${rejectInvalidCopies.status}`);


  // --- 10. ADMISSIONS APPLICANT AGE RANGE ---
  console.log('\n--- 10. Testing Admissions Applicant Age Permitted Range Rules ---');

  // 10.1 Date of birth outside [2-40 years] (Must reject)
  const rejectInvalidApplicantAge = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/admissions/apply',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    studentName: 'Invalid Age Applicant',
    applyingForGrade: 'Grade 1',
    parentName: 'Parent',
    phone: '9876543210',
    dateOfBirth: '1940-01-01'
  });
  assert(rejectInvalidApplicantAge.status === 400, 'Rejects applicant age outside permitted student range [2 - 40 years] (HTTP 400)', `Got status ${rejectInvalidApplicantAge.status}`);

  console.log('\n================================================================');
  console.log(`FINAL RANGE AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runRangeAudit().catch(err => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
