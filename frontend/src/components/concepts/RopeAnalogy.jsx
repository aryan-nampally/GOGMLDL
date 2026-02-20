import { useMemo, useState } from 'react';
import Plot from 'react-plotly.js';
import VideoEmbed from '../VideoEmbed';

const PLOTLY_CONFIG = {
    responsive: true,
    displayModeBar: 'hover',
    displaylogo: false,
    scrollZoom: false,
};

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

    const shapes = useMemo(
        () =>
            x.map((xi, i) => ({
                type: 'line',
                x0: xi,
                y0: y[i],
                x1: xi,
                y1: yPred[i],
                line: { color: 'rgba(255,255,255,0.22)', width: 2, dash: 'dot' },
            })),
        [yPred]
    );

    const plotData = useMemo(
        () => [
            {
                x,
                y,
                mode: 'markers',
                name: 'Data Points',
                marker: { color: '#06D6A0', size: 11, opacity: 0.9 },
                hovertemplate: 'x=%{x}<br>y=%{y}<extra></extra>',
            },
            {
                x,
                y: yPred,
                mode: 'lines',
                name: 'The Rod',
                line: { color: '#4F8BF9', width: 4 },
                hoverinfo: 'skip',
            },
        ],
        [yPred]
    );

    return (
        <div style={{ display: 'grid', gap: 16 }}>
            <VideoEmbed src="/videos/LinearFitAnim.mp4" label="🎬 How Linear Regression Finds the Best Fit" />

            <div className="grid-2">
                <div className="glass-card" style={{ padding: 16 }}>
                    <h4 style={{ marginTop: 0, marginBottom: 10 }}>Adjust the rod</h4>

                    <div className="slider-group" style={{ marginBottom: 14 }}>
                        <label>
                            <span>Slope (m)</span>
                            <span className="slider-value">{slope.toFixed(2)}</span>
                        </label>
                        <input
                            type="range"
                            min={-3}
                            max={3}
                            step={0.05}
                            value={slope}
                            onChange={(e) => setSlope(parseFloat(e.target.value))}
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div className="slider-group" style={{ marginBottom: 14 }}>
                        <label>
                            <span>Intercept (b)</span>
                            <span className="slider-value">{intercept.toFixed(2)}</span>
                        </label>
                        <input
                            type="range"
                            min={-2}
                            max={2}
                            step={0.05}
                            value={intercept}
                            onChange={(e) => setIntercept(parseFloat(e.target.value))}
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                        Total Tension (Error):{' '}
                        <strong style={{ color: error < 2 ? 'var(--emerald)' : 'var(--pink)' }}>{error.toFixed(2)}</strong>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: 8 }}>
                    <Plot
                        data={plotData}
                        layout={{
                            uirevision: 'keep',
                            title: { text: `Error: ${error.toFixed(2)}`, font: { size: 14, color: '#8a8a8a' } },
                            xaxis: {
                                title: '',
                                gridcolor: 'rgba(255,255,255,0.04)',
                                zerolinecolor: 'rgba(255,255,255,0.08)',
                            },
                            yaxis: {
                                title: '',
                                gridcolor: 'rgba(255,255,255,0.04)',
                                zerolinecolor: 'rgba(255,255,255,0.08)',
                            },
                            shapes,
                            height: 320,
                            margin: { l: 40, r: 20, t: 40, b: 30 },
                            paper_bgcolor: 'rgba(0,0,0,0)',
                            plot_bgcolor: 'rgba(0,0,0,0)',
                            showlegend: false,
                            font: { color: '#8a8a8a' },
                        }}
                        config={PLOTLY_CONFIG}
                        useResizeHandler
                        style={{ width: '100%' }}
                    />
                </div>
            </div>
        </div>
    );
}
