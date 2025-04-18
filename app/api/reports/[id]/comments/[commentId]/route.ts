import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// DELETE - Remove a comment (only allowed for comment author or report owner)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const commentId = params.commentId;

    // Get user ID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Find the comment
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        report: {
          select: {
            authorId: true,
          },
        },
      },
    });

    if (!comment) {
      return new NextResponse("Comment not found", { status: 404 });
    }

    // Check if user is authorized to delete (either comment author or report owner)
    const isCommentAuthor = comment.authorId === user.id;
    const isReportOwner = comment.report.authorId === user.id;

    if (!isCommentAuthor && !isReportOwner) {
      return new NextResponse(
        "You don't have permission to delete this comment",
        { status: 403 }
      );
    }

    // Delete the comment
    await prisma.comment.delete({
      where: { id: commentId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
