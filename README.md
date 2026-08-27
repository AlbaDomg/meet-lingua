# 🎙️ Meetlingua AI

**Meetlingua AI** es una aplicación web lista para producción diseñada para capturar reuniones de trabajo multilingües (especialmente sesiones rápidas o largas en alemán), transcribir el audio con alta fidelidad mediante **OpenAI Whisper (`whisper-1`)** y analizar/traducir automáticamente el contenido generando un informe técnico estructurado en **español** con **`gpt-4o`**.

---

## ✨ Características Principales

1. **Captura Dual de Audio en Vivo (Navegador):**
   - Combina el audio del sistema o pantalla compartida (`getDisplayMedia` para llamadas de Zoom/Meet/Teams) con el micrófono del usuario (`getUserMedia`) en un único stream unificado con `AudioContext`.
   - Grabación mediante `MediaRecorder` en formato `audio/webm`.
   - Controles de grabación: Iniciar, Pausar, Reanudar, Detener, Temporizador en tiempo real y visualizador de onda de audio interactivo (Canvas).

2. **Carga Manual de Archivos (Dropzone):**
   - Área de drag-and-drop para subir grabaciones preexistentes en formatos `.mp3`, `.m4a`, `.wav`, `.webm`.
   - Validación de archivos de hasta 25 MB por reunión.

3. **Pipeline de Inteligencia Artificial:**
   - **Paso 1 (Whisper STT):** Transcripción en alemán con prompt técnico personalizado (*software, arquitectura web, frontend, backend, hosting, UI/UX, despliegues*).
   - **Paso 2 (Análisis GPT-4o):** Generación de un informe estructurado en JSON y Markdown en español con:
     - **Resumen Ejecutivo:** Visión general de los temas clave.
     - **Ideas y Propuestas del Interlocutor:** Desglose detallado de lo que Dirk/interlocutor construyó, propuso o explicó.
     - **Acuerdos y Decisiones:** Resoluciones pactadas.
     - **Action Items & Próximos Pasos:** Lista de tareas pendientes con responsables y prioridades (Alta, Media, Baja).
     - **Glosario / Términos Técnicos:** Explicación en español de nombres de herramientas, jerga o proyectos.

4. **Interfaz de Usuario (UI/UX):**
   - Modo oscuro minimalista con efectos glassmorphism y aceleración por GPU.
   - **Pestaña 1:** Informe en Español (versión visual interactiva + Markdown renderizado + copiar al portapapeles + exportar a `.md` o PDF/Imprimir).
   - **Pestaña 2:** Transcripción Original en Alemán con buscador de texto en tiempo real y resaltado de coincidencias.
   - **Historial Local:** Almacenamiento automático en `localStorage` de las reuniones procesadas para consultar, filtrar o eliminar en cualquier momento.
   - **Ajustes de Clave API:** Modal interactivo para configurar la clave de OpenAI directamente desde la interfaz si no se configuró `.env.local`.

---

## 🛠️ Stack Tecnológico

- **Frontend:** Next.js (App Router), React 18, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend:** Next.js API Routes (`/api/process` con soporte multipart/form-data para subida de audio).
- **IA SDK:** Official OpenAI Node.js SDK (`whisper-1` & `gpt-4o`).

---

## 🚀 Instrucciones de Inicio Rápido

### 1. Requisitos Previos
- Node.js 18+ instalado.
- Una clave API de OpenAI con acceso a `whisper-1` y `gpt-4o`.

### 2. Configurar Variables de Entorno
Crea un archivo `.env.local` en la raíz del proyecto basándote en `.env.example`:

```bash
cp .env.example .env.local
```

Edita `.env.local` y agrega tu clave de OpenAI:

```env
OPENAI_API_KEY=sk-proj-tu_clave_aqui...
```

*(Nota: Si dejas la variable vacía, también podrás ingresar tu clave directamente en la interfaz web de la aplicación en el botón "API Key").*

### 3. Instalar Dependencias

```bash
npm install
```

### 4. Ejecutar Servidor de Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### 5. Compilar para Producción

```bash
npm run build
npm start
```

---

## 📌 Guía de Uso de Captura Dual

Para capturar tanto **tu voz** como **el audio de la persona que habla en Zoom/Meet/Teams**:
1. Haz clic en **"Iniciar Grabación Dual"**.
2. Tu navegador solicitará permiso para acceder al **Micrófono** (acepta).
3. A continuación, el navegador te pedirá seleccionar una pantalla o pestaña para compartir. Selecciona la ventana de Zoom o la pestaña del navegador y **marca la casilla "Compartir audio del sistema"** (System Audio).
4. Al finalizar la reunión, haz clic en **"Finalizar y Transcribir"**.
