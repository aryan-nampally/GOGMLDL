import { useMemo } from 'react';
import Plot from 'react-plotly.js';

const DARK_LAYOUT = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#E0E0E0', family: 'Inter, sans-serif' }, // Brighter text
    margin: { l: 50, r: 20, t: 40, b: 40 },
    uirevision: 'keep',
    showlegend: true,
    legend: { x: 0.01, y: 0.99, font: { size: 12, color: '#E0E0E0' }, bgcolor: 'rgba(0,0,0,0.6)', bordercolor: '#333', borderwidth: 1 },
    xaxis: {
        gridcolor: '#333', // Darker, cleaner grid
        zerolinecolor: '#555',
        showline: true,
        linecolor: '#555',
        tickfont: { size: 11, color: '#AAA' }
    },
    yaxis: {
        gridcolor: '#333',
        zerolinecolor: '#555',
        showline: true,
        linecolor: '#555',
        tickfont: { size: 11, color: '#AAA' }
    },
};
const CFG = { responsive: true, displayModeBar: 'hover', displaylogo: false, scrollZoom: false };
// Manim-inspired colors (Teal, Blue, Red, Yellow...)
const COLORS = ['#88E0EF', '#FF5B5B', '#FFFF66', '#B0B0B0', '#FF99FF', '#66FF66'];

/**
 * ClassificationChart — scatter of classification results with class colors + misclassified markers.
 */
export function ClassificationChart({ X, y, yPred, title }) {
    const traces = useMemo(() => {
        const classes = [...new Set(y)].sort();
        const classTraces = classes.map(cls => {
            const idx = [];
            for (let i = 0; i < y.length; i++) if (y[i] === cls) idx.push(i);
            return {
                x: idx.map(i => X[i][0]),
                y: idx.map(i => X[i][1]),
                mode: 'markers',
                name: `Class ${cls}`,
                marker: { color: COLORS[cls % COLORS.length], size: 8, opacity: 0.8 },
                type: 'scatter',
            };
        });

        // Misclassified
        const wrongIdx = [];
        for (let i = 0; i < y.length; i++) if (y[i] !== yPred[i]) wrongIdx.push(i);
        if (wrongIdx.length > 0) {
            classTraces.push({
                x: wrongIdx.map(i => X[i][0]),
                y: wrongIdx.map(i => X[i][1]),
                mode: 'markers',
                name: 'Misclassified',
                marker: { color: 'rgba(255,51,51,0.3)', size: 14, symbol: 'x', line: { color: '#ff3333', width: 2 } },
                type: 'scatter',
            });
        }

        return classTraces;
    }, [X, y, yPred]);

    return (
        <Plot
            data={traces}
            layout={{
                ...DARK_LAYOUT,
                title: title ? { text: title, font: { size: 13, color: '#8a8a8a' } } : undefined,
                xaxis: { ...DARK_LAYOUT.xaxis, title: 'Feature 1' },
                yaxis: { ...DARK_LAYOUT.yaxis, title: 'Feature 2' },
                height: 420,
            }}
            config={CFG}
            useResizeHandler
            style={{ width: '100%' }}
        />
    );
}

/**
 * EnsembleChart — same as classification chart, for ensemble methods.
 */
export function EnsembleChart({ X, y, yPred, title }) {
    return <ClassificationChart X={X} y={y} yPred={yPred} title={title || 'Ensemble Classification'} />;
}

/**
 * ClusterChart — scatter of cluster assignments with colored markers + noise.
 */
export function ClusterChart({ X, labels, title }) {
    const traces = useMemo(() => {
        const uniqueLabels = [...new Set(labels)].sort((a, b) => a - b);
        return uniqueLabels.map(label => {
            const idx = [];
            for (let i = 0; i < labels.length; i++) if (labels[i] === label) idx.push(i);
            const isNoise = label < 0;
            return {
                x: idx.map(i => X[i][0]),
                y: idx.map(i => X[i][1]),
                mode: 'markers',
                name: isNoise ? 'Noise' : `Cluster ${label}`,
                marker: {
                    color: isNoise ? 'rgba(100,100,100,0.4)' : COLORS[label % COLORS.length],
                    size: isNoise ? 5 : 9,
                    opacity: isNoise ? 0.5 : 0.85,
                    symbol: isNoise ? 'x' : 'circle',
                    line: isNoise ? { color: '#aa0000', width: 1 } : undefined,
                },
                type: 'scatter',
            };
        });
    }, [X, labels]);

    return (
        <Plot
            data={traces}
            layout={{
                ...DARK_LAYOUT,
                title: title ? { text: title, font: { size: 13, color: '#8a8a8a' } } : { text: 'Cluster Assignments', font: { size: 13, color: '#8a8a8a' } },
                xaxis: { ...DARK_LAYOUT.xaxis, title: 'Feature 1' },
                yaxis: { ...DARK_LAYOUT.yaxis, title: 'Feature 2' },
                height: 420,
            }}
            config={CFG}
            useResizeHandler
            style={{ width: '100%' }}
        />
    );
}

/**
 * EmbeddingChart — 2D projection scatter (PCA / t-SNE).
 */
export function EmbeddingChart({ projected, labels, title }) {
    const traces = useMemo(() => {
        const uniqueLabels = [...new Set(labels)].sort();
        return uniqueLabels.map(label => {
            const idx = [];
            for (let i = 0; i < labels.length; i++) if (labels[i] === label) idx.push(i);
            return {
                x: idx.map(i => projected[i][0]),
                y: idx.map(i => projected[i][1]),
                mode: 'markers',
                name: `Class ${label}`,
                marker: { color: COLORS[label % COLORS.length], size: 8, opacity: 0.85 },
                type: 'scatter',
            };
        });
    }, [projected, labels]);

    return (
        <Plot
            data={traces}
            layout={{
                ...DARK_LAYOUT,
                title: title ? { text: title, font: { size: 13, color: '#8a8a8a' } } : { text: '2D Embedding', font: { size: 13, color: '#8a8a8a' } },
                xaxis: { ...DARK_LAYOUT.xaxis, title: 'Component 1' },
                yaxis: { ...DARK_LAYOUT.yaxis, title: 'Component 2' },
                height: 420,
            }}
            config={CFG}
            useResizeHandler
            style={{ width: '100%' }}
        />
    );
}

/**
 * VarianceChart — bar chart of PCA explained variance ratio.
 */
export function VarianceChart({ varianceRatio }) {
    const data = useMemo(() => [{
        x: varianceRatio.map((_, i) => `PC${i + 1}`),
        y: varianceRatio.map(v => (v * 100)),
        type: 'bar',
        marker: {
            color: varianceRatio.map((_, i) => COLORS[i % COLORS.length]),
            opacity: 0.85,
        },
        text: varianceRatio.map(v => `${(v * 100).toFixed(1)}%`),
        textposition: 'outside',
        textfont: { color: '#8a8a8a', size: 11 },
    }], [varianceRatio]);

    return (
        <Plot
            data={data}
            layout={{
                ...DARK_LAYOUT,
                title: { text: 'Explained Variance Ratio', font: { size: 13, color: '#8a8a8a' } },
                xaxis: { ...DARK_LAYOUT.xaxis, title: 'Principal Component' },
                yaxis: { ...DARK_LAYOUT.yaxis, title: 'Variance (%)', range: [0, 100] },
                height: 320,
                showlegend: false,
            }}
            config={CFG}
            useResizeHandler
            style={{ width: '100%' }}
        />
    );
}

/**
 * AnomalyChart — scatter with normal vs anomaly + detection correctness.
 */
export function AnomalyChart({ X, yTrue, yPred, title }) {
    const traces = useMemo(() => {
        const normalIdx = [], trueAnomalyIdx = [], correctDetect = [], wrongDetect = [];
        for (let i = 0; i < X.length; i++) {
            if (yTrue[i] === 0 && yPred[i] === 0) normalIdx.push(i);
            else if (yTrue[i] === 1 && yPred[i] === 1) correctDetect.push(i);
            else if (yTrue[i] === 0 && yPred[i] === 1) wrongDetect.push(i);
            else trueAnomalyIdx.push(i); // true anomaly, not detected
        }

        const makeTrace = (idx, name, color, size, symbol) => ({
            x: idx.map(i => X[i][0]),
            y: idx.map(i => X[i][1]),
            mode: 'markers',
            name,
            marker: { color, size, opacity: 0.8, symbol },
            type: 'scatter',
        });

        return [
            makeTrace(normalIdx, 'Normal', '#4F8BF9', 7, 'circle'),
            makeTrace(trueAnomalyIdx, 'Missed Anomaly', '#ff4444', 10, 'diamond'),
            makeTrace(correctDetect, '✓ Detected', '#06D6A0', 11, 'star'),
            makeTrace(wrongDetect, '✗ False Alarm', '#F97316', 10, 'x'),
        ].filter(t => t.x.length > 0);
    }, [X, yTrue, yPred]);

    return (
        <Plot
            data={traces}
            layout={{
                ...DARK_LAYOUT,
                title: title ? { text: title, font: { size: 13, color: '#8a8a8a' } } : { text: 'Anomaly Detection', font: { size: 13, color: '#8a8a8a' } },
                xaxis: { ...DARK_LAYOUT.xaxis, title: 'Feature 1' },
                yaxis: { ...DARK_LAYOUT.yaxis, title: 'Feature 2' },
                height: 420,
            }}
            config={CFG}
            useResizeHandler
            style={{ width: '100%' }}
        />
    );
}

/**
 * ROCChart — Receiver Operating Characteristic curve.
 */
export function ROCChart({ fpr, tpr, auc }) {
    return (
        <Plot
            data={[
                {
                    x: fpr,
                    y: tpr,
                    mode: 'lines',
                    name: `ROC (AUC = ${auc.toFixed(3)})`,
                    line: { color: COLORS[2], width: 3 },
                    fill: 'tozeroy',
                    fillcolor: 'rgba(6, 214, 160, 0.1)',
                },
                {
                    x: [0, 1],
                    y: [0, 1],
                    mode: 'lines',
                    name: 'Random',
                    line: { color: 'rgba(255,255,255,0.3)', width: 2, dash: 'dash' },
                }
            ]}
            layout={{
                ...DARK_LAYOUT,
                title: { text: 'ROC Curve', font: { size: 13, color: '#8a8a8a' } },
                xaxis: { ...DARK_LAYOUT.xaxis, title: 'False Positive Rate', range: [0, 1] },
                yaxis: { ...DARK_LAYOUT.yaxis, title: 'True Positive Rate', range: [0, 1] },
                height: 320,
                showlegend: true,
            }}
            config={CFG}
            useResizeHandler
            style={{ width: '100%' }}
        />
    );
}

/**
 * PRChart — Precision-Recall curve.
 */
export function PRChart({ precision, recall, auc }) {
    return (
        <Plot
            data={[
                {
                    x: recall,
                    y: precision,
                    mode: 'lines',
                    name: `PR (AUC = ${auc.toFixed(3)})`,
                    line: { color: COLORS[4], width: 3 },
                    fill: 'tozeroy',
                    fillcolor: 'rgba(155, 93, 229, 0.1)',
                }
            ]}
            layout={{
                ...DARK_LAYOUT,
                title: { text: 'Precision-Recall Curve', font: { size: 13, color: '#8a8a8a' } },
                xaxis: { ...DARK_LAYOUT.xaxis, title: 'Recall', range: [0, 1] },
                yaxis: { ...DARK_LAYOUT.yaxis, title: 'Precision', range: [0, 1] },
                height: 320,
                showlegend: true,
            }}
            config={CFG}
            useResizeHandler
            style={{ width: '100%' }}
        />
    );
}

/**
 * ElbowChart — Line plot of Inertia vs K.
 */
export function ElbowChart({ ks, inertias }) {
    return (
        <Plot
            data={[{
                x: ks,
                y: inertias,
                mode: 'lines+markers',
                name: 'Inertia',
                line: { color: COLORS[0], width: 3 },
                marker: { size: 8, color: COLORS[0] },
            }]}
            layout={{
                ...DARK_LAYOUT,
                title: { text: 'Elbow Method (Inertia)', font: { size: 13, color: '#8a8a8a' } },
                xaxis: { ...DARK_LAYOUT.xaxis, title: 'Number of Clusters (k)' },
                yaxis: { ...DARK_LAYOUT.yaxis, title: 'Inertia', showticklabels: false },
                height: 320,
                showlegend: false,
            }}
            config={CFG}
            useResizeHandler
            style={{ width: '100%' }}
        />
    );
}

/**
 * SilhouetteChart — Bar plot of silhouette coefficients.
 */
export function SilhouetteChart({ silhouetteSamples, labels, avgScore }) {
    // Transform data for plotting: group by cluster, sort by score
    const data = useMemo(() => {
        const clusters = [...new Set(labels)].filter(l => l >= 0).sort((a, b) => a - b);
        const traces = [];
        let yOffset = 0;

        clusters.forEach(cluster => {
            // Get scores for this cluster
            const clusterScores = silhouetteSamples
                .map((s, i) => ({ s, l: labels[i] }))
                .filter(d => d.l === cluster)
                .map(d => d.s)
                .sort((a, b) => b - a); // descending order

            // Create bar trace for this cluster
            // We want them stacked vertically. 
            // x = score (width), y = index (height)
            const y = clusterScores.map((_, i) => i + yOffset);

            traces.push({
                x: clusterScores,
                y: y,
                orientation: 'h',
                name: `Cluster ${cluster}`,
                type: 'bar',
                marker: { color: COLORS[cluster % COLORS.length], opacity: 0.8 },
                width: 1, // continuous bars
            });

            yOffset += clusterScores.length;
        });

        return traces;
    }, [silhouetteSamples, labels]);

    return (
        <Plot
            data={data}
            layout={{
                ...DARK_LAYOUT,
                title: { text: `Silhouette Analysis (Avg = ${avgScore.toFixed(2)})`, font: { size: 13, color: '#8a8a8a' } },
                xaxis: { ...DARK_LAYOUT.xaxis, title: 'Silhouette Coefficient', range: [-0.1, 1] },
                yaxis: { ...DARK_LAYOUT.yaxis, title: 'Samples', showticklabels: false },
                bargap: 0, // Make bars touch
                height: 320,
                shapes: [{
                    type: 'line',
                    x0: avgScore,
                    x1: avgScore,
                    y0: 0,
                    y1: 1,
                    xref: 'x',
                    yref: 'paper',
                    line: { color: 'rgba(255, 255, 255, 0.5)', width: 2, dash: 'dash' }
                }]
            }}
            config={CFG}
            useResizeHandler
            style={{ width: '100%' }}
        />
    );
}

/**
 * FeatureImportanceChart — Horizontal bar plot of feature importances.
 */
export function FeatureImportanceChart({ importances, featureNames }) {
    const data = useMemo(() => {
        if (!importances || importances.length === 0) return [];

        // Create objects { index, score }
        const items = importances.map((imp, i) => ({
            i,
            imp,
            name: featureNames?.[i] || `Feature ${i + 1}`
        }));

        // Sort by importance ascending (for horizontal bar chart, bottom to top)
        items.sort((a, b) => a.imp - b.imp);

        const x = items.map(d => d.imp);
        const y = items.map(d => d.name);

        return [{
            type: 'bar',
            x: x,
            y: y,
            orientation: 'h',
            marker: { color: COLORS[0], opacity: 0.8 },
            text: x.map(v => v.toFixed(3)),
            textposition: 'auto',
        }];
    }, [importances, featureNames]);

    return (
        <Plot
            data={data}
            layout={{
                ...DARK_LAYOUT,
                title: { text: 'Feature Importance', font: { size: 13, color: '#8a8a8a' } },
                xaxis: { ...DARK_LAYOUT.xaxis, title: 'Importance (Gini)' },
                yaxis: { ...DARK_LAYOUT.yaxis, automargin: true },
                height: 320,
                margin: { l: 100, r: 20, t: 40, b: 40 },
            }}
            config={CFG}
            useResizeHandler
            style={{ width: '100%' }}
        />
    );
}
