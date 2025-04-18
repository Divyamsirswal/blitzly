import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const totalReports = await prisma.report.count({
      where: { authorId: user.id },
    });

    const publicReports = await prisma.report.count({
      where: { authorId: user.id, isPublic: true },
    });

    const totalViews = await prisma.reportView.count({
      where: {
        report: {
          authorId: user.id,
        },
      },
    });

    return NextResponse.json({
      totalReports,
      publicReports,
      totalViews,
    });
  } catch (error) {
    console.error("[REPORTS_STATS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
