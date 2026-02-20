import { useState, useMemo, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { useFocus } from '../context/FocusContext';
import neuralEngine, { decisionGrid } from '../engines/neuralEngine';
import { runPipeline } from '../engines/baseEngine';
import { PAGE_TRANSITION, STEP_SWITCH, REVEAL, POP } from '../utils/motion';

import IntroSection from '../components/IntroSection';
import AlgorithmDeepDive from '../components/AlgorithmDeepDive';
import MathBlock, { M } from '../components/MathBlock';
import KeyTakeaways from '../components/KeyTakeaways';
import TeachingFrame from '../components/TeachingFrame';
import LearningJourney from '../components/LearningJourney';
import VideoEmbed from '../components/VideoEmbed';
import ComparisonTable from '../components/ComparisonTable';
import './NeuralNetLab.css';

const SnapshotCompare = lazy(() => import('../components/SnapshotCompare'));
const ChartLoader = () => (
    <div style={{ height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Loading…
    </div>
);

/* ═══════════════════════════════════════════════════
   CONTENT DATA
   ═══════════════════════════════════════════════════ */

const STEPS = [
    { label: 'Understand', icon: '💡' },
    { label: 'Experiment', icon: '🧪' },
    { label: 'Results', icon: '📊' },
    { label: 'Challenge', icon: '🏆' },
];

const STORY_BEATS = [
    {
        title: 'How a single neuron sees the world',
        text: 'Build intuition for weighted sums, activation functions, and why linear models can\'t solve XOR.',
    },
    {
        title: 'Architect your own network',
        text: 'Choose layers, neurons, activation, and learning rate — then watch the network learn in real time.',
    },
    {
        title: 'Watch the brain think',
        text: 'See the decision boundary morph, the loss curve fall, and understand what each neuron learned.',
    },
    {
        title: 'Prove you understand depth',
        text: 'Solve a non-linear dataset that stumps simple classifiers. Your architecture choices matter.',
    },
];

const conceptCards = [
    {
        title: 'The Neuron — A Tiny Decision Maker',
        background: 'Every neuron takes inputs, multiplies each by a weight, sums them, adds a bias, then passes the result through an activation function. This is exactly what logistic regression does — a neural network with zero hidden layers is logistic regression!',
        what: 'A single neuron computes z = w·x + b, then applies σ(z) to produce output.',
        why: 'Neurons are the atoms of neural networks. Understand one, and the whole network is just many of them wired together.',
        how: 'Each weight controls sensitivity to one input. Bias shifts the decision threshold. Activation adds non-linearity.',
        tryThis: 'In Step 1, set hidden layers to [1] (single neuron hidden layer) and see how it fails on moons data — then add more neurons.',
    },
    {
        title: 'Layers — From Shallow to Deep',
        background: 'A "deep" network has multiple hidden layers. The first layer learns simple features (edges, directions), the next layers combine them into complex patterns. Two hidden layers with enough neurons can approximate any continuous function (Universal Approximation Theorem).',
        what: 'Stacking layers lets the network learn hierarchical representations — simple features compose into complex ones.',
        why: 'A single layer can only draw one decision boundary. Multiple layers can draw arbitrary curves, spirals, and islands.',
        how: 'Layer 1 might separate "above vs below a line." Layer 2 combines multiple linear separations into curves.',
        tryThis: 'Compare [4] (1 hidden layer) vs [8, 6] (2 hidden layers) on the circles dataset. Watch the boundary\'s shape.',
    },
    {
        title: 'Forward & Backward — The Learning Loop',
        background: 'Forward pass: data flows input → hidden → output to make a prediction. Loss measures how wrong we are. Backward pass: gradients flow backward using the chain rule, telling each weight how to change. This is backpropagation — the engine of all modern deep learning.',
        what: 'Forward pass computes predictions. Backward pass computes gradients. Weight update reduces error.',
        why: 'Without backpropagation, we\'d have to guess how to improve millions of weights. The chain rule makes it tractable.',
        how: 'δ_output = (predicted - target). For hidden layers: δ = (W^T · δ_next) ⊙ activation\'(z).',
        tryThis: 'Watch the loss curve in Step 2 — a smooth descent means backprop is working. Spikes mean the learning rate is too high.',
    },
    {
        title: 'Activation Functions — The Non-Linear Secret',
        background: 'Without activation functions, stacking layers is useless — the whole network collapses into one linear transformation. Activations like ReLU, sigmoid, and tanh add the non-linearity that lets networks learn curves, spirals, and complex boundaries.',
        what: 'ReLU: max(0, x) — simple, fast, dominates modern deep learning. Sigmoid: 1/(1+e^-x) — squashes to (0,1). Tanh: similar but centered at 0.',
        why: 'ReLU avoids the "vanishing gradient" problem that makes sigmoid/tanh networks hard to train when deep.',
        how: 'Each activation changes how gradients flow backward. ReLU passes gradients through where active, blocks where zero.',
        tryThis: 'Train the same architecture with ReLU vs sigmoid on moons data. Compare convergence speed in the loss curve.',
    },
];

const ALGORITHM_DIVES = [
    {
        id: 'architecture', label: 'Network Architecture', color: '#4F8BF9', icon: '🏗️',
        summary: 'How the shape of the network determines what it can learn.',
        intuition: 'Think of each layer as a lens that transforms how the network "sees" data. The input layer is raw pixels/numbers. Each hidden layer re-projects the data into a new coordinate system where the classes become more separable. The output layer draws the final decision line in this transformed space.',
        mathContent: (
            <>
                <MathBlock label="Single Neuron">{'z = \\sum_{i=1}^{n} w_i x_i + b, \\quad a = \\sigma(z)'}</MathBlock>
                <MathBlock label="Layer Output">{'\\mathbf{a}^{[l]} = g^{[l]}(\\mathbf{W}^{[l]} \\cdot \\mathbf{a}^{[l-1]} + \\mathbf{b}^{[l]})'}</MathBlock>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 8 }}>
                    <M>{'g^{[l]}'}</M> is the activation function for layer <M>{'l'}</M>.
                    <M>{'\\mathbf{W}^{[l]}'}</M> is the weight matrix connecting layer <M>{'l-1'}</M> to <M>{'l'}</M>.
                </p>
            </>
        ),
        steps: ['Define input dimension from data features', 'Choose hidden layer widths (neurons per layer)', 'Initialize weights (He/Xavier initialization)', 'Stack layers with chosen activation functions', 'Output layer: sigmoid for binary, softmax for multi-class'],
        whenToUse: 'When the relationship between inputs and outputs is non-linear and you have enough data. Neural networks shine on complex patterns that stumps linear models.',
        prosAndCons: {
            pros: ['Universal function approximation', 'Learns features automatically', 'Scales with data and compute'],
            cons: ['Needs more data than simpler models', 'Black-box: hard to interpret', 'Many hyperparameters to tune'],
        },
    },
    {
        id: 'backprop', label: 'Backpropagation', color: '#F97316', icon: '🔄',
        summary: 'The algorithm that makes deep learning possible — efficient gradient computation via the chain rule.',
        intuition: 'Imagine you\'re adjusting a chain of gears. Turning the last gear (output error) slightly, you can measure how much each upstream gear contributed to the mistake. The chain rule does exactly this — it decomposes the total error into per-weight contributions, flowing backward through the network.',
        mathContent: (
            <>
                <MathBlock label="Binary Cross-Entropy Loss">{'\\mathcal{L} = -\\frac{1}{m}\\sum_{i=1}^{m}\\left[y^{(i)}\\log(\\hat{y}^{(i)}) + (1-y^{(i)})\\log(1-\\hat{y}^{(i)})\\right]'}</MathBlock>
                <MathBlock label="Weight Gradient (Chain Rule)">{'\\frac{\\partial \\mathcal{L}}{\\partial w^{[l]}} = \\frac{\\partial \\mathcal{L}}{\\partial a^{[L]}} \\cdot \\frac{\\partial a^{[L]}}{\\partial z^{[L]}} \\cdots \\frac{\\partial z^{[l]}}{\\partial w^{[l]}}'}</MathBlock>
                <MathBlock label="Weight Update">{'w \\leftarrow w - \\eta \\cdot \\frac{\\partial \\mathcal{L}}{\\partial w}'}</MathBlock>
            </>
        ),
        steps: ['Forward pass: compute all layer activations', 'Compute loss at output', 'Output gradient: δ = â - y (for sigmoid + BCE)', 'Propagate δ backward layer by layer using chain rule', 'Accumulate gradients for all weights', 'Update: w ← w - η·∂L/∂w'],
        whenToUse: 'Always — backpropagation is used in virtually every neural network training. It\'s not an alternative; it\'s the standard.',
        prosAndCons: {
            pros: ['Computationally efficient (one forward + backward pass)', 'Works for any differentiable architecture', 'Scales to billions of parameters'],
            cons: ['Can get stuck in local minima', 'Vanishing/exploding gradients in deep networks', 'Requires differentiable activation functions'],
        },
    },
];

const KEY_TAKEAWAYS = [
    'A neural network is just logistic regression stacked in layers with non-linear activations between them.',
    'Depth (more layers) lets the network learn hierarchical features; width (more neurons) lets each layer represent more patterns.',
    'Backpropagation + gradient descent is how the network learns — it\'s the chain rule applied systematically.',
    'ReLU is the default activation for hidden layers. Sigmoid is for the output in binary classification.',
    'Learning rate is the most sensitive hyperparameter — too high diverges, too low stalls.',
    'Always watch the loss curve. A healthy curve descends smoothly and plateaus. Spikes mean trouble.',
];

/* ═══════════════════════════════════════════════════
   INTERACTIVE NETWORK VISUALIZER (SVG)
   ═══════════════════════════════════════════════════ */

function NetworkViz({ layerSizes = [], weights, activeLayer = -1, mode = 'idle' }) {
    const svgRef = useRef(null);
    const W = 600;
    const H = 320;
    const padX = 60;
    const padY = 30;
    const safeLayerSizes = Array.isArray(layerSizes) ? layerSizes : [];
    const nLayers = safeLayerSizes.length;
    const maxNeurons = safeLayerSizes.length ? Math.max(...safeLayerSizes) : 1;

    const positions = useMemo(() => {
        if (nLayers < 2) return [];
        const pos = [];
        for (let l = 0; l < nLayers; l++) {
            const x = padX + (l / (nLayers - 1)) * (W - 2 * padX);
            const layer = [];
            const count = safeLayerSizes[l] || 0;
            for (let n = 0; n < count; n++) {
                const y = padY + ((n + 0.5) / count) * (H - 2 * padY);
                layer.push({ x, y });
            }
            pos.push(layer);
        }
        return pos;
    }, [safeLayerSizes, nLayers]);

    const layerLabels = useMemo(() => {
        const labels = ['Input'];
        for (let i = 1; i < nLayers - 1; i++) labels.push(`Hidden ${i}`);
        labels.push('Output');
        return labels;
    }, [nLayers]);

    // Compute weight magnitudes for line thickness
    const edgeData = useMemo(() => {
        if (!weights || positions.length < 2) return [];
        const edges = [];
        for (let l = 0; l < weights.length; l++) {
            if (!positions[l] || !positions[l + 1]) continue;
            for (let i = 0; i < positions[l].length; i++) {
                for (let j = 0; j < positions[l + 1].length && j < (weights[l][i]?.length || 0); j++) {
                    const w = weights[l][i][j];
                    edges.push({
                        x1: positions[l][i].x, y1: positions[l][i].y,
                        x2: positions[l + 1][j].x, y2: positions[l + 1][j].y,
                        weight: w, layer: l,
                    });
                }
            }
        }
        return edges;
    }, [weights, positions]);

    const maxW = useMemo(() => {
        if (edgeData.length === 0) return 1;
        return Math.max(...edgeData.map(e => Math.abs(e.weight)), 0.001);
    }, [edgeData]);

    if (positions.length < 2) {
        return (
            <div className="nn-viz-svg" style={{ display: 'grid', placeItems: 'center', height: 320, color: 'var(--text-muted)' }}>
                Build a network to preview it.
            </div>
        );
    }

    return (
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="nn-viz-svg">
            {/* Edges */}
            {edgeData.map((e, i) => {
                const norm = Math.abs(e.weight) / maxW;
                const isForward = mode === 'forward' && (e.layer <= activeLayer || activeLayer === -1);
                const isBackward = mode === 'backward' && (e.layer >= activeLayer || activeLayer === -1);
                const color = e.weight > 0 ? '#4F8BF9' : '#EC4899';
                return (
                    <line key={i}
                        x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                        stroke={color}
                        strokeWidth={0.5 + norm * 3}
                        strokeOpacity={(isForward || isBackward) ? 0.3 + norm * 0.5 : 0.08}
                        className={isForward ? 'edge-glow-fwd' : isBackward ? 'edge-glow-bwd' : ''}
                    />
                );
            })}
            {/* Neurons */}
            {positions.map((layer, l) =>
                layer.map((pos, n) => {
                    const isActive = 
                        (mode === 'forward' && l <= activeLayer) ||
                        (mode === 'backward' && l >= activeLayer);
                    const colors = ['#4F8BF9', '#06D6A0', '#F97316', '#EC4899', '#9B5DE5'];
                    const baseColor = colors[l % colors.length];
                    return (
                        <g key={`${l}-${n}`}>
                            {isActive && (
                                <circle cx={pos.x} cy={pos.y} r="16"
                                    fill="none" stroke={baseColor} strokeWidth="1.5"
                                    opacity="0.4"
                                    className="neuron-pulse"
                                />
                            )}
                            <circle cx={pos.x} cy={pos.y} r="11"
                                fill={isActive ? baseColor : '#1a1a2e'}
                                fillOpacity={isActive ? 0.25 : 0.6}
                                stroke={baseColor}
                                strokeWidth={isActive ? 2 : 1.2}
                                strokeOpacity={isActive ? 1 : 0.4}
                            />
                        </g>
                    );
                })
            )}
            {/* Layer labels */}
            {positions.map((layer, l) => (
                <text key={l} x={layer[0].x} y={H - 6}
                    textAnchor="middle" fill="#888" fontSize="11" fontWeight="600">
                    {layerLabels[l]}
                </text>
            ))}
        </svg>
    );
}

/* ═══════════════════════════════════════════════════
   ANIMATED LOSS CURVE (canvas)
   ═══════════════════════════════════════════════════ */

function LossCurve({ history, animatedEpoch }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !history || history.length === 0) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, w, h);

        const end = Math.min(animatedEpoch + 1, history.length);
        const data = history.slice(0, end);
        if (data.length < 2) return;

        const maxLoss = Math.max(...history.map(d => d.loss), 0.01);
        const pad = { t: 20, b: 30, l: 40, r: 12 };
        const plotW = w - pad.l - pad.r;
        const plotH = h - pad.t - pad.b;

        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = pad.t + (i / 4) * plotH;
            ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
        }

        // Loss curve with glow
        ctx.shadowColor = '#4F8BF9';
        ctx.shadowBlur = 8;
        ctx.strokeStyle = '#4F8BF9';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        data.forEach((d, i) => {
            const x = pad.l + (i / (history.length - 1)) * plotW;
            const y = pad.t + (1 - d.loss / maxLoss) * plotH;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Accuracy curve
        ctx.strokeStyle = '#06D6A0';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        data.forEach((d, i) => {
            const x = pad.l + (i / (history.length - 1)) * plotW;
            const y = pad.t + (1 - d.accuracy) * plotH;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.setLineDash([]);

        // Animated dot
        if (data.length > 0) {
            const last = data[data.length - 1];
            const lx = pad.l + ((data.length - 1) / (history.length - 1)) * plotW;
            const ly = pad.t + (1 - last.loss / maxLoss) * plotH;
            ctx.fillStyle = '#4F8BF9';
            ctx.beginPath();
            ctx.arc(lx, ly, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(79,139,249,0.3)';
            ctx.beginPath();
            ctx.arc(lx, ly, 10, 0, Math.PI * 2);
            ctx.fill();
        }

        // Labels
        ctx.fillStyle = '#888';
        ctx.font = '11px Inter, system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Epoch', w / 2, h - 4);
        ctx.save();
        ctx.translate(12, h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Loss / Accuracy', 0, 0);
        ctx.restore();

        // Legend
        ctx.fillStyle = '#4F8BF9';
        ctx.fillRect(w - 100, 6, 14, 3);
        ctx.fillStyle = '#aaa';
        ctx.font = '10px Inter';
        ctx.textAlign = 'left';
        ctx.fillText('Loss', w - 82, 12);
        ctx.fillStyle = '#06D6A0';
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(w - 100, 22); ctx.lineTo(w - 86, 22); ctx.strokeStyle = '#06D6A0'; ctx.lineWidth = 2; ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#aaa';
        ctx.fillText('Acc', w - 82, 26);

    }, [history, animatedEpoch]);

    return <canvas ref={canvasRef} className="loss-curve-canvas" />;
}

/* ═══════════════════════════════════════════════════
   DECISION BOUNDARY HEATMAP (canvas)
   ═══════════════════════════════════════════════════ */

function DecisionBoundary({ grid, X, y }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !grid) return;

        const dpr = window.devicePixelRatio || 1;
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        const res = grid.resolution;
        const cellW = w / res;
        const cellH = h / res;

        // Draw heatmap
        for (let i = 0; i < res; i++) {
            for (let j = 0; j < res; j++) {
                const idx = i * res + j;
                const p = grid.probs[idx];
                const r = Math.round(79 + (236 - 79) * p);
                const g = Math.round(139 + (72 - 139) * p);
                const b = Math.round(249 + (153 - 249) * p);
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.2)`;
                ctx.fillRect(i * cellW, (res - 1 - j) * cellH, cellW + 1, cellH + 1);
            }
        }

        // Draw data points
        if (X && y) {
            const xMin = -2, xMax = 4, yMin = -2, yMax = 4;
            for (let i = 0; i < X.length; i++) {
                const px = ((X[i][0] - xMin) / (xMax - xMin)) * w;
                const py = (1 - (X[i][1] - yMin) / (yMax - yMin)) * h;
                ctx.fillStyle = y[i] === 1 ? '#EC4899' : '#4F8BF9';
                ctx.beginPath();
                ctx.arc(px, py, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    }, [grid, X, y]);

    return <canvas ref={canvasRef} className="decision-boundary-canvas" />;
}

/* ═══════════════════════════════════════════════════
   MAIN LAB PAGE
   ═══════════════════════════════════════════════════ */

export default function NeuralNetLab() {
    const [step, setStep] = useState(0);
    const { awardXP, awardBadge } = useGame();
    const { enterFocus, exitFocus } = useFocus();
    const [explainMode, setExplainMode] = useState(true);

    // Config
    const [hiddenLayers, setHiddenLayers] = useState([8, 6]);
    const [activation, setActivation] = useState('relu');
    const [learningRate, setLearningRate] = useState(0.05);
    const [epochs, setEpochs] = useState(80);
    const [nSamples, setNSamples] = useState(150);
    const [dataShape, setDataShape] = useState('moons');
    const [layerInput, setLayerInput] = useState('8, 6');

    const config = useMemo(() => ({
        nSamples, dataShape, spread: 1.0,
        hiddenLayers, activation, learningRate, epochs, seed: 42,
    }), [nSamples, dataShape, hiddenLayers, activation, learningRate, epochs]);

    const [results, setResults] = useState(null);
    const [grid, setGrid] = useState(null);
    const [isComputing, setIsComputing] = useState(false);

    // Animated training replay
    const [animatedEpoch, setAnimatedEpoch] = useState(0);
    const [vizMode, setVizMode] = useState('idle'); // 'idle' | 'forward' | 'backward'
    const [vizLayer, setVizLayer] = useState(-1);

    // Run pipeline  
    useEffect(() => {
        setIsComputing(true);
        // Run synchronously (neural engine is fast for small networks)
        try {
            const r = runPipeline(neuralEngine, config);
            const g = decisionGrid(r.model, 50);
            setResults({
                ...r,
                X: r.data.X,
                y: r.data.y,
                yPred: r.predictions,
                model: r.modelParams || r.model,
            });
            setGrid(g);
            setAnimatedEpoch(0);
        } catch (err) {
            console.error('Neural engine error:', err);
        }
        setIsComputing(false);
    }, [config]);

    // Animate loss curve on step 2
    useEffect(() => {
        if (step !== 2 || !results?.model?.history) return;
        setAnimatedEpoch(0);

        const total = results.model.history.length;
        let frame = 0;
        const speed = Math.max(1, Math.floor(total / 120)); // finish in ~2 seconds
        const timer = setInterval(() => {
            frame += speed;
            if (frame >= total) { frame = total - 1; clearInterval(timer); }
            setAnimatedEpoch(frame);
        }, 16);
        return () => clearInterval(timer);
    }, [step, results]);

    // Forward/backward viz animation
    useEffect(() => {
        if (step !== 2 || !results?.model) return;
        const layers = results.model.layerSizes.length;
        let layer = 0;
        let mode = 'forward';

        const timer = setInterval(() => {
            setVizMode(mode);
            setVizLayer(layer);
            layer++;
            if (mode === 'forward' && layer >= layers) {
                mode = 'backward';
                layer = layers - 1;
            } else if (mode === 'backward') {
                layer--;
                if (layer < 0) {
                    mode = 'forward';
                    layer = 0;
                }
            }
        }, 600);
        return () => clearInterval(timer);
    }, [step, results]);

    const canAdvance = (s) => s <= step;
    const handleStepChange = (n) => {
        if (canAdvance(n)) { setStep(n); n === 1 ? enterFocus() : exitFocus(); }
    };
    const handleGoNext = () => {
        if (step < 3) { const n = step + 1; setStep(n); n === 1 ? enterFocus() : exitFocus(); }
    };

    const handleLayerChange = (val) => {
        setLayerInput(val);
        const parsed = val.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0 && n <= 32);
        if (parsed.length > 0) setHiddenLayers(parsed);
    };

    if (!results && isComputing) {
        return <div className="nn-loading"><div className="nn-loading-pulse" /><span>Training Neural Network…</span></div>;
    }

    const totalParams = results?.model?.weights
        ? results.model.weights.reduce((s, W) => s + W.length * W[0].length, 0)
            + results.model.biases.reduce((s, b) => s + b.length, 0)
        : 0;

    return (
        <motion.div className="neural-net-page" variants={PAGE_TRANSITION} initial="initial" animate="animate" exit="exit">
            <LearningJourney steps={STEPS} step={step} beats={STORY_BEATS} onStepClick={handleStepChange} />

            {/* ── INTRO (always visible above steps) ── */}
            <div className={`explain-badge ${explainMode ? 'on' : 'off'}`} onClick={() => setExplainMode(!explainMode)}>
                {explainMode ? '💡 Explain ON' : '💡 Explain OFF'}
            </div>

            <IntroSection
                title="Neural Networks"
                goalText="Understand how layers of simple neurons combine to learn any pattern."
                paragraphs={[
                    'A neural network is just layers of tiny calculators called neurons, each doing a weighted sum + activation. Stacked together, they can approximate any function — from classifying images to generating text.',
                    'In this lab you\'ll build a small network from scratch, watch it learn via backpropagation, and visually see how the decision boundary morphs with each epoch.',
                ]}
                realWorld={{
                    title: 'Where Are Neural Networks Used?',
                    items: [
                        { icon: '🖼️', text: 'Image Recognition — CNNs classify photos, detect faces, read handwriting.' },
                        { icon: '💬', text: 'Natural Language — Transformers (GPT, BERT) power translation, chatbots, search.' },
                        { icon: '🎮', text: 'Game AI — Deep RL agents master Atari, Chess, Go, and robotics.' },
                        { icon: '🏥', text: 'Medical Diagnosis — Detect tumors in scans, predict drug interactions.' },
                    ],
                }}
                prerequisites={['Logistic Regression (Classification Lab)', 'Gradient Descent (Regression Lab)']}
            />

            {/* Manim Video */}
            <VideoEmbed
                src="/videos/NeuralNetScene.mp4"
                label="Watch: Neural Network — Forward Pass, Loss & Backpropagation (Manim Animation)"
            />

            <div className="section-divider-labeled"><span>Mathematical Foundation</span></div>

            <div className="step-indicator">
                {STEPS.map((s, i) => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center' }}>
                        <div
                            className={`step-dot ${i === step ? 'active' : ''} ${i < step ? 'completed' : ''}`}
                            onClick={() => handleStepChange(i)}
                            style={{ cursor: canAdvance(i) ? 'pointer' : 'default' }}
                        >
                            <span>{s.icon}</span><span>{s.label}</span>
                        </div>
                        {i < STEPS.length - 1 && <div className={`step-connector ${i < step ? 'completed' : ''}`} />}
                    </div>
                ))}
            </div>

            <div className="section-divider-labeled"><span>Algorithm Deep Dives</span></div>

            <AnimatePresence mode="sync">
                {/* ════════ STEP 0: UNDERSTAND ════════ */}
                {step === 0 && (
                    <motion.div key="s0" className="step-content" {...STEP_SWITCH}>
                        <h2>Concept Deep Dives</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                            Follow the story below — each concept builds on the previous one, from a single neuron to a full training loop.
                        </p>

                        <div className="narrative-flow">
                            {/* Section 1: The Neuron */}
                            <div className="narrative-section">
                                <div className="narrative-header">
                                    <span className="narrative-step-badge">1</span>
                                    <h3>{conceptCards[0].title}</h3>
                                </div>
                                <TeachingFrame
                                    title={`${conceptCards[0].title} — Beginner Lens`}
                                    background={conceptCards[0].background}
                                    what={conceptCards[0].what}
                                    why={conceptCards[0].why}
                                    how={conceptCards[0].how}
                                    tryThis={conceptCards[0].tryThis}
                                />
                            </div>
                            <div className="narrative-transition">
                                A single neuron is just logistic regression — it can only draw <strong>one straight line</strong>. To learn curves, spirals, and complex shapes, we need to <strong>stack neurons into layers</strong>…
                            </div>

                            {/* Section 2: Layers */}
                            <div className="narrative-section">
                                <div className="narrative-header">
                                    <span className="narrative-step-badge">2</span>
                                    <h3>{conceptCards[1].title}</h3>
                                </div>
                                <TeachingFrame
                                    title={`${conceptCards[1].title} — Beginner Lens`}
                                    background={conceptCards[1].background}
                                    what={conceptCards[1].what}
                                    why={conceptCards[1].why}
                                    how={conceptCards[1].how}
                                    tryThis={conceptCards[1].tryThis}
                                />
                            </div>
                            <div className="narrative-transition">
                                Now we have an architecture, but the weights start random — the network predicts garbage. We need a way to <strong>measure error and systematically improve</strong>. That's what forward + backward passes do…
                            </div>

                            {/* Section 3: Forward & Backward */}
                            <div className="narrative-section">
                                <div className="narrative-header">
                                    <span className="narrative-step-badge">3</span>
                                    <h3>{conceptCards[2].title}</h3>
                                </div>
                                <TeachingFrame
                                    title={`${conceptCards[2].title} — Beginner Lens`}
                                    background={conceptCards[2].background}
                                    what={conceptCards[2].what}
                                    why={conceptCards[2].why}
                                    how={conceptCards[2].how}
                                    tryThis={conceptCards[2].tryThis}
                                />
                            </div>
                            <div className="narrative-transition">
                                Backpropagation works because of one secret ingredient — <strong>non-linear activation functions</strong>. Without them, all layers collapse into one. Let's see why…
                            </div>

                            {/* Section 4: Activation Functions */}
                            <div className="narrative-section">
                                <div className="narrative-header">
                                    <span className="narrative-step-badge">4</span>
                                    <h3>{conceptCards[3].title}</h3>
                                </div>
                                <TeachingFrame
                                    title={`${conceptCards[3].title} — Beginner Lens`}
                                    background={conceptCards[3].background}
                                    what={conceptCards[3].what}
                                    why={conceptCards[3].why}
                                    how={conceptCards[3].how}
                                    tryThis={conceptCards[3].tryThis}
                                />
                            </div>
                        </div>

                        {/* Math Foundation */}
                        <div className="glass-card" style={{ marginTop: 32 }}>
                            <h3 style={{ marginBottom: 16 }}>📐 Math Foundation</h3>
                            {ALGORITHM_DIVES.map((d) => (
                                <AlgorithmDeepDive key={d.id} {...d} />
                            ))}
                        </div>

                        <ComparisonTable
                            caption="📊 Neural Network Architecture Comparison"
                            headers={['Architecture', 'Layers', 'Best For', 'Key Strength', 'Limitation']}
                            rows={[
                                ['Single Perceptron', '1 (no hidden)', 'Linearly separable data', 'Simple, fast', 'Cannot learn XOR'],
                                ['Shallow MLP', '1 hidden layer', 'Tabular data, simple patterns', 'Universal approximator (enough neurons)', 'Needs many neurons for complex patterns'],
                                ['Deep MLP', '2+ hidden layers', 'Complex non-linear boundaries', 'Hierarchical feature learning', 'Vanishing gradients, harder to train'],
                                ['Wide Network', '1 wide hidden layer', 'Memorization, lookup tasks', 'High capacity', 'Poor generalization, overfitting'],
                            ]}
                        />

                        <KeyTakeaways items={KEY_TAKEAWAYS} />

                        <div className="step-actions">
                            <button className="btn btn-primary" onClick={handleGoNext}>Next → Experiment 🧪</button>
                        </div>
                    </motion.div>
                )}

                <div className="section-divider-labeled"><span>Interactive Lab</span></div>

                {/* ════════ STEP 1: EXPERIMENT ════════ */}
                {step === 1 && (
                    <motion.div key="s1" className="step-content" {...STEP_SWITCH}>
                        <h2>Architect Your Network</h2>

                        <div className="nn-config-layout">
                            {/* Left: Live network preview */}
                            <div className="glass-card nn-preview-card">
                                <h4>Live Architecture Preview</h4>
                                <NetworkViz
                                    layerSizes={[2, ...hiddenLayers, 1]}
                                    weights={results?.model?.weights}
                                />
                                <div className="nn-stats">
                                    <span>Layers: {hiddenLayers.length + 2}</span>
                                    <span>Parameters: {totalParams.toLocaleString()}</span>
                                    <span>Activation: {activation}</span>
                                </div>
                            </div>

                            {/* Right: Controls */}
                            <div className="nn-controls">
                                <div className="glass-card config-section">
                                    <label className="config-label">Hidden Layers <span className="config-hint">(comma-separated)</span></label>
                                    <input
                                        type="text"
                                        className="nn-layer-input"
                                        value={layerInput}
                                        onChange={e => handleLayerChange(e.target.value)}
                                        placeholder="e.g. 8, 6, 4"
                                    />
                                    {explainMode && <span className="reg-hint">Each number = neurons in that hidden layer. Try [4], [8, 6], or [12, 8, 4].</span>}
                                </div>

                                <div className="glass-card config-section">
                                    <label className="config-label">Activation Function</label>
                                    <div className="algo-selector">
                                        {['relu', 'sigmoid', 'tanh'].map(a => (
                                            <button key={a} className={`algo-pill ${activation === a ? 'active' : ''}`}
                                                style={{ '--pill-color': a === 'relu' ? '#4F8BF9' : a === 'sigmoid' ? '#EC4899' : '#F97316' }}
                                                onClick={() => setActivation(a)}>
                                                {a.charAt(0).toUpperCase() + a.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                    {explainMode && <span className="reg-hint">ReLU is fastest to train. Sigmoid/Tanh can struggle with vanishing gradients in deep nets.</span>}
                                </div>

                                <div className="glass-card config-section">
                                    <label className="config-label">Learning Rate: <strong>{learningRate.toFixed(3)}</strong></label>
                                    <input type="range" min="0.001" max="0.5" step="0.001" value={learningRate}
                                        onChange={e => setLearningRate(+e.target.value)} />
                                    {explainMode && <span className="reg-hint">Controls step size. Too high → divergence. Too low → slow learning.</span>}
                                </div>

                                <div className="glass-card config-section">
                                    <label className="config-label">Epochs: <strong>{epochs}</strong></label>
                                    <input type="range" min="10" max="300" step="10" value={epochs}
                                        onChange={e => setEpochs(+e.target.value)} />
                                </div>

                                <div className="glass-card config-section">
                                    <label className="config-label">Dataset</label>
                                    <div className="algo-selector">
                                        {[
                                            { id: 'moons', label: '🌙 Moons', color: '#9B5DE5' },
                                            { id: 'circles', label: '⭕ Circles', color: '#06D6A0' },
                                            { id: 'blobs', label: '💠 Blobs', color: '#4F8BF9' },
                                            { id: 'xor', label: '⊕ XOR', color: '#F97316' },
                                        ].map(d => (
                                            <button key={d.id} className={`algo-pill ${dataShape === d.id ? 'active' : ''}`}
                                                style={{ '--pill-color': d.color }}
                                                onClick={() => setDataShape(d.id)}>
                                                {d.label}
                                            </button>
                                        ))}
                                    </div>
                                    {explainMode && <span className="reg-hint">XOR is the classic problem that proves single-layer networks can't learn non-linear patterns.</span>}
                                </div>

                                <div className="glass-card config-section">
                                    <label className="config-label">Samples: <strong>{nSamples}</strong></label>
                                    <input type="range" min="40" max="400" step="10" value={nSamples}
                                        onChange={e => setNSamples(+e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <div className="step-actions">
                            <button className="btn btn-primary" onClick={handleGoNext}>Next → Results 📊</button>
                        </div>
                    </motion.div>
                )}

                {/* ════════ STEP 2: RESULTS ════════ */}
                {step === 2 && results && (
                    <motion.div key="s2" className="step-content" {...STEP_SWITCH}>
                        <h2>Watch the Brain Think</h2>

                        <motion.div {...REVEAL} className="insight-card" style={{ marginBottom: 24 }}>
                            <div className="insight-label">What Just Happened?</div>
                            {results.summary}
                        </motion.div>

                        <div className="grid-4" style={{ marginBottom: 24 }}>
                            <MetricCard value={(results.metrics.accuracy * 100).toFixed(1) + '%'} label="Accuracy" gradient />
                            <MetricCard value={(results.metrics.precision * 100).toFixed(1) + '%'} label="Precision" color="var(--purple)" />
                            <MetricCard value={(results.metrics.recall * 100).toFixed(1) + '%'} label="Recall" color="var(--emerald)" />
                            <MetricCard value={results.metrics.f1.toFixed(3)} label="F1 Score" color={results.metrics.f1 > 0.9 ? 'var(--emerald)' : 'var(--orange)'} />
                        </div>

                        {/* Main visualization grid */}
                        <div className="nn-results-grid">
                            {/* Network with animated forward/backward flow */}
                            <div className="glass-card nn-viz-card">
                                <h4>
                                    Network Activity
                                    <span className={`viz-mode-badge ${vizMode}`}>
                                        {vizMode === 'forward' ? '→ Forward' : vizMode === 'backward' ? '← Backward' : '⏸ Idle'}
                                    </span>
                                </h4>
                                <NetworkViz
                                    layerSizes={results.model.layerSizes}
                                    weights={results.model.weights}
                                    activeLayer={vizLayer}
                                    mode={vizMode}
                                />
                            </div>

                            {/* Loss curve */}
                            <div className="glass-card nn-loss-card">
                                <h4>Training History</h4>
                                <LossCurve history={results.model.history} animatedEpoch={animatedEpoch} />
                                <div className="loss-stats">
                                    <span>Epoch: {Math.min(animatedEpoch + 1, results.model.history.length)}/{results.model.history.length}</span>
                                    <span>Loss: {results.model.history[Math.min(animatedEpoch, results.model.history.length - 1)]?.loss.toFixed(4)}</span>
                                </div>
                            </div>

                            {/* Decision boundary */}
                            <div className="glass-card nn-boundary-card">
                                <h4>Decision Boundary</h4>
                                <DecisionBoundary grid={grid} X={results.X} y={results.y} />
                            </div>
                        </div>

                        <div style={{ marginTop: 24 }}>
                            <Suspense fallback={null}>
                                <SnapshotCompare labId="neural" currentConfig={config} currentMetrics={results.metrics} />
                            </Suspense>
                        </div>

                        <div className="step-actions">
                            <button className="btn btn-primary" onClick={handleGoNext}>Next → Challenge 🏆</button>
                        </div>
                    </motion.div>
                )}

                {/* ════════ STEP 3: CHALLENGE ════════ */}
                {step === 3 && results && (
                    <motion.div key="s3" className="step-content" {...STEP_SWITCH}>
                        <div className="challenge-card glass-card">
                            <h2>🧠 Neural Network Challenge</h2>
                            <p style={{ color: 'var(--text-secondary)', marginTop: 8, marginBottom: 20 }}>
                                Switch to the <strong style={{ color: '#F97316' }}>XOR dataset</strong> and achieve <strong style={{ color: 'var(--emerald)' }}>95%+</strong> accuracy.
                                <br />
                                <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                                    Hint: A single hidden layer with enough neurons can do it — but you need the right activation.
                                </span>
                            </p>

                            <div className="challenge-r2">
                                <div className="challenge-label-row">
                                    <span>Current Accuracy ({dataShape})</span>
                                    <span style={{ color: results.metrics.accuracy > 0.95 && dataShape === 'xor' ? 'var(--emerald)' : 'var(--text-secondary)' }}>
                                        {(results.metrics.accuracy * 100).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="challenge-r2-bar">
                                    <div className="challenge-r2-fill" style={{
                                        width: `${Math.min(results.metrics.accuracy * 100, 100)}%`,
                                        background: results.metrics.accuracy > 0.95 && dataShape === 'xor'
                                            ? 'linear-gradient(90deg, var(--emerald), #04b88a)'
                                            : 'linear-gradient(90deg, var(--orange), var(--pink))',
                                    }} />
                                    <div className="challenge-r2-target" style={{ left: '95%' }} />
                                </div>
                            </div>

                            {dataShape !== 'xor' && (
                                <div className="challenge-hint glass-card" style={{ marginTop: 16, padding: '12px 16px' }}>
                                    <p style={{ color: 'var(--text-secondary)' }}>
                                        ⚠️ Switch to <strong>XOR</strong> dataset first (go back to Experiment), then hit 95%.
                                    </p>
                                </div>
                            )}

                            {results.metrics.accuracy > 0.95 && dataShape === 'xor' && (
                                <motion.div {...POP} className="success-card" style={{ marginTop: 20 }}>
                                    <p><strong>🎉 Neural Network Architect!</strong></p>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        You proved that neural networks can solve problems linear models cannot.
                                    </p>
                                    <ChallengeUnlock awardBadge={awardBadge} awardXP={awardXP} badge="Neural Architect" />
                                </motion.div>
                            )}

                            <div className="step-actions">
                                <button className="btn btn-ghost" onClick={() => handleStepChange(1)}>← Back to Experiment</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════ */

function MetricCard({ value, label, gradient, color, tooltip }) {
    return (
        <div className="glass-card metric-card">
            <div className={`metric-value ${gradient ? 'gradient-text' : ''}`} style={color ? { color } : undefined}>{value}</div>
            <div className="metric-label">
                {tooltip ? (<span className="explain-tooltip">{label}<span className="explain-popup">{tooltip}</span></span>) : label}
            </div>
        </div>
    );
}

function ChallengeUnlock({ awardBadge, awardXP, badge }) {
    const [awarded, setAwarded] = useState(false);
    useEffect(() => {
        if (!awarded) {
            const timer = setTimeout(() => {
                awardBadge(badge);
                awardXP(100, `${badge} Complete`);
                setAwarded(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [awarded, awardBadge, awardXP, badge]);
    return null;
}
