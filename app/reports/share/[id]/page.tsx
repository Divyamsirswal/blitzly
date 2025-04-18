"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Download,
  LogIn,
  Shield,
  FileText,
  Calendar,
  Eye,
  PieChart,
  ArrowLeft,
  BarChart3,
  Copy,
  MessageSquare,
} from "lucide-react";
import { useSession, signIn } from "next-auth/react";
import { toast } from "sonner";
import { format as dateFormat } from "date-fns";
import CommentSection from "@/components/comments/CommentSection";

interface ShareSettings {
  allowComments: boolean;
  requireAuth: boolean;
  expiryDate: string | null;
  sharingMode?: "anyone" | "specific";
  allowedViewers?: string[];
}

interface SectionContentItem {
  type: string;
  content: unknown[];
}

interface SectionType {
  title?: string;
  content: SectionContentItem[];
}

interface ContentItem {
  type: string;
  content: string | number | boolean | Record<string, unknown>[] | unknown[];
}

interface ContentSection {
  title?: string;
  content: ContentItem[];
}

interface ChartData {
  type: string;
  title?: string;
  data: Record<string, unknown>;
  options?: Record<string, unknown>;
}

interface SharedReport {
  id: string;
  title: string;
  description: string;
  url: string;
  metrics: Record<string, string>;
  author: {
    id: string;
    email: string;
    name: string;
    image: string;
  };
  createdAt: string;
  updatedAt: string;
  content:
    | string
    | {
        sections: ContentSection[];
      };
  charts: ChartData[];
  shareSettings: ShareSettings;
  isOwner?: boolean;
  views?: number;
  shareToken?: string;
}

interface AuthError {
  error: string;
  requireAuth?: boolean;
  notAllowed?: boolean;
}

export default function SharedReportPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [report, setReport] = useState<SharedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requireAuth, setRequireAuth] = useState(false);
  const [notAllowed, setNotAllowed] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        setNotAllowed(false);
        const response = await fetch(`/api/reports/share/${params.id}`);

        if (!response.ok) {
          // Check if it's an authentication error
          if (response.status === 401) {
            const data = (await response.json()) as AuthError;
            if (data.requireAuth) {
              setRequireAuth(true);
              throw new Error("Authentication required to view this report");
            }
          }

          // Check if it's a permission error
          if (response.status === 403) {
            const data = (await response.json()) as AuthError;
            setNotAllowed(true);
            throw new Error(
              data.error || "You don't have permission to view this report"
            );
          }

          if (response.status === 404) {
            throw new Error("Report not found");
          }

          throw new Error("Failed to load report");
        }

        const data = await response.json();

        // Check if there's an expiry date and if it's passed
        if (data.shareSettings?.expiryDate) {
          const expiryDate = new Date(data.shareSettings.expiryDate);
          if (expiryDate < new Date()) {
            throw new Error("This shared link has expired");
          }
        }

        setReport(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchReport();
    }
  }, [params.id, status, session]);

  const handleDownload = () => {
    if (!report) return;

    const textContent = `
${report.title.toUpperCase()}

Content:
${report.content}

Metrics:
${Object.entries(report.metrics)
  .map(([key, value]) => `${key}: ${value}`)
  .join("\n")}

Report Details:
- Created: ${dateFormat(new Date(report.createdAt), "PPpp")}
${
  report.updatedAt
    ? `- Last Updated: ${dateFormat(new Date(report.updatedAt), "PPpp")}`
    : ""
}
- Status: Shared Report
${report.author?.name ? `- Author: ${report.author.name}` : ""}

Generated on: ${dateFormat(new Date(), "PPpp")}
    `.trim();

    const element = document.createElement("a");
    const file = new Blob([textContent], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${report.title}-${dateFormat(
      new Date(),
      "yyyy-MM-dd"
    )}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast.success("Report downloaded successfully");
  };

  const handleLogin = () => {
    // Redirect to the sign-in page with a callbackUrl to return to this page
    signIn(undefined, { callbackUrl: window.location.href });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dot-pattern dark:bg-dot-pattern-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shadow-inner">
            <Loader2 className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-spin" />
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-20"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500"></span>
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
            Loading report...
          </p>
        </div>
      </div>
    );
  }

  if (requireAuth && status !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50/50 dark:bg-gray-950/50 p-4">
        <Card className="max-w-md w-full backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold text-blue-600 dark:text-blue-400">
              Authentication Required
            </CardTitle>
            <CardDescription>
              This report requires you to sign in before viewing.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6 space-y-4">
            <Shield className="h-12 w-12 text-blue-500 dark:text-blue-400 mb-2" />
            <Button
              onClick={handleLogin}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              <LogIn className="h-4 w-4" />
              Sign In to View Report
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (notAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50/50 dark:bg-gray-950/50 p-4">
        <Card className="max-w-md w-full backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold text-red-600 dark:text-red-400">
              Access Denied
            </CardTitle>
            <CardDescription>
              You don&apos;t have permission to view this report.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6 space-y-4">
            <Shield className="h-12 w-12 text-red-500 dark:text-red-400 mb-2" />
            <p className="text-gray-600 dark:text-gray-400 text-center">
              Please contact the report owner to request access.
            </p>
            {session?.user?.email && (
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
                Signed in as: {session.user.email}
              </p>
            )}
            {status === "authenticated" ? (
              <Button
                variant="outline"
                onClick={() => signIn()}
                className="mt-2"
              >
                Switch Account
              </Button>
            ) : (
              <Button
                onClick={handleLogin}
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50/50 dark:bg-gray-950/50 p-4">
        <Card className="max-w-md w-full backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold text-red-600 dark:text-red-400">
              Report Unavailable
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6 space-y-4">
            <p className="text-gray-500 dark:text-gray-400 text-center">
              {error ||
                "The report you're looking for doesn't exist or has been removed."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/50 pb-12">
      <div className="relative bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-950/20 dark:to-transparent overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-30 dark:opacity-10"></div>
        <div className="container max-w-screen-xl py-8 md:py-12 relative">
          {/* Header */}
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 px-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  onClick={() => router.push("/")}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Home</span>
                </Button>
                <Badge className="bg-blue-100 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  Shared Report
                </Badge>
              </div>

              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="space-y-1 max-w-2xl">
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                    {report.title}
                  </h1>
                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      <span>
                        Created{" "}
                        {dateFormat(new Date(report.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    {report.author?.name && (
                      <div className="flex items-center">
                        <span>by {report.author.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 self-start mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
                    Download
                  </Button>
                </div>
              </div>
            </div>

            {/* Metrics Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(report.metrics).map(
                ([key, value]: [string, string], index: number) => (
                  <Card
                    key={index}
                    className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-800/50 shadow-sm"
                  >
                    <CardHeader className="pb-2 pt-4">
                      <CardTitle className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {key}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {value}
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          </div>

          {/* Report Content Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card
              id="report-content"
              className="lg:col-span-2 bg-white dark:bg-gray-900 border-gray-200/50 dark:border-gray-800/50 shadow-sm overflow-hidden"
            >
              <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-800/70">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Report Content
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {report.content && (
                  <div className="prose prose-blue dark:prose-invert max-w-none">
                    {typeof report.content === "string"
                      ? // Handle old string format
                        report.content
                          .split("\n\n")
                          .map((section: string, idx: number) => {
                            // Check if it's a heading (starts with ** and ends with **)
                            if (
                              section.startsWith("**") &&
                              section.endsWith("**")
                            ) {
                              const headingText = section.replace(
                                /^\*\*|\*\*$/g,
                                ""
                              );
                              return (
                                <h2
                                  key={idx}
                                  className="text-xl md:text-2xl font-bold mt-6 mb-3 text-blue-600 dark:text-blue-400"
                                >
                                  {headingText}
                                </h2>
                              );
                            }

                            // Check if it's a table (contains | character)
                            if (section.includes("|")) {
                              const rows = section.split("\n");
                              if (rows.length > 1) {
                                return (
                                  <div
                                    key={idx}
                                    className="overflow-x-auto my-6"
                                  >
                                    <table className="w-full border-collapse">
                                      <tbody>
                                        {rows.map((row, rowIdx) => {
                                          const cells = row
                                            .split("|")
                                            .filter(
                                              (cell) => cell.trim() !== ""
                                            )
                                            .map((cell) => cell.trim());

                                          if (cells.length === 0) return null;

                                          return (
                                            <tr
                                              key={rowIdx}
                                              className={
                                                rowIdx % 2 === 0
                                                  ? "bg-gray-50 dark:bg-gray-800/50"
                                                  : "bg-white dark:bg-gray-900"
                                              }
                                            >
                                              {cells.map((cell, cellIdx) => (
                                                <td
                                                  key={cellIdx}
                                                  className={`py-2 px-3 border-b border-gray-200 dark:border-gray-700 ${
                                                    cellIdx === 0
                                                      ? "font-medium text-gray-900 dark:text-white"
                                                      : "text-gray-600 dark:text-gray-300"
                                                  }`}
                                                >
                                                  {cell}
                                                </td>
                                              ))}
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                );
                              }
                            }

                            // Check if it's a key point (starts with number and period)
                            if (/^\d+\.\s/.test(section)) {
                              return (
                                <div key={idx} className="ml-4 my-3">
                                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {section}
                                  </p>
                                </div>
                              );
                            }

                            // Regular paragraph
                            return (
                              <p
                                key={idx}
                                className="my-2 text-gray-700 dark:text-gray-300 leading-relaxed"
                              >
                                {section}
                              </p>
                            );
                          })
                      : // Handle new object format with sections
                      "sections" in report.content && report.content.sections
                      ? (
                          report.content.sections as unknown as SectionType[]
                        ).map((section: SectionType, idx: number) => {
                          // Check if it's a heading (starts with ** or # or ##)
                          if (
                            section.title &&
                            section.title.startsWith("**") &&
                            section.title.endsWith("**")
                          ) {
                            const headingText = section.title.replace(
                              /^\*\*|\*\*$/g,
                              ""
                            );
                            return (
                              <h2
                                key={idx}
                                className="text-xl md:text-2xl font-bold mt-6 mb-3 text-blue-600 dark:text-blue-400"
                              >
                                {headingText}
                              </h2>
                            );
                          }

                          // Check if it's a table section
                          const hasTableContent = section.content.some(
                            (item: { type: string; content: unknown }) => {
                              if (typeof item.content === "string") {
                                return item.content.includes("|");
                              }
                              if (
                                Array.isArray(item.content) &&
                                item.content.length > 0
                              ) {
                                const firstItem = item.content[0];
                                return (
                                  typeof firstItem === "string" &&
                                  firstItem.includes("|")
                                );
                              }
                              return false;
                            }
                          );

                          if (hasTableContent) {
                            return (
                              <div key={idx} className="overflow-x-auto my-6">
                                <table className="w-full border-collapse">
                                  <tbody>
                                    {section.content.map(
                                      (
                                        item: {
                                          type: string;
                                          content: unknown;
                                        },
                                        itemIdx
                                      ) => {
                                        const content =
                                          typeof item.content === "string"
                                            ? item.content
                                            : Array.isArray(item.content)
                                            ? item.content.join(" ")
                                            : "";

                                        if (!content.includes("|")) return null;

                                        const cells = content
                                          .split("|")
                                          .filter((cell) => cell.trim() !== "")
                                          .map((cell) => cell.trim());

                                        return (
                                          <tr
                                            key={itemIdx}
                                            className={
                                              itemIdx % 2 === 0
                                                ? "bg-gray-50 dark:bg-gray-800/50"
                                                : "bg-white dark:bg-gray-900"
                                            }
                                          >
                                            {cells.map((cell, cellIdx) => (
                                              <td
                                                key={cellIdx}
                                                className={`py-2 px-3 border-b border-gray-200 dark:border-gray-700 ${
                                                  cellIdx === 0
                                                    ? "font-medium text-gray-900 dark:text-white"
                                                    : "text-gray-600 dark:text-gray-300"
                                                }`}
                                              >
                                                {cell}
                                              </td>
                                            ))}
                                          </tr>
                                        );
                                      }
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            );
                          }

                          // Default content rendering
                          return (
                            <div key={idx} className="my-4">
                              {section.content.map(
                                (
                                  item: { type: string; content: unknown },
                                  lineIdx: number
                                ) => {
                                  const content =
                                    typeof item === "string"
                                      ? item
                                      : typeof item.content === "string"
                                      ? item.content
                                      : Array.isArray(item.content)
                                      ? item.content.join(" ")
                                      : "";

                                  // Skip empty content
                                  if (!content.trim()) return null;

                                  // Check if it's a numbered point
                                  if (/^\d+\.\s/.test(content)) {
                                    return (
                                      <div key={lineIdx} className="ml-4 my-2">
                                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                          {content}
                                        </p>
                                      </div>
                                    );
                                  }

                                  return (
                                    <p
                                      key={lineIdx}
                                      className="my-2 text-gray-700 dark:text-gray-300 leading-relaxed"
                                    >
                                      {content}
                                    </p>
                                  );
                                }
                              )}
                            </div>
                          );
                        })
                      : null}
                  </div>
                )}

                {/* Call To Action */}
                <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 flex flex-col sm:flex-row items-center gap-4">
                    <div className="text-center sm:text-left">
                      <h3 className="font-medium text-blue-800 dark:text-blue-300">
                        Want more detailed insights?
                      </h3>
                      <p className="text-sm text-blue-700/80 dark:text-blue-400/80 mt-1">
                        Generate your own comprehensive reports with our
                        AI-powered analytics
                      </p>
                    </div>
                    <Button
                      className="ml-auto bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => router.push("/")}
                    >
                      Get Started
                    </Button>
                  </div>
                </div>

                {/* Comment Section */}
                {report.shareSettings?.allowComments && (
                  <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 mb-4">
                      <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <h3 className="text-lg font-medium">Comments</h3>
                    </div>
                    <CommentSection
                      reportId={
                        report.shareToken ||
                        (typeof params.id === "string"
                          ? params.id
                          : params.id[0])
                      }
                      isOwner={false}
                      isPublic={true}
                      commentsEnabled={true}
                      isSharedReport={true}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card
                id="report-details"
                className="bg-white dark:bg-gray-900 border-gray-200/50 dark:border-gray-800/50 shadow-sm"
              >
                <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-800/70">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Report Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-5">
                  <div className="space-y-4">
                    {/* Date Created */}
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800/50">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Created
                        </span>
                      </div>
                      <time className="text-sm font-medium text-gray-900 dark:text-gray-200">
                        {report?.createdAt
                          ? dateFormat(
                              new Date(report.createdAt),
                              "MMM d, yyyy"
                            )
                          : "-"}
                      </time>
                    </div>

                    {/* Author */}
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800/50">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Author
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                        {report.author?.name || "-"}
                      </span>
                    </div>

                    {/* Metrics */}
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800/50">
                      <div className="flex items-center gap-2">
                        <PieChart className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Metrics
                        </span>
                      </div>
                      <Badge className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        {Object.keys(report.metrics).length}
                      </Badge>
                    </div>
                  </div>

                  {/* Stats Summary Card */}
                  <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800/30">
                    <h3 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">
                      Share Information
                    </h3>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-600 dark:text-blue-500">
                          Shared Link
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 p-0 w-7"
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            toast.success("Link copied to clipboard");
                          }}
                        >
                          <Copy className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        </Button>
                      </div>
                      {report.shareSettings?.expiryDate && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-600 dark:text-blue-500">
                            Expires
                          </span>
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                            {dateFormat(
                              new Date(report.shareSettings.expiryDate),
                              "MMM d, yyyy"
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
