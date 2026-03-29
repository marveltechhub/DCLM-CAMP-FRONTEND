import QRCode from 'qrcode';
import type { Registration } from '@/lib/api';

const W = 900;
const H = 540;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function renderIdCardToCanvas(reg: Registration): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#f8fafc');
  g.addColorStop(1, '#e8eef6');
  ctx.fillStyle = g;
  drawRoundedRect(ctx, 0, 0, W, H, 24);
  ctx.fill();

  ctx.strokeStyle = 'rgba(30, 77, 139, 0.35)';
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, 6, 6, W - 12, H - 12, 20);
  ctx.stroke();

  try {
    const logo = await loadImage('/logo.svg');
    const lw = 72;
    ctx.drawImage(logo, 40, 28, lw, lw);
  } catch {
    ctx.fillStyle = '#1e4d8b';
    ctx.fillRect(40, 28, 72, 72);
  }

  ctx.fillStyle = '#1e4d8b';
  ctx.font = 'bold 28px Segoe UI, sans-serif';
  ctx.fillText('DCLM Easter Retreat', 130, 58);
  ctx.fillStyle = '#5c6578';
  ctx.font = '16px Segoe UI, sans-serif';
  ctx.fillText('Camp participant identification', 130, 84);

  const photoX = W - 220;
  const photoY = 120;
  const photoR = 72;

  ctx.save();
  ctx.beginPath();
  ctx.arc(photoX + photoR, photoY + photoR, photoR, 0, Math.PI * 2);
  ctx.clip();
  try {
    if (reg.profilePictureUrl) {
      const ph = await loadImage(reg.profilePictureUrl);
      ctx.drawImage(ph, photoX, photoY, photoR * 2, photoR * 2);
    } else {
      ctx.fillStyle = '#dbe4f0';
      ctx.fillRect(photoX, photoY, photoR * 2, photoR * 2);
      ctx.fillStyle = '#1e4d8b';
      ctx.font = 'bold 48px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const initial = (reg.fullName || '?').trim().charAt(0).toUpperCase();
      ctx.fillText(initial, photoX + photoR, photoY + photoR);
    }
  } catch {
    ctx.fillStyle = '#dbe4f0';
    ctx.fillRect(photoX, photoY, photoR * 2, photoR * 2);
  }
  ctx.restore();

  ctx.strokeStyle = '#1e4d8b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(photoX + photoR, photoY + photoR, photoR + 2, 0, Math.PI * 2);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = '#5c6578';
  ctx.font = '13px Segoe UI, sans-serif';
  ctx.fillText('FULL NAME', 48, 150);
  ctx.fillStyle = '#1a1d26';
  ctx.font = 'bold 26px Segoe UI, sans-serif';
  ctx.fillText(reg.fullName, 48, 188);

  ctx.fillStyle = '#5c6578';
  ctx.font = '13px Segoe UI, sans-serif';
  ctx.fillText('REGISTRATION NUMBER', 48, 236);
  ctx.fillStyle = '#7a5f0a';
  ctx.font = 'bold 22px Segoe UI, sans-serif';
  ctx.fillText(reg.registrationNumber, 48, 268);

  ctx.fillStyle = '#5c6578';
  ctx.font = '13px Segoe UI, sans-serif';
  ctx.fillText('LOCATION / CENTER', 48, 314);
  ctx.fillStyle = '#1a1d26';
  ctx.font = '18px Segoe UI, sans-serif';
  ctx.fillText(reg.location?.name || '—', 48, 344);

  ctx.fillStyle = '#5c6578';
  ctx.font = '13px Segoe UI, sans-serif';
  ctx.fillText('PHONE', 48, 388);
  ctx.fillStyle = '#1a1d26';
  ctx.font = '16px Segoe UI, sans-serif';
  ctx.fillText(reg.phone, 48, 414);

  const qrData = reg.registrationNumber;
  try {
    const qrUrl = await QRCode.toDataURL(qrData, {
      width: 140,
      margin: 1,
      color: { dark: '#1a1d26', light: '#ffffff' },
    });
    const qrImg = await loadImage(qrUrl);
    ctx.drawImage(qrImg, 48, H - 190, 130, 130);
    ctx.fillStyle = '#5c6578';
    ctx.font = '11px Segoe UI, sans-serif';
    ctx.fillText('Scan to verify ID', 48, H - 44);
  } catch {
    /* optional QR */
  }

  ctx.fillStyle = 'rgba(30, 77, 139, 0.06)';
  ctx.font = 'bold 120px Segoe UI, sans-serif';
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-0.35);
  ctx.textAlign = 'center';
  ctx.fillText('DCLM', 0, 0);
  ctx.restore();

  return canvas;
}

export async function downloadIdCardPng(reg: Registration, filename?: string) {
  const canvas = await renderIdCardToCanvas(reg);
  return new Promise<void>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Export failed'));
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `id-${reg.registrationNumber.replace(/[^a-z0-9-]/gi, '_')}.png`;
        a.click();
        URL.revokeObjectURL(url);
        resolve();
      },
      'image/png',
      1
    );
  });
}

export async function printIdCard(reg: Registration) {
  const canvas = await renderIdCardToCanvas(reg);
  const dataUrl = canvas.toDataURL('image/png');
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><title>Print ID</title></head><body style="margin:0;display:flex;justify-content:center;align-items:center;">`);
  w.document.write(`<img src="${dataUrl}" style="max-width:100%;height:auto;" onload="window.print();window.onafterprint=function(){window.close();}"/>`);
  w.document.close();
}
