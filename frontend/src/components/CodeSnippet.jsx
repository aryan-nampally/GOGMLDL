import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function CodeSnippet({ slope, intercept, nSamples }) {
    const [copied, setCopied] = useState(false);

    const code = `import numpy as np
from sklearn.linear_model import LinearRegression

# 1. Generate Data
n_samples = ${nSamples}
X = np.random.rand(n_samples, 1) * 10
y = ${slope.toFixed(2)} * X + ${intercept.toFixed(2)} + np.random.randn(n_samples, 1)

# 2. Train Model
model = LinearRegression()
model.fit(X, y)

# 3. Results
print(f"Slope: {model.coef_[0][0]:.2f}")
print(f"Intercept: {model.intercept_[0]:.2f}")`;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="glass-card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: '1rem' }}>💻 Python Code</h3>
                <button
                    onClick={handleCopy}
                    className="btn btn-ghost"
                    style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                >
                    {copied ? '✓ Copied!' : 'Copy'}
                </button>
            </div>
            <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                <SyntaxHighlighter
                    language="python"
                    style={oneDark}
                    customStyle={{
                        background: 'rgba(0,0,0,0.4)',
                        padding: '16px',
                        margin: 0,
                        fontSize: '0.82rem',
                        lineHeight: '1.6',
                        borderRadius: 'var(--radius-sm)',
                    }}
                >
                    {code}
                </SyntaxHighlighter>
            </div>
        </div>
    );
}
