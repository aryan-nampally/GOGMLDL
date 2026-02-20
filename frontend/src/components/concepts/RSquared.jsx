import { useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import VideoEmbed from '../VideoEmbed';

const PLOTLY_CONFIG = { responsive: true, displayModeBar: 'hover', displaylogo: false, scrollZoom: false };

export default function RSquared() {
    const [showMean, setShowMean] = useState(true);
    const [showFit, setShowFit] = useState(true);

    const { x, y, yMean, yPred } = useMemo(() => {
        // Seeded data
        const xArr = [];
        for (let i = 0; i < 20; i++) xArr.push(i * 0.5);
        // y = 2x + 1 + noise
        const seed = [1.2, -0.8, 0.5, 2.1, -1.3, 0.9, -0.4, 1.7, -0.6, 0.3,
            -1.1, 0.8, 1.4, -0.9, 0.2, -1.5, 1.0, 0.7, -0.3, 1.6];
        const yArr = xArr.map((xi, i) => 2 * xi + 1 + seed[i] * 3);
        const mean = yArr.reduce((a, b) => a + b, 0) / yArr.length;

        // OLS fit
        const n = xArr.length;
        let sx = 0, sy = 0, sxy = 0, sx2 = 0;
        for (let i = 0; i < n; i++) { sx += xArr[i]; sy += yArr[i]; sxy += xArr[i] * yArr[i]; sx2 += xArr[i] * xArr[i]; }
        const m = (n * sxy - sx * sy) / (n * sx2 - sx * sx);
        const b = (sy - m * sx) / n;
        const yP = xArr.map(xi => m * xi + b);

        return { x: xArr, y: yArr, yMean: mean, yPred: yP };
    }, []);

    const plotData = [
        { x, y, mode: 'markers', name: 'Data', marker: { color: '#06D6A0', size: 9 } },
    ];

    const shapes = [];

    if (showMean) {
        plotData.push({ x, y: Array(20).fill(yMean), mode: 'lines', name: 'Mean', line: { dash: 'dash', color: '#555', width: 2 } });
        x.forEach((xi, i) => shapes.push({
            type: 'line', x0: xi, y0: y[i], x1: xi, y1: yMean,
            line: { color: 'rgba(85,85,85,0.3)', width: 1 },
        }));
    }

    if (showFit) {
        plotData.push({ x, y: yPred, mode: 'lines', name: 'Best Fit', line: { color: '#4F8BF9', width: 3 } });
        x.forEach((xi, i) => shapes.push({
            type: 'line', x0: xi, y0: y[i], x1: xi, y1: yPred[i],
            line: { color: '#EF476F', width: 2 },
        }));
    }

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <VideoEmbed src="/videos/RSquaredAnim.mp4" label="🎬 Understanding R-Squared Visually" />
            </div>

            <h3 style={{ marginBottom: 8 }}>📊 How Good Is the Fit?</h3>
            <div className="warning-card" style={{ marginBottom: 16 }}>
                R² = 1 − (Unexplained Variation / Total Variation)
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    <input type="checkbox" checked={showMean} onChange={(e) => setShowMean(e.target.checked)} />
                    Total Variation (Mean Line)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    <input type="checkbox" checked={showFit} onChange={(e) => setShowFit(e.target.checked)} />
                    Unexplained Variation (Fit)
                </label>
            </div>

            <div className="glass-card" style={{ padding: 8 }}>
                <Plot
                    data={plotData}
                    layout={{
                        xaxis: { gridcolor: 'rgba(255,255,255,0.04)', zerolinecolor: 'rgba(255,255,255,0.08)' },
                        yaxis: { gridcolor: 'rgba(255,255,255,0.04)', zerolinecolor: 'rgba(255,255,255,0.08)' },
                        shapes,
                        uirevision: 'keep',
                        height: 380,
                        margin: { l: 40, r: 20, t: 20, b: 30 },
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        plot_bgcolor: 'rgba(0,0,0,0)',
                        showlegend: true,
                        legend: { x: 0.01, y: 0.99, font: { size: 11, color: '#8a8a8a' } },
                        font: { color: '#8a8a8a' },
                    }}
                    config={PLOTLY_CONFIG}
                    useResizeHandler
                    style={{ width: '100%' }}
                />
            </div>
        </div>
    );
}
