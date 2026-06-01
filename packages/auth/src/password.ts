/**
 * Zara OS — Password hashing.
 * argon2id only. Per Part 5 of Supreme Meta AGI security spec.
 */
import { hash, verify, type Options } from "@node-rs/argon2";

const ARGON2_OPTIONS: Options = {
  memoryCost: 65536,        // 64 MB
  timeCost: 3,
  outputLen: 32,
  parallelism: 4,
  algorithm: 2,             // argon2id
};

export async function hashPassword(plaintext: string): Promise<string> {
  if (plaintext.length < 12) {
    throw new Error("Password must be at least 12 characters");
  }
  if (plaintext.length > 1024) {
    throw new Error("Password exceeds maximum length");
  }
  return hash(plaintext, ARGON2_OPTIONS);
}

export async function verifyPassword(plaintext: string, encoded: string): Promise<boolean> {
  try {
    return await verify(encoded, plaintext, ARGON2_OPTIONS);
  } catch {
    return false;
  }
}

/**
 * Check password strength.
 * Required: 12+ chars, mixed case, number, symbol.
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 12) errors.push("Must be at least 12 characters");
  if (!/[A-Z]/.test(password)) errors.push("Must contain uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("Must contain lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("Must contain digit");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("Must contain symbol");

  // Block common weak passwords
  const weak = ["password", "admin", "letmein", "welcome", "qwerty"];
  if (weak.some((w) => password.toLowerCase().includes(w))) {
    errors.push("Contains common weak pattern");
  }

  return { valid: errors.length === 0, errors };
}
