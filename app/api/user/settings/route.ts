import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Define interface for user preferences
interface UserPreferences {
  theme: "light" | "dark" | "system";
  emailNotifications: boolean;
  shareAnalytics: boolean;
  [key: string]: string | boolean | undefined;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        name: true,
        email: true,
        preferences: true,
        apiKey: true,
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json({
      profile: {
        name: user.name,
        email: user.email,
      },
      preferences: (user.preferences as UserPreferences) || {
        theme: "system",
        emailNotifications: true,
        shareAnalytics: false,
      },
      apiKey: user.apiKey,
    });
  } catch (error) {
    console.error("[USER_SETTINGS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
