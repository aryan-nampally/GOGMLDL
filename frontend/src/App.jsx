import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/Layout';
import ToastLayer from './components/ToastLayer';
import CinematicBackground from './components/CinematicBackground';
import WelcomePopup from './components/WelcomePopup';

// Lazy load all lab pages
const Home = lazy(() => import('./pages/Home'));
const RegressionLab = lazy(() => import('./pages/RegressionLab'));
const ClassificationLab = lazy(() => import('./pages/ClassificationLab'));
const EnsembleLab = lazy(() => import('./pages/EnsembleLab'));
const ClusteringLab = lazy(() => import('./pages/ClusteringLab'));
const ReductionLab = lazy(() => import('./pages/ReductionLab'));
const AnomalyLab = lazy(() => import('./pages/AnomalyLab'));
const NeuralNetLab = lazy(() => import('./pages/NeuralNetLab'));
const FeedbackPage = lazy(() => import('./pages/Feedback'));
const AdminPage = lazy(() => import('./pages/Admin'));

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
      <WelcomePopup />
      <Layout>
        <Suspense fallback={<LoadingFallback />}>
          <AnimatePresence mode="sync">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/regression" element={<RegressionLab />} />
              <Route path="/classification" element={<ClassificationLab />} />
              <Route path="/ensemble" element={<EnsembleLab />} />
              <Route path="/clustering" element={<ClusteringLab />} />
              <Route path="/dimensionality" element={<ReductionLab />} />
              <Route path="/anomaly" element={<AnomalyLab />} />
              <Route path="/neural" element={<NeuralNetLab />} />
              <Route path="/feedback" element={<FeedbackPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}
