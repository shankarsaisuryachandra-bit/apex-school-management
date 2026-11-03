async function run() {
  console.log('=== TESTING ACCURATE QUESTION-ANSWERING AI ENGINE ===\n');

  // 1. Authenticate
  const loginRes = await fetch('http://localhost:8080/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'student1', password: 'student123' })
  });
  const { token } = await loginRes.json();
  console.log('[AUTH] Token acquired:', !!token);

  let passed = 0;
  let total = 0;

  function assert(condition, message, details) {
    total++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      if (details) console.error('  Details:', details);
    }
  }

  // 2. Arithmetic Query: "What is 15 * 24?"
  console.log('\n--- Test 1: Arithmetic Query: "What is 15 * 24?" ---');
  const r1 = await fetch('http://localhost:8080/api/ai/chat', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'What is 15 * 24?', subject: 'Mathematics' })
  });
  const d1 = await r1.json();
  console.log('Source:', d1.source);
  console.log('Answer preview:\n', d1.answer);
  assert(d1.source === 'DYNAMIC_MATHEMATICAL_ENGINE', 'Uses Dynamic Math Engine for arithmetic', d1.source);
  assert(d1.answer.includes('360'), 'Direct answer 360 is present in the response', d1.answer);

  // 3. Linear Equation Query: "Solve 3x + 12 = 36"
  console.log('\n--- Test 2: Linear Equation: "Solve 3x + 12 = 36" ---');
  const r2 = await fetch('http://localhost:8080/api/ai/chat', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'Solve 3x + 12 = 36', subject: 'Mathematics' })
  });
  const d2 = await r2.json();
  console.log('Source:', d2.source);
  console.log('Answer preview:\n', d2.answer);
  assert(d2.source === 'DYNAMIC_MATHEMATICAL_ENGINE', 'Uses Dynamic Math Engine for linear equations', d2.source);
  assert(d2.answer.includes('x = 8'), 'Direct root x = 8 is calculated and present', d2.answer);

  // 4. Percentage Query: "What is 20% of 1500?"
  console.log('\n--- Test 3: Percentage: "What is 20% of 1500?" ---');
  const r3 = await fetch('http://localhost:8080/api/ai/chat', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'What is 20% of 1500?', subject: 'Mathematics' })
  });
  const d3 = await r3.json();
  console.log('Source:', d3.source);
  console.log('Answer preview:\n', d3.answer);
  assert(d3.source === 'DYNAMIC_MATHEMATICAL_ENGINE', 'Uses Dynamic Math Engine for percentage', d3.source);
  assert(d3.answer.includes('300'), 'Direct answer 300 is present', d3.answer);

  // 5. Square root Query: "square root of 144"
  console.log('\n--- Test 4: Square Root: "square root of 144" ---');
  const r4 = await fetch('http://localhost:8080/api/ai/chat', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'square root of 144', subject: 'Mathematics' })
  });
  const d4 = await r4.json();
  console.log('Source:', d4.source);
  console.log('Answer preview:\n', d4.answer);
  assert(d4.source === 'DYNAMIC_MATHEMATICAL_ENGINE', 'Uses Dynamic Math Engine for square root', d4.source);
  assert(d4.answer.includes('12'), 'Square root 12 is calculated', d4.answer);

  // 6. Factual / Conceptual Query: "What is photosynthesis?"
  console.log('\n--- Test 5: Factual Query: "What is photosynthesis?" ---');
  const r5 = await fetch('http://localhost:8080/api/ai/chat', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'What is photosynthesis?', subject: 'Biology' })
  });
  const d5 = await r5.json();
  console.log('Source:', d5.source);
  console.log('Answer preview:\n', d5.answer.slice(0, 300));
  assert(d5.source === 'WIKIPEDIA_KNOWLEDGE_ENGINE' || d5.answer.toLowerCase().includes('photosynthesis'), 'Directly explains photosynthesis', d5.answer);
  assert(d5.answer.toLowerCase().includes('light') || d5.answer.toLowerCase().includes('plants') || d5.answer.toLowerCase().includes('chlorophyll'), 'Contains core scientific concepts of photosynthesis', d5.answer);

  // 7. Historical Query: "Who was Isaac Newton?"
  console.log('\n--- Test 6: Historical Query: "Who was Isaac Newton?" ---');
  const r6 = await fetch('http://localhost:8080/api/ai/chat', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'Who was Isaac Newton?', subject: 'Physics' })
  });
  const d6 = await r6.json();
  console.log('Source:', d6.source);
  console.log('Answer preview:\n', d6.answer.slice(0, 300));
  assert(d6.source === 'WIKIPEDIA_KNOWLEDGE_ENGINE' || d6.answer.toLowerCase().includes('newton'), 'Directly answers about Isaac Newton', d6.answer);
  assert(d6.answer.toLowerCase().includes('mathematician') || d6.answer.toLowerCase().includes('physicist') || d6.answer.toLowerCase().includes('mechanics'), 'Contains biographical facts about Newton', d6.answer);

  // 8. Interactive Quiz
  console.log('\n--- Test 7: Interactive Quiz Generation ---');
  const r7 = await fetch('http://localhost:8080/api/ai/quiz', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject: 'Mathematics', topic: 'Quadratic Equations', count: 3 })
  });
  const d7 = await r7.json();
  assert(Array.isArray(d7.questions) && d7.questions.length === 3, 'Quiz generated 3 questions', d7.questions?.length);
  assert(d7.questions[0].correctIndex !== undefined, 'Question has valid correctIndex', d7.questions[0]);

  // 9. Faculty Worksheet
  console.log('\n--- Test 8: Faculty Worksheet Generation ---');
  const r8 = await fetch('http://localhost:8080/api/ai/worksheet', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject: 'Physics', topic: 'Laws of Motion', gradeLevel: 'Class 10' })
  });
  const d8 = await r8.json();
  assert(!!d8.title && d8.title.includes('Laws of Motion'), 'Worksheet has accurate topic title', d8.title);
  assert(Array.isArray(d8.questions) && d8.questions.length === 5, 'Worksheet includes 5 curriculum problems', d8.questions?.length);

  console.log(`\n========================================`);
  console.log(`ACCURATE AI TEST RESULTS: ${passed} / ${total} PASSED`);
  console.log(`========================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

