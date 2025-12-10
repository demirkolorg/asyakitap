"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Library,
  Quote,
  Settings,
  PlusCircle,
  LayoutDashboard,
  FileText,
  Map,
  Users,
  Pen,
  Building2,
} from "lucide-react";

// Ana Sayfa
const homeItems = [
  {
    title: "Genel Bakış",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
];

// Kütüphane - Kitap ve Yazar yönetimi
const libraryItems = [
  {
    title: "Kütüphanem",
    href: "/library",
    icon: Library,
  },
  {
    title: "Yazarlar",
    href: "/authors",
    icon: Users,
  },
  {
    title: "Yayınevleri",
    href: "/publishers",
    icon: Building2,
  },
  {
    title: "Okuma Listeleri",
    href: "/reading-lists",
    icon: Map,
  },
];

// Notlar - Kitaplardan çıkarılan içerikler
const notesItems = [
  {
    title: "Alıntılar",
    href: "/quotes",
    icon: Quote,
  },
  {
    title: "Tortular",
    href: "/summaries",
    icon: FileText,
  },
  {
    title: "İmzalar",
    href: "/imzalar",
    icon: Pen,
  },
];

// İşlemler
const actionItems = [
  {
    title: "Kitap Ekle",
    href: "/library/add",
    icon: PlusCircle,
  },
];

// Sistem
const settingsItems = [
  {
    title: "Ayarlar",
    href: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-6 py-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image
            src="/asyakitap.png"
            alt="AsyaKitap Logo"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-white">
              AsyaKitap
            </span>
            <span className="text-[10px] text-slate-400 -mt-0.5">
              Kişisel Kütüphane
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Ana Sayfa */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {homeItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Kütüphane */}
        <SidebarGroup>
          <SidebarGroupLabel>Kütüphane</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {libraryItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href))}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Notlarım */}
        <SidebarGroup>
          <SidebarGroupLabel>Notlarım</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {notesItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || pathname?.startsWith(item.href)}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* İşlemler */}
        <SidebarGroup>
          <SidebarGroupLabel>İşlemler</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {actionItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Sistem */}
        <SidebarGroup>
          <SidebarGroupLabel>Sistem</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
