import { useMemo } from 'react';
import Plot from 'react-plotly.js';

export default function RegressionChart({ X, y, slope, intercept, title }) {
    const lineData = useMemo(() => {
        const xMin = Math.min(...X);
        const xMax = Math.max(...X);
        const xLine = [];
        for (let i = 0; i <= 100; i++) xLine.push(xMin + (xMax - xMin) * (i / 100));
        const yLine = xLine.map((x) => slope * x + intercept);
        return { xLine, yLine };
    }, [X, slope, intercept]);

    return (
        <Plot
            data={[
                {
                    x: X, y,
                    mode: 'markers',
                    name: 'Data',
                    marker: { color: '#06D6A0', size: 7, opacity: 0.8 },
                },
                {
                    x: lineData.xLine, y: lineData.yLine,
                    mode: 'lines',
                    name: 'Best Fit',
                    line: { color: '#4F8BF9', width: 3 },
                },
            ]}
            layout={{
                title: title ? { text: title, font: { size: 13, color: '#8a8a8a' } } : undefined,
                xaxis: { title: 'X', gridcolor: 'rgba(255,255,255,0.04)', zerolinecolor: 'rgba(255,255,255,0.08)' },
                yaxis: { title: 'y', gridcolor: 'rgba(255,255,255,0.04)', zerolinecolor: 'rgba(255,255,255,0.08)' },
                height: 400,
                margin: { l: 50, r: 20, t: 40, b: 40 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                showlegend: true,
                legend: { x: 0.01, y: 0.99, font: { size: 11, color: '#8a8a8a' } },
                font: { color: '#8a8a8a' },
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
        />
    );
}
