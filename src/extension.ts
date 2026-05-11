import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { saveClipboardImage, hasClipboardImage } from './clipboard';
import { createCleanupListener, registerCleanupCommand, getImageFolderPath } from './cleanup';
import { t } from './localize';

function generateImageName(prefix: string, format: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6);
    return `${prefix}${timestamp}_${random}.${format}`;
}

async function pasteImage(editor: vscode.TextEditor): Promise<void> {
    const doc = editor.document;
    const docPath = doc.fileName;
    console.log('[md-paste] paste image', { docPath });

    const config = vscode.workspace.getConfiguration('markdown-picture-paste');
    const imageFormat = config.get<string>('imageFormat', 'png');
    const imagePrefix = config.get<string>('imagePrefix', 'img_');
    console.log('[md-paste] config', { imageFormat, imagePrefix });

    const targetDir = getImageFolderPath(docPath);
    console.log('[md-paste] target dir', { targetDir });
    if (!fs.existsSync(targetDir)) {
        try {
            fs.mkdirSync(targetDir, { recursive: true });
            console.log('[md-paste] folder created');
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            console.error('[md-paste] create folder failed', errMsg);
            vscode.window.showErrorMessage(t('create_folder_failed') + errMsg);
            return;
        }
    }

    console.log('[md-paste] checking clipboard...');
    const hasImage = await hasClipboardImage();
    console.log('[md-paste] clipboard result', { hasImage });
    if (!hasImage) {
        vscode.window.showWarningMessage(t('no_image_in_clipboard'));
        return;
    }

    const imageName = generateImageName(imagePrefix, imageFormat);
    const imagePath = path.join(targetDir, imageName);
    console.log('[md-paste] image path', { imagePath });

    console.log('[md-paste] saving image...');
    const saved = await saveClipboardImage(imagePath, imageFormat);
    console.log('[md-paste] save result', { saved });
    if (!saved) {
        vscode.window.showErrorMessage(t('save_failed_check_console'));
        return;
    }

    const folderName = path.basename(targetDir);
    const relPath = `./${folderName}/${imageName}`;
    console.log('[md-paste] insert ref', { relPath });

    await editor.edit(edit => {
        edit.insert(editor.selection.active, `![image](${relPath})`);
    });

    console.log('[md-paste] done');
    vscode.window.showInformationMessage(t('image_pasted') + imageName);
}

export function activate(context: vscode.ExtensionContext) {
    console.log(t('plugin_activated'));

    const pasteCommand = vscode.commands.registerCommand(
        'markdown-picture-paste.paste',
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage(t('no_open_editor'));
                return;
            }
            if (editor.document.languageId !== 'markdown') {
                vscode.window.showWarningMessage(t('not_markdown_file'));
                return;
            }

            await pasteImage(editor);
        }
    );

    const cleanupListener = createCleanupListener();
    const cleanupCommand = registerCleanupCommand(context);

    context.subscriptions.push(pasteCommand, cleanupListener, cleanupCommand);
}

export function deactivate() {
    console.log(t('plugin_deactivated'));
}
