import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const API_URL = process.env.API_URL || "http://localhost:8080";
    
    console.log(`[API Route] Proxying POST to ${API_URL}/api/generate-quiz`);
    
    const backendRes = await fetch(`${API_URL}/api/generate-quiz`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json().catch(() => ({ error: "Failed to parse backend response" }));

    if (!backendRes.ok) {
      console.error("[API Route] Backend error status:", backendRes.status, "Data:", data);
      return NextResponse.json(data, { status: backendRes.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error("[API Route] Exception during proxying:", err);
    return NextResponse.json({ error: `Next.js internal proxy error: ${err.message}` }, { status: 500 });
  }
}
