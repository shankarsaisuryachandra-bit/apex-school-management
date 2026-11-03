async function test() {
  try {
    console.log('1. Testing teacher login...');
    const tLoginRes = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'teacher1', password: 'teacher123' })
    });
    const tLogin = await tLoginRes.json();
    const tToken = tLogin.token;
    console.log('Teacher login:', tToken ? 'SUCCESS' : 'FAILED', tLogin);

    console.log('\n2. Fetching assignments...');
    const asgRes = await fetch('http://localhost:8080/api/assignments', {
      headers: { Authorization: `Bearer ${tToken}` }
    });
    const assignments = await asgRes.json();
    console.log('Assignments count:', assignments.length);

    if (assignments.length > 0) {
      const firstAsg = assignments[0];
      console.log('\n3. Testing gradebook endpoint for assignment:', firstAsg.id, firstAsg.title);
      const gbRes = await fetch(`http://localhost:8080/api/assignments/${firstAsg.id}/gradebook`, {
        headers: { Authorization: `Bearer ${tToken}` }
      });
      const gb = await gbRes.json();
      console.log('Gradebook response summary:');
      console.log('- Total students:', gb.totalStudents);
      console.log('- Submitted count:', gb.submittedCount);
      console.log('- Evaluated count:', gb.evaluatedCount);
      console.log('- Students sample count:', gb.students?.length);
      if (gb.students?.length > 0) {
        console.log('- First student:', gb.students[0]);
      }
    }

    console.log('\n4. Testing student login...');
    const sLoginRes = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'student1', password: 'student123' })
    });
    const sLogin = await sLoginRes.json();
    console.log('Student login:', sLogin.token ? 'SUCCESS' : 'FAILED');
  } catch (err) {
    console.error('Test error:', err);
  }
}

test();
