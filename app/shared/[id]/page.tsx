"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Clock, Eye, User, Download } from "lucide-react";
import { toast } from "sonner";

interface SharedReport {
  id: string;
  title: string;
  content: string;
  metrics: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  views: number;
  author: {
    name: string | null;
    email: string;
  };
}

export default function SharedReportPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [report, setReport] = useState<SharedReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`/api/reports/share/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch report");
        }
        const data = await response.json();
        setReport(data);
      } catch (error) {
        console.error("Error fetching report:", error);
        toast.error("Failed to load report");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container max-w-screen-2xl py-10">
        <div className="flex flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold">Report Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 text-center">
            You don&apos;t have access to this report. It&apos;s either private
            or doesn&apos;t exist.
          </p>
          <Button onClick={() => router.push("/shared")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shared Reports
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-screen-2xl py-10">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push("/shared")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Shared Reports
        </Button>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{report.title}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {report.author.name || report.author.email}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              {report.views} views
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                {report.content.split("\n").map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(report.metrics).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="font-medium">{key}</span>
                    <span className="text-lg font-bold">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm font-medium">
                  {format(new Date(report.createdAt), "MMMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Last Updated
                </span>
                <span className="text-sm font-medium">
                  {format(new Date(report.updatedAt), "MMMM d, yyyy")}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
