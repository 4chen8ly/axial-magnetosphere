import { FeedScanner } from './feed_scanner.js';
import { DomManipulator } from './dom_manipulator.js';
import { InteractionTracker } from './interaction_tracker.js';

console.log('TasteOS: Content script loaded');

const scanner = new FeedScanner();
const manipulator = new DomManipulator();
const tracker = new InteractionTracker();

// Initial scan
setTimeout(() => {
    scanner.observe((items) => {
        console.log('TasteOS: New items detected:', items.length);

        // Track items
        items.forEach(item => tracker.track(item.element, item.id));

        chrome.runtime.sendMessage({ action: 'SCORE_ITEMS', payload: items }, (response) => {
            if (response) {
                console.log('TasteOS: Received scores for', response.length, 'items');
                manipulator.reorder(response);
            }
        });
    });

    // Trigger first scan manually
    const initialItems = scanner.scan();
    console.log('TasteOS: Initial items:', initialItems.length);

    if (initialItems.length > 0) {
        // Track items
        initialItems.forEach(item => tracker.track(item.element, item.id));

        chrome.runtime.sendMessage({ action: 'SCORE_ITEMS', payload: initialItems }, (response) => {
            if (response) {
                console.log('TasteOS: Received scores for', response.length, 'items');
                manipulator.reorder(response);
            }
        });
    }
}, 2000); // Wait for dynamic content
