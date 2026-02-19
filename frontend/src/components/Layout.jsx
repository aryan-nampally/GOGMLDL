import { useState } from 'react';
import Sidebar from './Sidebar';
import './Layout.css';

export default function Layout({ children }) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className={`app-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
            <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
