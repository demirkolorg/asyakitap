'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { BookOpen, PlusCircle, TrendingUp, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserNavMenu } from '@/components/layout/user-nav-menu';
import { GlobalSearch } from '@/components/global-search';
import { KitapyurduModal } from '@/components/kitapyurdu-modal';
import { GoodreadsModal } from '@/components/goodreads-modal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getCurrentlyReadingBooks, updateBook } from '@/actions/library';
import { toast } from 'sonner';
import { Book, Author } from '@prisma/client';

type BookWithAuthor = Book & { author: Author | null };

export function DashboardHeader() {
  const router = useRouter();
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === 'collapsed' && !isMobile;

  const [readingBooks, setReadingBooks] = useState<BookWithAuthor[]>([]);
  const [showSelectBookDialog, setShowSelectBookDialog] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [showKitapyurduModal, setShowKitapyurduModal] = useState(false);
  const [showGoodreadsModal, setShowGoodreadsModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookWithAuthor | null>(null);
  const [progressInput, setProgressInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      // Tek kitap varsa direkt ilerleme modalını aç
      setSelectedBook(books[0]);
      setProgressInput(books[0].currentPage.toString());
      setShowProgressDialog(true);
    } else {
      // Birden fazla kitap varsa önce seçim modalını aç
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
      <header className="flex h-14 shrink-0 items-center border-b bg-background px-2 sm:px-4 gap-2">
        {/* Left - Sidebar Toggle + Logo (when collapsed) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <SidebarTrigger className="shrink-0" />

          {/* Logo and brand - only show when sidebar is collapsed */}
          {isCollapsed && (
            <>
              <Separator orientation="vertical" className="h-4 hidden sm:block" />
              <Link href="/dashboard" className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                <span className="font-semibold text-sm text-primary hidden sm:inline">
                  AsyaKitap
                </span>
              </Link>
            </>
          )}
        </div>

        {/* Center - Global Search */}
        <div className="flex-1 flex justify-center min-w-0 px-1 sm:px-4">
          <GlobalSearch />
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Progress Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenProgressUpdate}
            disabled={isLoading}
            className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <TrendingUp className="h-4 w-4" />
            )}
            <span className="hidden sm:inline sm:ml-2">İlerleme</span>
          </Button>

          {/* Kitapyurdu - Hidden on mobile */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowKitapyurduModal(true)}
            className="hidden md:flex text-orange-600 border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-950"
          >
            <ExternalLink className="h-4 w-4 md:mr-2" />
            <span className="hidden lg:inline">Kitapyurdu</span>
          </Button>

          {/* Goodreads - Hidden on mobile */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowGoodreadsModal(true)}
            className="hidden md:flex text-amber-600 border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-950"
          >
            <ExternalLink className="h-4 w-4 md:mr-2" />
            <span className="hidden lg:inline">Goodreads</span>
          </Button>

          {/* Add Book - Icon only on mobile */}
          <Button asChild size="sm" variant="outline" className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3">
            <Link href="/library/add">
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline sm:ml-2">Ekle</span>
            </Link>
          </Button>

          <ThemeToggle />
          <UserNavMenu />
        </div>
      </header>

      {/* Select Book Dialog */}
      <Dialog open={showSelectBookDialog} onOpenChange={setShowSelectBookDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kitap Seç</DialogTitle>
            <DialogDescription>
              Hangi kitabın ilerlemesini güncellemek istiyorsun?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4 max-h-[400px] overflow-y-auto">
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
          <DialogFooter>
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

      {/* Goodreads Modal */}
      <GoodreadsModal
        open={showGoodreadsModal}
        onOpenChange={setShowGoodreadsModal}
      />
    </>
  );
}
