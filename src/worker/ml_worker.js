import { TasteEngine } from '../lib/taste_engine.js';

console.log('TasteOS: ML Worker loaded');

const engine = new TasteEngine();
engine.init();

self.onmessage = async (e) => {
    const { type, payload, requestId } = e.data;

    if (type === 'SCORE_ITEMS') {
        if (!engine.isInitialized) await engine.init();

        const scoredItems = await engine.scoreItems(payload);

        self.postMessage({
            type: 'SCORES_UPDATED',
            payload: scoredItems,
            requestId
        });
    }

    if (type === 'LOG_INTERACTION') {
        if (!engine.isInitialized) await engine.init();
        await engine.updateUserProfile(payload.itemId, payload.type);
    }
};
