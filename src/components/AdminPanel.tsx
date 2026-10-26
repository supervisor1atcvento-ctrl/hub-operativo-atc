import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import {
  AuditLog,
  Category,
  KnowledgeDocument,
  SystemConfig,
  User
} from '../types.ts';
import {
  X,
  FileText,
  FileSpreadsheet,
  Presentation,
  Layers,
  Users,
  ShieldAlert,
  Settings,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Database,
  Search,
  Upload,
  UploadCloud,
  Eye,
  CheckSquare,
  Square
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onRefreshCategories: () => void;
}

export const AdminPanel: React.FC<Props> = ({
  isOpen,
  onClose,
  categories,
  onRefreshCategories
}) => {
  const [activeTab, setActiveTab] = useState<'docs' | 'cats' | 'users' | 'audit' | 'config'>('docs');
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Document Upload State
  const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<KnowledgeDocument | null>(null);

  // New Document Text Form State
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCategory, setNewDocCategory] = useState('');
  const [newDocFilename, setNewDocFilename] = useState('');
  const [newDocContent, setNewDocContent] = useState('');

  // New Category Form State
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // New User Form State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'agent' | 'user'>('user');
  const [newUserCategories, setNewUserCategories] = useState<string[]>([]);

  // Config Form State
  const [cfgName, setCfgName] = useState('');
  const [cfgEmptyMsg, setCfgEmptyMsg] = useState('');
  const [cfgRateLimit, setCfgRateLimit] = useState(60);
  const [cfgRetention, setCfgRetention] = useState(90);

  useEffect(() => {
    if (isOpen) {
      loadTabData();
    }
  }, [isOpen, activeTab]);

  const loadTabData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'docs') {
        const docs = await api.getAdminDocuments();
        setDocuments(docs);
        if (categories.length > 0 && !newDocCategory) {
          setNewDocCategory(categories[0].id);
        }
      } else if (activeTab === 'users') {
        const users = await api.getAdminUsers();
        setUsersList(users);
      } else if (activeTab === 'audit') {
        const logs = await api.getAdminAuditLogs(100);
        setAuditLogs(logs);
      } else if (activeTab === 'config') {
        const cfg = await api.getAdminConfig();
        setConfig(cfg);
        setCfgName(cfg.assistantName);
        setCfgEmptyMsg(cfg.emptyResultMessage);
        setCfgRateLimit(cfg.maxRequestsPerMinute);
        setCfgRetention(cfg.retentionDays);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al cargar datos.' });
    } finally {
      setLoading(false);
    }
  };

  const getFileBadge = (filename: string, fileType?: string) => {
    const ext = (filename.split('.').pop() || '').toLowerCase();
    if (ext === 'pdf' || fileType?.includes('pdf')) {
      return {
        label: 'PDF',
        bg: 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-900',
        icon: FileText
      };
    }
    if (['xlsx', 'xls', 'csv'].includes(ext) || fileType?.includes('sheet') || fileType?.includes('excel')) {
      return {
        label: 'EXCEL',
        bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
        icon: FileSpreadsheet
      };
    }
    if (['pptx', 'ppt'].includes(ext) || fileType?.includes('presentation') || fileType?.includes('powerpoint')) {
      return {
        label: 'POWERPOINT',
        bg: 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-900',
        icon: Presentation
      };
    }
    if (['docx', 'doc'].includes(ext) || fileType?.includes('word')) {
      return {
        label: 'WORD',
        bg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900',
        icon: FileText
      };
    }
    return {
      label: 'TEXTO',
      bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      icon: FileText
    };
  };

  if (!isOpen) return null;

  // Handler for uploading PDF, PowerPoint, Excel, Word files
  const handleUploadBinaryFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Por favor seleccione un archivo (PDF, PowerPoint, Excel o Word).' });
      return;
    }
    if (!newDocCategory) {
      setMessage({ type: 'error', text: 'Debe seleccionar una categoría para asociar el documento.' });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      const res = await api.uploadAdminFile(
        selectedFile,
        newDocCategory,
        fileTitle.trim() || undefined
      );

      setMessage({
        type: 'success',
        text: `¡Archivo "${res.title}" indexado exitosamente! (${res.chunksCount} fragmentos RAG generados)`
      });
      setSelectedFile(null);
      setFileTitle('');
      loadTabData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al procesar el archivo.' });
    } finally {
      setLoading(false);
    }
  };

  // Handler for Manual Text Documents
  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim() || !newDocContent.trim() || !newDocCategory) {
      setMessage({ type: 'error', text: 'Por favor complete título, categoría y contenido.' });
      return;
    }

    try {
      setLoading(true);
      await api.createAdminDocument({
        categoryId: newDocCategory,
        title: newDocTitle.trim(),
        filename: newDocFilename.trim() || undefined,
        rawContent: newDocContent.trim()
      });

      setMessage({ type: 'success', text: 'Documento indexado exitosamente en fragmentos RAG.' });
      setNewDocTitle('');
      setNewDocFilename('');
      setNewDocContent('');
      loadTabData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al guardar documento.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('¿Confirma que desea eliminar este documento y todos sus fragmentos?')) return;
    try {
      setLoading(true);
      await api.deleteAdminDocument(id);
      setMessage({ type: 'success', text: 'Documento eliminado.' });
      loadTabData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al eliminar documento.' });
    } finally {
      setLoading(false);
    }
  };

  // Handlers for Categories
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatSlug.trim() || !newCatName.trim()) {
      setMessage({ type: 'error', text: 'Slug y Nombre son obligatorios.' });
      return;
    }

    try {
      setLoading(true);
      await api.createAdminCategory({
        slug: newCatSlug.trim(),
        name: newCatName.trim(),
        description: newCatDesc.trim()
      });
      setMessage({ type: 'success', text: 'Categoría creada exitosamente.' });
      setNewCatSlug('');
      setNewCatName('');
      setNewCatDesc('');
      onRefreshCategories();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al crear categoría.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('¿Eliminar esta categoría y sus documentos asociados?')) return;
    try {
      setLoading(true);
      await api.deleteAdminCategory(id);
      setMessage({ type: 'success', text: 'Categoría eliminada.' });
      onRefreshCategories();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al eliminar categoría.' });
    } finally {
      setLoading(false);
    }
  };

  // Handlers for Users
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword || !newName.trim()) {
      setMessage({ type: 'error', text: 'Complete los datos obligatorios del usuario.' });
      return;
    }

    try {
      setLoading(true);
      await api.createAdminUser({
        username: newUsername.trim(),
        password: newPassword,
        name: newName.trim(),
        role: newRole,
        allowedCategories: newRole === 'admin' ? categories.map((c) => c.slug) : newUserCategories
      });
      setMessage({ type: 'success', text: 'Usuario creado exitosamente.' });
      setNewUsername('');
      setNewPassword('');
      setNewName('');
      setNewUserCategories([]);
      loadTabData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al crear usuario.' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserCategory = (catSlug: string) => {
    setNewUserCategories((prev) =>
      prev.includes(catSlug) ? prev.filter((c) => c !== catSlug) : [...prev, catSlug]
    );
  };

  // Handlers for System Config
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.updateAdminConfig({
        assistantName: cfgName.trim(),
        emptyResultMessage: cfgEmptyMsg.trim(),
        maxRequestsPerMinute: Number(cfgRateLimit),
        retentionDays: Number(cfgRetention)
      });
      setMessage({ type: 'success', text: 'Configuración RAG actualizada con éxito.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al actualizar configuración.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetDemo = async () => {
    if (!confirm('¿Restaurar la base de conocimiento y los usuarios al estado original de demostración?')) return;
    try {
      setLoading(true);
      await api.resetDemoData();
      setMessage({ type: 'success', text: 'Estado de demostración restaurado correctamente.' });
      onRefreshCategories();
      loadTabData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al reiniciar datos.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/75 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl h-[88vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-600 text-white rounded-2xl shadow-md shadow-purple-500/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Panel de Administración Vicente
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Acceso Restringido (Admin)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gestión de documentos RAG, categorías, usuarios, políticas y auditoría de seguridad
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
          {[
            { id: 'docs', label: 'Documentos RAG', icon: FileText },
            { id: 'cats', label: 'Categorías', icon: Layers },
            { id: 'users', label: 'Usuarios y Permisos', icon: Users },
            { id: 'audit', label: 'Auditoría y Ciberseguridad', icon: ShieldAlert },
            { id: 'config', label: 'Configuración RAG', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setMessage(null);
                }}
                className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Global Notice message */}
        {message && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl text-xs flex items-center justify-between ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: DOCUMENTS */}
          {activeTab === 'docs' && (
            <div className="space-y-6">
              {/* Upload Controls & Mode Switcher */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <UploadCloud className="w-4 h-4 text-purple-600" />
                      Indexación de Documentos RAG
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cargue archivos para extraer su texto, fragmentarlos en chunks y agregarlos a la base autorizada
                    </p>
                  </div>

                  {/* Mode switcher */}
                  <div className="flex items-center p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setUploadMode('file')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        uploadMode === 'file'
                          ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Cargar Archivo (PDF / PPT / XLS)
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMode('text')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        uploadMode === 'text'
                          ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Texto Manual
                    </button>
                  </div>
                </div>

                {/* FORMAT BADGES */}
                <div className="flex flex-wrap items-center gap-2 py-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Formatos soportados:
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-900 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> PDF (.pdf)
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 flex items-center gap-1">
                    <FileSpreadsheet className="w-3 h-3" /> Excel (.xlsx, .xls, .csv)
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 border border-orange-200 dark:border-orange-900 flex items-center gap-1">
                    <Presentation className="w-3 h-3" /> PowerPoint (.pptx)
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-900 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Word & Docs (.docx, .txt, .md)
                  </span>
                </div>

                {uploadMode === 'file' ? (
                  /* FILE UPLOAD FORM */
                  <form onSubmit={handleUploadBinaryFile} className="space-y-4">
                    {/* Drag & Drop Zone */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          setSelectedFile(file);
                          setFileTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
                        }
                      }}
                      className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                        isDragging
                          ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20'
                          : selectedFile
                          ? 'border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20'
                          : 'border-slate-300 dark:border-slate-700 hover:border-purple-400 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <input
                        type="file"
                        id="rag-file-input"
                        accept=".pdf,.pptx,.ppt,.xlsx,.xls,.csv,.docx,.doc,.txt,.md"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSelectedFile(file);
                            setFileTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
                          }
                        }}
                        className="hidden"
                      />

                      {selectedFile ? (
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 rounded-2xl">
                            {getFileBadge(selectedFile.name).icon === FileSpreadsheet ? (
                              <FileSpreadsheet className="w-8 h-8" />
                            ) : getFileBadge(selectedFile.name).icon === Presentation ? (
                              <Presentation className="w-8 h-8" />
                            ) : (
                              <FileText className="w-8 h-8" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {Math.round(selectedFile.size / 1024)} KB • Listo para procesar
                            </p>
                          </div>
                          <label
                            htmlFor="rag-file-input"
                            className="text-xs font-semibold text-purple-600 hover:underline cursor-pointer pt-1"
                          >
                            Seleccionar otro archivo
                          </label>
                        </div>
                      ) : (
                        <label
                          htmlFor="rag-file-input"
                          className="flex flex-col items-center justify-center cursor-pointer space-y-2"
                        >
                          <div className="p-3 bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 rounded-2xl">
                            <UploadCloud className="w-7 h-7" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              Arrastra tu archivo aquí o haz clic para explorar
                            </span>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Archivos PDF, presentaciones PowerPoint (.pptx), hojas de cálculo Excel (.xlsx, .xls) o Word (.docx)
                            </p>
                          </div>
                        </label>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Título en la Base de Conocimiento
                        </label>
                        <input
                          type="text"
                          value={fileTitle}
                          onChange={(e) => setFileTitle(e.target.value)}
                          placeholder="Nombre del documento oficial..."
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Categoría a la que pertenece *
                        </label>
                        <select
                          value={newDocCategory}
                          onChange={(e) => setNewDocCategory(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.slug})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-1">
                      {selectedFile && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            setFileTitle('');
                          }}
                          className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 rounded-xl"
                        >
                          Cancelar
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={loading || !selectedFile}
                        className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-purple-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
                      >
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        <span>Procesar, Fragmentar e Indexar Archivo</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  /* MANUAL TEXT FORM */
                  <form onSubmit={handleCreateDocument} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Título del Documento *
                        </label>
                        <input
                          type="text"
                          value={newDocTitle}
                          onChange={(e) => setNewDocTitle(e.target.value)}
                          placeholder="Ej: Manual de Garantías Especiales 2026"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Categoría Asociada *
                        </label>
                        <select
                          value={newDocCategory}
                          onChange={(e) => setNewDocCategory(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.slug})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Nombre de archivo (opcional)
                      </label>
                      <input
                        type="text"
                        value={newDocFilename}
                        onChange={(e) => setNewDocFilename(e.target.value)}
                        placeholder="manual_garantias.txt"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Contenido Texto para Fragmentación RAG *
                      </label>
                      <textarea
                        value={newDocContent}
                        onChange={(e) => setNewDocContent(e.target.value)}
                        rows={5}
                        placeholder="Pegue aquí el texto oficial del documento interno o política..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono leading-relaxed"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Indexar Texto Manual en RAG</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Document List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Documentos Oficiales Indexados ({documents.length})
                  </h3>
                  <span className="text-xs text-slate-400">
                    Total fragmentos: {documents.reduce((acc, d) => acc + (d.chunksCount || 0), 0)} chunks
                  </span>
                </div>

                <div className="space-y-2">
                  {documents.map((doc) => {
                    const cat = categories.find((c) => c.id === doc.categoryId);
                    const badge = getFileBadge(doc.filename, doc.fileType);
                    const IconComponent = badge.icon;

                    return (
                      <div
                        key={doc.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-start gap-3 truncate">
                          <div className={`p-2 rounded-xl border shrink-0 ${badge.bg}`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {doc.title}
                              </h4>
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${badge.bg}`}>
                                {badge.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                              <span className="font-semibold text-blue-600 dark:text-blue-400">
                                {cat?.name || 'Categoría Desconocida'}
                              </span>
                              <span>•</span>
                              <span className="font-mono">{doc.filename}</span>
                              <span>•</span>
                              <span>{doc.chunksCount} fragmentos</span>
                              <span>•</span>
                              <span>{Math.round(doc.fileSize / 1024) || 1} KB</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Ver texto extraído y fragmentación"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Eliminar documento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CATEGORIES */}
          {activeTab === 'cats' && (
            <div className="space-y-6">
              {/* Add category form */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-purple-600" />
                  Nueva Categoría de Conocimiento
                </h3>

                <form onSubmit={handleCreateCategory} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Slug (Identificador único en minúsculas) *
                      </label>
                      <input
                        type="text"
                        value={newCatSlug}
                        onChange={(e) => setNewCatSlug(e.target.value)}
                        placeholder="ej: sucursales_norte"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Nombre Visible *
                      </label>
                      <input
                        type="text"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="Ej: Sucursales Norte"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Descripción de la Categoría
                    </label>
                    <input
                      type="text"
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      placeholder="Propósito y alcance de esta base documental"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Guardar Categoría</span>
                  </button>
                </form>
              </div>

              {/* List Categories */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                  Categorías Registradas ({categories.length})
                </h3>
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {cat.name}
                        </span>
                        <code className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono">
                          {cat.slug}
                        </code>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{cat.description}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Eliminar categoría"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: USERS & PERMISSIONS */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Form Add User */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-purple-600" />
                  Registrar Nuevo Usuario y Asignar Categorías Autorizadas
                </h3>

                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Nombre de Usuario *
                      </label>
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="ej: juan.perez"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Juan Pérez"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Contraseña *
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Rol de Acceso *
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="w-full sm:w-64 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                      <option value="user">Usuario Estándar (Acceso restringido a categorías seleccionadas)</option>
                      <option value="agent">Agente de Soporte (Consultas avanzadas)</option>
                      <option value="admin">Administrador General (Control total de RAG y usuarios)</option>
                    </select>
                  </div>

                  {newRole !== 'admin' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Categorías de Consulta Autorizadas para este Usuario:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {categories.map((c) => {
                          const isChecked = newUserCategories.includes(c.slug);
                          return (
                            <button
                              type="button"
                              key={c.slug}
                              onClick={() => handleToggleUserCategory(c.slug)}
                              className={`p-2 rounded-xl text-left text-xs border flex items-center gap-2 transition-all ${
                                isChecked
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                              <span className="truncate">{c.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Crear Usuario</span>
                  </button>
                </form>
              </div>

              {/* Users list */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                  Usuarios Registrados ({usersList.length})
                </h3>
                {usersList.map((usr) => (
                  <div
                    key={usr.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {usr.name}
                        </span>
                        <code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">
                          @{usr.username}
                        </code>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            usr.role === 'admin'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                              : usr.role === 'agent'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {usr.role.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-1 items-center">
                        <span>Categorías autorizadas:</span>
                        {usr.role === 'admin' ? (
                          <span className="font-semibold text-emerald-600">Todas (Wildcard)</span>
                        ) : usr.allowedCategories.length > 0 ? (
                          usr.allowedCategories.map((slug) => (
                            <span key={slug} className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                              {slug}
                            </span>
                          ))
                        ) : (
                          <span className="text-red-500 font-semibold">Ninguna</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Registro de Auditoría y Eventos de Ciberseguridad
                  </h3>
                  <p className="text-xs text-slate-500">
                    Historial de intentos de consulta, verificaciones de acceso y bloqueos de seguridad
                  </p>
                </div>
                <button
                  onClick={loadTabData}
                  className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl font-medium transition-colors cursor-pointer"
                >
                  Actualizar
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-500">
                    <tr>
                      <th className="p-3">Fecha / Hora</th>
                      <th className="p-3">Usuario</th>
                      <th className="p-3">Acción</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3">IP</th>
                      <th className="p-3">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-950 font-mono text-[11px]">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                        <td className="p-3 text-slate-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                          {log.username}
                        </td>
                        <td className="p-3 font-semibold text-purple-600 dark:text-purple-400">
                          {log.action}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              log.status === 'SUCCESS'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : log.status === 'FORBIDDEN'
                                ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                : log.status === 'RATE_LIMITED'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{log.ip}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-300 font-sans max-w-xs truncate">
                          {log.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: SYSTEM CONFIG */}
          {activeTab === 'config' && (
            <div className="max-w-2xl space-y-6">
              <form onSubmit={handleSaveConfig} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre del Asistente
                  </label>
                  <input
                    type="text"
                    value={cfgName}
                    onChange={(e) => setCfgName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mensaje Obligatorio Cuando No Hay Respaldo Documental
                  </label>
                  <textarea
                    rows={2}
                    value={cfgEmptyMsg}
                    onChange={(e) => setCfgEmptyMsg(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Este mensaje se devuelve exactamente cuando los documentos no contienen la respuesta, evitando cualquier alucinación.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Límite de Consultas (Rate Limit por IP/min)
                    </label>
                    <input
                      type="number"
                      value={cfgRateLimit}
                      onChange={(e) => setCfgRateLimit(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Retención de Conversaciones (Días)
                    </label>
                    <input
                      type="number"
                      value={cfgRetention}
                      onChange={(e) => setCfgRetention(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  Guardar Configuración RAG
                </button>
              </form>

              <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2">
                  Acciones de Mantenimiento y Demostración
                </h4>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleResetDemo}
                    disabled={loading}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
                    <span>Restaurar Base de Conocimiento a Estado Demo</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Extracted Document Text Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 rounded-xl">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {previewDoc.title}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {previewDoc.filename} • {previewDoc.chunksCount} fragmentos indexados en RAG
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 rounded-xl text-xs text-purple-800 dark:text-purple-300 flex items-center justify-between">
                <span>Texto extraído y estructurado para la búsqueda de Vicente</span>
                <span className="font-mono text-[10.5px]">
                  {Math.round((previewDoc.fileSize || 0) / 1024)} KB
                </span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap max-h-[50vh] overflow-y-auto">
                {previewDoc.rawContent || 'Sin contenido registrado.'}
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 transition-colors"
              >
                Cerrar Vista Previa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
