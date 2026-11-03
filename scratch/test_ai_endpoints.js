const http = require('http');

async function login(username, password) {
  const res = await fetch('http://localhost:8080/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  return data.token;
}

async function run() {
  console.log('Logging in student1...');
  const studentToken = await login('student1', 'student123');
  console.log('Student token acquired:', !!studentToken);

  console.log('Logging in teacher1...');
  const teacherToken = await login('teacher1', 'teacher123');
  console.log('Teacher token acquired:', !!teacherToken);

  // 1. Chat
  console.log('\n--- 1. Testing /api/ai/chat ---');
  const chatRes = await fetch('http://localhost:8080/api/ai/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${studentToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt: 'Explain Newton second law with formula', subject: 'Physics' })
  });
  console.log('Chat Status:', chatRes.status);
  const chatData = await chatRes.json();
  console.log('Chat Subject:', chatData.subject);
  console.log('Chat Source:', chatData.source);
  console.log('Chat Answer:\n', chatData.answer);

  // 2. Quiz
  console.log('\n--- 2. Testing /api/ai/quiz ---');
  const quizRes = await fetch('http://localhost:8080/api/ai/quiz', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${studentToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ subject: 'Mathematics', topic: 'Quadratic Equations', count: 3 })
  });
  console.log('Quiz Status:', quizRes.status);
  const quizData = await quizRes.json();
  console.log('Quiz Subject:', quizData.subject);
  console.log('Quiz Questions Count:', quizData.questions?.length);
  if (quizData.questions && quizData.questions.length > 0) {
    console.log('First Question:', quizData.questions[0].question);
    console.log('Options:', quizData.questions[0].options);
    console.log('Answer index:', quizData.questions[0].answer);
    console.log('Explanation:', quizData.questions[0].explanation);
  }

  // 3. Worksheet
  console.log('\n--- 3. Testing /api/ai/worksheet ---');
  const wsRes = await fetch('http://localhost:8080/api/ai/worksheet', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${teacherToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ subject: 'Physics', topic: 'Newton Laws of Motion', gradeLevel: 'Class 10' })
  });
  console.log('Worksheet Status:', wsRes.status);
  const wsData = await wsRes.json();
  console.log('Worksheet Title:', wsData.title);
  console.log('Worksheet Sections Count:', wsData.sections?.length);
  console.log('Worksheet Recommended Marks:', wsData.recommendedMaxMarks);
}

run().catch(console.error);
