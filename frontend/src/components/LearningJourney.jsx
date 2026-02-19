export default function LearningJourney({ step, steps, beats }) {
    const currentBeat = beats[step] || beats[0];

    return (
        <div className="learning-journey glass-card">
            <div className="journey-head">
                <h3>🧭 Learning Journey</h3>
                <span className="journey-step">Step {Math.min(step + 1, steps.length)} of {steps.length}</span>
            </div>

            <div className="journey-track">
                {steps.map((item, i) => (
                    <div key={item.label} className={`journey-node ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
                        <span>{item.icon}</span>
                        <p>{item.label}</p>
                    </div>
                ))}
            </div>

            <div className="journey-story">
                <h4>{currentBeat.title}</h4>
                <p>{currentBeat.text}</p>
            </div>
        </div>
    );
}
