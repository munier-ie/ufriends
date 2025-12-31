import { SignJWT, jwtVerify, JWTPayload } from "jose";

const encoder = new TextEncoder();

function getAccessSecret() {
  const secret = process.env.JWT_SECRET || "dev_access_secret";
  return encoder.encode(secret);
}

function getRefreshSecret() {
  const secret = process.env.JWT_REFRESH_SECRET || "dev_refresh_secret";
  return encoder.encode(secret);
}

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

export type TokenPayload = {
  sub: string; // user id
  email: string;
  role: string;
  jti?: string; // token id for refresh
};

export async function signAccessToken(payload: TokenPayload, expiresInSeconds = 15 * 60) {
  return new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(nowSeconds() + expiresInSeconds)
    .sign(getAccessSecret());
}

export async function signRefreshToken(payload: TokenPayload, expiresInSeconds = 7 * 24 * 60 * 60) {
  return new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(nowSeconds() + expiresInSeconds)
    .sign(getRefreshSecret());
}

export async function verifyAccessToken<T = TokenPayload>(token: string) {
  const { payload } = await jwtVerify(token, getAccessSecret());
  return payload as T;
}

export async function verifyRefreshToken<T = TokenPayload>(token: string) {
  const { payload } = await jwtVerify(token, getRefreshSecret());
  return payload as T;
}

export async function sign2FAProof(payload: { sub: string }, expiresInSeconds = 5 * 60) {
  return new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(nowSeconds() + expiresInSeconds)
    .sign(getAccessSecret());
}

export async function verify2FAProof(token: string) {
  const { payload } = await jwtVerify(token, getAccessSecret());
  return payload as { sub: string };
}