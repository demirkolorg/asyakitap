'use client';

import { useState, useEffect } from 'react';
import { LogOut, Settings, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export function UserNavMenu() {
  const router = useRouter();
  const supabase = createClient();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    setMounted(true);

    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // Get user info from metadata
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name;
  const email = user?.email;
  const initials = fullName
    ? fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : email?.charAt(0).toUpperCase() || 'U';

  if (!mounted) {
    return (
      <Button variant="ghost" className="relative h-8 w-8 rounded-full" disabled>
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            {avatarUrl && (
              <AvatarImage src={avatarUrl} alt={fullName || 'Profil'} />
            )}
            <AvatarFallback>
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            {fullName && (
              <p className="text-sm font-medium leading-none">{fullName}</p>
            )}
            {email && (
              <p className="text-xs leading-none text-muted-foreground">{email}</p>
            )}
            {!fullName && !email && (
              <p className="text-sm font-medium leading-none">Hesabım</p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Ayarlar</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Çıkış Yap</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
