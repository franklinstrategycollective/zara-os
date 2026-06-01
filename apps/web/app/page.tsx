"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  Activity,
  FileText,
  Database,
  Cpu,
  ShieldAlert,
  User,
  Calendar,
  ArrowRight,
  Lock,
  RefreshCw,
  Search,
  Fingerprint,
  FileCode,
  TrendingUp,
  MessageSquare,
  Sparkles,
  Shield,
  Clock,
  ExternalLink,
  ChevronRight,
  Server,
  Mic,
  Send,
  BookOpen,
  Layers,
  AlertCircle,
  FilePlus,
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  Check,
  X,
  FileCheck
} from "lucide-react";

// Web Crypto helper for SHA-256
async function generateHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface LogBlock {
  blockId: number;
  timestamp: string;
  agent: string;
  payload: string;
  previousHash: string;
  currentHash: string;
  isTampered?: boolean;
}

const INITIAL_LOGS_DATA = [
  {
    blockId: 1,
    timestamp: "2026-06-01T00:01:12.450Z",
    agent: "System Core",
    payload: "SYSTEM_INITIALIZE: Node 'cf-edge-dfw-01' activated. Synchronizing D1 SQLite Audit Ledger.",
    previousHash: "0000000000000000000000000000000000000000000000000000000000000000"
  },
  {
    blockId: 2,
    timestamp: "2026-06-01T00:02:15.112Z",
    agent: "Intake Agent",
    payload: "PATIENT_VERIFY: Verified patient Robert Chen (DOB: 09/20/1990) against EHR registry.",
    previousHash: ""
  },
  {
    blockId: 3,
    timestamp: "2026-06-01T00:02:15.234Z",
    agent: "Triage Agent",
    payload: "CLINICAL_TRIAGE: Patient Robert Chen symptom input classified as ROUTINE (ADMINISTRATIVE).",
    previousHash: ""
  },
  {
    blockId: 4,
    timestamp: "2026-06-01T00:02:15.890Z",
    agent: "Scheduling Agent",
    payload: "CALENDAR_BOOK: Annual wellness examination booked for 2026-06-09T14:00:00Z under Dr. Edwards.",
    previousHash: ""
  }
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"clinical" | "console" | "ledger" | "adrs" | "thesis">("clinical");
  const [clinicalSubTab, setClinicalSubTab] = useState<"chart" | "scribe" | "autopilot" | "referral" | "knowledge" | "metrics">("chart");

  // --- Core State ---
  const [ledger, setLedger] = useState<LogBlock[]>([]);
  const [ledgerVerified, setLedgerVerified] = useState<boolean | null>(null);
  const [tamperedIndex, setTamperedIndex] = useState<number | null>(null);

  // --- Presets & General Call Simulator State ---
  const [patientInput, setPatientInput] = useState("");
  const [simulationStep, setSimulationStep] = useState<"idle" | "intake" | "triage" | "scheduling" | "escalation" | "complete">("idle");
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [intakeOutput, setIntakeOutput] = useState<{ name: string; dob: string; ssnFiltered: boolean } | null>(null);
  const [triageOutput, setTriageOutput] = useState<{ classification: "URGENT" | "ROUTINE" | "ADMIN"; score: number; notes: string } | null>(null);
  const [schedOutput, setSchedulingOutput] = useState<{ slot: string; booked: boolean } | null>(null);
  const [escalationOutput, setEscalationOutput] = useState<{ notifyOnCall: boolean; reason: string } | null>(null);

  // --- Agent Z (Clinical Assistant) State ---
  const [selectedMed, setSelectedMed] = useState<string>("");
  const [medCheckResult, setMedCheckResult] = useState<null | {
    status: "danger" | "warning" | "success" | "info";
    title: string;
    text: string;
    rules: string[];
    alternative?: string;
  }>(null);

  // --- Agent A (Ambient Scribe) State ---
  const [scribeStatus, setScribeStatus] = useState<"idle" | "recording" | "transcribing" | "generating" | "complete">("idle");
  const [scribeTranscript, setScribeTranscript] = useState<Array<{ time: string; speaker: string; text: string }>>([]);
  const [scribeSOAP, setScribeSOAP] = useState<{ subjective: string; objective: string; assessment: string; plan: string } | null>(null);
  const [waveformActive, setWaveformActive] = useState(false);
  const [customScribeInput, setScribeInput] = useState("");

  // --- Agent P (Post-Visit Autopilot) State ---
  const [autopilotStatus, setAutopilotStatus] = useState<"idle" | "running" | "ready" | "completed">("idle");
  const [signedDocs, setSignedDocs] = useState<string[]>([]);
  const [activeDocTab, setActiveDocTab] = useState<"discharge" | "refill" | "billing" | "referral">("discharge");

  // --- Agent R (Referral Specialist) State ---
  const [referralSpecialist, setReferralSpecialist] = useState<string>("Dr. David Vance, MD (Cardiology)");
  const [referralStatus, setReferralStatus] = useState<"idle" | "assembling" | "compiled" | "sending" | "sent">("idle");
  const [referralPagesSent, setReferralPagesSent] = useState(0);
  const [referralLogs, setReferralLogs] = useState<string[]>([]);

  // --- Agent M (Super Knowledge Engine) State ---
  const [knowledgeQuery, setKnowledgeQuery] = useState("");
  const [knowledgeResult, setKnowledgeResult] = useState<null | {
    answer: string;
    citations: Array<{ id: string; type: "pubmed" | "chembl" | "clinicaltrials"; title: string; snippet: string }>;
  }>(null);
  const [selectedCitation, setSelectedCitation] = useState<null | {
    id: string;
    type: string;
    title: string;
    snippet: string;
    abstract?: string;
    eligibility?: string;
    url?: string;
  }>(null);

  // --- Agent M (Super Knowledge Engine) Live Streaming States ---
  const [knowledgeStreamingAnswer, setKnowledgeStreamingAnswer] = useState("");
  const [knowledgeLogs, setKnowledgeLogs] = useState<string[]>([]);
  const [knowledgeIsSearching, setKnowledgeIsSearching] = useState(false);
  const [knowledgeTokensPerSec, setKnowledgeTokensPerSecond] = useState(0);

  // Load and hash initial ledger
  useEffect(() => {
    async function initLedger() {
      const logs: LogBlock[] = [];
      let lastHash = INITIAL_LOGS_DATA[0].previousHash;
      
      for (const raw of INITIAL_LOGS_DATA) {
        const content = `${raw.blockId}|${raw.timestamp}|${raw.agent}|${raw.payload}|${lastHash}`;
        const currentHash = await generateHash(content);
        logs.push({
          ...raw,
          previousHash: lastHash,
          currentHash
        });
        lastHash = currentHash;
      }
      setLedger(logs);
    }
    initLedger();
  }, []);

  // --- Handlers & Simulators ---
  
  // Tab 1 Presets
  const presets = [
    {
      id: 1,
      title: "Urgent: Sudden Chest Pain",
      text: "I am having sudden heavy pressure on my chest and left arm pain. My name is Marcus Miller, DOB 11/12/1974. Please schedule a visit immediately.",
      badge: "Urgent",
      color: "border-red-500/30 text-red-400 bg-red-950/20"
    },
    {
      id: 2,
      title: "Routine: Medication Refill (SSN Filter)",
      text: "Need to refill my Metformin 500mg prescription. My SSN is XXX-XX-XXXX. I'm Sarah Jenkins, born 05/03/1982.",
      badge: "SSN Scan",
      color: "border-teal-500/30 text-teal-400 bg-teal-950/20"
    },
    {
      id: 3,
      title: "Admin: Routine Scheduling",
      text: "Hello, looking to book my yearly medical physical exam for next Tuesday afternoon. I'm Robert Chen, DOB 09/20/1990.",
      badge: "Scheduling",
      color: "border-purple-500/30 text-purple-400 bg-purple-950/20"
    }
  ];

  const handleSelectPreset = (p: typeof presets[0]) => {
    setSelectedPreset(p.id);
    setPatientInput(p.text);
    resetSimulation();
  };

  const resetSimulation = () => {
    setSimulationStep("idle");
    setSimLogs([]);
    setIntakeOutput(null);
    setTriageOutput(null);
    setSchedulingOutput(null);
    setEscalationOutput(null);
  };

  const runSimulation = async () => {
    if (!patientInput.trim()) return;
    
    resetSimulation();
    setSimulationStep("intake");
    setSimLogs(prev => [...prev, "⚡ [Intake Agent] Initiating patient intake pipeline..."]);
    await delay(800);

    const ssnPattern = /\d{3}-\d{2}-\d{4}/g;
    const hasSSN = ssnPattern.test(patientInput);
    const redactedInput = patientInput.replace(ssnPattern, "[REDACTED-PHI]");

    let name = "Unknown";
    let dob = "Unknown";
    if (patientInput.includes("Marcus Miller")) { name = "Marcus Miller"; dob = "11/12/1974"; }
    else if (patientInput.includes("Sarah Jenkins")) { name = "Sarah Jenkins"; dob = "05/03/1982"; }
    else if (patientInput.includes("Robert Chen")) { name = "Robert Chen"; dob = "09/20/1990"; }
    else { name = "Extracted Patient Profile"; dob = "Parsed DOB"; }

    setIntakeOutput({ name, dob, ssnFiltered: hasSSN });
    setSimLogs(prev => [
      ...prev,
      `✅ [Intake Agent] Extracted Name: "${name}", DOB: "${dob}"`,
      hasSSN ? `⚠️ [Intake Agent] SSN Pattern Detected! Redacted payload to: "${redactedInput.substring(0, 60)}..."` : `✅ [Intake Agent] Data Privacy Scan complete. Zero raw identifiers leaked.`
    ]);

    await delay(1000);
    setSimulationStep("triage");
    setSimLogs(prev => [...prev, "⚡ [Triage Agent] Analyzing clinical severity using nemotron-3-120b and triage criteria..."]);
    await delay(1000);

    let classification: "URGENT" | "ROUTINE" | "ADMIN" = "ADMIN";
    let score = 20;
    let triageNotes = "Routine scheduling request.";

    if (patientInput.toLowerCase().includes("chest pain") || patientInput.toLowerCase().includes("pressure")) {
      classification = "URGENT"; score = 95;
      triageNotes = "RED FLAG: High cardiac risk symptoms. Potential Myocardial Infarction. Route to emergency triage immediately.";
    } else if (patientInput.toLowerCase().includes("refill") || patientInput.toLowerCase().includes("metformin")) {
      classification = "ROUTINE"; score = 45;
      triageNotes = "Routine medication refill verification required.";
    } else {
      classification = "ADMIN"; score = 15;
      triageNotes = "Routine scheduling inquiry.";
    }

    setTriageOutput({ classification, score, notes: triageNotes });
    setSimLogs(prev => [
      ...prev,
      `🏥 [Triage Agent] Symptom Classification: ${classification} (Severity: ${score}/100)`,
      `🏥 [Triage Agent] Clinician Note: "${triageNotes}"`
    ]);

    await delay(1000);
    setSimulationStep("scheduling");
    setSimLogs(prev => [...prev, "⚡ [Scheduling Agent] Accessing EHR & Google Calendar availability matrix via secure APIs..."]);
    await delay(1000);

    let booked = false;
    let slot = "No slots booked";

    if (classification === "URGENT") {
      booked = false;
      slot = "SCHEDULING_BLOCKED: Patient must seek immediate emergency medical care.";
      setSimLogs(prev => [...prev, `🚨 [Scheduling Agent] Scheduling blocked due to emergency triage flag. Escalation protocol override triggered.`]);
    } else if (classification === "ROUTINE") {
      booked = true;
      slot = "2026-06-03 at 10:15 AM (Refill Review)";
      setSimLogs(prev => [...prev, `📅 [Scheduling Agent] Refill consultation scheduled: ${slot}`]);
    } else {
      booked = true;
      slot = "2026-06-09 at 2:00 PM (Wellness Exam)";
      setSimLogs(prev => [...prev, `📅 [Scheduling Agent] Booking confirmed: ${slot}`]);
    }
    setSchedulingOutput({ slot, booked });

    await delay(800);
    setSimulationStep("escalation");
    setSimLogs(prev => [...prev, "⚡ [Escalation Agent] Checking routing directives and team-on-call calendar..."]);
    await delay(800);

    const notifyOnCall = classification === "URGENT";
    const escReason = notifyOnCall 
      ? "EMERGENCY_DISPATCH: Pager and secure SMS dispatched to Dr. Edwards and clinical supervisor." 
      : "NORMAL_QUEUING: Forwarded task to standard clinician portal inbox.";

    setEscalationOutput({ notifyOnCall, reason: escReason });
    setSimLogs(prev => [
      ...prev,
      notifyOnCall ? `🚨 [Escalation Agent] EMERGENCY ALARM DISPATCHED to Dr. Jessica Edwards` : `✅ [Escalation Agent] Task logged to standard clinician queue.`,
      `🔒 [System] Assembling HIPAA Cryptographic Audit Trail entry...`
    ]);

    await delay(1000);
    setSimulationStep("complete");
    await commitToLedger("AI Receptionist", `PATIENT_CALL_SIM: Processed call for ${name}. Triage: ${classification}, SSN Filtered: ${hasSSN}. Audit Signature Committed.`);
    setSimLogs(prev => [
      ...prev,
      `✅ [D1 Audit Ledger] Audit log committed and cryptographically sealed.`,
      `🏆 [Simulation] Complete! Dynamic Worker isolate safely hibernated ($0 runtime cost saved).`
    ]);
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // --- Cryptographic Commit Helper ---
  const commitToLedger = async (agentName: string, payloadContent: string) => {
    if (ledger.length === 0) return;
    const lastBlock = ledger[ledger.length - 1];
    const timestamp = new Date().toISOString();
    const newBlockId = lastBlock.blockId + 1;
    const blockContent = `${newBlockId}|${timestamp}|${agentName}|${payloadContent}|${lastBlock.currentHash}`;
    const newHash = await generateHash(blockContent);

    const newBlock: LogBlock = {
      blockId: newBlockId,
      timestamp,
      agent: agentName,
      payload: payloadContent,
      previousHash: lastBlock.currentHash,
      currentHash: newHash
    };
    setLedger(prev => [...prev, newBlock]);
  };

  // Ledger Verification Helper
  const verifyLedgerIntegrity = async (currentLedger: LogBlock[]) => {
    let isValid = true;
    let failedIdx: number | null = null;

    for (let i = 0; i < currentLedger.length; i++) {
      const block = currentLedger[i];
      let expectedPrevHash = "0000000000000000000000000000000000000000000000000000000000000000";
      
      if (i > 0) {
        expectedPrevHash = currentLedger[i - 1].currentHash;
      }

      if (block.previousHash !== expectedPrevHash) {
        isValid = false; failedIdx = i; break;
      }

      const content = `${block.blockId}|${block.timestamp}|${block.agent}|${block.payload}|${block.previousHash}`;
      const calculatedHash = await generateHash(content);

      if (block.currentHash !== calculatedHash) {
        isValid = false; failedIdx = i; break;
      }
    }

    setLedgerVerified(isValid);
    if (!isValid && failedIdx !== null) {
      setTamperedIndex(failedIdx);
    } else {
      setTamperedIndex(null);
    }
  };

  // Tampering Simulation
  const tamperLedger = () => {
    if (ledger.length < 3) return;
    const tamperedCopy = [...ledger];
    const targetBlock = { ...tamperedCopy[2] };
    targetBlock.payload = "CLINICAL_TRIAGE: Malicious Tamper: Alter patient clinical record, setting narcotic refill approval to 1000mg Morphine.";
    targetBlock.isTampered = true;
    tamperedCopy[2] = targetBlock;
    
    setLedger(tamperedCopy);
    setLedgerVerified(null);
    setTamperedIndex(null);
  };

  const restoreLedger = async () => {
    const logs: LogBlock[] = [];
    let lastHash = INITIAL_LOGS_DATA[0].previousHash;
    
    for (const raw of INITIAL_LOGS_DATA) {
      const content = `${raw.blockId}|${raw.timestamp}|${raw.agent}|${raw.payload}|${lastHash}`;
      const currentHash = await generateHash(content);
      logs.push({
        ...raw,
        previousHash: lastHash,
        currentHash
      });
      lastHash = currentHash;
    }
    setLedger(logs);
    setLedgerVerified(null);
    setTamperedIndex(null);
  };

  // --- Agent Z: Prescription Audits ---
  const handleMedCheck = (medName: string) => {
    setSelectedMed(medName);
    if (medName === "lisinopril") {
      setMedCheckResult({
        status: "danger",
        title: "CRITICAL CONTRAINDICATION (RULE-008: CARDIOVASCULAR SAFETY)",
        text: "Marcus Miller has a documented severe allergic history of ANGIOEDEMA triggered by Lisinopril/ACE Inhibitors. Re-prescribing ACE Inhibitors carries a high risk of life-threatening laryngeal edema, respiratory compromise, and airway collapse.",
        rules: ["HIPAA Section 164.312(b) Security Standard", "ONC HTI-1 (b)(11) Decision Support Compliance", "ADR-008: Automated Clinical Safety Guardrails"],
        alternative: "Consider Angiotensin Receptor Blockers (ARBs) like Losartan, which demonstrate <1% cross-reactivity, or Calcium Channel Blockers (e.g., Amlodipine)."
      });
    } else if (medName === "amoxicillin") {
      setMedCheckResult({
        status: "warning",
        title: "ALLERGY ADVISORY (CROSS-SENSITIVITY DETECTED)",
        text: "Patient has a documented history of 'mild skin rash' allergy to Penicillin G. Amoxicillin is a beta-lactam antibiotic. The cross-reactivity rate is approximately 5-10%. Monitor patient closely during first dose or prescribe a non-beta-lactam alternative.",
        rules: ["EHR Allergy Reconciliation Protocol v2", "ADR-008: Drug-Allergy Safety Filter"]
      });
    } else if (medName === "losartan") {
      setMedCheckResult({
        status: "info",
        title: "REASONED ALTERNATIVE CLEARED",
        text: "Losartan 50mg oral tablet daily cleared for prescribing. Marcus Miller's historical angioedema is ACE-inhibitor specific. ARBs like Losartan show no statistically significant cross-reactivity and are highly recommended as clinical alternatives.",
        rules: ["ACC/AHA Hypertension Guideline 2024", "Zara OS Smart Alternative Selector"]
      });
    } else {
      setMedCheckResult({
        status: "success",
        title: "CLINICAL CLEARANCE PASSED",
        text: "Metoprolol Succinate 50mg daily is fully cleared. No drug-drug interactions detected with Spironolactone, Metformin, or Atorvastatin. No drug-allergy interactions detected for Marcus Miller.",
        rules: ["Standard FHIR Interoperability Check", "Medplum Drug Interaction Engine"]
      });
    }
  };

  // --- Agent A: Scribe Capture & SOAP note Generation ---
  const startScribe = async () => {
    setScribeStatus("recording");
    setWaveformActive(true);
    setScribeTranscript([]);
    setScribeSOAP(null);

    const dialog = [
      { time: "00:02", speaker: "Dr. Jessica Edwards, DO", text: "Hello Marcus, good to see you back. I want to review your home blood pressure logs and check on your diabetes refills today." },
      { time: "00:12", speaker: "Marcus Miller (Patient)", text: "Hi Doctor! Yes, I've been monitoring my blood pressure at home like you asked. It's been running around 138 over 88 on average. I also had a bit of a dry, ticklish cough over the last few days, but no chest pain. Mainly, I'm here because my Metformin supply is running low and I need a refill." },
      { time: "00:28", speaker: "Dr. Jessica Edwards, DO", text: "Got it. Your metformin refill is due. For your blood pressure, you are taking Spironolactone 25mg daily. We want to check your blood potassium and kidney function today with a lab draw. We must strictly avoid ACE inhibitors like Lisinopril due to your history of swelling or angioedema. Let's make sure everything is stable, and we can discuss medication adjustments if your home readings stay elevated." }
    ];

    for (let i = 0; i < dialog.length; i++) {
      await delay(1200);
      setScribeTranscript(prev => [...prev, dialog[i]]);
    }

    await delay(1000);
    setScribeStatus("transcribing");
    await delay(1200);
    setScribeStatus("generating");
    await delay(1500);

    setScribeSOAP({
      subjective: "Patient presents for follow-up of type 2 diabetes and hypertension. Reports home blood pressure readings average 138/88 mmHg. Complains of mild, dry cough x 5 days, non-productive. Denies chest pain, dyspnea, or peripheral swelling. Adherent to Metformin and Spironolactone.",
      objective: "Vitals: BP 138/88 mmHg, HR 82 bpm, Temp 98.6°F, SpO2 98%. Gen: Well-nourished, comfortable male in no acute distress. Lungs: Clear to auscultation bilaterally. Heart: Regular rate and rhythm, normal S1/S2, no murmurs or gallops. Extremities: No edema.",
      assessment: "1. Type 2 Diabetes Mellitus (E11.9) - Well controlled on current regimen.\n2. Essential Hypertension (I10) - Stable, mild elevation at home. Note history of ACE-inhibitor-induced Angioedema (avoid Lisinopril). Currently on Spironolactone.\n3. Mild Acute Cough (R05.9) - Likely viral, benign etiology.",
      plan: "1. Refill Metformin 1000mg oral tablet, 1 tablet twice daily.\n2. Continue Spironolactone 25mg oral tablet daily.\n3. Order Basic Metabolic Panel (CMP) today to monitor serum Potassium and GFR.\n4. Patient educated to avoid ACE Inhibitors. Follow up in 3 months."
    });
    setScribeStatus("complete");
    setWaveformActive(false);
  };

  const handleApproveSOAP = async () => {
    if (!scribeSOAP) return;
    setAutopilotStatus("running");
    setClinicalSubTab("autopilot");
    await delay(1000);
    
    // Autopilot generating docs
    setAutopilotStatus("ready");
  };

  // --- Agent P: Autopilot Sign-off ---
  const handleSignAutopilotDocs = async () => {
    setAutopilotStatus("completed");
    await commitToLedger("Post-Visit Autopilot", "ENCOUNTER_CLOSE_DISPATCH: Autopilot successfully finalized visit E-9418. Dispatched discharge summary, sent Metformin refill, scheduled CMP lab, and formatted CMS-1500 billing claim.");
    setSignedDocs(["discharge", "refill", "billing", "referral"]);
  };

  // --- Agent R: Referral Specialist fax simulator ---
  const sendReferralFax = async () => {
    setReferralStatus("assembling");
    setReferralLogs(["⚡ Assembling encrypted FHIR Clinical Document packet...", "📁 Patient Demographics (Marcus Miller) ... Included", "📁 Active Problem List & SOAP Encounter ... Included", "📁 Lab Panel & Insurance BCBS-88392 ... Included"]);
    await delay(1000);

    setReferralStatus("compiled");
    setReferralLogs(prev => [...prev, "✅ Secure FHIR collection bundle successfully built (SHA-256 signature generated)."]);
    await delay(1000);

    setReferralStatus("sending");
    const steps = [
      "📞 Dialing secure HIPAA fax bridge at 1-800-555-0199...",
      "🔐 TLS 1.3 Cryptographic Handshake Established ... Success",
      "📤 Transmitting Page 1/3 (Patient Consent & Cover)...",
      "📤 Transmitting Page 2/3 (SOAP Encounter Notes)...",
      "📤 Transmitting Page 3/3 (Blue Cross Blue Shield Authorization)..."
    ];

    for (let i = 0; i < steps.length; i++) {
      await delay(800);
      setReferralLogs(prev => [...prev, steps[i]]);
      setReferralPagesSent(i + 1);
    }

    await delay(1000);
    setReferralStatus("sent");
    setReferralLogs(prev => [
      ...prev,
      "✅ TRANSMISSION SUCCESSFUL! Remote fax confirmed receipt.",
      "🏆 Tx Reference MD5: f08a47ba92b11e9a3b890a12",
      "🔒 Logging Referral Dispatch transaction to D1 SQLite ledger..."
    ]);

    await commitToLedger("Referral Specialist", "REFERRAL_DISPATCH: Transmitted encrypted medical referral package to Albuquerque Cardiology (Dr. Vance) via secure network. Fax Tx Confirmed.");
  };

  // --- Agent M: Super Knowledge Engine ---
  const runKnowledgeSearch = async (queryText: string) => {
    const q = queryText || knowledgeQuery;
    if (!q.trim()) return;
    setKnowledgeQuery(q);
    setKnowledgeResult(null);
    setSelectedCitation(null);
    setKnowledgeIsSearching(true);
    setKnowledgeStreamingAnswer("");
    setKnowledgeLogs([]);
    setKnowledgeTokensPerSecond(0);

    const logs = [
      "🔄 Connecting to Cloudflare Durable Object (Agent M Instance Core: DO-M-3982)...",
      "🔑 Validating JWT Session & HIPAA sandboxed context isolation...",
      "🛡️ Executing raw-PHI data scrubbing pass... 0 PHI markers found.",
      "🔍 Querying hybrid indexes: keyword BM25 + dense Vectorize queries over PubMed, ChEMBL, and ClinicalTrials...",
      "🧠 Compelling relevant documents... Found 2 matches. Compacting context memory buffer...",
      "📈 Invoking @cf/meta/llama-4-scout via Cloudflare AI Gateway... Stream open."
    ];

    // Show logs with realistic stagger
    for (let i = 0; i < logs.length; i++) {
      setKnowledgeLogs(prev => [...prev, logs[i]]);
      await delay(250);
    }

    setKnowledgeTokensPerSecond(128);

    let answerText = "";
    let citationsList: any[] = [];
    const lowerQ = q.toLowerCase();

    if (lowerQ.includes("gfr") || lowerQ.includes("metformin")) {
      answerText = "According to the **2024 ADA Standards of Care** and **KDIGO guidelines**, Metformin dosing must be adjusted or held based on estimated Glomerular Filtration Rate (eGFR):\n- **eGFR ≥ 60 mL/min**: No dosage adjustment necessary; standard monitoring.\n- **eGFR 45-59 mL/min**: Safe to continue; monitor renal function every 3–6 months.\n- **eGFR 30-44 mL/min**: Use with caution. Reduce dose by 50% (max 1000mg/day). Do not initiate new treatment.\n- **eGFR < 30 mL/min**: Strictly contraindicated due to risk of Metformin-associated Lactic Acidosis (MALA).\nMarcus Miller's current eGFR is **74 mL/min/1.73m²**, making his current dose of **1000mg BID** fully safe and compliant.";
      citationsList = [
        { id: "PubMed:3401289", type: "pubmed", title: "Metformin Dosing and Lactic Acidosis in Chronic Kidney Disease", snippet: "A multi-center review of 15,000 diabetic patients demonstrating safety of metformin down to eGFR of 30 mL/min." },
        { id: "ClinicalTrials:NCT0451892", type: "clinicaltrials", title: "EMPA-REG MET-SAFE Study", snippet: "Evaluation of renal safety and cardiovascular benefits of combinatorial SGLT2 and metformin in patients with moderate kidney disease." }
      ];
    } else if (lowerQ.includes("angioedema") || lowerQ.includes("acei") || lowerQ.includes("lisinopril")) {
      answerText = "In patients with history of **ACE-inhibitor-induced Angioedema** (e.g., Lisinopril, Enalapril), standard clinical directives recommend:\n- **ACE Inhibitors are strictly contraindicated** and should never be re-introduced.\n- **Angiotensin Receptor Blockers (ARBs)** like Losartan or Valsartan may be used, with an extremely low cross-reactivity rate of **<1%**. Clinical supervision is recommended during initiation.\n- **Calcium Channel Blockers (CCBs)** (e.g., Amlodipine) or Thiazide diuretics are first-line, non-cross-reactive alternatives with zero risk of class-based angioedema.\nMarcus Miller is currently prescribed **Spironolactone** (aldosterone antagonist) which does not cross-react, and has been safely cleared.";
      citationsList = [
        { id: "PubMed:3290184", type: "pubmed", title: "Safety of ARBs in Patients with Prior ACE-Inhibitor Induced Angioedema", snippet: "A systematic meta-analysis of 9,482 patients showing cross-reactivity rates below 0.62% when transitioning from ACEi to ARBs." },
        { id: "ChEMBL:CHEMBL1201", type: "chembl", title: "Lisinopril Bioactivity and Binding Profile", snippet: "Detailed molecular binding profile indicating high-affinity inhibition of Peptidyl-dipeptidase A (ACE), triggering excess bradykinin accumulation." }
      ];
    } else {
      // Dynamic AI Synthesis generator for arbitrary user queries
      const topics = q.split(" ").filter(w => w.length > 3).map(w => w.charAt(0).toUpperCase() + w.slice(1));
      const primaryTopic = topics[0] || "Requested Subject";
      const secondaryTopic = topics[1] || "Clinical Management";
      answerText = `### Clinical Synthesis: ${primaryTopic} & ${secondaryTopic}\n\nBased on a dynamic hybrid vector search over **PubMed** and **co-referenced clinical guidelines**, management recommendations for **${q}** include:\n\n1. **First-Line Diagnostic Evaluation**: Standard baseline screening of bio-markers, kidney and liver panels, and functional tolerance checks should be initiated.\n2. **Therapeutic Protocol**: Standard dosage titration under active physician surveillance. Hold or adjust therapies if metabolic clearance drops below established safety markers.\n3. **Safety & Redundancy**: Avoid drug-drug interactions by verifying enzymatic pathways (such as CYP3A4 inhibitors/inducers).\n\n*Note: This is an automated real-time synthesis powered by Zara OS Cloudflare Agent Sandbox and @cf/meta/llama-4-scout.*`;
      citationsList = [
        { id: `PubMed:${Math.floor(1000000 + Math.random() * 9000000)}`, type: "pubmed", title: `Clinical consensus and guidelines for the management of ${primaryTopic}`, snippet: `A randomized control review detailing patient outcomes and adverse reactions associated with ${q}.` },
        { id: `ClinicalTrials:NCT0${Math.floor(100000 + Math.random() * 900000)}`, type: "clinicaltrials", title: `Safety and Efficacy Evaluation of Titrated Therapies in ${primaryTopic}`, snippet: `Phase II clinical trial investigating pharmacological endpoints, biodistribution, and renal clearance rates.` }
      ];
    }

    // Stream word-by-word
    const words = answerText.split(" ");
    let currentText = "";
    for (let i = 0; i < words.length; i++) {
      currentText += (i === 0 ? "" : " ") + words[i];
      setKnowledgeStreamingAnswer(currentText);
      // Small randomized jitter for natural stream look
      await delay(15 + Math.random() * 25);
    }

    setKnowledgeResult({
      answer: answerText,
      citations: citationsList
    });
    setKnowledgeIsSearching(false);
  };

  const handleViewCitation = (citation: typeof knowledgeResult["citations"][0]) => {
    let abstract = "Abstract not loaded.";
    let eligibility = "";
    let url = "";

    if (citation.id === "PubMed:3290184") {
      abstract = "BACKGROUND: ACE inhibitors are a common cause of drug-induced angioedema. ARBs are structurally similar but do not block bradykinin degradation. METHODS: We conducted a systematic review of clinical trials where patients with previous ACEi angioedema were prescribed ARBs. RESULTS: Out of 9,482 patients studied, only 58 (0.61%) experienced recurrent angioedema on ARBs. CONCLUSION: ARBs are a safe and highly effective alternative for patients with ACE-inhibitor angioedema when clinical necessity dictates.";
      url = "https://pubmed.ncbi.nlm.nih.gov/3290184/";
    } else if (citation.id === "PubMed:3401289") {
      abstract = "BACKGROUND: Metformin is cleared renally, posing a theoretical risk of lactic acidosis in kidney disease. METHODS: Prospective registry of patients with eGFR between 30 and 60. RESULTS: Lactic acidosis was extremely rare, with zero cases in the 45-60 cohort, and 1.2 cases per 100,000 patient-years in the 30-45 cohort. CONCLUSION: Metformin is safe to continue at full dose in eGFR > 45, and half-dose in eGFR 30-45.";
      url = "https://pubmed.ncbi.nlm.nih.gov/3401289/";
    } else if (citation.id === "ClinicalTrials:NCT0451892") {
      abstract = "Study Title: Renal and Cardiovascular Safety of Combined Therapy in Type 2 Diabetes.";
      eligibility = "INCLUSION CRITERIA: Diagnosis of Type 2 Diabetes, age 18-75, eGFR between 30 and 90 mL/min/1.73m², active prescription of Metformin 1000mg/day.\nEXCLUSION CRITERIA: History of lactic acidosis, severe hepatic impairment, pregnancy.";
      url = "https://clinicaltrials.gov/ct2/show/NCT0451892";
    } else if (citation.id === "ChEMBL:CHEMBL1201") {
      abstract = "CHEMICAL PROFILE: Lisinopril is a synthetic peptide derivative of proline, acting as a competitive inhibitor of Angiotensin-Converting Enzyme (ACE). It prevents conversion of Angiotensin I to Angiotensin II, reducing aldosterone secretion. Side effect profile: bradykinin elevation, leading to dry cough and, in susceptible individuals, life-threatening angioedema.";
      url = "https://www.ebi.ac.uk/chembl/compound_report_card/CHEMBL1201/";
    }

    setSelectedCitation({
      ...citation,
      abstract,
      eligibility,
      url
    });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white selection:bg-teal-500/30 selection:text-teal-300 scanline relative overflow-hidden">
      
      {/* Decorative Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-850 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-400 to-purple-500 p-0.5 flex items-center justify-center shadow-lg shadow-teal-500/10">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Activity className="w-5 h-5 text-teal-400 animate-pulse-subtle" />
              </div>
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-teal-300 to-purple-400 bg-clip-text text-transparent">ZARA OS</span>
              <p className="text-[10px] tracking-widest uppercase text-slate-500 font-semibold">AI-Native Practice Suite</p>
            </div>
          </div>

          <nav className="flex items-center gap-1 overflow-x-auto max-w-full">
            {[
              { id: "clinical", label: "Clinical OS Dashboard (PAZRM)", icon: Layers },
              { id: "console", label: "AI Receptionist Edge", icon: Cpu },
              { id: "ledger", label: "D1 Audit Ledger", icon: Database },
              { id: "adrs", label: "Blueprints (ADRs)", icon: FileCode },
              { id: "thesis", label: "Venture Thesis", icon: Shield }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition shrink-0 ${
                    isActive
                      ? "text-teal-300 bg-slate-900/80 border border-slate-700/50 shadow-inner"
                      : "text-slate-400 hover:text-white hover:bg-slate-900/40"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-teal-400" : ""}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Edge Sandbox
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        
        {/* ==================== TAB 0: CLINICAL OS DASHBOARD (PAZRM) ==================== */}
        {activeTab === "clinical" && (
          <div className="space-y-6">
            {/* Clinical Top Status Bar */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap gap-4 items-center justify-between text-xs bg-slate-950/40">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                <span className="text-slate-400 uppercase font-bold tracking-wider">Zara Workstation</span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-200 font-semibold">Logged in: Dr. Jessica Edwards, DO MBA</span>
                <span className="bg-slate-800 text-teal-400 font-bold px-2 py-0.5 rounded text-[10px]">Family Medicine</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-slate-400">Selected Case: <strong className="text-white">Marcus Miller (51M)</strong></span>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">FHIR R4 Compliant</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Dashboard Navigation */}
              <div className="lg:col-span-3 flex flex-col gap-2">
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 px-3">PAZRM Core Modules</p>
                {[
                  { id: "chart", label: "Chart & Guardrails", agent: "Agent Z", desc: "Drug interaction checks", icon: User, color: "text-teal-400 bg-teal-950/20 border-teal-500/20" },
                  { id: "scribe", label: "Ambient Scribe", agent: "Agent A", desc: "Live consultation to SOAP", icon: Mic, color: "text-purple-400 bg-purple-950/20 border-purple-500/20" },
                  { id: "autopilot", label: "Post-Visit Autopilot", agent: "Agent P", desc: "Automate discharge, claims", icon: Sparkles, color: "text-amber-400 bg-amber-950/20 border-amber-500/20" },
                  { id: "referral", label: "Referral Specialist", agent: "Agent R", desc: "FHIR bundle fax route", icon: Send, color: "text-sky-400 bg-sky-950/20 border-sky-500/20" },
                  { id: "knowledge", label: "Knowledge Search", agent: "Agent M", desc: "Citations-backed engine", icon: BookOpen, color: "text-pink-400 bg-pink-950/20 border-pink-500/20" },
                  { id: "metrics", label: "Practice Ops Metrics", agent: "Zara Stats", desc: "Automation savings", icon: BarChart3, color: "text-emerald-400 bg-emerald-950/20 border-emerald-500/20" }
                ].map((item) => {
                  const Icon = item.icon;
                  const isSubActive = clinicalSubTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setClinicalSubTab(item.id as any)}
                      className={`p-3 text-left rounded-xl border transition-all flex items-center justify-between ${
                        isSubActive
                          ? "border-teal-400 bg-slate-900 shadow-md glow-teal"
                          : "border-slate-900 bg-slate-900/10 hover:border-slate-800 hover:bg-slate-900/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isSubActive ? "bg-teal-500/20 text-teal-400" : "bg-slate-950 text-slate-500"
                        }`}>
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-200">{item.label}</p>
                          <p className="text-[10px] text-slate-500">{item.desc}</p>
                        </div>
                      </div>
                      <span className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded shrink-0 ${item.color}`}>
                        {item.agent}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Dynamic Panel Viewer */}
              <div className="lg:col-span-9">
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-950/30 min-h-[600px] flex flex-col justify-between">
                  
                  {/* --- SUB-TAB 1: Patient Chart & Clinical Assistant (Agent Z) --- */}
                  {clinicalSubTab === "chart" && (
                    <div className="space-y-6 flex-1">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                        <div>
                          <span className="text-[10px] uppercase font-extrabold tracking-wider text-teal-400">Agent Z Security filter</span>
                          <h2 className="text-xl font-bold text-white">Patient Chart & Clinical Safety Guardrails</h2>
                        </div>
                        <span className="px-2 py-0.5 bg-teal-500/10 text-teal-400 rounded-full text-xs font-bold border border-teal-500/20">
                          Active Chart: E-9418
                        </span>
                      </div>

                      {/* Patient Info Card */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-slate-800 rounded-xl bg-slate-900/20">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Patient Name</p>
                          <p className="text-sm font-semibold text-slate-200">Marcus Miller</p>
                          <p className="text-xs text-slate-400">51-year-old Male (11/12/1974)</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Vital Signs</p>
                          <p className="text-sm font-semibold text-slate-200">BP: 138/88 | HR: 82</p>
                          <p className="text-xs text-slate-400">SpO2: 98% | Temp: 98.6°F</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Key Lab Results</p>
                          <p className="text-sm font-semibold text-slate-200">Potassium: 4.8 mEq/L</p>
                          <p className="text-xs text-slate-400">eGFR: 74 mL/min (Stable)</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Insurance Coverage</p>
                          <p className="text-sm font-semibold text-slate-200">Blue Cross Blue Shield</p>
                          <p className="text-xs text-slate-400">ID: BCBS-88392102</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* Clinical Records List */}
                        <div className="md:col-span-7 space-y-4">
                          {/* Problems List */}
                          <div>
                            <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-2 px-1 flex items-center gap-1.5">
                              <Activity className="w-3.5 h-3.5 text-teal-400" />
                              Active Problem List (EHR)
                            </h3>
                            <div className="space-y-1.5">
                              {["Essential Hypertension (Stage 1) - ICD10: I10", "Type 2 Diabetes Mellitus - ICD10: E11.9", "Hyperlipidemia - ICD10: E78.5"].map((prob, i) => (
                                <div key={i} className="p-2 border border-slate-900 bg-slate-900/30 text-xs font-semibold text-slate-300 rounded-lg">
                                  {prob}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Allergies & contraindications */}
                          <div>
                            <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-2 px-1 flex items-center gap-1.5">
                              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                              Documented Drug Allergies
                            </h3>
                            <div className="space-y-1.5">
                              <div className="p-3 border border-red-500/20 bg-red-950/10 text-xs rounded-lg flex items-center justify-between">
                                <div>
                                  <p className="font-bold text-red-400">Angioedema (ACE Inhibitors Class)</p>
                                  <p className="text-[10px] text-slate-500">Severity: SEVERE (Life-Threatening Airway Swelling history)</p>
                                </div>
                                <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase">CRITICAL</span>
                              </div>
                              <div className="p-3 border border-amber-500/20 bg-amber-950/10 text-xs rounded-lg flex items-center justify-between">
                                <div>
                                  <p className="font-bold text-amber-400">Penicillin G</p>
                                  <p className="text-[10px] text-slate-500">Severity: Moderate (Pruritic Maculopapular Skin Rash)</p>
                                </div>
                                <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase">MODERATE</span>
                              </div>
                            </div>
                          </div>

                          {/* Current Medications */}
                          <div>
                            <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-2 px-1 flex items-center gap-1.5">
                              <Database className="w-3.5 h-3.5 text-purple-400" />
                              Active Outpatient Medications
                            </h3>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="p-2 border border-slate-900 bg-slate-950/60 rounded-lg text-slate-300 font-semibold">
                                Spironolactone 25mg daily
                              </div>
                              <div className="p-2 border border-slate-900 bg-slate-950/60 rounded-lg text-slate-300 font-semibold">
                                Metformin 1000mg BID
                              </div>
                              <div className="p-2 border border-slate-900 bg-slate-950/60 rounded-lg text-slate-300 font-semibold">
                                Atorvastatin 20mg daily
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Order Pad & Live check */}
                        <div className="md:col-span-5 space-y-4">
                          <div className="p-4 border border-slate-800 bg-slate-950/60 rounded-xl space-y-3">
                            <h4 className="text-xs uppercase font-extrabold text-slate-300 tracking-wider">Agent Z Prescribing Pad</h4>
                            <p className="text-[10px] text-slate-500">Test how Agent Z filters draft prescriptions against clinical safety criteria before committing them to FHIR database.</p>
                            
                            <div className="space-y-2">
                              <button
                                onClick={() => handleMedCheck("lisinopril")}
                                className={`w-full p-2.5 rounded-lg text-xs font-semibold text-left border flex justify-between items-center transition ${
                                  selectedMed === "lisinopril" ? "border-red-400 bg-red-950/20 text-white" : "border-slate-800 bg-slate-900/30 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                                }`}
                              >
                                <span>Prescribe Lisinopril 20mg daily</span>
                                <span className="text-[9px] uppercase font-bold bg-red-500/10 px-1.5 py-0.5 rounded text-red-400">ACE Inhibitor</span>
                              </button>
                              
                              <button
                                onClick={() => handleMedCheck("amoxicillin")}
                                className={`w-full p-2.5 rounded-lg text-xs font-semibold text-left border flex justify-between items-center transition ${
                                  selectedMed === "amoxicillin" ? "border-amber-400 bg-amber-950/20 text-white" : "border-slate-800 bg-slate-900/30 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                                }`}
                              >
                                <span>Prescribe Amoxicillin 500mg TID</span>
                                <span className="text-[9px] uppercase font-bold bg-amber-500/10 px-1.5 py-0.5 rounded text-amber-400">Beta-Lactam</span>
                              </button>

                              <button
                                onClick={() => handleMedCheck("losartan")}
                                className={`w-full p-2.5 rounded-lg text-xs font-semibold text-left border flex justify-between items-center transition ${
                                  selectedMed === "losartan" ? "border-teal-400 bg-teal-950/20 text-white" : "border-slate-800 bg-slate-900/30 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                                }`}
                              >
                                <span>Prescribe Losartan 50mg daily</span>
                                <span className="text-[9px] uppercase font-bold bg-teal-500/10 px-1.5 py-0.5 rounded text-teal-400">ARB Alternative</span>
                              </button>

                              <button
                                onClick={() => handleMedCheck("metoprolol")}
                                className={`w-full p-2.5 rounded-lg text-xs font-semibold text-left border flex justify-between items-center transition ${
                                  selectedMed === "metoprolol" ? "border-emerald-400 bg-emerald-950/20 text-white" : "border-slate-800 bg-slate-900/30 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                                }`}
                              >
                                <span>Prescribe Metoprolol 50mg daily</span>
                                <span className="text-[9px] uppercase font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded text-emerald-400">Beta-Blocker</span>
                              </button>
                            </div>
                          </div>

                          {/* Live Audit Check Result */}
                          {medCheckResult && (
                            <div className={`p-4 border rounded-xl text-xs space-y-3 animate-fade-in ${
                              medCheckResult.status === "danger"
                                ? "border-red-500/50 bg-red-950/35 text-red-200 shadow-md glow-red"
                                : medCheckResult.status === "warning"
                                ? "border-amber-500/50 bg-amber-950/35 text-amber-200 shadow-md"
                                : medCheckResult.status === "info"
                                ? "border-teal-500/30 bg-teal-950/20 text-teal-200"
                                : "border-emerald-500/40 bg-emerald-950/20 text-emerald-200 shadow-md glow-teal"
                            }`}>
                              <div className="flex gap-2 items-start font-bold">
                                {medCheckResult.status === "danger" || medCheckResult.status === "warning" ? (
                                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 animate-bounce" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                                )}
                                <span>{medCheckResult.title}</span>
                              </div>
                              <p className="leading-relaxed opacity-90">{medCheckResult.text}</p>
                              {medCheckResult.alternative && (
                                <p className="border-t border-red-500/20 pt-2 text-[11px] text-white">
                                  💡 <strong>Scribe Clinical Recommendation:</strong> {medCheckResult.alternative}
                                </p>
                              )}
                              <div className="border-t border-slate-800/80 pt-2 space-y-1">
                                <span className="text-[9px] uppercase font-bold text-slate-500 block">Evaluated Safety Parameters:</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {medCheckResult.rules.map((rule, idx) => (
                                    <span key={idx} className="bg-slate-900 border border-slate-850 px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-400">
                                      {rule}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* --- SUB-TAB 2: Ambient Scribe & SOAP (Agent A) --- */}
                  {clinicalSubTab === "scribe" && (
                    <div className="space-y-6 flex-1">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                        <div>
                          <span className="text-[10px] uppercase font-extrabold tracking-wider text-purple-400">Agent A Ambient Scribe</span>
                          <h2 className="text-xl font-bold text-white">Ambient Transcription & SOAP Converter</h2>
                        </div>
                        {scribeStatus === "recording" && (
                          <div className="flex items-center gap-1.5 text-red-400 font-bold text-xs bg-red-950/20 border border-red-500/30 px-3 py-1 rounded-full animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                            RECORDING LIVE CONSULTATION
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Audio Streaming panel */}
                        <div className="lg:col-span-5 space-y-4">
                          <div className="p-5 border border-slate-800 bg-slate-900/10 rounded-xl text-center space-y-4">
                            <h4 className="text-xs uppercase font-extrabold text-slate-300 tracking-wider">Clinical Audio Capture Bridge</h4>
                            
                            {/* Animated waveform CSS */}
                            <div className="h-20 bg-slate-950 border border-slate-900 rounded-xl flex items-center justify-center gap-1 overflow-hidden p-3 relative">
                              {waveformActive ? (
                                Array.from({ length: 28 }).map((_, i) => {
                                  const randomDelay = Math.random() * 0.5;
                                  const randomHeight = 20 + Math.random() * 50;
                                  return (
                                    <div
                                      key={i}
                                      style={{
                                        height: `${randomHeight}%`,
                                        animation: `pulse-subtle ${0.4 + Math.random() * 0.4}s ease-in-out ${randomDelay}s infinite alternate`
                                      }}
                                      className="w-1.5 bg-gradient-to-t from-purple-500 to-teal-400 rounded-full"
                                    />
                                  );
                                })
                              ) : (
                                <div className="text-slate-600 font-mono text-xs flex flex-col items-center gap-1.5">
                                  <Mic className="w-5 h-5 text-slate-600" />
                                  <span>MICROPHONE PORT STREAM: CLOSED</span>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-3 justify-center">
                              <button
                                onClick={startScribe}
                                disabled={scribeStatus === "recording" || scribeStatus === "transcribing" || scribeStatus === "generating"}
                                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-40 transition shadow-lg shadow-purple-500/10"
                              >
                                <Mic className="w-3.5 h-3.5" />
                                Start Ambient Capture
                              </button>
                            </div>
                          </div>

                          {/* Live stream scrolling dialogue */}
                          <div className="p-4 border border-slate-850 bg-slate-950/80 rounded-xl h-[280px] flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block border-b border-slate-900 pb-2 mb-3">Live Streaming Transcript</span>
                            <div className="flex-1 overflow-y-auto space-y-3 font-mono text-[11px] leading-relaxed pr-1 scrollbar-thin">
                              {scribeTranscript.length === 0 ? (
                                <p className="text-slate-600 italic text-center py-20">Click "Start Ambient Capture" to initiate doctor-patient recording...</p>
                              ) : (
                                scribeTranscript.map((line, i) => (
                                  <div key={i} className="space-y-0.5 border-l border-slate-800 pl-2">
                                    <span className="text-slate-500 text-[10px] block">[{line.time}] {line.speaker}:</span>
                                    <p className="text-slate-300">{line.text}</p>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>

                        {/* SOAP Outputs / Suggestions */}
                        <div className="lg:col-span-7 flex flex-col min-h-[400px] border border-slate-800 bg-slate-950/40 rounded-xl overflow-hidden">
                          <div className="border-b border-slate-800 bg-slate-900/40 px-4 py-3 flex items-center justify-between">
                            <span className="font-bold text-xs tracking-wider uppercase text-slate-300">Agent A Generative Output (SOAP Node)</span>
                            <div className="flex items-center gap-2 text-[10px] font-mono">
                              {scribeStatus === "recording" && <span className="text-red-400 font-bold animate-pulse">● RECORDING AUDIO</span>}
                              {scribeStatus === "transcribing" && <span className="text-teal-400 font-bold animate-pulse">⏳ RUNNING WHISPER TRANSCRIPTION...</span>}
                              {scribeStatus === "generating" && <span className="text-purple-400 font-bold animate-pulse">⏳ RUNNING CLAUDE 3.5 SOAP COMPILE...</span>}
                              {scribeStatus === "complete" && <span className="text-emerald-400 font-bold">✓ SOAP NOTE GENERATED</span>}
                              {scribeStatus === "idle" && <span className="text-slate-500">AWAITING CAPTURE</span>}
                            </div>
                          </div>

                          <div className="flex-1 p-5 overflow-y-auto font-mono text-xs text-slate-300 space-y-4">
                            {!scribeSOAP ? (
                              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 text-center py-24">
                                <FileText className="w-10 h-10 text-slate-700 animate-pulse-subtle" />
                                <p>No active SOAP note compiled yet.</p>
                                <p className="text-[10px] max-w-xs leading-relaxed text-slate-600">The SOAP note parses Subjective narratives, Objective physical vitals, clinical Assessments, and Treatment plans synchronously.</p>
                              </div>
                            ) : (
                              <div className="space-y-4 animate-fade-in leading-relaxed text-xs">
                                <div className="space-y-1">
                                  <span className="text-purple-400 font-bold border-l-2 border-purple-500 pl-2 block">SUBJECTIVE:</span>
                                  <p className="bg-slate-950/40 p-2.5 rounded border border-slate-900 text-slate-300">{scribeSOAP.subjective}</p>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-purple-400 font-bold border-l-2 border-purple-500 pl-2 block">OBJECTIVE:</span>
                                  <p className="bg-slate-950/40 p-2.5 rounded border border-slate-900 text-slate-300">{scribeSOAP.objective}</p>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-purple-400 font-bold border-l-2 border-purple-500 pl-2 block">ASSESSMENT:</span>
                                  <p className="bg-slate-950/40 p-2.5 rounded border border-slate-900 text-slate-300 white-space-pre-line">{scribeSOAP.assessment.replace(/\\n/g, '\n')}</p>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-purple-400 font-bold border-l-2 border-purple-500 pl-2 block">PLAN:</span>
                                  <p className="bg-slate-950/40 p-2.5 rounded border border-slate-900 text-slate-300 white-space-pre-line">{scribeSOAP.plan.replace(/\\n/g, '\n')}</p>
                                </div>

                                {/* Coding recommendations */}
                                <div className="border-t border-slate-850 pt-4 space-y-2">
                                  <span className="text-[10px] uppercase font-bold text-slate-500 block">EHR Billing Coding Suggestions:</span>
                                  <div className="grid grid-cols-2 gap-3 text-[10px]">
                                    <div className="p-3 border border-slate-900 bg-slate-950 rounded-lg space-y-1.5">
                                      <span className="text-slate-500 font-bold block">ICD-10 (Clinical Diagnostic)</span>
                                      <div className="space-y-1 font-semibold">
                                        <div className="flex justify-between">
                                          <span className="text-teal-400">I10 (Essential Hypertension)</span>
                                          <span className="text-slate-500">98% conf</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-teal-400">E11.9 (Type 2 Diabetes)</span>
                                          <span className="text-slate-500">95% conf</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-teal-400">R05.9 (Cough, Unspecified)</span>
                                          <span className="text-slate-500">89% conf</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="p-3 border border-slate-900 bg-slate-950 rounded-lg space-y-1.5">
                                      <span className="text-slate-500 font-bold block">CPT (Procedure Billing)</span>
                                      <div className="space-y-1 font-semibold">
                                        <div className="flex justify-between">
                                          <span className="text-purple-400">99214 (Outpatient Visit, 30m)</span>
                                          <span className="text-slate-500">99% conf</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-purple-400">80048 (Basic Metabolic Panel)</span>
                                          <span className="text-slate-500">92% conf</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Approvals bar */}
                                <div className="border-t border-slate-850 pt-4 flex justify-end">
                                  <button
                                    onClick={handleApproveSOAP}
                                    className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-teal-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-2 hover:opacity-90 shadow-md shadow-teal-500/10"
                                  >
                                    <FileCheck className="w-3.5 h-3.5" />
                                    Approve & Close Encounter
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* --- SUB-TAB 3: Post-Visit Autopilot (Agent P) --- */}
                  {clinicalSubTab === "autopilot" && (
                    <div className="space-y-6 flex-1">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                        <div>
                          <span className="text-[10px] uppercase font-extrabold tracking-wider text-amber-400">Agent P Autopilot Queue</span>
                          <h2 className="text-xl font-bold text-white">Post-Visit Autopilot Pipeline</h2>
                        </div>
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full text-xs font-bold border border-amber-500/20">
                          Encounter Link: E-9418
                        </span>
                      </div>

                      {autopilotStatus === "idle" && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 text-center py-28 flex-1">
                          <Sparkles className="w-12 h-12 text-slate-700 animate-pulse" />
                          <div>
                            <p className="font-bold text-slate-400 text-sm">Post-Visit Autopilot Queue is Empty</p>
                            <p className="text-xs max-w-sm leading-relaxed text-slate-500 mt-1">To trigger Dr. Jessica Edwards' customized Autopilot pipeline, go to 'Ambient Scribe' tab, run ambient capture, and click 'Approve & Close Encounter'.</p>
                          </div>
                        </div>
                      )}

                      {/* Run sequence animation */}
                      {autopilotStatus === "running" && (
                        <div className="h-full flex flex-col items-center justify-center text-center py-28 flex-1 space-y-6">
                          <RefreshCw className="w-12 h-12 text-amber-400 animate-spin" />
                          <div className="space-y-2">
                            <p className="font-bold text-slate-300 text-sm">Conductor Dispatching Agent P Isolate...</p>
                            <div className="space-y-1 font-mono text-[11px] text-slate-500 text-left max-w-sm mx-auto">
                              <p className="text-teal-400">✔ Loading patient FHIR bundle ... Loaded</p>
                              <p className="text-teal-400">✔ Loading custom clinician prompt directives ... Loaded</p>
                              <p className="text-amber-400 animate-pulse">⏳ Scribe Agent P drafting clinical letters...</p>
                              <p className="text-slate-600">⏳ Formatting CMS-1500 insurance claims...</p>
                              <p className="text-slate-600">⏳ Scheduling 3-month follow-up CMP labs...</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Display compiled deliverables */}
                      {(autopilotStatus === "ready" || autopilotStatus === "completed") && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
                          {/* Left Panel: Checklist and Sign-off */}
                          <div className="lg:col-span-4 space-y-4">
                            <div className="p-4 border border-slate-800 bg-slate-900/10 rounded-xl space-y-4">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Autopilot Deliverables</h4>
                              
                              <div className="space-y-2.5 text-xs">
                                <div className="flex items-center gap-2.5">
                                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                                  <span className="font-semibold text-slate-300">Patient Discharge Letter</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                                  <span className="font-semibold text-slate-300">EHR Refill (Metformin 1000 BID)</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                                  <span className="font-semibold text-slate-300">CMS-1500 Billing Claim</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                                  <span className="font-semibold text-slate-300">CMP Kidney / Potassium Lab Order</span>
                                </div>
                              </div>

                              <div className="border-t border-slate-850 pt-4">
                                {autopilotStatus === "completed" ? (
                                  <div className="p-3 border border-emerald-500/20 bg-emerald-950/20 text-emerald-400 rounded-lg text-xs font-bold text-center space-y-1">
                                    <p className="flex items-center justify-center gap-1.5">
                                      <Check className="w-4 h-4" /> ALL ITEMS SIGNED & SEALED
                                    </p>
                                    <p className="text-[9px] text-slate-500 font-mono">D1 Audit block committed: Block #{ledger.length}</p>
                                  </div>
                                ) : (
                                  <button
                                    onClick={handleSignAutopilotDocs}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 shadow-lg shadow-amber-500/10"
                                  >
                                    <FileCheck className="w-4 h-4" />
                                    Sign & Transmit All Work-Products
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="p-4 border border-slate-850 bg-slate-950/60 rounded-xl space-y-2 text-[11px] text-slate-400 leading-relaxed">
                              <p className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">HIPAA Audit Compliance:</p>
                              <p>Signing these files commits their SHA-256 hashes to the append-only SQLite ledger, creating legal proof of Dr. Edwards' supervision over AI drafts (complying with ONC HTI-1 guidelines).</p>
                            </div>
                          </div>

                          {/* Right Panel: Tabbed Document Inspector */}
                          <div className="lg:col-span-8 flex flex-col border border-slate-800 rounded-xl bg-slate-950 overflow-hidden h-[420px]">
                            {/* Doc tabs */}
                            <div className="border-b border-slate-800 bg-slate-900/30 flex text-[10px] uppercase font-bold tracking-wider font-mono">
                              {[
                                { id: "discharge", label: "Discharge Letter" },
                                { id: "refill", label: "e-Prescriptions" },
                                { id: "billing", label: "CMS-1500 Claim" }
                              ].map((tab) => (
                                <button
                                  key={tab.id}
                                  onClick={() => setActiveDocTab(tab.id as any)}
                                  className={`flex-1 px-4 py-3 text-center border-r border-slate-800 transition ${
                                    activeDocTab === tab.id
                                      ? "text-amber-400 bg-slate-950 border-b-2 border-b-amber-400"
                                      : "text-slate-500 hover:text-white"
                                  }`}
                                >
                                  {tab.label}
                                </button>
                              ))}
                            </div>

                            {/* Doc Inspector Content */}
                            <div className="flex-1 p-5 overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-300 bg-slate-950/40">
                              {activeDocTab === "discharge" && (
                                <div className="space-y-4">
                                  <div className="border-b border-slate-900 pb-3">
                                    <h4 className="font-bold text-slate-200">ZARA MEDICAL CLINIC · DISCHARGE SUMMARY</h4>
                                    <p className="text-[10px] text-slate-500">Sent to: marcus.miller.74@gmail.com | Format: Encrypted SMTP Portal</p>
                                  </div>
                                  <p>Dear Marcus,</p>
                                  <p>It was a pleasure seeing you today for your outpatient visit. Below is a secure summary of our discussions, medication orders, and scheduled labs.</p>
                                  <div className="bg-slate-900/40 p-3 rounded border border-slate-850 space-y-2">
                                    <p><strong>🩺 Vital Stats:</strong> Blood Pressure: 138/88 mmHg, Heart Rate: 82 bpm.</p>
                                    <p><strong>💊 Medications Refilled:</strong> Metformin 1000mg oral tablet (1 tablet twice daily). Your prescription has been securely transmitted to Walgreens Pharmacy.</p>
                                    <p><strong>⚠️ Clinical Safety Warning:</strong> Because of your severe allergic history of **Angioedema**, you must strictly avoid **ACE-inhibitors (like Lisinopril)**. We have flagged this in your medical record.</p>
                                    <p><strong>🔬 Scheduled Labs:</strong> We booked a blood draw for a **Basic Metabolic Panel (CMP)** to verify your kidney function (eGFR) and check your serum Potassium. Please stop by the lab clinic this Wednesday morning.</p>
                                  </div>
                                  <p>Should you experience any worsening cough, chest pain, or respiratory distress, please call emergency services immediately.</p>
                                  <p className="text-slate-500">Sincerely,<br />Dr. Jessica Edwards, DO MBA<br />Zara Medical Practice Director</p>
                                </div>
                              )}

                              {activeDocTab === "refill" && (
                                <div className="space-y-4">
                                  <div className="border-b border-slate-900 pb-3">
                                    <h4 className="font-bold text-slate-200">NCPDP SCRIPT SURESCRIPT TRANSACTION DRAFT</h4>
                                    <p className="text-[10px] text-slate-500">TxID: eRx-841920-Miller | Destination: WALGREENS #19402</p>
                                  </div>
                                  
                                  <div className="space-y-3 font-semibold">
                                    <div className="p-3 border border-slate-900 bg-slate-900/20 rounded-lg">
                                      <p className="text-teal-400">Rx 1: METFORMIN HCL 1000MG oral tablet</p>
                                      <p className="text-slate-400 text-[10px] mt-1">Dispense: 180 tablets (90-day supply)</p>
                                      <p className="text-slate-400 text-[10px]">Sig: Take 1 tablet by mouth twice daily with meals</p>
                                      <p className="text-slate-400 text-[10px]">Refills: 3 remaining</p>
                                      <p className="text-slate-500 text-[10px] mt-2">NPI: 1982730491 | DEA License: MD984021A</p>
                                    </div>

                                    <div className="p-3 border border-slate-900 bg-slate-900/20 rounded-lg">
                                      <p className="text-slate-400">Rx 2: ATORVASTATIN CALCIUM 20MG oral tablet</p>
                                      <p className="text-slate-500 text-[10px] mt-1">Dispense: 90 tablets (90-day supply)</p>
                                      <p className="text-slate-500 text-[10px]">Sig: Take 1 tablet by mouth daily at bedtime</p>
                                      <p className="text-slate-500 text-[10px]">Refills: 3 remaining</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {activeDocTab === "billing" && (
                                <div className="space-y-4">
                                  <div className="border-b border-slate-900 pb-3">
                                    <h4 className="font-bold text-slate-200">HEALTH INSURANCE CLAIM FORM (CMS-1500 SCHEMA)</h4>
                                    <p className="text-[10px] text-slate-500">Carrier ID: BCBS-NMAG-883 | Status: Pending provider signature</p>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4 text-[10px] font-semibold text-slate-400 bg-slate-900/20 p-4 border border-slate-900 rounded-lg">
                                    <div>
                                      <span className="text-slate-500 block">PATIENT ID (Box 1a):</span>
                                      <span className="text-slate-200">BCBS-88392102</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500 block">PATIENT NAME (Box 2):</span>
                                      <span className="text-slate-200">MILLER, MARCUS L</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500 block">DIAGNOSIS CODES (Box 21):</span>
                                      <span className="text-teal-400">1. I10 (Essential Hypertension)</span>
                                      <span className="text-teal-400 block">2. E11.9 (Type 2 Diabetes Mellitus)</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500 block">PROCEDURE BILLING (Box 24g):</span>
                                      <span className="text-purple-400">99214 (E&M Outpatient Visit, level 4)</span>
                                      <span className="text-slate-400 block">Charges: $185.00 | Units: 1</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500 block">RENDERING PROVIDER NPI (Box 33a):</span>
                                      <span className="text-slate-200">1982730491 (Dr. Jessica Edwards)</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500 block">FACILITY LOCATION (Box 32):</span>
                                      <span className="text-slate-200">Zara Medical Office, Tijeras NM</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* --- SUB-TAB 4: Referral Specialist (Agent R) --- */}
                  {clinicalSubTab === "referral" && (
                    <div className="space-y-6 flex-1">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                        <div>
                          <span className="text-[10px] uppercase font-extrabold tracking-wider text-sky-400">Agent R Referral Specialist</span>
                          <h2 className="text-xl font-bold text-white">Outbound Referral Packet Assembler</h2>
                        </div>
                        <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 rounded-full text-xs font-bold border border-sky-500/20">
                          Active Patient: Marcus Miller
                        </span>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Referral configuration */}
                        <div className="lg:col-span-5 space-y-4">
                          <div className="p-4 border border-slate-800 bg-slate-900/10 rounded-xl space-y-4">
                            <h4 className="text-xs uppercase font-extrabold text-slate-300 tracking-wider">Referral Destination Settings</h4>
                            
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block">Specialist Directory</label>
                                <select
                                  value={referralSpecialist}
                                  onChange={(e) => setReferralSpecialist(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-850 p-2.5 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:border-sky-400"
                                >
                                  <option value="Dr. David Vance, MD (Cardiology)">Dr. David Vance, MD (Cardiology) - Albuquerque Cardiology</option>
                                  <option value="Dr. Sarah Patel, MD (Endocrinology)">Dr. Sarah Patel, MD (Endocrinology) - NM Diabetes Center</option>
                                  <option value="Dr. James Carter, MD (Pulmonology)">Dr. James Carter, MD (Pulmonology) - High Desert Pulmonology</option>
                                </select>
                              </div>

                              <div className="p-3 border border-slate-900 bg-slate-950 rounded-lg space-y-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase block">FHIR Bundle Assembly Checklist</span>
                                <div className="space-y-1.5 font-mono text-[10px] text-slate-400 font-semibold">
                                  <p className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Patient FHIR Resource (ID: P-94182)</p>
                                  <p className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Practitioner Resource (Dr. J. Edwards DO)</p>
                                  <p className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Encounter Document (SOAP E-9418 Notes)</p>
                                  <p className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Insurance pre-authorization attachment</p>
                                </div>
                              </div>

                              <button
                                onClick={sendReferralFax}
                                disabled={referralStatus === "assembling" || referralStatus === "sending"}
                                className="w-full px-4 py-3 bg-gradient-to-r from-sky-500 to-sky-400 text-slate-950 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition shadow-lg shadow-sky-500/10"
                              >
                                <Send className="w-3.5 h-3.5" />
                                Assemble & Fax Referral Package
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Live compilation / fax sending screen */}
                        <div className="lg:col-span-7 flex flex-col border border-slate-800 bg-slate-950 rounded-xl overflow-hidden h-[380px]">
                          <div className="border-b border-slate-800 bg-slate-900/40 px-4 py-3 flex items-center justify-between">
                            <span className="font-bold text-xs tracking-wider uppercase text-slate-300">Secure Transmission Portal</span>
                            <div className="flex items-center gap-2 font-mono text-[10px]">
                              {referralStatus === "assembling" && <span className="text-teal-400 animate-pulse">⏳ COMPILING CLINICAL CCDA...</span>}
                              {referralStatus === "sending" && <span className="text-sky-400 animate-pulse">⏳ TRANSMITTING FAX (PAGES {referralPagesSent}/5)...</span>}
                              {referralStatus === "sent" && <span className="text-emerald-400">✓ SENT SUCCESSFUL</span>}
                              {referralStatus === "idle" && <span className="text-slate-500">READY</span>}
                            </div>
                          </div>

                          <div className="flex-1 p-5 overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-300 bg-slate-950/40 space-y-2">
                            {referralLogs.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 text-center py-20">
                                <Send className="w-8 h-8 text-slate-700 animate-pulse-subtle" />
                                <p>Referral portal idle.</p>
                                <p className="text-[10px] max-w-xs leading-relaxed text-slate-600">Select a specialist and click "Assemble & Fax" to start a secure encrypted digital-fax transmission loop.</p>
                              </div>
                            ) : (
                              referralLogs.map((log, index) => {
                                let textColor = "text-slate-300";
                                if (log.includes("✅")) textColor = "text-emerald-400";
                                else if (log.includes("⚡")) textColor = "text-sky-300";
                                else if (log.includes("📤")) textColor = "text-amber-400";
                                else if (log.includes("🏆")) textColor = "text-teal-400 font-bold";
                                return (
                                  <div key={index} className={`pl-2 border-l border-slate-850 ${textColor}`}>
                                    {log}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* --- SUB-TAB 5: Medical Super Knowledge (Agent M) --- */}
                  {clinicalSubTab === "knowledge" && (
                    <div className="space-y-6 flex-1">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                        <div>
                          <span className="text-[10px] uppercase font-extrabold tracking-wider text-pink-400">Agent M Citation Search</span>
                          <h2 className="text-xl font-bold text-white">Medical Super Knowledge Engine</h2>
                        </div>
                        <span className="px-2 py-0.5 bg-pink-500/10 text-pink-400 rounded-full text-xs font-bold border border-pink-500/20">
                          Data Sources: PubMed, ChEMBL, ClinicalTrials
                        </span>
                      </div>

                      <div className="space-y-4">
                        {/* Search Bar */}
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                            <input
                              type="text"
                              value={knowledgeQuery}
                              onChange={(e) => setKnowledgeQuery(e.target.value)}
                              placeholder="Search medical literature, clinical trials, drug interactions..."
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-200 focus:outline-none focus:border-pink-400 transition"
                              onKeyDown={(e) => e.key === "Enter" && runKnowledgeSearch("")}
                            />
                          </div>
                          <button
                            onClick={() => runKnowledgeSearch("")}
                            className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-pink-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:opacity-90 shadow-lg shadow-pink-500/10"
                          >
                            <Search className="w-3.5 h-3.5" />
                            Search
                          </button>
                        </div>

                        {/* Preset quick queries */}
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="text-[10px] uppercase font-bold text-slate-500">Try clinical presets:</span>
                          <button
                            onClick={() => runKnowledgeSearch("Metformin GFR Refill Guidelines")}
                            className="p-1.5 border border-slate-850 bg-slate-900/30 hover:border-pink-500/30 hover:text-pink-300 rounded-lg text-[10px] font-semibold text-slate-400 transition"
                          >
                            "Metformin GFR Refill Guidelines"
                          </button>
                          <button
                            onClick={() => runKnowledgeSearch("ACEi Angioedema CCB Alternatives")}
                            className="p-1.5 border border-slate-850 bg-slate-900/30 hover:border-pink-500/30 hover:text-pink-300 rounded-lg text-[10px] font-semibold text-slate-400 transition"
                          >
                            "ACEi Angioedema CCB Alternatives"
                          </button>
                        </div>

                        {/* Live Cloudflare Edge Telemetry */}
                        {(knowledgeIsSearching || knowledgeResult) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 border border-pink-500/20 bg-pink-500/5 rounded-xl animate-fade-in text-xs text-left">
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-500 block">Isolate Plane</span>
                              <span className="font-mono text-pink-400 font-bold flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                                DO-M-3982 (Active)
                              </span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-500 block">Routing Engine</span>
                              <span className="font-mono text-slate-300 font-semibold">Cloudflare AI Gateway</span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-500 block">Active LLM Model</span>
                              <span className="font-mono text-slate-300 font-semibold text-[11px]">@cf/meta/llama-4-scout</span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-500 block">Performance Metrics</span>
                              <span className="font-mono text-pink-400 font-bold">
                                {knowledgeTokensPerSec > 0 ? `${knowledgeTokensPerSec} tok/s` : "negotiating stream..."}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Edge Execution Logs */}
                        {knowledgeIsSearching && knowledgeLogs.length > 0 && (
                          <div className="p-4 border border-slate-800 bg-slate-950/80 rounded-xl space-y-2 text-[11px] font-mono leading-relaxed text-left max-h-[160px] overflow-y-auto custom-scrollbar animate-fade-in">
                            <span className="text-[9px] uppercase font-extrabold text-slate-500 block mb-1">Durable Object Execution Trace (Fibers & Sessions)</span>
                            {knowledgeLogs.map((log, i) => (
                              <div key={i} className="text-slate-400 flex items-start gap-1.5">
                                <span className="text-pink-500">▶</span>
                                <span>{log}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Results Grid */}
                        {(knowledgeStreamingAnswer || knowledgeResult) && (
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 border-t border-slate-900 animate-fade-in">
                            {/* Answer text block */}
                            <div className="lg:col-span-7 space-y-4 text-left">
                              <div className="p-5 border border-slate-850 bg-slate-900/10 rounded-xl space-y-3 leading-relaxed text-xs">
                                <span className="text-[10px] uppercase font-extrabold text-pink-400 block border-b border-slate-900 pb-1">AI Synthesis (Consensus Summary)</span>
                                <p className="text-slate-300 whitespace-pre-line leading-relaxed">
                                  {knowledgeStreamingAnswer}
                                  {knowledgeIsSearching && (
                                    <span className="inline-block w-1.5 h-4 ml-1 bg-pink-400 animate-pulse"></span>
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Citations panel */}
                            <div className="lg:col-span-5 space-y-3 text-left">
                              <span className="text-[10px] uppercase font-extrabold text-slate-500 block px-1">Verifiable Evidence Citations</span>
                              
                              <div className="space-y-3">
                                {knowledgeResult ? (
                                  knowledgeResult.citations.map((cit, i) => (
                                    <div
                                      key={i}
                                      onClick={() => handleViewCitation(cit)}
                                      className="p-4 border border-slate-800 bg-slate-950/60 hover:border-pink-500/40 rounded-xl cursor-pointer transition text-left"
                                    >
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20 font-mono">
                                          {cit.id}
                                        </span>
                                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                                      </div>
                                      <h5 className="font-bold text-xs text-slate-200 line-clamp-1">{cit.title}</h5>
                                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed italic">"{cit.snippet}"</p>
                                    </div>
                                  ))
                                ) : (
                                  /* Skeleton loading cards while streaming */
                                  Array.from({ length: 2 }).map((_, i) => (
                                    <div key={i} className="p-4 border border-slate-850 bg-slate-900/10 rounded-xl space-y-2 animate-pulse text-left">
                                      <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                                      <div className="h-3 bg-slate-800 rounded w-5/6 text-slate-800"></div>
                                      <div className="h-3 bg-slate-800 rounded w-2/3"></div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* --- SUB-TAB 6: Practice Ops Metrics & Agent Health --- */}
                  {clinicalSubTab === "metrics" && (
                    <div className="space-y-6 flex-1">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                        <div>
                          <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-400">Zara System Observability</span>
                          <h2 className="text-xl font-bold text-white">Practice Performance & Agent Health Metrics</h2>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20">
                          Observability Hub
                        </span>
                      </div>

                      {/* Stat grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 border border-slate-850 bg-slate-900/15 rounded-xl">
                          <span className="text-slate-500 text-[9px] font-bold uppercase tracking-wider block">Inbound Volume</span>
                          <span className="text-2xl font-extrabold text-white mt-1 block">3,124</span>
                          <span className="text-slate-400 text-[10px] mt-0.5 block">Calls & SMS processed</span>
                        </div>
                        <div className="p-4 border border-slate-850 bg-slate-900/15 rounded-xl">
                          <span className="text-slate-500 text-[9px] font-bold uppercase tracking-wider block">Automation Rate</span>
                          <span className="text-2xl font-extrabold text-teal-400 mt-1 block">70.0%</span>
                          <span className="text-slate-400 text-[10px] mt-0.5 block">2,186 resolved fully</span>
                        </div>
                        <div className="p-4 border border-slate-850 bg-slate-900/15 rounded-xl">
                          <span className="text-slate-500 text-[9px] font-bold uppercase tracking-wider block">Admin Hours Saved</span>
                          <span className="text-2xl font-extrabold text-purple-400 mt-1 block">142.5 hrs</span>
                          <span className="text-slate-400 text-[10px] mt-0.5 block">This month's aggregate</span>
                        </div>
                        <div className="p-4 border border-slate-850 bg-slate-900/15 rounded-xl">
                          <span className="text-slate-500 text-[9px] font-bold uppercase tracking-wider block">Serverless Isolate Saved</span>
                          <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">$1,280</span>
                          <span className="text-slate-400 text-[10px] mt-0.5 block">92% cheaper than servers</span>
                        </div>
                      </div>

                      {/* SVG line chart */}
                      <div className="p-5 border border-slate-850 bg-slate-900/5 rounded-xl space-y-4">
                        <h4 className="text-xs uppercase font-extrabold text-slate-300 tracking-wider">Clinical Hours Saved Daily (30-Day Trend)</h4>
                        
                        <div className="h-40 relative w-full overflow-hidden flex items-end">
                          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="gradient-line" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>
                            {/* Area fill */}
                            <path d="M0,80 L10,75 L20,70 L30,62 L40,55 L50,45 L60,48 L70,35 L80,28 L90,20 L100,15 L100,100 L0,100 Z" fill="url(#gradient-line)" />
                            {/* Trend line */}
                            <path d="M0,80 L10,75 L20,70 L30,62 L40,55 L50,45 L60,48 L70,35 L80,28 L90,20 L100,15" fill="none" stroke="#2dd4bf" strokeWidth="1.5" />
                          </svg>
                          <div className="absolute inset-x-0 bottom-0 border-t border-slate-800 flex justify-between px-2 pt-1 text-[9px] font-mono text-slate-500 font-semibold">
                            <span>May 1</span>
                            <span>May 10</span>
                            <span>May 20</span>
                            <span>May 30</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Panel Footer (All tabs) */}
                  <div className="border-t border-slate-850 pt-4 mt-6 flex justify-between items-center text-[10px] font-mono text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      HIPAA Dual-Plane Data Isolation Layer Active
                    </span>
                    <span className="text-slate-400">Node Isolate ID: cf-edge-dfw-01-stable</span>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================== TAB 1: AGENT COMMAND CONSOLE ==================== */}
        {activeTab === "console" && (
          <div className="space-y-8">
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-widest text-teal-400 font-bold">Simulator Interface</p>
              <h1 className="text-3xl font-extrabold tracking-tight">AI Receptionist Edge Controller</h1>
              <p className="text-slate-400 max-w-3xl text-sm">
                Zara OS intercepts patient phone and text lines at the network edge nearest to the patient. Choose a structured symptom profile preset below to watch our 4-agent cascade orchestrate clinical classification, EHR scheduling constraints, and HIPAA cryptographic logging.
              </p>
            </div>

            {/* Presets Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p)}
                  className={`p-5 text-left rounded-xl border transition-all duration-300 ${
                    selectedPreset === p.id
                      ? "border-teal-400/50 bg-slate-900/60 shadow-lg glow-teal"
                      : "border-slate-800 bg-slate-900/20 hover:border-slate-700 hover:bg-slate-900/40"
                  }`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${p.color}`}>
                      {p.badge}
                    </span>
                    <Clock className="w-4 h-4 text-slate-500" />
                  </div>
                  <h3 className="font-semibold text-sm mb-2">{p.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{p.text}</p>
                </button>
              ))}
            </div>

            {/* Command Interface Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Panel: Inputs */}
              <div className="lg:col-span-5 space-y-6">
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-teal-400" />
                    <h3 className="font-bold text-sm tracking-tight text-slate-200">Patient Input Pipeline</h3>
                  </div>

                  <textarea
                    value={patientInput}
                    onChange={(e) => setPatientInput(e.target.value)}
                    placeholder="Describe symptoms, requested appointments, or medication refills..."
                    className="w-full h-32 bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-teal-400 transition"
                  />

                  <div className="flex justify-between items-center">
                    <button
                      onClick={resetSimulation}
                      className="px-4 py-2 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:border-slate-700 transition"
                    >
                      Clear Console
                    </button>
                    <button
                      onClick={runSimulation}
                      disabled={!patientInput.trim() || ["intake", "triage", "scheduling", "escalation"].includes(simulationStep)}
                      className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-teal-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition shadow-lg shadow-teal-500/10"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Run Edge Pipeline
                    </button>
                  </div>
                </div>

                {/* Agent Activity Cards */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">Cascade Topology</h4>
                  
                  {/* Intake Agent Activity */}
                  <div className={`p-4 rounded-xl border transition ${
                    simulationStep === "intake" ? "border-teal-400/50 bg-teal-950/10" : "border-slate-900 bg-slate-900/10"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                          intakeOutput ? "bg-teal-500/20 text-teal-400" : "bg-slate-900 text-slate-600"
                        }`}>I</div>
                        <div>
                          <p className="text-xs font-semibold">Intake Agent (Node Isolate-1)</p>
                          <p className="text-[10px] text-slate-500">SSN parsing, demographic validation</p>
                        </div>
                      </div>
                      {intakeOutput && <CheckCircle2 className="w-4 h-4 text-teal-400" />}
                    </div>
                    {intakeOutput && (
                      <div className="mt-3 pt-3 border-t border-slate-900 space-y-1 text-[11px] text-slate-400">
                        <p>👤 Patient name: <span className="text-white font-medium">{intakeOutput.name}</span></p>
                        <p>📅 DOB: <span className="text-white font-medium">{intakeOutput.dob}</span></p>
                        <p>🛡️ SSN Redacted: <span className={intakeOutput.ssnFiltered ? "text-amber-400 font-bold" : "text-slate-500"}>{intakeOutput.ssnFiltered ? "TRUE (REDACTED)" : "FALSE"}</span></p>
                      </div>
                    )}
                  </div>

                  {/* Triage Agent Activity */}
                  <div className={`p-4 rounded-xl border transition ${
                    simulationStep === "triage" ? "border-purple-400/50 bg-purple-950/10" : "border-slate-900 bg-slate-900/10"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                          triageOutput ? "bg-purple-500/20 text-purple-400" : "bg-slate-900 text-slate-600"
                        }`}>T</div>
                        <div>
                          <p className="text-xs font-semibold">Clinical Triage (Node Isolate-2)</p>
                          <p className="text-[10px] text-slate-500">Clinical classification, clinical reasoning routing</p>
                        </div>
                      </div>
                      {triageOutput && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                    </div>
                    {triageOutput && (
                      <div className="mt-3 pt-3 border-t border-slate-900 space-y-1 text-[11px] text-slate-400">
                        <div className="flex items-center justify-between">
                          <span>📊 Symptom Score: <span className="text-white font-medium">{triageOutput.score}/100</span></span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            triageOutput.classification === "URGENT" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-teal-500/10 text-teal-400"
                          }`}>{triageOutput.classification}</span>
                        </div>
                        <p className="italic">"{triageOutput.notes}"</p>
                      </div>
                    )}
                  </div>

                  {/* Scheduling Agent Activity */}
                  <div className={`p-4 rounded-xl border transition ${
                    simulationStep === "scheduling" ? "border-teal-400/50 bg-teal-950/10" : "border-slate-900 bg-slate-900/10"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                          schedOutput ? "bg-teal-500/20 text-teal-400" : "bg-slate-900 text-slate-600"
                        }`}>S</div>
                        <div>
                          <p className="text-xs font-semibold">Scheduling Agent (Node Isolate-3)</p>
                          <p className="text-[10px] text-slate-500">Google Calendar, EHR database matching</p>
                        </div>
                      </div>
                      {schedOutput && <CheckCircle2 className="w-4 h-4 text-teal-400" />}
                    </div>
                    {schedOutput && (
                      <div className="mt-3 pt-3 border-t border-slate-900 space-y-1 text-[11px] text-slate-400">
                        <p>📅 Scheduled Slot: <span className="text-white font-medium">{schedOutput.slot}</span></p>
                        <p>🏷️ Booking Confirmed: <span className="text-white font-medium">{schedOutput.booked ? "TRUE" : "FALSE"}</span></p>
                      </div>
                    )}
                  </div>

                  {/* Escalation Agent Activity */}
                  <div className={`p-4 rounded-xl border transition ${
                    simulationStep === "escalation" ? "border-red-400/50 bg-red-950/10" : "border-slate-900 bg-slate-900/10"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                          escalationOutput ? "bg-red-500/20 text-red-400" : "bg-slate-900 text-slate-600"
                        }`}>E</div>
                        <div>
                          <p className="text-xs font-semibold">Escalation Agent (Node Isolate-4)</p>
                          <p className="text-[10px] text-slate-500">Direct provider alerting, emergency protocols</p>
                        </div>
                      </div>
                      {escalationOutput && <CheckCircle2 className="w-4 h-4 text-red-400" />}
                    </div>
                    {escalationOutput && (
                      <div className="mt-3 pt-3 border-t border-slate-900 text-[11px] text-slate-400">
                        <p className={escalationOutput.notifyOnCall ? "text-red-400 font-semibold" : ""}>{escalationOutput.reason}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Panel: Live Logs */}
              <div className="lg:col-span-7 flex flex-col h-[600px] border border-slate-800 bg-slate-950 rounded-2xl overflow-hidden shadow-inner">
                <div className="border-b border-slate-800 bg-slate-900/40 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-teal-400" />
                    <span className="font-bold text-xs tracking-wider uppercase text-slate-300">Edge Console Logs (Wrangler Live stream)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
                    <span className="text-[10px] font-mono text-teal-400">CONNECTING...</span>
                  </div>
                </div>

                <div className="flex-1 p-6 font-mono text-xs text-slate-300 overflow-y-auto space-y-3 bg-slate-950/40">
                  {simLogs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 text-center py-20">
                      <Sparkles className="w-8 h-8 text-slate-600 animate-pulse-subtle" />
                      <p>Console idle. Select a preset and execute pipeline.</p>
                      <p className="text-[10px] max-w-xs leading-relaxed text-slate-600">This simulator evaluates our multi-agent casacade in real time, validating HIPAA rules before D1 cryptographic commit.</p>
                    </div>
                  ) : (
                    simLogs.map((log, index) => {
                      let textColor = "text-slate-300";
                      if (log.includes("✅")) textColor = "text-teal-400";
                      else if (log.includes("⚠️")) textColor = "text-amber-400";
                      else if (log.includes("🏥")) textColor = "text-purple-300";
                      else if (log.includes("🚨") || log.includes("EMERGENCY")) textColor = "text-red-400";
                      else if (log.includes("⚡")) textColor = "text-sky-300";
                      else if (log.includes("🏆")) textColor = "text-emerald-400 font-bold";
                      return (
                        <div key={index} className={`leading-relaxed border-l-2 pl-3 py-1 ${
                          log.includes("🏆") ? "border-emerald-500 bg-emerald-950/10" : "border-slate-800"
                        } ${textColor}`}>
                          {log}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================== TAB 2: HIPAA AUDIT LEDGER ==================== */}
        {activeTab === "ledger" && (
          <div className="space-y-8">
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-widest text-teal-400 font-bold">HIPAA §164.312(b) Cryptographic Verification</p>
              <h1 className="text-3xl font-extrabold tracking-tight">D1 SQLite Append-Only Cryptographic Audit Trail</h1>
              <p className="text-slate-400 max-w-3xl text-sm">
                To guarantee zero-repudiation and pass federal HIPAA audits, Zara OS records every single administrative and clinical agent mutation in a chained structure where each block hash references the previous block.
              </p>
            </div>

            {/* Validation Banner */}
            <div className={`p-6 rounded-2xl border flex flex-wrap gap-4 items-center justify-between ${
              ledgerVerified === true
                ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-400 shadow-md glow-teal"
                : ledgerVerified === false
                ? "border-red-500/30 bg-red-950/20 text-red-400 shadow-md glow-red"
                : "border-slate-800 bg-slate-900/30 text-slate-300"
            }`}>
              <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  ledgerVerified === true
                    ? "bg-emerald-500/20 text-emerald-400"
                    : ledgerVerified === false
                    ? "bg-red-500/20 text-red-400"
                    : "bg-slate-800 text-slate-400"
                }`}>
                  {ledgerVerified === true ? (
                    <Shield className="w-6 h-6" />
                  ) : ledgerVerified === false ? (
                    <ShieldAlert className="w-6 h-6 animate-bounce" />
                  ) : (
                    <Fingerprint className="w-6 h-6 animate-pulse-subtle" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {ledgerVerified === true
                      ? "Cryptographic Verification: SECURE"
                      : ledgerVerified === false
                      ? "ALERT: Cryptographic Signature Tampering Detected"
                      : "Audit Status: Awaiting Verification"}
                  </h3>
                  <p className="text-xs opacity-85 mt-1 max-w-2xl leading-relaxed">
                    {ledgerVerified === true
                      ? "All log entries are verified. Cryptographic SHA-256 blockchain matches previous states identically. No data modification has occurred."
                      : ledgerVerified === false
                      ? `Ledger verification failed at Block #${tamperedIndex !== null ? ledger[tamperedIndex].blockId : "unknown"}! The previous hash reference in Block #${tamperedIndex !== null ? ledger[tamperedIndex].blockId + 1 : "next"} does not match current state, invalidating ledger credibility.`
                      : "Click 'Verify Ledger Integrity' below to trace the hash chain validation loop."}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => verifyLedgerIntegrity(ledger)}
                  className="px-4 py-2.5 bg-slate-800 border border-slate-700 hover:bg-slate-755 text-white rounded-lg text-xs font-bold transition flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Verify Ledger Integrity
                </button>
              </div>
            </div>

            {/* Tampering Controls Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Ledger Database Visualizer */}
              <div className="lg:col-span-8 space-y-4">
                <h3 className="text-xs uppercase font-bold tracking-wider text-slate-500 px-1">Chained Database Ledger Records</h3>
                
                <div className="space-y-4">
                  {ledger.map((block, idx) => {
                    const isTamperedBlock = block.isTampered;
                    const isBrokenVerify = ledgerVerified === false && tamperedIndex !== null && idx >= tamperedIndex;
                    
                    return (
                      <div
                        key={block.blockId}
                        className={`p-5 rounded-2xl border transition duration-300 relative overflow-hidden ${
                          isTamperedBlock
                            ? "border-red-500/50 bg-red-950/20"
                            : isBrokenVerify
                            ? "border-amber-500/20 bg-amber-950/5 opacity-80"
                            : "border-slate-800 bg-slate-900/20"
                        }`}
                      >
                        {/* Blockchain visual connector */}
                        {idx > 0 && (
                          <div className="absolute top-0 left-8 w-0.5 h-4 bg-slate-800 -translate-y-4" />
                        )}

                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                              BLOCK #{block.blockId}
                            </span>
                            <span className="text-[10px] text-slate-500">{block.timestamp}</span>
                          </div>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            isTamperedBlock
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-slate-800 text-slate-400"
                          }`}>
                            {isTamperedBlock ? "TAMPERED STATE" : block.agent}
                          </span>
                        </div>

                        <p className={`text-xs font-mono mb-4 py-2 border-b border-slate-800 ${
                          isTamperedBlock ? "text-red-300 font-bold" : "text-slate-300"
                        }`}>
                          "{block.payload}"
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px] font-mono">
                          <div className="space-y-1">
                            <span className="text-slate-500">PREVIOUS_BLOCK_HASH:</span>
                            <p className="text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap bg-slate-950/60 p-1.5 rounded border border-slate-900">
                              {block.previousHash}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-slate-500">CURRENT_BLOCK_HASH:</span>
                            <p className={`${
                              isTamperedBlock ? "text-red-400 border-red-500/20 bg-red-950/10" : "text-teal-400 border-slate-900 bg-slate-950/60"
                            } overflow-hidden text-ellipsis whitespace-nowrap p-1.5 rounded border`}>
                              {block.currentHash}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Intrusion Simulator */}
              <div className="lg:col-span-4 space-y-6">
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    <h3 className="font-bold text-sm tracking-tight text-slate-200">Intrusion Simulator</h3>
                  </div>
                  
                  <p className="text-xs text-slate-400 leading-relaxed">
                    EWOR partners look for technical depth. This panel allows you to simulate a direct SQL database intrusion on our audit log table (representing an adversary getting full system admin privileges on a local node). 
                  </p>

                  <div className="space-y-3">
                    <button
                      onClick={tamperLedger}
                      className="w-full px-4 py-3 bg-red-950/30 hover:bg-red-950/50 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Simulate SQL Log Injection
                    </button>
                    
                    <button
                      onClick={restoreLedger}
                      className="w-full px-4 py-3 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Restore DB Snapshot
                    </button>
                  </div>

                  <div className="border-t border-slate-800 pt-4 space-y-2 text-[11px] text-slate-500 leading-relaxed">
                    <p className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">How to test:</p>
                    <p>1. Click <span className="text-red-400 font-medium">"Simulate SQL Log Injection"</span> to maliciously edit Block #3.</p>
                    <p>2. Notice how Block #3's hash remains unchanged, but its payload is altered.</p>
                    <p>3. Click <span className="text-white font-medium">"Verify Ledger Integrity"</span>.</p>
                    <p>4. The cryptographic audit immediately halts verification at Block #3 and sounds the alarms.</p>
                  </div>
                </div>

                <div className="p-6 border border-slate-800 rounded-2xl bg-slate-900/10 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Technical Directives</h4>
                  <div className="space-y-3 text-[11px] text-slate-400 leading-relaxed">
                    <div className="flex gap-2">
                      <Lock className="w-4 h-4 text-teal-400 shrink-0" />
                      <p><strong>D1 Integration:</strong> Written directly in native sqlite-v8, keeping database reads/writes localized directly inside the isolate execution plane.</p>
                    </div>
                    <div className="flex gap-2">
                      <Lock className="w-4 h-4 text-teal-400 shrink-0" />
                      <p><strong>Zero-PHI Posture:</strong> Audit logs hold cryptographically hashed references of operations; raw patient PHI is never committed directly to these persistent logs.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================== TAB 3: ARCHITECTURAL RECORDS (ADRS) ==================== */}
        {activeTab === "adrs" && (
          <div className="space-y-8">
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-widest text-teal-400 font-bold">System Engineering & Trade-offs</p>
              <h1 className="text-3xl font-extrabold tracking-tight">Architecture Decision Records (ADRs)</h1>
              <p className="text-slate-400 max-w-3xl text-sm">
                These design-records prove technical maturity by documenting system trade-offs made directly by the founder. Click each tab below to view our verified production blueprints.
              </p>
            </div>

            {/* ADR Tabs & Viewer */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* ADR Sidebar */}
              <div className="lg:col-span-4 space-y-3">
                {[
                  { id: "001", title: "ADR-001: Cloudflare Edge", sub: "Sub-200ms Edge voice routing", badge: "Latency" },
                  { id: "002", title: "ADR-002: Orchestrator Pattern", sub: "Supervisor deterministic state", badge: "Routing" },
                  { id: "003", title: "ADR-003: PAZRM Agent Arch", sub: "Structured 5-agent system", badge: "Agentic" },
                  { id: "004", title: "ADR-004: Multi-Model Routing", sub: "AI Gateway cost optimization", badge: "Operational" }
                ].map((adr) => (
                  <div
                    key={adr.id}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-900/20 hover:border-slate-700 transition duration-200 cursor-pointer animate-fade-in"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Active Standard</span>
                      <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 font-mono">
                        {adr.badge}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-white">{adr.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">{adr.sub}</p>
                  </div>
                ))}
              </div>

              {/* ADR content viewer */}
              <div className="lg:col-span-8 glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-800 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                      <FileCode className="text-teal-400 w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">ADR Documentation Engine</h2>
                      <p className="text-xs text-slate-400">Target Folder: /docs/ADRs/</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20">
                      BAA Hardened
                    </span>
                  </div>
                </div>

                <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-white mb-2">1. Why Cloudflare Workers + Agents SDK over AWS Lambda + LangChain (ADR-001)</h3>
                    <p className="text-slate-400">
                      <strong>Context:</strong> Patient voice flows degrade significantly with cold starts greater than 500ms. Traditional stacks such as AWS Lambda trigger cold starts up to 3 seconds.
                    </p>
                    <p className="text-slate-400 mt-2">
                      <strong>Decision:</strong> Deploy all receptionist entry points directly onto <strong>Cloudflare Workers Edge</strong>, keeping latency strictly under 200ms and utilizing WebSockets hibernation to save 100% compute costs during patient idleness.
                    </p>
                  </div>

                  <div className="border-t border-slate-800/80 pt-5">
                    <h3 className="text-base font-bold text-white mb-2">2. Orchestrator/Worker Agent Routing Pattern (ADR-002)</h3>
                    <p className="text-slate-400">
                      <strong>Context:</strong> Unstructured multi-agent P2P swarms routing messages freely trigger non-deterministic loops. This is non-viable under HIPAA which demands structured, linear transaction lineage.
                    </p>
                    <p className="text-slate-400 mt-2">
                      <strong>Decision:</strong> Implement a rigid **Supervisor (Orchestrator)** design pattern. The Orchestrator alone commands child isolates (Intake, Triage, Scheduling, Escalation), capturing all execution steps inside a single transactional context.
                    </p>
                  </div>

                  <div className="border-t border-slate-800/80 pt-5">
                    <h3 className="text-base font-bold text-white mb-2">3. PAZRM Multi-Agent Isolation & Safety (ADR-003)</h3>
                    <p className="text-slate-400">
                      <strong>Context:</strong> Healthcare automation requires distinct boundaries for legal liability and clinical oversight. Single monolithic clinical LLM agents can trigger drug errors and lack accountability.
                    </p>
                    <p className="text-slate-400 mt-2">
                      <strong>Decision:</strong> Decompose back-office into exactly 5 specialized, isolated micro-agents (PAZRM) orchestrated by a central LangGraph state-conductor. Each agent maintains individual security controls, sandboxed memory spaces, and explicit clinician feedback checkpoints.
                    </p>
                  </div>

                  <div className="border-t border-slate-800/80 pt-5">
                    <h3 className="text-base font-bold text-white mb-2">4. Multi-Model LLM Strategy (ADR-004)</h3>
                    <p className="text-slate-400">
                      <strong>Decision:</strong> Leverage the **Cloudflare AI Gateway** to route clinical requests dynamically: Claude 3.5 Sonnet handles advanced medical reasoning under BAA, while fast local open-source models (such as Llama-3-8B) handle administrative routine scheduling. This achieves an instant 40% operating cost savings.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================== TAB 4: FOUNDER THESIS ==================== */}
        {activeTab === "thesis" && (
          <div className="space-y-8">
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-widest text-teal-400 font-bold">Venture Strategy</p>
              <h1 className="text-3xl font-extrabold tracking-tight">The Zara OS Venture Thesis</h1>
              <p className="text-slate-400 max-w-3xl text-sm">
                Built by a board-certified practicing physician serving 24 states. Reclaiming the solo practice economy from massive administrative burn.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left strategic details */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Thesis Card */}
                <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-4">
                  <h3 className="text-lg font-bold text-white">The Core Healthcare Problem</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Over 250,000 independent physician practices exist in the United States, representing the front lines of rural, underserved, and minority patient care. Today, these practices are shutting down at a rapid rate of 5–8% per year.
                  </p>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    The root cause is administrative: solo and small practices must allocate 30% to 50% of their top-line revenues strictly to back-office staff overhead (answering phones, clinical sorting, booking, prescription refill audits, and prior authorizations).
                  </p>
                  <p className="text-slate-300 text-sm leading-relaxed font-semibold bg-teal-500/10 p-4 rounded-xl border border-teal-500/20 text-teal-300">
                    "Every single administrative, triage, scheduling, and logging workflow is now fully agent-replaceable. Reclaiming this overhead directly recovers the independent medical economy."
                  </p>
                </div>

                {/* Case Study Callout */}
                <div className="p-8 border border-slate-800 rounded-3xl bg-slate-900/10 space-y-3">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-teal-400">Clinical Proof-of-Concept</span>
                  <h3 className="text-base font-bold text-white">Zara Medical Integration</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    In 2025, founder Dr. Jessica Edwards deployed the initial AI Receptionist core directly in production at her own 24-state hybrid practice. The system instantly absorbed 70% of routine clinical inbound phone queries without human error, saving providers an average of 2+ hours daily. Featured in Healthcare IT News, June 2025.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="https://www.linkedin.com/pulse/ai-receptionist-cuts-time-costs-zara-medical-bill-siwicki-h5zmc"
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 font-bold"
                    >
                      <span>Read Healthcare IT News Feature</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

              </div>

              {/* Right Profile card */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Founder profile card */}
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
                  <div className="flex items-center gap-4 font-sans">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-teal-400 to-purple-500 p-0.5 shadow-lg shadow-teal-500/15">
                      <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center overflow-hidden">
                        <User className="w-6 h-6 text-slate-300" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white">Dr. Jessica Edwards, DO MBA</h3>
                      <p className="text-xs text-teal-400">Board-Certified Family Physician</p>
                      <p className="text-[10px] text-slate-500">Founder & CEO, Zara Medical & Zara OS</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs text-slate-300 leading-relaxed border-t border-slate-800 pt-4">
                    <p>🩺 Practicing physician licensed across 24 US states; over 10,000 patient encounters treated.</p>
                    <p>🎓 Osteopathic Physician (DO) & Master of Business Administration (MBA).</p>
                    <p>🏆 AOF Resident of the Year (2016) · NMA Top Under 40 Recipient (2019).</p>
                    <p>💻 Shipped Zara OS clinical routing core autonomously to prove edge-level orchestration validity.</p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Link
                      href="https://zaramedical.com"
                      target="_blank"
                      className="flex-1 text-center py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-slate-300 hover:border-slate-700 hover:text-white"
                    >
                      zaramedical.com
                    </Link>
                    <Link
                      href="https://github.com/rjbizsolution23-wq/zara-os"
                      target="_blank"
                      className="flex-1 text-center py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-slate-300 hover:border-slate-700 hover:text-white"
                    >
                      View Codebase
                    </Link>
                  </div>
                </div>

                {/* Footprint metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 border border-slate-800 rounded-2xl bg-slate-900/10">
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">State Footprint</span>
                    <span className="text-3xl font-extrabold text-white mt-1 block">24</span>
                    <span className="text-slate-400 text-[10px] mt-1 block">Active jurisdictions</span>
                  </div>
                  <div className="p-5 border border-slate-800 rounded-2xl bg-slate-900/10">
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Admin Reduction</span>
                    <span className="text-3xl font-extrabold text-teal-400 mt-1 block">70%</span>
                    <span className="text-slate-400 text-[10px] mt-1 block">Of routine inbox automated</span>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>

      {/* Citation Abstract Detail Modal */}
      {selectedCitation && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel max-w-lg w-full rounded-2xl border border-slate-800 overflow-hidden shadow-2xl animate-scale-up">
            <div className="border-b border-slate-850 p-4 bg-slate-900/40 flex items-center justify-between">
              <span className="text-[10px] font-mono bg-pink-500/10 border border-pink-500/20 text-pink-400 px-2 py-0.5 rounded font-extrabold uppercase">
                {selectedCitation.type} ID: {selectedCitation.id}
              </span>
              <button
                onClick={() => setSelectedCitation(null)}
                className="w-6 h-6 rounded-lg hover:bg-slate-900 flex items-center justify-center text-slate-500 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <h4 className="text-sm font-bold text-white leading-relaxed">{selectedCitation.title}</h4>
              
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">Evidence Abstract & Synthesis</span>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-900">
                  {selectedCitation.abstract}
                </p>
              </div>

              {selectedCitation.eligibility && (
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">EHR Clinical Trial Eligibility</span>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-900 white-space-pre-line">
                    {selectedCitation.eligibility.replace(/\\n/g, '\n')}
                  </p>
                </div>
              )}

              <div className="pt-2 flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-500">Source: Federal Health Registries API</span>
                {selectedCitation.url && (
                  <Link
                    href={selectedCitation.url}
                    target="_blank"
                    className="text-pink-400 hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>View External Database Record</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-12 text-center text-slate-600 text-xs mt-12">
        <div className="max-w-7xl mx-auto space-y-2">
          <p>Zara OS is a registered product of RJ Business Solutions · Tijeras, NM 87059</p>
          <p>Configured natively under Cloudflare edge isolate regulations. HIPAA compliant.</p>
        </div>
      </footer>

    </main>
  );
}
