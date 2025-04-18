import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get user from database to ensure we have the correct ID
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email as string,
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const reports = await prisma.report.findMany({
      where: {
        authorId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        metrics: true,
        createdAt: true,
        isPublic: true,
      },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("[REPORTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
