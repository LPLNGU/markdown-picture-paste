import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { execSync } from 'child_process';

/**
 * 从剪贴板保存图片到指定路径
 * 支持 Windows (PowerShell) 和 macOS (osascript) 两种方式
 */
export async function saveClipboardImage(imagePath: string, imageFormat: string = 'png'): Promise<boolean> {
    const platform = process.platform;

    try {
        if (platform === 'win32') {
            return await saveClipboardImageWindows(imagePath, imageFormat);
        } else if (platform === 'darwin') {
            return await saveClipboardImageMac(imagePath, imageFormat);
        } else {
            vscode.window.showErrorMessage('不支持的操作系统，仅支持 Windows 和 macOS');
            return false;
        }
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`保存剪贴板图片失败: ${errMsg}`);
        return false;
    }
}

/**
 * Windows 下使用 PowerShell 从剪贴板获取图片并保存
 */
async function saveClipboardImageWindows(imagePath: string, imageFormat: string = 'png'): Promise<boolean> {
    const psScript = `
param($path, $formatName)
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms
$img = [System.Windows.Forms.Clipboard]::GetImage()
if ($img) {
    $format = switch ($formatName) {
        "jpg" { [System.Drawing.Imaging.ImageFormat]::Jpeg }
        "jpeg" { [System.Drawing.Imaging.ImageFormat]::Jpeg }
        "gif" { [System.Drawing.Imaging.ImageFormat]::Gif }
        "bmp" { [System.Drawing.Imaging.ImageFormat]::Bmp }
        default { [System.Drawing.Imaging.ImageFormat]::Png }
    }
    $img.Save($path, $format)
    $img.Dispose()
    Write-Output "ok"
} else {
    Write-Output "none"
}
`;
    try {
        const tempDir = path.dirname(imagePath);
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        const tempScript = path.join(tempDir, '_paste_img.ps1');
        fs.writeFileSync(tempScript, psScript, 'utf-8');

        const result = execSync(
            `powershell -NoProfile -ExecutionPolicy Bypass -File "${tempScript}" -path "${imagePath}" -formatName "${imageFormat}"`,
            { encoding: 'utf-8', timeout: 15000 }
        ).trim();

        try { fs.unlinkSync(tempScript); } catch { /* ignore */ }

        if (result === 'none') {
            vscode.window.showWarningMessage('剪贴板中没有图片，请先复制一张图片');
            return false;
        }

        if (result !== 'ok') {
            vscode.window.showWarningMessage(`保存图片失败: PowerShell 返回异常结果 "${result}"`);
            return false;
        }

        if (!fs.existsSync(imagePath)) {
            vscode.window.showWarningMessage('保存图片失败: 文件未生成');
            return false;
        }

        return true;
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`从剪贴板读取图片失败: ${errMsg}`);
        return false;
    }
}

/**
 * macOS 下使用 osascript 从剪贴板获取图片并保存
 */
async function saveClipboardImageMac(imagePath: string, imageFormat: string = 'png'): Promise<boolean> {
    try {
        // 先检查剪贴板是否有图片
        const checkResult = execSync(`osascript -e 'clipboard info'`, {
            encoding: 'utf-8',
            timeout: 5000
        });

        if (!checkResult.includes('class PNGf') && !checkResult.includes('class JPEG')) {
            vscode.window.showWarningMessage('剪贴板中没有图片');
            return false;
        }

        // 使用 sips 工具将剪贴板图片保存为文件
        const osaImageFormat = imageFormat === 'png' ? 'PNG' : 'JPEG';
        execSync(`osascript -e 'set theImage to (the clipboard as picture)' -e 'set imagePath to "${imagePath}"' -e 'set fileRef to open for access imagePath with write permission' -e 'write (theImage as ${osaImageFormat} picture) to fileRef' -e 'close access fileRef'`, {
            encoding: 'utf-8',
            timeout: 10000
        });

        return fs.existsSync(imagePath);
    } catch (error) {
        // 备用方案：使用 pngpaste 工具（需安装）
        try {
            if (imageFormat === 'png') {
                execSync(`pngpaste "${imagePath}"`, {
                    encoding: 'utf-8',
                    timeout: 10000
                });
            } else {
                execSync(`pngpaste "${imagePath}" /dev/stdout | sips -s format ${imageFormat} --out "${imagePath}"`, {
                    encoding: 'utf-8',
                    timeout: 10000
                });
            }
            return fs.existsSync(imagePath);
        } catch {
            const errMsg = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`从剪贴板读取图片失败: ${errMsg}\n提示：可安装 pngpaste (brew install pngpaste)`);
            return false;
        }
    }
}

/**
 * 检查剪贴板是否包含图片
 */
export async function hasClipboardImage(): Promise<boolean> {
    const platform = process.platform;
    console.log('[md-paste:clipboard] hasClipboardImage', { platform });

    try {
        if (platform === 'win32') {
            const checkScript = `Add-Type -AssemblyName System.Windows.Forms; $img = [System.Windows.Forms.Clipboard]::GetImage(); if ($img) { Write-Output 'true' } else { Write-Output 'false' }`;
            const tempDir = path.join(os.tmpdir(), 'md-paste');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            const tempScript = path.join(tempDir, '_check_clipboard.ps1');
            fs.writeFileSync(tempScript, `param()\n${checkScript}`, 'utf-8');
            const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -File "${tempScript}"`;
            console.log('[md-paste:clipboard] 执行命令', { cmd });
            const result = execSync(cmd, { encoding: 'utf-8', timeout: 10000 }).trim();
            console.log('[md-paste:clipboard] 检查结果', { result });
            try { fs.unlinkSync(tempScript); } catch { /* ignore */ }
            return result === 'true';
        } else if (platform === 'darwin') {
            const result = execSync(`osascript -e 'clipboard info'`, {
                encoding: 'utf-8',
                timeout: 5000
            });
            return result.includes('class PNGf') || result.includes('class JPEG');
        }
    } catch (err) {
        console.error('[md-paste:clipboard] 检查剪贴板失败，假设有图片', err);
        return true;
    }

    return false;
}
