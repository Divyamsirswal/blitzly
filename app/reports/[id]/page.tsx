"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileText,
  Share2,
  Clock,
  Edit,
  Trash2,
  ArrowLeft,
  Eye,
  Download,
  Calendar,
  ChevronRight,
  MoreHorizontal,
  Copy,
  BarChart3,
  PieChart,
  Pencil,
  MessageSquare,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { format as dateFormat } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { QRCodeSVG } from "qrcode.react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import CommentSection from "@/components/comments/CommentSection";
import { cn } from "@/lib/utils";

interface Report {
  id: string;
  title: string;
  content: string;
  metrics: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  shareUrl?: string;
  views: number;
  authorId: string;
  author?: { email: string };
  shareToken?: string;
  shareSettings?: {
    allowComments: boolean;
    requireAuth: boolean;
    expiryDate: string | null;
    sharingMode: "anyone" | "specific";
    allowedViewers: string[];
  };
  comments?: { id: string }[];
}

export default function ReportPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [shareSettings, setShareSettings] = useState({
    allowComments: false,
    requireAuth: true,
    expiryDate: "",
    sharingMode: "anyone",
    allowedViewers: [] as string[],
  });
  const [commentCount, setCommentCount] = useState(0);
  const [isCommentCountAnimating, setIsCommentCountAnimating] = useState(false);

  // Trigger animation when comment count changes
  useEffect(() => {
    if (commentCount > 0) {
      setIsCommentCountAnimating(true);
      const timer = setTimeout(() => {
        setIsCommentCountAnimating(false);
      }, 600); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [commentCount]);

  // Update comment count when page loads to ensure consistency
  useEffect(() => {
    if (report?.comments?.length) {
      setCommentCount(report.comments.length);
    }
  }, [report?.comments?.length]);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`/api/reports/${params.id}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to fetch report");
        }
        const data = await response.json();

        // Check if user is the owner
        const isUserOwner = session?.user?.email === data.author?.email;

        setReport(data);
        setIsOwner(isUserOwner);
        setCommentCount(data.comments?.length || 0);
      } catch (error) {
        console.error("Error fetching report:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load report"
        );
        toast.error("Error loading report", {
          description:
            error instanceof Error ? error.message : "Please try again later",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.email) {
      fetchReport();
    } else if (status === "unauthenticated") {
      setIsLoading(false);
      setError("Please sign in to view this report");
    }
  }, [params.id, session, status]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (report?.shareUrl) {
        await fetch(`/api/reports/${params.id}/share`, {
          method: "DELETE",
        });
      }

      const response = await fetch(`/api/reports/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete report");
      }

      toast.success("Report deleted successfully", {
        description: "Redirecting to reports page...",
      });

      setTimeout(() => {
        router.push("/reports");
      }, 1000);
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("Failed to delete report", {
        description:
          error instanceof Error ? error.message : "Please try again later",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleShare = async () => {
    if (!report) return;

    setIsSharing(true);
    try {
      const response = await fetch(`/api/reports/${params.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allowComments: shareSettings.allowComments,
          requireAuth: shareSettings.requireAuth,
          expiryDate: shareSettings.expiryDate || null,
          allowedViewers: shareSettings.allowedViewers,
          sharingMode: shareSettings.sharingMode,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate share link");
      }

      const data = await response.json();
      const shareUrl = data.shareUrl;
      const shareToken = data.shareToken;

      setReport((prev) =>
        prev
          ? {
              ...prev,
              shareUrl: shareUrl,
              shareToken: shareToken,
              isPublic: true,
              shareSettings: data.shareSettings,
            }
          : null
      );

      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Share link copied!", {
          description: "Link has been copied to your clipboard",
        });
      } catch (error) {
        console.error("Clipboard error:", error);
        toast.error("Failed to copy link", {
          description: "Please copy the link manually",
        });
      }
    } catch (error) {
      console.error("Error sharing report:", error);
      toast.error("Failed to share report", {
        description:
          error instanceof Error ? error.message : "Please try again later",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleEdit = () => {
    router.push(`/reports/${params.id}/edit`);
  };

  const exportToPDF = async () => {
    if (!report) return;

    setIsExporting(true);
    setShowExportDialog(true);

    try {
      const reportElement = document.getElementById("report-content");
      if (!reportElement) throw new Error("Report content not found");

      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: "a4",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

      pdf.save(`${report.title}-${dateFormat(new Date(), "yyyy-MM-dd")}.pdf`);

      toast.success("PDF exported successfully", {
        description: "Your report has been downloaded",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF", {
        description:
          error instanceof Error ? error.message : "Please try again later",
      });
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setShowExportDialog(false);
      }, 1000);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dot-pattern dark:bg-dot-pattern-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shadow-inner">
            <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-pulse" />
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

  if (error) {
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
              {error}
            </p>
          </CardContent>
          <CardFooter className="flex justify-center pb-6">
            <Button onClick={() => router.push("/reports")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Reports
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50/50 dark:bg-gray-950/50 p-4">
        <Card className="max-w-md w-full backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold">
              Report Not Found
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6 space-y-4">
            <p className="text-gray-500 dark:text-gray-400 text-center">
              The requested report does not exist or you don&apos;t have
              permission to view it.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center pb-6">
            <Button onClick={() => router.push("/reports")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Reports
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50/90 via-blue-50/30 to-indigo-50/50 dark:from-gray-950/90 dark:via-blue-950/20 dark:to-indigo-950/30 pb-12">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10 dark:opacity-5"></div>
        <div className="container max-w-screen-xl py-8 md:py-12 relative">
          {/* Header */}
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 px-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 group transition-colors"
                  onClick={() => router.push("/reports")}
                >
                  <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Reports</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <div className="bg-blue-100/80 dark:bg-blue-900/30 backdrop-blur-sm px-3 py-1 rounded-full inline-flex items-center gap-1.5 border border-blue-200/50 dark:border-blue-800/30">
                  <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    Report
                  </span>
                </div>
                {report.isPublic && (
                  <div className="bg-emerald-100/80 dark:bg-emerald-900/30 backdrop-blur-sm px-3 py-1 rounded-full inline-flex items-center gap-1.5 border border-emerald-200/50 dark:border-emerald-800/30">
                    <Share2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      Shared
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="space-y-2 max-w-2xl">
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-700 dark:from-white dark:via-blue-300 dark:to-indigo-400 bg-clip-text text-transparent">
                    {report.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center rounded-full bg-gray-100/70 dark:bg-gray-800/50 px-3 py-1">
                      <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-500 dark:text-gray-400" />
                      <span>
                        Created{" "}
                        {dateFormat(new Date(report.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center rounded-full bg-gray-100/70 dark:bg-gray-800/50 px-3 py-1">
                      <Eye className="h-3.5 w-3.5 mr-1.5 text-gray-500 dark:text-gray-400" />
                      <span>{report.views} views</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 self-start mt-1">
                  {isOwner && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 p-0 border-gray-200/70 dark:border-gray-800/70 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-sm hover:shadow transition-all"
                            onClick={handleEdit}
                          >
                            <Edit className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit Report</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 p-0 border-gray-200/70 dark:border-gray-800/70 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-sm hover:shadow transition-all"
                            onClick={() => setShowShareDialog(true)}
                          >
                            <Share2
                              className={cn(
                                "h-4 w-4",
                                report.isPublic
                                  ? "text-blue-600 dark:text-blue-400"
                                  : "text-gray-600 dark:text-gray-400"
                              )}
                            />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Share Report</TooltipContent>
                      </Tooltip>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 p-0 border-gray-200/70 dark:border-gray-800/70 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-sm hover:shadow transition-all"
                          >
                            <MoreHorizontal className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-gray-200/70 dark:border-gray-700/70"
                        >
                          <DropdownMenuItem
                            onClick={() => setShowExportDialog(true)}
                            className="cursor-pointer"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setShowDeleteDialog(true)}
                            className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/50 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Metrics Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(report.metrics).map(([key, value]) => (
                <Card
                  key={key}
                  className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-gray-200/50 dark:border-gray-800/50 shadow-md hover:shadow-lg transition-all group overflow-hidden rounded-xl"
                >
                  <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {key}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:scale-105 transform transition-transform">
                      {value}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Report Content Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card
              id="report-content"
              className="lg:col-span-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-gray-200/50 dark:border-gray-800/50 shadow-md overflow-hidden rounded-xl"
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
                    {report.content.split("\n\n").map((section, idx) => {
                      // Check if it's a heading (starts with ** or # or ##)
                      if (section.startsWith("**") && section.endsWith("**")) {
                        const headingText = section.replace(/^\*\*|\*\*$/g, "");
                        return (
                          <h2
                            key={idx}
                            className="text-xl font-bold mt-6 mb-4 text-blue-700 dark:text-blue-400 border-b pb-2 border-gray-100 dark:border-gray-800"
                          >
                            {headingText}
                          </h2>
                        );
                      }

                      // Check if it's a subheading
                      if (section.includes("**") && !section.startsWith("|")) {
                        return (
                          <div key={idx} className="my-4">
                            {section.split("\n").map((line, lineIdx) => {
                              const formattedLine = line.replace(
                                /\*\*(.*?)\*\*/g,
                                "<strong>$1</strong>"
                              );
                              if (formattedLine.includes("<strong>")) {
                                return (
                                  <p
                                    key={lineIdx}
                                    className="my-2 font-medium text-gray-900 dark:text-gray-100"
                                    dangerouslySetInnerHTML={{
                                      __html: formattedLine,
                                    }}
                                  />
                                );
                              }
                              return (
                                <p
                                  key={lineIdx}
                                  className="my-2 text-gray-700 dark:text-gray-300"
                                >
                                  {line}
                                </p>
                              );
                            })}
                          </div>
                        );
                      }

                      // Check if it's a table or metrics display
                      if (section.includes("|")) {
                        const tableRows = section
                          .split("\n")
                          .filter((row) => row.trim() !== "");

                        // If it's a simple metrics display with just a few rows
                        if (
                          tableRows.length <= 3 &&
                          tableRows.every((row) => row.includes("|"))
                        ) {
                          return (
                            <div
                              key={idx}
                              className="my-6 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800"
                            >
                              <table className="w-full border-collapse bg-white dark:bg-gray-900">
                                <tbody>
                                  {tableRows.map((row, rowIdx) => {
                                    const cells = row
                                      .split("|")
                                      .filter((cell) => cell.trim() !== "");
                                    if (cells.length >= 2) {
                                      return (
                                        <tr
                                          key={rowIdx}
                                          className={
                                            rowIdx % 2 === 0
                                              ? "bg-white dark:bg-gray-900"
                                              : "bg-gray-50 dark:bg-gray-800/30"
                                          }
                                        >
                                          {cells.map((cell, cellIdx) => (
                                            <td
                                              key={cellIdx}
                                              className={`px-4 py-3 text-sm ${
                                                cellIdx === 0
                                                  ? "font-medium text-gray-700 dark:text-gray-300"
                                                  : "text-right font-bold text-gray-900 dark:text-gray-100"
                                              }`}
                                            >
                                              {cell.trim()}
                                            </td>
                                          ))}
                                        </tr>
                                      );
                                    }
                                    return null;
                                  })}
                                </tbody>
                              </table>
                            </div>
                          );
                        }
                      }

                      // Regular paragraphs
                      return (
                        <div key={idx} className="my-4">
                          {section.split("\n").map((line, lineIdx) => (
                            <p
                              key={lineIdx}
                              className="my-2 text-gray-700 dark:text-gray-300 leading-relaxed"
                            >
                              {line}
                            </p>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Call To Action */}
                <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <div className="bg-gradient-to-r from-blue-50/90 to-indigo-50/90 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm rounded-xl p-5 flex flex-col sm:flex-row items-center gap-4 border border-blue-100/50 dark:border-blue-800/30 shadow-sm">
                    <div className="text-center sm:text-left">
                      <h3 className="font-medium text-blue-800 dark:text-blue-300">
                        Want more detailed insights?
                      </h3>
                      <p className="text-sm text-blue-700/80 dark:text-blue-400/80 mt-1">
                        Generate a comprehensive report with our AI-powered
                        analytics
                      </p>
                    </div>
                    <Button
                      className="ml-auto bg-blue-600/90 hover:bg-blue-700/90 text-white shadow-sm hover:shadow-md transition-all rounded-lg"
                      onClick={() => router.push("/dashboard")}
                    >
                      Create New Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card
                id="report-details"
                className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-gray-200/50 dark:border-gray-800/50 shadow-md rounded-xl"
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
                          ? new Date(report.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )
                          : "Apr 16, 2025"}
                      </time>
                    </div>

                    {/* Last Updated */}
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800/50">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Updated
                        </span>
                      </div>
                      <time className="text-sm font-medium text-gray-900 dark:text-gray-200">
                        {report?.updatedAt
                          ? new Date(report.updatedAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )
                          : "Apr 16, 2025"}
                      </time>
                    </div>

                    {/* Visibility */}
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800/50">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Visibility
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Badge
                          variant="outline"
                          className="text-xs font-medium bg-gray-50 dark:bg-gray-800"
                        >
                          {report?.isPublic ? "Public" : "Private"}
                        </Badge>
                      </div>
                    </div>

                    {/* Views */}
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800/50">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Views
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                        {report?.views || 0}
                      </span>
                    </div>

                    {/* Comments */}
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800/50">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Comments
                        </span>
                      </div>
                      <Badge
                        onClick={() => {
                          // Scroll to comments section when badge is clicked
                          const commentSection =
                            document.getElementById("comments-section");
                          if (commentSection) {
                            commentSection.scrollIntoView({
                              behavior: "smooth",
                            });
                          }
                        }}
                        className={cn(
                          "text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900/80 dark:text-blue-300 transition-all duration-300 cursor-pointer",
                          isCommentCountAnimating ? "animate-pulse-once" : "",
                          "relative overflow-hidden group hover:scale-105 transform hover:shadow-md"
                        )}
                      >
                        <div className="relative z-10 flex items-center">
                          <MessageSquare
                            className={cn(
                              "h-3 w-3 mr-1 group-hover:animate-wiggle",
                              isCommentCountAnimating &&
                                "text-blue-600 dark:text-blue-300"
                            )}
                          />
                          <span
                            className={cn(
                              "relative z-10 tabular-nums",
                              isCommentCountAnimating &&
                                "text-blue-700 dark:text-blue-200 font-semibold"
                            )}
                          >
                            {commentCount}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "absolute inset-0 bg-blue-200/50 dark:bg-blue-700/50 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300",
                            isCommentCountAnimating &&
                              "animate-pulse-bg scale-x-100"
                          )}
                        />
                        {isCommentCountAnimating && (
                          <span className="absolute -inset-px rounded-full animate-ping bg-blue-200 dark:bg-blue-700 opacity-30"></span>
                        )}
                      </Badge>
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
                        {report.metrics?.length || 1}
                      </Badge>
                    </div>
                  </div>

                  {/* Stats Summary Card */}
                  <div className="mt-6 bg-gradient-to-br from-blue-50/90 to-indigo-50/90 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm rounded-xl p-4 border border-blue-100/50 dark:border-blue-800/30 shadow-sm">
                    <h3 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">
                      Performance Summary
                    </h3>
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-2xl font-bold text-blue-800 dark:text-blue-300">
                          100,000
                        </span>
                        <span className="text-xs text-blue-600 dark:text-blue-500">
                          Total Loads
                        </span>
                      </div>
                      <div className="h-14 w-24">
                        <div className="w-full h-8 bg-blue-100/70 dark:bg-blue-800/30 rounded-lg relative overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 bg-blue-500/80 dark:bg-blue-600/80 rounded-lg"
                            style={{ width: "70%" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>

                {/* Quick Actions */}
                <div className="px-6 pb-5">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-3">
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    {/* Edit Report */}
                    <Button
                      variant="outline"
                      className="w-full justify-start text-sm font-medium border-gray-200/70 dark:border-gray-700/70 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm transition-all"
                      onClick={() => router.push(`/reports/${params.id}/edit`)}
                    >
                      <Pencil className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      Edit Report
                    </Button>

                    {/* Share Report */}
                    <Button
                      variant="outline"
                      className="w-full justify-start text-sm font-medium border-gray-200/70 dark:border-gray-700/70 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm transition-all"
                      onClick={() => setShowShareDialog(true)}
                    >
                      <Share2 className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      Share Report
                    </Button>

                    {/* Export Report */}
                    <Button
                      variant="outline"
                      className="w-full justify-start text-sm font-medium border-gray-200/70 dark:border-gray-700/70 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm transition-all"
                      onClick={() => setShowExportDialog(true)}
                    >
                      <Download className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      Export Report
                    </Button>
                  </div>

                  {report.shareToken ? (
                    <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-3">
                        Public Link
                      </h3>
                      <div className="mt-1 flex">
                        <div className="flex-1 bg-gray-50/70 dark:bg-gray-800/70 border border-gray-200/70 dark:border-gray-700/70 rounded-l-md px-3 py-2 text-sm text-gray-500 dark:text-gray-400 truncate">
                          {`${window.location.origin}/reports/share/${report.shareToken}`}
                        </div>
                        <Button
                          variant="default"
                          size="sm"
                          className="rounded-l-none bg-blue-600/90 hover:bg-blue-700/90 transition-colors"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `${window.location.origin}/reports/share/${report.shareToken}`
                            );
                            toast.success("Link copied to clipboard");
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* QR Code section */}
                      <div className="mt-4 bg-white p-4 rounded-lg flex justify-center dark:bg-gray-800/50">
                        <QRCodeSVG
                          value={`${window.location.origin}/reports/share/${report.shareToken}`}
                          size={120}
                          bgColor={"#FFFFFF"}
                          fgColor={"#000000"}
                          level={"L"}
                          includeMargin={false}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </Card>

              {isOwner && report.shareToken && (
                <Card className="bg-gradient-to-br from-blue-600/90 to-indigo-600/90 dark:from-blue-700/90 dark:to-indigo-800/90 text-white shadow-md rounded-xl border-0 overflow-hidden relative backdrop-blur-sm">
                  <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-400/20 dark:bg-blue-500/20 rounded-full blur-3xl"></div>
                  <div className="absolute -left-4 -bottom-8 w-32 h-32 bg-indigo-400/20 dark:bg-indigo-500/20 rounded-full blur-2xl"></div>
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Share2 className="h-5 w-5 text-blue-100" />
                      Report Sharing
                    </CardTitle>
                    <CardDescription className="text-blue-100/80">
                      Your report is currently shared publicly
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg bg-white/10 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-blue-100">Comments</span>
                        <Badge
                          variant="outline"
                          className="border-blue-100/30 text-blue-100 bg-blue-500/20"
                        >
                          {report.shareSettings?.allowComments
                            ? "Enabled"
                            : "Disabled"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-100">
                          Authentication
                        </span>
                        <Badge
                          variant="outline"
                          className="border-blue-100/30 text-blue-100 bg-blue-500/20"
                        >
                          {report.shareSettings?.requireAuth
                            ? "Required"
                            : "Not Required"}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      className="w-full bg-white/20 hover:bg-white/30 text-white border-0 justify-center gap-2 rounded-lg"
                      onClick={() => setShowShareDialog(true)}
                    >
                      <Pencil className="h-4 w-4" />
                      Update Sharing Settings
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="mt-8" id="comments-section">
            <CommentSection
              reportId={params.id}
              isOwner={isOwner}
              isPublic={report.isPublic}
              commentsEnabled={report.shareSettings?.allowComments}
              commentCount={commentCount}
              setCommentCount={setCommentCount}
            />
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Report</DialogTitle>
            <DialogDescription>
              Control how your report is shared
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-4">
              {/* Sharing Mode */}
              <div className="space-y-2">
                <Label>Who can access this report?</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={
                      shareSettings.sharingMode === "anyone"
                        ? "default"
                        : "outline"
                    }
                    className={cn(
                      "justify-start text-left font-normal",
                      shareSettings.sharingMode === "anyone"
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : ""
                    )}
                    onClick={() =>
                      setShareSettings({
                        ...shareSettings,
                        sharingMode: "anyone",
                      })
                    }
                  >
                    <div className="flex flex-col items-start">
                      <span>Anyone with the link</span>
                      <span className="text-xs opacity-70">
                        {shareSettings.requireAuth
                          ? "Must be logged in"
                          : "No login required"}
                      </span>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant={
                      shareSettings.sharingMode === "specific"
                        ? "default"
                        : "outline"
                    }
                    className={cn(
                      "justify-start text-left font-normal",
                      shareSettings.sharingMode === "specific"
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : ""
                    )}
                    onClick={() =>
                      setShareSettings({
                        ...shareSettings,
                        sharingMode: "specific",
                        requireAuth: true, // Specific sharing requires auth
                      })
                    }
                  >
                    <div className="flex flex-col items-start">
                      <span>Specific people</span>
                      <span className="text-xs opacity-70">
                        By email address only
                      </span>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Allowed Viewers - only show if sharing mode is specific */}
              {shareSettings.sharingMode === "specific" && (
                <div className="space-y-2">
                  <Label htmlFor="allowed-viewers">Allowed Viewers</Label>
                  <div className="space-y-2">
                    {shareSettings.allowedViewers.map((email, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => {
                            const newAllowedViewers = [
                              ...shareSettings.allowedViewers,
                            ];
                            newAllowedViewers[index] = e.target.value;
                            setShareSettings({
                              ...shareSettings,
                              allowedViewers: newAllowedViewers,
                            });
                          }}
                          placeholder="email@example.com"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            const newAllowedViewers = [
                              ...shareSettings.allowedViewers,
                            ];
                            newAllowedViewers.splice(index, 1);
                            setShareSettings({
                              ...shareSettings,
                              allowedViewers: newAllowedViewers,
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        setShareSettings({
                          ...shareSettings,
                          allowedViewers: [...shareSettings.allowedViewers, ""],
                        });
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Viewer
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label htmlFor="allow-comments" className="cursor-pointer">
                  Allow comments
                </Label>
                <Switch
                  id="allow-comments"
                  checked={shareSettings.allowComments}
                  onCheckedChange={(checked) =>
                    setShareSettings({
                      ...shareSettings,
                      allowComments: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="require-auth" className="cursor-pointer">
                  Require authentication
                </Label>
                <Switch
                  id="require-auth"
                  checked={
                    shareSettings.requireAuth ||
                    shareSettings.sharingMode === "specific"
                  }
                  disabled={shareSettings.sharingMode === "specific"}
                  onCheckedChange={(checked) =>
                    setShareSettings({
                      ...shareSettings,
                      requireAuth: checked,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry-date">Expiry date (optional)</Label>
                <Input
                  id="expiry-date"
                  type="date"
                  value={shareSettings.expiryDate}
                  onChange={(e) =>
                    setShareSettings({
                      ...shareSettings,
                      expiryDate: e.target.value,
                    })
                  }
                  min={new Date().toISOString().split("T")[0]}
                  className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                />
              </div>
            </div>

            {report.shareToken ? (
              <>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4 flex justify-center">
                  <QRCodeSVG
                    value={`${window.location.origin}/reports/share/${report.shareToken}`}
                    size={150}
                  />
                </div>
                <div className="flex items-center">
                  <Input
                    value={`${window.location.origin}/reports/share/${report.shareToken}`}
                    readOnly
                    className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 pr-10"
                  />
                </div>
                <DialogFooter className="sm:justify-start">
                  <Button
                    onClick={async () => {
                      await navigator.clipboard.writeText(
                        `${window.location.origin}/reports/share/${report.shareToken}`
                      );
                      toast.success("Link copied to clipboard");
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Link
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <DialogFooter>
                <Button
                  onClick={handleShare}
                  disabled={
                    isSharing ||
                    (shareSettings.sharingMode === "specific" &&
                      shareSettings.allowedViewers.length === 0)
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSharing ? (
                    <>
                      <Clock className="mr-2 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Share2 className="mr-2 h-4 w-4" />
                      Generate Link
                    </>
                  )}
                </Button>
              </DialogFooter>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Report</DialogTitle>
            <DialogDescription>
              Choose a format to export your report
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Card
              className={cn(
                "cursor-pointer transition-all border-2",
                exportFormat === "pdf"
                  ? "border-blue-600 dark:border-blue-400 shadow-md"
                  : "border-transparent hover:border-gray-200 dark:hover:border-gray-700"
              )}
              onClick={() => setExportFormat("pdf")}
            >
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30 mb-3">
                  <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="font-medium">PDF</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                  Best for sharing and printing
                </p>
              </CardContent>
            </Card>
            <Card
              className={cn(
                "cursor-pointer transition-all border-2",
                exportFormat === "json"
                  ? "border-blue-600 dark:border-blue-400 shadow-md"
                  : "border-transparent hover:border-gray-200 dark:hover:border-gray-700"
              )}
              onClick={() => setExportFormat("json")}
            >
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-3">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-medium">JSON</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                  Raw data format
                </p>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setExportFormat(null);
                setShowExportDialog(false);
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={!exportFormat || isExporting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                if (exportFormat) {
                  exportToPDF(); // This should be changed to call the appropriate handleExport function
                }
              }}
            >
              {isExporting ? (
                <>
                  <Clock className="mr-2 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              report and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Clock className="mr-2 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
