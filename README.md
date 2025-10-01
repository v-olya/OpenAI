# OpenAI Chat Completions API Example

Small Next.js application using the OpenAI [Chat Completions API](https://platform.openai.com/docs/guides/chat) with streaming responses and function calling.

Made on the base of [OpenAI Assistants Quickstart](https://github.com/openai/openai-assistants-quickstart)

### 1. Set your [OpenAI API key](https://platform.openai.com/api-keys)

Set your key in `.env.example` and rename it to `.env`. Add it to .gitignore.

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

This project demonstrates using the OpenAI Chat Completions API in a Next.js application with [streaming responses](https://platform.openai.com/docs/api-reference/chat/streaming) and [function calling](https://platform.openai.com/docs/guides/function-calling).

The main chat logic is implemented in the `Chat` component (`app/components/chat.tsx`) with the API route handler in `app/api/chat/route.ts`. The components and API routes provide a foundation for building your own chat interface with the Chat Completions API.

### Example Pages

- Basic Chat: [http://localhost:3000/examples/basic-chat](http://localhost:3000/examples/basic-chat)
- Function Calling (Weather): [http://localhost:3000/examples/function-calling](http://localhost:3000/examples/function-calling)
- All in the same page: [http://localhost:3000/examples/all](http://localhost:3000/examples/all)
