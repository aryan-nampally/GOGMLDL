import { useState, useMemo } from 'react';
import Plot from 'react-plotly.js';

const VIOLATIONS = ['None (Perfect)', 'Non-Linearity (Curved)', 'Heteroscedasticity (Cone)'];

// Seeded random
function seededNormal(seed) {
    const arr = [];
    let s = seed;
    for (let i = 0; i < 100; i++) {
        s = (s * 16807) % 2147483647;
        const u1 = s / 2147483647;
        s = (s * 16807) % 2147483647;
        const u2 = s / 2147483647;
        arr.push(Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2));
    }
    return arr;
}

export default function Assumptions() {
    const [violation, setViolation] = useState(0);

    const { residuals, yPred } = useMemo(() => {
        const xArr = [];
        for (let i = 0; i < 100; i++) xArr.push(1 + i * 0.09);
        const noise = seededNormal(42);

        let yArr;
        if (violation === 0) {
            yArr = xArr.map((xi, i) => 2 * xi + noise[i] * 2);
        } else if (violation === 1) {
            yArr = xArr.map((xi, i) => 2 * xi * xi + noise[i] * 5);
        } else {
            yArr = xArr.map((xi, i) => 2 * xi + noise[i] * xi * 2);
        }

        // OLS
        const n = xArr.length;
        let sx = 0, sy = 0, sxy = 0, sx2 = 0;
        for (let i = 0; i < n; i++) { sx += xArr[i]; sy += yArr[i]; sxy += xArr[i] * yArr[i]; sx2 += xArr[i] * xArr[i]; }
        const m = (n * sxy - sx * sy) / (n * sx2 - sx * sx);
        const b = (sy - m * sx) / n;
        const yP = xArr.map(xi => m * xi + b);
        const res = yArr.map((yi, i) => yi - yP[i]);

        return { residuals: res, yPred: yP };
    }, [violation]);

    const assumptions = [
        { title: 'Linearity', desc: 'X and Y have a straight-line relationship', icon: '📏' },
        { title: 'Normality', desc: 'Errors are bell-curve shaped', icon: '🔔' },
        { title: 'Homoscedasticity', desc: 'Error variance stays constant', icon: '📐' },
        { title: 'Independence', desc: 'Errors aren\'t related to each other', icon: '🔗' },
    ];

    return (
        <div>
            <h3 style={{ marginBottom: 8 }}>🕵️ Assumptions of Linear Regression</h3>
            <p style={{ marginBottom: 20 }}>Linear Regression only works well if your data follows these rules:</p>

            <div className="grid-4" style={{ marginBottom: 24 }}>
                {assumptions.map((a) => (
                    <div key={a.title} className="glass-card" style={{ padding: 16, textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{a.icon}</div>
                        <h4 style={{ fontSize: '0.85rem', marginBottom: 4 }}>{a.title}</h4>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{a.desc}</p>
                    </div>
                ))}
            </div>

            <div className="slider-group">
                <label>
                    <span>Simulate Violation</span>
                    <span className="slider-value">{VIOLATIONS[violation]}</span>
                </label>
                <select
                    value={violation}
                    onChange={(e) => setViolation(+e.target.value)}
                    style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        fontSize: '0.88rem',
                        fontFamily: 'var(--font-body)',
                    }}
                >
                    {VIOLATIONS.map((v, i) => (
                        <option key={v} value={i}>{v}</option>
                    ))}
                </select>
            </div>

            <div className="glass-card" style={{ padding: 8, marginTop: 16 }}>
                <Plot
                    data={[{
                        x: yPred,
                        y: residuals,
                        mode: 'markers',
                        marker: { color: '#EF476F', size: 7, opacity: 0.7 },
                    }]}
                    layout={{
                        shapes: [{
                            type: 'line',
                            x0: Math.min(...yPred), y0: 0, x1: Math.max(...yPred), y1: 0,
                            line: { color: 'rgba(255,255,255,0.3)', width: 2, dash: 'dash' },
                        }],
                        title: { text: `Residual Plot: ${VIOLATIONS[violation]}`, font: { size: 13, color: '#8a8a8a' } },
                        xaxis: { title: 'Predicted', gridcolor: 'rgba(255,255,255,0.04)' },
                        yaxis: { title: 'Residuals', gridcolor: 'rgba(255,255,255,0.04)' },
                        height: 320,
                        margin: { l: 50, r: 20, t: 40, b: 40 },
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        plot_bgcolor: 'rgba(0,0,0,0)',
                        font: { color: '#8a8a8a' },
                    }}
                    config={{ displayModeBar: false, responsive: true }}
                    style={{ width: '100%' }}
                />
            </div>
        </div>
    );
}
