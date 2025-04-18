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
        ReportView: true,
        comments: {
          select: {
            id: true,
          },
          where: {
            isHidden: false,
          },
        },
      },
    });

    if (!report) {
      return new NextResponse("Report not found", { status: 404 });
    }

    // Format the response
    const formattedReport = {
      id: report.id,
      title: report.title,
      content: report.content,
      metrics: report.metrics,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
      isPublic: report.isPublic,
      shareToken: report.shareToken,
      views: report.ReportView.length,
      authorId: report.authorId,
      author: {
        name: report.author.name || null,
        email: report.author.email,
      },
    };

    console.log("API Response:", {
      session: session?.user?.email,
      reportAuthorId: report.authorId,
      formattedReport,
    });

    return NextResponse.json(formattedReport);
  } catch (error) {
    console.error("Error fetching report:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { title, content, metrics } = body;

    // Validate required fields
    if (!title?.trim()) {
      return new NextResponse(
        JSON.stringify({ message: "Title is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!content?.trim()) {
      return new NextResponse(
        JSON.stringify({ message: "Content is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!metrics || Object.keys(metrics).length === 0) {
      return new NextResponse(
        JSON.stringify({ message: "At least one metric is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get user ID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return new NextResponse(JSON.stringify({ message: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Find the report and verify ownership
    const report = await prisma.report.findFirst({
      where: {
        id: params.id,
        authorId: user.id,
      },
    });

    if (!report) {
      return new NextResponse(
        JSON.stringify({
          message: "Report not found or you don't have permission to edit it",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update the report
    const updatedReport = await prisma.report.update({
      where: {
        id: params.id,
      },
      data: {
        title: title.trim(),
        content: content.trim(),
        metrics: metrics,
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: {
            name: true,
            email: true,
          },
        },
        ReportView: true,
      },
    });

    // Format the response
    const formattedReport = {
      id: updatedReport.id,
      title: updatedReport.title,
      content: updatedReport.content,
      metrics: updatedReport.metrics,
      createdAt: updatedReport.createdAt.toISOString(),
      updatedAt: updatedReport.updatedAt.toISOString(),
      isPublic: updatedReport.isPublic,
      shareToken: updatedReport.shareToken,
      views: updatedReport.ReportView.length,
      authorId: updatedReport.authorId,
      author: {
        name: updatedReport.author.name || null,
        email: updatedReport.author.email,
      },
    };

    return NextResponse.json(formattedReport);
  } catch (error) {
    console.error("Error updating report:", error);
    return new NextResponse(
      JSON.stringify({ message: "Failed to update report" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get user ID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Find the report and verify ownership
    const report = await prisma.report.findFirst({
      where: {
        id: params.id,
        authorId: user.id,
      },
    });

    if (!report) {
      return new NextResponse("Report not found", { status: 404 });
    }

    // Delete the report
    await prisma.report.delete({
      where: {
        id: params.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting report:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
