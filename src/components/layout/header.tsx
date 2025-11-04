'use client';

import React from 'react';
import { LogOut, Bell, User } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '../ui/button';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-white px-4 md:px-6">
      <div className="flex flex-1 items-center md:gap-4">
        <div className="ml-auto flex items-center gap-4">
          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                <User className="h-5 w-5" />
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-medium">{user?.fullName}</div>
                <div className="text-xs text-gray-500">{user?.role}</div>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-red-500"
            onClick={logout}
          >
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Log out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

