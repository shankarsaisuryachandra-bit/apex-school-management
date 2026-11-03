import { useState, useEffect } from 'react'
import api from '../api/axiosConfig'
import {
  HiXMark, HiSparkles, HiPaperAirplane, HiAcademicCap,
  HiLightBulb, HiCheckCircle, HiXCircle, HiArrowPath,
  HiClipboardDocument, HiCheck, HiBookOpen, HiCalculator,
  HiCpuChip, HiFire, HiMagnifyingGlass, HiCog6Tooth,
  HiKey, HiGlobeAlt, HiEye, HiEyeSlash, HiCheckBadge
} from 'react-icons/hi2'

const FORMULA_BANK = {
  Mathematics: [
    {
      title: 'Quadratic Equation Formula',
      formula: 'x = (-b ± √(b² - 4ac)) / (2a)',
      notes: 'Used to solve ax² + bx + c = 0. Discriminant D = b² - 4ac determines nature of roots (D > 0: two real roots, D = 0: equal roots, D < 0: complex roots).',
      topic: 'Algebra'
    },
    {
      title: 'Pythagorean Theorem',
      formula: 'a² + b² = c²',
      notes: 'For right-angled triangles: hypotenuse c is equal to the square root of the sum of the squares of the two legs a and b.',
      topic: 'Geometry'
    },
    {
      title: 'Arithmetic Progression (N-th Term & Sum)',
      formula: 'aₙ = a + (n - 1)d  |  Sₙ = (n/2)[2a + (n - 1)d]',
      notes: 'a is the first term, d is the common difference, n is the term position.',
      topic: 'Sequences'
    },
    {
      title: 'Fundamental Trigonometric Identity',
      formula: 'sin²(θ) + cos²(θ) = 1  |  1 + tan²(θ) = sec²(θ)',
      notes: 'Essential for simplifying trigonometric proofs and calculating unknown side ratios.',
      topic: 'Trigonometry'
    },
    {
      title: 'Area & Circumference of Circle',
      formula: 'Area = πr²  |  Circumference = 2πr',
      notes: 'Where r is radius and π ≈ 22/7 or 3.14159.',
      topic: 'Mensuration'
    }
  ],
  Physics: [
    {
      title: 'Newton’s Second Law of Motion',
      formula: 'F = m · a',
      notes: 'Force (Newtons) = mass (kg) × acceleration (m/s²). 1 Newton = 1 kg·m/s².',
      topic: 'Mechanics'
    },
    {
      title: 'Three Equations of Linear Motion',
      formula: 'v = u + at  |  s = ut + ½at²  |  v² = u² + 2as',
      notes: 'u = initial velocity, v = final velocity, a = constant acceleration, t = time, s = displacement.',
      topic: 'Kinematics'
    },
    {
      title: 'Ohm’s Law & Electrical Power',
      formula: 'V = I · R  |  P = V · I = I²R = V²/R',
      notes: 'V = Voltage (Volts), I = Current (Amperes), R = Resistance (Ohms Ω), P = Power (Watts).',
      topic: 'Electricity'
    },
    {
      title: 'Kinetic & Gravitational Potential Energy',
      formula: 'KE = ½mv²  |  PE = m · g · h',
      notes: 'g ≈ 9.8 m/s² (acceleration due to Earth gravity), m = mass (kg), h = height (m).',
      topic: 'Energy & Work'
    },
    {
      title: 'Snell’s Law of Refraction',
      formula: 'n₁ · sin(θ₁) = n₂ · sin(θ₂)',
      notes: 'n is the refractive index of the medium, θ is the angle of incidence/refraction.',
      topic: 'Optics'
    }
  ],
  Chemistry: [
    {
      title: 'Ideal Gas Law',
      formula: 'P · V = n · R · T',
      notes: 'P = pressure (atm/Pa), V = volume (L/m³), n = moles, R = 8.314 J/(mol·K) or 0.0821 L·atm/(mol·K), T = temperature in Kelvin.',
      topic: 'Thermodynamics'
    },
    {
      title: 'Molarity & Concentration',
      formula: 'Molarity (M) = moles of solute / volume of solution in Liters',
      notes: 'Moles = given mass (g) / molar mass (g/mol). Dilution formula: M₁V₁ = M₂V₂.',
      topic: 'Solutions'
    },
    {
      title: 'Acids, Bases & The pH Scale',
      formula: 'pH = -log₁₀[H⁺]  |  pH + pOH = 14',
      notes: 'pH < 7 is acidic, pH = 7 is neutral (pure water at 25°C), pH > 7 is alkaline/basic.',
      topic: 'Equilibrium'
    },
    {
      title: 'Neutralization Reaction Principle',
      formula: 'Acid + Base → Salt + Water',
      notes: 'Example: HCl + NaOH → NaCl + H₂O. Exothermic reaction releasing heat.',
      topic: 'Reactions'
    }
  ],
  'Computer Science': [
    {
      title: 'Algorithm Time Complexities (Big-O)',
      formula: 'O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ)',
      notes: 'Binary search: O(log n). Merge / Quick Sort average: O(n log n). Bubble / Insertion Sort: O(n²).',
      topic: 'Data Structures'
    },
    {
      title: 'Four Pillars of OOP',
      formula: 'Encapsulation • Inheritance • Polymorphism • Abstraction',
      notes: 'Encapsulation: private fields + getters/setters. Inheritance: extends. Polymorphism: method overriding/overloading. Abstraction: abstract/interface.',
      topic: 'Java & OOP'
    },
    {
      title: 'Binary Search Algorithm',
      formula: 'mid = low + (high - low) / 2',
      notes: 'Requires a sorted array. Divides search space in half at each step with logarithmic complexity O(log n).',
      topic: 'Algorithms'
    }
  ],
  Biology: [
    {
      title: 'Photosynthesis Biochemical Equation',
      formula: '6CO₂ + 6H₂O + Light (Chlorophyll) → C₆H₁₂O₆ + 6O₂',
      notes: 'Occurs in plant chloroplasts. Light reactions split water in thylakoids; Calvin cycle fixes CO₂ in stroma.',
      topic: 'Plant Physiology'
    },
    {
      title: 'Cellular Aerobic Respiration',
      formula: 'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + 38 ATP',
      notes: 'Power generation in mitochondria. Glycolysis (cytoplasm) → Krebs Cycle → Electron Transport Chain.',
      topic: 'Cell Biology'
    },
    {
      title: 'DNA Base-Pair Complementarity (Chargaff’s Rule)',
      formula: 'Adenine (A) = Thymine (T)  |  Guanine (G) ≡ Cytosine (C)',
      notes: 'Held together by hydrogen bonds (2 between A-T, 3 between G-C). In RNA, Uracil (U) replaces Thymine.',
      topic: 'Genetics'
    }
  ]
}

const QUICK_PROMPTS = {
  Mathematics: [
    'What is 15 * 24?',
    'Solve 3x + 12 = 36',
    'What is 20% of 1500?',
    'What is the square root of 144?',
    'Explain how to solve quadratic equations with the quadratic formula'
  ],
  Physics: [
    'Explain Newton’s Three Laws of Motion with real-world examples',
    'What is Ohm’s Law and how do parallel resistors work?',
    'Who was Isaac Newton?',
    'What is the difference between Kinetic Energy and Potential Energy?'
  ],
  Chemistry: [
    'What is photosynthesis and why is it important?',
    'Explain the periodic table trends for atomic radius',
    'What is the pH scale and how does neutralization work?',
    'What is the Ideal Gas Law formula and units?'
  ],
  'Computer Science': [
    'Explain the 4 pillars of Object-Oriented Programming (OOP) in Java',
    'What is an algorithm and why is Big-O important?',
    'What is the difference between binary search and linear search?',
    'Explain method overloading vs method overriding in Java'
  ],
  Biology: [
    'What is photosynthesis in plants and its chemical equation?',
    'Who discovered penicillin?',
    'What is the difference between mitosis and meiosis?',
    'Why is the mitochondrion called the powerhouse of the cell?'
  ]
}

export default function AiStudyTutorModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('DOUBT_SOLVER') // 'DOUBT_SOLVER' | 'INTERACTIVE_QUIZ' | 'FORMULAS'
  const [subject, setSubject] = useState('Mathematics')

  // --- AI Settings & Gemini Key State ---
  const [showSettings, setShowSettings] = useState(false)
  const [apiKey, setApiKey] = useState(localStorage.getItem('sms_gemini_api_key') || '')
  const [tempApiKey, setTempApiKey] = useState(apiKey)
  const [model, setModel] = useState(localStorage.getItem('sms_gemini_model') || 'gemini-1.5-flash')
  const [showKeyText, setShowKeyText] = useState(false)
  const [testingKey, setTestingKey] = useState(false)
  const [keyTestResult, setKeyTestResult] = useState(null)

  // --- Doubt Solver State ---
  const [prompt, setPrompt] = useState('')
  const [copiedIdx, setCopiedIdx] = useState(null)
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      source: apiKey ? 'GOOGLE_GEMINI_AI' : 'DYNAMIC_MATHEMATICAL_ENGINE',
      text: 'Hello scholar! I am your AI Study & Revision Tutor. Ask me any question, calculation, or doubt (e.g. "What is 15 * 24?", "Solve 3x + 12 = 36", "What is photosynthesis?"). I will solve and explain it directly!',
      time: 'Just now'
    }
  ])
  const [loadingChat, setLoadingChat] = useState(false)

  // --- Quiz Generator State ---
  const [quizTopic, setQuizTopic] = useState('Core Concepts')
  const [questionCount, setQuestionCount] = useState(4)
  const [quizQuestions, setQuizQuestions] = useState([])
  const [quizAnswers, setQuizAnswers] = useState({})
  const [loadingQuiz, setLoadingQuiz] = useState(false)
  const [quizSubmitted, setQuizSubmitted] = useState(false)

  // --- Formulas State ---
  const [formulaSearch, setFormulaSearch] = useState('')

  // Handle Save and Test Gemini Key
  const handleTestAndSaveKey = async () => {
    if (!tempApiKey.trim()) {
      localStorage.removeItem('sms_gemini_api_key')
      setApiKey('')
      setKeyTestResult({ success: true, message: 'API key cleared. System is now using Dynamic Math & Knowledge Engine.' })
      return
    }

    setTestingKey(true)
    setKeyTestResult(null)
    try {
      const res = await api.post('/ai/chat', {
        prompt: 'Hello! Respond with: "Gemini is connected successfully."',
        subject: 'General Science',
        apiKey: tempApiKey.trim()
      }, {
        headers: { 'X-Gemini-Key': tempApiKey.trim() }
      })

      if (res.data.source === 'GOOGLE_GEMINI_AI') {
        localStorage.setItem('sms_gemini_api_key', tempApiKey.trim())
        localStorage.setItem('sms_gemini_model', model)
        setApiKey(tempApiKey.trim())
        setKeyTestResult({ success: true, message: 'Connected to Google Gemini AI successfully!' })
      } else {
        setKeyTestResult({ success: false, message: 'Key verification did not reach Gemini. Please verify your Google AI Studio key.' })
      }
    } catch (err) {
      setKeyTestResult({ success: false, message: 'Error validating key: ' + (err.response?.data?.message || err.message) })
    } finally {
      setTestingKey(false)
    }
  }

  // Handle Chat Submit
  const handleSendPrompt = async (textToSend) => {
    const query = (textToSend || prompt).trim()
    if (!query) return

    const userMsg = {
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setMessages((prev) => [...prev, userMsg])
    setPrompt('')
    setLoadingChat(true)

    try {
      const res = await api.post('/ai/chat', {
        prompt: query,
        subject,
        apiKey: apiKey.trim() || undefined
      }, {
        headers: apiKey.trim() ? { 'X-Gemini-Key': apiKey.trim() } : {}
      })

      const aiReply = {
        sender: 'ai',
        text: res.data.answer || 'I could not generate an answer at this moment.',
        source: res.data.source || 'DYNAMIC_MATHEMATICAL_ENGINE',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages((prev) => [...prev, aiReply])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Unable to connect to AI study service. Please verify your network connection and try again.',
          source: 'CURRICULUM_PEDAGOGICAL_ENGINE',
          time: 'Just now'
        }
      ])
    } finally {
      setLoadingChat(false)
    }
  }

  // Handle Quiz Generate
  const handleGenerateQuiz = async () => {
    setLoadingQuiz(true)
    setQuizAnswers({})
    setQuizSubmitted(false)
    try {
      const res = await api.post('/ai/quiz', {
        subject,
        topic: quizTopic || 'Core Curriculum',
        count: questionCount,
        apiKey: apiKey.trim() || undefined
      }, {
        headers: apiKey.trim() ? { 'X-Gemini-Key': apiKey.trim() } : {}
      })
      setQuizQuestions(res.data.questions || [])
    } catch (err) {
      console.error('Quiz generation error:', err)
      alert('Failed to generate quiz. Please try again.')
    } finally {
      setLoadingQuiz(false)
    }
  }

  // Auto-generate quiz once on tab switch if empty
  useEffect(() => {
    if (activeTab === 'INTERACTIVE_QUIZ' && quizQuestions.length === 0) {
      handleGenerateQuiz()
    }
  }, [activeTab, subject])

  const handleSelectQuizAnswer = (qIndex, optionIndex) => {
    if (quizSubmitted) return
    setQuizAnswers((prev) => ({
      ...prev,
      [qIndex]: optionIndex
    }))
  }

  const calculateScore = () => {
    let correct = 0
    quizQuestions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctIndex) {
        correct++
      }
    })
    return correct
  }

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  // Filter formulas by search
  const activeFormulas = (FORMULA_BANK[subject] || []).filter((f) => {
    if (!formulaSearch.trim()) return true
    const q = formulaSearch.toLowerCase()
    return f.title.toLowerCase().includes(q) || f.formula.toLowerCase().includes(q) || f.notes.toLowerCase().includes(q)
  })

  // Format badge helper
  const renderSourceBadge = (source) => {
    if (source === 'GOOGLE_GEMINI_AI') {
      return (
        <span className="flex items-center gap-1 font-bold text-amber-500 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
          <HiSparkles className="w-3.5 h-3.5" />
          <span>Google Gemini 1.5 AI</span>
        </span>
      )
    }
    if (source === 'DYNAMIC_MATHEMATICAL_ENGINE') {
      return (
        <span className="flex items-center gap-1 font-bold text-sky-500 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
          <HiCalculator className="w-3.5 h-3.5" />
          <span>Dynamic Math Engine</span>
        </span>
      )
    }
    if (source === 'WIKIPEDIA_KNOWLEDGE_ENGINE') {
      return (
        <span className="flex items-center gap-1 font-bold text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          <HiGlobeAlt className="w-3.5 h-3.5" />
          <span>Wikipedia Knowledge Engine</span>
        </span>
      )
    }
    return (
      <span className="flex items-center gap-1 font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
        <HiAcademicCap className="w-3.5 h-3.5" />
        <span>Curriculum Knowledge Engine</span>
      </span>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-6 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-full border border-slate-200 dark:border-slate-800 flex flex-col h-[700px] max-h-[94vh] relative">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#0B1B2B] via-[#0F2942] to-[#1E3A5F] text-white px-6 py-3.5 flex items-center justify-between border-b-4 border-amber-500 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/30">
              <HiSparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-serif font-extrabold tracking-tight">
                  Apex AI Academic Suite
                </h3>
                {apiKey ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Gemini Connected
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Dynamic Engine Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                Accurate Question Answering, Math Problem Solver, Interactive Quiz & Cheatsheets
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold ${
                showSettings
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="AI Settings & API Key"
            >
              <HiCog6Tooth className="w-5 h-5" />
              <span className="hidden sm:inline">Settings</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Close Assistant"
            >
              <HiXMark className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Expandable Settings Drawer */}
        {showSettings && (
          <div className="bg-slate-900 text-white p-5 border-b border-slate-700 animate-fade-in shrink-0">
            <div className="max-w-2xl mx-auto space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HiKey className="w-5 h-5 text-amber-400" />
                  <h4 className="font-serif font-bold text-sm text-white">Google Gemini API Key & Model Settings</h4>
                </div>
                <span className="text-[10px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 font-semibold">
                  100% Free Tier Supported
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Provide your free Google Gemini API Key to unlock unlimited dynamic generative reasoning for any custom question.
                Get a free key in 30 seconds at{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 hover:underline font-bold inline-flex items-center gap-1"
                >
                  Google AI Studio (aistudio.google.com) ↗
                </a>
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative flex-1 w-full">
                  <input
                    type={showKeyText ? 'text' : 'password'}
                    placeholder="Paste Gemini API Key (e.g. AIzaSy...)"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    className="w-full px-3.5 py-2 pr-10 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyText(!showKeyText)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showKeyText ? <HiEyeSlash className="w-4 h-4" /> : <HiEye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast & Free)</option>
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Reasoning)</option>
                  </select>

                  <button
                    onClick={handleTestAndSaveKey}
                    disabled={testingKey}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 shrink-0"
                  >
                    {testingKey ? <HiArrowPath className="w-4 h-4 animate-spin" /> : <HiCheckBadge className="w-4 h-4" />}
                    <span>{testingKey ? 'Verifying...' : 'Save & Test'}</span>
                  </button>
                </div>
              </div>

              {keyTestResult && (
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                    keyTestResult.success
                      ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                  }`}
                >
                  {keyTestResult.success ? <HiCheckCircle className="w-4 h-4 shrink-0" /> : <HiXCircle className="w-4 h-4 shrink-0" />}
                  <span>{keyTestResult.message}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab & Subject Bar */}
        <div className="bg-slate-100 dark:bg-slate-800/80 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
          {/* Main Mode Tabs */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('DOUBT_SOLVER')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'DOUBT_SOLVER'
                  ? 'bg-[#0F2942] text-amber-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <HiLightBulb className="w-4 h-4 text-amber-400" />
              <span>Doubt Solver</span>
            </button>
            <button
              onClick={() => setActiveTab('INTERACTIVE_QUIZ')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'INTERACTIVE_QUIZ'
                  ? 'bg-[#0F2942] text-amber-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <HiAcademicCap className="w-4 h-4 text-amber-400" />
              <span>Interactive Quiz</span>
            </button>
            <button
              onClick={() => setActiveTab('FORMULAS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'FORMULAS'
                  ? 'bg-[#0F2942] text-amber-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <HiBookOpen className="w-4 h-4 text-amber-400" />
              <span>Formula Cheatsheet</span>
            </button>
          </div>

          {/* Subject Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-1">
            {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science'].map((subj) => (
              <button
                key={subj}
                onClick={() => setSubject(subj)}
                className={`px-3 py-1 rounded-full font-bold text-xs whitespace-nowrap transition-all ${
                  subject === subj
                    ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20 font-extrabold'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>

        {/* TAB 1: DOUBT SOLVER */}
        {activeTab === 'DOUBT_SOLVER' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-900/50">
            {/* Quick Prompts Bar */}
            <div className="px-6 py-2 bg-slate-100/60 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px] shrink-0">
              <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] shrink-0 flex items-center gap-1">
                <HiFire className="w-3.5 h-3.5 text-amber-500" /> High-Yield Topics:
              </span>
              {(QUICK_PROMPTS[subject] || []).map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendPrompt(qp)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:text-amber-600 dark:hover:text-amber-300 whitespace-nowrap transition-all shadow-2xs font-medium"
                >
                  {qp}
                </button>
              ))}
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed relative group ${
                      m.sender === 'user'
                        ? 'bg-amber-600 text-white font-medium rounded-tr-none shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-sm rounded-tl-none'
                    }`}
                  >
                    {m.sender === 'ai' && (
                      <div className="flex items-center justify-between gap-3 mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-700 text-[10px] text-slate-400">
                        {renderSourceBadge(m.source)}
                        <button
                          onClick={() => copyToClipboard(m.text, i)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-slate-700 dark:hover:text-white flex items-center gap-1"
                          title="Copy explanation"
                        >
                          {copiedIdx === i ? <HiCheck className="w-3.5 h-3.5 text-emerald-500" /> : <HiClipboardDocument className="w-3.5 h-3.5" />}
                          <span>{copiedIdx === i ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    )}
                    <div className="whitespace-pre-line font-normal">{m.text}</div>
                    <span
                      className={`text-[9px] block mt-2 ${
                        m.sender === 'user' ? 'text-amber-100 text-right' : 'text-slate-400'
                      }`}
                    >
                      {m.time}
                    </span>
                  </div>
                </div>
              ))}
              {loadingChat && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 shadow-sm">
                    <HiLightBulb className="w-4 h-4 text-amber-500 animate-pulse" />
                    <span className="font-semibold">AI Tutor is deriving step-by-step reasoning for your question...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendPrompt()
              }}
              className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2 shrink-0"
            >
              <input
                type="text"
                placeholder={`Ask any specific question or calculation in ${subject} (e.g. "What is 15 * 24?", "Solve 3x + 12 = 36", "What is photosynthesis?")...`}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none text-xs sm:text-sm font-medium"
              />
              <button
                type="submit"
                disabled={loadingChat || !prompt.trim()}
                className="px-5 py-3 rounded-xl bg-[#0F2942] hover:bg-slate-950 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all disabled:opacity-50 shadow-md"
              >
                <HiPaperAirplane className="w-4 h-4 text-amber-400" />
                <span>Ask AI</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: INTERACTIVE MCQ PRACTICE QUIZ */}
        {activeTab === 'INTERACTIVE_QUIZ' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-900/50 p-6 overflow-y-auto">
            {/* Quiz Configuration Header */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold">
                  <HiAcademicCap className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                    {subject} Curriculum Diagnostic Quiz
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Test your understanding with instant pedagogical feedback and score calculation.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Focus Topic (e.g. Optics, Algebra)"
                  value={quizTopic}
                  onChange={(e) => setQuizTopic(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500 w-44"
                />
                <button
                  onClick={handleGenerateQuiz}
                  disabled={loadingQuiz}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-sm"
                >
                  <HiArrowPath className={`w-3.5 h-3.5 ${loadingQuiz ? 'animate-spin' : ''}`} />
                  <span>{loadingQuiz ? 'Generating...' : 'New Quiz'}</span>
                </button>
              </div>
            </div>

            {/* Quiz Questions List */}
            {loadingQuiz ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
                <HiArrowPath className="w-8 h-8 text-amber-500 animate-spin mb-3" />
                <p className="font-bold text-sm">Curating high-yield curriculum questions...</p>
                <p className="text-xs text-slate-400 mt-1">Generating options, correct answers, and pedagogical proofs</p>
              </div>
            ) : quizQuestions.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p className="text-sm">No questions generated yet. Click "New Quiz" to begin!</p>
              </div>
            ) : (
              <div className="space-y-5">
                {quizQuestions.map((q, qIdx) => {
                  const selectedOpt = quizAnswers[qIdx]
                  const isAnswered = selectedOpt !== undefined
                  const isCorrect = selectedOpt === q.correctIndex

                  return (
                    <div
                      key={qIdx}
                      className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#0F2942] text-amber-300 text-xs font-bold flex items-center justify-center shrink-0">
                            {qIdx + 1}
                          </span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {q.topic || subject}
                          </span>
                        </div>
                        {isAnswered && (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold flex items-center gap-1 ${
                              isCorrect
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300'
                            }`}
                          >
                            {isCorrect ? <HiCheckCircle className="w-4 h-4" /> : <HiXCircle className="w-4 h-4" />}
                            {isCorrect ? 'Correct!' : 'Incorrect'}
                          </span>
                        )}
                      </div>

                      <h5 className="font-serif font-bold text-slate-900 dark:text-white text-sm mb-4 leading-relaxed">
                        {q.question}
                      </h5>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {(q.options || []).map((opt, optIdx) => {
                          let btnStyle = 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-amber-400'
                          
                          if (isAnswered) {
                            if (optIdx === q.correctIndex) {
                              btnStyle = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold ring-1 ring-emerald-500'
                            } else if (optIdx === selectedOpt) {
                              btnStyle = 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-200 font-bold ring-1 ring-rose-500'
                            } else {
                              btnStyle = 'opacity-50 border-slate-200 dark:border-slate-800'
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleSelectQuizAnswer(qIdx, optIdx)}
                              className={`p-3 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between ${btnStyle}`}
                            >
                              <span>{opt}</span>
                              {isAnswered && optIdx === q.correctIndex && (
                                <HiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                              )}
                              {isAnswered && optIdx === selectedOpt && optIdx !== q.correctIndex && (
                                <HiXCircle className="w-4 h-4 text-rose-600 shrink-0 ml-2" />
                              )}
                            </button>
                          )
                        })}
                      </div>

                      {/* Explanation box shown when answered */}
                      {isAnswered && q.explanation && (
                        <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-950 dark:text-amber-200 leading-relaxed flex items-start gap-2">
                          <HiLightBulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Pedagogical Explanation: </span>
                            <span>{q.explanation}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Score Summary Banner */}
                {Object.keys(quizAnswers).length === quizQuestions.length && (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0B1B2B] to-[#1E3A5F] text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl border border-amber-500/40">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
                        Quiz Complete
                      </span>
                      <h4 className="text-xl font-serif font-bold mt-0.5">
                        Your Score: {calculateScore()} / {quizQuestions.length} ({Math.round((calculateScore() / quizQuestions.length) * 100)}%)
                      </h4>
                      <p className="text-xs text-slate-300 mt-1">
                        {calculateScore() === quizQuestions.length
                          ? '🌟 Outstanding! Perfect mastery of this syllabus topic.'
                          : calculateScore() >= quizQuestions.length / 2
                          ? '👍 Good performance! Review the explanations above to strengthen tricky areas.'
                          : '📚 Review the formula cheatsheet tab and re-test to master the principles.'}
                      </p>
                    </div>
                    <button
                      onClick={handleGenerateQuiz}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md shrink-0"
                    >
                      <HiArrowPath className="w-4 h-4" />
                      <span>Take Another Quiz</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FORMULA CHEATSHEET & FLASHCARDS */}
        {activeTab === 'FORMULAS' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-900/50 p-6 overflow-y-auto">
            {/* Search Filter Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5 shrink-0">
              <div>
                <h4 className="font-serif font-bold text-slate-900 dark:text-white text-base">
                  {subject} Essential Formula Cheatsheet
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  High-yield formulas, constants, and governing principles for fast examination recall.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <HiMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter formulas..."
                  value={formulaSearch}
                  onChange={(e) => setFormulaSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Formula Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeFormulas.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-slate-400 text-xs">
                  No formulas found matching "{formulaSearch}".
                </div>
              ) : (
                activeFormulas.map((f, fIdx) => (
                  <div
                    key={fIdx}
                    className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60">
                          {f.topic}
                        </span>
                        <button
                          onClick={() => copyToClipboard(f.formula, fIdx)}
                          className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-md"
                          title="Copy formula"
                        >
                          {copiedIdx === fIdx ? <HiCheck className="w-3.5 h-3.5 text-emerald-500" /> : <HiClipboardDocument className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <h5 className="font-serif font-bold text-slate-900 dark:text-white text-sm mb-2">
                        {f.title}
                      </h5>

                      {/* Formula Callout */}
                      <div className="p-3 rounded-xl bg-slate-900 text-amber-300 font-mono text-xs sm:text-sm font-bold tracking-wide my-2 shadow-inner border border-slate-800 select-all">
                        {f.formula}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-2">
                        {f.notes}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
