# Zara OS Domain Context Vocabulary

This reference guide documents domain-specific healthcare and administrative terms utilized across the Zara OS codebase.

## 1. Compliance and Regulatory Standards

### HIPAA (Health Insurance Portability and Accountability Act)
US federal law establishing data privacy and security provisions for safeguarding medical information.
- **PHI (Protected Health Information):** Any health information that can be linked to a specific individual.
- **BAA (Business Associate Agreement):** A legal contract required between a healthcare provider and a third-party vendor (like Cloudflare, AWS, Supabase) handling PHI, ensuring strict security compliance.

### HITRUST CSF
A certifiable security framework that harmonizes multiple standards (HIPAA, ISO, NIST, PCI) to provide a standardized compliance baseline.

### ONC HTI-1 (Health Information Technology for Economic and Clinical Health)
Certification program regulating health IT interoperability, data sharing, and algorithmic transparency.

---

## 2. Medical Data & Interoperability

### FHIR (Fast Healthcare Interoperability Resources)
An international standard for transferring electronic medical records. Zara OS uses the **FHIR R4** schema natively.
- **Resource Examples:**
  - `Patient`: Demographics, contact info.
  - `Encounter`: A patient-provider interaction.
  - `Observation`: Vital signs, lab values.
  - `DocumentReference`: Transcripts and clinical notes.

### HL7 v2 / v3
Legacy healthcare messaging standards. Transformed to FHIR inside our API gateway.

---

## 3. Medical Coding & Billing

### ICD-10 (International Classification of Diseases, 10th Revision)
Standardized diagnostic codes representing diseases, signs, symptoms, and external causes of injury.

### CPT (Current Procedural Terminology)
Standardized five-digit billing codes used by insurance companies to identify medical, surgical, and diagnostic procedures performed by healthcare providers.
