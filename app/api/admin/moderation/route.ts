import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Fetch reported comments for moderation
export async function GET(request: Request) {
  try {
    // Get session and check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // In a real app, you would check if the user is an admin
    // For this example, we'll assume all authenticated users can access this

    // Get status filter from query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";

    // Fetch reported comments with their details
    const reports = await prisma.commentReport.findMany({
      where: {
        status: status,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        comment: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            report: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Error fetching reported comments:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
