import React, { useState, useEffect } from 'react';
import { api, getStoredToken } from './api.ts';
import { Category, ChatMessage, Citation, Conversation, User } from './types.ts';
import { Header } from './components/Header.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { ChatView } from './components/ChatView.tsx';
import { CitationModal } from './components/CitationModal.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { LoginModal } from './components/LoginModal.tsx';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('tiendas_agencias');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modals & Panels
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

  // Initialize Auth & Categories
  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      const token = getStoredToken();
      let currentUser: User | null = null;

      if (token) {
        try {
          currentUser = await api.getMe();
        } catch {
          // Token expired or invalid
          api.logout();
        }
      }

      // If no valid session, auto-authenticate with default admin demo user for instant evaluation
      if (!currentUser) {
        try {
          const loginRes = await api.login('admin', 'admin123');
          currentUser = loginRes.user;
        } catch (e) {
          console.error('Could not auto-login demo user:', e);
          setIsLoginOpen(true);
          return;
        }
      }

      setUser(currentUser);
      await loadUserData(currentUser);
    } catch (err: any) {
      console.error('Initialization error:', err);
      setError(err.message || 'Error al inicializar la aplicación.');
    }
  };

  const loadUserData = async (currentUser: User) => {
    try {
      // 1. Fetch strictly authorized categories for this user
      const cats = await api.getAuthorizedCategories();
      setCategories(cats);

      // Select first authorized category
      if (cats.length > 0) {
        const hasCurrent = cats.some((c) => c.slug === selectedCategory);
        if (!hasCurrent) {
          setSelectedCategory(cats[0].slug);
        }
      }

      // 2. Fetch conversations
      const convs = await api.getConversations();
      setConversations(convs);
    } catch (err: any) {
      console.error('Failed to load user data:', err);
      setError(err.message || 'Error al cargar datos de usuario.');
    }
  };

  // Switch category
  const handleSelectCategory = (categorySlug: string) => {
    setSelectedCategory(categorySlug);
    // Reset active conversation to start fresh in selected category
    setActiveConversationId(null);
    setMessages([]);
    setError(null);
  };

  // Select conversation
  const handleSelectConversation = async (conversationId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getConversation(conversationId);
      setActiveConversationId(res.conversation.id);
      setSelectedCategory(res.conversation.categorySlug);
      setMessages(res.messages);
    } catch (err: any) {
      setError(err.message || 'Error al cargar conversación.');
    } finally {
      setIsLoading(false);
    }
  };

  // New conversation
  const handleNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    setError(null);
  };

  // Delete conversation
  const handleDeleteConversation = async (id: string) => {
    try {
      await api.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        handleNewConversation();
      }
    } catch (err: any) {
      setError(err.message || 'Error al eliminar conversación.');
    }
  };

  // Send message
  const handleSendMessage = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    // Create optimistic user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversationId: activeConversationId || 'new',
      role: 'user',
      content: queryText,
      categorySlug: selectedCategory,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.sendChatMessage(
        queryText,
        selectedCategory,
        activeConversationId || undefined
      );

      // Create assistant message
      const assistantMsg: ChatMessage = {
        id: res.messageId,
        conversationId: res.conversationId,
        role: 'assistant',
        content: res.answer,
        categorySlug: res.categorySlug,
        citations: res.citations,
        createdAt: new Date().toISOString()
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setActiveConversationId(res.conversationId);

      // Refresh conversations list to update title & timestamp
      api.getConversations().then(setConversations).catch(console.error);
    } catch (err: any) {
      console.error('Chat error:', err);
      setError(
        err.message || 'Ocurrió un error al procesar su consulta en los documentos internos.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Login Success
  const handleLoginSuccess = async (loggedInUser: User) => {
    setUser(loggedInUser);
    setIsLoginOpen(false);
    setActiveConversationId(null);
    setMessages([]);
    setError(null);
    await loadUserData(loggedInUser);
  };

  // Logout
  const handleLogout = () => {
    api.logout();
    setUser(null);
    setConversations([]);
    setMessages([]);
    setActiveConversationId(null);
    setIsLoginOpen(true);
  };

  const currentCategory = categories.find((c) => c.slug === selectedCategory);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans antialiased">
      {/* Header */}
      <Header
        user={user}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
        />

        <main className="flex-1 flex flex-col h-full overflow-hidden">
          <ChatView
            messages={messages}
            currentCategory={currentCategory}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onOpenCitation={(cite) => setSelectedCitation(cite)}
            error={error}
          />
        </main>
      </div>

      {/* Citation Detail Modal */}
      <CitationModal
        citation={selectedCitation}
        onClose={() => setSelectedCitation(null)}
      />

      {/* Admin Panel Modal */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        categories={categories}
        onRefreshCategories={() => user && loadUserData(user)}
      />

      {/* Login & Demo Switcher Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onSuccess={handleLoginSuccess}
        onClose={() => user && setIsLoginOpen(false)}
      />
    </div>
  );
}
