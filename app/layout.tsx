import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/auth-provider";
import { AuthLayout } from "@/components/auth/auth-layout";
import { MainNav } from "@/components/nav/main-nav";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Blitzly - AI-Powered Client Report Generator",
  description:
    "Turn client metrics into beautiful, insightful reports in under 3 seconds using the world's fastest AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${inter.variable} antialiased`}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>
              <AuthLayout>
                <div className="relative z-10">
                  <MainNav />
                  <main className="flex-1 transition-all duration-300 ease-in-out">
                    {children}
                  </main>
                </div>
              </AuthLayout>
            </TooltipProvider>
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
