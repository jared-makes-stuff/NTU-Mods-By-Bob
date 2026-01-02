/**
 * Landing Page
 * 
 * Welcome page for NTU Mods - A unified academic planning platform
 * Redirects users to the main planner interface
 * 
 * Purpose: Single entry point that emphasizes the core value proposition
 */

'use client';

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { ArrowRight, Calendar, GraduationCap, AlertCircle } from "lucide-react";
import { apiClient } from "@/shared/api/client";

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkBackend = useCallback(async () => {
    setIsChecking(true);
    try {
      await apiClient.get('/health', { timeout: 5000 });
    } catch {
      setError('Unable to connect to server. Some features may be limited.');
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Check backend health on mount
  useEffect(() => {
    checkBackend();
  }, [checkBackend]);

  const handleGetStarted = () => {
    // Redirect to the course planner as the main entry point
    router.push('/course-planner');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 bg-background text-foreground">
      <div className="max-w-4xl w-full space-y-12 text-center">
        
        {/* Hero Section */}
        <div className="space-y-6 animate-in fade-in zoom-in duration-700">
          <div className="flex items-center justify-center mb-4">
            <GraduationCap className="h-16 w-16 text-blue-600" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
              Plan Your Academic Journey
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Your complete academic planning solution. Build your course roadmap, 
            generate optimal timetables, and track your progress - all in one place.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="w-full max-w-2xl mx-auto p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3 text-left animate-in fade-in slide-in-from-top-4 duration-300">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">Backend Server Error</p>
              <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">{error}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Run: <code className="bg-muted px-1 py-0.5 rounded">cd backend && npm run dev</code>
              </p>
            </div>
          </div>
        )}

        {/* CTA Button */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
          <Button 
            size="lg" 
            onClick={handleGetStarted}
            disabled={isChecking}
            className="rounded-full px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          {error && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-4">
              Note: Server connection limited. You can still use the planner in guest mode.
            </p>
          )}
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
          <div className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
            <Calendar className="h-12 w-12 text-blue-600 mb-4 mx-auto" />
            <h3 className="font-semibold text-lg mb-2">Smart Timetables</h3>
            <p className="text-sm text-muted-foreground">
              Generate conflict-free schedules with optimal time slots
            </p>
          </div>
          
          <div className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
            <GraduationCap className="h-12 w-12 text-violet-600 mb-4 mx-auto" />
            <h3 className="font-semibold text-lg mb-2">Course Planning</h3>
            <p className="text-sm text-muted-foreground">
              Plan your entire degree with GPA tracking and prerequisites
            </p>
          </div>
          
          <div className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
            <ArrowRight className="h-12 w-12 text-purple-600 mb-4 mx-auto" />
            <h3 className="font-semibold text-lg mb-2">All-in-One</h3>
            <p className="text-sm text-muted-foreground">
              Everything you need for academic planning in one unified platform
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}
