import { NavLink } from 'react-router-dom';
import { useGame } from '../context/GameContext';

const NAV_ITEMS = [
    { to: '/', label: 'Home', icon: '🏠', end: true, section: 'Core' },
    { to: '/regression', label: 'Regression', icon: '📈', section: 'Supervised' },
    { to: '/classification', label: 'Classification', icon: '🎯', section: 'Supervised' },
    { to: '/ensemble', label: 'Ensemble', icon: '🌲', section: 'Supervised' },
    { to: '/neural', label: 'Neural Networks', icon: '🧠', section: 'Supervised' },
    { to: '/clustering', label: 'Clustering', icon: '🔮', section: 'Unsupervised' },
    { to: '/dimensionality', label: 'Dim Reduction', icon: '🗺️', section: 'Unsupervised' },
    { to: '/anomaly', label: 'Anomaly', icon: '🔍', section: 'Unsupervised' },
    { to: '/feedback', label: 'Feedback', icon: '💬', section: 'Meta' },
];

export default function Sidebar({ collapsed, onToggle }) {
    const { xp, level, badges } = useGame();
    const xpInLevel = xp % 100;

    return (
        <aside className="sidebar">
            {/* Header */}
            <div className="sidebar-header">
                {!collapsed && (
                    <span className="sidebar-logo gradient-text">ML ATLAS</span>
                )}
                <button className="sidebar-toggle" onClick={onToggle} title="Toggle sidebar">
                    {collapsed ? '→' : '←'}
                </button>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {!collapsed && <div className="nav-section-label">Core</div>}
                {NAV_ITEMS.filter((item) => item.section === 'Core').map((item) => (
                    <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">{item.icon}</span>
                        {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                ))}

                {!collapsed && <div className="nav-section-label">Supervised</div>}
                {NAV_ITEMS.filter((item) => item.section === 'Supervised').map((item) => (
                    <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">{item.icon}</span>
                        {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                ))}

                {!collapsed && <div className="nav-section-label">Unsupervised</div>}
                {NAV_ITEMS.filter((item) => item.section === 'Unsupervised').map((item) => (
                    <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">{item.icon}</span>
                        {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                ))}

                {!collapsed && <div className="nav-section-label">Meta</div>}
                {NAV_ITEMS.filter((item) => item.section === 'Meta').map((item) => (
                    <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">{item.icon}</span>
                        {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* Gamification */}
            <div className="sidebar-game">
                {!collapsed && <div className="game-title">🏆 Your Progress</div>}
                <div className="level-display">
                    <span className="level-badge">{collapsed ? `L${level}` : `Lvl ${level}`}</span>
                    {!collapsed && <span className="xp-text">{xp} XP</span>}
                </div>
                {!collapsed && (
                    <>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${xpInLevel}%` }} />
                        </div>
                        {badges.length > 0 && (
                            <div className="badges-row">
                                {badges.slice(0, 3).map((b, i) => (
                                    <div key={i} className="badge-item" title={b}>🏅</div>
                                ))}
                                {badges.length > 3 && (
                                    <div className="badge-item" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        +{badges.length - 3}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </aside>
    );
}
