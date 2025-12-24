"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogoIcon } from "@/components/logo";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Target,
  BarChart3,
  Bot,
  TrendingUp,
  ExternalLink,
  BookOpen,
  Loader2,
  FileBarChart,
} from "lucide-react";
import { getCurrentlyReadingBooks, updateBook } from "@/actions/library";
import { KitapyurduModal } from "@/components/kitapyurdu-modal";
import { toast } from "sonner";
import { Book, Author } from "@prisma/client";

type BookWithAuthor = Book & { author: Author | null };

// Ana Sayfa
const homeItems = [
  {
    title: "Genel Bakış",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "İstatistikler",
    href: "/stats",
    icon: BarChart3,
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
  {
    title: "Okuma Hedefi",
    href: "/challenges",
    icon: Target,
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
  {
    title: "AI Yorumları",
    href: "/ai-comments",
    icon: Bot,
  },
  {
    title: "İnfografikler",
    href: "/infographics",
    icon: FileBarChart,
  },
];

// İşlemler - Link bazlı
const actionLinkItems = [
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
  const router = useRouter();

  // Progress update state
  const [readingBooks, setReadingBooks] = useState<BookWithAuthor[]>([]);
  const [showSelectBookDialog, setShowSelectBookDialog] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookWithAuthor | null>(null);
  const [progressInput, setProgressInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Kitapyurdu modal state
  const [showKitapyurduModal, setShowKitapyurduModal] = useState(false);

  const handleOpenProgressUpdate = async () => {
    setIsLoading(true);
    const books = await getCurrentlyReadingBooks();
    setReadingBooks(books);
    setIsLoading(false);

    if (books.length === 0) {
      toast.info('Şu an okunan kitap yok');
      return;
    }

    if (books.length === 1) {
      setSelectedBook(books[0]);
      setProgressInput(books[0].currentPage.toString());
      setShowProgressDialog(true);
    } else {
      setShowSelectBookDialog(true);
    }
  };

  const handleSelectBook = (book: BookWithAuthor) => {
    setSelectedBook(book);
    setProgressInput(book.currentPage.toString());
    setShowSelectBookDialog(false);
    setShowProgressDialog(true);
  };

  const handleUpdateProgress = async () => {
    if (!selectedBook) return;

    const page = parseInt(progressInput);
    if (isNaN(page) || page < 0) {
      toast.error('Geçerli bir sayfa numarası girin');
      return;
    }

    if (selectedBook.pageCount && page > selectedBook.pageCount) {
      toast.error(`Sayfa sayısı ${selectedBook.pageCount}'den büyük olamaz`);
      return;
    }

    setIsUpdating(true);
    const result = await updateBook(selectedBook.id, { currentPage: page });

    if (result.success) {
      toast.success('İlerleme güncellendi');
      setShowProgressDialog(false);
      setSelectedBook(null);
      router.refresh();
    } else {
      toast.error('Güncelleme başarısız oldu');
    }
    setIsUpdating(false);
  };

  const progress = selectedBook?.pageCount
    ? Math.round((parseInt(progressInput || '0') / selectedBook.pageCount) * 100)
    : 0;

  return (
    <>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border px-6 py-5">
          <Link href="/dashboard" prefetch={false} className="flex items-center gap-3">
            {/* <Image
              src="/favicon-96x96.png"
              alt="AsyaKitap Logo"
              width={36}
              height={36}
              className="rounded-lg"
            /> */}
            <LogoIcon className="w-9 h-9" />
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
                      <Link href={item.href} prefetch={false}>
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
                      <Link href={item.href} prefetch={false}>
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
                      <Link href={item.href} prefetch={false}>
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
                {/* İlerleme Güncelle - Button */}
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleOpenProgressUpdate} disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <TrendingUp className="h-4 w-4" />
                    )}
                    <span>İlerleme Güncelle</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Kitapyurdu - Button */}
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setShowKitapyurduModal(true)}>
                    <ExternalLink className="h-4 w-4" />
                    <span>Kitapyurdu'ndan Ekle</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Link bazlı işlemler */}
                {actionLinkItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                    >
                      <Link href={item.href} prefetch={false}>
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
                      <Link href={item.href} prefetch={false}>
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

      {/* Select Book Dialog */}
      <Dialog open={showSelectBookDialog} onOpenChange={setShowSelectBookDialog}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Kitap Seç</DialogTitle>
            <DialogDescription>
              Hangi kitabın ilerlemesini güncellemek istiyorsun?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4 overflow-y-auto flex-1">
            {readingBooks.map((book) => (
              <button
                key={book.id}
                onClick={() => handleSelectBook(book)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors text-left"
              >
                <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded bg-muted">
                  {book.coverUrl ? (
                    <Image
                      src={book.coverUrl.replace('http:', 'https:')}
                      alt={book.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{book.title}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {book.author?.name || 'Bilinmiyor'}
                  </p>
                  {book.pageCount && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {book.currentPage} / {book.pageCount} sayfa ({Math.round((book.currentPage / book.pageCount) * 100)}%)
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Progress Update Dialog */}
      <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>İlerleme Güncelle</DialogTitle>
            {selectedBook && (
              <DialogDescription>
                {selectedBook.title}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="py-4 space-y-4">
            {selectedBook && (
              <>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={progressInput}
                    onChange={(e) => setProgressInput(e.target.value)}
                    min={0}
                    max={selectedBook.pageCount || undefined}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">
                    / {selectedBook.pageCount || '?'} sayfa
                  </span>
                </div>
                {selectedBook.pageCount && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">İlerleme</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowProgressDialog(false)}>
              Vazgeç
            </Button>
            <Button onClick={handleUpdateProgress} disabled={isUpdating}>
              {isUpdating ? 'Güncelleniyor...' : 'Güncelle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kitapyurdu Modal */}
      <KitapyurduModal
        open={showKitapyurduModal}
        onOpenChange={setShowKitapyurduModal}
      />
    </>
  );
}
