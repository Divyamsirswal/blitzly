import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { nanoid } from "nanoid";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Generate a new API key
    const apiKey = `blz_${nanoid(32)}`;

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        apiKey,
      },
    });

    return NextResponse.json({ apiKey: updatedUser.apiKey });
  } catch (error) {
    console.error("[USER_API_KEY_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
