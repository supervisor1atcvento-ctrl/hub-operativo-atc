import React, { useState } from 'react';
import { api } from '../api.ts';
import { User } from '../types.ts';
import { Shield, Lock, UserCheck, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onSuccess: (user: User) => void;
  onClose?: () => void;
}

const DEMO_PERSONAS = [
  {
    username: 'admin',
    password: 'admin123',
    roleLabel: 'Administrador General',
    name: 'Ing. Carlos Mendoza',
    color: 'border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300',
    badge: 'Acceso Total (6 Categorías) + Panel Admin',
    desc: 'Supervisa todas las categorías, gestiona documentos y usuarios'
  },
  {
    username: 'agente.soporte',
    password: 'agente123',
    roleLabel: 'Agente Soporte & Garantías',
    name: 'Lic. Laura Rivas',
    color: 'border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300',
    badge: 'Garantías • Diagnóstico • Clientes',
    desc: 'Atiende pólizas, fallas técnicas y trámites de clientes'
  },
  {
    username: 'logistica.cedis',
    password: 'cedis123',
    roleLabel: 'Operador Logística',
    name: 'Roberto Gómez',
    color: 'border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300',
    badge: 'CEDIS • Tiendas y Agencias',
    desc: 'Gestiona citas de descarga, tarimas y sucursales'
  },
  {
    username: 'cliente.consulta',
    password: 'cliente123',
    roleLabel: 'Atención al Cliente',
    name: 'María Fernanda Cruz',
    color: 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300',
    badge: 'Atención al Cliente • Información',
    desc: 'Consultas sobre facturación CFDI 4.0, devoluciones y contacto'
  }
];

export const LoginModal: React.FC<Props> = ({ isOpen, onSuccess, onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Por favor complete todos los campos.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.login(username.trim(), password);
      onSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemoPersona = async (demo: (typeof DEMO_PERSONAS)[0]) => {
    try {
      setLoading(true);
      setError(null);
      setUsername(demo.username);
      setPassword(demo.password);
      const res = await api.login(demo.username, demo.password);
      onSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Error al autenticar usuario de prueba.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 px-8 py-6 text-white text-center relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="inline-flex items-center justify-center p-3 bg-white/15 backdrop-blur-md rounded-2xl mb-3 shadow-inner">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Acceso a Vicente</h2>
          <p className="text-blue-100 text-sm mt-1">
            Asistente Virtual RAG con Autenticación & Aislamiento por Roles
          </p>
        </div>

        <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-red-700 dark:text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick 1-Click Demo Accounts */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Selección Rápida de Perfil (1-Click)
              </span>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                Demostración RAG
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DEMO_PERSONAS.map((demo) => (
                <button
                  key={demo.username}
                  type="button"
                  onClick={() => handleSelectDemoPersona(demo)}
                  disabled={loading}
                  className={`p-3.5 text-left rounded-2xl border transition-all text-xs flex flex-col justify-between hover:shadow-md hover:scale-[1.01] active:scale-[0.99] ${demo.color}`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {demo.name}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                    </div>
                    <span className="text-[11px] opacity-80 block mt-0.5">
                      {demo.roleLabel}
                    </span>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/5">
                    <span className="font-semibold block text-[10.5px]">
                      {demo.badge}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="shrink mx-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              O ingresar credenciales
            </span>
            <div className="grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          {/* Manual Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Usuario
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ej: admin, agente.soporte"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-shadow"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-shadow"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Iniciar Sesión en Vicente</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
