# Guía de Ejecución en Windows

Esta guía detalla los pasos para ejecutar la aplicación Vicente en entornos Windows (Windows 10, Windows 11 o Windows Server) utilizando Node.js o Docker.

---

## Requisitos Previos

1. **Node.js**: Versión 18 o superior (se recomienda 20 LTS o 22 LTS).
   - Descarga oficial: [https://nodejs.org/](https://nodejs.org/)
   - Verifica la instalación abriendo **PowerShell** o **Símbolo del sistema (CMD)**:
     ```powershell
     node -v
     npm -v
     ```
2. **Git para Windows** (opcional, para clonar repositorios):
   - Descarga oficial: [https://git-scm.com/download/win](https://git-scm.com/download/win)

---

## Paso a Paso con PowerShell / CMD

### 1. Navegar a la carpeta del proyecto
Abre PowerShell y navega al directorio del proyecto:
```powershell
cd C:\ruta\a\vicente-rag
```

### 2. Configurar Variables de Entorno
Copia el archivo `.env.example` a `.env`:
```powershell
Copy-Item .env.example .env
```
Si dispones de una clave de API de Gemini, edita el archivo `.env` con Bloc de notas o VS Code:
```powershell
notepad .env
```
Coloca tu clave en la variable:
```env
GEMINI_API_KEY="tu_clave_aqui"
APP_SECRET="clave_secreta_para_firmar_sesiones_jwt"
PORT=3000
```
> *Nota: Si no configuras una clave de API de Gemini, el sistema continuará funcionando en modo de síntesis extractiva documental determinista sin fallar.*

### 3. Instalar Dependencias
Ejecuta la instalación de paquetes:
```powershell
npm install
```

### 4. Ejecutar Pruebas Automatizadas de Seguridad
Para verificar que los 12 requisitos de seguridad y RAG se cumplen:
```powershell
npm test
```
Deberás observar los 12 tests pasando en verde.

### 5. Iniciar la Aplicación en Modo Desarrollo
Para iniciar el servidor con recarga en caliente:
```powershell
npm run dev
```
Abre tu navegador en:
```
http://localhost:3000
```

### 6. Compilar y Ejecutar en Modo Producción
Para crear la versión optimizada de producción:
```powershell
npm run build
npm run start
```

---

## Solución de Problemas Comunes en Windows

1. **Error de política de ejecución de scripts en PowerShell (`PSSecurityException`)**:
   Si recibes el error `No se puede cargar el archivo porque la ejecución de scripts está deshabilitada en este sistema`, ejecuta en PowerShell como Administrador:
   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
   ```
2. **Puerto 3000 ocupado**:
   Si otro proceso está utilizando el puerto 3000, cambia la variable `PORT` en tu `.env` a `3001` o `8080`, o libera el puerto:
   ```powershell
   netstat -ano | findstr :3000
   taskkill /PID <NUMERO_PID> /F
   ```
