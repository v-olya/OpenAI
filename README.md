# Small app to trying out the modern generative AI APIs

The app demonstrates OpenAI and Google GenAI integrations for chat, agentic search, image generation and weather lookup. Built with Next.js, TypeScript, and the official OpenAI and Google GenAI SDKs.

## Acknowledgements

This project was inspired by and created from the OpenAI "assistants quickstart" example: https://github.com/openai/openai-assistants-quickstart.

## Pages

-   `/basic-chat` — Chat UI demonstrating streaming chat via OpenAI Chat Completions. Implements a client that sends messages to `/api/basic-chat` and renders partial responses. Related code: `app/pages/basic-chat`, `app/components/chat`.
-   `/news-search` — News search UI that queries `/api/news-search?q={region}`, receives up to 3 structured previews (title, summary, sources, imagePrompt) and displays them. The UI allows requesting images for previews from `/api/gen-image`. Related files: `app/pages/news-search`, `app/components/chat`.
-   `/weather` — Weather lookup page that queries `/api/weather?q={some-text-including-locality}`, displays the canonical weather object and a weather widget. Related files: `app/pages/weather`, `app/components/widget`, and `app/components/left-panel` for layout.
-   `/` — Home page. A simple landing page and entry into the app (located at `app/page.tsx`).

These pages wire the API routes to the UI using shared components in `app/components` and hooks in `app/hooks`.

## Routes

All routes live under `/api` and are implemented as Next.js Route Handlers.

-   GET /api/news-search?q={region}

    -   Description: Performs a web search (via the Responses API web_search tool) for today's news in the specified region and returns up to 3 unrelated news previews. Each preview includes: `title`, `summary`, `sources` (array of `{domain,url}`), and `imagePrompt`.
    -   Model: Uses the Responses API (model `gpt-5-nano`) with a strict Zod `text` format schema.
    -   Response: JSON `{ previews: Preview[], error: string | null }` or an `error` object describing parsing/validation issues.

    -   Notes: Image generation is intentionally handled by `POST /api/gen-image` using the `imagePrompt` returned for each preview.

-   POST /api/gen-image

    -   Description: Uses `@google/genai` (Gemini image model) to generate an image for a provided `prompt`. Returns a base64 data URL and attempts to persist a PNG to `public/genAI` when possible.
    -   Input: JSON `{ "prompt": "..." }`
    -   Response: JSON `{ "image": "data:image/png;base64,..." }` or `{ "error": "IMAGE_GENERATION_FAILED" }` on failure.
    -   Notes: The server will silently ignore filesystem write errors (so generation still returns a data URL even if saving fails).

-   POST /api/basic-chat

    -   Description: Streaming chat endpoint that proxies client chat messages to the OpenAI Chat Completions API and returns a newline-delimited JSON stream of partial content chunks.
    -   Input: JSON body `{ "messages": [ { role, content, ... } ] }` where `messages` follows OpenAI chat message shape.
    -   Model: `gpt-4.1` (streaming)
    -   Response: Stream of lines like `{"type":"content","content":"..."}` followed by newlines. The stream may include a final error chunk if something fails.

-   GET /api/weather?q={some-text-including-locality}
    -   Description: Detects the city from the query using the Responses API with a `function` tool. The server implements `get_weather` which calls Nominatim to geocode and Open-Meteo for current weather.
    -   Model: `gpt-4.1` (Responses API with function/tool call)
    -   Response: JSON with the canonical weather object `{ location, resolvedName, temperature, windspeed, weathercode, timezone, error }` or an error explaining issues.

## Environment variables

-   `OPENAI_API_KEY` — required for the `openai` SDK to authenticate.
-   `GEMINI_API_KEY` — API key accepted by the `@google/genai` integration in this repo (Gemini / Google GenAI).

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
