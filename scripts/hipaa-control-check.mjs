#!/usr/bin/env node
/**
 * Zara OS — HIPAA Control Check (CI gate)
 * Runs as part of every PR. Blocks merge if any control is violated.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, extname } from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const errors = [];
const warnings = [];

// ─── Check 1: data-flows.yaml present and valid ───
function checkDataFlows() {
  const path = join(ROOT, "data-flows.yaml");
  if (!existsSync(path)) {
    errors.push("data-flows.yaml is missing");
    return;
  }
  const content = readFileSync(path, "utf-8");
  if (!content.includes("baa_registry:")) {
    errors.push("data-flows.yaml missing baa_registry section");
  }
  if (!content.includes("flows:")) {
    errors.push("data-flows.yaml missing flows section");
  }
}

// ─── Check 2: No .env files committed ───
function checkNoEnvCommitted() {
  try {
    const tracked = execSync("git ls-files", { encoding: "utf-8" });
    const envFiles = tracked.split("\n").filter((f) => {
      return /(^|\/)\.env(\.|$)/.test(f) && !f.endsWith(".example");
    });
    if (envFiles.length > 0) {
      errors.push(`.env files committed: ${envFiles.join(", ")}`);
    }
  } catch {
    warnings.push("Could not check git for .env files (not a git repo?)");
  }
}

// ─── Check 3: No SSN patterns in source ───
function checkNoSsnPatterns() {
  const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/g;
  const extensions = [".ts", ".tsx", ".js", ".jsx", ".py", ".json", ".yaml", ".yml", ".md"];
  const skipDirs = ["node_modules", ".git", ".next", "dist", "build", ".turbo"];

  function walk(dir) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (skipDirs.includes(entry.name)) continue;
        walk(full);
      } else if (extensions.includes(extname(entry.name))) {
        const content = readFileSync(full, "utf-8");
        if (ssnPattern.test(content)) {
          // Exclude obvious test/example patterns
          if (content.includes("XXX-XX-XXXX") || content.includes("000-00-0000")) continue;
          errors.push(`Possible SSN pattern in ${full}`);
        }
      }
    }
  }

  walk(ROOT);
}

// ─── Check 4: HIPAA control mapping present ───
function checkHipaaControlsMapped() {
  const path = join(ROOT, "compliance/hipaa/security-rule-controls.md");
  if (!existsSync(path)) {
    errors.push("compliance/hipaa/security-rule-controls.md missing");
    return;
  }
  const content = readFileSync(path, "utf-8");
  const requiredSections = [
    "§ 164.308",
    "§ 164.310",
    "§ 164.312",
    "§ 164.314",
    "§ 164.316",
  ];
  for (const section of requiredSections) {
    if (!content.includes(section)) {
      errors.push(`HIPAA controls doc missing section: ${section}`);
    }
  }
}

// ─── Check 5: Audit log immutability triggers present in schema ───
function checkAuditImmutabilityTriggers() {
  const path = join(ROOT, "database/schema/002_audit_log.sql");
  if (!existsSync(path)) {
    errors.push("database/schema/002_audit_log.sql missing");
    return;
  }
  const content = readFileSync(path, "utf-8");
  if (!content.includes("prevent_audit_log_modification")) {
    errors.push("Audit log schema missing immutability trigger function");
  }
  if (!content.includes("audit_log_no_update")) {
    errors.push("Audit log schema missing UPDATE trigger");
  }
  if (!content.includes("audit_log_no_delete")) {
    errors.push("Audit log schema missing DELETE trigger");
  }
}

// ─── Check 6: All BAA-required vendors listed ───
function checkBaaCoverage() {
  const path = join(ROOT, "data-flows.yaml");
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf-8");
  const requiredVendors = ["AWS", "Supabase", "Anthropic", "Stripe", "Twilio"];
  for (const vendor of requiredVendors) {
    if (!content.includes(vendor)) {
      warnings.push(`BAA registry missing reference to: ${vendor}`);
    }
  }
}

// ─── Run all checks ───
console.log("🔒 Zara OS HIPAA Control Check");
console.log("══════════════════════════════════════════════════");

checkDataFlows();
checkNoEnvCommitted();
checkNoSsnPatterns();
checkHipaaControlsMapped();
checkAuditImmutabilityTriggers();
checkBaaCoverage();

console.log("");
if (warnings.length > 0) {
  console.log("⚠️  Warnings:");
  for (const w of warnings) console.log(`   • ${w}`);
  console.log("");
}

if (errors.length > 0) {
  console.log("❌ ERRORS — PR cannot merge:");
  for (const e of errors) console.log(`   • ${e}`);
  console.log("");
  console.log("Fix the above before continuing.");
  process.exit(1);
}

console.log("✅ All HIPAA control checks passed");
process.exit(0);
