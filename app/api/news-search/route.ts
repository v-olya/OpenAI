import { getSearchParam } from '@/utils/get-search-param';
import { client } from '@/utils/init-client';
import { ErrorMessages } from '@/utils/error-messages';
import { NextResponse } from 'next/server';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';

export async function GET(request: Request) {
    const query = getSearchParam(request);
    if (!query) {
        return NextResponse.json(
            { error: ErrorMessages.INVALID_QUERY },
            { status: 400 }
        );
    }
    const systemPrompt = `Please perform a web search on the today's news in ${query}.
        Do NOT mention particular websites in your search, either explicitly or implicitly.
        Based on the search results, provide up to 3 previews in English. While performing the task, exactly follow these STRICT RULES:

        1) The news chosen for previews MUST be published in the last 24 hours. 
        2) Prioritize national sources and socially impactful news. 
        3) The previews must describe unrelated events. "Unrelated" means the events must have different primary subjects or causes. If you end up with a group of related results, show one preview only.
        4) Return either a JSON object with the key "previews" (an array of preview objects) and "error": null, OR an error object with a single "error" string explaining the issue.
        5) Each preview object must contain exactly these fields: title, summary, sources, and imagePrompt and must be written in English.
            - title: synthesized (7-12 words). Do NOT include source headlines verbatim; synthesize across multiple results.
            - summary: synthesized, MAX 360 characters.
            - sources: array of objects {domain, url}. Every snippet MUST be backed by at least 2 sources on different domains. Within that preview, domains MUST be unique.
            - imagePrompt: a short descriptive prompt (<= 120 characters) for generating a single illustrative image.
        6) Do NOT guess or fabricate URLs or domains. Only include URLs/domains that were present in the web_search tool results. If a result URL is inaccessible (404), do NOT include it.
        7) A single URL/source MUST NOT be used to corroborate more than one preview. Do NOT reuse the same URL to corroborate multiple news.
        8) Return at most 3 preview objects in the "previews" array. Do NOT return empty or partial preview objects.
        9) Never hand back to the user. Your error messages MUST NOT include "you’d like", "I can", "Please", etc. `;

    const Preview = z
        .object({
            title: z.string(),
            // Preprocess summary: ensure it's a string and truncate to 360 chars
            summary: z.preprocess((val) => {
                const s = val == null ? '' : String(val);
                return s.length > 360 ? s.slice(0, 360) : s;
            }, z.string().max(360)),
            sources: z
                .array(
                    z.object({
                        domain: z.string(),
                        url: z.string(),
                    })
                )
                .min(1),
            imagePrompt: z.string(),
        })
        .strict();

    const News = z
        .object({
            previews: z.array(Preview).max(3),
            // error may be a string explaining why no results were found, or null
            error: z.union([z.string(), z.null()]),
        })
        .strict();
    try {
        const response = await client.responses.create({
            model: 'gpt-5-nano',
            reasoning: { effort: 'low' },
            tools: [
                {
                    type: 'web_search',
                    user_location: {
                        type: 'approximate',
                        region: query,
                    },
                },
            ],
            input: systemPrompt,
            text: {
                format: zodTextFormat(News, 'news'),
            },
        });
        const news = response.output_text;
        console.log('OpenAI news response:', response.output);

        // Parse the model output as JSON before validating against the News schema
        let parsedNews: unknown;
        try {
            parsedNews = typeof news === 'string' ? JSON.parse(news) : news;
        } catch (parseErr: unknown) {
            return NextResponse.json(
                { error: 'PARSE_ERROR', details: String(parseErr), raw: news },
                { status: 500 }
            );
        }

        const validation = News.safeParse(parsedNews);
        if (!validation.success) {
            return NextResponse.json(
                {
                    error: 'SCHEMA_VALIDATION_ERROR',
                    details: validation.error.issues,
                    raw: news,
                },
                { status: 500 }
            );
        }
        if (validation.data.error) {
            // validation.data.error is expected to be a string or null per schema.
            const errStr =
                typeof validation.data.error === 'string'
                    ? validation.data.error
                    : ErrorMessages.UNEXPECTED_RESPONSE;
            return NextResponse.json({ error: errStr }, { status: 200 });
        }
        // Image generation is handled by the dedicated /api/gen-image route.
        // The client will request generated images asynchronously after receiving previews.

        const previews = validation.data.previews || [];
        return NextResponse.json({
            previews,
            error: validation.data.error,
        });
    } catch (err) {
        return NextResponse.json(
            { error: 'INTERNAL_ERROR', details: err.message ?? String(err) },
            { status: 500 }
        );
    }
}
