// All page content lives here. Edit this file to update projects, milestones and skills.

export const featured = [
  {
    code: 'PTH', name: 'Pathlight', year: '2026', status: 'live', statusText: 'Live',
    tagline: 'Autonomous career and opportunity intelligence.',
    desc: 'My solo capstone. Pathlight watches a student’s whole professional picture (resumes, placement emails, skills, deadlines) and surfaces ranked opportunities, skill gaps, prep plans and application tracking on its own. An event-driven agentic system with MCP tool access at its core, not a chatbot and not a resume grader.',
    stack: ['FastAPI', 'LangGraph', 'MCP', 'ChromaDB', 'MongoDB', 'Next.js', 'Docker'],
    notes: [
      'Five LangGraph agents, with plain rules deciding everything a rule can decide before any LLM is called.',
      'Never applies on its own: every application waits for the student to approve the tailored resume, and a code-level check rejects any resume that invents a skill.',
      'Measured, not assumed: an eval harness scores the agents (eligibility: 87.5% accuracy, zero false positives), backed by 287 automated tests.'
    ],
    live: 'https://pathlight-iota.vercel.app', repo: 'https://github.com/amarthya-14/pathlight',
    shot: '/work/pathlight.webp'
  },
  {
    code: 'SCN', name: 'Scanline', year: '2026', status: 'live', statusText: 'Live',
    tagline: 'A document summary agent you can watch think.',
    desc: 'Drop in a PDF or a scanned image. The agent pulls the text, falls back to OCR when there is no text layer, and works its way to a summary, showing every step live instead of a spinner. It all runs in the browser; only the extracted text leaves the device.',
    stack: ['React', 'Vite', 'Tailwind', 'pdf.js', 'Tesseract.js', 'Gemini 2.5 Flash', 'Groq · Llama'],
    notes: [
      'Structured output through one emit_summary tool with a strict schema.',
      'Gemini first, Groq as automatic fallback on the same schema.',
      'No backend to host or pay for.'
    ],
    live: 'https://unthink-document.vercel.app', repo: 'https://github.com/amarthya-14/Unthink_Document',
    shot: '/work/scanline.webp'
  },
  {
    code: 'LNP', name: 'Leanplate', year: '2026', status: 'live', statusText: 'Live',
    tagline: 'A fat-loss planner built around a hostel mess menu.',
    desc: 'Diet plans assume you control your kitchen. In a hostel you eat what the mess serves. Leanplate starts from that menu and plans fat loss around it.',
    stack: [],
    notes: ['Built for a constraint I live with every day.'],
    live: 'https://leanplate.vercel.app', repo: '',
    shot: '/work/leanplate.webp'
  }
];

export const more = [
  {
    code: 'KRS', name: 'Krishi-Agent', year: '2026', status: 'classic', statusText: 'Team',
    desc: 'Team capstone: a Telugu voice assistant for farmers that weighs crop disease, weather and mandi prices into one answer. I redesigned the UI as Telugu-first and fixed the Weather Agent.',
    stack: ['FastAPI', 'PyTorch', 'Ollama'],
    live: '', repo: 'https://github.com/harikharreddy/krishi-agent'
  },
  {
    code: 'PFT', name: 'PEFT Telugu Bench', year: '2026', status: 'build', statusText: 'In build',
    desc: 'LoRA vs DoRA vs QLoRA: fine-tuning a small LLM on Telugu and measuring what each method costs and buys.',
    stack: ['PyTorch', 'Transformers', 'PEFT'],
    live: '', repo: 'https://github.com/amarthya-14/peft-telugu-bench'
  },
  {
    code: 'QTM', name: 'Quotation Manager', year: '2025–26', status: 'live', statusText: 'Live',
    desc: 'Quotation software for SM Enterprises, a home-theatre business. Built for a real client, deployed on Azure.',
    stack: ['JavaScript', 'Azure'],
    live: 'https://sm-enterprices-theta.vercel.app', repo: 'https://github.com/amarthya-14/SM-Enterprices'
  },
  {
    code: 'CHF', name: 'AI Chef', year: '2025', status: 'live', statusText: 'Live',
    desc: 'List the ingredients you have and a Hugging Face model suggests a recipe. My first AI integration.',
    stack: ['React', 'Hugging Face'],
    live: 'https://ai-chef-sandy.vercel.app', repo: 'https://github.com/amarthya-14/Ai-Chef'
  },
  {
    code: 'PLT', name: 'Plants API', year: '2025', status: 'live', statusText: 'Live',
    desc: 'A Spring Boot REST API for a plant catalogue, including PUT and DELETE. My first backend.',
    stack: ['Java', 'Spring Boot'],
    live: '', repo: 'https://github.com/amarthya-14/Plants-DataBase'
  },
  {
    code: 'ASM', name: 'Assembly: Endgame', year: '2025', status: 'classic', statusText: 'Classic',
    desc: 'Guess the word before every programming language gets wiped out. Built learning React state.',
    stack: ['React'], live: '', repo: 'https://github.com/amarthya-14/Assembly_Endgame'
  },
  {
    code: 'TNZ', name: 'Tenzies', year: '2025', status: 'classic', statusText: 'Classic',
    desc: 'Hold the dice you want and keep rolling until all ten match.',
    stack: ['React'], live: '', repo: 'https://github.com/amarthya-14/Tenzies'
  },
  {
    code: 'JKP', name: 'Jackpot', year: '2025', status: 'classic', statusText: 'Classic',
    desc: 'One of my first browser games, from the summer I started building with JavaScript.',
    stack: ['JavaScript'], live: '', repo: 'https://github.com/amarthya-14/Jackpot'
  }
];

// f = position of the corner along the track path (0–1)
export const milestones = [
  { f: 0.115, corner: 'Sainte Dévote', when: 'Sep 2024', title: 'On the grid', text: 'Opened my GitHub account and started building in public.' },
  { f: 0.205, corner: 'Casino', when: 'Jun 2025', title: 'First backend', text: 'Learned Git properly with Codédex, then shipped a Spring Boot REST API.' },
  { f: 0.285, corner: 'Mirabeau', when: 'Jun 2025', title: 'First model in an app', text: 'AI Chef: a React app that asks a Hugging Face model for recipes.' },
  { f: 0.40, corner: 'Grand Hotel Hairpin', when: 'Jul 2025', title: 'React, three times over', text: 'Tenzies, Jackpot and Assembly: Endgame in a single month with Scrimba.' },
  { f: 0.52, corner: 'Portier', when: 'Jul 2025', title: 'First real client', text: 'Started the Quotation Manager for SM Enterprises, a home-theatre business.' },
  { f: 0.63, corner: 'Nouvelle Chicane', when: 'Jun 2026', title: 'Back in the garage', text: 'Rebuilt and redeployed Quotation Manager, AI Chef and the Plants API.' },
  { f: 0.76, corner: 'Piscine', when: 'Aug 2026', title: 'Scanline ships', text: 'An agentic document summarizer with OCR fallback, entirely in the browser.' },
  { f: 0.88, corner: 'Rascasse', when: 'Aug–Oct 2026', title: 'Pathlight', text: 'Solo capstone on LangGraph and MCP. Live, with an eval harness and 287 tests.' }
];

// Capabilities, read as the systems of a car. `part` picks the region of the car that lights up.
export const setup = [
  { part: 'power', label: 'Power unit', title: 'AI', line: 'The agents and models that do the thinking.', items: [['LangGraph', 'Pathlight'], ['MCP', 'Pathlight'], ['Gemini API', 'Scanline'], ['Groq · Llama', 'Scanline'], ['Hugging Face', 'AI Chef']] },
  { part: 'chassis', label: 'Chassis', title: 'Languages', line: 'What everything else is built on.', items: [['Python', 'Agents · APIs'], ['Java', 'Spring Boot'], ['TypeScript', 'Frontends'], ['JavaScript', 'Frontends']] },
  { part: 'aero', label: 'Aerodynamics', title: 'Web', line: 'The surfaces people actually touch.', items: [['React', 'Scanline'], ['Next.js', 'Pathlight'], ['Spring Boot', 'Plants API'], ['FastAPI', 'Pathlight'], ['Tailwind', 'Scanline']] },
  { part: 'telemetry', label: 'Telemetry', title: 'Data & cloud', line: 'Where the data lives and the code runs.', items: [['MongoDB', 'Data'], ['Supabase', 'Data'], ['Docker', 'Pathlight'], ['AWS', 'Certified'], ['Azure', 'Quotation Mgr']] }
];
