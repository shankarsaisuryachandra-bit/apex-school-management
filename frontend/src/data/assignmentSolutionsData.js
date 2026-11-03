// Comprehensive topic-specific solution dossiers for all school assignments
export const ASSIGNMENT_SOLUTIONS_MAP = {
  'indus_valley_civilization_report_solution.pdf': {
    title: 'Ancient Indus Valley Civilization Report',
    subject: 'Social Studies',
    subjectCode: 'SST101',
    className: 'Class 6 - Section A',
    score: 88,
    maxMarks: 100,
    instructions: 'Summary of Harappa urban planning, granaries, and drainage system with archaeological significance.',
    feedback: 'Very good effort. Clear and organized historical analysis of Harappan architecture and drainage.',
    overview: 'The Indus Valley Civilization (c. 2600 – 1900 BCE), also designated as the Harappan Civilization, represents one of the earliest urbanized societies in human antiquity. Centered across the fertile floodplains of the Indus and Ghaggar-Hakra river systems in northwestern South Asia, the civilization exhibited remarkable architectural sophistication, rigorous municipal standardization, and highly organized urban infrastructure that surpassed many contemporary Bronze Age civilizations.',
    corePoints: [
      {
        title: 'Grid Urban Town Planning & Brick Masonry',
        body: 'Harappan cities like Mohenjo-Daro and Harappa were divided systematically into two main sectors: the elevated Citadel (Western Sector) and the Lower Town (Eastern Sector). Streets were oriented precisely along cardinal directions in a gridiron pattern, intersecting at 90-degree right angles. Domestic and civic structures were constructed with kiln-baked bricks conforming to a standardized dimensional ratio of 4:2:1 (length:width:thickness).'
      },
      {
        title: 'Advanced Hydraulic Engineering & Drainage',
        body: 'Every residential home was equipped with a dedicated brick-paved bathroom and wastewater chute that fed into covered street drains. Main drains were shielded with removable limestone inspection slabs, allowing regular municipal desilting. Sump pits and soak-wells captured silt before runoff discharged outside the city walls, preventing contamination.'
      },
      {
        title: 'The Great Bath of Mohenjo-Daro',
        body: 'The Great Bath measures approximately 11.88 meters by 7.01 meters, with a depth of 2.43 meters. It was rendered completely watertight through a double layer of tightly fitted baked bricks, bonded by gypsum mortar and backed by a thick seal of natural bitumen (asphalt), demonstrating pioneering waterproofing technology intended for ceremonial purification rituals.'
      },
      {
        title: 'Granaries & Grain Storage Infrastructure',
        body: 'The Great Granary at Harappa consisted of twelve separate storage chambers arranged in two rows of six, mounted upon raised brick platforms with air-duct ventilation channels beneath the floorboards to protect stored barley and wheat against dampness, pests, and flooding.'
      },
      {
        title: 'Economic Trade, Steatite Seals & Standardization',
        body: 'Harappans engaged in extensive maritime and overland commerce with ancient Mesopotamia (referred to as Meluhha in cuneiform texts). Trade was regulated through standardized chert cubic weights and distinctive square steatite seals depicting the unicorn, zebu bull, and the enigmatic proto-Shiva Pashupati figure.'
      }
    ],
    table: {
      headers: ['Archaeological Site', 'Key Discoveries', 'River Basin', 'Significance'],
      rows: [
        ['Harappa', 'Great Granary, Coffin Burials, Terracotta Figurines', 'Ravi River', 'First site discovered (1921)'],
        ['Mohenjo-Daro', 'Great Bath, Bronze Dancing Girl, Priest-King', 'Indus River', 'Largest urban metropolis'],
        ['Lothal', 'Tidal Dockyard, Bead Factory, Rice Husk relics', 'Bhogava River', 'Premier maritime port hub'],
        ['Kalibangan', 'Ploughed Field surface, Fire Altars, Camel bones', 'Ghaggar River', 'Early agricultural proof'],
        ['Dholavira', 'Giant Stone Water Reservoirs, Inscription Signboard', 'Rann of Kutch', 'Master hydraulic system']
      ]
    },
    conclusion: 'The Harappan civilization stands as an unparalleled testament to sustainable civic engineering, peaceful municipal administration, and egalitarian urban living. Its sudden decline around 1900 BCE highlights the vulnerability of riverine civilizations to hydrological changes and climate shifts, offering enduring lessons for modern urban planning.'
  },

  'simple_electric_circuit_experiment_solution.pdf': {
    title: 'Simple Electric Circuit Experiment',
    subject: 'General Science',
    subjectCode: 'SCI101',
    className: 'Class 6 - Section A',
    score: 92,
    maxMarks: 100,
    instructions: 'Describe switch, battery, and bulb connectivity with circuit diagram and electrical conductivity rules.',
    feedback: 'Outstanding analytical depth & presentation! Schematics and circuit calculations are impeccably illustrated.',
    overview: 'An electric circuit is a continuous, unbroken conductive loop through which electric charges (electrons) migrate under the influence of potential difference. This laboratory experiment investigates closed, open, and short circuit topologies, component functions, directionality of electric current, and empirical conductivity testing across common materials.',
    corePoints: [
      {
        title: 'Circuit Components & Functional Topology',
        body: 'The experimental setup incorporates a 9V DC chemical cell, insulated copper connection leads, a single-pole single-throw (SPST) toggle knife switch, and a 6V miniature incandescent tungsten filament bulb. A closed circuit provides a continuous path from the positive terminal (+) through the load back to the negative terminal (-).'
      },
      {
        title: 'Electron Flow vs Conventional Current Direction',
        body: 'Historically, Benjamin Franklin postulated that positive fluid moves from higher to lower potential (conventional current: positive to negative). Modern solid-state physics demonstrates that charge carriers in metals are negatively charged electrons traveling from negative to positive terminals.'
      },
      {
        title: 'Conductivity Testing & Material Characterization',
        body: 'By introducing an open test gap in the circuit, various test specimens were examined. Materials rich in free conduction band electrons (copper, aluminum, iron, graphite pencil lead) closed the circuit, lighting the bulb. Materials with tightly bound valence electrons (rubber eraser, dry pine wood, glass rod, plastic ruler) acted as insulators.'
      },
      {
        title: 'Ohmic Resistance & Filament Incandescence',
        body: 'When electric current passes through the high-resistance tungsten filament (R ≈ 15 ohms), Joule heating occurs (P = I²R). The filament temperature exceeds 2,500°C, emitting visible electromagnetic radiation (luminescence) without burning due to the inert argon atmosphere inside the glass envelope.'
      }
    ],
    table: {
      headers: ['Tested Specimen', 'Material Class', 'Bulb State', 'Electrical Property'],
      rows: [
        ['Copper Strips', 'Metal', 'Bright Glow', 'Superb Conductor (Low R)'],
        ['Graphite Pencil Core', 'Carbon Allotrope', 'Moderate Glow', 'Non-metal Conductor'],
        ['Vulcanized Rubber', 'Polymer', 'No Light', 'Dielectric Insulator'],
        ['Saline Solution (NaCl)', 'Electrolyte', 'Steady Glow', 'Ionic Conductor (Na+, Cl-)'],
        ['Borosilicate Glass', 'Silicate', 'No Light', 'Complete Insulator']
      ]
    },
    conclusion: 'A reliable circuit requires a continuous conductive path, an energy potential source (battery), and a consuming load. Switches provide safe manual control over current flow. Fused safety circuits prevent catastrophic thermal runaway caused by unintended short circuits.'
  },

  'phonics_reading_journal_solution.pdf': {
    title: 'Phonics & Reading Journal',
    subject: 'English Core',
    subjectCode: 'ENG101',
    className: 'Class 1 - Section A',
    score: 48,
    maxMarks: 50,
    instructions: 'Read Chapter 3 story aloud and write down 10 new sight words with phonics breakdown.',
    feedback: 'Wonderful reading journal! Clear handwriting, excellent phonemic awareness, and imaginative sentence craft.',
    overview: 'Early literacy development hinges upon systematic synthetic phonics, phonemic awareness, and sight word recognition. This reading journal evaluates Chapter 3: "The Little Bluebird\'s Morning Song", focusing on short vowel decodable words, consonant digraphs, and expressive oral fluency.',
    corePoints: [
      {
        title: 'Consonant Digraph Mastery (sh, ch, th, wh)',
        body: 'Identified and pronounced words combining two consonant letters to yield a single distinct sound: ship (/ʃ/), chip (/tʃ/), thin (/θ/), when (/w/). Illustrated phoneme isolation during vocal read-aloud sessions.'
      },
      {
        title: 'Short Vowels vs Long Vowel Silent-e Magic',
        body: 'Contrasted CVC (consonant-vowel-consonant) patterns with silent-e transformations: tap -> tape, hop -> hope, pin -> pine, cub -> cube. Practiced phoneme blending and auditory discrimination.'
      },
      {
        title: '10 High-Frequency Dolch Sight Words',
        body: 'Extracted key sight words that cannot always be sounded out phonetically: always, because, could, friend, laugh, please, their, through, water, where. Formulated original contextual sentences for each word.'
      }
    ],
    table: {
      headers: ['Sight Word', 'Phonics Pattern', 'Rhyming Word', 'Student Sentence'],
      rows: [
        ['Friend', 'Irregular /ɛnd/', 'Bend', 'My friend Sarah plays with me.'],
        ['Bright', 'Long i with -ight', 'Light', 'The golden sun is very bright.'],
        ['Through', 'Special trigraph', 'Blue', 'We walked happily through the park.'],
        ['Laugh', 'Digraph -gh as /f/', 'Half', 'The funny story made us laugh.'],
        ['Water', 'Open vowel wa-', 'Otter', 'Birds drink fresh water every day.']
      ]
    },
    conclusion: 'Consistent daily reading aloud with guided phonics decoding enhances word recognition velocity, vocabulary acquisition, and reading confidence in foundational primary learners.'
  },

  'numbers_count_match_activity_solution.pdf': {
    title: 'Numbers Count & Match Activity',
    subject: 'Mathematics',
    subjectCode: 'MATH101',
    className: 'Class 1 - Section A',
    score: 47,
    maxMarks: 50,
    instructions: 'Complete worksheet pages 15-18 matching quantities 1 to 50 with tens and ones grouping.',
    feedback: 'Excellent numeracy demonstration! Place value groupings and ordinal number sequences are accurate.',
    overview: 'Foundational numeracy establishes counting cardinality, base-10 place value decomposition (tens and ones), and relational quantity comparisons (<, =, >) across integers from 1 to 50.',
    corePoints: [
      {
        title: 'Base-10 Decomposition (Tens and Ones)',
        body: 'Deconstructed two-digit quantities into bundled tens rods and loose unit cubes: 34 = 3 Tens + 4 Ones; 48 = 4 Tens + 8 Ones; 20 = 2 Tens + 0 Ones. Demonstrates structural understanding of base-10 notation.'
      },
      {
        title: 'Ordinal Sequence & Number Line Navigation',
        body: 'Mapped forward sequence skips (+2, +5, +10) and backward countdowns from 50. Solved missing number gaps: [12, 14, 16, 18, 20] and [25, 30, 35, 40, 45].'
      },
      {
        title: 'Relational Quantity Comparisons',
        body: 'Applied relational symbols correctly: 42 > 24, 38 < 41, 15 + 5 = 20. Solved real-world picture counting word problems involving apples, toy cars, and colorful balloons.'
      }
    ],
    table: {
      headers: ['Numeral', 'Number Name', 'Tens & Ones Breakdown', 'Predecessor / Successor'],
      rows: [
        ['19', 'Nineteen', '1 Ten + 9 Ones', '18 and 20'],
        ['27', 'Twenty-Seven', '2 Tens + 7 Ones', '26 and 28'],
        ['35', 'Thirty-Five', '3 Tens + 5 Ones', '34 and 36'],
        ['43', 'Forty-Three', '4 Tens + 3 Ones', '42 and 44'],
        ['50', 'Fifty', '5 Tens + 0 Ones', '49 and 51']
      ]
    },
    conclusion: 'Mastering concrete quantity grouping and number line positioning forms the critical cornerstone for two-digit addition, subtraction, and algebraic thinking in subsequent grades.'
  },

  'trigonometric_heights_distances_solution.pdf': {
    title: 'Trigonometric Heights & Distances Case Study',
    subject: 'Mathematics',
    subjectCode: 'MATH101',
    className: 'Class 10 - Section A',
    score: 93,
    maxMarks: 100,
    instructions: 'Solve real-world angle of elevation & depression problems including maritime lighthouse and dual-building case studies.',
    feedback: 'Outstanding trigonometric precision! Geometric ray diagrams, tangent ratio applications, and radical simplifications are excellent.',
    overview: 'Trigonometry ("triangle measurement") establishes exact mathematical ratios between interior acute angles and side lengths in right-angled Euclidean triangles. Applications in heights and distances enable geodetic surveyors and navigators to determine inaccessible vertical elevations and horizontal expanses using theodolites.',
    corePoints: [
      {
        title: 'Angles of Elevation vs Angles of Depression',
        body: 'The Line of Sight connects an observer\'s ocular lens to the target object. When gazing upward above the horizontal datum, the acute angle formed is the Angle of Elevation (θ). When looking downward below the horizontal datum, it is the Angle of Depression (φ). By alternate interior angle geometry between parallel horizontals, Angle of Depression = Angle of Elevation.'
      },
      {
        title: 'Case Study 1: Coastal Lighthouse & Approaching Ships',
        body: 'A lighthouse keeper 75m above sea level observes two ships aligned along the same line of sight. The angles of depression shift from 30° to 45°. Let d be the distance between ships. Tan(45°) = 75 / x -> x = 75m. Tan(30°) = 75 / (x + d) -> 1/√3 = 75 / (75 + d) -> 75 + d = 75√3 -> d = 75(√3 - 1) ≈ 75(1.732 - 1) = 54.9 meters.'
      },
      {
        title: 'Case Study 2: Multi-Storey Building & Communication Tower',
        body: 'From the top of a 7m building, the angle of elevation of a cable tower is 60° and the angle of depression of its base is 45°. Tan(45°) = 7/w -> horizontal distance w = 7m. Tan(60°) = h_tower/w -> √3 = h_tower/7 -> h_tower = 7√3 m. Total Tower Height = 7 + 7√3 = 7(1 + √3) ≈ 19.12 meters.'
      }
    ],
    table: {
      headers: ['Observational Scenario', 'Observer Height', 'Key Angle(s)', 'Trig Ratio Applied', 'Computed Physical Metric'],
      rows: [
        ['Coastal Lighthouse', '75 meters', '30° and 45°', 'tan θ = Opposite / Adjacent', 'Ship separation = 54.9 meters'],
        ['Telecom Tower on Hill', '7.0 meters', '60° Elev, 45° Dep', 'tan 60° = √3, tan 45° = 1', 'Tower elevation = 19.12 meters'],
        ['Hot Air Balloon Shadow', 'Ground theodolite', '45° to 60°', 'sin θ & tan θ', 'Altitude = 120.5 meters'],
        ['River Width Survey', 'Riverbank cliff (30m)', '30° to opposite bank', 'tan 30° = 1/√3', 'River width = 51.96 meters'],
        ['Kite String Tension', 'Ground anchor', '60° elevation', 'sin 60° = √3 / 2', 'String length = 115.47 meters']
      ]
    },
    conclusion: 'Trigonometric surveying demonstrates how abstract trigonometric ratios translate directly into vital civil engineering, aeronautical flight path modeling, and satellite navigation benchmarks.'
  },

  'carbon_versatile_compounds_solution.pdf': {
    title: 'Carbon and Its Versatile Compounds',
    subject: 'Chemistry',
    subjectCode: 'CHM101',
    className: 'Class 10 - Section A',
    score: 95,
    maxMarks: 100,
    instructions: 'Explain tetravalency, catenation, allotropes, homologous series, and soap micelle cleansing mechanisms.',
    feedback: 'Outstanding organic chemical depth! Molecular orbital diagrams, isomer structures, and micelle mechanisms are thoroughly detailed.',
    overview: 'Carbon (Atomic Number 6, Electronic Configuration 2,4) occupies a preeminent position in chemistry. Over ten million distinct carbon compounds are known—exceeding the total compounds formed by all other periodic elements combined—attributable to carbon\'s unique tetravalent hybridization and unparalleled catenation capabilities.',
    corePoints: [
      {
        title: 'Tetravalency & Catenation: The Twin Drivers',
        body: 'Carbon possesses 4 valence electrons. Achieving a stable octet via ionic electron transfer (forming C⁴⁺ or C⁴⁻) is energetically prohibited due to ionization enthalpy and nuclear charge constraints. Hence, carbon forms four stable covalent electron-pair bonds. Catenation represents carbon\'s innate ability to link covalently with other carbon atoms into extensive linear chains, branched networks, and closed rings.'
      },
      {
        title: 'Allotropes: Diamond, Graphite & Fullerenes',
        body: 'Diamond features an sp³ tetrahedral lattice where every carbon bonds to four others with a bond length of 1.54 Å, producing extreme hardness and zero electrical conductivity. Graphite features sp² hexagonal planar sheets bonded by weak Van der Waals forces with delocalized pi electrons, granting high electrical conductivity and lubricating cleavage. Buckminsterfullerene (C-60) forms a spherical soccer-ball truncated icosahedron.'
      },
      {
        title: 'Homologous Series & Functional Groups',
        body: 'A family of organic compounds sharing identical functional groups, similar chemical reactivity, and conforming to a general molecular formula, where adjacent members differ by a -CH₂- methylene unit (14 unified mass units): Alkanes (CₙH₂ₙ₊₂), Alkenes (CₙH₂ₙ), Alkynes (CₙH₂ₙ₋₂), Alcohols (-OH), Aldehydes (-CHO), Carboxylic Acids (-COOH).'
      },
      {
        title: 'Cleansing Action of Soaps: Micelle Formation',
        body: 'Soap molecules are sodium/potassium salts of long-chain fatty acids (e.g. Sodium Stearate: C₁₇H₃₅COO⁻Na⁺). They exhibit dual amphiphilic nature: a hydrophobic non-polar hydrocarbon tail that dissolves in oily dirt, and a hydrophilic ionic carboxylate head facing aqueous surroundings. In water, they self-assemble into spherical micelles, suspending oily grease in a stable emulsion for rinsing.'
      }
    ],
    table: {
      headers: ['Compound Class', 'General Formula', 'Sample Member', 'Functional Group', 'Industrial Application'],
      rows: [
        ['Alkane', 'CₙH₂ₙ₊₂', 'Methane (CH₄)', 'Single C-C bond', 'CNG & Domestic LPG fuel gas'],
        ['Alkene', 'CₙH₂ₙ', 'Ethene (C₂H₄)', 'Double C=C bond', 'Polyethylene plastic synthesis'],
        ['Alcohol', 'CₙH₂ₙ₊₁OH', 'Ethanol (C₂H₅OH)', 'Hydroxyl (-OH)', 'Medical antiseptic & green biofuel'],
        ['Carboxylic Acid', 'CₙH₂ₙ₊₁COOH', 'Ethanoic Acid (CH₃COOH)', 'Carboxyl (-COOH)', 'Food vinegar & ester perfume synthesis'],
        ['Ester', 'R-COO-R\'', 'Ethyl Ethanoate', 'Ester linkage', 'Fragrances, flavorings & solvents']
      ]
    },
    conclusion: 'Organic carbon chemistry forms the physical basis of biochemistry, petrochemical fuels, synthetic pharmaceuticals, and polymers that define modern human technology and living cellular existence.'
  },

  'tqm_total_quality_management_solution.pdf': {
    title: 'TQM',
    subject: 'Mathematics',
    subjectCode: 'MATHS101',
    className: 'Class 10 - Section A',
    score: 96,
    maxMarks: 100,
    instructions: 'Comprehensive report on Total Quality Management, Deming PDCA Cycle, Six Sigma DMAIC, and ISO 9001 standards.',
    feedback: 'Outstanding comprehensive dossier! Exemplary analysis of statistical process control, Pareto analysis, and quality assurance.',
    overview: 'Total Quality Management (TQM) is an integrative management philosophy dedicated to continuous process enhancement, customer satisfaction, and organizational excellence across all institutional tiers. This report investigates W. Edwards Deming\'s 14 Management Points, the Plan-Do-Check-Act (PDCA) cycle, and statistical Six Sigma quality control.',
    corePoints: [
      {
        title: 'W. Edwards Deming\'s Quality Philosophy',
        body: 'Deming advocated creating constancy of purpose, eliminating mass inspection dependency by building quality into systems, minimizing total life-cycle cost, instituting continuous training, breaking departmental silos, and driving out fear to maximize institutional engagement.'
      },
      {
        title: 'The Iterative PDCA Continuous Improvement Cycle',
        body: 'Plan: Diagnose operational root causes and formulate performance benchmarks. Do: Implement targeted pilot process interventions. Check: Measure empirical performance against control metrics. Act: Standardize verified protocols or adjust interventions iteratively.'
      },
      {
        title: 'Six Sigma DMAIC & Statistical Process Control',
        body: 'Six Sigma targets reducing defects to ≤ 3.4 defects per million opportunities (DPMO). The DMAIC framework (Define, Measure, Analyze, Improve, Control) employs Pareto 80/20 analyses, Ishikawa fishbone root-cause diagrams, and control charts to minimize process variance.'
      }
    ],
    table: {
      headers: ['Quality Methodology', 'Originator / Standard', 'Primary Objective', 'Key Analytical Tool', 'Metric of Success'],
      rows: [
        ['PDCA Cycle', 'W. Edwards Deming', 'Iterative process improvement', 'Continuous feedback loop', 'Steady reduction in variances'],
        ['Six Sigma DMAIC', 'Motorola / Bill Smith', 'Defect eradication', 'Statistical Process Control (SPC)', '≤ 3.4 Defects per Million (DPMO)'],
        ['Kaizen Philosophy', 'Masaaki Imai', 'Incremental workplace improvement', 'Gemba Walks & 5S organization', 'Employee-driven optimizations'],
        ['Pareto Analysis', 'Vilfredo Pareto', 'Prioritizing vital few causes', '80/20 Frequency Histogram', '80% issues resolved via 20% fixes'],
        ['ISO 9001:2015', 'International Standards Org', 'Quality Management System (QMS)', 'Process Auditing & Compliance', 'Formal Institutional Certification']
      ]
    },
    conclusion: 'Total Quality Management transitions educational institutions from reactive crisis intervention to proactive, data-driven systems excellence, maximizing student learning outcomes and operational efficacy.'
  }
}

export function getSolutionByUrlOrTitle(url, title) {
  if (url) {
    const slug = url.split('/').pop()
    if (ASSIGNMENT_SOLUTIONS_MAP[slug]) {
      return ASSIGNMENT_SOLUTIONS_MAP[slug]
    }
  }
  if (title) {
    const found = Object.values(ASSIGNMENT_SOLUTIONS_MAP).find(
      s => s.title.toLowerCase() === title.toLowerCase() || title.toLowerCase().includes(s.title.toLowerCase())
    )
    if (found) return found
  }
  // Generic fallback if not explicitly found in map
  return null
}
