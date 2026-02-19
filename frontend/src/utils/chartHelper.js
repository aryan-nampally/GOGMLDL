/**
 * chartHelper.js — Shared canvas drawing utilities for ML ATLAS lab charts.
 *
 * Provides reusable functions for drawing chart chrome (grids, axes, labels,
 * legends) so every lab page looks consistent and polished.
 */

/* ── Color palette ── */
export const CHART_COLORS = ['#4F8BF9', '#EC4899', '#06D6A0', '#F97316', '#9B5DE5', '#FBBF24', '#14B8A6', '#8B5CF6'];

/* ── Chart area with padding ── */
export function getChartArea(canvasWidth, canvasHeight) {
    const margin = { top: 20, right: 20, bottom: 45, left: 50 };
    return {
        margin,
        x: margin.left,
        y: margin.top,
        w: canvasWidth - margin.left - margin.right,
        h: canvasHeight - margin.top - margin.bottom,
    };
}

/* ── Data → pixel coordinate ── */
export function toPixel(val, min, max, size, offset, flipY = false) {
    const t = (val - min) / (max - min || 1);
    return offset + (flipY ? (1 - t) : t) * size;
}

/* ── Compute nice axis bounds ── */
export function getBounds(data, dimIndex, padFraction = 0.08) {
    let mn = Infinity, mx = -Infinity;
    for (const pt of data) {
        const v = pt[dimIndex];
        if (v < mn) mn = v;
        if (v > mx) mx = v;
    }
    const range = mx - mn || 1;
    const pad = range * padFraction;
    return { min: mn - pad, max: mx + pad };
}

/* ── Draw grid + axes ── */
export function drawChartChrome(ctx, area, xBounds, yBounds, options = {}) {
    const { xLabel = 'X₁', yLabel = 'X₂', gridLines = 6 } = options;
    const { x, y, w, h } = area;

    // Background of plot area
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.fillRect(x, y, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // Horizontal grid
    for (let i = 0; i <= gridLines; i++) {
        const gy = y + (h / gridLines) * i;
        ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke();
    }

    // Vertical grid
    for (let i = 0; i <= gridLines; i++) {
        const gx = x + (w / gridLines) * i;
        ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke();
    }

    ctx.setLineDash([]);

    // Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    // X axis
    ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.stroke();
    // Y axis
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.stroke();

    // Axis tick labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';

    // X ticks
    const xTicks = 5;
    for (let i = 0; i <= xTicks; i++) {
        const val = xBounds.min + (xBounds.max - xBounds.min) * (i / xTicks);
        const px = x + (w / xTicks) * i;
        ctx.fillText(val.toFixed(1), px, y + h + 16);
    }

    // Y ticks
    ctx.textAlign = 'right';
    for (let i = 0; i <= xTicks; i++) {
        const val = yBounds.min + (yBounds.max - yBounds.min) * (i / xTicks);
        const py = y + h - (h / xTicks) * i;
        ctx.fillText(val.toFixed(1), x - 8, py + 4);
    }

    // Axis labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(xLabel, x + w / 2, y + h + 38);

    ctx.save();
    ctx.translate(14, y + h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();
}

/* ── Draw data points with glow ── */
export function drawPoint(ctx, px, py, radius, color, opts = {}) {
    const { glow = true, alpha = 0.85, stroke = null, strokeWidth = 2 } = opts;

    if (glow) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
    }

    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fill();

    if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}

/* ── Draw legend ── */
export function drawLegend(ctx, items, x, y) {
    ctx.font = '11px Inter, sans-serif';
    const lineHeight = 20;

    // Background panel
    const maxLabel = Math.max(...items.map(i => ctx.measureText(i.label).width));
    const panelW = maxLabel + 36;
    const panelH = items.length * lineHeight + 10;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    roundRect(ctx, x, y, panelW, panelH, 6);
    ctx.fill();
    ctx.stroke();

    items.forEach((item, i) => {
        const ly = y + 14 + i * lineHeight;
        ctx.beginPath();
        ctx.arc(x + 14, ly - 2, 4, 0, Math.PI * 2);
        ctx.fillStyle = item.color;
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.fillText(item.label, x + 26, ly + 2);
    });
}

/* ── Round rect helper ── */
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
}

/* ── Clear canvas with dark gradient ── */
export function clearCanvas(ctx, w, h) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0a0a0f');
    grad.addColorStop(1, '#050510');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
}
