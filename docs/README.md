# Vicente - Asistente Virtual RAG Empresarial

Vicente es un asistente virtual de atención corporativa basado en **Retrieval-Augmented Generation (RAG)** de alta fidelidad, diseñado para responder consultas técnicas, operativas y comerciales utilizando **exclusivamente documentos internos y fuentes autorizadas**.

Inspirado en la lógica de atención del sitio de referencia, Vicente resuelve el desafío de las alucinaciones en modelos de lenguaje al implementar una política estricta de respuesta: **si no existe evidencia documental suficiente en la base de conocimiento autorizada para el usuario, el asistente se niega a improvisar**.

---

## 🚀 Características Principales

1. **RAG Estricto y Anti-Alucinación**:
   - Recuperación híbrida de fragmentos documentales (búsqueda semántica + frecuencia léxica BM25/TF-IDF).
   - Si no existe evidencia suficiente, responde textualmente:
     > *"No encontré esa respuesta en las fuentes internas. Para mantenerme dentro de los documentos, no voy a improvisar."*
   - Cita de referencias documentales verificables con fragmento exacto y puntaje de relevancia.

2. **Seguridad y Control de Acceso por Categoría en Backend**:
   - Categorías iniciales:
     1. `tiendas_agencias`: Directorio, sucursales y atención en mostrador.
     2. `garantias`: Pólizas, plazos de 12 a 24 meses, exclusiones y SLA de diagnóstico.
     3. `cedis`: Centros de distribución, citas de descarga, tarimas y embalaje.
     4. `diagnostico`: Códigos de error (E01 a E08), pruebas de voltaje y componentes.
     5. `informacion`: Misión, canales oficiales y aviso de privacidad.
     6. `cliente`: Facturación CFDI 4.0, devoluciones y reembolsos.
   - **Regla Inquebrantable**: La categoría seleccionada en el navegador jamás es tomada como autorización. El backend filtra los documentos y fragmentos **antes** de consultar el motor de IA. Si un usuario no autorizado intenta consultar una categoría, la petición es rechazada (403 Forbidden) sin revelar metadatos.

3. **Protección Ciberseguridad y Anti-IDOR**:
   - Protección contra referencias directas inseguras (IDOR): cada conversación pertenece estrictamente a su creador.
   - El historial de mensajes se valida en el servidor; no se confía en arrays de historial enviados por el cliente.
   - Aislamiento contra Prompt Injection: los documentos son inyectados como bloques de datos pasivos delimitados.
   - Limitador de frecuencia (Rate Limiting) configurable por IP y usuario.
   - Sanitización de archivos en carga de documentos (rechazo de ejecutables y extensiones maliciosas).

4. **Carga y Procesamiento Multiformato de Documentos**:
   - Soporte nativo para extracción de texto estructurado y fragmentación automática en RAG:
     - 📕 **PDF (`.pdf`)**: Extracción de texto y saltos de página con `pdf-parse`.
     - 📊 **Excel (`.xlsx`, `.xls`, `.csv`)**: Extracción de libros completos hoja por hoja con estructura tabular mediante `xlsx`.
     - 📽️ **PowerPoint (`.pptx`)**: Extracción de diapositivas individuales preservando títulos y viñetas mediante parser XML `adm-zip`.
     - 📝 **Word y Texto (`.docx`, `.txt`, `.md`, `.json`)**: Lectura de párrafos y contenido sin formato.
   - Vista previa interactiva de texto extraído antes de la fragmentación en el panel administrativo.

5. **Panel de Administración Protegido**:
   - Gestión de documentos (carga por arrastrar y soltar, lectura, cálculo de chunks y eliminación).
   - Gestión de categorías (crear, editar, activar/desactivar).
   - Gestión de usuarios y asignación granular de categorías permitidas.
   - Registro de auditoría en tiempo real (consultas, bloqueos y accesos denegados).
   - Ajuste de políticas de retención y límites de uso.

---

## 👥 Cuentas de Demostración Preconfiguradas

Para facilitar la evaluación de los controles de seguridad y los diferentes niveles de acceso, la aplicación incluye 4 perfiles con selector rápido (1-Click en pantalla de login):

| Usuario | Contraseña | Rol | Categorías Autorizadas | Propósito de Prueba |
|---|---|---|---|---|
| `admin` | `admin123` | Administrador | **Todas las 6 categorías (Total)** | Acceso completo a chat y Panel de Administración |
| `agente.soporte` | `agente123` | Agente | `garantias`, `diagnostico`, `cliente` | Prueba de consultas técnicas sin acceso a logística ni tiendas |
| `logistica.cedis` | `cedis123` | Usuario | `cedis`, `tiendas_agencias` | Prueba de consultas de distribución y bloqueo de garantías |
| `cliente.consulta` | `cliente123` | Usuario | `cliente`, `informacion` | Prueba de usuario final con acceso únicamente a trámites públicos |

---

## 📁 Estructura del Proyecto

```
├── /server.ts                  # Servidor Express Full-Stack con integración Vite
├── /server/
│   ├── types.ts                # Interfaces TypeScript del sistema
│   ├── db.ts                   # Base de datos persistente con JSON y motor de chunking
│   ├── seedData.ts             # Manuales oficiales, usuarios y categorías iniciales
│   ├── auth.ts                 # Middleware criptográfico, JWT y control de roles
│   ├── rag.ts                  # Motor RAG, búsqueda híbrida y filtro de autorización
│   ├── gemini.ts               # Cliente oficial @google/genai con gemini-3.8-flash
│   ├── rateLimiter.ts          # Limitador de tasa por IP / Usuario
│   └── routes/
│       ├── authRoutes.ts       # Endpoints de autenticación y sesiones
│       ├── chatRoutes.ts       # Endpoint POST /api/chat y gestión de conversaciones
│       └── adminRoutes.ts      # Endpoints protegidos de administración
├── /src/
│   ├── App.tsx                 # Orquestador principal de la UI
│   ├── main.tsx                # Punto de entrada React
│   ├── api.ts                  # Cliente API frontend tipado
│   ├── types.ts                # Tipos de interfaz de usuario
│   ├── index.css               # Configuración Tailwind CSS
│   └── components/
│       ├── Header.tsx          # Barra superior con estado de Vicente y perfil
│       ├── Sidebar.tsx         # Historial de chats y categorías autorizadas
│       ├── ChatView.tsx        # Interfaz de conversación y fuentes citadas
│       ├── CitationModal.tsx   # Modal de inspección de fragmento RAG
│       ├── AdminPanel.tsx      # Panel de administración completo (5 pestañas)
│       └── LoginModal.tsx      # Modal de inicio de sesión con selector de personas
├── /tests/
│   └── vicente-security.test.ts # Suite de 12 pruebas automatizadas en Vitest
├── /docs/                      # Documentación técnica completa
│   ├── README.md
│   ├── WINDOWS_SETUP.md
│   ├── DEPLOYMENT.md
│   ├── AI_CONFIGURATION.md
│   └── SECURITY_MATRIX.md
├── Dockerfile                  # Contenedor de producción
└── docker-compose.yml          # Despliegue listo para usar
```

---

## 🛠️ Ejecución Local Rápida

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar en modo desarrollo
npm run dev

# 3. Ejecutar pruebas automatizadas de seguridad
npm test
```

La aplicación estará disponible en `http://localhost:3000`.
