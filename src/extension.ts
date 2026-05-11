import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { saveClipboardImage, hasClipboardImage } from './clipboard';
import { createCleanupListener, registerCleanupCommand, getImageFolderPath } from './cleanup';

/**
 * 生成图片文件名
 */
function generateImageName(prefix: string, format: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6);
    return `${prefix}${timestamp}_${random}.${format}`;
}

/**
 * 粘贴图片到 Markdown 文档
 */
async function pasteImage(editor: vscode.TextEditor): Promise<void> {
    const doc = editor.document;
    const docPath = doc.fileName;

    // 获取配置
    const config = vscode.workspace.getConfiguration('markdown-picture-paste');
    const imageFormat = config.get<string>('imageFormat', 'png');
    const imagePrefix = config.get<string>('imagePrefix', 'img_');

    // 创建隐藏文件夹
    const targetDir = getImageFolderPath(docPath);
    if (!fs.existsSync(targetDir)) {
        try {
            fs.mkdirSync(targetDir, { recursive: true });
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`创建图片文件夹失败: ${errMsg}`);
            return;
        }
    }

    // 检查剪贴板是否有图片
    const hasImage = await hasClipboardImage();
    if (!hasImage) {
        vscode.window.showWarningMessage('剪贴板中没有图片');
        return;
    }

    // 生成图片文件名和路径
    const imageName = generateImageName(imagePrefix, imageFormat);
    const imagePath = path.join(targetDir, imageName);

    // 从剪贴板保存图片
    const saved = await saveClipboardImage(imagePath);
    if (!saved) {
        return;
    }

    // 计算相对路径
    const folderName = path.basename(targetDir);
    const relPath = `./${folderName}/${imageName}`;

    // 插入 Markdown 图片引用
    await editor.edit(edit => {
        edit.insert(editor.selection.active, `![image](${relPath})`);
    });

    vscode.window.showInformationMessage(`图片已粘贴: ${imageName}`);
}

/**
 * 插件激活入口
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('Markdown Picture Paste 插件已激活');

    // --- 功能 1：粘贴图片命令 ---
    const pasteCommand = vscode.commands.registerCommand(
        'markdown-picture-paste.paste',
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('没有打开的编辑器');
                return;
            }
            if (editor.document.languageId !== 'markdown') {
                vscode.window.showWarningMessage('请在 Markdown 文件中使用此功能');
                return;
            }

            await pasteImage(editor);
        }
    );

    // --- 功能 2：自动清理监听 ---
    const cleanupListener = createCleanupListener();

    // --- 功能 3：手动清理命令 ---
    const cleanupCommand = registerCleanupCommand(context);

    // 注册到上下文
    context.subscriptions.push(pasteCommand, cleanupListener, cleanupCommand);
}

/**
 * 插件停用时调用
 */
export function deactivate() {
    console.log('Markdown Picture Paste 插件已停用');
}
