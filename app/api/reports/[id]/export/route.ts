import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Get user ID from email
    const user = session?.user?.email
      ? await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true },
        })
      : null;

    // Find the report
    const report = await prisma.report.findFirst({
      where: {
        OR: [
          {
            id: params.id,
            authorId: user?.id,
          },
          {
            id: params.id,
            isPublic: true,
          },
        ],
      },
      include: {
        author: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!report) {
      return new NextResponse("Report not found", { status: 404 });
    }

    // Generate export data
    const exportData = {
      title: report.title,
      author: report.author.name || report.author.email,
      createdAt: report.createdAt.toISOString(),
      content: report.content,
      metrics: report.metrics,
    };

    // Set headers for file download
    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    headers.set(
      "Content-Disposition",
      `attachment; filename="${report.title
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}.json"`
    );

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers,
    });
  } catch (error) {
    console.error("Error exporting report:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
