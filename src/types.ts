export type UserRole = 'admin' | 'agent' | 'user';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  allowedCategories: string[];
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  active: boolean;
  createdAt: string;
}

export interface Citation {
  documentId: string;
  documentTitle: string;
  categorySlug: string;
  chunkId: string;
  excerpt: string;
  relevanceScore: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  categorySlug?: string;
  citations?: Citation[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  categorySlug: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeDocument {
  id: string;
  categoryId: string;
  title: string;
  filename: string;
  fileType: string;
  fileSize: number;
  chunksCount: number;
  createdAt: string;
  rawContent?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  username: string;
  action: string;
  categorySlug?: string;
  status: 'SUCCESS' | 'FORBIDDEN' | 'RATE_LIMITED' | 'ERROR';
  ip: string;
  details: string;
}

export interface SystemConfig {
  assistantName: string;
  emptyResultMessage: string;
  maxRequestsPerMinute: number;
  strictRAGMode: boolean;
  retentionDays: number;
  updatedAt: string;
}
