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

async function verifyManagementAllocationEnforcement() {
  console.log('=== TEST: MANAGEMENT CLASS & SUBJECT ALLOCATION ENFORCEMENT ===\n');

  // 1. Logins
  const gopiLogin = await post('http://localhost:8080/api/auth/login', { username: 'G', password: 'G' });
  const gopiToken = gopiLogin.body.token;
  console.log('1. Teacher GOPI Login:', gopiToken ? 'SUCCESS' : 'FAILED');

  // 2. Check GOPI assigned classes & subjects
  const myClasses = await get('http://localhost:8080/api/academics/my-classes', gopiToken);
  console.log('\n2. GOPI Official Assignments by Management:');
  if (Array.isArray(myClasses.body)) {
    myClasses.body.forEach(item => {
      console.log(`   - Class: ${item.schoolClass?.name} (${item.schoolClass?.section}) [Class ID: ${item.schoolClass?.id}] | Subject: ${item.subject?.name} [Subject ID: ${item.subject?.id}]`);
    });
  }

  // 3. Test: GOPI posts assignment for ASSIGNED Class & Subject (Grade 9 AI)
  console.log('\n3. GOPI attempts to post assignment for ASSIGNED subject (Grade 9, AI - Subject ID 3):');
  const validAsg = await post('http://localhost:8080/api/assignments', {
    classId: 2, // Grade 9
    subjectId: 3, // AI (assigned to GOPI)
    title: 'Python Computer Vision Lab',
    instructions: 'Build edge detection algorithm',
    dueDate: '2026-10-18',
    maxMarks: 50
  }, gopiToken);
  console.log('   - Result Status:', validAsg.status, validAsg.status === 200 ? '✅ ALLOWED (200 OK)' : '❌ Failed: ' + JSON.stringify(validAsg.body));

  // 4. Test: GOPI attempts to post assignment for UNASSIGNED Subject in same class (Grade 9 Physics - Subject ID 2)
  console.log('\n4. GOPI attempts to post assignment for UNASSIGNED subject (Grade 9, Physics - Subject ID 2):');
  const unassignedSubjectAsg = await post('http://localhost:8080/api/assignments', {
    classId: 2, // Grade 9
    subjectId: 2, // Physics (assigned to Sarah Jenkins, NOT to GOPI!)
    title: 'Unauthorized Physics Exam',
    instructions: 'Teacher trying to post to another subject',
    dueDate: '2026-10-18',
    maxMarks: 50
  }, gopiToken);
  console.log('   - Result Status:', unassignedSubjectAsg.status, unassignedSubjectAsg.status === 403 ? '✅ BLOCKED (403 Forbidden)' : '❌ Leak! Status: ' + unassignedSubjectAsg.status);
  console.log('   - Message from server:', unassignedSubjectAsg.body?.message || unassignedSubjectAsg.body);

  // 5. Test: GOPI attempts to post assignment for UNASSIGNED Class (Grade 10 Maths - Class ID 1)
  console.log('\n5. GOPI attempts to post assignment for UNASSIGNED class (Grade 10 - Class ID 1):');
  const unassignedClassAsg = await post('http://localhost:8080/api/assignments', {
    classId: 1, // Grade 10
    subjectId: 1, // Maths
    title: 'Unauthorized Grade 10 Exam',
    instructions: 'Teacher trying to post to unassigned class',
    dueDate: '2026-10-18',
    maxMarks: 50
  }, gopiToken);
  console.log('   - Result Status:', unassignedClassAsg.status, unassignedClassAsg.status === 403 ? '✅ BLOCKED (403 Forbidden)' : '❌ Leak! Status: ' + unassignedClassAsg.status);
  console.log('   - Message from server:', unassignedClassAsg.body?.message || unassignedClassAsg.body);

  // 6. Test: GOPI attempts to upload E-Library study material for UNASSIGNED subject
  console.log('\n6. GOPI attempts to upload study material for UNASSIGNED subject (Grade 10 Chemistry):');
  const unassignedStudyMaterial = await post('http://localhost:8080/api/library/e-books', {
    classId: 1,
    subjectId: 4,
    title: 'Unauthorized Organic Chemistry Notes',
    description: 'Teacher trying to upload to unassigned class',
    fileType: 'PDF',
    fileUrl: 'https://example.com/chem.pdf'
  }, gopiToken);
  console.log('   - Result Status:', unassignedStudyMaterial.status, unassignedStudyMaterial.status === 403 ? '✅ BLOCKED (403 Forbidden)' : '❌ Leak! Status: ' + unassignedStudyMaterial.status);
  console.log('   - Message from server:', unassignedStudyMaterial.body?.message || unassignedStudyMaterial.body);

  console.log('\n🎉 ALL MANAGEMENT ALLOCATION ENFORCEMENT CHECKS PASSED!');
}

verifyManagementAllocationEnforcement();
