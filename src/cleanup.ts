import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * 图片引用信息
 */
interface ImageReference {
    /** 图片在文档中的相对路径，如 .test/img_123.png */
    relativePath: string;
    /** 图片的完整路径 */
    fullPath: string;
}

/**
 * 从 Markdown 文档中提取所有图片引用路径
 */
export function extractImageReferences(docText: string): string[] {
    const references: string[] = [];
    // 匹配 Markdown 图片语法: ![alt](path) 或 ![](path)
    const regExp = /!\[.*?\]\(([^)]+)\)/g;
    let match;

    while ((match = regExp.exec(docText)) !== null) {
        const imgPath = match[1].trim();
        // 只处理相对路径引用（以 ./ 或 ../ 开头）
        if (imgPath.startsWith('./') || imgPath.startsWith('../')) {
            references.push(imgPath);
        }
    }

    return references;
}

/**
 * 获取 Markdown 文档对应的隐藏图片文件夹路径
 */
export function getImageFolderPath(docPath: string): string {
    const folderName = `.${path.basename(docPath, '.md')}`;
    return path.join(path.dirname(docPath), folderName);
}

/**
 * 检查图片文件夹是否存在
 */
export function imageFolderExists(docPath: string): boolean {
    const folderPath = getImageFolderPath(docPath);
    return fs.existsSync(folderPath);
}

/**
 * 扫描隐藏文件夹中的图片文件，找出未被文档引用的图片
 * @param docPath Markdown 文档路径
 * @returns 未被引用的图片文件路径列表
 */
export function findUnreferencedImages(docPath: string): string[] {
    const folderPath = getImageFolderPath(docPath);

    if (!fs.existsSync(folderPath)) {
        return [];
    }

    // 读取文档内容
    let docText: string;
    try {
        docText = fs.readFileSync(docPath, 'utf-8');
    } catch {
        return [];
    }

    // 提取所有图片引用
    const references = extractImageReferences(docText);

    // 获取文件夹中所有图片文件
    let imageFiles: string[];
    try {
        imageFiles = fs.readdirSync(folderPath).filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'].includes(ext);
        });
    } catch {
        return [];
    }

    // 找出未被引用的图片
    const unreferenced: string[] = [];
    const folderName = path.basename(folderPath);

    for (const file of imageFiles) {
        const relativeRef = `./${folderName}/${file}`;
        // 检查文档中是否包含该引用
        if (!references.includes(relativeRef)) {
            unreferenced.push(path.join(folderPath, file));
        }
    }

    return unreferenced;
}

/**
 * 清理未被引用的图片文件
 * @param docPath Markdown 文档路径
 * @param showNotification 是否显示通知
 * @returns 被清理的文件数量
 */
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
                    `已自动清理未引用的图片: ${path.basename(filePath)}`
                );
            }
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            console.error(`清理图片失败: ${filePath}`, errMsg);
        }
    }

    // 如果文件夹为空，尝试删除文件夹
    try {
        const folderPath = path.dirname(unreferencedFiles[0]);
        const remainingFiles = fs.readdirSync(folderPath);
        if (remainingFiles.length === 0) {
            fs.rmdirSync(folderPath);
        }
    } catch {
        // 忽略文件夹删除失败
    }

    return cleanedCount;
}

/**
 * 监听文档变化，检测图片引用删除并自动清理
 * 使用防抖机制避免频繁操作
 */
export function createCleanupListener(): vscode.Disposable {
    let debounceTimer: NodeJS.Timeout | undefined;

    return vscode.workspace.onDidChangeTextDocument((e: vscode.TextDocumentChangeEvent) => {
        if (e.document.languageId !== 'markdown') return;

        const config = vscode.workspace.getConfiguration('markdown-picture-paste');
        const enabled = config.get<boolean>('enableAutoCleanup', true);
        const showNotification = config.get<boolean>('showCleanupNotification', true);

        if (!enabled) return;

        // 检查是否有删除操作
        const hasDeletion = e.contentChanges.some(change => {
            return change.text === '' && change.rangeLength > 0;
        });

        if (!hasDeletion) return;

        // 防抖：延迟 2 秒执行清理
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

/**
 * 手动执行一次完整清理（命令调用）
 */
export function registerCleanupCommand(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.commands.registerCommand('markdown-picture-paste.cleanup', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') {
            vscode.window.showWarningMessage('请在 Markdown 文件中执行此命令');
            return;
        }

        const docPath = editor.document.fileName;
        const cleanedCount = cleanupUnreferencedImages(docPath, true);

        if (cleanedCount > 0) {
            vscode.window.showInformationMessage(`清理完成，共删除 ${cleanedCount} 个未引用的图片文件`);
        } else {
            vscode.window.showInformationMessage('没有发现未引用的图片');
        }
    });
}
