import type { Page } from 'playwright';
import crypto from 'crypto';

export interface ScreenshotResult {
  buffer: Buffer;
  perceptual_hash: string;
  width_px: number;
  height_px: number;
  size_bytes: number;
}

export async function captureScreenshot(page: Page): Promise<ScreenshotResult> {
  const screenshot = await page.screenshot({ type: 'png', fullPage: true });
  const buffer = Buffer.isBuffer(screenshot) ? screenshot : Buffer.from(screenshot);
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  const viewport = page.viewportSize();
  const bodyHeight = await page.evaluate(() => document.body.scrollHeight);

  return {
    buffer,
    perceptual_hash: hash,
    width_px: viewport?.width ?? 1440,
    height_px: bodyHeight,
    size_bytes: buffer.length,
  };
}
