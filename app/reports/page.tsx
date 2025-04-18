"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  ExternalLink,
  Search,
  BarChart,
  Share,
  FileText,
  ArrowUpRight,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface Report {
  id: string;
  title: string;
  metrics: Record<string, string>;
  createdAt: string;
  isPublic: boolean;
  status: string;
  shareUrl?: string;
}

interface ReportStats {
  total: number;
  shared: number;
  thisWeek: number;
  avgMetrics: number;
}

export default function ReportsPage() {
  const { status: sessionStatus } = useSession();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportStats>({
    total: 0,
    shared: 0,
    thisWeek: 0,
    avgMetrics: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterStatus, setFilterStatus] = useState("all");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const router = useRouter();
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/reports", {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Please sign in to view your reports");
          }
          throw new Error("Failed to fetch reports");
        }

        const data = await response.json();
        setReports(data);

        // Calculate stats
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thisWeekReports = data.filter(
          (r: Report) => new Date(r.createdAt) > weekAgo
        );

        setStats({
          total: data.length,
          shared: data.filter((r: Report) => r.shareUrl).length,
          thisWeek: thisWeekReports.length,
          avgMetrics: Math.round(
            data.reduce(
              (acc: number, r: Report) => acc + Object.keys(r.metrics).length,
              0
            ) / (data.length || 1)
          ),
        });
      } catch (error) {
        console.error("Error fetching reports:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load reports"
        );
      } finally {
        setLoading(false);
      }
    };

    if (sessionStatus === "authenticated") {
      fetchReports();
    } else if (sessionStatus === "unauthenticated") {
      setLoading(false);
    }
  }, [sessionStatus]);

  useEffect(() => {
    let filtered = [...reports];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((report) =>
        report.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((report) =>
        filterStatus === "shared" ? report.shareUrl : !report.shareUrl
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "title":
          return a.title.localeCompare(b.title);
        case "metrics":
          return Object.keys(b.metrics).length - Object.keys(a.metrics).length;
        default: // newest
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

    setFilteredReports(filtered);
  }, [reports, searchQuery, sortBy, filterStatus]);

  const handleCardClick = (reportId: string) => {
    router.push(`/reports/${reportId}`);
  };

  if (sessionStatus === "loading" || loading) {
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
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading reports...
          </p>
        </div>
      </div>
    );
  }

  if (sessionStatus === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50/50 dark:bg-gray-950/50 p-4">
        <Card className="max-w-md w-full backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold">
              Access Required
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="p-3 rounded-full bg-blue-100/50 dark:bg-blue-900/30">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-muted-foreground text-center">
              Please sign in to view your reports and analytics
            </p>
          </CardContent>
          <CardFooter className="flex justify-center pb-6">
            <Link href="/login">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                Sign In
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50/50 dark:bg-gray-950/50 p-4">
        <Card className="max-w-md w-full backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold text-red-600 dark:text-red-400">
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6 space-y-4">
            <p className="text-muted-foreground text-center">{error}</p>
          </CardContent>
          <CardFooter className="flex justify-center pb-6">
            <Button onClick={() => window.location.reload()} className="gap-2">
              Try Again
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50/90 via-blue-50/30 to-indigo-50/50 dark:from-gray-950/90 dark:via-blue-950/20 dark:to-indigo-950/30 pb-12">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-10 dark:opacity-5"></div>
          <div className="container max-w-screen-xl py-12 px-4 sm:px-6 relative">
            {/* Header */}
            <div className="flex flex-col gap-3 mb-10">
              <div className="flex items-center gap-2">
                <div className="bg-blue-100/80 dark:bg-blue-900/30 backdrop-blur-sm px-3 py-1 rounded-full inline-flex items-center gap-1.5 border border-blue-200/50 dark:border-blue-800/30">
                  <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    Reports
                  </span>
                </div>
              </div>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-700 dark:from-white dark:via-blue-300 dark:to-indigo-400 bg-clip-text text-transparent">
                    Your Reports
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                    View, organize and share your report collection
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link href="/reports/shared">
                    <Button
                      variant="outline"
                      className="h-10 gap-2 px-4 border-gray-300/70 dark:border-gray-700/70 rounded-lg shadow-sm hover:shadow transition-all bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
                    >
                      <ExternalLink className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span>Shared Reports</span>
                      {stats.shared > 0 && (
                        <Badge className="ml-1 bg-blue-100/80 text-blue-800 dark:bg-blue-900/80 dark:text-blue-300 h-5 rounded-full">
                          {stats.shared}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button className="h-10 gap-2 px-4 bg-blue-600/90 hover:bg-blue-700/90 text-white shadow-sm hover:shadow-md transition-all rounded-lg">
                      <Plus className="h-4 w-4" />
                      <span>New Report</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Search and filters */}
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50 rounded-lg p-5 mb-8 shadow-md">
              <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search reports..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10 bg-gray-50/80 dark:bg-gray-800/50 border-gray-200/70 dark:border-gray-700/70 focus:border-blue-300 dark:focus:border-blue-700 transition-colors"
                  />
                </div>

                <div className="hidden md:flex gap-3">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[170px] h-10 bg-gray-50/80 dark:bg-gray-800/50 border-gray-200/70 dark:border-gray-700/70 focus:border-blue-300 dark:focus:border-blue-700 transition-colors">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-gray-200/70 dark:border-gray-700/70">
                      <SelectItem value="all">All Reports</SelectItem>
                      <SelectItem value="shared">Shared Only</SelectItem>
                      <SelectItem value="private">Private Only</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[170px] h-10 bg-gray-50/80 dark:bg-gray-800/50 border-gray-200/70 dark:border-gray-700/70 focus:border-blue-300 dark:focus:border-blue-700 transition-colors">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-gray-200/70 dark:border-gray-700/70">
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                      <SelectItem value="metrics">Most Metrics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  className="md:hidden h-10 gap-2 bg-gray-50/80 dark:bg-gray-800/50 border-gray-200/70 dark:border-gray-700/70 rounded-lg"
                  onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                </Button>
              </div>

              {/* Mobile filters */}
              {mobileFiltersOpen && (
                <div className="md:hidden mt-4 grid grid-cols-2 gap-3">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-10 bg-gray-50/80 dark:bg-gray-800/50 border-gray-200/70 dark:border-gray-700/70">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-gray-200/70 dark:border-gray-700/70">
                      <SelectItem value="all">All Reports</SelectItem>
                      <SelectItem value="shared">Shared Only</SelectItem>
                      <SelectItem value="private">Private Only</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-10 bg-gray-50/80 dark:bg-gray-800/50 border-gray-200/70 dark:border-gray-700/70">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-gray-200/70 dark:border-gray-700/70">
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                      <SelectItem value="metrics">Most Metrics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Report cards */}
            {filteredReports.length === 0 ? (
              <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="p-5 rounded-full bg-gray-100/70 dark:bg-gray-800/70 mb-5 group">
                    <FileText className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2 text-center text-gray-900 dark:text-gray-100">
                    No Reports Found
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
                    {searchQuery
                      ? "Try adjusting your search or filters"
                      : "Start by creating your first report"}
                  </p>
                  <Link href="/dashboard">
                    <Button className="bg-blue-600/90 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all gap-2 rounded-lg">
                      <Plus className="h-4 w-4" />
                      Create New Report
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filteredReports.map((report) => (
                  <Card
                    key={report.id}
                    className="overflow-hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border transition-all hover:shadow-lg hover:translate-y-[-2px] border-gray-200/50 dark:border-gray-800/50 cursor-pointer group"
                    onClick={() => handleCardClick(report.id)}
                  >
                    <CardHeader className="p-5 pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-medium line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {report.title}
                        </CardTitle>
                        {report.shareUrl && (
                          <div className="h-6 w-6 flex items-center justify-center rounded-full bg-blue-100/50 dark:bg-blue-900/30">
                            <Share className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="px-5 pb-0">
                      {Object.keys(report.metrics).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {Object.keys(report.metrics)
                            .slice(0, 3)
                            .map((key) => (
                              <Badge
                                key={key}
                                className="bg-gray-100/80 hover:bg-gray-200/80 text-gray-700 dark:bg-gray-800/80 dark:hover:bg-gray-700/80 dark:text-gray-300 font-normal transition-colors"
                              >
                                {key}
                              </Badge>
                            ))}
                          {Object.keys(report.metrics).length > 3 && (
                            <Badge className="bg-gray-100/80 hover:bg-gray-200/80 text-gray-700 dark:bg-gray-800/80 dark:hover:bg-gray-700/80 dark:text-gray-300 font-normal transition-colors">
                              +{Object.keys(report.metrics).length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="px-5 py-3 border-t border-gray-100/80 dark:border-gray-800/70 flex justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(report.createdAt), "MMM d, yyyy")}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <BarChart className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {Object.keys(report.metrics).length} metrics
                        </span>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
