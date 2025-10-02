# OpenAI Chat Completions API Example

Next.js application using the OpenAI [Chat Completions API](https://platform.openai.com/docs/guides/chat). It streams [responses](https://platform.openai.com/docs/api-reference/chat/streaming) and can call custom [functions](https://platform.openai.com/docs/guides/function-calling).

Made on the base of the example project [OpenAI Assistants Quickstart](https://github.com/openai/openai-assistants-quickstart) from OpenAI, which uses deprecated Assistants API.

### 1. Set your [OpenAI API key](https://platform.openai.com/api-keys)

Save your key to `.env.example` and rename the file to `.env`, then add it to .gitignore.

### 2. Install dependencies

```shell
npm install
```

### 3. Run

```shell
npm run dev
```

Then navigate to [http://localhost:3000](http://localhost:3000).

## Overview

The main chat logic is implemented in the `Chat` component (`app/components/chat.tsx`) with the API route handler in `app/api/chat/route.ts`. The components and API routes provide a foundation for building your own chat interface with the Chat Completions API.

## Files and Components

-   `app/components/chat/chat.tsx`: Main chat UI and logic
-   `app/components/widget/weather-widget.tsx`: Weather display widget
-   `app/api/chat/route.ts`: Chat API handler
-   `app/api/weather/route.ts`: Weather API handler

## Routes

-   Home: [http://localhost:3000](http://localhost:3000)
-   Weather: [http://localhost:3000/examples/weather](http://localhost:3000/examples/weather)
-   Basic chat: [http://localhost:3000/examples/basic-chat](http://localhost:3000/api/basic-chat)
