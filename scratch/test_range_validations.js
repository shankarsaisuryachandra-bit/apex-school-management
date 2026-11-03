// Test Range Validations across Academics, Assignments, Fees, Health, Payroll, Library, and Transport

async function runRangeValidationTests() {
  console.log('=== STARTING RANGE & POKA-YOKE VALIDATION TEST SUITE ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate Teacher
    const tLoginRes = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'teacher1', password: 'teacher123' })
    });
    const tAuth = await tLoginRes.json();
    const tToken = tAuth.token;
    assert(!!tToken, 'Teacher logged in successfully');

    // 2. Authenticate Admin
    const aLoginRes = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const aAuth = await aLoginRes.json();
    const aToken = aAuth.token;
    assert(!!aToken, 'Admin logged in successfully');

    // --- TEST 1: Assessment Header maxMarks validation ---
    console.log('\n--- 1. Testing Assessment Header maxMarks [1, 1000] ---');
    // Test negative maxMarks
    const testNegMaxRes = await fetch('http://localhost:8080/api/academics/assessments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Negative Max Test',
        classId: 1,
        subjectId: 1,
        maxMarks: -50
      })
    });
    assert(testNegMaxRes.status === 400, 'Negative maxMarks (-50) was properly rejected (400 Bad Request)');

    // Test zero maxMarks
    const testZeroMaxRes = await fetch('http://localhost:8080/api/academics/assessments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Zero Max Test',
        classId: 1,
        subjectId: 1,
        maxMarks: 0
      })
    });
    assert(testZeroMaxRes.status === 400, 'Zero maxMarks (0) was properly rejected (400 Bad Request)');

    // Test excessive maxMarks
    const testExcessMaxRes = await fetch('http://localhost:8080/api/academics/assessments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Excessive Max Test',
        classId: 1,
        subjectId: 1,
        maxMarks: 5000
      })
    });
    assert(testExcessMaxRes.status === 400, 'Excessive maxMarks (5000) was properly rejected (400 Bad Request)');

    // Create valid assessment with maxMarks 100
    const validAssRes = await fetch('http://localhost:8080/api/academics/assessments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Unit Test Range Verification',
        classId: 1,
        subjectId: 1,
        academicYear: '2025-2026',
        maxMarks: 100
      })
    });
    const validAss = await validAssRes.json();
    assert(validAssRes.status === 200 && !!validAss.assessmentId, 'Valid assessment with maxMarks 100 was accepted');
    const assessmentId = validAss.assessmentId;

    // --- TEST 2: Bulk Grade Entry marksObtained [0, maxMarks] ---
    console.log('\n--- 2. Testing Bulk Grade Entry marksObtained [0, 100] ---');
    // Test negative marks
    const negGradeRes = await fetch('http://localhost:8080/api/academics/grades/bulk', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assessmentHeaderId: assessmentId,
        grades: [{ studentId: 1, marksObtained: -15, remarks: 'Invalid' }]
      })
    });
    assert(negGradeRes.status === 400, 'Negative marks (-15) was properly rejected (400 Bad Request)');

    // Test marks exceeding maxMarks
    const excessGradeRes = await fetch('http://localhost:8080/api/academics/grades/bulk', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assessmentHeaderId: assessmentId,
        grades: [{ studentId: 1, marksObtained: 125, remarks: 'Too high' }]
      })
    });
    assert(excessGradeRes.status === 400, 'Marks exceeding maxMarks (125/100) was properly rejected (400 Bad Request)');

    // Test valid marks
    const validGradeRes = await fetch('http://localhost:8080/api/academics/grades/bulk', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assessmentHeaderId: assessmentId,
        grades: [{ studentId: 1, marksObtained: 88, remarks: 'Valid score' }]
      })
    });
    assert(validGradeRes.status === 200, 'Valid marks (88/100) was accepted (200 OK)');

    // --- TEST 3: Assignment Creation maxMarks [1, 1000] ---
    console.log('\n--- 3. Testing Assignment Creation maxMarks [1, 1000] ---');
    const negAsgRes = await fetch('http://localhost:8080/api/assignments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Negative Max Assignment',
        dueDate: '2026-11-15',
        classId: 1,
        subjectId: 1,
        maxMarks: -25
      })
    });
    assert(negAsgRes.status === 400, 'Negative assignment maxMarks (-25) was properly rejected (400 Bad Request)');

    const excessAsgRes = await fetch('http://localhost:8080/api/assignments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Excessive Max Assignment',
        dueDate: '2026-11-15',
        classId: 1,
        subjectId: 1,
        maxMarks: 5000
      })
    });
    assert(excessAsgRes.status === 400, 'Excessive assignment maxMarks (5000) was properly rejected (400 Bad Request)');

    // Create valid assignment
    const validAsgRes = await fetch('http://localhost:8080/api/assignments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Valid Assignment Range Test',
        dueDate: '2026-11-15',
        classId: 1,
        subjectId: 1,
        maxMarks: 50
      })
    });
    const validAsg = await validAsgRes.json();
    assert(validAsgRes.status === 200 && !!validAsg.id, 'Valid assignment with maxMarks 50 was accepted');
    const asgId = validAsg.id;

    // Student submits assignment
    const sLoginRes = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'student1', password: 'student123' })
    });
    const sAuth = await sLoginRes.json();
    const sToken = sAuth.token;
    const sId = sAuth.profileId || 1;

    const subRes = await fetch(`http://localhost:8080/api/assignments/${asgId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: sId, fileUrl: '/uploads/test_solution.pdf' })
    });
    const subData = await subRes.json();
    const submissionId = subData.id;

    // --- TEST 4: Assignment Grading marksObtained [0, assignment.maxMarks] ---
    console.log('\n--- 4. Testing Assignment Grading marksObtained [0, 50] ---');
    // Test negative marks
    const negSubGradeRes = await fetch(`http://localhost:8080/api/assignments/submissions/${submissionId}/grade`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ marksObtained: -10, feedback: 'Negative test' })
    });
    assert(negSubGradeRes.status === 400, 'Negative assignment grade (-10) was properly rejected (400 Bad Request)');

    // Test exceeding assignment maxMarks (75 > 50)
    const excessSubGradeRes = await fetch(`http://localhost:8080/api/assignments/submissions/${submissionId}/grade`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ marksObtained: 75, feedback: 'Too high' })
    });
    assert(excessSubGradeRes.status === 400, 'Assignment marks exceeding maxMarks (75/50) was properly rejected (400 Bad Request)');

    // Test valid marks (42 <= 50)
    const validSubGradeRes = await fetch(`http://localhost:8080/api/assignments/submissions/${submissionId}/grade`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ marksObtained: 42, feedback: 'Well done!' })
    });
    assert(validSubGradeRes.status === 200, 'Valid assignment marks (42/50) was accepted (200 OK)');

    // Clean up test assignment
    await fetch(`http://localhost:8080/api/assignments/${asgId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tToken}` }
    });

    // --- TEST 5: Fee Structure Edit [0, 5000000] ---
    console.log('\n--- 5. Testing Fee Structure permitted range ---');
    const negFeeRes = await fetch('http://localhost:8080/api/fees/student/1', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${aToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentYearDue: -1500, previousYearPending: 0 })
    });
    assert(negFeeRes.status === 400, 'Negative currentYearDue (-1500) was properly rejected (400 Bad Request)');

    // --- TEST 6: Student Health Records height [30, 250], weight [3, 250] ---
    console.log('\n--- 6. Testing Student Health Records permitted range ---');
    const negHeightRes = await fetch('http://localhost:8080/api/health', {
      method: 'POST',
      headers: { Authorization: `Bearer ${aToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: 1, heightCm: -10, weightKg: 50 })
    });
    assert(negHeightRes.status === 400, 'Negative student height (-10 cm) was properly rejected (400 Bad Request)');

    const excessWeightRes = await fetch('http://localhost:8080/api/health', {
      method: 'POST',
      headers: { Authorization: `Bearer ${aToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: 1, heightCm: 160, weightKg: 850 })
    });
    assert(excessWeightRes.status === 400, 'Excessive student weight (850 kg) was properly rejected (400 Bad Request)');

    // --- TEST 7: Payroll Salary basicSalary [0, 10000000], deductions <= gross ---
    console.log('\n--- 7. Testing Payroll Salary permitted range ---');
    const negSalaryRes = await fetch('http://localhost:8080/api/payroll', {
      method: 'POST',
      headers: { Authorization: `Bearer ${aToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherId: 1, monthYear: '2026-11', basicSalary: -50000 })
    });
    assert(negSalaryRes.status === 400, 'Negative basic salary (-50,000) was properly rejected (400 Bad Request)');

    const excessDeductRes = await fetch('http://localhost:8080/api/payroll', {
      method: 'POST',
      headers: { Authorization: `Bearer ${aToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherId: 1, monthYear: '2026-11', basicSalary: 50000, allowances: 5000, deductions: 90000 })
    });
    assert(excessDeductRes.status === 400, 'Deductions exceeding total gross salary was properly rejected (400 Bad Request)');

    // --- TEST 8: Library Book copies [1, 5000] ---
    console.log('\n--- 8. Testing Library Book copies permitted range ---');
    const zeroCopiesRes = await fetch('http://localhost:8080/api/library/books', {
      method: 'POST',
      headers: { Authorization: `Bearer ${aToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Zero Copy Book', author: 'Author', totalCopies: 0 })
    });
    assert(zeroCopiesRes.status === 400, 'Zero book copies (0) was properly rejected (400 Bad Request)');

    // --- TEST 9: Transport Vehicle Capacity [1, 150] ---
    console.log('\n--- 9. Testing Transport Route Capacity permitted range ---');
    const invalidCapRes = await fetch('http://localhost:8080/api/transport', {
      method: 'POST',
      headers: { Authorization: `Bearer ${aToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ routeName: 'Bus 99', busNumber: 'BUS-99', capacity: 350 })
    });
    assert(invalidCapRes.status === 400, 'Excessive bus capacity (350 seats) was properly rejected (400 Bad Request)');

    console.log(`\n========================================`);
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error('Test execution error:', err);
  }
}

runRangeValidationTests();
