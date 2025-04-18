import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST - Report a comment for moderation
export async function POST(
  request: Request,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const commentId = params.commentId;
    const { reason } = await request.json();

    if (!reason) {
      return new NextResponse("Report reason is required", { status: 400 });
    }

    // Get user ID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, reportId: true, authorId: true },
    });

    if (!comment) {
      return new NextResponse("Comment not found", { status: 404 });
    }

    // Prevent reporting your own comment
    if (comment.authorId === user.id) {
      return new NextResponse("You cannot report your own comment", {
        status: 400,
      });
    }

    // Check if this user has already reported this comment
    const existingReport = await prisma.commentReport.findFirst({
      where: {
        commentId: commentId,
        reporterId: user.id,
      },
    });

    if (existingReport) {
      return new NextResponse("You have already reported this comment", {
        status: 400,
      });
    }

    // Create the report
    await prisma.commentReport.create({
      data: {
        commentId: commentId,
        reporterId: user.id,
        reason: reason,
      },
    });

    // Update comment reported status if this is the first report
    await prisma.comment.update({
      where: { id: commentId },
      data: {
        isReported: true,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error reporting comment:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
