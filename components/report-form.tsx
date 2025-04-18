"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Plus,
  Trash2,
  HelpCircle,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Metric {
  key: string;
  value: string;
  type: string;
}

const metricTypes = [
  { value: "number", label: "Number" },
  { value: "percentage", label: "Percentage" },
  { value: "currency", label: "Currency" },
  { value: "text", label: "Text" },
];

export function ReportForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [metrics, setMetrics] = useState<Metric[]>([
    { key: "", value: "", type: "number" },
  ]);
  const [content, setContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [formValidation, setFormValidation] = useState({
    title: false,
    metrics: false,
    content: false,
  });

  // Validate form fields
  useEffect(() => {
    setFormValidation({
      title: title.trim().length > 0,
      metrics: metrics.every(
        (m) => m.key.trim().length > 0 && m.value.trim().length > 0
      ),
      content: content.trim().length > 0,
    });
  }, [title, metrics, content]);

  const handleAddMetric = () => {
    setMetrics([...metrics, { key: "", value: "", type: "number" }]);
  };

  const handleRemoveMetric = (index: number) => {
    setMetrics(metrics.filter((_, i) => i !== index));
  };

  const handleMetricChange = (
    index: number,
    field: keyof Metric,
    value: string
  ) => {
    const newMetrics = [...metrics];
    newMetrics[index] = { ...newMetrics[index], [field]: value };
    setMetrics(newMetrics);
  };

  const formatMetricValue = (value: string, type: string) => {
    if (!value) return value;

    switch (type) {
      case "number":
        return value.replace(/[^0-9.]/g, "");
      case "percentage":
        return value.replace(/[^0-9.]/g, "") + "%";
      case "currency":
        return "$" + value.replace(/[^0-9.]/g, "");
      default:
        return value;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formValidation.title ||
      !formValidation.metrics ||
      !formValidation.content
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsGenerating(true);

    try {
      const metricsObject = metrics.reduce((acc, { key, value, type }) => {
        acc[key] = formatMetricValue(value, type);
        return acc;
      }, {} as Record<string, string>);

      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, metrics: metricsObject }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to generate report");
      }

      const data = await response.json();
      toast.success("Report generated successfully");
      router.push(`/reports/${data.id}`);
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate report"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 p-6">
      {/* Report Title */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="title">Report Title</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter a descriptive title for your report</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {formValidation.title && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          {!formValidation.title && title.length > 0 && (
            <AlertCircle className="h-4 w-4 text-amber-500" />
          )}
        </div>
        <Input
          id="title"
          placeholder="e.g., Q1 2024 Marketing Performance"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={cn(
            "max-w-xl",
            formValidation.title && "border-green-500/50",
            !formValidation.title && title.length > 0 && "border-amber-500/50"
          )}
        />
      </div>

      {/* Metrics */}
      <div className="space-y-4 ">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label>Metrics</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add key performance metrics for your report</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {formValidation.metrics && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            {!formValidation.metrics &&
              metrics.some((m) => m.key || m.value) && (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddMetric}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Metric
          </Button>
        </div>
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className={cn(
                "flex items-start gap-4 rounded-lg border p-4",
                metric.key && metric.value && "border-green-500/30",
                (metric.key || metric.value) &&
                  !(metric.key && metric.value) &&
                  "border-amber-500/30"
              )}
            >
              <div className="grid flex-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Metric Name</Label>
                  <Input
                    placeholder="e.g., Website Traffic"
                    value={metric.key}
                    onChange={(e) =>
                      handleMetricChange(index, "key", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input
                    placeholder="Enter value"
                    value={metric.value}
                    onChange={(e) =>
                      handleMetricChange(index, "value", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={metric.type}
                    onValueChange={(value: string) =>
                      handleMetricChange(index, "type", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {metricTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {metrics.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveMetric(index)}
                  className="mt-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Report Content */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="content">Report Content</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Provide detailed analysis and insights for your report</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {formValidation.content && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          {!formValidation.content && content.length > 0 && (
            <AlertCircle className="h-4 w-4 text-amber-500" />
          )}
        </div>
        <Textarea
          id="content"
          placeholder="Enter detailed analysis and insights for your report..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={cn(
            "min-h-[200px]",
            formValidation.content && "border-green-500/50",
            !formValidation.content &&
              content.length > 0 &&
              "border-amber-500/50"
          )}
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={
            isGenerating ||
            !formValidation.title ||
            !formValidation.metrics ||
            !formValidation.content
          }
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Report"
          )}
        </Button>
      </div>
    </form>
  );
}
