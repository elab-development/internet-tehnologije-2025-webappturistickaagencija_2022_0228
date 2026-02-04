import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json(
    { message: "Uspješno odjavljen korisnik." },
    { status: 200 }
  );

  response.cookies.set("auth_token", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0, 
  });

  return response;
}
