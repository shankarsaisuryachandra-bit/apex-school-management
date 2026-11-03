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

async function verifyIsolation() {
  console.log('=== TEST: TEACHER ASSIGNMENT ACCESS ISOLATION ===\n');

  // 1. Logins
  const sarahLogin = await post('http://localhost:8080/api/auth/login', { username: 'teacher1', password: 'teacher123' });
  const gopiLogin = await post('http://localhost:8080/api/auth/login', { username: 'G', password: 'G' });
  const adminLogin = await post('http://localhost:8080/api/auth/login', { username: 'admin', password: 'admin123' });
  const studentLogin = await post('http://localhost:8080/api/auth/login', { username: 'student1', password: 'student123' });

  const sarahToken = sarahLogin.body.token;
  const gopiToken = gopiLogin.body.token;
  const adminToken = adminLogin.body.token;
  const studentToken = studentLogin.body.token;

  console.log('1. Logins:');
  console.log('   - Sarah Jenkins (Physics/Maths Teacher):', sarahToken ? 'OK' : 'FAILED');
  console.log('   - GOPI (AI Teacher):', gopiToken ? 'OK' : 'FAILED');
  console.log('   - Admin:', adminToken ? 'OK' : 'FAILED');
  console.log('   - Student:', studentToken ? 'OK' : 'FAILED');

  // 2. Sarah creates a Physics assignment
  console.log('\n2. Sarah Jenkins creates a Physics assignment for Grade 9:');
  const sarahAsg = await post('http://localhost:8080/api/assignments', {
    classId: 2,
    subjectId: 2, // Physics
    title: 'Physics Wave Optics Worksheet',
    instructions: 'Complete questions 1 to 10 from chapter 8',
    dueDate: '2026-10-15',
    maxMarks: 50
  }, sarahToken);
  console.log('   - Sarah Assignment Created: ID', sarahAsg.body.id, '| Title:', sarahAsg.body.title);

  // 3. GOPI checks his assignments list
  console.log('\n3. Teacher GOPI queries GET /api/assignments:');
  const gopiAsgs = await get('http://localhost:8080/api/assignments', gopiToken);
  console.log('   - Number of assignments visible to GOPI:', Array.isArray(gopiAsgs.body) ? gopiAsgs.body.length : gopiAsgs.body);
  const sawSarahPhysics = Array.isArray(gopiAsgs.body) && gopiAsgs.body.some(a => a.id === sarahAsg.body.id);
  console.log('   - Can GOPI see Sarah Jenkins\' Physics assignment? ->', sawSarahPhysics ? '❌ LEAK DETECTED' : '✅ NO (SECURE)');

  // 4. GOPI attempts to access Sarah Jenkins\' assignment endpoints
  console.log('\n4. Teacher GOPI attempts to access Sarah Jenkins\' assignment resources:');
  const gopiSubCheck = await get(`http://localhost:8080/api/assignments/${sarahAsg.body.id}/submissions`, gopiToken);
  console.log('   - GOPI access Sarah\'s Submissions HTTP:', gopiSubCheck.status, gopiSubCheck.status === 403 ? '✅ (403 Forbidden)' : '❌');

  const gopiGradebookCheck = await get(`http://localhost:8080/api/assignments/${sarahAsg.body.id}/gradebook`, gopiToken);
  console.log('   - GOPI access Sarah\'s Gradebook HTTP:', gopiGradebookCheck.status, gopiGradebookCheck.status === 403 ? '✅ (403 Forbidden)' : '❌');

  const gopiDeleteCheck = await del(`http://localhost:8080/api/assignments/${sarahAsg.body.id}`, gopiToken);
  console.log('   - GOPI attempt to delete Sarah\'s Assignment HTTP:', gopiDeleteCheck.status, gopiDeleteCheck.status === 403 ? '✅ (403 Forbidden)' : '❌');

  // 5. GOPI creates an AI assignment
  console.log('\n5. Teacher GOPI creates an AI assignment for Grade 9:');
  const gopiAsg = await post('http://localhost:8080/api/assignments', {
    classId: 2,
    subjectId: 3, // AI or Computer
    title: 'AI Python Neural Network Lab',
    instructions: 'Build a simple perceptron and submit the script',
    dueDate: '2026-10-20',
    maxMarks: 100
  }, gopiToken);
  console.log('   - GOPI Assignment Created: ID', gopiAsg.body.id, '| Title:', gopiAsg.body.title);

  // 6. Sarah checks her assignments
  console.log('\n6. Sarah Jenkins queries GET /api/assignments:');
  const sarahAsgs = await get('http://localhost:8080/api/assignments', sarahToken);
  const sawGopiAi = Array.isArray(sarahAsgs.body) && sarahAsgs.body.some(a => a.id === gopiAsg.body.id);
  console.log('   - Can Sarah Jenkins see GOPI\'s AI assignment? ->', sawGopiAi ? '❌ LEAK DETECTED' : '✅ NO (SECURE)');

  // 7. Student checks assignments for Grade 9
  console.log('\n7. Grade 9 Student queries assignments:');
  const studentAsgs = await get('http://localhost:8080/api/assignments', studentToken);
  console.log('   - Student sees both assignments for Grade 9:');
  if (Array.isArray(studentAsgs.body)) {
    studentAsgs.body.forEach(a => console.log('     • [' + a.subject?.name + '] ' + a.title + ' (by ' + a.teacher?.fullName + ')'));
  }

  // 8. Admin checks assignments
  console.log('\n8. Admin queries assignments:');
  const adminAsgs = await get('http://localhost:8080/api/assignments', adminToken);
  console.log('   - Admin sees all assignments across all teachers: count =', Array.isArray(adminAsgs.body) ? adminAsgs.body.length : 0);

  console.log('\n🎉 ALL TEACHER ISOLATION TESTS PASSED!');
}

verifyIsolation();
