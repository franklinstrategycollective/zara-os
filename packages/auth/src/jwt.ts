/**
 * Zara OS — JWT auth.
 * RS256 only (HS256 forbidden — see Part 5 security rules).
 * Access token: 15min. Refresh token: 7d.
 */
import { SignJWT, jwtVerify, importPKCS8, importSPKI, type JWTPayload } from "jose";
import { z } from "zod";

export const ZaraClaimsSchema = z.object({
  sub: z.string(),                        // user_id
  tid: z.string(),                        // tenant_id
  role: z.enum(["provider", "ma", "admin", "billing", "patient", "system"]),
  npi: z.string().nullable(),
  iat: z.number(),
  exp: z.number(),
  iss: z.literal("zara-os"),
  aud: z.literal("zara-os-api"),
  jti: z.string(),                        // for revocation
  mfa: z.boolean(),                       // MFA satisfied this session?
});
export type ZaraClaims = z.infer<typeof ZaraClaimsSchema>;

export interface JwtConfig {
  privateKeyPem: string;                  // PKCS8
  publicKeyPem: string;                   // SPKI
  accessTtlSeconds: number;               // default 900 (15 min)
  refreshTtlSeconds: number;              // default 604800 (7 days)
}

export class ZaraJwt {
  private privateKey: CryptoKey | null = null;
  private publicKey: CryptoKey | null = null;

  constructor(private config: JwtConfig) {}

  private async ensureKeys(): Promise<void> {
    if (!this.privateKey) {
      this.privateKey = await importPKCS8(this.config.privateKeyPem, "RS256");
    }
    if (!this.publicKey) {
      this.publicKey = await importSPKI(this.config.publicKeyPem, "RS256");
    }
  }

  async signAccessToken(claims: Omit<ZaraClaims, "iat" | "exp" | "iss" | "aud" | "jti">): Promise<string> {
    await this.ensureKeys();
    const jti = crypto.randomUUID();

    return new SignJWT({ ...claims, jti })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuer("zara-os")
      .setAudience("zara-os-api")
      .setIssuedAt()
      .setExpirationTime(`${this.config.accessTtlSeconds}s`)
      .sign(this.privateKey!);
  }

  async signRefreshToken(userId: string, tenantId: string): Promise<{ token: string; jti: string }> {
    await this.ensureKeys();
    const jti = crypto.randomUUID();

    const token = await new SignJWT({ sub: userId, tid: tenantId, type: "refresh", jti })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuer("zara-os")
      .setAudience("zara-os-refresh")
      .setIssuedAt()
      .setExpirationTime(`${this.config.refreshTtlSeconds}s`)
      .sign(this.privateKey!);

    return { token, jti };
  }

  async verifyAccessToken(token: string): Promise<ZaraClaims> {
    await this.ensureKeys();
    const { payload } = await jwtVerify(token, this.publicKey!, {
      issuer: "zara-os",
      audience: "zara-os-api",
      algorithms: ["RS256"],
    });
    return ZaraClaimsSchema.parse(payload);
  }

  async verifyRefreshToken(token: string): Promise<JWTPayload> {
    await this.ensureKeys();
    const { payload } = await jwtVerify(token, this.publicKey!, {
      issuer: "zara-os",
      audience: "zara-os-refresh",
      algorithms: ["RS256"],
    });
    return payload;
  }
}
