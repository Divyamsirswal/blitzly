"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  User,
  LogOut,
  Settings,
  Home,
  BarChart,
  Menu,
  ChevronRight,
  Flag,
  LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { NotificationDropdown } from "./NotificationDropdown";
import { NotificationProvider } from "@/lib/contexts/NotificationContext";
// Fix linter error by adding the formatRelativeTime function directly
// Format relative time for notifications

interface Route {
  href: string;
  label: string;
  icon: LucideIcon;
}

const routes: Route[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: Home,
  },
  {
    href: "/reports",
    label: "Reports",
    icon: BarChart,
  },
];

export function MainNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Handle scroll for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <NotificationProvider>
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300",
          isScrolled
            ? "border-b border-slate-200/10 dark:border-slate-800/10 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-sm"
            : "bg-transparent"
        )}
      >
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center transition-all duration-200 hover:opacity-90"
            >
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 dark:from-blue-400 dark:via-indigo-400 dark:to-blue-400 bg-clip-text text-transparent">
                Blitzly
              </span>
            </Link>

            {status === "authenticated" && (
              <nav className="hidden md:flex items-center gap-1.5">
                {routes.map((route) => {
                  const RouteIcon = route.icon;
                  const isActive = pathname === route.href;
                  return (
                    <Link
                      key={route.href}
                      href={route.href}
                      className={cn(
                        "group px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2.5 hover:translate-y-[-1px]",
                        isActive
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-700 dark:text-blue-300 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 hover:text-slate-900 dark:hover:text-white"
                      )}
                    >
                      <RouteIcon
                        className={cn(
                          "h-[16px] w-[16px] transition-all",
                          isActive
                            ? "text-blue-500 dark:text-blue-400"
                            : "text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                        )}
                      />
                      {route.label}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-2">
            {status === "authenticated" ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden flex w-10 h-10 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all duration-200 items-center justify-center"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="Toggle menu"
                >
                  <Menu className="h-[18px] w-[18px]" />
                </Button>

                <NotificationDropdown
                  isOpen={isNotificationsOpen}
                  onOpenChange={setIsNotificationsOpen}
                />

                <div className="ml-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="focus:outline-none group">
                        <div className="relative h-10 w-10 rounded-full overflow-hidden transition-all duration-200 transform group-hover:scale-105 group-focus:ring-2 group-focus:ring-blue-500/20 dark:group-focus:ring-blue-400/30">
                          {session?.user?.image ? (
                            <Image
                              src={session.user.image}
                              alt={session.user.name || "User"}
                              fill
                              className="rounded-full object-cover"
                              sizes="40px"
                              priority
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/60 dark:to-indigo-900/60">
                              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                          )}
                        </div>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-80 p-1.5 mt-1 rounded-xl shadow-xl border border-slate-200/50 dark:border-slate-800/50"
                    >
                      <div className="flex items-center gap-3 p-3">
                        <div className="relative h-9 w-9 rounded-full overflow-hidden ring-[1.5px] ring-blue-100 dark:ring-blue-900/40">
                          {session?.user?.image ? (
                            <Image
                              src={session.user.image}
                              alt={session.user.name || "User"}
                              fill
                              className="rounded-full object-cover"
                              sizes="36px"
                              priority
                            />
                          ) : (
                            <div className="h-full w-full rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/60 dark:to-indigo-900/60 flex items-center justify-center">
                              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          {session?.user?.name && (
                            <p className="font-medium text-sm text-slate-900 dark:text-white">
                              {session.user.name}
                            </p>
                          )}
                          {session?.user?.email && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                              {session.user.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <DropdownMenuSeparator className="my-1 opacity-20" />
                      <div className="px-1 py-1">
                        <DropdownMenuItem
                          asChild
                          className="rounded-lg h-9 px-2.5 py-1.5 cursor-pointer transition-colors data-[highlighted]:bg-blue-50 dark:data-[highlighted]:bg-blue-900/20"
                        >
                          <Link
                            href="/settings"
                            className="flex items-center w-full"
                          >
                            <Settings className="mr-2 h-[15px] w-[15px] text-slate-500 dark:text-slate-400" />
                            <span className="text-[13px] text-slate-700 dark:text-slate-300">
                              Settings
                            </span>
                            <ChevronRight className="ml-auto h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          asChild
                          className="rounded-lg h-9 px-2.5 py-1.5 cursor-pointer transition-colors data-[highlighted]:bg-blue-50 dark:data-[highlighted]:bg-blue-900/20"
                        >
                          <Link
                            href="/admin/moderation"
                            className="flex items-center w-full"
                          >
                            <Flag className="mr-2 h-[15px] w-[15px] text-slate-500 dark:text-slate-400" />
                            <span className="text-[13px] text-slate-700 dark:text-slate-300">
                              Moderation
                            </span>
                            <ChevronRight className="ml-auto h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                          </Link>
                        </DropdownMenuItem>
                      </div>
                      <DropdownMenuSeparator className="my-1 opacity-20" />
                      <div className="px-1 py-1">
                        <DropdownMenuItem
                          className="text-red-600 dark:text-red-400 cursor-pointer focus:text-red-600 dark:focus:text-red-400 rounded-lg h-9 px-2.5 py-1.5 focus:bg-red-50/40 dark:focus:bg-red-950/20 transition-colors"
                          onClick={() => signOut({ callbackUrl: "/" })}
                        >
                          <LogOut className="mr-2 h-[15px] w-[15px]" />
                          <span className="text-[13px]">Log out</span>
                        </DropdownMenuItem>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 text-[13px] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/80 dark:hover:bg-slate-800/50 font-medium px-4 transition-all duration-200 hover:translate-y-[-1px]"
                  >
                    Log in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    size="sm"
                    className="h-9 text-[13px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-400 dark:hover:to-indigo-400 font-medium px-4 shadow-sm hover:shadow transition-all duration-200 hover:translate-y-[-1px]"
                  >
                    Sign up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {status === "authenticated" && (
          <div
            className={cn(
              "md:hidden fixed inset-x-0 top-16 bg-white/97 dark:bg-slate-950/97 backdrop-blur-xl border-b border-slate-200/20 dark:border-slate-800/20 transition-all duration-300 transform shadow-lg z-40",
              isMobileMenuOpen ? "translate-y-0" : "-translate-y-full opacity-0"
            )}
          >
            <nav className="container py-3">
              <div className="flex flex-col space-y-1">
                {routes.map((route) => {
                  const RouteIcon = route.icon;
                  const isActive = pathname === route.href;
                  return (
                    <Link
                      key={route.href}
                      href={route.href}
                      className={cn(
                        "group px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-3",
                        isActive
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50/70 dark:from-blue-900/30 dark:to-indigo-900/20 text-blue-700 dark:text-blue-300"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 hover:text-slate-900 dark:hover:text-white"
                      )}
                    >
                      <RouteIcon
                        className={cn(
                          "h-[18px] w-[18px] transition-colors",
                          isActive
                            ? "text-blue-500 dark:text-blue-400"
                            : "text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                        )}
                      />
                      {route.label}
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>
        )}
      </header>
    </NotificationProvider>
  );
}
