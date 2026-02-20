/**
 * ComparisonTable — "When to use what?" table for algorithm comparison.
 *
 * Props:
 *   headers – array of column header strings
 *   rows    – array of arrays (each inner array = one row of cells)
 *   caption – optional table caption
 */
export default function ComparisonTable({ headers = [], rows = [], caption }) {
    return (
        <div className="comparison-table-wrap">
            {caption && <h3 className="comparison-caption">{caption}</h3>}
            <div className="comparison-table-scroll">
                <table className="comparison-table">
                    <thead>
                        <tr>
                            {headers.map((h, i) => <th key={i}>{h}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, ri) => (
                            <tr key={ri}>
                                {row.map((cell, ci) => (
                                    <td key={ci}>{cell}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
