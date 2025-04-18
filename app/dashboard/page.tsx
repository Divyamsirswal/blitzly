"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ReportForm } from "@/components/report-form";
import {
  FileText,
  Share2,
  Clock,
  Lightbulb,
  Sparkles,
  BookOpen,
  ClipboardList,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/login");
    },
  });
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (status === "loading" || !isLoaded) {
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
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50/90 via-blue-50/30 to-indigo-50/50 dark:from-gray-950/90 dark:via-blue-950/20 dark:to-indigo-950/30 pb-12">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10 dark:opacity-5"></div>
        <div className="container max-w-screen-xl py-12 px-4 sm:px-6 relative">
          <div className="flex flex-col gap-3 mb-10">
            <div className="flex items-center gap-2">
              <div className="bg-blue-100/80 dark:bg-blue-900/30 backdrop-blur-sm px-3 py-1 rounded-full inline-flex items-center gap-1.5 border border-blue-200/50 dark:border-blue-800/30">
                <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  Report Generator
                </span>
              </div>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-700 dark:from-white dark:via-blue-300 dark:to-indigo-400 bg-clip-text text-transparent">
                  Generate New Report
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                  Create professional AI-powered reports in minutes
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push("/reports")}
                  className="h-10 gap-2 px-4 border-gray-300/70 dark:border-gray-700/70 rounded-lg shadow-sm hover:shadow transition-all bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
                >
                  <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span>My Reports</span>
                </Button>
              </div>
            </div>
          </div>

          <Card className="mb-8 bg-gradient-to-br from-blue-600/90 to-indigo-600/90 dark:from-blue-700/90 dark:to-indigo-800/90 text-white shadow-lg hover:shadow-xl transition-all border-0 overflow-hidden relative backdrop-blur-sm">
            <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-400/20 dark:bg-blue-500/20 rounded-full blur-3xl"></div>
            <div className="absolute -left-4 -bottom-8 w-32 h-32 bg-indigo-400/20 dark:bg-indigo-500/20 rounded-full blur-2xl"></div>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/10 rounded-full backdrop-blur-sm">
                  <Sparkles className="h-5 w-5 text-blue-100" />
                </div>
                <CardTitle className="text-base font-medium text-white">
                  AI-Powered Report Generation
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-blue-100 text-sm leading-relaxed">
                Our advanced AI analyzes your metrics to create comprehensive,
                insightful reports. Just provide your key metrics and any
                additional context below.
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-8 md:grid-cols-[1fr_320px]">
            <div className="space-y-8">
              {/* Report Generation Form */}
              <div
                id="report-form"
                className="bg-white/90 dark:bg-gray-900/90 rounded-xl border border-gray-200/50 dark:border-gray-800/50 shadow-md backdrop-blur-sm overflow-hidden"
              >
                <div className="p-6 border-b border-gray-200/70 dark:border-gray-800/70">
                  <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <div className="p-1.5 bg-blue-100/70 dark:bg-blue-900/30 rounded-full">
                      <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    Report Details
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Fill in the details below to create a professional
                    AI-generated report
                  </p>
                </div>
                <ReportForm />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="bg-white/90 dark:bg-gray-900/90 border border-gray-200/50 dark:border-gray-800/50 shadow-md backdrop-blur-sm hover:shadow-lg transition-all">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <div className="p-1.5 rounded-full bg-blue-100/70 dark:bg-blue-900/30">
                      <Share2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pb-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 rounded-lg h-10 transition-colors"
                    onClick={() => router.push("/reports/shared")}
                  >
                    <Share2 className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Shared Reports
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 rounded-lg h-10 transition-colors"
                    onClick={() => router.push("/reports")}
                  >
                    <FileText className="mr-2 h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    View All Reports
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/90 dark:bg-gray-900/90 border border-gray-200/50 dark:border-gray-800/50 shadow-md backdrop-blur-sm hover:shadow-lg transition-all">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <div className="p-1.5 rounded-full bg-amber-100/70 dark:bg-amber-900/30">
                      <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    Report Best Practices
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pb-3">
                  <div className="space-y-2 border-l-2 border-blue-200 dark:border-blue-800/70 pl-3 group hover:pl-4 transition-all duration-200">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                      Clear Title
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Use a descriptive title that clearly indicates the
                      report&apos;s purpose and time period
                    </p>
                  </div>
                  <div className="space-y-2 border-l-2 border-indigo-200 dark:border-indigo-800/70 pl-3 group hover:pl-4 transition-all duration-200">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                      Relevant Metrics
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Include key performance indicators that align with your
                      business goals and objectives
                    </p>
                  </div>
                  <div className="space-y-2 border-l-2 border-violet-200 dark:border-violet-800/70 pl-3 group hover:pl-4 transition-all duration-200">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors">
                      Detailed Context
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Provide relevant background information and analysis for
                      better AI-generated insights
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-gray-50/90 via-gray-50/70 to-gray-100/90 dark:from-gray-900/90 dark:via-gray-950/70 dark:to-gray-800/90 border border-gray-200/50 dark:border-gray-800/40 shadow-md backdrop-blur-sm hover:shadow-lg transition-all overflow-hidden relative">
                <div className="absolute -right-10 top-32 w-24 h-24 bg-blue-400/10 dark:bg-blue-500/10 rounded-full blur-2xl"></div>
                <div className="absolute left-20 -bottom-10 w-20 h-20 bg-indigo-400/10 dark:bg-indigo-500/10 rounded-full blur-xl"></div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <div className="p-1.5 rounded-full bg-blue-100/70 dark:bg-blue-900/30">
                      <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    Need Help?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Learn how to create effective reports with our comprehensive
                    guides.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-sm"
                      onClick={() => router.push("/docs")}
                    >
                      <BookOpen className="h-3.5 w-3.5 mr-1.5 text-gray-500 dark:text-gray-400" />
                      Documentation
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-sm"
                      onClick={() => router.push("/support")}
                    >
                      <HelpCircle className="h-3.5 w-3.5 mr-1.5 text-gray-500 dark:text-gray-400" />
                      Get Support
                    </Button>
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
