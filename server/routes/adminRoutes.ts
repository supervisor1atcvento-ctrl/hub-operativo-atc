import { Router } from 'express';
import multer from 'multer';
import { authenticate, requireAdmin } from '../auth.ts';
import { db } from '../db.ts';
import { extractTextFromBuffer } from '../fileParser.ts';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 } // 30MB max file size
});

const router = Router();

// Apply authenticate and requireAdmin to all /api/admin routes
router.use(authenticate);
router.use(requireAdmin);

// ==========================================
// CATEGORIES MANAGEMENT
// ==========================================
router.get('/categories', (_req, res) => {
  res.json(db.listCategories());
});

router.post('/categories', (req, res) => {
  const { slug, name, description, icon } = req.body;

  if (!slug || !name || typeof slug !== 'string' || typeof name !== 'string') {
    res.status(400).json({ error: 'Slug y Nombre de categoría son obligatorios.' });
    return;
  }

  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, '_').trim();
  const existing = db.getCategoryBySlug(cleanSlug);
  if (existing) {
    res.status(409).json({ error: 'Ya existe una categoría con ese slug.' });
    return;
  }

  const category = db.createCategory({
    slug: cleanSlug,
    name,
    description: description || '',
    icon: icon || 'Folder'
  });

  db.addAuditLog({
    userId: req.user!.id,
    username: req.user!.username,
    action: 'CATEGORY_CREATED',
    status: 'SUCCESS',
    ip: req.ip || '127.0.0.1',
    details: `Categoría creada: ${category.name} (${category.slug})`
  });

  res.status(201).json(category);
});

router.put('/categories/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, icon, active } = req.body;

  const updated = db.updateCategory(id, { name, description, icon, active });
  if (!updated) {
    res.status(404).json({ error: 'Categoría no encontrada.' });
    return;
  }

  db.addAuditLog({
    userId: req.user!.id,
    username: req.user!.username,
    action: 'CATEGORY_UPDATED',
    status: 'SUCCESS',
    ip: req.ip || '127.0.0.1',
    details: `Categoría modificada: ${updated.name}`
  });

  res.json(updated);
});

router.delete('/categories/:id', (req, res) => {
  const { id } = req.params;
  const category = db.getCategoryById(id);
  if (!category) {
    res.status(404).json({ error: 'Categoría no encontrada.' });
    return;
  }

  const deleted = db.deleteCategory(id);
  if (deleted) {
    db.addAuditLog({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'CATEGORY_DELETED',
      status: 'SUCCESS',
      ip: req.ip || '127.0.0.1',
      details: `Categoría eliminada: ${category.name}`
    });
  }

  res.json({ success: true, message: 'Categoría eliminada.' });
});

// ==========================================
// DOCUMENTS MANAGEMENT (RAG)
// ==========================================
router.get('/documents', (req, res) => {
  const categoryId = req.query.categoryId as string | undefined;
  const docs = db.listDocuments(categoryId);
  res.json(docs);
});

// Upload binary files directly (PDF, Excel .xlsx/.xls/.csv, PowerPoint .pptx, Word .docx, TXT, MD)
router.post('/documents/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { categoryId, title } = req.body;

    if (!file) {
      res.status(400).json({ error: 'No se ha seleccionado ningún archivo para cargar.' });
      return;
    }

    if (!categoryId) {
      res.status(400).json({ error: 'Debe especificar la categoría a la cual pertenece el documento.' });
      return;
    }

    const cleanFilename = file.originalname.toLowerCase();
    const dangerousExtensions = ['.exe', '.sh', '.bat', '.cmd', '.vbs', '.php', '.py', '.js', '.bin', '.dll'];
    const hasDangerousExt = dangerousExtensions.some((ext) => cleanFilename.endsWith(ext));

    if (hasDangerousExt) {
      db.addAuditLog({
        userId: req.user!.id,
        username: req.user!.username,
        action: 'MALICIOUS_FILE_BLOCKED',
        status: 'FORBIDDEN',
        ip: req.ip || '127.0.0.1',
        details: `Intento de subida de archivo peligroso bloqueado: ${file.originalname}`
      });

      res.status(400).json({
        error: 'Tipo de archivo no permitido por políticas de seguridad corporativas.',
        code: 'UNSAFE_FILE_TYPE'
      });
      return;
    }

    const category = db.getCategoryById(categoryId);
    if (!category) {
      res.status(400).json({ error: 'La categoría seleccionada no existe.' });
      return;
    }

    // Extract text from buffer based on file type (PDF, Excel, PowerPoint, Word, Text)
    const { text: extractedText, fileType, formatLabel } = await extractTextFromBuffer(
      file.buffer,
      file.originalname,
      file.mimetype
    );

    if (!extractedText || !extractedText.trim()) {
      res.status(400).json({
        error: `El archivo ${file.originalname} no contiene texto procesable o está vacío.`
      });
      return;
    }

    const docTitle = (title && title.trim()) || file.originalname.replace(/\.[^/.]+$/, '');

    const doc = db.addDocument({
      categoryId,
      title: docTitle,
      filename: file.originalname,
      fileType,
      fileSize: file.size,
      rawContent: extractedText
    });

    db.addAuditLog({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'DOCUMENT_UPLOADED',
      categorySlug: category.slug,
      status: 'SUCCESS',
      ip: req.ip || '127.0.0.1',
      details: `Archivo ${formatLabel} procesado: "${doc.title}" (${doc.chunksCount} fragmentos RAG indexados, ${Math.round(file.size / 1024)} KB)`
    });

    res.status(201).json({
      ...doc,
      formatLabel
    });
  } catch (err: any) {
    console.error('Error in document upload:', err);
    res.status(500).json({
      error: err.message || 'Error al procesar y fragmentar el archivo para RAG.',
      code: 'PARSER_ERROR'
    });
  }
});

router.post('/documents', async (req, res) => {
  try {
    const { categoryId, title, filename, fileType, rawContent, base64Data } = req.body;

    if (!categoryId || !title) {
      res.status(400).json({ error: 'Categoría y título son obligatorios.' });
      return;
    }

    const cleanFilename = (filename || 'documento.txt').toLowerCase();
    const dangerousExtensions = ['.exe', '.sh', '.bat', '.cmd', '.vbs', '.php', '.py', '.js', '.bin', '.dll'];
    const hasDangerousExt = dangerousExtensions.some((ext) => cleanFilename.endsWith(ext));

    if (hasDangerousExt) {
      db.addAuditLog({
        userId: req.user!.id,
        username: req.user!.username,
        action: 'MALICIOUS_FILE_BLOCKED',
        status: 'FORBIDDEN',
        ip: req.ip || '127.0.0.1',
        details: `Intento de subida de archivo peligroso bloqueado: ${cleanFilename}`
      });

      res.status(400).json({
        error: 'Tipo de archivo no permitido por políticas de seguridad corporativas.',
        code: 'UNSAFE_FILE_TYPE'
      });
      return;
    }

    const category = db.getCategoryById(categoryId);
    if (!category) {
      res.status(400).json({ error: 'La categoría seleccionada no existe.' });
      return;
    }

    let finalContent = rawContent || '';
    let finalType = fileType || 'text/plain';
    let byteSize = 0;

    if (base64Data) {
      const buffer = Buffer.from(base64Data, 'base64');
      byteSize = buffer.length;
      const parsed = await extractTextFromBuffer(buffer, cleanFilename, fileType);
      finalContent = parsed.text;
      finalType = parsed.fileType;
    } else {
      byteSize = Buffer.byteLength(finalContent, 'utf-8');
    }

    if (!finalContent || !finalContent.trim()) {
      res.status(400).json({ error: 'El contenido del documento no puede estar vacío.' });
      return;
    }

    if (byteSize > 30 * 1024 * 1024) {
      res.status(400).json({ error: 'El documento supera el límite de 30MB.' });
      return;
    }

    const doc = db.addDocument({
      categoryId,
      title: title.trim(),
      filename: filename || `${title.replace(/\s+/g, '_')}.txt`,
      fileType: finalType,
      fileSize: byteSize,
      rawContent: finalContent
    });

    db.addAuditLog({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'DOCUMENT_UPLOADED',
      categorySlug: category.slug,
      status: 'SUCCESS',
      ip: req.ip || '127.0.0.1',
      details: `Documento cargado: "${doc.title}" (${doc.chunksCount} fragmentos indexados)`
    });

    res.status(201).json(doc);
  } catch (err: any) {
    console.error('Error creating document:', err);
    res.status(500).json({ error: err.message || 'Error al crear documento.' });
  }
});

router.delete('/documents/:id', (req, res) => {
  const { id } = req.params;
  const doc = db.getDocumentById(id);
  if (!doc) {
    res.status(404).json({ error: 'Documento no encontrado.' });
    return;
  }

  db.deleteDocument(id);

  db.addAuditLog({
    userId: req.user!.id,
    username: req.user!.username,
    action: 'DOCUMENT_DELETED',
    status: 'SUCCESS',
    ip: req.ip || '127.0.0.1',
    details: `Documento eliminado: "${doc.title}"`
  });

  res.json({ success: true, message: 'Documento y fragmentos eliminados.' });
});

router.get('/documents/:id/chunks', (req, res) => {
  const { id } = req.params;
  const allChunks = db.getAllChunks().filter((c) => c.documentId === id);
  res.json(allChunks);
});

// ==========================================
// USERS & ROLES MANAGEMENT
// ==========================================
router.get('/users', (_req, res) => {
  res.json(db.listUsers());
});

router.post('/users', (req, res) => {
  const { username, password, name, role, allowedCategories } = req.body;

  if (!username || !password || !name || !role) {
    res.status(400).json({ error: 'Faltan campos obligatorios para el usuario.' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    return;
  }

  const existing = db.getUserByUsername(username);
  if (existing) {
    res.status(409).json({ error: 'Ya existe un usuario con ese nombre de usuario.' });
    return;
  }

  const newUser = db.createUser({
    username,
    password,
    name,
    role,
    allowedCategories: Array.isArray(allowedCategories) ? allowedCategories : []
  });

  db.addAuditLog({
    userId: req.user!.id,
    username: req.user!.username,
    action: 'USER_CREATED',
    status: 'SUCCESS',
    ip: req.ip || '127.0.0.1',
    details: `Usuario creado: ${newUser.username} con rol ${newUser.role}`
  });

  const { passwordHash: _, ...safeUser } = newUser;
  res.status(201).json(safeUser);
});

router.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, role, allowedCategories, active, password } = req.body;

  const updated = db.updateUser(id, { name, role, allowedCategories, active, password });
  if (!updated) {
    res.status(404).json({ error: 'Usuario no encontrado.' });
    return;
  }

  db.addAuditLog({
    userId: req.user!.id,
    username: req.user!.username,
    action: 'USER_UPDATED',
    status: 'SUCCESS',
    ip: req.ip || '127.0.0.1',
    details: `Usuario modificado: ${updated.username}`
  });

  const { passwordHash: _, ...safeUser } = updated;
  res.json(safeUser);
});

router.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  // Prevent deleting oneself
  if (req.user!.id === id) {
    res.status(400).json({ error: 'No puede eliminar su propia cuenta de administrador.' });
    return;
  }

  const user = db.getUserById(id);
  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado.' });
    return;
  }

  db.deleteUser(id);

  db.addAuditLog({
    userId: req.user!.id,
    username: req.user!.username,
    action: 'USER_DELETED',
    status: 'SUCCESS',
    ip: req.ip || '127.0.0.1',
    details: `Usuario eliminado: ${user.username}`
  });

  res.json({ success: true, message: 'Usuario eliminado.' });
});

// ==========================================
// AUDIT & SECURITY LOGS
// ==========================================
router.get('/audit', (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
  res.json(db.listAuditLogs(limit));
});

// ==========================================
// SYSTEM CONFIGURATION
// ==========================================
router.get('/config', (_req, res) => {
  res.json(db.getConfig());
});

router.put('/config', (req, res) => {
  const { assistantName, emptyResultMessage, maxRequestsPerMinute, strictRAGMode, retentionDays } =
    req.body;

  const updated = db.updateConfig({
    assistantName,
    emptyResultMessage,
    maxRequestsPerMinute,
    strictRAGMode,
    retentionDays
  });

  db.addAuditLog({
    userId: req.user!.id,
    username: req.user!.username,
    action: 'CONFIG_UPDATED',
    status: 'SUCCESS',
    ip: req.ip || '127.0.0.1',
    details: 'Configuración general del sistema y RAG actualizada.'
  });

  res.json(updated);
});

// Execute retention policy cleanup
router.post('/cleanup', (req, res) => {
  const cleaned = db.cleanupOldData();

  db.addAuditLog({
    userId: req.user!.id,
    username: req.user!.username,
    action: 'DATA_RETENTION_CLEANUP',
    status: 'SUCCESS',
    ip: req.ip || '127.0.0.1',
    details: `Limpieza de retención ejecutada. ${cleaned} conversaciones purgadas.`
  });

  res.json({ success: true, purgedConversations: cleaned });
});

// Reset demo state
router.post('/reset-demo', (req, res) => {
  db.resetToSeed();

  db.addAuditLog({
    userId: req.user!.id,
    username: req.user!.username,
    action: 'DEMO_RESET',
    status: 'SUCCESS',
    ip: req.ip || '127.0.0.1',
    details: 'Base de conocimiento y usuarios restaurados a estado de demostración.'
  });

  res.json({ success: true, message: 'Estado de demostración restaurado.' });
});

export default router;
