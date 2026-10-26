# Guía de Configuración de Modelos de Inteligencia Artificial

Vicente utiliza una arquitectura de IA modular que separa la recuperación de documentos de la generación de texto.

---

## 1. Configuración de Google Gemini (`@google/genai`)

El motor primario de generación utiliza el SDK oficial y moderno `@google/genai` ejecutado estrictamente en el backend del servidor (`server/gemini.ts`).

### Modelo Utilizado
- **Modelo de Texto**: `gemini-3.8-flash`
  - Optimizado para respuestas rápidas, estructuradas y precisas en español.
  - Baja temperatura (`0.1`) para garantizar cero alucinación y máxima fidelidad documental.

### Obtención de la Clave API
1. Ingresa a [Google AI Studio](https://aistudio.google.com/).
2. Haz clic en **Get API key** (Obtener clave de API).
3. Crea o selecciona un proyecto de Google Cloud.
4. Copia la clave generada.
5. Agrégala a tu archivo `.env`:
   ```env
   GEMINI_API_KEY="AIzaSy..."
   ```

### Cabecera de Telemetría Obligatoria
En concordancia con las pautas oficiales, el cliente se inicializa en el servidor con la cabecera `User-Agent: aistudio-build`:
```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});
```

---

## 2. Modo Desconectado / Fallback Determinista

Si la aplicación se inicia sin una clave de API configurada en `.env`, o si el servicio externo experimenta intermitencias:

1. El sistema **no colapsa ni interrumpe su funcionamiento**.
2. El motor RAG activa el sintetizador extractivo documental:
   - Recupera los fragmentos autorizados de mayor coincidencia utilizando el algoritmo híbrido BM25/TF-IDF.
   - Presenta la respuesta oficial directamente respaldada por el manual o documento interno.
   - Si no se encuentra evidencia relevante, emite exactamente la frase obligatoria:
     > *"No encontré esa respuesta en las fuentes internas. Para mantenerme dentro de los documentos, no voy a improvisar."*

Esto garantiza que las pruebas automatizadas, demostraciones locales y entornos de alta seguridad sin salida a internet puedan operar con total normalidad.

---

## 3. Adaptación a otros Proveedores (OpenAI, Claude, Llama Local)

Para conectar otro proveedor como OpenAI:
1. Reemplazar la función `generateRAGAnswer` en `server/gemini.ts`.
2. Mantener intacta la firma:
   ```typescript
   export async function generateRAGAnswer(
     systemInstruction: string,
     userPrompt: string
   ): Promise<string | null>
   ```
3. El motor RAG (`server/rag.ts`) continuará aplicando todas las salvaguardas de aislamiento, anti-inyección y autorización previa sin necesidad de modificar el resto de la aplicación.
