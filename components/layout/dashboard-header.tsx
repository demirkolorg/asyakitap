'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { BookOpen, PlusCircle, TrendingUp, Loader2, ExternalLink, Menu } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
      <header className="flex h-14 shrink-0 items-center border-b bg-background px-3 md:px-4 gap-2">
        {/* Left - Logo (when collapsed) + Sidebar Toggle */}
        <div className="flex items-center gap-2 md:gap-3">
          {isCollapsed && (
            <>
              <Link href="/dashboard" className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 md:h-7 md:w-7 text-primary" />
                <span className="font-semibold text-sm text-primary hidden sm:inline">
                  AsyaKitap
                </span>
              </Link>
              <Separator orientation="vertical" className="h-4 hidden sm:block" />
            </>
          )}

          <SidebarTrigger className="-ml-1" />

          {!isCollapsed && (
            <Separator orientation="vertical" className="h-4 hidden sm:block" />
          )}
        </div>

        {/* Center - Global Search */}
        <div className="flex-1 flex justify-center px-2 md:px-4">
          <GlobalSearch />
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Desktop buttons */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleOpenProgressUpdate}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <TrendingUp className="mr-2 h-4 w-4" />
              )}
              <span className="hidden lg:inline">İlerleme</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowKitapyurduModal(true)}
              className="text-orange-600 border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-950"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              <span className="hidden lg:inline">Kitapyurdu</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowGoodreadsModal(true)}
              className="text-amber-600 border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-950"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              <span className="hidden lg:inline">Goodreads</span>
            </Button>

            <Button asChild size="sm">
              <Link href="/library/add">
                <PlusCircle className="mr-2 h-4 w-4" />
                <span className="hidden lg:inline">Kitap Ekle</span>
              </Link>
            </Button>
          </div>

          {/* Mobile dropdown menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleOpenProgressUpdate} disabled={isLoading}>
                <TrendingUp className="mr-2 h-4 w-4" />
                İlerleme Güncelle
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowKitapyurduModal(true)}>
                <ExternalLink className="mr-2 h-4 w-4 text-orange-600" />
                Kitapyurdu'ndan Ekle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowGoodreadsModal(true)}>
                <ExternalLink className="mr-2 h-4 w-4 text-amber-600" />
                Goodreads'ten Ekle
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/library/add">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Manuel Kitap Ekle
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle />
          <UserNavMenu />
        </div>
      </header>

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

      {/* Goodreads Modal */}
      <GoodreadsModal
        open={showGoodreadsModal}
        onOpenChange={setShowGoodreadsModal}
      />
    </>
  );
}
