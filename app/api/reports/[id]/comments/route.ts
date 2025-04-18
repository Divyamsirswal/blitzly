import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Define a simplified ShareSettings interface that matches the database structure
interface ReportShareSettings {
  allowComments?: boolean;
  requireAuth?: boolean;
  [key: string]: boolean | string | null | string[] | undefined;
}

// GET - Fetch comments for a specific report
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;

    // Check if report exists and is accessible
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        isPublic: true,
        authorId: true,
        shareSettings: true,
      },
    });

    if (!report) {
      return new NextResponse("Report not found", { status: 404 });
    }

    // Get current session
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;

    // Get user ID from email if logged in
    const user = userEmail
      ? await prisma.user.findUnique({
          where: { email: userEmail },
          select: { id: true },
        })
      : null;

    // Check if user has access to report
    const isAuthor = user?.id === report.authorId;
    const isPublic = report.isPublic;

    if (!isAuthor && !isPublic) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if comments are allowed for this report
    const shareSettings = (report.shareSettings as ReportShareSettings) || {};
    if (!isAuthor && !shareSettings.allowComments) {
      return new NextResponse("Comments are disabled for this report", {
        status: 403,
      });
    }

    // Fetch comments
    const comments = await prisma.comment.findMany({
      where: { reportId },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST - Add a new comment to a report
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const reportId = params.id;
    const { content } = await request.json();

    if (!content?.trim()) {
      return new NextResponse("Comment content is required", { status: 400 });
    }

    // Get user ID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Check if report exists and comments are allowed
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        isPublic: true,
        authorId: true,
        shareSettings: true,
      },
    });

    if (!report) {
      return new NextResponse("Report not found", { status: 404 });
    }

    const isAuthor = user.id === report.authorId;
    const shareSettings = (report.shareSettings as ReportShareSettings) || {};

    // Only author or people with permission can comment
    if (!isAuthor && (!report.isPublic || !shareSettings.allowComments)) {
      return new NextResponse(
        "You don't have permission to comment on this report",
        { status: 403 }
      );
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        reportId,
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Error adding comment:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
