import fs from 'fs';
import path from 'path';
import {
  AuditLog,
  Category,
  ChatMessage,
  Conversation,
  DocumentChunk,
  KnowledgeDocument,
  SystemConfig,
  User
} from './types.ts';
import {
  SEED_CATEGORIES,
  SEED_CONFIG,
  SEED_DOCUMENTS,
  SEED_USERS,
  hashPassword
} from './seedData.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'vicente_db.json');

export interface DatabaseSchema {
  users: User[];
  categories: Category[];
  documents: KnowledgeDocument[];
  chunks: DocumentChunk[];
  conversations: Conversation[];
  messages: ChatMessage[];
  auditLogs: AuditLog[];
  systemConfig: SystemConfig;
}

export function chunkText(text: string, chunkSize = 500, overlap = 100): string[] {
  const clean = text.replace(/\r\n/g, '\n').trim();
  if (clean.length <= chunkSize) {
    return [clean];
  }

  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < clean.length) {
    let endIndex = startIndex + chunkSize;

    if (endIndex < clean.length) {
      // Look for a paragraph or sentence break near endIndex to avoid slicing mid-sentence
      const breakPoint = clean.lastIndexOf('\n', endIndex);
      if (breakPoint > startIndex + chunkSize / 2) {
        endIndex = breakPoint;
      } else {
        const periodPoint = clean.lastIndexOf('. ', endIndex);
        if (periodPoint > startIndex + chunkSize / 2) {
          endIndex = periodPoint + 1;
        }
      }
    } else {
      endIndex = clean.length;
    }

    const chunk = clean.slice(startIndex, endIndex).trim();
    if (chunk.length > 20) {
      chunks.push(chunk);
    }

    if (endIndex >= clean.length) break;
    startIndex = Math.max(startIndex + 1, endIndex - overlap);
  }

  return chunks;
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.users && parsed.categories && parsed.documents) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Could not load existing database file, initializing from seed.', err);
    }

    return this.initializeWithSeed();
  }

  private initializeWithSeed(): DatabaseSchema {
    const documents: KnowledgeDocument[] = [];
    const chunks: DocumentChunk[] = [];

    for (const doc of SEED_DOCUMENTS) {
      const docChunks = chunkText(doc.rawContent);
      const fullDoc: KnowledgeDocument = {
        ...doc,
        chunksCount: docChunks.length
      };
      documents.push(fullDoc);

      docChunks.forEach((chunkContent, idx) => {
        chunks.push({
          id: `chk-${doc.id}-${idx}`,
          documentId: doc.id,
          categoryId: doc.categoryId,
          chunkIndex: idx,
          content: chunkContent,
          tokensCount: Math.ceil(chunkContent.length / 4),
          createdAt: doc.createdAt
        });
      });
    }

    const initialDb: DatabaseSchema = {
      users: [...SEED_USERS],
      categories: [...SEED_CATEGORIES],
      documents,
      chunks,
      conversations: [],
      messages: [],
      auditLogs: [
        {
          id: 'log-seed-1',
          timestamp: new Date().toISOString(),
          userId: 'system',
          username: 'sistema',
          action: 'DATABASE_INITIALIZATION',
          status: 'SUCCESS',
          ip: '127.0.0.1',
          details: 'Base de conocimiento Vicente y usuarios predeterminados inicializados exitosamente.'
        }
      ],
      systemConfig: { ...SEED_CONFIG }
    };

    this.persist(initialDb);
    return initialDb;
  }

  private persist(dbData?: DatabaseSchema): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const dataToSave = dbData || this.data;
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database file:', err);
    }
  }

  // Users
  getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  getUserByUsername(username: string): User | undefined {
    return this.data.users.find((u) => u.username.toLowerCase() === username.toLowerCase().trim());
  }

  listUsers(): Omit<User, 'passwordHash'>[] {
    return this.data.users.map(({ passwordHash, ...rest }) => rest);
  }

  createUser(userData: {
    username: string;
    password: string;
    name: string;
    role: User['role'];
    allowedCategories: string[];
  }): User {
    const newUser: User = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      username: userData.username.trim(),
      passwordHash: hashPassword(userData.password),
      name: userData.name.trim(),
      role: userData.role,
      allowedCategories: userData.allowedCategories,
      active: true,
      createdAt: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.persist();
    return newUser;
  }

  updateUser(
    id: string,
    updates: Partial<Pick<User, 'name' | 'role' | 'allowedCategories' | 'active'>> & { password?: string }
  ): User | null {
    const user = this.data.users.find((u) => u.id === id);
    if (!user) return null;

    if (updates.name !== undefined) user.name = updates.name;
    if (updates.role !== undefined) user.role = updates.role;
    if (updates.allowedCategories !== undefined) user.allowedCategories = updates.allowedCategories;
    if (updates.active !== undefined) user.active = updates.active;
    if (updates.password) user.passwordHash = hashPassword(updates.password);

    this.persist();
    return user;
  }

  deleteUser(id: string): boolean {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    this.data.users.splice(idx, 1);
    this.persist();
    return true;
  }

  // Categories
  listCategories(): Category[] {
    return this.data.categories;
  }

  getCategoryById(id: string): Category | undefined {
    return this.data.categories.find((c) => c.id === id);
  }

  getCategoryBySlug(slug: string): Category | undefined {
    return this.data.categories.find((c) => c.slug.toLowerCase() === slug.toLowerCase().trim());
  }

  createCategory(data: { slug: string; name: string; description: string; icon?: string }): Category {
    const newCat: Category = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      slug: data.slug.toLowerCase().trim(),
      name: data.name.trim(),
      description: data.description.trim(),
      icon: data.icon || 'Folder',
      active: true,
      createdAt: new Date().toISOString()
    };
    this.data.categories.push(newCat);
    this.persist();
    return newCat;
  }

  updateCategory(
    id: string,
    updates: Partial<Pick<Category, 'name' | 'description' | 'icon' | 'active'>>
  ): Category | null {
    const cat = this.data.categories.find((c) => c.id === id);
    if (!cat) return null;
    if (updates.name !== undefined) cat.name = updates.name.trim();
    if (updates.description !== undefined) cat.description = updates.description.trim();
    if (updates.icon !== undefined) cat.icon = updates.icon;
    if (updates.active !== undefined) cat.active = updates.active;
    this.persist();
    return cat;
  }

  deleteCategory(id: string): boolean {
    const idx = this.data.categories.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    const cat = this.data.categories[idx];
    this.data.categories.splice(idx, 1);
    // Also remove document references
    const docIdsToRemove = this.data.documents.filter((d) => d.categoryId === cat.id).map((d) => d.id);
    this.data.documents = this.data.documents.filter((d) => d.categoryId !== cat.id);
    this.data.chunks = this.data.chunks.filter((ch) => !docIdsToRemove.includes(ch.documentId));
    this.persist();
    return true;
  }

  // Documents & Chunks
  listDocuments(categoryId?: string): KnowledgeDocument[] {
    if (categoryId) {
      return this.data.documents.filter((d) => d.categoryId === categoryId);
    }
    return this.data.documents;
  }

  getDocumentById(id: string): KnowledgeDocument | undefined {
    return this.data.documents.find((d) => d.id === id);
  }

  addDocument(docData: {
    categoryId: string;
    title: string;
    filename: string;
    fileType: string;
    fileSize: number;
    rawContent: string;
  }): KnowledgeDocument {
    const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const textChunks = chunkText(docData.rawContent);

    const newDoc: KnowledgeDocument = {
      id: docId,
      categoryId: docData.categoryId,
      title: docData.title.trim(),
      filename: docData.filename.trim(),
      fileType: docData.fileType,
      fileSize: docData.fileSize,
      rawContent: docData.rawContent,
      chunksCount: textChunks.length,
      createdAt: new Date().toISOString()
    };

    this.data.documents.push(newDoc);

    textChunks.forEach((chunkContent, idx) => {
      this.data.chunks.push({
        id: `chk-${docId}-${idx}`,
        documentId: docId,
        categoryId: docData.categoryId,
        chunkIndex: idx,
        content: chunkContent,
        tokensCount: Math.ceil(chunkContent.length / 4),
        createdAt: newDoc.createdAt
      });
    });

    this.persist();
    return newDoc;
  }

  deleteDocument(id: string): boolean {
    const idx = this.data.documents.findIndex((d) => d.id === id);
    if (idx === -1) return false;
    this.data.documents.splice(idx, 1);
    this.data.chunks = this.data.chunks.filter((ch) => ch.documentId !== id);
    this.persist();
    return true;
  }

  getChunksForCategory(categoryId: string): DocumentChunk[] {
    return this.data.chunks.filter((c) => c.categoryId === categoryId);
  }

  getChunksForCategories(categoryIds: string[]): DocumentChunk[] {
    const set = new Set(categoryIds);
    return this.data.chunks.filter((c) => set.has(c.categoryId));
  }

  getAllChunks(): DocumentChunk[] {
    return this.data.chunks;
  }

  // Conversations
  createConversation(userId: string, categorySlug: string, title?: string): Conversation {
    const newConv: Conversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      categorySlug,
      title: title || 'Nueva consulta con Vicente',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.conversations.unshift(newConv);
    this.persist();
    return newConv;
  }

  getConversation(id: string, userId: string): Conversation | undefined {
    return this.data.conversations.find((c) => c.id === id && c.userId === userId);
  }

  listUserConversations(userId: string): Conversation[] {
    return this.data.conversations
      .filter((c) => c.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  updateConversationTitle(id: string, userId: string, title: string): boolean {
    const conv = this.getConversation(id, userId);
    if (!conv) return false;
    conv.title = title;
    conv.updatedAt = new Date().toISOString();
    this.persist();
    return true;
  }

  deleteConversation(id: string, userId: string): boolean {
    const idx = this.data.conversations.findIndex((c) => c.id === id && c.userId === userId);
    if (idx === -1) return false;
    this.data.conversations.splice(idx, 1);
    this.data.messages = this.data.messages.filter((m) => m.conversationId !== id);
    this.persist();
    return true;
  }

  // Messages
  addMessage(message: Omit<ChatMessage, 'id' | 'createdAt'>): ChatMessage {
    const newMsg: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString()
    };
    this.data.messages.push(newMsg);

    // Update conversation updatedAt
    const conv = this.data.conversations.find((c) => c.id === message.conversationId);
    if (conv) {
      conv.updatedAt = newMsg.createdAt;
      // Auto-set title from first user query if still generic
      if (conv.title === 'Nueva consulta con Vicente' && message.role === 'user') {
        conv.title = message.content.slice(0, 45).trim() + (message.content.length > 45 ? '...' : '');
      }
    }

    this.persist();
    return newMsg;
  }

  getConversationMessages(conversationId: string): ChatMessage[] {
    return this.data.messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  // Audit Logs
  addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const log: AuditLog = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString()
    };
    this.data.auditLogs.unshift(log);
    // Keep max 500 logs to prevent memory bloat
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 500);
    }
    this.persist();
    return log;
  }

  listAuditLogs(limit = 100): AuditLog[] {
    return this.data.auditLogs.slice(0, limit);
  }

  // System Configuration
  getConfig(): SystemConfig {
    return this.data.systemConfig;
  }

  updateConfig(updates: Partial<SystemConfig>): SystemConfig {
    this.data.systemConfig = {
      ...this.data.systemConfig,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.persist();
    return this.data.systemConfig;
  }

  // Retention cleanup
  cleanupOldData(): number {
    const days = this.data.systemConfig.retentionDays || 90;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const beforeCount = this.data.conversations.length;

    const oldConvIds = new Set(
      this.data.conversations.filter((c) => c.updatedAt < cutoff).map((c) => c.id)
    );

    this.data.conversations = this.data.conversations.filter((c) => !oldConvIds.has(c.id));
    this.data.messages = this.data.messages.filter((m) => !oldConvIds.has(m.conversationId));

    const cleaned = beforeCount - this.data.conversations.length;
    if (cleaned > 0) {
      this.persist();
    }
    return cleaned;
  }

  // Diagnostic / Reset for testing
  resetToSeed(): void {
    this.data = this.initializeWithSeed();
  }
}

export const db = new Database();
