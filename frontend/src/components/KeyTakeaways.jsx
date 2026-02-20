/**
 * KeyTakeaways — Summary card at end of a section/lab.
 */
export default function KeyTakeaways({ items = [], title = 'Key Takeaways' }) {
    return (
        <div className="key-takeaways glass-card">
            <h3>📝 {title}</h3>
            <ul>
                {items.map((item, i) => (
                    <li key={i}>
                        <span className="kt-num">{i + 1}</span>
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
