"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FileText, Globe, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Profiles", href: "/", icon: FileText },
  { name: "Sites Profiles", href: "/sites", icon: Globe },
];

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Left Sidebar */}
      <aside className="sticky top-0 h-screen w-48 flex-shrink-0 border-r bg-background flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-2 h-14 px-4 border-b">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold text-sm">RTE Profiles</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 p-3">
          {navigation.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/" || pathname.startsWith("/profiles")
                : pathname.startsWith(item.href);

            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "w-full justify-start gap-2 h-9",
                    isActive && "shadow-sm",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
