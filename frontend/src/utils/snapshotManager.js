/**
 * Snapshot Manager — Persist experiment states to localStorage.
 * 
 * Features:
 * - Namespace snapshots by labId (regression, classification, etc.)
 * - Enforce limit of 10 snapshots per lab (FIFO)
 * - Safe error handling (quota exceeded, parse errors)
 */

const STORAGE_PREFIX = 'ml_atlas_snapshots_';
const LIMIT = 10;

export const snapshotManager = {
    /**
     * Get all snapshots for a specific lab.
     * @param {string} labId 
     * @returns {Array} List of snapshot objects
     */
    getSnapshots(labId) {
        try {
            const key = `${STORAGE_PREFIX}${labId}`;
            const json = localStorage.getItem(key);
            return json ? JSON.parse(json) : [];
        } catch (e) {
            console.warn('Failed to load snapshots:', e);
            return [];
        }
    },

    /**
     * Save a new snapshot.
     * @param {string} labId 
     * @param {Object} config 
     * @param {Object} metrics 
     * @returns {Array} Updated list of snapshots
     */
    saveSnapshot(labId, config, metrics) {
        try {
            const snapshots = this.getSnapshots(labId);
            const newSnapshot = {
                id: crypto.randomUUID(),
                timestamp: new Date().toLocaleTimeString(),
                config: { ...config }, // Clone to avoid mutation refs
                metrics: { ...metrics }
            };

            // Add new, keep only last N
            const updated = [...snapshots, newSnapshot].slice(-LIMIT);

            const key = `${STORAGE_PREFIX}${labId}`;
            localStorage.setItem(key, JSON.stringify(updated));
            return updated;
        } catch (e) {
            console.error('Failed to save snapshot:', e);
            return [];
        }
    },

    /**
     * Delete a specific snapshot by ID.
     * @param {string} labId 
     * @param {string} snapshotId 
     * @returns {Array} Updated list
     */
    deleteSnapshot(labId, snapshotId) {
        try {
            const snapshots = this.getSnapshots(labId);
            const updated = snapshots.filter(s => s.id !== snapshotId);
            const key = `${STORAGE_PREFIX}${labId}`;
            localStorage.setItem(key, JSON.stringify(updated));
            return updated;
        } catch (e) {
            console.error('Failed to delete snapshot:', e);
            return [];
        }
    },

    /**
     * Clear all snapshots for a lab.
     * @param {string} labId 
     */
    clearSnapshots(labId) {
        const key = `${STORAGE_PREFIX}${labId}`;
        localStorage.removeItem(key);
    }
};
