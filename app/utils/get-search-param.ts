export function getSearchParam(request: Request): string | null {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    if (typeof query !== 'string' || query.trim().length === 0) {
        return null;
    }
    return query;
}
