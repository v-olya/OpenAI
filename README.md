![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4.1-green?style=flat-square&logo=openai)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=flat-square&logo=typescript)

A Next.js application demonstrating OpenAI's Chat Completions API and Responses API with function calling.

## General info

### Prerequisites

-   Node.js 18+ installed
-   OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Set up

1. **Clone the repository**

    ```bash
    git clone <your-repo-url>
    cd openai-weather-chat
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Create the environment variables**

    ```bash
    # Copy the example file
    cp .env.example .env

    # Add your OpenAI API key to .env
    OPENAI_API_KEY=your_api_key_here
    ```

4. **Run the development server**

    ```bash
    npm run dev
    ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Routes

-   **Home**: [http://localhost:3000](http://localhost:3000) - Main navigation page
-   **Weather Demo**: [/pages/weather](http://localhost:3000/pages/weather) - Chat interface with weather widget
-   **Basic Chat**: [/pages/basic-chat](http://localhost:3000/pages/basic-chat) - Simple chat interface

## Architecture

### Frontend Components

-   **`Chat`** (`app/components/chat/`) - Main chat interface with message handling
-   **`WeatherWidget`** (`app/components/widget/`) - Weather display with icons and animations
-   **Responsive Design** - CSS modules with mobile-first approach

### Backend APIs

-   **`/api/chat`** - Chat Completions API with streaming responses
-   **`/api/weather`** - Responses API with function calling for weather queries
-   **Weather Utils** (`app/utils/weather.ts`) - External API integrations

### Data Flow

**Basic Chat Flow:**

1. User message sent to `/api/chat`
2. Chat Completions API processes with streaming
3. Response streamed back to chat interface

**Weather Query Flow:**

1. User types weather query
2. Sent to `/api/weather` endpoint
3. Responses API extracts city using function calling
4. App geocodes location (OpenStreetMap Nominatim)
5. Weather data fetched (Open-Meteo API)
6. Results displayed in chat and weather widget

**Example Queries**

Try these natural language queries:

-   "What's the weather in Paris?"
-   "Why don't I fly to Hawaii for a week?"
-   "Is it sunny in Miami?"
-   "NY"

## Project Structure

```
app/
├── components/
│   ├── chat/                 # Chat interface
│   │   ├── chat.tsx
│   │   └── chat.module.css
│   └── widget/               # Weather widget
│       ├── weather-widget.tsx
│       └── weather-widget.module.css
├── examples/
│   ├── basic-chat/           # Simple chat demo
│   └── weather/              # Weather demo
├── api/
│   └── weather/              # Weather API endpoint
├── utils/
│   └── weather.ts            # Weather utilities
├── types.ts                  # TypeScript definitions
└── globals.css               # Global styles
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

-   Built on the foundation of [OpenAI Assistants Quickstart](https://github.com/openai/openai-assistants-quickstart)
-   Weather data provided by [Open-Meteo](https://open-meteo.com/)
-   Geocoding by [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org/)
-   Powered by [OpenAI GPT-4.1](https://openai.com/)
