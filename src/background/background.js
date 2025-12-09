console.log('TasteOS: Background service worker loaded');

// Initialize ML Worker
const worker = new Worker(chrome.runtime.getURL('src/worker/ml_worker.js'), { type: 'module' });

const pendingRequests = new Map();

// Handle messages from worker
worker.onmessage = (e) => {
    const { type, payload, requestId } = e.data;
    if (type === 'SCORES_UPDATED') {
        if (pendingRequests.has(requestId)) {
            const { sendResponse } = pendingRequests.get(requestId);
            sendResponse(payload);
            pendingRequests.delete(requestId);
        }
    }
};

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'SCORE_ITEMS') {
        const requestId = Math.random().toString(36).substr(2, 9);
        pendingRequests.set(requestId, { sendResponse });

        worker.postMessage({
            type: 'SCORE_ITEMS',
            payload: message.payload,
            requestId
        });

        return true; // Keep channel open for async response
    }

    if (message.action === 'LOG_INTERACTION') {
        worker.postMessage({
            type: 'LOG_INTERACTION',
            payload: message.payload
        });
    }
});
