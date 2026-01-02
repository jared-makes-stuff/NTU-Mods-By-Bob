/**
 * About Page
 * 
 * Simple explanation of features for normal users
 */

import { GraduationCap, Calendar, Search, BookOpen, Github, AlertCircle, Heart, Sparkles, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { config } from "@/shared/config";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center size-20 rounded-full bg-primary/10 mb-6">
          <GraduationCap className="size-10 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Plan Your NTU Journey
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {config.appName} helps you plan courses, build timetables, and explore modules — all in one place.
        </p>
      </div>

      {/* Main Features */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-center">What You Can Do</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Course Planner */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="size-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <BookOpen className="size-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Course Planner</CardTitle>
              </div>
              <CardDescription className="text-base">
                Map out your entire degree, semester by semester
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Drag and drop modules into semesters</li>
                <li>• See your GPA and AU progress</li>
                <li>• Check prerequisites automatically</li>
                <li>• Save multiple plan versions</li>
              </ul>
            </CardContent>
          </Card>

          {/* Timetable Generator */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="size-12 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Calendar className="size-6 text-violet-600" />
                </div>
                <CardTitle className="text-xl">Timetable Generator</CardTitle>
              </div>
              <CardDescription className="text-base">
                Create the perfect schedule for your semester
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Pick your modules and get timetable options</li>
                <li>• Automatically avoids class clashes</li>
                <li>• Filter by time preferences (no early morning classes!)</li>
                <li>• See all possible combinations</li>
              </ul>
            </CardContent>
          </Card>

          {/* Module Browser */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="size-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Search className="size-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Module Browser</CardTitle>
              </div>
              <CardDescription className="text-base">
                Explore and search all NTU modules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Search by code, name, or description</li>
                <li>• View prerequisites and module details</li>
                <li>• Check class vacancies in real-time</li>
                <li>• Read reviews from other students</li>
              </ul>
            </CardContent>
          </Card>

          {/* Additional Features */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="size-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <Clock className="size-6 text-green-600" />
                </div>
                <CardTitle className="text-xl">More Features</CardTitle>
              </div>
              <CardDescription className="text-base">
                Extra tools to help you succeed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Import/export your plans as CSV</li>
                <li>• Works without login (guest mode)</li>
                <li>• Dark and light themes</li>
                <li>• Mobile-friendly design</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* How It Works */}
      <div className="border rounded-lg p-8 bg-muted/30 mb-12">
        <h2 className="text-2xl font-semibold mb-6">How It Works</h2>
        <div className="space-y-4 text-muted-foreground">
          <div className="flex gap-4">
            <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
              1
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Browse Modules</p>
              <p className="text-sm">Search through NTU&apos;s module catalog to find courses you want to take.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
              2
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Plan Your Course</p>
              <p className="text-sm">Arrange modules across semesters and years to see your degree roadmap.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
              3
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Generate Timetable</p>
              <p className="text-sm">Select modules for a semester and instantly get clash-free timetable options.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Open Source */}
      <div className="border rounded-lg p-8 bg-gradient-to-br from-muted/50 to-muted/20 mb-12">
        <div className="flex items-center gap-3 mb-4">
          <Github className="size-8 text-foreground" />
          <h2 className="text-2xl font-semibold">Open Source</h2>
        </div>
        <p className="text-muted-foreground mb-6">
          {config.appName} is free and open source. Built by students, for students.
          Help improve the platform or report bugs on GitHub.
        </p>
        <div className="flex gap-4 flex-wrap">
          <Link 
            href="https://github.com/jaredthejellyfish/NTU-Mods-By-Bob" 
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="gap-2">
              <Github className="size-4" />
              View Source Code
            </Button>
          </Link>
          <Link 
            href="https://github.com/jaredthejellyfish/NTU-Mods-By-Bob/issues" 
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="gap-2">
              <AlertCircle className="size-4" />
              Report a Bug
            </Button>
          </Link>
        </div>
      </div>

      {/* Support the Project */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="inline-flex items-center justify-center size-12 rounded-full bg-primary/10">
              <Heart className="size-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Support {config.appName}</CardTitle>
          </div>
          <CardDescription className="text-base">
            If this project helps your planning, a small donation helps keep the servers,
            data sync, and development going.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Sparkles className="size-5 text-primary mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium mb-2">Where contributions go</p>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li>• Server and database hosting</li>
                <li>• Data sync and uptime monitoring</li>
                <li>• New features and maintenance</li>
              </ul>
            </div>
          </div>
          <div className="pt-2">
            <Button asChild size="lg">
              <Link href={config.donationUrl} target="_blank" rel="noopener noreferrer">
                <Heart className="size-4 mr-2" />
                Donate on Ko-fi
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
