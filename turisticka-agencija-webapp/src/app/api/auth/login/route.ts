import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/app/lib/prisma";
import { signToken } from "@/app/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email i lozinka su obavezni." },
        { status: 422 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Pogrešan email ili lozinka." },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { message: "Nalog je deaktiviran." },
        { status: 403 }
      );
    }

    const passwordOk = await bcrypt.compare(password, user.password);

    if (!passwordOk) {
      return NextResponse.json(
        { message: "Pogrešan email ili lozinka." },
        { status: 401 }
      );
    }

    const token = await signToken({
      userId: user.id,
      role: user.role,
    });

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, 
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { message: "Greška na serveru." },
      { status: 500 }
    );
  }
}
