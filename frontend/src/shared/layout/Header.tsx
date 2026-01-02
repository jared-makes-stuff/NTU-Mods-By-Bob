/**
 * Header Component
 * 
 * Simplified navigation focused on unified academic planning
 */

"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { GraduationCap, Calendar, Search, Info, User as UserIcon, Users, Bell, Menu } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { EditProfileDialog, LoginDialog, RegisterDialog, useAuthStore } from "@/features/auth";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";
import { HeaderSearchControls } from "./components/HeaderSearchControls";
import { hasRequiredRole } from "@/shared/lib/roles";
import { cn } from "@/shared/lib/utils";

export function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [isEditProfileDialogOpen, setIsEditProfileDialogOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const canAccessVacancyAlerts = isAuthenticated && hasRequiredRole(user?.role, "plus");
  const isAdmin = isAuthenticated && hasRequiredRole(user?.role, "admin");

  const navItems = [
    { label: "Planner", href: "/course-planner", icon: GraduationCap, description: "Course & Degree Planning" },
    { label: "Timetable", href: "/timetable-planner", icon: Calendar, description: "Schedule Generation" },
    { label: "Modules", href: "/module-info", icon: Search, description: "Module Information" },
    ...(canAccessVacancyAlerts ? [
      { label: "Vacancy Alerts", href: "/vacancy-alerts", icon: Bell, description: "Track module vacancy alerts" },
    ] : []),
    { label: "About", href: "/about", icon: Info, description: "About NTU Mods" },
  ];

  const isActive = (href: string) => {
    return pathname === href || (pathname === "/" && href === "/course-planner");
  };

  const handleLoginSuccess = () => {
    setIsLoginDialogOpen(false);
  };

  const handleRegisterSuccess = () => {
    setIsRegisterDialogOpen(false);
    setIsLoginDialogOpen(true);
  };

  const handleLogout = async () => {
    await logout();
  };
  const searchParamsKey = searchParams.toString();

  return (
    <header className="h-16 border-b bg-card px-4 md:px-6 flex items-center sticky top-0 z-50 backdrop-blur-sm bg-card/95 gap-4">
      {/* Mobile Menu Button */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="size-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <GraduationCap className="size-6 text-primary" />
              NTU Mods
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-2 mt-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3",
                      isActive(item.href)
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              );
            })}
            {isAdmin && (
              <Link href="/admin/users" onClick={() => setIsMobileMenuOpen(false)}>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
                >
                  <Users className="size-4" />
                  <span>User Management</span>
                </Button>
              </Link>
            )}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Logo & Nav Container */}
      <div className="flex items-center gap-6 mr-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <GraduationCap className="size-7 text-primary" />
          <span className="text-lg font-semibold leading-none">NTU Mods</span>
        </Link>

        {/* Navigation - Hidden on mobile, visible on larger screens */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={
                    isActive(item.href)
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }
                  title={item.description}
                >
                  <Icon className="size-4 xl:mr-2" />
                  <span className="hidden xl:inline">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {isAdmin && (
          <Link href="/admin/users">
            <Button
              size="sm"
              variant="secondary"
              className="hidden lg:flex text-muted-foreground hover:text-foreground"
              title="Admin user management"
            >
              <Users className="size-4 xl:mr-2" />
              <span className="hidden xl:inline">User Management</span>
            </Button>
          </Link>
        )}
        {/* Search Bar & Filter */}
        <HeaderSearchControls key={searchParamsKey} searchParams={searchParams} />
      </div>

      {/* Auth Actions */}
      <div className="flex items-center gap-2">
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="group flex items-center gap-3 rounded-full border p-1 transition-all hover:pr-4 hover:bg-accent/50 cursor-pointer max-w-[40px] hover:max-w-[200px] overflow-hidden">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={user?.avatarUrl || ""} alt={user?.name || "User"} />
                  <AvatarFallback>
                    {user?.name ? (
                      user?.name.substring(0, 2).toUpperCase()
                    ) : (
                      <UserIcon className="h-4 w-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium truncate opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {user?.name}
                </span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsEditProfileDialogOpen(true)}>
                <UserIcon className="size-4 mr-2" />
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setIsLoginDialogOpen(true)}>
            <span className="hidden sm:inline">Login</span>
            <span className="sm:hidden">Log</span>
          </Button>
        )}
      </div>

      {/* Dialogs */}
      <LoginDialog
        isOpen={isLoginDialogOpen}
        onClose={() => setIsLoginDialogOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onRegisterClick={() => {
          setIsLoginDialogOpen(false);
          setIsRegisterDialogOpen(true);
        }}
      />
      <RegisterDialog
        isOpen={isRegisterDialogOpen}
        onClose={() => setIsRegisterDialogOpen(false)}
        onRegisterSuccess={handleRegisterSuccess}
        onLoginClick={() => {
          setIsRegisterDialogOpen(false);
          setIsLoginDialogOpen(true);
        }}
      />
      <EditProfileDialog
        isOpen={isEditProfileDialogOpen}
        onClose={() => setIsEditProfileDialogOpen(false)}
      />
    </header>
  );
}
