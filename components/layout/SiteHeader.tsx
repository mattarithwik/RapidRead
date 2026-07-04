"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CommandDialog, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Moon, Search, Sun, Menu } from "lucide-react";
import { useTheme } from "next-themes";

interface SiteHeaderProps {
  userEmail?: string;
  authenticated: boolean;
}

export function SiteHeader({ userEmail, authenticated }: SiteHeaderProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [commandOpen, setCommandOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/sign-in");
    router.refresh();
  }

  const initials = userEmail?.slice(0, 2).toUpperCase() ?? "RR";

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen((v) => !v)}>
              <Menu className="h-5 w-5" />
            </Button>
            <Link href="/" className="font-serif text-xl font-semibold tracking-tight">
              RapidRead
            </Link>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <Link href="/" className="hover:text-foreground">
              Feed
            </Link>
            <Link href="/profile" className="hover:text-foreground">
              Profile
            </Link>
            <Link href="/settings" className="hover:text-foreground">
              Settings
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCommandOpen(true)} className="hidden sm:inline-flex">
              <Search className="mr-2 h-4 w-4" />
              Search
              <span className="ml-2 text-xs text-muted-foreground">⌘K</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            {authenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push("/profile")}>Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/settings")}>Settings</DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut}>Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm">
                <Link href="/sign-in">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
        {mobileOpen ? (
          <div className="border-t px-4 py-3 md:hidden">
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/" onClick={() => setMobileOpen(false)}>
                Feed
              </Link>
              <Link href="/profile" onClick={() => setMobileOpen(false)}>
                Profile
              </Link>
              <Link href="/settings" onClick={() => setMobileOpen(false)}>
                Settings
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Jump to a page..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandItem onSelect={() => { setCommandOpen(false); router.push("/"); }}>Feed</CommandItem>
          <CommandItem onSelect={() => { setCommandOpen(false); router.push("/profile"); }}>Profile</CommandItem>
          <CommandItem onSelect={() => { setCommandOpen(false); router.push("/settings"); }}>Settings</CommandItem>
          <CommandItem onSelect={() => { setCommandOpen(false); router.push("/sign-in"); }}>Sign in</CommandItem>
        </CommandList>
      </CommandDialog>
    </>
  );
}
