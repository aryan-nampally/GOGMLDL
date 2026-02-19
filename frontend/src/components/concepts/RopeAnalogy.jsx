import { useState, useMemo } from 'react';
import Plot from 'react-plotly.js';

export default function RopeAnalogy() {
    const [slope, setSlope] = useState(1.0);
    const [intercept, setIntercept] = useState(0.0);

    const x = [-2, -1, 0, 1, 2];
    const y = [-1, -0.5, 0, 0.8, 1.5];

    const { yPred, error } = useMemo(() => {
        const yP = x.map((xi) => slope * xi + intercept);
        const err = x.reduce((sum, _, i) => sum + (y[i] - yP[i]) ** 2, 0);
        return { yPred: yP, error: err };
    }, [slope, intercept]);

    const plotData = [
        {
            x, y,
            mode: 'markers',
            name: 'Data Points',
            marker: { color: '#06D6A0', size: 11, opacity: 0.9 },
        },
        {
            x, y: yPred,
            mode: 'lines',
            name: 'The Rod',
            line: { color: '#4F8BF9', width: 4 },
        },
    ];

    const shapes = x.map((xi, i) => ({
        type: 'line',
        x0: xi, y0: y[i], x1: xi, y1: yPred[i],
        line: { color: '#EF476F', width: 2, dash: 'dot' },
    }));

    return (
        <div>
            {/* Video */}
            <VideoEmbed src="/videos/LinearFitAnim.mp4" label="🎬 How Linear Regression Finds the Best Fit" />

            <div className="grid-2" style={{ marginTop: 24, alignItems: 'start' }}>
                {/* Left: Explanation + Slider */}
                <div>
                    <h3 style={{ marginBottom: 12 }}>🪢 The Rope Analogy</h3>
                    <p style={{ marginBottom: 16 }}>
                        Imagine the regression line is a stiff rod, and each data point pulls it with a spring.
                        The rod settles where the tension (error) is minimized.
                    </p>

                    <div className="slider-group">
                        <label>
                            <span>Tilt the Rod (Slope)</span>
                            <span className="slider-value">{slope.toFixed(1)}</span>
                        </label>
                        <input type="range" min="-5" max="5" step="0.1" value={slope} onChange={(e) => setSlope(+e.target.value)} />
                    </div>

                    <div className="slider-group">
                        <label>
                            <span>Move Up/Down (Intercept)</span>
                            <span className="slider-value">{intercept.toFixed(1)}</span>
                        </label>
                        <input type="range" min="-5" max="5" step="0.1" value={intercept} onChange={(e) => setIntercept(+e.target.value)} />
                    </div>

                    <div className="info-card" style={{ marginTop: 12 }}>
                        Total Tension (Error): <strong style={{ color: error < 2 ? 'var(--emerald)' : 'var(--pink)' }}>{error.toFixed(2)}</strong>
                    </div>
                </div>

                {/* Right: Chart */}
                <div className="glass-card" style={{ padding: 8 }}>
                    <Plot
                        data={plotData}
                        layout={{
                            title: { text: `Error: ${error.toFixed(2)}`, font: { size: 14, color: '#8a8a8a' } },
                            xaxis: { title: '', gridcolor: 'rgba(255,255,255,0.04)', zerolinecolor: 'rgba(255,255,255,0.08)' },
                            yaxis: { title: '', gridcolor: 'rgba(255,255,255,0.04)', zerolinecolor: 'rgba(255,255,255,0.08)' },
                            shapes,
                            height: 320,
                            margin: { l: 40, r: 20, t: 40, b: 30 },
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

function VideoEmbed({ src, label }) {
    const [open, setOpen] = useState(true);
    return (
        <div className="video-card">
            <button
                onClick={() => setOpen(!open)}
                style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '0.88rem',
                    fontWeight: 500,
                    fontFamily: 'var(--font-body)',
                }}
            >
                {open ? '▾' : '▸'} {label}
            </button>
            {open && <video src={src} controls style={{ width: '100%', display: 'block' }} />}
        </div>
    );
}
