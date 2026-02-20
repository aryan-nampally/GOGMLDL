import Plot from 'react-plotly.js';

const PLOTLY_CONFIG = { responsive: true, displayModeBar: 'hover', displaylogo: false, scrollZoom: false };

export default function ResidualChart({ yTrue, yPred }) {
    const residuals = yTrue.map((yi, i) => yi - yPred[i]);

    return (
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
                    x0: Math.min(...yPred), y0: 0,
                    x1: Math.max(...yPred), y1: 0,
                    line: { color: 'rgba(255,255,255,0.3)', width: 2, dash: 'dash' },
                }],
                title: { text: 'Residual Plot (Errors)', font: { size: 13, color: '#8a8a8a' } },
                xaxis: { title: 'Predicted', gridcolor: 'rgba(255,255,255,0.04)' },
                yaxis: { title: 'Residuals', gridcolor: 'rgba(255,255,255,0.04)' },
                uirevision: 'keep',
                height: 320,
                margin: { l: 50, r: 20, t: 40, b: 40 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                font: { color: '#8a8a8a' },
            }}
            config={PLOTLY_CONFIG}
            useResizeHandler
            style={{ width: '100%' }}
        />
    );
}
