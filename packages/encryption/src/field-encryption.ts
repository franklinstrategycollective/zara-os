/**
 * Zara OS — Field-level encryption.
 * Per ADR-005: AES-256-GCM, tenant-scoped data keys, KMS-wrapped.
 *
 * Two modes:
 *   - randomized: maximum security, no equality search possible
 *   - deterministic: enables equality search (use sparingly, only for indexed fields)
 */
import { webcrypto } from "node:crypto";

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export interface DataKeyProvider {
  /** Returns the active data encryption key (DEK) for a tenant, plaintext. */
  getDek(tenantId: string): Promise<Uint8Array>;
  /** For deterministic encryption: returns a stable per-tenant secret. */
  getDeterministicSecret(tenantId: string): Promise<Uint8Array>;
}

export class FieldEncryption {
  constructor(private dekProvider: DataKeyProvider) {}

  /**
   * Randomized encryption — different ciphertext every time for same plaintext.
   * Use for: SSN, full names, addresses, clinical notes, audio.
   */
  async encryptRandomized(plaintext: string, tenantId: string): Promise<string> {
    if (!plaintext) return plaintext;

    const dek = await this.dekProvider.getDek(tenantId);
    const key = await webcrypto.subtle.importKey(
      "raw",
      dek,
      { name: ALGORITHM },
      false,
      ["encrypt"],
    );

    const iv = webcrypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const encoded = new TextEncoder().encode(plaintext);

    const ciphertext = await webcrypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      encoded,
    );

    // Format: base64(iv || ciphertext_with_tag)
    const combined = new Uint8Array(IV_LENGTH + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), IV_LENGTH);

    return `zenc:v1:r:${Buffer.from(combined).toString("base64")}`;
  }

  async decryptRandomized(encoded: string, tenantId: string): Promise<string> {
    if (!encoded || !encoded.startsWith("zenc:v1:r:")) return encoded;

    const payload = encoded.replace("zenc:v1:r:", "");
    const combined = Buffer.from(payload, "base64");

    const iv = combined.subarray(0, IV_LENGTH);
    const ciphertext = combined.subarray(IV_LENGTH);

    const dek = await this.dekProvider.getDek(tenantId);
    const key = await webcrypto.subtle.importKey(
      "raw",
      dek,
      { name: ALGORITHM },
      false,
      ["decrypt"],
    );

    const plaintext = await webcrypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      ciphertext,
    );

    return new TextDecoder().decode(plaintext);
  }

  /**
   * Deterministic encryption — same ciphertext for same plaintext within a tenant.
   * Use ONLY for fields needing equality search: email lookup, phone lookup, member ID.
   * IV is derived deterministically from HMAC(secret, plaintext).
   */
  async encryptDeterministic(plaintext: string, tenantId: string): Promise<string> {
    if (!plaintext) return plaintext;

    const dek = await this.dekProvider.getDek(tenantId);
    const secret = await this.dekProvider.getDeterministicSecret(tenantId);

    // Derive IV from HMAC-SHA256(secret, plaintext), take first 12 bytes
    const hmacKey = await webcrypto.subtle.importKey(
      "raw",
      secret,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const macFull = await webcrypto.subtle.sign(
      "HMAC",
      hmacKey,
      new TextEncoder().encode(plaintext),
    );
    const iv = new Uint8Array(macFull).subarray(0, IV_LENGTH);

    const key = await webcrypto.subtle.importKey(
      "raw",
      dek,
      { name: ALGORITHM },
      false,
      ["encrypt"],
    );
    const ciphertext = await webcrypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      new TextEncoder().encode(plaintext),
    );

    const combined = new Uint8Array(IV_LENGTH + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), IV_LENGTH);

    return `zenc:v1:d:${Buffer.from(combined).toString("base64")}`;
  }

  /**
   * Hash for index-friendly lookups (no decryption ever needed).
   * Use this for email_hash, phone_hash columns.
   */
  async deterministicHash(plaintext: string, tenantId: string): Promise<string> {
    if (!plaintext) return plaintext;

    const secret = await this.dekProvider.getDeterministicSecret(tenantId);
    const hmacKey = await webcrypto.subtle.importKey(
      "raw",
      secret,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const mac = await webcrypto.subtle.sign(
      "HMAC",
      hmacKey,
      new TextEncoder().encode(plaintext.toLowerCase().trim()),
    );

    return `zhash:v1:${Buffer.from(mac).toString("base64url")}`;
  }
}

/**
 * Local dev DEK provider — uses env var key.
 * Production: replace with AWS KMS-backed provider.
 */
export class LocalDekProvider implements DataKeyProvider {
  constructor(private masterKey: Uint8Array) {
    if (masterKey.length !== 32) {
      throw new Error("Master key must be 32 bytes for AES-256");
    }
  }

  async getDek(_tenantId: string): Promise<Uint8Array> {
    // Local dev: same key for all tenants. PROD: per-tenant KMS-wrapped DEK.
    return this.masterKey;
  }

  async getDeterministicSecret(_tenantId: string): Promise<Uint8Array> {
    // Derive a stable secret from master key
    const secretMaterial = await webcrypto.subtle.digest(
      "SHA-256",
      new Uint8Array([...this.masterKey, ...new TextEncoder().encode("det-secret-v1")]),
    );
    return new Uint8Array(secretMaterial);
  }
}
