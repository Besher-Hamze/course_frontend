'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { 
  BookOpen, 
  Users, 
  FileText, 
  Video, 
  UserPlus, 
  LayoutDashboard,
  Menu,
  X
} from 'lucide-react';

const navItems = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Courses',
    href: '/admin/courses',
    icon: BookOpen,
  },
  {
    title: 'Students',
    href: '/admin/students',
    icon: Users,
  },
  {
    title: 'Enrollments',
    href: '/admin/enrollments',
    icon: UserPlus,
  },
  {
    title: 'Files',
    href: '/admin/files',
    icon: FileText,
  },
  {
    title: 'Videos',
    href: '/admin/videos',
    icon: Video,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="fixed top-4 left-4 z-40 md:hidden bg-white rounded-md p-2 shadow-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 text-white transition-transform duration-300 transform md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>

          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-800 hover:text-white',
                      pathname === item.href || pathname?.startsWith(`${item.href}/`)
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300'
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <item.icon size={20} />
                    <span>{item.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 border-t border-gray-800">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} Educational Platform
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
