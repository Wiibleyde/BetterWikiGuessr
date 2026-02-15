import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const JWT_SECRET = process.env.JWT_SECRET ?? "";
const JWT_EXPIRATION_DAYS = 30;

function assertSecretConfigured(): void {
    if (!JWT_SECRET) {
        throw new Error(
            "[jwt] JWT_SECRET is not set — authentication cannot operate without a secret",
        );
    }
}

interface JWTPayload {
    userId: number;
    discordId: string;
    exp: number;
}

function base64UrlEncode(data: string): string {
    return Buffer.from(data).toString("base64url");
}

function base64UrlDecode(data: string): string {
    return Buffer.from(data, "base64url").toString("utf-8");
}

function sign(input: string): string {
    return createHmac("sha256", JWT_SECRET).update(input).digest("base64url");
}

export function signJWT(payload: Omit<JWTPayload, "exp">): string {
    assertSecretConfigured();
    const header = base64UrlEncode(
        JSON.stringify({ alg: "HS256", typ: "JWT" }),
    );
    const exp =
        Math.floor(Date.now() / 1000) + JWT_EXPIRATION_DAYS * 24 * 60 * 60;
    const payloadB64 = base64UrlEncode(JSON.stringify({ ...payload, exp }));
    const signature = sign(`${header}.${payloadB64}`);
    return `${header}.${payloadB64}.${signature}`;
}

export function verifyJWT(token: string): JWTPayload | null {
    assertSecretConfigured();
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const expectedSignature = sign(`${header}.${payload}`);

    const sigBuffer = Buffer.from(signature, "base64url");
    const expectedBuffer = Buffer.from(expectedSignature, "base64url");

    if (
        sigBuffer.length !== expectedBuffer.length ||
        !timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
        return null;
    }

    try {
        const decoded = JSON.parse(base64UrlDecode(payload)) as JWTPayload;
        if (decoded.exp < Math.floor(Date.now() / 1000)) return null;
        return decoded;
    } catch {
        return null;
    }
}

export function generateState(): string {
    return randomBytes(32).toString("hex");
}
