import { Router } from 'express';
import { authenticate, checkCategoryAccess } from '../auth.ts';
import { db } from '../db.ts';
import { executeVicenteRAG } from '../rag.ts';
import { rateLimitMiddleware } from '../rateLimiter.ts';

const router = Router();

// Retrieve categories authorized for the current user
router.get('/categories', authenticate, (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado.' });
    return;
  }

  const allCategories = db.listCategories().filter((c) => c.active);

  if (req.user.role === 'admin') {
    res.json(allCategories);
    return;
  }

  // Filter strictly by user.allowedCategories
  const allowedSet = new Set(req.user.allowedCategories);
  const userCategories = allCategories.filter((c) => allowedSet.has(c.slug));

  res.json(userCategories);
});

// List user's conversations
router.get('/conversations', authenticate, (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado.' });
    return;
  }

  const conversations = db.listUserConversations(req.user.id);
  res.json(conversations);
});

// Get a single conversation's messages with IDOR protection
router.get('/conversations/:id', authenticate, (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado.' });
    return;
  }

  const { id } = req.params;
  const conversation = db.getConversation(id, req.user.id);

  if (!conversation) {
    // Audit attempt to access unauthorized conversation
    db.addAuditLog({
      userId: req.user.id,
      username: req.user.username,
      action: 'CONVERSATION_ACCESS_DENIED',
      status: 'FORBIDDEN',
      ip: req.ip || '127.0.0.1',
      details: `Intento de acceso a conversación inexistente o ajena con ID: ${id}`
    });

    res.status(404).json({
      error: 'Conversación no encontrada o no pertenece a este usuario.',
      code: 'CONVERSATION_NOT_FOUND'
    });
    return;
  }

  const messages = db.getConversationMessages(conversation.id);
  res.json({
    conversation,
    messages
  });
});

// Delete a conversation (IDOR protected)
router.delete('/conversations/:id', authenticate, (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado.' });
    return;
  }

  const { id } = req.params;
  const success = db.deleteConversation(id, req.user.id);

  if (!success) {
    res.status(404).json({
      error: 'Conversación no encontrada o no pertenece a este usuario.',
      code: 'CONVERSATION_NOT_FOUND'
    });
    return;
  }

  res.json({ success: true, message: 'Conversación eliminada exitosamente.' });
});

// POST /api/chat: Core RAG Chat Endpoint
router.post('/chat', authenticate, rateLimitMiddleware, async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado.' });
    return;
  }

  const { query, category, conversationId } = req.body;

  // 1. Validation of query
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    res.status(400).json({
      error: 'Debe ingresar una pregunta o mensaje.',
      code: 'EMPTY_QUERY'
    });
    return;
  }

  if (query.length > 2500) {
    res.status(400).json({
      error: 'La consulta excede la longitud máxima permitida de 2,500 caracteres.',
      code: 'QUERY_TOO_LONG'
    });
    return;
  }

  // 2. Validation of category
  if (!category || typeof category !== 'string') {
    res.status(400).json({
      error: 'Debe especificar una categoría válida.',
      code: 'MISSING_CATEGORY'
    });
    return;
  }

  const categorySlug = category.toLowerCase().trim();
  const catRecord = db.getCategoryBySlug(categorySlug);
  if (!catRecord || !catRecord.active) {
    res.status(400).json({
      error: 'La categoría especificada no existe o no se encuentra activa.',
      code: 'INVALID_CATEGORY'
    });
    return;
  }

  // 3. Strict Backend Authorization: Check user's category permissions
  const hasAccess = checkCategoryAccess(req.user, categorySlug);
  if (!hasAccess) {
    db.addAuditLog({
      userId: req.user.id,
      username: req.user.username,
      action: 'UNAUTHORIZED_CATEGORY_QUERY',
      categorySlug,
      status: 'FORBIDDEN',
      ip: req.ip || '127.0.0.1',
      details: `Usuario ${req.user.username} intentó consultar categoría no autorizada "${categorySlug}".`
    });

    res.status(403).json({
      error: 'Acceso denegado: No tiene permisos asignados para consultar esta categoría.',
      code: 'CATEGORY_ACCESS_DENIED'
    });
    return;
  }

  // 4. Conversation ownership verification (IDOR protection)
  let activeConversationId = conversationId;
  let activeConversation;

  if (activeConversationId) {
    activeConversation = db.getConversation(activeConversationId, req.user.id);
    if (!activeConversation) {
      db.addAuditLog({
        userId: req.user.id,
        username: req.user.username,
        action: 'IDOR_CONVERSATION_ATTEMPT',
        status: 'FORBIDDEN',
        ip: req.ip || '127.0.0.1',
        details: `Intento de uso de conversationId ajeno: ${activeConversationId}`
      });

      res.status(403).json({
        error: 'La conversación especificada no pertenece a su cuenta de usuario.',
        code: 'UNAUTHORIZED_CONVERSATION'
      });
      return;
    }
  } else {
    // Create new conversation on server
    activeConversation = db.createConversation(req.user.id, categorySlug);
    activeConversationId = activeConversation.id;
  }

  // 5. Retrieve verified server-side history (never trust browser context)
  const serverHistory = db.getConversationMessages(activeConversationId).map((m) => ({
    role: m.role,
    content: m.content
  }));

  try {
    // 6. Execute RAG
    const ragResult = await executeVicenteRAG(
      req.user,
      categorySlug,
      query.trim(),
      serverHistory
    );

    // 7. Store user message in server database
    db.addMessage({
      conversationId: activeConversationId,
      role: 'user',
      content: query.trim(),
      categorySlug
    });

    // 8. Store assistant response with citations
    const assistantMsg = db.addMessage({
      conversationId: activeConversationId,
      role: 'assistant',
      content: ragResult.answer,
      categorySlug,
      citations: ragResult.citations
    });

    // 9. Audit query success
    db.addAuditLog({
      userId: req.user.id,
      username: req.user.username,
      action: 'CHAT_QUERY_SUCCESS',
      categorySlug,
      status: 'SUCCESS',
      ip: req.ip || '127.0.0.1',
      details: `Consulta RAG en "${categorySlug}". Fuentes recuperadas: ${ragResult.citations.length}`
    });

    // 10. Return structured response (without leaking internal server traces)
    res.json({
      answer: assistantMsg.content,
      conversationId: activeConversationId,
      citations: assistantMsg.citations || [],
      messageId: assistantMsg.id,
      categorySlug
    });
  } catch (err) {
    console.error('Error processing chat query:', err);

    db.addAuditLog({
      userId: req.user.id,
      username: req.user.username,
      action: 'CHAT_QUERY_ERROR',
      categorySlug,
      status: 'ERROR',
      ip: req.ip || '127.0.0.1',
      details: 'Error interno en procesamiento de consulta RAG.'
    });

    // Safe error message without exposing stacks or secrets
    res.status(500).json({
      error: 'Ocurrió un error al procesar su consulta. Por favor intente nuevamente.',
      code: 'RAG_PROCESSING_ERROR'
    });
  }
});

export default router;
