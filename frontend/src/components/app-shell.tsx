"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Tags,
  ReceiptText,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  soon?: boolean;
};

const NAV: NavItem[] = [
  { label: "Visão geral", href: "/", icon: LayoutDashboard },
  { label: "Contas", href: "/contas", icon: Wallet, soon: true },
  { label: "Movimentações", href: "/movimentacoes", icon: ArrowLeftRight, soon: true },
  { label: "Categorias", href: "/categorias", icon: Tags, soon: true },
  { label: "Faturas", href: "/faturas", icon: ReceiptText, soon: true },
];

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2 px-2 py-1">
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground font-bold">
        M
      </span>
      <span className="text-lg font-semibold tracking-tight">
        Mustard<span className="text-primary"> Finances</span>
      </span>
    </Link>
  );
}

function NavLinks({ pathname }: { pathname: string }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        const content = (
          <>
            <Icon className="size-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.soon && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                em breve
              </span>
            )}
          </>
        );
        const base =
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors";
        if (item.soon) {
          return (
            <span
              key={item.href}
              aria-disabled
              className={cn(base, "cursor-not-allowed text-muted-foreground/70")}
            >
              {content}
            </span>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              base,
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60",
            )}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar (md+) */}
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
        <div className="p-4">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <NavLinks pathname={pathname} />
        </div>
        <div className="border-t border-sidebar-border p-4 text-xs text-muted-foreground">
          Uso pessoal · R$
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur md:px-8">
          <div className="md:hidden">
            <Brand />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
