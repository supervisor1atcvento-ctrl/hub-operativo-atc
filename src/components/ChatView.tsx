import React, { useState, useRef, useEffect } from 'react';
import { Category, ChatMessage, Citation } from '../types.ts';
import {
  Send,
  Sparkles,
  User,
  ShieldCheck,
  FileText,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BookOpen
} from 'lucide-react';

interface Props {
  messages: ChatMessage[];
  currentCategory: Category | undefined;
  isLoading: boolean;
  onSendMessage: (query: string) => void;
  onOpenCitation: (citation: Citation) => void;
  error: string | null;
}

const SAMPLE_QUESTIONS_BY_CATEGORY: Record<string, string[]> = {
  tiendas_agencias: [
    '¿Cuáles son los horarios de atención en sucursal Centro (CDMX)?',
    '¿Qué requisitos debe presentar un tercero para recoger un pedido en mostrador?',
    '¿Cuál es el teléfono y dirección de la sucursal Norte en Monterrey?',
    '¿En qué sucursales cuentan con taller de diagnóstico rápido?'
  ],
  garantias: [
    '¿Cuál es el plazo de garantía para componentes electrónicos y chasis?',
    '¿Qué requisitos y formatos necesito presentar para tramitar una garantía?',
    '¿Cuáles son las causas expresas de pérdida de garantía?',
    '¿Cuál es el tiempo máximo de resolución (SLA) para un diagnóstico?'
  ],
  cedis: [
    '¿Cuál es el horario y requisitos de cita para descarga de proveedores en CEDIS?',
    '¿Qué especificaciones deben tener las tarimas y el emplaye?',
    '¿Dónde se ubica el CEDIS Central San Martín Obispo?',
    '¿Cuál es la tolerancia máxima de llegada antes de cancelar una cita de andén?'
  ],
  diagnostico: [
    '¿Qué significa el código de error E01 y cuál es el procedimiento de revisión?',
    '¿Cómo diagnostico una falla por sobrecalentamiento E02?',
    '¿Cuál es el procedimiento para el código E08 de memoria EEPROM?',
    '¿Cuáles son las medidas de seguridad eléctrica antes de abrir el gabinete?'
  ],
  informacion: [
    '¿Cuál es el conmutador central y los horarios de atención telefónica?',
    '¿A qué correo puedo escribir para solicitar soporte técnico?',
    '¿Cómo ejerzo mis derechos ARCO para protección de datos personales?',
    '¿Cuál es la misión y propósito corporativo de Vicente Soluciones?'
  ],
  cliente: [
    '¿Cuál es el plazo máximo para solicitar factura electrónica CFDI 4.0?',
    '¿Qué requisitos fiscales del SAT se solicitan para facturar?',
    '¿Cuál es la política y plazo para devoluciones por arrepentimiento de compra?',
    '¿En cuánto tiempo se refleja el reembolso en cuenta bancaria?'
  ]
};

export const ChatView: React.FC<Props> = ({
  messages,
  currentCategory,
  isLoading,
  onSendMessage,
  onOpenCitation,
  error
}) => {
  const [input, setInput] = useState('');
  const [expandedCitations, setExpandedCitations] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const toggleCitations = (messageId: string) => {
    setExpandedCitations((prev) => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const sampleQuestions = currentCategory
    ? SAMPLE_QUESTIONS_BY_CATEGORY[currentCategory.slug] || []
    : [];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/40 overflow-hidden relative">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6">
        {messages.length === 0 ? (
          /* Empty / Welcome State */
          <div className="max-w-2xl mx-auto py-10 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-blue-500/20 mb-5">
              <Sparkles className="w-8 h-8" />
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Hola, soy Vicente
            </h1>
            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 mt-2 max-w-lg mx-auto">
              Asistente corporativo de atención. Respondo consultas basándome estrictamente en manuales, pólizas y documentos oficiales autorizados.
            </p>

            {currentCategory && (
              <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-medium">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <span>
                  Consultando base de conocimiento:{' '}
                  <strong className="font-semibold">{currentCategory.name}</strong>
                </span>
              </div>
            )}

            {/* Quick Sample Questions */}
            {sampleQuestions.length > 0 && (
              <div className="mt-8">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-3">
                  Preguntas frecuentes recomendadas
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-xl mx-auto text-left">
                  {sampleQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSendMessage(q)}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all text-xs text-slate-700 dark:text-slate-300 font-medium flex items-start gap-2.5 group cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      <span className="line-clamp-2">{q}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Conversation Message List */
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              const isCitationsOpen = !!expandedCitations[msg.id];
              const citations = msg.citations || [];

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3.5 ${
                    isAssistant ? 'justify-start' : 'justify-end'
                  }`}
                >
                  {/* Assistant Avatar */}
                  {isAssistant && (
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/15 mt-1">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}

                  {/* Message Bubble Container */}
                  <div
                    className={`max-w-[85%] md:max-w-[78%] rounded-2xl shadow-xs overflow-hidden ${
                      isAssistant
                        ? 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-200 p-4 md:p-5'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-tr-xs'
                    }`}
                  >
                    {/* Header info for assistant */}
                    {isAssistant && (
                      <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100 dark:border-slate-800 text-xs">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                          <span>Vicente</span>
                          <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900">
                            RAG Autorizado
                          </span>
                        </div>
                        <span className="text-[10.5px] text-slate-400">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}

                    {/* Content formatted */}
                    <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
                      {msg.content}
                    </div>

                    {/* Citations / Sources dropdown */}
                    {isAssistant && citations.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button
                          onClick={() => toggleCitations(msg.id)}
                          className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span>
                              Fuentes internas autorizadas ({citations.length})
                            </span>
                          </div>
                          {isCitationsOpen ? (
                            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </button>

                        {isCitationsOpen && (
                          <div className="mt-2 space-y-2 animate-in fade-in duration-150">
                            {citations.map((cite, cIdx) => (
                              <div
                                key={cIdx}
                                onClick={() => onOpenCitation(cite)}
                                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer group"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 truncate">
                                    <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                      {cite.documentTitle}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                      {cite.relevanceScore} pts
                                    </span>
                                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-500" />
                                  </div>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 italic">
                                  "{cite.excerpt}"
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* User Avatar */}
                  {!isAssistant && (
                    <div className="w-9 h-9 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-1 shadow-xs font-semibold text-xs">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Thinking / Processing indicator */}
            {isLoading && (
              <div className="flex items-start gap-3.5 justify-start animate-in fade-in duration-200">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/15">
                  <Sparkles className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce [animation-delay:0.4s]" />
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Vicente está consultando la base de documentos autorizados...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-4 md:px-8 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
        <div className="max-w-3xl mx-auto space-y-2">
          {error && (
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-red-700 dark:text-red-300 text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative">
            <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all overflow-hidden">
              {/* Category indicator pill */}
              <div className="px-3.5 pt-2 pb-1 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40 text-[11px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                  <span>Área de consulta:</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                    {currentCategory?.name || 'General'}
                  </strong>
                </div>
                <span>{input.length}/2500 caracteres</span>
              </div>

              {/* Textarea & Send button */}
              <div className="flex items-end gap-2 p-2.5">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleTextareaInput}
                  onKeyDown={handleKeyDown}
                  placeholder={`Escribe tu pregunta sobre ${currentCategory?.name || 'este tema'}... (Enter para enviar)`}
                  rows={1}
                  className="w-full max-h-40 resize-none bg-transparent px-2 py-1.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden"
                  disabled={isLoading}
                />

                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 text-white rounded-xl shadow-md shadow-blue-500/20 transition-all shrink-0 cursor-pointer"
                  title="Enviar pregunta"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>

          {/* Legal / Policy Footer */}
          <p className="text-[11px] text-center text-slate-400 dark:text-slate-500">
            Vicente responde únicamente con información de manuales y documentos internos autorizados. Si no existen fuentes suficientes, no improvisará.
          </p>
        </div>
      </div>
    </div>
  );
};
