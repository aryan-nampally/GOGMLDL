import { useEffect, useRef, useState } from 'react';

/**
 * VideoEmbed — Unified, collapsible video player card.
 * Used across all concept components with consistent styling.
 *
 * Props:
 *   src       – video file path (e.g. "/videos/LinearFitAnim.mp4")
 *   label     – display text with icon
 *   autoPlay  – default false
 *   startOpen – default true
 */
export default function VideoEmbed({ src, label, autoPlay = false, startOpen = true }) {
    const [open, setOpen] = useState(startOpen);
    const [reduceMotion, setReduceMotion] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const videoRef = useRef(null);

    useEffect(() => {
        const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
        const updateReduceMotion = () => setReduceMotion(!!media?.matches);
        updateReduceMotion();

        const handleVisibility = () => setIsVisible(!document.hidden);
        handleVisibility();

        document.addEventListener('visibilitychange', handleVisibility);
        if (media?.addEventListener) media.addEventListener('change', updateReduceMotion);
        else if (media?.addListener) media.addListener(updateReduceMotion);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            if (media?.removeEventListener) media.removeEventListener('change', updateReduceMotion);
            else if (media?.removeListener) media.removeListener(updateReduceMotion);
        };
    }, []);

    const effectiveAutoPlay = autoPlay && open && !reduceMotion && isVisible;

    useEffect(() => {
        const el = videoRef.current;
        if (!el) return;
        if (!effectiveAutoPlay) {
            el.pause?.();
        }
    }, [effectiveAutoPlay]);

    return (
        <div className="video-card glass-card" style={{ overflow: 'hidden' }}>
            <button
                onClick={() => setOpen(!open)}
                className="video-toggle"
            >
                <span className="video-toggle-chevron">{open ? '▾' : '▸'}</span>
                <span>{label}</span>
            </button>
            {open && (
                <div className="video-player-wrap">
                    <video
                        ref={videoRef}
                        src={src}
                        controls
                        playsInline
                        preload="metadata"
                        autoPlay={effectiveAutoPlay}
                        muted={effectiveAutoPlay}
                        loop={effectiveAutoPlay}
                        style={{ width: '100%', display: 'block', maxHeight: 440, objectFit: 'contain', background: '#000' }}
                    />
                </div>
            )}
        </div>
    );
}
