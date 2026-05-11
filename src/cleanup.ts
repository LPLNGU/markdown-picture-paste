import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { t } from './localize';

interface ImageReference {
    relativePath: string;
    fullPath: string;
}

export function extractImageReferences(docText: string): string[] {
    const references: string[] = [];
    const regExp = /!\[.*?\]\(([^)]+)\)/g;
    let match;

    while ((match = regExp.exec(docText)) !== null) {
        const imgPath = match[1].trim();
        if (imgPath.startsWith('./') || imgPath.startsWith('../')) {
            references.push(imgPath);
        }
    }

    return references;
}

export function getImageFolderPath(docPath: string): string {
    const folderName = `.${path.basename(docPath, '.md')}`;
    return path.join(path.dirname(docPath), folderName);
}

export function imageFolderExists(docPath: string): boolean {
    const folderPath = getImageFolderPath(docPath);
    return fs.existsSync(folderPath);
}

export function findUnreferencedImages(docPath: string): string[] {
    const folderPath = getImageFolderPath(docPath);

    if (!fs.existsSync(folderPath)) {
        return [];
    }

    let docText: string;
    try {
        docText = fs.readFileSync(docPath, 'utf-8');
    } catch {
        return [];
    }

    const references = extractImageReferences(docText);

    let imageFiles: string[];
    try {
        imageFiles = fs.readdirSync(folderPath).filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'].includes(ext);
        });
    } catch {
        return [];
    }

    const unreferenced: string[] = [];
    const folderName = path.basename(folderPath);

    for (const file of imageFiles) {
        const relativeRef = `./${folderName}/${file}`;
        if (!references.includes(relativeRef)) {
            unreferenced.push(path.join(folderPath, file));
        }
    }

    return unreferenced;
}

export function cleanupUnreferencedImages(
    docPath: string,
    showNotification: boolean = true
): number {
    const unreferencedFiles = findUnreferencedImages(docPath);

    if (unreferencedFiles.length === 0) {
        return 0;
    }

    let cleanedCount = 0;

    for (const filePath of unreferencedFiles) {
        try {
            fs.unlinkSync(filePath);
            cleanedCount++;

            if (showNotification) {
                vscode.window.showInformationMessage(
                    t('auto_cleaned') + path.basename(filePath)
                );
            }
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            console.error(`cleanup failed: ${filePath}`, errMsg);
        }
    }

    try {
        const folderPath = path.dirname(unreferencedFiles[0]);
        const remainingFiles = fs.readdirSync(folderPath);
        if (remainingFiles.length === 0) {
            fs.rmdirSync(folderPath);
        }
    } catch {
        // ignore
    }

    return cleanedCount;
}

export function createCleanupListener(): vscode.Disposable {
    let debounceTimer: NodeJS.Timeout | undefined;

    return vscode.workspace.onDidChangeTextDocument((e: vscode.TextDocumentChangeEvent) => {
        if (e.document.languageId !== 'markdown') return;

        const config = vscode.workspace.getConfiguration('markdown-picture-paste');
        const enabled = config.get<boolean>('enableAutoCleanup', true);
        const showNotification = config.get<boolean>('showCleanupNotification', true);

        if (!enabled) return;

        const hasDeletion = e.contentChanges.some(change => {
            return change.text === '' && change.rangeLength > 0;
        });

        if (!hasDeletion) return;

        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        debounceTimer = setTimeout(() => {
            const docPath = e.document.fileName;
            if (docPath && fs.existsSync(docPath)) {
                cleanupUnreferencedImages(docPath, showNotification);
            }
            debounceTimer = undefined;
        }, 2000);
    });
}

export function registerCleanupCommand(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.commands.registerCommand('markdown-picture-paste.cleanup', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') {
            vscode.window.showWarningMessage(t('run_in_markdown'));
            return;
        }

        const docPath = editor.document.fileName;
        const cleanedCount = cleanupUnreferencedImages(docPath, true);

        if (cleanedCount > 0) {
            vscode.window.showInformationMessage(t('cleanup_done') + String(cleanedCount) + t('cleanup_files'));
        } else {
            vscode.window.showInformationMessage(t('no_unreferenced'));
        }
    });
}
