import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/Layout';
import ToastLayer from './components/ToastLayer';
import CinematicBackground from './components/CinematicBackground';

// Lazy load all lab pages
const Home = lazy(() => import('./pages/Home'));
const RegressionLab = lazy(() => import('./pages/RegressionLab'));
const ClassificationLab = lazy(() => import('./pages/ClassificationLab'));
const EnsembleLab = lazy(() => import('./pages/EnsembleLab'));
const ClusteringLab = lazy(() => import('./pages/ClusteringLab'));
const ReductionLab = lazy(() => import('./pages/ReductionLab'));
const AnomalyLab = lazy(() => import('./pages/AnomalyLab'));

function LoadingFallback() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', color: 'var(--text-muted)', fontSize: '0.9rem',
    }}>
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <CinematicBackground />
      <ToastLayer />
      <Layout>
        <Suspense fallback={<LoadingFallback />}>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/regression" element={<RegressionLab />} />
              <Route path="/classification" element={<ClassificationLab />} />
              <Route path="/ensemble" element={<EnsembleLab />} />
              <Route path="/clustering" element={<ClusteringLab />} />
              <Route path="/dimensionality" element={<ReductionLab />} />
              <Route path="/anomaly" element={<AnomalyLab />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}
