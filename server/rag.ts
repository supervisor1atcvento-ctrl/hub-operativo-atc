import { db } from './db.ts';
import { generateRAGAnswer } from './gemini.ts';
import { Citation, DocumentChunk, KnowledgeDocument, User } from './types.ts';

// Helper to normalize strings for search (lowercase, no accents, strip punctuation)
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const SPANISH_STOPWORDS = new Set([
  'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un', 'para',
  'con', 'no', 'una', 'su', 'al', 'lo', 'como', 'mas', 'pero', 'sus', 'le', 'ya', 'o',
  'este', 'si', 'porque', 'esta', 'son', 'entre', 'cuando', 'muy', 'sin', 'sobre', 'ser',
  'tiene', 'tambien', 'me', 'hasta', 'hay', 'donde', 'quien', 'desde', 'todo', 'nos',
  'durante', 'uno', 'les', 'ni', 'contra', 'otros', 'cual', 'cuales', 'es'
]);

// Tokenize text into meaningful content words
export function tokenize(text: string): string[] {
  const norm = normalizeText(text);
  if (!norm) return [];
  return norm
    .split(' ')
    .filter((w) => w.length > 1 && !SPANISH_STOPWORDS.has(w));
}

// Compute relevance score using hybrid BM25-like TF-IDF & keyword matching
export function calculateRelevance(
  queryTokens: string[],
  rawQuery: string,
  chunkContent: string,
  docTitle: string
): number {
  const chunkNorm = normalizeText(chunkContent);
  const titleNorm = normalizeText(docTitle);
  const chunkTokens = tokenize(chunkContent);

  if (chunkTokens.length === 0 || queryTokens.length === 0) return 0;

  // Exact phrase match bonus
  const normRawQuery = normalizeText(rawQuery);
  let score = 0;
  if (normRawQuery.length > 5 && chunkNorm.includes(normRawQuery)) {
    score += 8.0;
  }
  if (normRawQuery.length > 5 && titleNorm.includes(normRawQuery)) {
    score += 4.0;
  }

  // Token frequency in chunk and title
  const chunkTokenFreq = new Map<string, number>();
  for (const t of chunkTokens) {
    chunkTokenFreq.set(t, (chunkTokenFreq.get(t) || 0) + 1);
  }

  let matchedTokens = 0;
  for (const qToken of queryTokens) {
    const inTitle = titleNorm.includes(qToken);
    const countInChunk = chunkTokenFreq.get(qToken) || 0;

    if (inTitle) {
      score += 3.0;
      matchedTokens++;
    }

    if (countInChunk > 0) {
      // Sublinear term frequency (log1p)
      score += Math.log(1 + countInChunk) * 2.0;
      matchedTokens++;
    }
  }

  if (matchedTokens === 0) {
    return 0;
  }

  // Proportion of query tokens present
  const coverageRatio = matchedTokens / Math.max(queryTokens.length, 1);
  score = score * (0.6 + coverageRatio);

  return score;
}

export interface RetrievedChunk {
  chunk: DocumentChunk;
  document: KnowledgeDocument;
  score: number;
}

/**
 * Core Security Rule: Pre-filters chunks ONLY by authorized categories for the user
 * and the specific category requested.
 */
export function retrieveAuthorizedChunks(
  user: User,
  requestedCategorySlug: string,
  query: string,
  topK = 4
): RetrievedChunk[] {
  const isAll = requestedCategorySlug === 'all';

  if (!isAll) {
    // 1. Verify user permission for requested category
    const isAuthorized =
      user.role === 'admin' || user.allowedCategories.includes('*') || user.allowedCategories.includes(requestedCategorySlug);
    if (!isAuthorized) {
      return [];
    }

    // 2. Resolve category ID
    const category = db.getCategoryBySlug(requestedCategorySlug);
    if (!category || !category.active) {
      return [];
    }

    // 3. Retrieve chunks strictly belonging to this category
    const categoryChunks = db.getChunksForCategory(category.id);
    if (categoryChunks.length === 0) {
      return [];
    }

    // 4. Tokenize query
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) {
      return [];
    }

    // 5. Score only authorized chunks
    const scoredChunks: RetrievedChunk[] = [];

    for (const chunk of categoryChunks) {
      const doc = db.getDocumentById(chunk.documentId);
      if (!doc) continue;

      const score = calculateRelevance(queryTokens, query, chunk.content, doc.title);
      if (score > 1.2) {
        scoredChunks.push({ chunk, document: doc, score });
      }
    }

    // Sort descending by score
    scoredChunks.sort((a, b) => b.score - a.score);
    return scoredChunks.slice(0, topK);
  } else {
    // Global search across all authorized categories
    const allCategories = db.listCategories().filter((c) => c.active);
    const authorizedCategories = allCategories.filter((c) =>
      user.role === 'admin' || user.allowedCategories.includes('*') || user.allowedCategories.includes(c.slug)
    );

    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    const scoredChunks: RetrievedChunk[] = [];
    for (const cat of authorizedCategories) {
      const catChunks = db.getChunksForCategory(cat.id);
      for (const chunk of catChunks) {
        const doc = db.getDocumentById(chunk.documentId);
        if (!doc) continue;

        const score = calculateRelevance(queryTokens, query, chunk.content, doc.title);
        if (score > 1.2) {
          scoredChunks.push({ chunk, document: doc, score });
        }
      }
    }

    scoredChunks.sort((a, b) => b.score - a.score);
    return scoredChunks.slice(0, topK);
  }
}


/**
 * Fallback deterministic synthesis when Gemini API key is not present or offline.
 * Extracts the most relevant sentences directly from authorized chunks.
 */
function synthesizeExtractiveAnswer(
  query: string,
  retrieved: RetrievedChunk[],
  emptyMessage: string
): { answer: string; citations: Citation[] } {
  if (retrieved.length === 0) {
    return { answer: emptyMessage, citations: [] };
  }

  const citations: Citation[] = retrieved.map(({ chunk, document, score }) => ({
    documentId: document.id,
    documentTitle: document.title,
    categorySlug: db.getCategoryById(document.categoryId)?.slug || '',
    chunkId: chunk.id,
    excerpt: chunk.content.slice(0, 240) + '...',
    relevanceScore: Math.round(score * 10) / 10
  }));

  // Clean presentation with direct documentary extract
  const topDoc = retrieved[0].document;
  const bestChunk = retrieved[0].chunk;

  const answer = `De acuerdo con la documentación interna oficial (**${topDoc.title}**):\n\n${bestChunk.content}\n\n*Información verificada exclusivamente desde fuentes documentales internas.*`;

  return { answer, citations };
}

/**
 * Main RAG orchestrator for Vicente
 */
import { executeAkinatorSearch, AkinatorStepResult } from './akinatorEngine.ts';

/**
 * Main RAG orchestrator for Vicente - 100% Deterministico en Base de Datos estilo Akinator
 */
export async function executeVicenteRAG(
  user: User,
  categorySlug: string,
  userQuery: string,
  _conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [],
  answersHistory: Record<string, string> = {}
): Promise<{
  answer: string;
  citations: Citation[];
  akinator?: {
    certainty: number;
    status: 'QUESTIONING' | 'SOLVED' | 'NOT_FOUND';
    nextQuestion?: any;
    candidatesCount: number;
  };
}> {
  const config = db.getConfig();
  const emptyMessage = config.emptyResultMessage;

  const isAll = categorySlug === 'all';
  // 1. Verificación obligatoria de autorización por categoría en backend
  if (!isAll) {
    const isAuthorized =
      user.role === 'admin' || user.allowedCategories.includes('*') || user.allowedCategories.includes(categorySlug);
    if (!isAuthorized) {
      return {
        answer: emptyMessage,
        citations: []
      };
    }
  }

  // 2. Ejecutar motor Akinator en la base de datos
  const akinatorResult: AkinatorStepResult = executeAkinatorSearch(
    user,
    categorySlug,
    userQuery,
    answersHistory
  );

  // 3. Si Akinator resolvió o está preguntando, devolver de inmediato
  if (akinatorResult.status === 'SOLVED' || akinatorResult.status === 'QUESTIONING') {
    return {
      answer: akinatorResult.answerText,
      citations: akinatorResult.citations,
      akinator: {
        certainty: akinatorResult.certainty,
        status: akinatorResult.status,
        nextQuestion: akinatorResult.nextQuestion,
        candidatesCount: akinatorResult.candidatesCount
      }
    };
  }

  // 4. Si no encontró en el árbol de Akinator, consultar fragmentos documentales directos
  const retrieved = retrieveAuthorizedChunks(user, categorySlug, userQuery, 4);

  if (retrieved.length === 0) {
    return {
      answer: emptyMessage,
      citations: [],
      akinator: {
        certainty: 0,
        status: 'NOT_FOUND',
        candidatesCount: 0
      }
    };
  }

  // Retornar síntesis extractiva documental 100% calculada en base de datos
  const docResult = synthesizeExtractiveAnswer(userQuery, retrieved, emptyMessage);
  return {
    answer: docResult.answer,
    citations: docResult.citations,
    akinator: {
      certainty: 90,
      status: 'SOLVED',
      candidatesCount: 1
    }
  };
}
