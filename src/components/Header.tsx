import React from 'react';
import { Category, User } from '../types.ts';
import {
  Sparkles,
  Shield,
  ShieldCheck,
  ChevronDown,
  Settings,
  LogOut,
  User as UserIcon,
  Layers,
  Menu
} from 'lucide-react';

interface Props {
  user: User | null;
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
  onOpenAdmin: () => void;
  onResetSession?: () => void;
  onToggleSidebar: () => void;
}

export const Header: React.FC<Props> = ({
  user,
  categories,
  selectedCategory,
  onSelectCategory,
  onOpenAdmin,
  onResetSession,
  onToggleSidebar
}) => {
  return (
    <header className="h-16 px-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile Menu & Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors lg:hidden"
          title="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight">
                Vicente
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Base de Datos • Sin IA
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Atención determinista basada en fuentes internas autorizadas
            </p>
          </div>
        </div>
      </div>

      {/* Center: Authorized Category Selector */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            <Layers className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="text-slate-500 dark:text-slate-400 hidden md:inline">Alcance de búsqueda:</span>
            <select
              value={selectedCategory}
              onChange={(e) => onSelectCategory(e.target.value)}
              className="bg-transparent font-semibold text-slate-900 dark:text-white focus:outline-hidden cursor-pointer"
            >
              <option value="all" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900">
                🌐 Todas las categorías (Global)
              </option>
              {categories.map((cat) => (
                <option key={cat.slug} value={cat.slug} className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900">
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Right: Actions & Admin Panel */}
      <div className="flex items-center gap-2">
        {user?.role === 'admin' && (
          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors shadow-xs"
            title="Administración de RAG, Documentos y Usuarios"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Panel Documentos</span>
          </button>
        )}

        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs">
            <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              V
            </div>
            <div className="hidden md:block text-left">
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">Acceso Público</span>
              <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Búsqueda Abierta</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
