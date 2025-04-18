"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

export type MetricType = "number" | "percentage" | "currency" | "text";

interface Metric {
  key: string;
  value: string;
  type: MetricType;
}

interface MetricEditorProps {
  metrics: Record<string, string>;
  onChange: (metrics: Record<string, string>) => void;
}

const metricTypes: { value: MetricType; label: string }[] = [
  { value: "number", label: "Number" },
  { value: "percentage", label: "Percentage" },
  { value: "currency", label: "Currency" },
  { value: "text", label: "Text" },
];

export function MetricEditor({ metrics, onChange }: MetricEditorProps) {
  const [metricsList, setMetricsList] = useState<Metric[]>(
    Object.entries(metrics).map(([key, value]) => {
      let type: MetricType = "text";
      if (value.includes("%")) {
        type = "percentage";
      } else if (value.includes("$")) {
        type = "currency";
      } else if (/^\d+$/.test(value)) {
        type = "number";
      }
      return { key, value: value.replace(/[^0-9.-]/g, ""), type };
    })
  );

  const handleAddMetric = () => {
    setMetricsList([...metricsList, { key: "", value: "", type: "number" }]);
  };

  const handleRemoveMetric = (index: number) => {
    const newMetrics = [...metricsList];
    newMetrics.splice(index, 1);
    setMetricsList(newMetrics);
    updateParentMetrics(newMetrics);
  };

  const handleMetricChange = (
    index: number,
    field: keyof Metric,
    value: string
  ) => {
    const newMetrics = [...metricsList];
    newMetrics[index] = { ...newMetrics[index], [field]: value };
    setMetricsList(newMetrics);
    updateParentMetrics(newMetrics);
  };

  const handleTypeChange = (index: number, type: MetricType) => {
    const newMetrics = [...metricsList];
    newMetrics[index] = { ...newMetrics[index], type };
    setMetricsList(newMetrics);
    updateParentMetrics(newMetrics);
  };

  const formatMetricValue = (value: string, type: MetricType): string => {
    if (!value) return "";
    const cleanValue = value.replace(/[^0-9.-]/g, "");
    switch (type) {
      case "percentage":
        return `${cleanValue}%`;
      case "currency":
        return `$${cleanValue}`;
      default:
        return cleanValue;
    }
  };

  const updateParentMetrics = (metrics: Metric[]) => {
    const formattedMetrics = metrics.reduce((acc, metric) => {
      if (metric.key && metric.value) {
        acc[metric.key] = formatMetricValue(metric.value, metric.type);
      }
      return acc;
    }, {} as Record<string, string>);
    onChange(formattedMetrics);
  };

  const validateMetricValue = (value: string, type: MetricType): boolean => {
    if (!value) return false;
    const cleanValue = value.replace(/[^0-9.-]/g, "");
    switch (type) {
      case "number":
      case "currency":
        return /^-?\d*\.?\d*$/.test(cleanValue);
      case "percentage":
        const num = parseFloat(cleanValue);
        return !isNaN(num) && num >= 0 && num <= 100;
      default:
        return true;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Metrics</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddMetric}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Metric
        </Button>
      </div>
      <div className="space-y-3">
        {metricsList.map((metric, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 rounded-lg border bg-card"
          >
            <div className="grid gap-2 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  placeholder="Metric name"
                  value={metric.key}
                  onChange={(e) =>
                    handleMetricChange(index, "key", e.target.value)
                  }
                  className="flex-1"
                />
                <Input
                  placeholder="Value"
                  value={metric.value}
                  onChange={(e) =>
                    handleMetricChange(index, "value", e.target.value)
                  }
                  className={`flex-1 ${
                    !validateMetricValue(metric.value, metric.type)
                      ? "border-red-500"
                      : ""
                  }`}
                />
                <Select
                  value={metric.type}
                  onValueChange={(value: MetricType) =>
                    handleTypeChange(index, value)
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
              {!validateMetricValue(metric.value, metric.type) && (
                <p className="text-sm text-red-500">
                  {metric.type === "percentage"
                    ? "Enter a number between 0 and 100"
                    : "Enter a valid number"}
                </p>
              )}
            </div>
            {metricsList.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveMetric(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
