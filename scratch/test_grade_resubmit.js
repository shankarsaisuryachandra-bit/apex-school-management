async function test() {
  try {
    const tLoginRes = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'teacher1', password: 'teacher123' })
    });
    const { token: tToken } = await tLoginRes.json();

    // Check submissions for assignment 3
    const subsRes = await fetch('http://localhost:8080/api/assignments/3/submissions', {
      headers: { Authorization: `Bearer ${tToken}` }
    });
    const subs = await subsRes.json();
    console.log('Submissions for assignment 3:', subs.length);
    if (subs.length > 0) {
      const sub = subs[0];
      console.log('Testing grade submission with NEEDS_RESUBMISSION...');
      const gradeRes = await fetch(`http://localhost:8080/api/assignments/submissions/${sub.id}/grade`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${tToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          marksObtained: null,
          feedback: 'Please re-do Question 3 and show full working steps neatly.',
          status: 'NEEDS_RESUBMISSION'
        })
      });
      const graded = await gradeRes.json();
      console.log('Graded result:', {
        id: graded.id,
        status: graded.status,
        feedback: graded.feedback
      });
    }

    // Test creating and deleting a temporary assignment
    console.log('\nTesting create & delete assignment...');
    const createRes = await fetch('http://localhost:8080/api/assignments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Temp Assignment For Delete Test',
        instructions: 'Test instructions',
        dueDate: '2026-10-15',
        maxMarks: 50,
        classId: 1,
        subjectId: 1,
        teacherId: 1
      })
    });
    const createdAsg = await createRes.json();
    console.log('Created temp assignment ID:', createdAsg.id);

    const deleteRes = await fetch(`http://localhost:8080/api/assignments/${createdAsg.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tToken}` }
    });
    const delMsg = await deleteRes.json();
    console.log('Delete response:', delMsg);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
