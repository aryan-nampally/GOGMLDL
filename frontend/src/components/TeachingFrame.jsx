export default function TeachingFrame({ title, background, what, why, how, tryThis }) {
    return (
        <div className="teaching-frame glass-card">
            <div className="teaching-frame-head">
                <h3>{title}</h3>
                {background && <p>{background}</p>}
            </div>

            <div className="teaching-grid">
                <div className="teaching-item">
                    <span>What</span>
                    <p>{what}</p>
                </div>
                <div className="teaching-item">
                    <span>Why</span>
                    <p>{why}</p>
                </div>
                <div className="teaching-item">
                    <span>How</span>
                    <p>{how}</p>
                </div>
            </div>

            {tryThis && (
                <div className="teaching-try">
                    <strong>Try This:</strong> {tryThis}
                </div>
            )}
        </div>
    );
}
