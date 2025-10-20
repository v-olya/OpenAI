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
    const converted: File[] = [];
    let anyConverted = false;

    for (const f of files) {
        const isText =
            (f.type && f.type.startsWith('text/')) || extLike.test(f.name);
        if (!isText) {
            converted.push(f);
            continue;
        }

        try {
            const pdf = await textFileToPdfFile(f);
            converted.push(pdf);
            anyConverted = true;
        } catch (err) {
            console.warn('ConvertFiles: failed to convert', f.name, err);
            converted.push(f);
        }
    }
    if (anyConverted) {
        try {
            window.dispatchEvent(new CustomEvent('openai:fileConverted'));
        } catch (e) {
            console.warn('convertFiles: failed to dispatch fileConverted', e);
        }
    }

    return converted;
}
