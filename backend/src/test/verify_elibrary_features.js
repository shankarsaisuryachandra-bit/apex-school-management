const API = 'http://localhost:8080/api';

async function postJson(url, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${url} failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function getJson(url, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'GET', headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${url} failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function run() {
  console.log('--- STARTING E-LIBRARY & INSTITUTE BROADCAST VERIFICATION ---');

  // 1. Login as Teacher
  console.log('Logging in as Teacher (teacher1)...');
  const teacherLogin = await postJson(`${API}/auth/login`, {
    username: 'teacher1',
    password: 'teacher123'
  });
  const teacherToken = teacherLogin.token;

  // 2. Login as Admin
  console.log('Logging in as Admin (admin)...');
  const adminLogin = await postJson(`${API}/auth/login`, {
    username: 'admin',
    password: 'admin123'
  });
  const adminToken = adminLogin.token;

  // 3. Login as Student
  console.log('Logging in as Student (student1)...');
  const studentLogin = await postJson(`${API}/auth/login`, {
    username: 'student1',
    password: 'student123'
  });
  const studentToken = studentLogin.token;

  // --- STEP 1: Teacher uploads subject-specific material ---
  console.log('\n--- Step 1: Teacher uploads class/subject study note ---');
  const teacherNote = await postJson(`${API}/library/e-books`, {
    title: 'Physics Optics Formula Sheet & Ray Diagrams',
    description: 'Optics formulas and ray diagram summaries for Grade 9/10.',
    classId: 1, // Class 1
    subjectId: 2, // Physics
    fileType: 'IMAGE',
    fileUrl: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=800&q=80',
    isInstituteWide: false
  }, teacherToken);
  console.log('Teacher uploaded note ID:', teacherNote.id, teacherNote.title, `(Subject: ${teacherNote.subject?.name})`);

  // --- STEP 2: Admin broadcasts institute-wide document ---
  console.log('\n--- Step 2: Admin uploads institute-wide book / doc ---');
  const adminDoc = await postJson(`${API}/library/e-books`, {
    title: 'Annual Institute Science & Technology Encyclopedia (All Grades)',
    description: 'Comprehensive science encyclopedia for all students throughout the school.',
    isInstituteWide: true,
    classId: null,
    subjectId: null,
    fileType: 'PDF',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    authorOrSource: 'Directorate of Science Curriculum'
  }, adminToken);
  console.log('Admin broadcasted institute-wide material ID:', adminDoc.id, adminDoc.title, `(Institute-Wide: ${adminDoc.isInstituteWide})`);

  // --- STEP 3: Student verifies viewing both class notes & institute-wide broadcasts ---
  console.log('\n--- Step 3: Student retrieves E-Library materials ---');
  const studentLib = await getJson(`${API}/library/e-books?studentId=1`, studentToken);
  const materials = studentLib.teacherMaterials || [];
  console.log(`Student library contains ${materials.length} study materials & ${studentLib.digitalBooks?.length || 0} textbooks:`);
  materials.forEach(m => {
    console.log(` - ID: ${m.id} | "${m.title}" | Scope: ${m.isInstituteWide ? '📢 Institute-Wide' : `Class ${m.schoolClass?.name || 'Class'}`} | Type: ${m.fileType}`);
  });

  const foundTeacherNote = materials.find(m => m.id === teacherNote.id);
  const foundAdminDoc = materials.find(m => m.id === adminDoc.id);

  if (!foundTeacherNote) throw new Error('Student failed to receive class-specific teacher note!');
  if (!foundAdminDoc) throw new Error('Student failed to receive Admin institute-wide broadcast document!');

  console.log('\nVerified: Student successfully accessed both teacher subject notes and Admin institute-wide broadcast document!');
  console.log('--- ALL E-LIBRARY CHECKS PASSED SUCCESSFULLY! ---');
}

run().catch(err => {
  console.error('VERIFICATION ERROR:', err.message);
  process.exit(1);
});
