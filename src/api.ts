import {
  AuditLog,
  Category,
  ChatMessage,
  Conversation,
  KnowledgeDocument,
  SystemConfig,
  User
} from './types.ts';

const TOKEN_KEY = 'vicente_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `Error en la solicitud HTTP (${response.status})`;
    const error = new Error(errorMsg) as Error & { code?: string; status?: number };
    error.code = data.code;
    error.status = response.status;
    throw error;
  }

  return data as T;
}

export const api = {
  // Auth
  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    const data = await request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    setStoredToken(data.token);
    return data;
  },

  async getMe(): Promise<User> {
    return request<User>('/api/auth/me');
  },

  async getDemoAccounts(): Promise<User[]> {
    return request<User[]>('/api/auth/demo-accounts');
  },

  logout(): void {
    removeStoredToken();
  },

  // Chat & Categories
  async getAuthorizedCategories(): Promise<Category[]> {
    return request<Category[]>('/api/categories');
  },

  async getConversations(): Promise<Conversation[]> {
    return request<Conversation[]>('/api/conversations');
  },

  async getConversation(id: string): Promise<{ conversation: Conversation; messages: ChatMessage[] }> {
    return request<{ conversation: Conversation; messages: ChatMessage[] }>(`/api/conversations/${id}`);
  },

  async deleteConversation(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/conversations/${id}`, {
      method: 'DELETE'
    });
  },

  async sendChatMessage(
    query: string,
    category: string,
    conversationId?: string
  ): Promise<{
    answer: string;
    conversationId: string;
    citations: any[];
    messageId: string;
    categorySlug: string;
  }> {
    return request('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ query, category, conversationId })
    });
  },

  // Admin
  async getAdminCategories(): Promise<Category[]> {
    return request<Category[]>('/api/admin/categories');
  },

  async createAdminCategory(data: Partial<Category>): Promise<Category> {
    return request<Category>('/api/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateAdminCategory(id: string, data: Partial<Category>): Promise<Category> {
    return request<Category>(`/api/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteAdminCategory(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/admin/categories/${id}`, {
      method: 'DELETE'
    });
  },

  async getAdminDocuments(): Promise<KnowledgeDocument[]> {
    return request<KnowledgeDocument[]>('/api/admin/documents');
  },

  async uploadAdminFile(
    file: File,
    categoryId: string,
    title?: string
  ): Promise<KnowledgeDocument & { formatLabel?: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('categoryId', categoryId);
    if (title) formData.append('title', title);

    const token = getStoredToken();
    const headers = new Headers();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch('/api/admin/documents/upload', {
      method: 'POST',
      headers,
      body: formData
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Error al subir y procesar el archivo');
    }
    return data;
  },

  async createAdminDocument(doc: {
    categoryId: string;
    title: string;
    filename?: string;
    fileType?: string;
    rawContent: string;
  }): Promise<KnowledgeDocument> {
    return request<KnowledgeDocument>('/api/admin/documents', {
      method: 'POST',
      body: JSON.stringify(doc)
    });
  },

  async deleteAdminDocument(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/admin/documents/${id}`, {
      method: 'DELETE'
    });
  },

  async getAdminUsers(): Promise<User[]> {
    return request<User[]>('/api/admin/users');
  },

  async createAdminUser(data: {
    username: string;
    password: string;
    name: string;
    role: string;
    allowedCategories: string[];
  }): Promise<User> {
    return request<User>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateAdminUser(id: string, data: Partial<User> & { password?: string; active?: boolean }): Promise<User> {
    return request<User>(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteAdminUser(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/admin/users/${id}`, {
      method: 'DELETE'
    });
  },

  async getAdminAuditLogs(limit = 100): Promise<AuditLog[]> {
    return request<AuditLog[]>(`/api/admin/audit?limit=${limit}`);
  },

  async getAdminConfig(): Promise<SystemConfig> {
    return request<SystemConfig>('/api/admin/config');
  },

  async updateAdminConfig(data: Partial<SystemConfig>): Promise<SystemConfig> {
    return request<SystemConfig>('/api/admin/config', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async cleanupAdminData(): Promise<{ success: boolean; purgedConversations: number }> {
    return request<{ success: boolean; purgedConversations: number }>('/api/admin/cleanup', {
      method: 'POST'
    });
  },

  async resetDemoData(): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>('/api/admin/reset-demo', {
      method: 'POST'
    });
  }
};
