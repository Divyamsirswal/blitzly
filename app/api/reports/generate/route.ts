import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Groq } from "groq-sdk";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { title, content, metrics } = body;

    if (!title || !metrics) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Create report first with pending status
    const report = await prisma.report.create({
      data: {
        title,
        content: "",
        metrics,
        authorId: session.user.id,
        isPublic: false,
      },
    });

    // Generate report content using Groq
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a professional marketing report generator. Create a detailed, insightful report based on the provided metrics and additional context. 
            Focus on key insights, trends, and actionable recommendations. Use a professional tone and include specific suggestions based on the data.`,
          },
          {
            role: "user",
            content: `Generate a marketing performance report with the following information:
            
            Title: ${title}
            
            Metrics:
            ${Object.entries(metrics)
              .map(([key, value]) => `- ${key}: ${value}`)
              .join("\n")}
            
            Additional Context:
            ${content || "No additional context provided."}
            
            Please provide:
            1. Executive Summary
            2. Key Performance Metrics Analysis
            3. Insights and Trends
            4. Areas for Improvement
            5. Actionable Recommendations`,
          },
        ],
        model: "llama3-8b-8192",
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 1,
        stream: false,
      });

      const reportContent = completion.choices[0]?.message?.content;

      if (!reportContent) {
        throw new Error("Failed to generate report content");
      }

      // Update report with generated content
      const updatedReport = await prisma.report.update({
        where: { id: report.id },
        data: {
          content: reportContent,
        },
      });

      return NextResponse.json({ id: updatedReport.id });
    } catch (error) {
      console.error("[GROQ_ERROR]", error);

      // Mark the report as having failed by adding an error note to the content
      await prisma.report.update({
        where: { id: report.id },
        data: {
          content: "Report generation failed. Please try again.",
        },
      });

      return new NextResponse("Failed to generate report", { status: 500 });
    }
  } catch (error) {
    console.error("[REPORTS_GENERATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
