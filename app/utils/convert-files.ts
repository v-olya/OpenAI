import { textFileToPdfFile } from '@/utils/text2pdf';

export type ConvertFilesOptions = {
    // list of extensions considered text-like (optional override)
    textExtensions?: RegExp;
};

const DEFAULT_EXT = /\.(txt|py|md|csv|json|log|yaml|yml)$/i;

// Convert text-like files to PDFs and leave other files untouched.

export async function convertFiles(
    files: File[],
    opts: ConvertFilesOptions = {}
): Promise<File[]> {
    const extLike = opts.textExtensions ?? DEFAULT_EXT;
    const processed: File[] = [];
    const convertedNames: string[] = [];
    const failedNames: string[] = [];

    for (const f of files) {
        const isText =
            (f.type && f.type.startsWith('text/')) || extLike.test(f.name);
        if (!isText) {
            // non-text files are left untouched
            processed.push(f);
            continue;
        }

        try {
            const pdf = await textFileToPdfFile(f);
            convertedNames.push(f.name);
            processed.push(pdf);
        } catch (err) {
            console.warn('ConvertFiles: failed to convert', f.name, err);
            failedNames.push(f.name);
            processed.push(f);
        }
    }

    if (convertedNames.length || failedNames.length) {
        const detail = { converted: convertedNames, failed: failedNames };
        window.dispatchEvent(
            new CustomEvent('openai:fileConverted', { detail })
        );
    }

    return processed;
}
