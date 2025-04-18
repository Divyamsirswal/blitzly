import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface ShareSettings {
  allowComments?: boolean;
  requireAuth?: boolean;
  expiryDate?: string | null;
  sharingMode?: "anyone" | "specific";
  allowedViewers?: string[]; // Array of email addresses allowed to view
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const headersList = headers();
    const userAgent = headersList.get("user-agent") || "unknown";
    const ip =
      headersList.get("x-forwarded-for") ||
      headersList.get("x-real-ip") ||
      "unknown";

    // Get current session first
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email?.toLowerCase();
    let userId: string | null = null;

    if (userEmail) {
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true },
      });
      userId = user?.id || null;
    }

    // First get the report to check auth requirements
    const report = await prisma.report.findFirst({
      where: {
        shareToken: params.id,
        isPublic: true,
      },
      select: {
        id: true,
        authorId: true,
        shareSettings: true,
        shareToken: true,
      },
    });

    if (!report) {
      return new NextResponse(
        JSON.stringify({ error: "Report not found or not shared" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse share settings
    const shareSettings = report.shareSettings as ShareSettings | null;

    // Check if report has expired
    if (shareSettings?.expiryDate) {
      const expiryDate = new Date(shareSettings.expiryDate);
      const now = new Date();

      if (expiryDate < now) {
        return new NextResponse(
          JSON.stringify({ error: "This share link has expired" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Is this user the author of the report?
    const isAuthor = userId === report.authorId;

    // Check authentication requirements
    if (shareSettings?.requireAuth === true && !session) {
      return new NextResponse(
        JSON.stringify({
          error: "Authentication required",
          requireAuth: true,
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check sharing mode and permission
    if (shareSettings?.sharingMode === "specific" && !isAuthor) {
      // For specific sharing, check if user's email is in the allowed list
      const allowedViewers = shareSettings.allowedViewers || [];

      if (allowedViewers.length > 0) {
        if (
          !userEmail ||
          !allowedViewers.some((email) => email.toLowerCase() === userEmail)
        ) {
          return new NextResponse(
            JSON.stringify({
              error: "You don't have permission to view this report",
              notAllowed: true,
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Now fetch the full report data
    const fullReport = await prisma.report.findUnique({
      where: {
        id: report.id,
      },
      include: {
        author: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
        ReportView: true,
      },
    });

    if (!fullReport) {
      return new NextResponse("Report not found", { status: 404 });
    }

    // Create a new view record
    await prisma.reportView.create({
      data: {
        reportId: fullReport.id,
        userAgent: userAgent || undefined,
        viewerIp: ip || undefined,
      },
    });

    // Format the response
    const formattedReport = {
      id: fullReport.id,
      title: fullReport.title,
      content: fullReport.content,
      metrics: fullReport.metrics as Record<string, string>,
      createdAt: fullReport.createdAt.toISOString(),
      updatedAt: fullReport.updatedAt.toISOString(),
      views: fullReport.ReportView.length + 1, // Include the new view
      shareToken: fullReport.shareToken,
      author: {
        name: fullReport.author.name || null,
        email: fullReport.author.email,
        image: fullReport.author.image,
      },
      shareSettings: fullReport.shareSettings as ShareSettings | null,
      isOwner: isAuthor,
    };

    return NextResponse.json(formattedReport);
  } catch (error) {
    console.error("Error fetching shared report:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
