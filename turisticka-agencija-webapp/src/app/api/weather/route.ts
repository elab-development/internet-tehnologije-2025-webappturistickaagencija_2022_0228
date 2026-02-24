import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city");
  const apiKey = process.env.OPENWEATHER_API_KEY;

  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city!)}&appid=${apiKey}&units=metric&lang=hr`
  );
  const data = await res.json();
  return NextResponse.json(data);
}
