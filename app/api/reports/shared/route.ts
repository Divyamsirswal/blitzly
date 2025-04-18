import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true },
    });

    if (!user || !user.email) {
      return new NextResponse("User not found", { status: 404 });
    }

    const userEmail = user.email.toLowerCase(); // Normalize email for comparison

    // Fetch ONLY reports that have been explicitly shared with the current user
    // or are owned by the current user and shared
    const sharedReports = await prisma.report.findMany({
      where: {
        // Reports must be public and have a share token
        isPublic: true,
        shareToken: { not: null },
        // Only return reports that:
        OR: [
          // 1. Are authored by the current user (their own shared reports)
          { authorId: user.id },

          // 2. Are shared with "anyone" mode and don't require specific viewers
          {
            AND: [
              {
                shareSettings: {
                  path: ["sharingMode"],
                  equals: "anyone",
                },
              },
              {
                NOT: {
                  shareSettings: {
                    path: ["requireAuth"],
                    equals: true,
                  },
                },
              },
              {
                authorId: {
                  not: user.id, // Avoid duplicates with the user's own reports
                },
              },
            ],
          },

          // 3. Are shared with "anyone" mode but require authentication (user is authenticated)
          {
            AND: [
              {
                shareSettings: {
                  path: ["sharingMode"],
                  equals: "anyone",
                },
              },
              {
                shareSettings: {
                  path: ["requireAuth"],
                  equals: true,
                },
              },
              {
                authorId: {
                  not: user.id, // Avoid duplicates with the user's own reports
                },
              },
            ],
          },

          // 4. Are shared specifically with this user's email
          {
            shareSettings: {
              path: ["allowedViewers"],
              array_contains: userEmail,
            },
          },

          // 5. Are shared with "specific" mode and user's email is in the allowedViewers
          {
            AND: [
              {
                shareSettings: {
                  path: ["sharingMode"],
                  equals: "specific",
                },
              },
              {
                shareSettings: {
                  path: ["allowedViewers"],
                  array_contains: userEmail,
                },
              },
            ],
          },
        ],
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
        ReportView: {
          orderBy: {
            viewedAt: "desc",
          },
          take: 1,
        },
        _count: {
          select: { ReportView: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format the response
    const formattedReports = sharedReports.map((report) => {
      // Get the last viewed date if available
      const lastViewed =
        report.ReportView.length > 0
          ? report.ReportView[0].viewedAt.toISOString()
          : null;

      // Format the report data
      return {
        id: report.id,
        title: report.title,
        content: report.content,
        metrics: report.metrics as Record<string, string>,
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
        isPublic: report.isPublic,
        shareToken: report.shareToken,
        shareUrl: report.shareToken
          ? `${
              process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL
            }/reports/share/${report.shareToken}`
          : undefined,
        views: report._count.ReportView,
        viewCount: report._count.ReportView,
        lastViewed,
        authorId: report.authorId,
        isOwner: report.authorId === user.id,
        author: {
          name: report.author.name || null,
          email: report.author.email,
          image: report.author.image,
        },
        shareSettings: report.shareSettings,
      };
    });

    return NextResponse.json(formattedReports);
  } catch (error) {
    console.error("Error fetching shared reports:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
