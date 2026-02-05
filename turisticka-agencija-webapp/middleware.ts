import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

const rolePermissions: Record<string, string[]> = {
  "/api/admin": ["ADMIN"],
  "/api/agent": ["ADMIN", "AGENT"],
  "/api/client": ["ADMIN", "AGENT", "CLIENT"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/register")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Niste autentifikovani." },
      { status: 401 }
    );
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const userRole = payload.role as string;

    for (const route in rolePermissions) {
      if (pathname.startsWith(route)) {
        if (!rolePermissions[route].includes(userRole)) {
          return NextResponse.json(
            { message: "Nemate pravo pristupa ovoj ruti." },
            { status: 403 }
          );
        }
      }
    }

    return NextResponse.next();
  } catch (error) {
    return NextResponse.json(
      { message: "Nevažeći token." },
      { status: 401 }
    );
  }
}

