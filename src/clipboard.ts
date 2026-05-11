import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { execSync } from 'child_process';
import { t } from './localize';

export async function saveClipboardImage(imagePath: string, imageFormat: string = 'png'): Promise<boolean> {
    const platform = process.platform;

    try {
        if (platform === 'win32') {
            return await saveClipboardImageWindows(imagePath, imageFormat);
        } else if (platform === 'darwin') {
            return await saveClipboardImageMac(imagePath, imageFormat);
        } else {
            vscode.window.showErrorMessage(t('unsupported_platform'));
            return false;
        }
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(t('save_clipboard_failed') + errMsg);
        return false;
    }
}

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
            vscode.window.showWarningMessage(t('no_image_copy_first'));
            return false;
        }

        if (result !== 'ok') {
            vscode.window.showWarningMessage(t('save_failed_powershell') + `"${result}"`);
            return false;
        }

        if (!fs.existsSync(imagePath)) {
            vscode.window.showWarningMessage(t('save_failed_no_file'));
            return false;
        }

        return true;
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(t('read_clipboard_failed') + errMsg);
        return false;
    }
}

async function saveClipboardImageMac(imagePath: string, imageFormat: string = 'png'): Promise<boolean> {
    try {
        const checkResult = execSync(`osascript -e 'clipboard info'`, {
            encoding: 'utf-8',
            timeout: 5000
        });

        if (!checkResult.includes('class PNGf') && !checkResult.includes('class JPEG')) {
            vscode.window.showWarningMessage(t('no_image_in_clipboard'));
            return false;
        }

        const osaImageFormat = imageFormat === 'png' ? 'PNG' : 'JPEG';
        execSync(`osascript -e 'set theImage to (the clipboard as picture)' -e 'set imagePath to "${imagePath}"' -e 'set fileRef to open for access imagePath with write permission' -e 'write (theImage as ${osaImageFormat} picture) to fileRef' -e 'close access fileRef'`, {
            encoding: 'utf-8',
            timeout: 10000
        });

        return fs.existsSync(imagePath);
    } catch (error) {
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
            vscode.window.showErrorMessage(t('read_clipboard_failed') + errMsg + t('install_pngpaste'));
            return false;
        }
    }
}

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
            console.log('[md-paste:clipboard] exec', { cmd });
            const result = execSync(cmd, { encoding: 'utf-8', timeout: 10000 }).trim();
            console.log('[md-paste:clipboard] result', { result });
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
        console.error('[md-paste:clipboard] check failed, assume image', err);
        return true;
    }

    return false;
}
