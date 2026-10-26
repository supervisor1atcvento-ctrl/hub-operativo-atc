import React from 'react';
import { Citation } from '../types.ts';
import { X, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';

interface Props {
  citation: Citation | null;
  onClose: () => void;
}

export const CitationModal: React.FC<Props> = ({ citation, onClose }) => {
  if (!citation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Fuente Documental Autorizada
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verificación de procedencia de la respuesta de Vicente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Título del Documento
            </span>
            <p className="text-base font-medium text-slate-900 dark:text-slate-100 mt-0.5">
              {citation.documentTitle}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400">Categoría</span>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {citation.categorySlug}
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400">Relevancia RAG</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {citation.relevanceScore} pts
                </span>
              </div>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Fragmento Recuperado (Chunk)
            </span>
            <div className="mt-1.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {citation.excerpt}
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              Este fragmento fue recuperado desde el repositorio confidencial interno previa validación de permisos de usuario.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
