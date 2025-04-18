"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, FileText, Eye } from "lucide-react";
import { toast } from "sonner";

interface SharedReport {
  id: string;
  title: string;
  content: string;
  metrics: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  shareUrl?: string;
  views: number;
  userId: string;
  author: {
    name: string;
    email: string;
  };
}

export default function SharedPage() {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const [reports, setReports] = useState<SharedReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSharedReports = async () => {
      try {
        const response = await fetch("/api/reports/shared");
        if (!response.ok) {
          throw new Error("Failed to fetch shared reports");
        }
        const data = await response.json();
        setReports(data);
      } catch (error) {
        console.error("Error fetching shared reports:", error);
        toast.error("Failed to load shared reports");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedReports();
  }, []);

  if (sessionStatus === "loading" || isLoading) {
    return (
      <div className="container max-w-screen-2xl py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Shared Reports</h1>
          <p className="text-muted-foreground">
            Reports that have been shared with you
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-4 w-1/3" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-screen-2xl py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shared Reports</h1>
          <p className="text-muted-foreground">
            Reports that have been shared with you
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard">
            <FileText className="mr-2 h-4 w-4" />
            Create Report
          </Link>
        </Button>
      </div>

      {reports.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold">No Shared Reports</h2>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            You haven&apos;t received any shared reports yet.
          </p>
          <Button asChild>
            <Link href="/dashboard">Create Your Own Report</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Card key={report.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="line-clamp-1">
                      {report.title}
                    </CardTitle>
                    <CardDescription>
                      By {report.author.name || report.author.email}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="h-3 w-3" />
                    {report.views}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {report.content}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {Object.entries(report.metrics)
                    .slice(0, 4)
                    .map(([key, value]) => (
                      <div
                        key={key}
                        className="rounded-md bg-muted p-2 text-center"
                      >
                        <div className="text-xs font-medium text-muted-foreground">
                          {key}
                        </div>
                        <div className="text-sm font-bold">{value}</div>
                      </div>
                    ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t bg-muted/50 px-4 py-3">
                <div className="text-xs text-muted-foreground">
                  {format(new Date(report.createdAt), "MMM d, yyyy")}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => router.push(`/reports/${report.id}`)}
                >
                  View
                  <ArrowLeft className="ml-1 h-3 w-3" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
