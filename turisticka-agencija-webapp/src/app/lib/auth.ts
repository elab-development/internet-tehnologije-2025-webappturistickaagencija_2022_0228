import { SignJWT } from "jose";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret");

export type JwtPayload = {
  userId: number;
  role: "ADMIN" | "AGENT" | "CLIENT";
};

export async function signToken(payload: JwtPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, secret);

  return {
    userId: payload.userId as number,
    role: payload.role as "ADMIN" | "AGENT" | "CLIENT",
  };
}
