import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// DELETE - Delete a comment permanently
export async function DELETE(
  request: Request,
  { params }: { params: { reportId: string } }
) {
  try {
    // Get session and check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // In a real app, you would check if the user is an admin
    // For this example, we'll assume all authenticated users can access this

    const reportId = params.reportId;

    // Get the report
    const report = await prisma.commentReport.findUnique({
      where: { id: reportId },
      select: {
        commentId: true,
      },
    });

    if (!report) {
      return new NextResponse("Report not found", { status: 404 });
    }

    // Delete the comment (will cascade delete all reports)
    await prisma.comment.delete({
      where: { id: report.commentId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
