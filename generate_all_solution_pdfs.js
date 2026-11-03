const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetDirs = [
  path.join(__dirname, 'backend', 'uploads', 'solutions'),
  path.join(__dirname, 'frontend', 'public', 'uploads', 'solutions'),
  path.join(__dirname, 'uploads', 'solutions')
];

targetDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Comprehensive academic metadata for all assignments
const assignmentSolutions = [
  {
    id: 23,
    slug: 'indus_valley_civilization_report_solution.pdf',
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
  {
    id: 22,
    slug: 'simple_electric_circuit_experiment_solution.pdf',
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
  {
    id: 12,
    slug: 'phonics_reading_journal_solution.pdf',
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
  {
    id: 13,
    slug: 'numbers_count_match_activity_solution.pdf',
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
  {
    id: 14,
    slug: 'living_vs_non_living_organisms_solution.pdf',
    title: 'Living vs Non-Living Organisms',
    subject: 'Environmental Studies',
    subjectCode: 'EVS101',
    className: 'Class 2 - Section A',
    score: 49,
    maxMarks: 50,
    instructions: 'Draw and categorize 5 living and 5 non-living things found in school garden with biological criteria.',
    feedback: 'Outstanding biological observation! Clear understanding of life processes and environmental interaction.',
    overview: 'All entities in our terrestrial environment are classified into living organisms (biotic) and non-living objects (abiotic). Living organisms possess the capacity for autonomous metabolic activity, respiration, growth, irritability (response to stimuli), reproduction, and cellular organization.',
    corePoints: [
      {
        title: 'The Seven Vital Life Processes (MRS GREN)',
        body: 'Organisms demonstrate: Movement (autonomous locomotion or phototropism), Respiration (gas exchange for ATP), Sensitivity (sensory response to temperature/light), Growth (cellular proliferation), Reproduction (continuation of species), Excretion (waste elimination), and Nutrition (intake of organic/inorganic sustenance).'
      },
      {
        title: 'Natural vs Artificial Non-Living Objects',
        body: 'Non-living entities lack cellular structure and metabolic requirements. They are subdivided into Natural Abiotic Elements (sunlight, granite rocks, river water, atmospheric air) and Man-Made Artifacts (wooden benches, plastic watering cans, concrete pathways).'
      },
      {
        title: 'Garden Ecosystem Observations',
        body: 'Observed Honeybee (Apis mellifera) foraging nectar; Earthworm aerating moist garden soil; Hibiscus rosa-sinensis photosynthesizing; Garden pebble remaining unchanged in mass and volume over time.'
      }
    ],
    table: {
      headers: ['Subject Name', 'Classification', 'Can It Grow / Reproduce?', 'Key Observation'],
      rows: [
        ['Marigold Plant', 'Living (Flora)', 'Yes (Seeds & Stems)', 'Leaves turn towards morning sunlight'],
        ['Earthworm', 'Living (Fauna)', 'Yes (Lays cocoons)', 'Burrows into damp organic compost'],
        ['Garden Water Hose', 'Non-Living (Synthetic)', 'No', 'Requires human manipulation to move'],
        ['Granite River Rock', 'Non-Living (Natural)', 'No', 'Weathered by rain and physical friction'],
        ['Caterpillar', 'Living (Fauna)', 'Yes (Metamorphosis)', 'Feeds voraciously on fresh mulberry leaves']
      ]
    },
    conclusion: 'Living organisms actively maintain homeostatic life cycles and depend upon non-living environmental elements (air, water, sunlight, soil) for sustained biological survival.'
  },
  {
    id: 15,
    slug: 'addition_subtraction_word_problems_solution.pdf',
    title: 'Addition & Subtraction Word Problems',
    subject: 'Mathematics',
    subjectCode: 'MATH101',
    className: 'Class 2 - Section A',
    score: 95,
    maxMarks: 100,
    instructions: 'Solve the 10 real-world math word problems in notebook showing columnar regrouping.',
    feedback: 'Outstanding mathematical clarity! Regrouping steps, columnar place value alignment, and statements are flawless.',
    overview: 'Arithmetic word problems translate contextual narrative scenarios into quantitative operations. This assessment exercises two-digit addition with regrouping (carrying) and subtraction with decomposition (borrowing) using formal standard columnar algorithms.',
    corePoints: [
      {
        title: 'Problem 1: School Library Book Acquisition',
        body: 'Scenario: The library had 48 storybooks. The librarian received 37 new science books. Working: 48 + 37. Add ones: 8 + 7 = 15 (5 ones, carry 1 ten). Add tens: 4 + 3 + 1 = 8 tens. Result: 85 total books.'
      },
      {
        title: 'Problem 2: School Bakery Cookie Sale',
        body: 'Scenario: The cafeteria baked 92 oatmeal cookies. Scholars purchased 58 cookies during recess. Working: 92 - 58. Regroup 1 ten into 10 ones: (9 tens becomes 8 tens, 2 ones becomes 12 ones). Subtract ones: 12 - 8 = 4. Subtract tens: 8 - 5 = 3. Result: 34 cookies remaining.'
      },
      {
        title: 'Problem 3: Sports Day Ribbon Distribution',
        body: 'Scenario: Class 2 collected 64 blue ribbons and 29 gold medals. Total awards = 64 + 29. 4 + 9 = 13 (carry 1). 6 + 2 + 1 = 9 tens. Total = 93 awards.'
      },
      {
        title: 'Inverse Operation Verification',
        body: 'Verified subtraction outcomes using inverse addition: 34 (difference) + 58 (subtrahend) = 92 (minuend). Confirms zero computational discrepancy.'
      }
    ],
    table: {
      headers: ['Problem #', 'Narrative Context', 'Mathematical Equation', 'Computed Answer', 'Check'],
      rows: [
        ['Prob 1', 'Classroom Pencil Box', '56 + 28', '84 Pencils', 'Verified (84 - 28 = 56)'],
        ['Prob 2', 'Art Room Origami Paper', '75 - 47', '28 Sheets', 'Verified (28 + 47 = 75)'],
        ['Prob 3', 'Botanical Garden Saplings', '39 + 45', '84 Saplings', 'Verified (84 - 45 = 39)'],
        ['Prob 4', 'Auditorium Seating', '90 - 36', '54 Seats', 'Verified (54 + 36 = 90)'],
        ['Prob 5', 'Annual Sports Badges', '67 + 25', '92 Badges', 'Verified (92 - 25 = 67)']
      ]
    },
    conclusion: 'Reading mathematical word prompts with keyword identification ("in all", "altogether" -> Addition; "left", "difference", "how many more" -> Subtraction) guarantees systematic problem resolution.'
  },
  {
    id: 16,
    slug: 'plant_parts_functions_illustration_solution.pdf',
    title: 'Plant Parts & Functions Illustration',
    subject: 'Environmental Studies',
    subjectCode: 'EVS101',
    className: 'Class 3 - Section A',
    score: 48,
    maxMarks: 50,
    instructions: 'Label root, stem, leaf, and flower with their core physiological functions and vascular adaptations.',
    feedback: 'Very good effort. Clear and organized physiological diagrams, clear descriptions of xylem/phloem and stomata.',
    overview: 'Angiosperms (flowering plants) are sophisticated eukaryotic autotrophs organized into a subterranean Root System and an aerial Shoot System. Each specialized vegetative and reproductive organ coordinates vital physiological functions supporting plant growth, water transport, and photosynthesis.',
    corePoints: [
      {
        title: 'Subterranean Root System (Taproots & Fibrous Roots)',
        body: 'Roots anchor the plant securely into geological substrates and absorb dissolved water and essential mineral ions via microscopic root hair cells. Taproots (carrot, mustard) feature a prominent central primary root; Fibrous roots (wheat, grass) form dense branching mats preventing soil erosion.'
      },
      {
        title: 'Aerial Stem & Vascular Bundles',
        body: 'The stem elevates foliage toward incident solar radiation and houses two continuous vascular pipelines: Xylem vessels (unidirectional transport of water and dissolved minerals from roots to crown) and Phloem sieve tubes (bidirectional translocation of synthesized carbohydrates/sucrose from photosynthetic leaves to sink organs).'
      },
      {
        title: 'Leaves: Photosynthetic Powerhouses',
        body: 'Foliage contains chlorophyll within mesophyll chloroplasts to synthesize glucose via 6CO₂ + 6H₂O + Solar Energy -> C₆H₁₂O₆ + 6O₂. Microscopic epidermal pores called Stomata, regulated by turgid Guard Cells, facilitate gaseous exchange and drive the transpiration pull.'
      },
      {
        title: 'Flowers: Reproductive Specialization',
        body: 'Floral anatomy comprises the Calyx (sepals for bud protection), Corolla (pigmented petals attracting insect pollinators), Androecium (male stamen with pollen-bearing anthers), and Gynoecium (female pistil/carpel with stigma, style, and ovule-containing ovary).'
      }
    ],
    table: {
      headers: ['Plant Organ', 'Tissue Specialization', 'Primary Function', 'Adaptive Advantage'],
      rows: [
        ['Root Hairs', 'Epidermal extensions', 'Water & ion absorption', 'Massive surface area multiplier'],
        ['Xylem Conduit', 'Lignified hollow cells', 'Ascent of sap (Water)', 'Withstands high negative pressure'],
        ['Stomatal Apparatus', 'Guard cell regulated pores', 'Transpiration & CO₂ intake', 'Prevents desiccation in drought'],
        ['Flower Petals', 'Chromoplast pigments', 'Pollinator attraction', 'Ensures cross-fertilization'],
        ['Phloem Conduit', 'Companion & sieve cells', 'Translocation of sucrose', 'Supplies metabolic energy to roots']
      ]
    },
    conclusion: 'A plant operates as an interconnected, highly coordinated bio-system. Damage to any single organ (root desiccation, stem girdling, foliar blight) impairs the overall organism, demonstrating exquisite ecological balance.'
  },
  {
    id: 17,
    slug: 'multiplication_tables_mastery_1_12_solution.pdf',
    title: 'Multiplication Tables Mastery 1-12',
    subject: 'Mathematics',
    subjectCode: 'MATH101',
    className: 'Class 3 - Section A',
    score: 96,
    maxMarks: 100,
    instructions: 'Practice and record speed drill sheet for tables 6 through 12 with commutative and distributive proofs.',
    feedback: 'Outstanding analytical depth & speed! Commutative proofs and mental arithmetic decompositions are exemplary.',
    overview: 'Multiplication represents iterative equal-group addition and foundational algebraic scaling. Mastery of single and double-digit multiplication matrices (1×1 through 12×12) provides the mental arithmetic fluency mandatory for long division, prime factorization, and fraction manipulation.',
    corePoints: [
      {
        title: 'Commutative Property Proofs (a × b = b × a)',
        body: 'Multiplication order does not alter the product. Demonstrated geometrically using rectangular dot arrays: a 7 × 9 array contains 63 units, identical in area to a 9 × 7 array rotated by 90 degrees.'
      },
      {
        title: 'Distributive Property Mental Shortcuts',
        body: 'Decomposing challenging multipliers into friendly base-10 components: 8 × 12 = 8 × (10 + 2) = (8 × 10) + (8 × 2) = 80 + 16 = 96. 7 × 14 = 7 × (10 + 4) = 70 + 28 = 98. This eliminates rote memorization dependency.'
      },
      {
        title: 'Patterns in the 9s, 11s, and 12s Tables',
        body: 'Table of 9 exhibits the constant digit sum property (9 × 4 = 36 -> 3 + 6 = 9; 9 × 7 = 63 -> 6 + 3 = 9). Table of 11 exhibits twin repeated digits up to 99. Table of 12 represents composite step counting (10x + 2x).'
      }
    ],
    table: {
      headers: ['Multiplier Pair', 'Repeated Addition', 'Distributive Breakdown', 'Product', 'Mastery Speed'],
      rows: [
        ['7 × 8', '8 + 8 + 8 + 8 + 8 + 8 + 8', '(7 × 5) + (7 × 3) = 35 + 21', '56', '< 1.2 seconds'],
        ['9 × 6', '6 added 9 times', '(10 × 6) - (1 × 6) = 60 - 6', '54', '< 1.0 seconds'],
        ['12 × 7', '7 added 12 times', '(10 × 7) + (2 × 7) = 70 + 14', '84', '< 1.5 seconds'],
        ['8 × 9', '9 added 8 times', '(8 × 10) - (8 × 1) = 80 - 8', '72', '< 1.1 seconds'],
        ['12 × 12', '12 added 12 times', '(12 × 10) + (12 × 2) = 120 + 24', '144', '< 1.8 seconds']
      ]
    },
    conclusion: 'Instant recall of multiplication facts across tables 1 through 12 empowers young mathematicians to tackle multi-digit operations, estimation, and geometric area calculations with accuracy and speed.'
  },
  {
    id: 18,
    slug: 'solar_system_planetary_orbits_solution.pdf',
    title: 'Solar System & Planetary Orbits',
    subject: 'Environmental Studies',
    subjectCode: 'EVS101',
    className: 'Class 4 - Section A',
    score: 93,
    maxMarks: 100,
    instructions: 'Create a model or colorful diagram of the eight planets in order with orbital velocities and atmospheric features.',
    feedback: 'Outstanding astronomical depth! Superb comparative planetary analysis and clear orbital mechanics discussion.',
    overview: 'Our Solar System originated approximately 4.6 billion years ago from the gravitational collapse of a giant interstellar molecular gas cloud. Situated in the Orion Cygnus arm of the Milky Way, the system comprises a G-type main-sequence star (The Sun), four inner rocky terrestrial planets, an asteroid belt, four outer Jovian gas/ice giants, and the distant Kuiper Belt.',
    corePoints: [
      {
        title: 'The Central Star: Solar Energy & Gravitation',
        body: 'The Sun accounts for 99.86% of the total mass in the Solar System. Through nuclear fusion in its 15,000,000°C core, hydrogen nuclei fuse into helium, releasing 3.8 × 10²⁶ Watts of radiant energy that governs planetary thermal climates and retains bodies in Keplerian elliptical orbits.'
      },
      {
        title: 'Terrestrial Planets (Mercury, Venus, Earth, Mars)',
        body: 'Dense, silicate-metallic bodies. Mercury: cratered, atmosphere-less, extreme temperature swings (-180°C to 430°C). Venus: runaway greenhouse effect with 96% CO₂ atmosphere (surface 465°C). Earth: active hydrologic cycle and nitrogen-oxygen atmosphere sustaining life. Mars: iron oxide dust, thin CO₂ atmosphere, Olympus Mons volcano.'
      },
      {
        title: 'Jovian Giants (Jupiter, Saturn, Uranus, Neptune)',
        body: 'Massive hydrogen-helium and volatile ice giants. Jupiter: largest planet, Great Red Spot storm, 95 moons. Saturn: complex ring system composed of billions of water-ice particles. Uranus & Neptune: ice giants enriched in methane giving them vivid cyan and azure hues; Uranus rotates on a unique 98-degree axial tilt.'
      },
      {
        title: 'Kepler\'s Third Law of Planetary Motion',
        body: 'Planetary orbital periods scale with distance from the Sun (T² ∝ r³). Mercury orbits in a swift 88 Earth days at 47.4 km/s, whereas distant Neptune requires 164.8 Earth years at an orbital velocity of 5.4 km/s.'
      }
    ],
    table: {
      headers: ['Planet Name', 'Mean Distance (AU)', 'Orbital Period', 'Moons', 'Distinguishing Feature'],
      rows: [
        ['Mercury', '0.39 AU', '88 Earth Days', '0', 'Extreme thermal fluctuation (-180 to 430°C)'],
        ['Venus', '0.72 AU', '225 Earth Days', '0', 'Runaway greenhouse atmosphere, retrograde spin'],
        ['Earth', '1.00 AU', '365.25 Days', '1 (Moon)', 'Liquid water oceans & living biosphere'],
        ['Mars', '1.52 AU', '687 Earth Days', '2', 'Iron-oxide red soil, Olympus Mons volcano'],
        ['Jupiter', '5.20 AU', '11.86 Years', '95', 'Massive magnetosphere, Great Red Spot anticyclone'],
        ['Saturn', '9.58 AU', '29.45 Years', '146', 'Spectacular water-ice planetary ring system'],
        ['Uranus', '19.22 AU', '84.02 Years', '28', 'Extreme 98° axial tilt, methane atmosphere'],
        ['Neptune', '30.05 AU', '164.79 Years', '16', 'Supersonic winds exceeding 2,100 km/h']
      ]
    },
    conclusion: 'Planetary science illustrates the unique habitability of Earth within the circumstellar Goldilocks zone. Ongoing space exploration through robotic probes continually deepens our understanding of planetary evolution and potential extraterrestrial biosignatures.'
  },
  {
    id: 19,
    slug: 'fractions_and_division_basics_solution.pdf',
    title: 'Fractions and Division Basics',
    subject: 'Mathematics',
    subjectCode: 'MATH101',
    className: 'Class 4 - Section A',
    score: 91,
    maxMarks: 100,
    instructions: 'Divide given geometric shapes into halves, thirds, and quarters with equivalent fractions proofs.',
    feedback: 'Very good effort. Clear and organized geometric fractions models, accurate conversion of mixed numbers.',
    overview: 'A fraction denotes a numerical quantity representing equal parts of a partitioned unit whole or collection. Expressed in the rational form a/b (where b ≠ 0), the denominator designates the total number of congruent subdivisions, while the numerator specifies the count of selected parts.',
    corePoints: [
      {
        title: 'Classification: Proper, Improper & Mixed Numbers',
        body: 'Proper Fractions: Numerator < Denominator (e.g. 3/4, 5/8; value < 1). Improper Fractions: Numerator ≥ Denominator (e.g. 7/4; value ≥ 1). Mixed Fractions combine integers with a proper fraction: 7/4 converts to 1 and 3/4 via division with remainder.'
      },
      {
        title: 'Equivalent Fractions via Scaling Factors',
        body: 'Multiplying or dividing both numerator and denominator by an identical non-zero scalar preserves proportionality: 2/3 = (2×2)/(3×2) = 4/6 = (2×4)/(3×4) = 8/12. Verified geometrically using fraction strips and pizza disc models.'
      },
      {
        title: 'Addition & Subtraction of Unlike Fractions',
        body: 'Unlike fractions require finding the Least Common Denominator (LCD). Example: 2/5 + 1/3. LCD(5,3) = 15. Transform: (2×3)/15 + (1×5)/15 = 6/15 + 5/15 = 11/15. Complete algebraic working documented.'
      }
    ],
    table: {
      headers: ['Given Fraction', 'Fraction Category', 'Simplest Form', 'Decimal Equivalent', 'Percentage'],
      rows: [
        ['12 / 16', 'Proper Fraction', '3 / 4', '0.75', '75.0%'],
        ['15 / 10', 'Improper Fraction', '3 / 2 (or 1 1/2)', '1.50', '150.0%'],
        ['6 / 24', 'Proper Fraction', '1 / 4', '0.25', '25.0%'],
        ['18 / 6', 'Improper Fraction', '3 / 1 (Integer 3)', '3.00', '300.0%'],
        ['14 / 35', 'Proper Fraction', '2 / 5', '0.40', '40.0%']
      ]
    },
    conclusion: 'Fractional literacy bridges elementary whole-number arithmetic with proportional reasoning, algebraic slope calculations, and percentage mathematics encountered in higher education.'
  },
  {
    id: 20,
    slug: 'human_digestive_system_overview_solution.pdf',
    title: 'Human Digestive System Overview',
    subject: 'General Science',
    subjectCode: 'SCI101',
    className: 'Class 5 - Section A',
    score: 94,
    maxMarks: 100,
    instructions: 'Chart the path of food from mouth to stomach with annotations of enzymes, secretions, and villi absorption.',
    feedback: 'Outstanding physiological depth! Biochemical enzyme mapping and anatomical organ diagrams are clear and accurate.',
    overview: 'The human gastrointestinal tract is an eight-meter continuous muscular tube coordinating mechanical digestion and enzymatic chemical hydrolysis. Ingested macromolecular carbohydrates, proteins, and lipids are disassembled into absorbable monosaccharides, amino acids, and fatty acids to fuel cellular cellular respiration.',
    corePoints: [
      {
        title: 'Oral Cavity: Mastication & Salivary Amylase',
        body: 'Mechanical crushing by incisors and molars mixes food with saliva secreted by parotid, submandibular, and sublingual glands. Salivary Amylase (Ptyalin) initiates carbohydrate hydrolysis, converting cooked starches into maltose disaccharides at pH ~6.8, forming a soft lubricated bolus.'
      },
      {
        title: 'Esophagus & Peristaltic Propulsion',
        body: 'The bolus triggers the swallowing reflex, closing the cartilaginous epiglottis over the trachea. Rhythmic involuntary contractions of circular and longitudinal smooth muscles (peristalsis) propel food past the lower esophageal sphincter into the stomach.'
      },
      {
        title: 'Gastric Digestion in the Stomach',
        body: 'Gastric mucosa secretes 2-3 liters of gastric juice daily: Hydrochloric Acid (HCl, creating pH 1.5-2.0 to denature proteins and neutralize pathogens), Pepsinogen (cleaved by acid into active Pepsin to hydrolyze proteins into peptides), and protective alkaline mucus preventing gastric autodigestion.'
      },
      {
        title: 'Small Intestine: Enzymatic Breakdown & Villi Absorption',
        body: 'In the Duodenum, acidic chyme is neutralized by alkaline sodium bicarbonate from the Pancreas. Liver bile salts emulsify dietary lipids. Pancreatic Lipase, Trypsin, and Chymotrypsin complete digestion. Millions of microscopic finger-like projections called Villi and Microvilli amplify luminal surface area by 600-fold to maximize nutrient absorption into capillary and lacteal bloodstreams.'
      }
    ],
    table: {
      headers: ['Digestive Organ', 'Secreted Fluid / Enzyme', 'Target Substrate', 'End Product Formed'],
      rows: [
        ['Salivary Glands', 'Salivary Amylase (Ptyalin)', 'Complex Starch', 'Maltose & Dextrins'],
        ['Stomach Lining', 'Hydrochloric Acid + Pepsin', 'Dietary Proteins', 'Peptides & Polypeptides'],
        ['Liver / Gallbladder', 'Bile Salts & Pigments', 'Large Fat Globules', 'Emulsified Fat Droplets'],
        ['Exocrine Pancreas', 'Lipase, Trypsin, Amylase', 'Proteins, Fats, Starch', 'Fatty acids, Amino acids'],
        ['Small Intestine Villi', 'Erepsin, Maltase, Lactase', 'Oligosaccharides & Peptides', 'Glucose, Galactose, Amino acids']
      ]
    },
    conclusion: 'Digestion represents an integrated biological process where mechanical maceration and enzymatic hydrolysis convert ingested nourishment into bioavailable molecular precursors for metabolic energy and cellular maintenance.'
  },
  {
    id: 21,
    slug: 'geometry_perimeter_area_rectangles_solution.pdf',
    title: 'Geometry: Perimeter & Area of Rectangles',
    subject: 'Mathematics',
    subjectCode: 'MATH101',
    className: 'Class 5 - Section A',
    score: 89,
    maxMarks: 100,
    instructions: 'Measure and calculate perimeter & area of 5 household objects with unit conversion steps.',
    feedback: 'Very good effort. Clear and organized dimensional calculations. Unit conversions from cm to meters are sound.',
    overview: 'Two-dimensional Euclidean geometry distinguishes between linear boundary length (Perimeter, units: cm, m) and enclosed planar two-dimensional surface capacity (Area, units: cm², m²). This laboratory exercise applies empirical metric measurements across real-world rectangular household furnishings.',
    corePoints: [
      {
        title: 'Mathematical Formulations',
        body: 'For a rectangle of length l and width w: Perimeter P = 2(l + w) = 2l + 2w. Area A = l × w. For a square with side s: P = 4s, A = s². Documented dimensional consistency throughout arithmetic steps.'
      },
      {
        title: 'Specimen 1: Student Study Desk',
        body: 'Measured dimensions: Length l = 120 cm, Width w = 60 cm. Perimeter: P = 2(120 + 60) = 2(180) = 360 cm (3.60 meters). Area: A = 120 cm × 60 cm = 7,200 cm² = 0.72 m².'
      },
      {
        title: 'Specimen 2: Academic Mathematics Textbook',
        body: 'Measured dimensions: Length l = 28 cm, Width w = 21 cm. Perimeter: P = 2(28 + 21) = 2(49) = 98 cm. Area: A = 28 × 21 = 588 cm².'
      },
      {
        title: 'Specimen 3: Bedroom Window Glass Pane',
        body: 'Measured dimensions: Length l = 150 cm, Width w = 100 cm. Perimeter: P = 2(150 + 100) = 500 cm (5.0 m). Area: A = 150 × 100 = 15,000 cm² (1.50 m²).'
      }
    ],
    table: {
      headers: ['Object Measured', 'Length (l)', 'Width (w)', 'Perimeter: 2(l+w)', 'Area: (l × w)'],
      rows: [
        ['Study Table Surface', '120 cm (1.2 m)', '60 cm (0.6 m)', '360 cm (3.6 m)', '7,200 cm² (0.72 m²)'],
        ['Mathematics Textbook', '28 cm', '21 cm', '98 cm (0.98 m)', '588 cm² (0.0588 m²)'],
        ['Living Room Carpet', '300 cm (3.0 m)', '200 cm (2.0 m)', '1,000 cm (10.0 m)', '60,000 cm² (6.00 m²)'],
        ['Bedroom Window Pane', '150 cm (1.5 m)', '100 cm (1.0 m)', '500 cm (5.0 m)', '15,000 cm² (1.50 m²)'],
        ['Ceramic Floor Tile', '40 cm (0.4 m)', '40 cm (0.4 m)', '160 cm (1.6 m)', '1,600 cm² (0.16 m²)']
      ]
    },
    conclusion: 'Accurate differentiation between perimeter (fencing, framing, borders) and area (carpeting, painting, paving) is indispensable for practical civil engineering, architecture, and daily spatial budgeting.'
  },
  {
    id: 24,
    slug: 'acids_bases_natural_indicators_solution.pdf',
    title: 'Acids, Bases & Natural Indicators',
    subject: 'General Science',
    subjectCode: 'SCI101',
    className: 'Class 7 - Section A',
    score: 91,
    maxMarks: 100,
    instructions: 'Test turmeric, red cabbage, and litmus paper reactions with lemon juice, vinegar, soap, and lime water.',
    feedback: 'Very good effort. Clear and organized chemical logs, accurate pH color scale recordings, and balanced neutralization equations.',
    overview: 'Chemical substances display distinct acidic or alkaline characteristics based on their hydrogen ion (H⁺) or hydroxide ion (OH⁻) dissociation in aqueous solutions. Acid-base indicators are weak organic chromophores that undergo conformational color shifts at specific pH thresholds.',
    corePoints: [
      {
        title: 'Chemical Properties of Acids & Bases',
        body: 'Acids possess a sour taste, pH < 7, release H⁺(aq) ions, and turn blue litmus red (e.g. Citric acid in lemon, Acetic acid in vinegar, Hydrochloric acid in gastric juice). Bases feel slippery/soapy, pH > 7, release OH⁻(aq) ions, and turn red litmus blue (e.g. Sodium hydroxide in soap, Calcium hydroxide in lime water).'
      },
      {
        title: 'Natural Chromophore: Turmeric Extract (Curcumin)',
        body: 'Curcumin remains vibrant yellow in neutral and acidic solutions (lemon juice, vinegar, tap water). In basic solutions (baking soda slurry, liquid soap, detergent water), curcumin undergoes structural deprotonation above pH 8.5, shifting to a deep reddish-brown tone.'
      },
      {
        title: 'Anthocyanin Extraction: Red Cabbage Indicator',
        body: 'Red cabbage contains water-soluble anthocyanin pigments serving as a universal natural pH indicator: turns bright red in strong acids (pH 1-2), pink in weak acids (pH 3-5), purple in neutral solutions (pH 7), emerald green in weak bases (pH 8-10), and yellow in strong bases (pH > 11).'
      },
      {
        title: 'Neutralization Reactions & Everyday Applications',
        body: 'Acid + Base -> Salt + Water + Heat. HCl + NaOH -> NaCl + H₂O. Practical applications: Magnesium hydroxide (Milk of Magnesia) neutralizing excess gastric acidity; Calamine lotion (Zinc carbonate) soothing formic acid injected by ant stings; Slaked lime treating acidic agricultural soils.'
      }
    ],
    table: {
      headers: ['Tested Household Sample', 'Expected Chemical', 'Turmeric Color', 'Litmus Result', 'pH Type'],
      rows: [
        ['Fresh Lemon Juice', 'Citric Acid (C₆H₈O₇)', 'Stays Yellow', 'Blue Litmus -> Red', 'Acidic (pH ~2.2)'],
        ['White Kitchen Vinegar', 'Dilute Acetic Acid', 'Stays Yellow', 'Blue Litmus -> Red', 'Acidic (pH ~2.8)'],
        ['Laundry Detergent Slurry', 'Sodium Alkyl Sulfate', 'Deep Red-Brown', 'Red Litmus -> Blue', 'Basic (pH ~10.5)'],
        ['Baking Soda in Water', 'Sodium Bicarbonate', 'Reddish Orange', 'Red Litmus -> Blue', 'Mild Base (pH ~8.4)'],
        ['Pure Distilled Water', 'H₂O (Neutral)', 'Stays Yellow', 'No Color Change', 'Neutral (pH 7.0)']
      ]
    },
    conclusion: 'Natural pigments offer eco-friendly, non-toxic diagnostic indicators for classifying aqueous solutions, illustrating fundamental chemical equilibrium and neutralization principles.'
  },
  {
    id: 25,
    slug: 'algebraic_expressions_linear_equations_solution.pdf',
    title: 'Algebraic Expressions & Linear Equations',
    subject: 'Mathematics',
    subjectCode: 'MATH101',
    className: 'Class 7 - Section A',
    score: 88,
    maxMarks: 100,
    instructions: 'Solve practice exercise 4.2 focusing on variables, constants, balancing methods, and linear equations in one variable.',
    feedback: 'Very good effort. Clear and organized transposition steps. Word problem formulation is logically structured.',
    overview: 'Algebra generalizes arithmetic through the introduction of symbolic variables representing unknown quantities. A linear equation in one variable expresses an equality between two algebraic expressions of the first degree (ax + b = c, where a ≠ 0), solvable via systematic inverse operations and transposition.',
    corePoints: [
      {
        title: 'Variables, Coefficients & Polynomial Terminology',
        body: 'In 7x² - 5x + 12: x is the variable, 7 is the coefficient of x², -5 is the coefficient of x, and 12 is the numerical constant. Like terms share identical variable factors with equal exponents and can be combined algebraically.'
      },
      {
        title: 'Balance Method vs Transposition Rules',
        body: 'An equation acts as a balanced scale: operations applied to the LHS must be simultaneously applied to the RHS. Transposition shifts terms across the equality sign with sign inversion: addition becomes subtraction, multiplication becomes division.'
      },
      {
        title: 'Worked Example 1: Multi-Step Linear Equation',
        body: 'Solve: 5(2x - 3) - 3(x + 4) = 22. Expand brackets: 10x - 15 - 3x - 12 = 22. Combine like terms: 7x - 27 = 22. Transpose 27: 7x = 22 + 27 = 49. Divide by 7: x = 49 / 7 = 7. Verification: LHS = 5(11) - 3(11) = 55 - 33 = 22 = RHS.'
      },
      {
        title: 'Worked Example 2: Fractional Coefficients',
        body: 'Solve: (3x/4) - (x/2) = 5. Find common denominator (4): (3x - 2x)/4 = 5 -> x/4 = 5 -> x = 20. Verification confirms LHS = 15 - 10 = 5.'
      }
    ],
    table: {
      headers: ['Equation', 'Method Applied', 'Intermediate Step', 'Solution (x)', 'Verification (LHS = RHS)'],
      rows: [
        ['3x - 7 = 14', 'Transposition of -7', '3x = 21', 'x = 7', '3(7) - 7 = 14 (True)'],
        ['4(x + 2) = 28', 'Division by 4', 'x + 2 = 7', 'x = 5', '4(5 + 2) = 28 (True)'],
        ['2x + 9 = 5x - 6', 'Variable Isolation', '3x = 15', 'x = 5', '10 + 9 = 25 - 6 = 19 (True)'],
        ['(x / 3) + 4 = 9', 'Transposition of +4', 'x / 3 = 5', 'x = 15', '(15/3) + 4 = 9 (True)'],
        ['7x - (2x + 5) = 20', 'Bracket Expansion', '5x - 5 = 20 -> 5x = 25', 'x = 5', '35 - 15 = 20 (True)']
      ]
    },
    conclusion: 'Linear equations provide the foundational mathematical framework for expressing conservation laws, rate-time-distance dynamics, and economic equilibrium models in scientific disciplines.'
  },
  {
    id: 26,
    slug: 'microorganisms_friend_and_foe_solution.pdf',
    title: 'Microorganisms: Friend and Foe',
    subject: 'General Science',
    subjectCode: 'SCI101',
    className: 'Class 8 - Section A',
    score: 95,
    maxMarks: 100,
    instructions: 'Research bacterial fermentation in curd, yeast in baking, nitrogen fixation, and pathogen pathology.',
    feedback: 'Outstanding analytical depth & presentation! Microbial taxonomy, biochemical pathways, and epidemiological vectors are thoroughly explored.',
    overview: 'Microorganisms encompass microscopic single-celled or colonial living entities ubiquitous across Earth\'s biosphere. Categorized into Bacteria, Fungi, Protozoa, Algae, and Viruses, these agents maintain essential ecological nutrient cycling and industrial bio-processes, while concurrently posing pathogenic risks to human, animal, and plant vitality.',
    corePoints: [
      {
        title: 'Industrial Fermentation: Lactobacillus & Yeast',
        body: 'Lactobacillus bacteria ferment milk lactose sugar into lactic acid, dropping pH and coagulating casein proteins into curd. Yeast (Saccharomyces cerevisiae) executes anaerobic respiration in dough: C₆H₁₂O₆ -> 2C₂H₅OH + 2CO₂. Trapped carbon dioxide gas bubbles expand during baking, creating light, porous bread.'
      },
      {
        title: 'Nitrogen Cycle & Leguminous Bio-Fixation',
        body: 'Atmospheric nitrogen (N₂, 78%) is biologically unavailable to plants. Symbiotic Rhizobium bacteria dwelling within root nodules of legumes (peas, lentils, clover) fix N₂ into soluble ammonium and nitrates, replenishing soil fertility naturally without synthetic chemical fertilizers.'
      },
      {
        title: 'Pharmaceutical Discoveries: Antibiotics & Vaccines',
        body: 'Sir Alexander Fleming\'s 1928 discovery of Penicillin from Penicillium notatum mold revolutionized medicine. Antibiotics inhibit bacterial peptidoglycan cell-wall synthesis or protein translation. Vaccines introduce weakened or inactivated antigens to stimulate memory B-lymphocytes for long-term immune protection.'
      },
      {
        title: 'Pathogenic Microbes & Food Preservation Science',
        body: 'Microbial foes cause infectious diseases: Tuberculosis (Mycobacterium tuberculosis), Cholera (Vibrio cholerae), Malaria (Plasmodium vivax via female Anopheles mosquito vector). Food preservation techniques (Pasteurization at 72°C for 15s, vacuum canning, dehydration, salting, chemical sodium benzoate) eliminate spoilage.'
      }
    ],
    table: {
      headers: ['Microbe Name', 'Domain / Class', 'Beneficial / Pathogenic Role', 'Key Scientific Impact'],
      rows: [
        ['Lactobacillus acidophilus', 'Bacteria', 'Beneficial (Fermentation)', 'Curd production & gut probiotic microbiota'],
        ['Saccharomyces cerevisiae', 'Fungi (Yeast)', 'Beneficial (CO₂ Leavening)', 'Baking bread & brewing fermentation'],
        ['Rhizobium leguminosarum', 'Bacteria', 'Beneficial (Symbiosis)', 'Biological nitrogen fixation in root nodules'],
        ['Plasmodium vivax', 'Protozoa', 'Pathogenic (Malaria)', 'Ruptures human erythrocytes (red blood cells)'],
        ['Mycobacterium tuberculosis', 'Bacteria', 'Pathogenic (Tuberculosis)', 'Infects pulmonary alveoli through aerosol droplets']
      ]
    },
    conclusion: 'Microbiology illustrates the duality of nature: harnessable microbial metabolism underpins biotechnology and agriculture, while rigorous hygiene, sterilization, and vaccination guard public health against virulent infectious vectors.'
  },
  {
    id: 27,
    slug: 'fundamental_rights_indian_constitution_solution.pdf',
    title: 'Fundamental Rights in Indian Constitution',
    subject: 'Social Studies',
    subjectCode: 'SST101',
    className: 'Class 8 - Section A',
    score: 92,
    maxMarks: 100,
    instructions: 'Analyze the 6 fundamental rights with constitutional articles, landmark case precedents, and writ remedies.',
    feedback: 'Outstanding constitutional analysis! Thorough breakdown of Part III Articles and judicial writ remedies under Article 32.',
    overview: 'Part III (Articles 12 to 35) of the Constitution of India embodies the Fundamental Rights, described by Dr. B.R. Ambedkar as the most criticized yet indispensable bedrock of Indian constitutional democracy. Inspired by the American Bill of Rights, these rights guarantee civil liberties, equality before law, and protection against state arbitrariness.',
    corePoints: [
      {
        title: '1. Right to Equality (Articles 14 – 18)',
        body: 'Guarantees equality before the law and equal protection of laws (Art. 14); prohibits discrimination on grounds of religion, race, caste, sex, or place of birth (Art. 15); ensures equality of opportunity in public employment (Art. 16); abolishes untouchability (Art. 17); and abolishes non-military titles (Art. 18).'
      },
      {
        title: '2. Right to Freedom (Articles 19 – 22)',
        body: 'Article 19 protects six democratic freedoms: speech & expression, peaceful assembly, association, movement throughout India, residence, and trade/profession. Article 21 protects life and personal liberty, expanded through judicial interpretation to include right to privacy (Puttaswamy case), clean environment, and free elementary education (Art. 21A).'
      },
      {
        title: '3. Right against Exploitation (Articles 23 – 24)',
        body: 'Article 23 prohibits human trafficking and forced labor (begar). Article 24 prohibits employment of children below 14 years in hazardous industries, factories, and mines.'
      },
      {
        title: '4. Freedom of Religion & Cultural Rights (Articles 25 – 30)',
        body: 'Articles 25-28 uphold secularism, granting freedom of conscience and free profession, practice, and propagation of religion. Articles 29-30 protect linguistic and religious minorities in preserving their script, culture, and educational institutions.'
      },
      {
        title: '5. Right to Constitutional Remedies (Article 32)',
        body: 'Designated by Dr. Ambedkar as the "Heart and Soul of the Constitution", Article 32 empowers citizens to move the Supreme Court directly via prerogative writs: Habeas Corpus (unlawful detention), Mandamus (public duty performance), Prohibition (subordinate court jurisdiction), Certiorari (quashing orders), and Quo-Warranto (unlawful public office).'
      }
    ],
    table: {
      headers: ['Constitutional Right', 'Articles', 'Core Democratic Guarantee', 'Landmark Precedent'],
      rows: [
        ['Right to Equality', 'Articles 14 - 18', 'Abolition of discrimination & untouchability', 'Indra Sawhney (1992)'],
        ['Right to Freedom', 'Articles 19 - 22', 'Free speech, assembly, privacy, right to life', 'Maneka Gandhi (1978)'],
        ['Right against Exploitation', 'Articles 23 - 24', 'Ban on human trafficking & child labor', 'Bandhua Mukti Morcha (1984)'],
        ['Freedom of Religion', 'Articles 25 - 28', 'Secular freedom of conscience & worship', 'S.R. Bommai (1994)'],
        ['Constitutional Remedies', 'Article 32', 'Direct Supreme Court writ enforcement', 'Kesavananda Bharati (1973)']
      ]
    },
    conclusion: 'Fundamental Rights are not absolute but subject to reasonable restrictions in the interest of national sovereignty, public order, and morality. The proactive judiciary acts as the sentinel qui vive, guarding personal liberties against statutory encroachment.'
  },
  {
    id: 28,
    slug: 'newtons_laws_of_motion_analysis_solution.pdf',
    title: 'Newton\'s Laws of Motion Analysis',
    subject: 'Physics',
    subjectCode: 'PHY102',
    className: 'Class 9 - Section A',
    score: 94,
    maxMarks: 100,
    instructions: 'Document inertia, momentum, action-reaction, and linear momentum conservation with mathematical proofs.',
    feedback: 'Outstanding analytical depth & presentation! Free body diagrams, calculus derivatives, and collision problems are rigorously executed.',
    overview: 'Published in Sir Isaac Newton\'s 1687 Philosophiae Naturalis Principia Mathematica, the Three Classical Laws of Motion establish the dynamic relationship between material mass, applied net vector force, and resultant kinematic acceleration in inertial frames of reference.',
    corePoints: [
      {
        title: 'First Law: Law of Inertia',
        body: 'An object persists in its state of rest or uniform motion in a straight line unless acted upon by a non-zero net external force (∑F = 0 -> a = 0 -> v = const). Mass serves as the quantitative measure of inertia: inertia of rest (dust shaken from carpet), inertia of motion (forward lurch when bus brakes), and inertia of direction.'
      },
      {
        title: 'Second Law: Quantitative Force & Momentum',
        body: 'The time rate of change of linear momentum is directly proportional to the applied net force and acts along the force direction: F = dp/dt. Since p = mv, F = d(mv)/dt = m(dv/dt) = ma (for invariant mass). Impulse J = ∫F dt = ∆p explains why cricket players retract hands backward when catching high-velocity balls to increase collision time ∆t and minimize impact force.'
      },
      {
        title: 'Third Law: Action-Reaction Interaction Pairs',
        body: 'Whenever entity A exerts force F_AB on entity B, entity B simultaneously exerts an equal and opposite force F_BA on entity A: F_AB = -F_BA. Action and reaction forces act on separate interacting bodies, which is why they never cancel each other out (e.g. rocket exhaust thrust, swimmer kicking pool wall, gun recoil).'
      },
      {
        title: 'Principle of Conservation of Linear Momentum',
        body: 'In an isolated system devoid of external net forces (∑F_ext = 0), total linear momentum remains invariant: m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂. Applied in calculating bullet recoil velocity: V_gun = -(m_bullet × v_bullet) / M_gun.'
      }
    ],
    table: {
      headers: ['Law of Motion', 'Governing Equation', 'Physical Concept', 'Real-World Engineering Application'],
      rows: [
        ['Newton\'s 1st Law', '∑F = 0 ⇒ v = constant', 'Inertia of Mass', 'Automotive safety seatbelts & headrests'],
        ['Newton\'s 2nd Law', 'F = ma = dp/dt', 'Force, Momentum & Impulse', 'Crumple zones & airbags mitigating impact'],
        ['Newton\'s 3rd Law', 'F_AB = - F_BA', 'Equal & Opposite Interaction', 'Aerospace rocket propulsion & jet engines'],
        ['Momentum Conservation', 'P_initial = P_final', 'Invariance in Isolated Systems', 'Ballistic pendulum & particle accelerator collisions'],
        ['Impulse Theorem', 'J = F × ∆t = ∆p', 'Impact Force Modulation', 'Gymnastic crash mats & sports shoe cushioning']
      ]
    },
    conclusion: 'Newtonian dynamics forms the bedrock of classical mechanical engineering, astronautics, and structural design, maintaining predictive accuracy across non-relativistic terrestrial velocities.'
  },
  {
    id: 29,
    slug: 'quadratic_polynomial_factorization_solution.pdf',
    title: 'Quadratic Polynomial Factorization',
    subject: 'Mathematics',
    subjectCode: 'MATH101',
    className: 'Class 9 - Section A',
    score: 90,
    maxMarks: 100,
    instructions: 'Solve the 15 standard factorization and middle-term splitting questions with discriminant analysis.',
    feedback: 'Very good effort. Clear and organized factoring steps. Discriminant classification and graphical roots are thoroughly explained.',
    overview: 'A quadratic polynomial is a second-degree polynomial defined by P(x) = ax² + bx + c (a ≠ 0). Factoring factorizes the quadratic into linear binomial factors (px + q)(rx + s), identifying root solutions where the continuous parabolic curve intersects the horizontal Cartesian x-axis.',
    corePoints: [
      {
        title: 'Method of Middle-Term Splitting',
        body: 'To factor ax² + bx + c, identify two integers p and q such that p + q = b and pq = ac. Example: Factorize 6x² + 17x + 5. Here ac = 6 × 5 = 30, and b = 17. Integers 15 and 2 satisfy (15 × 2 = 30, 15 + 2 = 17). Rewrite: 6x² + 15x + 2x + 5 = 3x(2x + 5) + 1(2x + 5) = (2x + 5)(3x + 1).'
      },
      {
        title: 'Discriminant Analysis & Root Categorization',
        body: 'The discriminant D = b² - 4ac dictates root characteristics: D > 0 yields two distinct real rational/irrational roots; D = 0 yields two coincident (repeated) real roots (perfect square trinomial); D < 0 yields two complex conjugate roots with zero real x-axis intersections.'
      },
      {
        title: 'The Quadratic Formula Derivation',
        body: 'By completing the square on ax² + bx + c = 0: x² + (b/a)x = -c/a -> [x + b/(2a)]² = (b² - 4ac)/(4a²) -> x = [-b ± √(b² - 4ac)] / 2a. Verified across non-factorable irrational polynomials such as 2x² - 6x + 3 = 0.'
      }
    ],
    table: {
      headers: ['Quadratic Equation', 'Coefficients (a,b,c)', 'Discriminant D = b²-4ac', 'Binomial Factors', 'Real Roots (x)'],
      rows: [
        ['x² + 7x + 12 = 0', 'a=1, b=7, c=12', '49 - 48 = 1 (D > 0)', '(x + 3)(x + 4)', 'x = -3, -4'],
        ['2x² - 7x + 3 = 0', 'a=2, b=-7, c=3', '49 - 24 = 25 (D > 0)', '(2x - 1)(x - 3)', 'x = 1/2, 3'],
        ['4x² - 12x + 9 = 0', 'a=4, b=-12, c=9', '144 - 144 = 0 (D = 0)', '(2x - 3)²', 'x = 3/2 (Repeated)'],
        ['3x² + 5x - 2 = 0', 'a=3, b=5, c=-2', '25 + 24 = 49 (D > 0)', '(3x - 1)(x + 2)', 'x = 1/3, -2'],
        ['x² - 6x + 13 = 0', 'a=1, b=-6, c=13', '36 - 52 = -16 (D < 0)', 'Non-real linear factors', 'x = 3 ± 2i (Complex)']
      ]
    },
    conclusion: 'Quadratic algebra underpins kinematic projectile modeling, electrical impedance calculations, and architectural parabolic arch optimization in structural engineering.'
  },
  {
    id: 30,
    slug: 'trigonometric_heights_distances_solution.pdf',
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
  {
    id: 31,
    slug: 'carbon_versatile_compounds_solution.pdf',
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
  {
    id: 32,
    slug: 'kinematics_projectile_motion_calculations_solution.pdf',
    title: 'Kinematics & Projectile Motion Calculations',
    subject: 'Physics',
    subjectCode: 'PHY102',
    className: 'Class 11 - Section A',
    score: 96,
    maxMarks: 100,
    instructions: 'Derive trajectory equation, maximum height, time of flight, and horizontal range with vector calculus integration.',
    feedback: 'Outstanding kinematic mastery! Mathematical derivations, vector decomposition, and range proofs are flawless.',
    overview: 'Two-dimensional projectile motion examines the parabolic trajectory of a particle launched into a gravitational field with initial velocity u at angle θ relative to the horizontal datum. Assuming negligible atmospheric drag and uniform gravitational acceleration (g = 9.80 m/s² directed downwards), orthogonal horizontal and vertical motions decouple completely.',
    corePoints: [
      {
        title: 'Orthogonal Vector Component Decomposition',
        body: 'Initial velocity u resolves into: Horizontal component u_x = u cos θ (constant velocity, a_x = 0); Vertical component u_y = u sin θ (uniformly accelerated, a_y = -g). At any elapsed time t: x(t) = (u cos θ)t, y(t) = (u sin θ)t - 1/2 gt².'
      },
      {
        title: 'Derivation of the Parabolic Trajectory Equation',
        body: 'Substituting t = x / (u cos θ) into the vertical position equation yields: y = (u sin θ)[x / (u cos θ)] - 1/2 g[x / (u cos θ)]² -> y = x tan θ - [g / (2u² cos² θ)] x². Since this conforms to the standard second-degree conic form y = Ax - Bx², the physical trajectory is strictly a parabola.'
      },
      {
        title: 'Time of Flight (T) & Maximum Height (H)',
        body: 'At peak apex, instantaneous vertical velocity v_y = 0 -> u sin θ - gt_apex = 0 -> t_apex = (u sin θ)/g. Total Time of Flight T = 2 t_apex = (2u sin θ)/g. Maximum Vertical Elevation H = (u² sin² θ) / (2g).'
      },
      {
        title: 'Horizontal Range (R) & Optimum Launch Angle',
        body: 'Horizontal Range R = u_x × T = (u cos θ) × [(2u sin θ)/g] = [u² (2 sin θ cos θ)] / g = (u² sin 2θ) / g. For a fixed velocity u, range is maximized when sin 2θ = 1 -> 2θ = 90° -> θ = 45°. Furthermore, complementary launch angles (θ and 90° - θ) yield identical horizontal ranges.'
      }
    ],
    table: {
      headers: ['Launch Angle (θ)', 'Initial Velocity (u)', 'Time of Flight (T)', 'Max Height (H)', 'Horizontal Range (R)'],
      rows: [
        ['30° Launch', '40 m/s', '4.08 seconds', '20.4 meters', '141.3 meters'],
        ['45° Optimum Launch', '40 m/s', '5.77 seconds', '40.8 meters', '163.2 meters (Max)'],
        ['60° Complementary', '40 m/s', '7.07 seconds', '61.2 meters', '141.3 meters (Identical)'],
        ['15° Shallow Angle', '50 m/s', '2.64 seconds', '8.6 meters', '127.5 meters'],
        ['75° Steep Angle', '50 m/s', '9.86 seconds', '119.0 meters', '127.5 meters (Identical)']
      ]
    },
    conclusion: 'Vector decoupling in Newtonian kinematics demonstrates that independent perpendicular spatial dimensions can be analyzed separately and synthesized via vector addition, underpinning aerospace ballistic trajectory computation.'
  },
  {
    id: 33,
    slug: 'python_data_structures_algorithm_design_solution.pdf',
    title: 'Python Data Structures & Algorithm Design',
    subject: 'Computer Science & AI',
    subjectCode: 'CSC101',
    className: 'Class 11 - Section A',
    score: 97,
    maxMarks: 100,
    instructions: 'Write clean Python programs for binary search, dictionary hash lookups, and recursive quicksort with Big-O complexity.',
    feedback: 'Outstanding algorithmic depth! Clean PEP-8 compliant code, comprehensive docstrings, and asymptotic Big-O proofs.',
    overview: 'Computer science couples algorithmic computational procedures with structured memory organization. This laboratory dossier analyzes fundamental abstract data types (lists, tuples, hash tables/dictionaries, stacks, queues) and asymptotic Big-O algorithmic performance across searching and sorting paradigms in Python 3.11.',
    corePoints: [
      {
        title: 'Linear vs Binary Search & Logarithmic Complexity',
        body: 'Linear Search evaluates elements sequentially with O(N) worst-case time complexity. Binary Search operates on pre-sorted arrays utilizing a divide-and-conquer paradigm: inspecting the midpoint, discarding half the search interval iteratively: T(N) = T(N/2) + O(1) -> O(log₂ N). For N = 1,000,000 items, binary search terminates within ≤ 20 comparisons.'
      },
      {
        title: 'Python Binary Search Implementation',
        body: 'def binary_search(arr, target):\n    low, high = 0, len(arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target: return mid\n        elif arr[mid] < target: low = mid + 1\n        else: high = mid - 1\n    return -1'
      },
      {
        title: 'Hash Tables & Python Dictionary Internal Architecture',
        body: 'Python dictionaries utilize dynamic open-addressing hash tables. Keys pass through a cryptographic-grade hash function hash(key) to generate array indices. Average lookup, insertion, and deletion achieve O(1) constant time complexity, backed by quadratic collision probing.'
      },
      {
        title: 'Recursive Quicksort with Hoare Partitioning',
        body: 'Quicksort selects a pivot, partitions elements into sub-arrays less than and greater than the pivot, and recursively sorts sub-problems. Average time complexity: O(N log N). In-place space efficiency: O(log N) call stack frames.'
      }
    ],
    table: {
      headers: ['Algorithm / Structure', 'Best Case Time', 'Average Case Time', 'Worst Case Time', 'Space Complexity'],
      rows: [
        ['Linear Search', 'O(1)', 'O(N)', 'O(N)', 'O(1) Aux'],
        ['Binary Search (Sorted)', 'O(1)', 'O(log N)', 'O(log N)', 'O(1) Iterative'],
        ['Bubble / Insertion Sort', 'O(N)', 'O(N²)', 'O(N²)', 'O(1) In-place'],
        ['Quicksort (Hoare Pivot)', 'O(N log N)', 'O(N log N)', 'O(N² - Bad Pivot)', 'O(log N) Stack'],
        ['Hash Table Lookup (Dict)', 'O(1)', 'O(1)', 'O(N - Collisions)', 'O(N) Storage']
      ]
    },
    conclusion: 'Algorithmic efficiency dictating Big-O asymptotic scalability separates viable real-time software systems from computationally intractable implementations in big data and AI environments.'
  },
  {
    id: 34,
    slug: 'electromagnetic_induction_faradays_laws_solution.pdf',
    title: 'Electromagnetic Induction & Faraday\'s Laws',
    subject: 'Physics',
    subjectCode: 'PHY102',
    className: 'Class 12 - Section A',
    score: 95,
    maxMarks: 100,
    instructions: 'Solve numericals on Lenz\'s law, magnetic flux, mutual inductance, and alternating current generator kinematics.',
    feedback: 'Outstanding electromagnetic theory! Maxwell-Faraday vector calculus and AC sinusoidal derivations are exceptionally well executed.',
    overview: 'Electromagnetic induction, discovered independently by Michael Faraday in 1831 and Joseph Henry, describes the generation of an electromotive force (EMF) across an electrical conductor situated in a time-varying magnetic field or moving through a spatial magnetic flux gradient.',
    corePoints: [
      {
        title: 'Magnetic Flux & Faraday\'s Quantitative Law',
        body: 'Magnetic flux Φ_B passing through surface area A in uniform magnetic field B is: Φ_B = ∫ B · dA = B A cos θ (measured in Webers, Wb). Faraday\'s First Law states that any temporal variation in magnetic flux induces an EMF. Faraday\'s Second Law dictates that the magnitude of induced EMF is proportional to the time rate of change of flux: E = -N (dΦ_B / dt).'
      },
      {
        title: 'Lenz\'s Law & Conservation of Energy Principle',
        body: 'The negative sign in Faraday\'s law embodies Lenz\'s Law (Heinrich Lenz, 1834): the polarity of induced EMF generates an electric current whose secondary magnetic field opposes the primary magnetic flux change that produced it. If induced current reinforced the flux change, infinite energy would arise from zero external input, violating the First Law of Thermodynamics.'
      },
      {
        title: 'Motional EMF in Conducting Rods',
        body: 'When a conducting rod of length L moves with transverse velocity v through a perpendicular uniform magnetic field B, Lorentz force (F = q(v × B)) drives free conduction electrons toward one end, establishing an induced potential difference: E = B L v.'
      },
      {
        title: 'AC Generator Operating Principle',
        body: 'An armature coil of N turns rotated at uniform angular frequency ω within magnetic field B experiences sinusoidally alternating flux: Φ_B(t) = B A cos(ωt). The induced EMF is E(t) = -N d[BA cos(ωt)]/dt = N B A ω sin(ωt) = E_0 sin(ωt), yielding alternating current.'
      }
    ],
    table: {
      headers: ['Electromagnetic Metric', 'Symbol', 'SI Unit', 'Governing Equation', 'Physical Role'],
      rows: [
        ['Magnetic Flux', 'Φ_B', 'Weber (Wb = T·m²)', 'Φ_B = B · A = BA cos θ', 'Total field lines through surface'],
        ['Induced Electromotive Force', 'E', 'Volt (V)', 'E = -N (dΦ_B / dt)', 'Drives induced electric current'],
        ['Motional EMF', 'E_m', 'Volt (V)', 'E_m = B L v sin θ', 'Arises from Lorentz charge separation'],
        ['Self Inductance', 'L', 'Henry (H = Wb/A)', 'E = -L (dI / dt)', 'Electromagnetic inertia of coil'],
        ['Mutual Inductance', 'M', 'Henry (H)', 'E_2 = -M (dI_1 / dt)', 'Energy transfer in step-up transformers']
      ]
    },
    conclusion: 'Faraday\'s electromagnetic induction constitutes the technological foundation of modern electrical power grids, transformers, induction motors, and wireless electromagnetic telemetry.'
  },
  {
    id: 35,
    slug: 'macroeconomics_national_income_accounting_solution.pdf',
    title: 'Macroeconomics: National Income Accounting',
    subject: 'Economics',
    subjectCode: 'ECO101',
    className: 'Class 12 - Section A',
    score: 93,
    maxMarks: 100,
    instructions: 'Calculate GDP, GNP, NNP at factor cost and market prices from Indian macroeconomic dataset with identity proofs.',
    feedback: 'Outstanding macroeconomic analysis! Circular flow identities, value-added calculations, and GDP deflators are accurate.',
    overview: 'National Income Accounting provides a comprehensive statistical framework for measuring the aggregate economic performance, production volume, and income distribution of a nation over a specified fiscal period. It models the circular flow of goods, services, and factor payments between households, enterprises, government, and external foreign sectors.',
    corePoints: [
      {
        title: 'The Circular Flow of Economic Activity',
        body: 'In an open macroeconomic economy, total output equals total income equals total expenditure: Y = C + I + G + (X - M). Factor services (land, labor, capital, entrepreneurship) flow from households to firms; factor rewards (rent, wages, interest, profit) flow conversely from firms to households.'
      },
      {
        title: 'Three Measurement Methodologies',
        body: '1. Value Added (Product) Method: Sum of Gross Value Added (GVA = Gross Output - Intermediate Consumption) across primary, secondary, and tertiary industries. 2. Income Method: Compensation of Employees + Operating Surplus (Rent, Interest, Profit) + Mixed Income of Self-Employed. 3. Expenditure Method: Private Final Consumption (C) + Gross Capital Formation (I) + Government Purchases (G) + Net Exports (X - M).'
      },
      {
        title: 'Converting GDP to National Income (NNP_FC)',
        body: 'Gross Domestic Product at Market Price (GDP_MP) -> Deduct Depreciation (Consumption of Fixed Capital) = NDP_MP. Add Net Factor Income from Abroad (NFIA) = NNP_MP. Deduct Net Indirect Taxes (NIT = Indirect Taxes - Subsidies) = Net National Product at Factor Cost (NNP_FC = National Income).'
      },
      {
        title: 'Nominal GDP, Real GDP & The GDP Deflator',
        body: 'Nominal GDP measures output at prevailing current market prices; Real GDP measures output at constant base-year prices, neutralizing the distortive impact of inflation. GDP Deflator = (Nominal GDP / Real GDP) × 100, reflecting economy-wide inflationary pressure.'
      }
    ],
    table: {
      headers: ['Economic Aggregate', 'Accounting Formula', 'Sample Metric (₹ Cr)', 'Economic Interpretation'],
      rows: [
        ['GDP at Market Price', 'C + I + G + (X - M)', '₹ 280,00,000 Cr', 'Total gross value of domestic production'],
        ['NDP at Market Price', 'GDP_MP - Depreciation', '₹ 252,00,000 Cr', 'Net domestic output after asset wear'],
        ['GNP at Market Price', 'GDP_MP + NFIA', '₹ 277,50,000 Cr', 'Gross output produced by domestic citizens'],
        ['NNP at Market Price', 'GNP_MP - Depreciation', '₹ 249,50,000 Cr', 'Net national output at market valuation'],
        ['National Income (NNP_FC)', 'NNP_MP - Net Indirect Taxes', '₹ 224,50,000 Cr', 'Actual factor income accrued to citizens']
      ]
    },
    conclusion: 'National income aggregates serve as indispensable benchmarks for fiscal budgetary planning, monetary policy setting by central banks, and evaluating per capita living standards across global economies.'
  },
  {
    id: 8,
    slug: 'ai_python_neural_network_lab_solution.pdf',
    title: 'AI Python Neural Network Lab',
    subject: 'AI',
    subjectCode: 'AI1000',
    className: 'Class 12 - Section A',
    score: 98,
    maxMarks: 100,
    instructions: 'Implement a Multi-Layer Perceptron (MLP) from scratch with backpropagation, gradient descent, and cross-entropy loss.',
    feedback: 'Exceptional deep learning implementation! Mathematical matrix derivatives and tensor operations are brilliantly constructed.',
    overview: 'Artificial Neural Networks (ANNs) model complex non-linear mappings inspired by biological neuro-synaptic architectures. This laboratory assignment details the implementation of a Multi-Layer Perceptron (MLP) classifier constructed with raw NumPy tensor operations, validating backpropagation and stochastic gradient descent on MNIST handwritten digit benchmarks.',
    corePoints: [
      {
        title: 'Forward Propagation & Matrix Transformations',
        body: 'Given input vector x ∈ ℝᴰ, layer activations compute via affine transformations followed by non-linear activations: z^[l] = W^[l] a^[l-1] + b^[l], a^[l] = g(z^[l]). Hidden layers deploy Rectified Linear Units (ReLU: g(z) = max(0, z)), while output layers deploy Softmax: σ(z)_i = e^(z_i) / ∑ e^(z_j).'
      },
      {
        title: 'Cross-Entropy Loss Function',
        body: 'For multiclass classification over C discrete categories, the negative log-likelihood objective loss is: L = - 1/M ∑ ∑ y_k log(y_hat_k). Minimizing cross-entropy maximizes the posterior probability assigned to ground-truth label classes.'
      },
      {
        title: 'Backpropagation via Chain Rule Derivatives',
        body: 'Error gradients propagate backward through the computational graph: ∂L/∂z^[2] = a^[2] - y. Weight gradients: ∂L/∂W^[2] = (1/M) (∂L/∂z^[2]) (a^[1])ᵀ. Hidden layer error: ∂L/∂z^[1] = (W^[2])ᵀ (∂L/∂z^[2]) ⊙ g\'(z^[1]). Parameter updates follow Adam optimizer momentum rules.'
      }
    ],
    table: {
      headers: ['Neural Network Layer', 'Tensor Dimensions', 'Activation Function', 'Parameters (Weights + Biases)', 'Gradient Norm'],
      rows: [
        ['Input Layer (x)', '(784, Batch)', 'Identity', '0 parameters', 'N/A'],
        ['Hidden Layer 1 (h1)', '(256, Batch)', 'ReLU: max(0, z)', '784 × 256 + 256 = 200,960', '0.0024'],
        ['Hidden Layer 2 (h2)', '(128, Batch)', 'ReLU: max(0, z)', '256 × 128 + 128 = 32,896', '0.0018'],
        ['Output Layer (y_hat)', '(10, Batch)', 'Softmax (Probabilities)', '128 × 10 + 10 = 1,290', '0.0009'],
        ['Total Network Graph', 'N/A', 'Cross-Entropy Objective', '235,146 Trainable Parameters', 'Converged (98.4% Acc)']
      ]
    },
    conclusion: 'Constructing neural networks from fundamental matrix equations illuminates the mechanics of gradient flow, vanishing gradient mitigation, and hyperparameter optimization essential for modern deep learning engineering.'
  },
  {
    id: 10,
    slug: 'python_computer_vision_lab_solution.pdf',
    title: 'Python Computer Vision Lab',
    subject: 'AI',
    subjectCode: 'AI1000',
    className: 'Class 12 - Section A',
    score: 49,
    maxMarks: 50,
    instructions: 'Develop an automated OpenCV edge detection, contour localization, and Haar-cascade face detection pipeline.',
    feedback: 'Outstanding computer vision pipeline! Clean image kernel convolution mathematics and OpenCV implementations.',
    overview: 'Computer vision enables autonomous machines to extract, process, and analyze structured high-dimensional information from digital imagery. This lab dossier documents spatial domain filtering, Sobel/Canny gradient edge detection, and Haar-feature facial landmark detection using Python and OpenCV.',
    corePoints: [
      {
        title: 'Image Representation & Grayscale Spatial Kernels',
        body: 'Digital RGB images represent 3D matrices I(x, y, c) ∈ [0, 255]. Converted to luminance grayscale via perceptual weighting: Y = 0.299R + 0.587G + 0.114B. Gaussian blurring applies a 5×5 spatial convolution kernel to suppress high-frequency sensor noise.'
      },
      {
        title: 'Canny Multi-Stage Edge Detection Pipeline',
        body: '1. Smooth image with 2D Gaussian filter. 2. Compute spatial gradients using Sobel operators G_x and G_y, obtaining magnitude G = √(G_x² + G_y²) and direction θ = arctan(G_y / G_x). 3. Non-Maximum Suppression thins edges along gradient normals. 4. Hysteresis Thresholding preserves strong edges while filtering spurious artifacts.'
      },
      {
        title: 'Contour Boundary Tracing & Bounding Box Fitting',
        body: 'Extracted binary topological contours using Suzuki\'s border-following algorithm. Computed polygon perimeters, convex hulls, and oriented minimum bounding rectangles for localized object detection.'
      }
    ],
    table: {
      headers: ['Processing Stage', 'OpenCV Function', 'Kernel / Parameter', 'Output Dimension', 'Computational Latency'],
      rows: [
        ['Gaussian Smoothing', 'cv2.GaussianBlur', 'Kernel: (5, 5), σ=1.4', '1920 × 1080 (1 Channel)', '2.1 ms'],
        ['Sobel Spatial Gradients', 'cv2.Sobel', 'dx=1, dy=1, ksize=3', '1920 × 1080 (Float32)', '3.4 ms'],
        ['Canny Hysteresis Edge', 'cv2.Canny', 'Thresholds: (50, 150)', '1920 × 1080 (Binary 0/255)', '4.8 ms'],
        ['Topological Contours', 'cv2.findContours', 'RETR_EXTERNAL, CHAIN_APPROX', '142 Detected Blobs', '1.9 ms'],
        ['Haar Face Detection', 'cv2.CascadeClassifier', 'scaleFactor=1.1, minNeighbors=5', '3 Faces Localized', '18.2 ms']
      ]
    },
    conclusion: 'Spatial image processing and edge convolution provide foundational preprocessing pipelines for convolutional neural networks (CNNs), robotics, and automated visual inspection systems.'
  },
  {
    id: 11,
    slug: 'tqm_total_quality_management_solution.pdf',
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
  },
  {
    slug: 'algebra_quadratic_equations_unit3_solution.pdf',
    title: 'Algebra & Quadratic Equations - Unit 3 Assignment',
    subject: 'Mathematics',
    subjectCode: 'MATH101',
    className: 'Class 10 - Section A',
    score: 95,
    maxMarks: 100,
    instructions: 'Solve all exercises from 3.1 to 3.5 showing all working steps clearly with quadratic formulas and graphs.',
    feedback: 'Outstanding mathematical rigor! Clear working steps, factorization proofs, and parabola vertex calculations.',
    overview: 'Unit 3 investigates quadratic polynomial equations, algebraic factoring techniques, completing the square, quadratic formula derivations, and geometric interpretations of parabolic functions. This dossier provides the comprehensive step-by-step solution manual for exercises 3.1 through 3.5.',
    corePoints: [
      {
        title: 'Exercise 3.1: Identification & Standard Form Conversion',
        body: 'Standard form: ax² + bx + c = 0 (a ≠ 0). Transformed (2x - 1)(x - 3) = (x + 5)(x - 1) -> 2x² - 7x + 3 = x² + 4x - 5 -> x² - 11x + 8 = 0. Here a = 1, b = -11, c = 8.'
      },
      {
        title: 'Exercise 3.2: Factorization & Middle Term Splitting',
        body: 'Solve: √2 x² + 7x + 5√2 = 0. Product ac = √2 × 5√2 = 10; sum b = 7. Splitting factors: 5 and 2. √2 x² + 2x + 5x + 5√2 = 0 -> √2 x(x + √2) + 5(x + √2) = 0 -> (x + √2)(√2 x + 5) = 0. Roots: x = -√2 and x = -5/√2.'
      },
      {
        title: 'Exercise 3.3: Method of Completing the Square',
        body: 'Solve: 2x² - 5x + 3 = 0. Divide by 2: x² - (5/2)x = -3/2. Add [5/4]² to both sides: [x - 5/4]² = 25/16 - 24/16 = 1/16. Take square root: x - 5/4 = ± 1/4. Roots: x = 6/4 = 3/2 and x = 4/4 = 1.'
      },
      {
        title: 'Exercise 3.4 & 3.5: Real-World Word Problems & Nature of Roots',
        body: 'Problem: The diagonal of a rectangular field is 60m more than the shorter side. If the longer side is 30m more than the shorter side, find field sides. Let shorter side = x. Longer side = x + 30. Diagonal = x + 60. By Pythagoras: (x + 60)² = x² + (x + 30)². Expands to: x² - 60x - 2700 = 0 -> (x - 90)(x + 30) = 0. Since length > 0, x = 90m, longer side = 120m, diagonal = 150m.'
      }
    ],
    table: {
      headers: ['Exercise Problem', 'Algebraic Equation', 'Solution Method', 'Computed Roots', 'Verification'],
      rows: [
        ['Ex 3.1 #4', 'x² - 11x + 8 = 0', 'Quadratic Formula', 'x = (11 ± √89) / 2', 'Discriminant D = 89 > 0'],
        ['Ex 3.2 #2', '√2 x² + 7x + 5√2 = 0', 'Middle Term Splitting', 'x = -√2, -5/√2', 'Product of roots = 5'],
        ['Ex 3.3 #1', '2x² - 5x + 3 = 0', 'Completing the Square', 'x = 1.5, 1.0', 'Exact integer fractional roots'],
        ['Ex 3.4 #3', '2x² + kx + 3 = 0', 'Equal Roots Condition (D=0)', 'k = ± 2√6', 'k² - 24 = 0 -> k = ±√24'],
        ['Ex 3.5 #2', 'x² - 60x - 2700 = 0', 'Factoring Dimensions', 'x = 90 meters', 'Sides: 90m by 120m, Diag 150m']
      ]
    },
    conclusion: 'Mastery of quadratic equations synthesizes geometric coordinate graphing, algebraic factorization, and practical optimization modeling required across STEM disciplines.'
  }
];

// PDF generation function
function generatePDF(meta, destPaths) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 36, bottom: 36, left: 40, right: 40 },
      bufferPages: true
    });

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      destPaths.forEach(fp => {
        fs.writeFileSync(fp, pdfData);
      });
      resolve(destPaths[0]);
    });
    doc.on('error', reject);

    const primaryColor = '#0F2942';
    const accentGold = '#D97706';
    const accentGreen = '#059669';
    const textColor = '#1E293B';
    const lightBg = '#F8FAFC';
    const borderColor = '#CBD5E1';

    function drawHeader() {
      doc.rect(40, 36, 515, 64).fill(primaryColor);
      doc.fillColor('#FFFFFF').fontSize(16).font('Helvetica-Bold')
         .text('APEX INTERNATIONAL ACADEMY', 55, 48);
      doc.fillColor('#94A3B8').fontSize(8.5).font('Helvetica')
         .text('CBSE Senior Secondary Affiliation No. 1930482 | Academic Excellence & Research Division', 55, 68);
      doc.fillColor(accentGold).fontSize(9).font('Helvetica-Bold')
         .text('OFFICIAL ACADEMIC SOLUTION & EVALUATION DOSSIER', 55, 80);

      doc.roundedRect(420, 48, 120, 24, 6).fill(accentGreen);
      doc.fillColor('#FFFFFF').fontSize(8.5).font('Helvetica-Bold')
         .text('VERIFIED & GRADED', 420, 56, { width: 120, align: 'center' });
    }

    function drawMetaCard() {
      const startY = 110;
      doc.roundedRect(40, startY, 515, 75, 8).fillAndStroke(lightBg, borderColor);

      doc.fillColor(textColor).fontSize(10).font('Helvetica-Bold')
         .text('ASSIGNMENT:', 52, startY + 12);
      doc.fillColor(primaryColor).fontSize(10.5).font('Helvetica-Bold')
         .text(meta.title, 140, startY + 11, { width: 390 });

      doc.fillColor(textColor).fontSize(9).font('Helvetica-Bold')
         .text('SUBJECT:', 52, startY + 32);
      doc.fillColor('#334155').fontSize(9).font('Helvetica')
         .text(`${meta.subject} (${meta.subjectCode})`, 115, startY + 32);

      doc.fillColor(textColor).fontSize(9).font('Helvetica-Bold')
         .text('CLASS & SECTION:', 290, startY + 32);
      doc.fillColor('#334155').fontSize(9).font('Helvetica')
         .text(meta.className || 'Class 6 - Section A', 400, startY + 32);

      doc.fillColor(textColor).fontSize(9).font('Helvetica-Bold')
         .text('ACADEMIC YEAR:', 52, startY + 50);
      doc.fillColor('#334155').fontSize(9).font('Helvetica')
         .text('2025 - 2026', 150, startY + 50);

      doc.fillColor(textColor).fontSize(9).font('Helvetica-Bold')
         .text('MARKS EVALUATED:', 290, startY + 50);
      doc.fillColor(accentGreen).fontSize(9.5).font('Helvetica-Bold')
         .text(`${meta.score} / ${meta.maxMarks} (Grade A)`, 410, startY + 50);
    }

    function drawSectionHeading(title, y) {
      doc.rect(40, y, 4, 18).fill(primaryColor);
      doc.fillColor(primaryColor).fontSize(11.5).font('Helvetica-Bold')
         .text(title, 50, y + 2);
      return y + 24;
    }

    function drawCallout(text, y) {
      doc.roundedRect(40, y, 515, 40, 6).fillAndStroke('#FEF3C7', '#F59E0B');
      doc.fillColor('#78350F').fontSize(8.5).font('Helvetica-Bold')
         .text('TEACHER DIRECTIVE & PROBLEM FOCUS:', 52, y + 7);
      doc.fillColor('#92400E').fontSize(8).font('Helvetica')
         .text(text, 52, y + 19, { width: 490 });
      return y + 48;
    }

    // --- PAGE 1 ---
    drawHeader();
    drawMetaCard();

    let curY = 195;
    curY = drawCallout(meta.instructions, curY);

    curY = drawSectionHeading('1. Executive Overview & Problem Context', curY);
    doc.fillColor(textColor).fontSize(8.8).font('Helvetica').lineGap(2.5)
       .text(meta.overview, 40, curY, { width: 515, align: 'justify' });
    curY = doc.y + 12;

    curY = drawSectionHeading('2. Core Analysis, Solutions & Systematic Working', curY);
    for (const item of meta.corePoints) {
      if (curY > 710) {
        doc.addPage();
        drawHeader();
        curY = 115;
      }
      doc.fillColor(primaryColor).fontSize(9.2).font('Helvetica-Bold')
         .text(`• ${item.title}:`, 45, curY);
      curY = doc.y + 2;
      doc.fillColor(textColor).fontSize(8.5).font('Helvetica').lineGap(2)
         .text(item.body, 55, curY, { width: 500, align: 'justify' });
      curY = doc.y + 7;
    }

    // --- PAGE 2 ---
    doc.addPage();
    drawHeader();
    curY = 115;

    curY = drawSectionHeading('3. Detailed Data Matrix & Systematic Findings', curY);
    
    if (meta.table && meta.table.headers && meta.table.rows) {
      const colWidth = 515 / meta.table.headers.length;
      
      doc.rect(40, curY, 515, 20).fill(primaryColor);
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      meta.table.headers.forEach((h, idx) => {
        doc.text(h, 45 + (idx * colWidth), curY + 5, { width: colWidth - 10, align: 'left' });
      });
      curY += 20;

      meta.table.rows.forEach((row, rIdx) => {
        const bg = (rIdx % 2 === 0) ? '#FFFFFF' : '#F8FAFC';
        doc.rect(40, curY, 515, 20).fillAndStroke(bg, '#E2E8F0');
        doc.fillColor(textColor).fontSize(7.8).font('Helvetica');
        row.forEach((cell, cIdx) => {
          doc.text(cell, 45 + (cIdx * colWidth), curY + 5, { width: colWidth - 10, align: 'left' });
        });
        curY += 20;
      });
      curY += 14;
    }

    curY = drawSectionHeading('4. Student Conclusions & Reflective Synthesis', curY);
    doc.fillColor(textColor).fontSize(8.8).font('Helvetica').lineGap(2.5)
       .text(meta.conclusion, 40, curY, { width: 515, align: 'justify' });
    curY = doc.y + 14;

    curY = drawSectionHeading('5. Official Faculty Evaluation & Grading Rubric', curY);
    
    const rubricBoxY = curY;
    doc.roundedRect(40, rubricBoxY, 515, 110, 8).fillAndStroke('#F0FDF4', '#86EFAC');

    doc.fillColor('#166534').fontSize(9.5).font('Helvetica-Bold')
       .text('ASSESSMENT CRITERIA BREAKDOWN', 55, rubricBoxY + 10);

    const rubricItems = [
      ['Conceptual Clarity & Factual Accuracy:', '28 / 30'],
      ['Analytical Depth & Research Methodology:', '28 / 30'],
      ['Problem Solving & Structured Working:', '18 / 20'],
      ['Presentation, Organization & Neatness:', '14 / 20']
    ];

    rubricItems.forEach((r, idx) => {
      const rx = (idx < 2) ? 55 : 300;
      const ry = rubricBoxY + 28 + ((idx % 2) * 15);
      doc.fillColor('#334155').fontSize(8.2).font('Helvetica-Bold').text(r[0], rx, ry);
      doc.fillColor('#059669').fontSize(8.2).font('Helvetica-Bold').text(r[1], rx + 175, ry);
    });

    doc.moveTo(55, rubricBoxY + 64).lineTo(540, rubricBoxY + 64).strokeColor('#86EFAC').stroke();

    doc.fillColor('#15803D').fontSize(8.5).font('Helvetica-Bold')
       .text('FACULTY FEEDBACK REMARK:', 55, rubricBoxY + 72);
    doc.fillColor('#166534').fontSize(8.2).font('Helvetica-Oblique')
       .text(`"${meta.feedback}"`, 55, rubricBoxY + 84, { width: 340 });

    doc.roundedRect(415, rubricBoxY + 70, 130, 30, 4).fillAndStroke('#DCFCE7', '#22C55E');
    doc.fillColor('#15803D').fontSize(7).font('Helvetica-Bold')
       .text('APEX EVALUATION DIVISION', 415, rubricBoxY + 74, { width: 130, align: 'center' });
    doc.fillColor('#166534').fontSize(8).font('Helvetica-Bold')
       .text('VERIFIED & ARCHIVED', 415, rubricBoxY + 86, { width: 130, align: 'center' });

    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.moveTo(40, 800).lineTo(555, 800).strokeColor('#CBD5E1').stroke();
      doc.fillColor('#94A3B8').fontSize(7.5).font('Helvetica')
         .text('Apex International Academy • Academic Assignment Solution Archive • Internal Document', 40, 806);
      doc.text(`Page ${i + 1} of ${pages.count}`, 480, 806, { width: 75, align: 'right' });
    }

    doc.end();
  });
}

// Generate all PDFs
async function run() {
  console.log(`Starting generation of ${assignmentSolutions.length} solution PDFs...`);
  
  for (const item of assignmentSolutions) {
    const paths = targetDirs.map(d => path.join(d, item.slug));
    await generatePDF(item, paths);
    console.log(`✓ Generated: ${item.slug} (${item.title})`);
  }

  console.log('\nAll PDF files generated successfully into:');
  targetDirs.forEach(d => console.log('  -', d));
}

run().catch(console.error);
