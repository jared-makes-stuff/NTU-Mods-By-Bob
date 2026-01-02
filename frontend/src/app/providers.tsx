"use client";

import { ThemeProvider } from "@/shared/providers/theme-provider";
import { QueryProvider } from "@/shared/data/QueryProvider";
import { AuthProvider, GoogleAuthProvider } from "@/features/auth";
import { Toaster } from "@/shared/ui/toaster";

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * App-wide client providers that require React context.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryProvider>
        <GoogleAuthProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </GoogleAuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
