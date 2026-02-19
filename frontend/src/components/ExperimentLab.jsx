import { useFocus } from '../context/FocusContext';

export default function ExperimentLab({ config, onChange }) {
    const { enterFocus, exitFocus } = useFocus();
    const update = (key, val) => onChange({ ...config, [key]: val });

    // When user starts dragging a slider, enter focus mode.
    // When they release, exit after a brief delay.
    const sliderProps = (key) => ({
        onMouseDown: enterFocus,
        onTouchStart: enterFocus,
        onMouseUp: () => setTimeout(exitFocus, 800),
        onTouchEnd: () => setTimeout(exitFocus, 800),
        onChange: (e) => update(key, +e.target.value),
    });

    return (
        <div>
            <h2 style={{ marginBottom: 8 }}>🧪 The Laboratory</h2>
            <p style={{ marginBottom: 20, color: 'var(--text-secondary)' }}>
                Design your own experiment. Change the data and see what happens.
            </p>

            <div className="grid-2">
                <div className="glass-card">
                    <h4 style={{ marginBottom: 16, fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Data Generator
                    </h4>
                    <div className="slider-group">
                        <label>
                            <span>Number of Points</span>
                            <span className="slider-value">{config.nSamples}</span>
                        </label>
                        <input type="range" min="10" max="200" step="1" value={config.nSamples} {...sliderProps('nSamples')} />
                    </div>
                    <div className="slider-group">
                        <label>
                            <span>Noise Level</span>
                            <span className="slider-value">{config.noise}</span>
                        </label>
                        <input type="range" min="0" max="50" step="1" value={config.noise} {...sliderProps('noise')} />
                    </div>
                </div>

                <div className="glass-card">
                    <h4 style={{ marginBottom: 16, fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        True Underlying Rule
                    </h4>
                    <div className="slider-group">
                        <label>
                            <span>Line Steepness (Slope)</span>
                            <span className="slider-value">{config.slope.toFixed(1)}</span>
                        </label>
                        <input type="range" min="-5" max="5" step="0.1" value={config.slope} {...sliderProps('slope')} />
                    </div>
                    <div className="slider-group">
                        <label>
                            <span>Starting Position (Intercept)</span>
                            <span className="slider-value">{config.intercept.toFixed(1)}</span>
                        </label>
                        <input type="range" min="-10" max="10" step="0.1" value={config.intercept} {...sliderProps('intercept')} />
                    </div>
                </div>
            </div>
        </div>
    );
}
