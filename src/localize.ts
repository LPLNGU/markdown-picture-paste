import * as vscode from 'vscode';

type TranslationMap = Record<string, string>;

let cached: TranslationMap | undefined;

function getTranslations(): TranslationMap {
    if (cached) return cached;

    const isChinese = vscode.env.language.startsWith('zh');
    const zh = isChinese;

    cached = {
        // extension.ts
        create_folder_failed: zh ? '创建图片文件夹失败: ' : 'Failed to create image folder: ',
        no_image_in_clipboard: zh ? '剪贴板中没有图片' : 'No image in clipboard',
        save_failed_check_console: zh ? '图片保存失败，请检查剪贴板中是否有图片，并查看控制台日志 (帮助 → 切换开发人员工具 → Console)' : 'Failed to save image. Please check clipboard for image and view console logs (Help → Toggle Developer Tools → Console)',
        image_pasted: zh ? '图片已粘贴: ' : 'Image pasted: ',
        no_open_editor: zh ? '没有打开的编辑器' : 'No active editor open',
        not_markdown_file: zh ? '请在 Markdown 文件中使用此功能' : 'Please use this feature in a Markdown file',
        plugin_activated: zh ? 'Markdown Picture Paste 插件已激活' : 'Markdown Picture Paste activated',
        plugin_deactivated: zh ? 'Markdown Picture Paste 插件已停用' : 'Markdown Picture Paste deactivated',

        // clipboard.ts
        unsupported_platform: zh ? '不支持的操作系统，仅支持 Windows 和 macOS' : 'Unsupported platform, only Windows and macOS are supported',
        save_clipboard_failed: zh ? '保存剪贴板图片失败: ' : 'Failed to save clipboard image: ',
        no_image_copy_first: zh ? '剪贴板中没有图片，请先复制一张图片' : 'No image in clipboard, please copy an image first',
        save_failed_powershell: zh ? '保存图片失败: PowerShell 返回异常结果 ' : 'Failed to save image: PowerShell returned unexpected result ',
        save_failed_no_file: zh ? '保存图片失败: 文件未生成' : 'Failed to save image: file was not created',
        read_clipboard_failed: zh ? '从剪贴板读取图片失败: ' : 'Failed to read from clipboard: ',
        install_pngpaste: zh ? '\n提示：可安装 pngpaste (brew install pngpaste)' : '\nTip: Install pngpaste (brew install pngpaste)',

        // cleanup.ts
        auto_cleaned: zh ? '已自动清理未引用的图片: ' : 'Auto-cleaned unreferenced image: ',
        run_in_markdown: zh ? '请在 Markdown 文件中执行此命令' : 'Please run this command in a Markdown file',
        cleanup_done: zh ? '清理完成，共删除 ' : 'Cleanup complete, deleted ',
        cleanup_files: zh ? ' 个未引用的图片文件' : ' unreferenced image file(s)',
        no_unreferenced: zh ? '没有发现未引用的图片' : 'No unreferenced images found',
    };

    return cached;
}

export function t(key: string, ...args: string[]): string {
    const str = getTranslations()[key] ?? key;
    if (args.length === 0) return str;
    return str.replace(/\{(\d+)\}/g, (_, n: string) => args[parseInt(n)] ?? '');
}

export function resetTranslations(): void {
    cached = undefined;
}
