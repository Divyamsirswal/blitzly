"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { MetricEditor } from "@/components/metrics/metric-editor";

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
  userId: string;
  author?: {
    email: string;
  };
}

interface ValidationErrors {
  title?: string;
  content?: string;
  metrics?: string;
}

export default function EditReportPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`/api/reports/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch report");
        }
        const data = await response.json();

        // Check if user is the owner
        const isUserOwner =
          session?.user?.email === data.userId ||
          session?.user?.email === data.author?.email;

        if (!isUserOwner) {
          toast.error("You don't have permission to edit this report");
          router.push(`/reports/${params.id}`);
          return;
        }

        setReport(data);
      } catch (error) {
        console.error("Error fetching report:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to load report"
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.email) {
      fetchReport();
    }
  }, [params.id, session, router]);

  const validateReport = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    if (!report?.title.trim()) {
      errors.title = "Title is required";
      isValid = false;
    } else if (report.title.length < 3) {
      errors.title = "Title must be at least 3 characters long";
      isValid = false;
    }

    if (!report?.content.trim()) {
      errors.content = "Content is required";
      isValid = false;
    } else if (report.content.length < 10) {
      errors.content = "Content must be at least 10 characters long";
      isValid = false;
    }

    if (Object.keys(report?.metrics || {}).length === 0) {
      errors.metrics = "At least one metric is required";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSave = async () => {
    if (!report) return;

    if (!validateReport()) {
      Object.entries(validationErrors).forEach(([field, error]) => {
        if (error) {
          toast.error(
            `${field.charAt(0).toUpperCase() + field.slice(1)}: ${error}`
          );
        }
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/reports/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: report.title.trim(),
          content: report.content.trim(),
          metrics: report.metrics,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update report");
      }

      setReport(data);
      setHasChanges(false);
      toast.success("Report updated successfully");
      router.push(`/reports/${params.id}`);
    } catch (error) {
      console.error("Error updating report:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update report"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (
    field: keyof Report,
    value: string | Record<string, string>
  ) => {
    setReport((prev) => {
      if (!prev) return null;
      const updated = { ...prev, [field]: value };
      setHasChanges(true);
      return updated;
    });
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container max-w-screen-2xl py-10">
        <div className="flex flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold">Report Not Found</h1>
          <p className="text-muted-foreground">
            The report you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have permission to edit it.
          </p>
          <Button onClick={() => router.push("/reports")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reports
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-screen-2xl py-10">
      <div className="mb-6 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => {
            if (hasChanges) {
              if (
                confirm(
                  "You have unsaved changes. Are you sure you want to leave?"
                )
              ) {
                router.push(`/reports/${params.id}`);
              }
            } else {
              router.push(`/reports/${params.id}`);
            }
          }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Report
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className={!hasChanges ? "opacity-50" : ""}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Edit Report</CardTitle>
            <CardDescription>
              Make changes to your report. Click save when you&apos;re done.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="title"
                value={report.title}
                onChange={(e) => handleChange("title", e.target.value)}
                className={validationErrors.title ? "border-red-500" : ""}
              />
              {validationErrors.title && (
                <p className="text-sm text-red-500">{validationErrors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <RichTextEditor
                content={report.content}
                onChange={(content) => handleChange("content", content)}
              />
              {validationErrors.content && (
                <p className="text-sm text-red-500">
                  {validationErrors.content}
                </p>
              )}
            </div>

            <MetricEditor
              metrics={report.metrics}
              onChange={(metrics) => handleChange("metrics", metrics)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
