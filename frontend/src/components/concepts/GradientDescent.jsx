import { useState, useMemo } from 'react';
import Plot from 'react-plotly.js';

export default function GradientDescent() {
    const [lr, setLr] = useState(0.1);
    const [iterations, setIterations] = useState(0);

    const { w, cost, pathW, pathCost, currentW } = useMemo(() => {
        const wArr = [];
        const costArr = [];
        for (let i = -10; i <= 10; i += 0.2) {
            wArr.push(+i.toFixed(1));
            costArr.push(i * i);
        }

        let cw = 9.0;
        const pw = [cw];
        const pc = [cw * cw];
        for (let i = 0; i < iterations; i++) {
            const grad = 2 * cw;
            cw = cw - lr * grad;
            pw.push(cw);
            pc.push(cw * cw);
        }

        return { w: wArr, cost: costArr, pathW: pw, pathCost: pc, currentW: cw };
    }, [lr, iterations]);

    return (
        <div>
            {/* Video */}
            <div className="video-card" style={{ marginBottom: 24 }}>
                <div style={{ padding: '12px 16px', fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                    🎬 Gradient Descent in Action
                </div>
                <video src="/videos/GradientDescentAnim.mp4" controls style={{ width: '100%', display: 'block' }} />
            </div>

            <h3 style={{ marginBottom: 8 }}>🧠 Walking Down the Hill</h3>
            <p style={{ marginBottom: 20 }}>
                The computer finds the best line by minimizing error. Think of a ball rolling down a valley — it stops at the lowest point.
            </p>

            <div className="grid-2" style={{ alignItems: 'start' }}>
                <div>
                    <div className="slider-group">
                        <label>
                            <span>Step Size (Learning Rate)</span>
                            <span className="slider-value">{lr.toFixed(2)}</span>
                        </label>
                        <input type="range" min="0.01" max="1" step="0.01" value={lr} onChange={(e) => setLr(+e.target.value)} />
                    </div>

                    <div className="slider-group">
                        <label>
                            <span>Number of Steps</span>
                            <span className="slider-value">{iterations}</span>
                        </label>
                        <input type="range" min="0" max="50" step="1" value={iterations} onChange={(e) => setIterations(+e.target.value)} />
                    </div>

                    <div className="info-card" style={{ marginTop: 8 }}>
                        Current weight: <strong>{currentW.toFixed(4)}</strong> | Cost: <strong>{(currentW * currentW).toFixed(4)}</strong>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: 8 }}>
                    <Plot
                        data={[
                            { x: w, y: cost, mode: 'lines', name: 'Cost Curve', line: { color: '#4F8BF9', width: 2 } },
                            { x: pathW, y: pathCost, mode: 'lines+markers', name: 'Path', marker: { size: 4, color: '#555' }, line: { dash: 'dot', color: '#555' } },
                            { x: [currentW], y: [currentW * currentW], mode: 'markers', name: 'Ball', marker: { size: 14, color: '#EB5E28', symbol: 'circle' } },
                        ]}
                        layout={{
                            xaxis: { title: 'Weight', gridcolor: 'rgba(255,255,255,0.04)', zerolinecolor: 'rgba(255,255,255,0.08)' },
                            yaxis: { title: 'Cost', gridcolor: 'rgba(255,255,255,0.04)', zerolinecolor: 'rgba(255,255,255,0.08)' },
                            height: 340,
                            margin: { l: 50, r: 20, t: 20, b: 40 },
                            paper_bgcolor: 'rgba(0,0,0,0)',
                            plot_bgcolor: 'rgba(0,0,0,0)',
                            showlegend: false,
                            font: { color: '#8a8a8a' },
                        }}
                        config={{ displayModeBar: false, responsive: true }}
                        style={{ width: '100%' }}
                    />
                </div>
            </div>
        </div>
    );
}
