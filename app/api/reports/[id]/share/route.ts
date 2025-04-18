import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { nanoid } from "nanoid";
import { ShareRequest, ShareResponse } from "@/types/share";

type ShareSettings = {
  allowComments: boolean;
  requireAuth: boolean;
  expiryDate: string | null;
  sharingMode: "anyone" | "specific";
  allowedViewers: string[];
};

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email as string,
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Find the report
    const report = await prisma.report.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!report) {
      return new NextResponse("Report not found", { status: 404 });
    }

    // Check if user owns the report
    if (report.authorId !== user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Parse the request body for share settings
    const body = (await req.json()) as ShareRequest;
    const {
      allowComments = false,
      requireAuth = true,
      expiryDate = null,
      allowedViewers = [], // Array of email addresses that can view the report
      sharingMode = "anyone", // "anyone" or "specific"
    } = body;

    // Generate share ID if not exists
    const shareToken = report.shareToken || nanoid(10);

    // Create share settings object
    const shareSettings: ShareSettings = {
      allowComments,
      requireAuth,
      expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
      allowedViewers: sharingMode === "specific" ? allowedViewers : [],
      sharingMode,
    };

    // Update report with share ID, settings, and make it public
    const updatedReport = await prisma.report.update({
      where: {
        id: params.id,
      },
      data: {
        shareToken,
        isPublic: true,
        shareSettings,
      },
    });

    const shareUrl = `${
      process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL
    }/reports/share/${shareToken}`;

    const response: ShareResponse = {
      shareUrl,
      shareToken,
      shareSettings: updatedReport.shareSettings as ShareSettings,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[REPORT_SHARE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email as string,
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Find the report
    const report = await prisma.report.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!report) {
      return new NextResponse("Report not found", { status: 404 });
    }

    // Check if user owns the report
    if (report.authorId !== user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Remove share URL and make report private
    await prisma.report.update({
      where: {
        id: params.id,
      },
      data: {
        shareToken: null,
        isPublic: false,
        shareSettings: {},
      },
    });

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("[REPORT_SHARE_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
