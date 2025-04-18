import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface ShareSettings {
  allowComments: boolean;
  allowExport?: boolean;
  allowShare?: boolean;
  [key: string]: unknown;
}

// GET - Fetch comments for a specific shared report
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const shareToken = params.id;

    // First, find the report by share token
    const report = await prisma.report.findFirst({
      where: {
        shareToken: shareToken,
      },
      select: {
        id: true,
        authorId: true,
        shareSettings: true,
        isPublic: true,
      },
    });

    if (!report) {
      return new NextResponse(
        JSON.stringify({ error: "Shared report not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if the report is public
    if (!report.isPublic) {
      return new NextResponse(
        JSON.stringify({ error: "Report is not public" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if comments are allowed for this report
    const shareSettings = (report.shareSettings as ShareSettings) || {
      allowComments: false,
    };
    if (!shareSettings.allowComments) {
      return new NextResponse(
        JSON.stringify({ error: "Comments are disabled for this report" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch comments
    const comments = await prisma.comment.findMany({
      where: { reportId: report.id },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments for shared report:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// POST - Add a new comment to a shared report
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const shareToken = params.id;

    if (!session?.user?.email) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { content } = await request.json();

    if (!content?.trim()) {
      return new NextResponse(
        JSON.stringify({ error: "Comment content is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get user ID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return new NextResponse(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Find the report by share token
    const report = await prisma.report.findFirst({
      where: {
        shareToken: shareToken,
      },
      select: {
        id: true,
        authorId: true,
        shareSettings: true,
        isPublic: true,
      },
    });

    if (!report) {
      return new NextResponse(
        JSON.stringify({ error: "Shared report not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if the report is public
    if (!report.isPublic) {
      return new NextResponse(
        JSON.stringify({ error: "Report is not public" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const shareSettings = (report.shareSettings as ShareSettings) || {
      allowComments: false,
    };

    // Check if comments are allowed
    if (!shareSettings.allowComments) {
      return new NextResponse(
        JSON.stringify({ error: "Comments are disabled for this report" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        reportId: report.id,
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Error adding comment to shared report:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
