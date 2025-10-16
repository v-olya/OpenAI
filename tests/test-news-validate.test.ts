// Local validation tests for news-search preview domain counting using Jest + TS

type Source = { domain?: string; url?: string };

function normalizeDomain(domain: string | undefined) {
    if (!domain) return '';
    const d = domain.toLowerCase().trim();
    return d.startsWith('www.') ? d.slice(4) : d;
}

function domainFromSource(src?: Source) {
    if (!src || typeof src !== 'object') return '';
    if (typeof src.domain === 'string' && src.domain.trim().length > 0)
        return normalizeDomain(src.domain);
    if (typeof src.url === 'string' && src.url.trim().length > 0) {
        try {
            const u = new URL(src.url);
            return normalizeDomain(u.hostname);
        } catch {
            return '';
        }
    }
    return '';
}

function validateParsed(parsed: Array<any>) {
    const previewDiagnostics: Array<{
        title: string;
        domains: string[];
        unique: string[];
    }> = [];
    const invalid = parsed.some((p) => {
        const item = p && typeof p === 'object' ? p : {};
        const sources: Source[] = Array.isArray(item.sources)
            ? item.sources
            : [];
        const domains = sources
            .map((s) => domainFromSource(s))
            .filter((d): d is string => typeof d === 'string' && d.length > 0);
        const unique: string[] = Array.from(new Set(domains));
        const title = typeof item.title === 'string' ? item.title : '';
        previewDiagnostics.push({ title, domains, unique });
        return unique.length < 2;
    });
    return { invalid, previewDiagnostics };
}

function mockFetchSerpWithDomains(query: string, domains: string[]) {
    const results = Array.from({ length: 10 }).map((_, i) => {
        const domain = domains[i % domains.length];
        return {
            title: `Result ${i + 1} for ${query}`,
            snippet: `Snippet ${i + 1}`,
            url: `https://${domain}/${query.replace(/\s+/g, '-')}/${i + 1}`,
            domain,
            rank: i + 1,
        };
    });
    return { results };
}

function buildParsedFromResults(results: any[]) {
    return [
        {
            title: 'Preview 1',
            summary: 'Summary 1',
            sources: [results[0], results[1], results[2]],
            url: results[0].url,
        },
        {
            title: 'Preview 2',
            summary: 'Summary 2',
            sources: [results[3], results[4]],
            url: results[3].url,
        },
        {
            title: 'Preview 3',
            summary: 'Summary 3',
            sources: [results[5], results[6], results[7]],
            url: results[5].url,
        },
    ];
}

test('single-domain SERP should be invalid', () => {
    const single = mockFetchSerpWithDomains('Torino', ['example.com']);
    const parsedSingle = buildParsedFromResults(single.results);
    const resA = validateParsed(parsedSingle);
    expect(resA.invalid).toBe(true);
    for (const diag of resA.previewDiagnostics) {
        expect(Array.isArray(diag.unique)).toBe(true);
        expect(diag.unique.length).toBeLessThan(2);
    }
});

test('varied-domain SERP should be valid', () => {
    const varied = mockFetchSerpWithDomains('Torino', [
        'example.com',
        'news.example.org',
        'localnews.it',
        'blog.example.com',
        'another-source.net',
    ]);
    const parsedVaried = buildParsedFromResults(varied.results);
    const resB = validateParsed(parsedVaried);
    expect(resB.invalid).toBe(false);
    for (const diag of resB.previewDiagnostics) {
        expect(Array.isArray(diag.unique)).toBe(true);
        expect(diag.unique.length).toBeGreaterThanOrEqual(2);
    }
});

test('mixed domains: some previews may be invalid', () => {
    const mixedDomains = [
        'example.com',
        'news.example.org',
        'example.com',
        'example.com',
        'localnews.it',
    ];
    const mixed = mockFetchSerpWithDomains('Torino', mixedDomains);
    const parsedMixed = [
        { title: 'Preview 1', sources: [mixed.results[0], mixed.results[1]] },
        { title: 'Preview 2', sources: [mixed.results[2], mixed.results[3]] }, // both example.com
        { title: 'Preview 3', sources: [mixed.results[4], mixed.results[1]] },
    ];
    const resC = validateParsed(parsedMixed);
    expect(resC.invalid).toBe(true);
    const preview2 = resC.previewDiagnostics.find(
        (p) => p.title === 'Preview 2'
    );
    expect(preview2).toBeDefined();
    expect(preview2!.unique.length).toBeLessThan(2);
});
