import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST - Approve a comment (dismiss the report)
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

    // Update the report status to approved
    await prisma.commentReport.update({
      where: { id: reportId },
      data: {
        status: "approved",
      },
    });

    // Check if this is the only report for this comment
    const otherReports = await prisma.commentReport.findMany({
      where: {
        commentId: report.commentId,
        status: "pending",
      },
    });

    // If no other pending reports, mark the comment as not reported
    if (otherReports.length === 0) {
      await prisma.comment.update({
        where: { id: report.commentId },
        data: {
          isReported: false,
        },
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error approving comment:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
