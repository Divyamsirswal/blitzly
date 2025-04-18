"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ExternalLink, Eye } from "lucide-react";
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
import { toast } from "sonner";

interface SharedReport {
  id: string;
  title: string;
  createdAt: string;
  shareUrl: string;
  viewCount: number;
  lastViewed?: string;
}

export default function SharedReportsPage() {
  const { status: sessionStatus } = useSession();
  const [reports, setReports] = useState<SharedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportToRevoke, setReportToRevoke] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  useEffect(() => {
    const fetchSharedReports = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/reports/shared", {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Please sign in to view your shared reports");
          }
          throw new Error("Failed to fetch shared reports");
        }

        const data = await response.json();
        setReports(data);
      } catch (error) {
        console.error("Error fetching shared reports:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (sessionStatus === "authenticated") {
      fetchSharedReports();
    } else if (sessionStatus === "unauthenticated") {
      setLoading(false);
    }
  }, [sessionStatus]);

  const handleRevokeAccess = async (reportId: string) => {
    setIsRevoking(true);
    try {
      const response = await fetch(`/api/reports/${reportId}/share`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to revoke access");
      }

      setReports((prev) => prev.filter((report) => report.id !== reportId));
      toast.success("Share access revoked successfully");
    } catch (error) {
      console.error("Error revoking access:", error);
      toast.error("Failed to revoke access");
    } finally {
      setIsRevoking(false);
      setReportToRevoke(null);
    }
  };

  const copyShareLink = async (shareUrl: string) => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard");
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy share link");
    }
  };

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (sessionStatus === "unauthenticated") {
    return (
      <div className="container py-10">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground mb-4">
                Please sign in to view your shared reports
              </p>
              <Link href="/login">
                <Button>Sign In</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="container py-10">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/reports">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Shared Reports</h1>
            <p className="text-muted-foreground">
              Manage your shared reports and track views
            </p>
          </div>
        </div>

        {error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Error</h2>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">
                  No shared reports
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
                  You haven&apos;t accessed any shared reports yet.
                </p>
                <Link href="/reports">
                  <Button>View All Reports</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="line-clamp-2">
                      {report.title}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyShareLink(report.shareUrl)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Shared on {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">
                          {report.viewCount} view{report.viewCount !== 1 && "s"}
                        </span>
                      </div>
                      {report.lastViewed && (
                        <span className="text-sm text-muted-foreground">
                          Last viewed{" "}
                          {new Date(report.lastViewed).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => setReportToRevoke(report.id)}
                    >
                      Revoke Access
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={reportToRevoke !== null}
        onOpenChange={() => setReportToRevoke(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Share Access</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently revoke access to anyone with the current
              share link. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                reportToRevoke && handleRevokeAccess(reportToRevoke)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isRevoking}
            >
              {isRevoking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Revoking...
                </>
              ) : (
                "Revoke Access"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
