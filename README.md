# A demo app to try out the modern generative AI APIs

The app demonstrates OpenAI and Google GenAI integrations for chat, code interpreter, agentic search with reasoning, image generation, function calling, etc. Built with Next.js, TypeScript, and the official OpenAI and Google GenAI SDKs.

## Acknowledgements

This project was inspired by OpenAI's "assistants quickstart" example: https://github.com/openai/openai-assistants-quickstart, but does not use the Assistants API due to its deprecated status.

## Pages

-   `/news-search` — News search UI that queries `/api/news-search?q={region}` and displays up to 3 structured previews with generated images. The model is instructed to return previews for the **latest well-backed news of top importance for a given region**. Related files: `app/pages/news-search`, `/api/gen-image`, `app/components/chat`.
-   `/coding` — A page for coding assistance that sends code and context to `/api/coding`. Receives the text output and downloadable links to newly created files, if any. The user can choose one of the **ready-to-use preset inputs** with the files uploaded. Related files: `app/pages/coding`, `app/components/chat`, and `app/components/left-panel` for layout.
-   `/weather` — Weather lookup page that queries `/api/weather?q={some-text-including-locality}`, receives the canonical wheather object for the detected locality and displays it in a widget. Respects local time to show day and night icons. Related files: `app/pages/weather`, `app/components/widget`.
-   `/basic-chat` — Chat UI with streaming. Implements a client that sends messages to `/api/basic-chat` and renders partial responses. Related code: `app/pages/basic-chat`, `app/components/chat`.
-   `/` — Home page. A simple landing page and entry into the app (located at `app/page.tsx`).

These pages wire the API routes to the UI using shared components in `app/components` and hooks in `app/hooks`.

## Routes

All routes live under `/api` and are implemented as Next.js App Route Handlers.

-   GET `/api/news-search?q={region}` — Performs a search (using the OpenAI Responses API web_search tool) for today's news in the specified region. Returns up to 3 previews of well-backed news and generated `imagePrompts` for them.
-   POST `/api/gen-image` (image generation via Google GenAI) returns base64 data URLs based on the given text prompts.

-   POST `/api/coding` — Handles file uploads via the Responses API and file conversions to PDF (for the inputs to be accepted by the code_interpreter tool). Returns model's text output and downloadable links to the container files.
-   GET `/api/coding/file?containerId=...&fileId=...` — Used to download generated files from a container.
-   POST `/api/coding/cleanup` — Used to remove uploaded files from the OpenAI storage when a session ends. Invoked also by navigator.sendBeacon on page hide event.
-   GET `/api/weather?q={some-text-including-locality}` — Detects and resolves the queried locality (Responses API with function/tool call) and returns canonical weather data by calling geocoding and weather services.
-   POST `/api/basic-chat` — Forwards client messages to the OpenAI Chat Completions API and streams partial text chunks back to the client.

## Environment variables

-   `OPENAI_API_KEY` — API key required for the `openai` SDK
-   `GEMINI_API_KEY` — API key required by the `@google/genai`.

## Scripts

From `package.json`:

-   `npm run dev` — start dev server (opens browser to http://localhost:3000).
-   `npm run build` — build for production.
-   `npm start` — start the production server.
-   `npm test` — run Jest tests.

## How to run locally

1. Install dependencies:

```powershell
npm install
```

2. Set required environment variables: edit the example.env and rename it to .env

3. Start dev server:

```powershell
npm run dev
```
