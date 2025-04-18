import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Zap,
  Shield,
  Clock,
  Cpu,
  Users,
  LineChart,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0A0A0A]">
      {/* Ultra-Modern Noise Background with Subtle Grain */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-white dark:bg-[#0A0A0A]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-white to-white dark:from-slate-900/40 dark:via-[#0A0A0A] dark:to-[#0A0A0A]" />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.02] dark:opacity-[0.03]" />
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-[0.01] dark:opacity-[0.02]" />
        <div className="absolute top-0 h-[500px] w-full bg-gradient-to-b from-blue-50/50 via-indigo-50/25 to-transparent dark:from-blue-950/30 dark:via-indigo-950/10 dark:to-transparent" />
      </div>

      <main className="flex-1">
        {/* Hero Section - Enhanced with subtle animations */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-40 relative overflow-hidden">
          <div className="container max-w-7xl relative px-4 md:px-6">
            {/* Animated background elements */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse-slow opacity-70 dark:opacity-30" />
            <div
              className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow opacity-70 dark:opacity-30"
              style={{ animationDelay: "1s" }}
            />

            <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center">
              <div className="flex-1 space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-200">
                    Now with AI-powered analytics
                  </span>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Client reporting
                  <span className="relative">
                    <span className="text-transparent pb-8  bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-400 dark:to-blue-500 inline-block">
                      reimagined
                    </span>
                    <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-400 dark:to-blue-500 rounded-full opacity-70"></span>
                  </span>
                </h1>

                <p className="text-xl text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
                  Generate beautiful client reports in seconds with AI-powered
                  insights and analytics.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/register">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white h-12 px-8 text-base font-medium shadow-lg shadow-indigo-500/20 dark:shadow-indigo-700/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                    >
                      Start Free Trial
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link href="#features">
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-12 px-8 text-base font-medium border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 transition-all duration-300 hover:-translate-y-0.5"
                    >
                      Learn More
                    </Button>
                  </Link>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full ring-2 ring-white dark:ring-slate-900 overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-medium"
                      />
                    ))}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-medium text-slate-900 dark:text-white">
                      5,000+
                    </span>{" "}
                    professionals trust Blitzly
                  </div>
                </div>
              </div>

              {/* App Preview */}
              <div className="flex-1 relative h-full min-h-[600px] w-full lg:max-w-xl perspective">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/90 to-blue-950/90 dark:from-indigo-950/90 dark:to-blue-950/90 rounded-2xl backdrop-blur-sm border border-indigo-900/50 dark:border-indigo-900/50 shadow-2xl">
                  <div className="relative h-full w-full p-4 md:p-6 overflow-hidden flex flex-col">
                    {/* Navbar */}
                    <div className="flex justify-between items-center pb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-blue-500" />
                        <div className="h-2 w-36 rounded-full bg-slate-600/50" />
                      </div>
                      <div className="flex gap-2">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="w-5 h-5 rounded-full bg-slate-700/60"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Dashboard Content */}
                    <div className="flex flex-col gap-5 flex-1">
                      {/* Main section heading */}
                      <div className="flex justify-between items-center">
                        <div className="h-4 w-32 rounded-full bg-slate-600/50" />
                        <div className="flex gap-3">
                          <div className="px-3 py-1 rounded text-xs bg-indigo-600/30 text-indigo-200 border border-indigo-700/30">
                            This Week
                          </div>
                          <div className="px-3 py-1 rounded text-xs bg-slate-800/50 text-slate-400 border border-slate-700/30">
                            Export
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/40 backdrop-blur-sm">
                          <div className="flex justify-between items-start mb-4">
                            <div className="h-2 w-12 rounded-full bg-slate-700" />
                            <div className="w-5 h-5 rounded flex items-center justify-center bg-slate-800">
                              <div className="h-3 w-3 text-indigo-400">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                                </svg>
                              </div>
                            </div>
                          </div>
                          <div className="text-lg font-semibold text-indigo-400">
                            +24%
                          </div>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/40 backdrop-blur-sm">
                          <div className="flex justify-between items-start mb-4">
                            <div className="h-2 w-12 rounded-full bg-slate-700" />
                            <div className="w-5 h-5 rounded flex items-center justify-center bg-slate-800">
                              <div className="h-3 w-3 text-blue-400">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                                </svg>
                              </div>
                            </div>
                          </div>
                          <div className="text-lg font-semibold text-blue-400">
                            +28%
                          </div>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/40 backdrop-blur-sm">
                          <div className="flex justify-between items-start mb-4">
                            <div className="h-2 w-12 rounded-full bg-slate-700" />
                            <div className="w-5 h-5 rounded flex items-center justify-center bg-slate-800">
                              <div className="h-3 w-3 text-emerald-400">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                                </svg>
                              </div>
                            </div>
                          </div>
                          <div className="text-lg font-semibold text-emerald-400">
                            +32%
                          </div>
                        </div>
                      </div>

                      {/* Sidebar and Main Content */}
                      <div className="grid grid-cols-12 gap-4 flex-1">
                        {/* Sidebar */}
                        <div className="col-span-3 bg-slate-800/40 rounded-lg p-3 flex flex-col gap-3">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className={`py-2 px-3 rounded-md flex items-center gap-2 ${
                                i === 1
                                  ? "bg-indigo-900/30 text-indigo-400"
                                  : "text-slate-500"
                              }`}
                            >
                              <div className="w-2 h-2 rounded-full bg-current" />
                              <div className="h-2 w-12 rounded-full bg-current opacity-40" />
                            </div>
                          ))}
                        </div>

                        {/* Chart Area */}
                        <div className="col-span-9 flex flex-col">
                          {/* Chart Header */}
                          <div className="flex justify-between mb-2">
                            <div className="h-3 w-20 rounded-full bg-slate-700" />
                            <div className="flex gap-2">
                              <div className="h-3 w-10 rounded-full bg-slate-700" />
                              <div className="h-3 w-10 rounded-full bg-slate-700" />
                            </div>
                          </div>

                          {/* Chart */}
                          <div className="flex-1 bg-slate-900/50 rounded-lg p-4 flex items-end border border-slate-700/40">
                            <div className="w-full h-40 relative">
                              {/* Chart grid lines */}
                              <div className="absolute inset-x-0 bottom-0 h-[1px] bg-slate-700/50" />
                              <div className="absolute inset-x-0 bottom-1/4 h-[1px] bg-slate-700/30" />
                              <div className="absolute inset-x-0 bottom-2/4 h-[1px] bg-slate-700/30" />
                              <div className="absolute inset-x-0 bottom-3/4 h-[1px] bg-slate-700/30" />

                              {/* Chart bars */}
                              <div className="absolute bottom-0 inset-x-0 flex items-end justify-between h-full">
                                {[
                                  35, 45, 55, 40, 60, 50, 65, 70, 52, 68, 65,
                                  60,
                                ].map((height, i) => (
                                  <div key={i} className="w-[7%]">
                                    <div
                                      style={{ height: `${height}%` }}
                                      className="rounded-t-sm bg-gradient-to-t from-blue-500 to-indigo-500 opacity-80"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Clean Minimal Modern */}
        <section
          id="features"
          className="w-full py-24 md:py-32 relative overflow-hidden"
        >
          <div className="container max-w-7xl relative px-4 md:px-6">
            <div className="flex flex-col items-center gap-4 text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-sm font-medium text-slate-900 dark:text-slate-200">
                  Features
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white max-w-xl">
                Everything you need to create
                <span className="block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-400 dark:to-blue-500">
                  perfect reports
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Zap,
                  title: "Lightning Fast",
                  description:
                    "Generate reports in under 3 seconds with our optimized AI engine",
                },
                {
                  icon: LineChart,
                  title: "Multiple Metrics",
                  description:
                    "Comprehensive support for SEO, ads, social media metrics, and more",
                },
                {
                  icon: Shield,
                  title: "Enterprise Security",
                  description:
                    "Bank-grade encryption and security for all your sensitive data",
                },
                {
                  icon: Clock,
                  title: "Time Saving",
                  description:
                    "Automate your entire reporting workflow with smart templates",
                },
                {
                  icon: Cpu,
                  title: "AI-Powered",
                  description:
                    "Leverage machine learning to uncover insights automatically",
                },
                {
                  icon: Users,
                  title: "Team Collaboration",
                  description:
                    "Work together seamlessly with role-based permissions",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="group relative p-6 bg-white dark:bg-[#111] rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="relative space-y-4">
                    <div className="inline-flex p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                      <feature.icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section - Clean Minimal Modern */}
        <section className="w-full py-24 bg-gradient-to-b from-white to-slate-50 dark:from-[#0A0A0A] dark:to-slate-900/30">
          <div className="container max-w-7xl px-4 md:px-6">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8 p-8 md:p-12 rounded-2xl bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-sm">
              <div className="flex-1">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
                  Ready to transform your reporting?
                </h2>
                <p className="text-slate-600 dark:text-slate-400 max-w-xl">
                  Join thousands of professionals using Blitzly to create
                  beautiful reports in seconds.
                </p>
              </div>
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-8 h-12 text-base font-medium shadow-lg shadow-indigo-500/20 dark:shadow-indigo-700/20 hover:shadow-xl"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-12 md:py-16 bg-white dark:bg-black border-t border-slate-200 dark:border-slate-800">
        <div className="container max-w-7xl px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand Section */}
            <div className="space-y-4 md:col-span-2">
              <Link
                href="/"
                className="inline-flex items-center space-x-2 transition-opacity hover:opacity-80"
              >
                <span className="font-semibold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-400 dark:to-blue-500">
                  Blitzly
                </span>
              </Link>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm">
                Generate beautiful client reports in seconds with AI-powered
                insights and analytics.
              </p>
              <div className="flex items-center gap-4">
                {[
                  { label: "Twitter", href: "#" },
                  { label: "GitHub", href: "#" },
                  { label: "LinkedIn", href: "#" },
                ].map((social) => (
                  <Link
                    key={social.label}
                    href={social.href}
                    className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                  >
                    {social.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-slate-900 dark:text-white">
                Product
              </h3>
              <nav className="flex flex-col space-y-3">
                {[
                  { label: "Features", href: "#" },
                  { label: "Pricing", href: "#" },
                  { label: "Integrations", href: "#" },
                  { label: "FAQ", href: "#" },
                ].map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Legal Links */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-slate-900 dark:text-white">
                Company
              </h3>
              <nav className="flex flex-col space-y-3">
                {[
                  { label: "About Us", href: "#" },
                  { label: "Privacy Policy", href: "#" },
                  { label: "Terms of Service", href: "#" },
                  { label: "Contact", href: "#" },
                ].map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                © 2024 Blitzly. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
