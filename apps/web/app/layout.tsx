import "./globals.css";
import { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";

export const metadata = {
  title: "On-chain Governance Toolkit",
  description: "Coordination stack for DAOs across Discord and Telegram"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased")}> 
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
