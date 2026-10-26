# Guía de Despliegue en Producción

Este documento describe la arquitectura de despliegue para la aplicación Vicente RAG en entornos de producción empresariales.

---

## 1. Despliegue con Docker y Docker Compose (Recomendado)

El proyecto incluye un `Dockerfile` multi-etapa optimizado y un archivo `docker-compose.yml`.

### Construcción y arranque:
```bash
# 1. Crear el archivo .env de producción
cp .env.example .env
nano .env

# 2. Construir la imagen e iniciar el contenedor en segundo plano
docker-compose up -d --build

# 3. Verificar estado de los contenedores
docker-compose ps
docker-compose logs -f
```

La aplicación se ejecutará de forma aislada y expondrá el puerto `3000`.

---

## 2. Despliegue en Google Cloud Run / AWS ECS

Vicente está diseñado con arquitectura contenerizada stateless para la capa de procesamiento y persistencia atómica en volumen montado:

1. **Variables de entorno de producción**:
   - `NODE_ENV=production`
   - `PORT=3000`
   - `GEMINI_API_KEY`: Inyectada a través de Google Cloud Secret Manager o AWS Secrets Manager.
   - `APP_SECRET`: Generada con al menos 64 caracteres aleatorios (`openssl rand -hex 32`).

2. **Montaje de volumen para almacenamiento persistente**:
   - Montar el directorio `/app/data` en un volumen persistente (por ejemplo, Cloud Storage FUSE, EFS o disco persistente administrado) para conservar documentos cargados por administradores e historiales de conversaciones entre reinicios.

3. **Comando de construcción y subida**:
   ```bash
   gcloud builds submit --tag gcr.io/tu-proyecto/vicente-rag:v1
   gcloud run deploy vicente-rag \
     --image gcr.io/tu-proyecto/vicente-rag:v1 \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --port 3000
   ```

---

## 3. Lista de Verificación (Checklist) de Seguridad en Producción

- [x] **Claves API fuera del cliente**: La clave de API de Gemini (`GEMINI_API_KEY`) nunca se incluye en el bundle web ni se envía a navegadores.
- [x] **Tokens de sesión seguros**: Firmados con algoritmo HMAC SHA-256 usando `APP_SECRET`.
- [x] **Cabeceras de protección HTTP activadas**:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `X-XSS-Protection: 1; mode=block`
- [x] **Rate Limiting**: Activo por defecto a 60 solicitudes por minuto por IP/usuario.
- [x] **Validación de tipos de archivo**: Bloqueo de ejecutables (`.exe`, `.sh`, `.bat`, `.cmd`, `.js`, `.py`) en la carga de documentos de la base de conocimiento.
- [x] **Aislamiento horizontal (Anti-IDOR)**: Verificación obligatoria de propiedad en endpoints `/api/conversations/:id`.
- [x] **Aislamiento de categorías en Backend**: El cliente no puede acceder a fragmentos de categorías sin permiso mediante manipulación de parámetros.
