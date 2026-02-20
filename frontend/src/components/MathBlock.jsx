import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

/** Inline math: <M>x^2</M> */
export function M({ children }) {
    return <InlineMath math={children} />;
}

/** Block (display) math: <MathBlock>x^2</MathBlock> */
export default function MathBlock({ children, label }) {
    return (
        <div className="math-block">
            {label && <span className="math-label">{label}</span>}
            <BlockMath math={children} />
        </div>
    );
}
