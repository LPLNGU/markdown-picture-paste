import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

/**
 * 从剪贴板保存图片到指定路径
 * 支持 Windows (PowerShell) 和 macOS (osascript) 两种方式
 */
export async function saveClipboardImage(imagePath: string): Promise<boolean> {
    const platform = process.platform;

    try {
        if (platform === 'win32') {
            return await saveClipboardImageWindows(imagePath);
        } else if (platform === 'darwin') {
            return await saveClipboardImageMac(imagePath);
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
async function saveClipboardImageWindows(imagePath: string): Promise<boolean> {
    try {
        // 使用 PowerShell 从剪贴板获取图片并保存
        const psScript = `
Add-Type -AssemblyName System.Windows.Forms
$clipboard = [System.Windows.Forms.Clipboard]::GetImage()
if ($clipboard -ne $null) {
    $clipboard.Save('${imagePath.replace(/\\/g, '\\\\')}', [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Output "success"
} else {
    Write-Output "no_image"
}
`;
        const result = execSync(`powershell -NoProfile -Command "${psScript.replace(/"/g, '\\"')}"`, {
            encoding: 'utf-8',
            timeout: 10000
        }).trim();

        if (result === 'no_image') {
            vscode.window.showWarningMessage('剪贴板中没有图片');
            return false;
        }

        return result === 'success' && fs.existsSync(imagePath);
    } catch (error) {
        // 如果 PowerShell 方式失败，尝试备用方案
        return await saveClipboardImageWindowsFallback(imagePath);
    }
}

/**
 * Windows 备用方案：使用 PowerShell 的 Get-Clipboard -Format Image
 */
async function saveClipboardImageWindowsFallback(imagePath: string): Promise<boolean> {
    try {
        const psScript = `
param($path)
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms
$img = [System.Windows.Forms.Clipboard]::GetImage()
if ($img) {
    $img.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $img.Dispose()
    Write-Output "ok"
} else {
    Write-Output "none"
}
`;
        const tempScript = path.join(path.dirname(imagePath), '_temp_save_image.ps1');
        fs.writeFileSync(tempScript, psScript, 'utf-8');

        const result = execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tempScript}" -path "${imagePath}"`, {
            encoding: 'utf-8',
            timeout: 10000
        }).trim();

        // 清理临时脚本
        try { fs.unlinkSync(tempScript); } catch { /* ignore */ }

        if (result === 'none') {
            vscode.window.showWarningMessage('剪贴板中没有图片');
            return false;
        }

        return result === 'ok' && fs.existsSync(imagePath);
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`从剪贴板读取图片失败: ${errMsg}`);
        return false;
    }
}

/**
 * macOS 下使用 osascript 从剪贴板获取图片并保存
 */
async function saveClipboardImageMac(imagePath: string): Promise<boolean> {
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
        execSync(`osascript -e 'set theImage to (the clipboard as picture)' -e 'set imagePath to "${imagePath}"' -e 'set fileRef to open for access imagePath with write permission' -e 'write (theImage as JPEG picture) to fileRef' -e 'close access fileRef'`, {
            encoding: 'utf-8',
            timeout: 10000
        });

        return fs.existsSync(imagePath);
    } catch (error) {
        // 备用方案：使用 pngpaste 工具（需安装）
        try {
            execSync(`pngpaste "${imagePath}"`, {
                encoding: 'utf-8',
                timeout: 10000
            });
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

    try {
        if (platform === 'win32') {
            const result = execSync(
                `powershell -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; $img = [System.Windows.Forms.Clipboard]::GetImage(); if ($img) { Write-Output 'true' } else { Write-Output 'false' }"`,
                { encoding: 'utf-8', timeout: 5000 }
            ).trim();
            return result === 'true';
        } else if (platform === 'darwin') {
            const result = execSync(`osascript -e 'clipboard info'`, {
                encoding: 'utf-8',
                timeout: 5000
            });
            return result.includes('class PNGf') || result.includes('class JPEG');
        }
    } catch {
        // 如果检查失败，假设有图片让后续流程处理
        return true;
    }

    return false;
}
