'use client';

import { Video, Sparkles, FolderOpen } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-border bg-bg-primary/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <Video className="w-8 h-8 text-brand-blue group-hover:text-brand-glow transition-colors" />
            <Sparkles className="w-3 h-3 text-brand-neon absolute -top-1 -right-1" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-lg text-text-primary leading-none">
              VideoAI <span className="text-gradient">Editor</span>
            </h1>
            <p className="text-[10px] text-text-secondary leading-none mt-0.5">
              Edição inteligente com IA
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/projects"
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
            Meus Projetos
          </Link>
        </nav>
      </div>
    </header>
  );
}
