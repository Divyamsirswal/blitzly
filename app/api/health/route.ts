import { NextResponse } from "next/server";

/**
 * GET /api/health
 * Simple health check endpoint to verify the application is running
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
}
