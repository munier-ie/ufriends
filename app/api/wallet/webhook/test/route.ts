import { NextResponse } from "next/server"

// Simple test endpoint to verify webhook routes are accessible
export async function GET() {
    return NextResponse.json({ ok: true, message: "Webhook endpoint is reachable", timestamp: new Date().toISOString() })
}

export async function POST() {
    return NextResponse.json({ ok: true, message: "POST to webhook endpoint works", timestamp: new Date().toISOString() })
}
