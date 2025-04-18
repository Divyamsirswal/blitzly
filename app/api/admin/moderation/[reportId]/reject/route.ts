import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST - Reject a comment (hide it but keep it in the database)
export async function POST(
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
      include: {
        comment: true,
      },
    });

    if (!report) {
      return new NextResponse("Report not found", { status: 404 });
    }

    // Update all pending reports for this comment to rejected
    await prisma.commentReport.updateMany({
      where: {
        commentId: report.commentId,
        status: "pending",
      },
      data: {
        status: "rejected",
      },
    });

    // Add hidden flag to the comment
    await prisma.comment.update({
      where: { id: report.commentId },
      data: {
        isHidden: true,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error rejecting comment:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
