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

    const reports = await prisma.report.findMany({
      where: { authorId: user.id },
      select: {
        id: true,
        title: true,
        createdAt: true,
        views: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    const formattedReports = reports.map((report) => ({
      id: report.id,
      title: report.title,
      createdAt: report.createdAt.toISOString(),
      views: report.views,
    }));

    return NextResponse.json(formattedReports);
  } catch (error) {
    console.error("[REPORTS_RECENT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
