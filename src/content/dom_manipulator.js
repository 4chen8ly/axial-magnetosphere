export class DomManipulator {
    constructor() {
        this.isReordering = false;
    }

    reorder(items) {
        if (this.isReordering) return;
        this.isReordering = true;

        requestAnimationFrame(() => {
            try {
                this.performReorder(items);
            } catch (e) {
                console.error('TasteOS: Reorder failed', e);
            } finally {
                this.isReordering = false;
            }
        });
    }

    performReorder(items) {
        // items: array of { element, score, id }
        // Sort by score descending
        const sortedItems = [...items].sort((a, b) => b.score - a.score);

        // Group by parent container to handle multiple feeds or grid rows
        const parentMap = new Map();
        items.forEach(item => {
            const parent = item.element.parentElement;
            if (!parentMap.has(parent)) parentMap.set(parent, []);
            parentMap.get(parent).push(item);
        });

        parentMap.forEach((groupItems, parent) => {
            // Get all children of the parent that are feed items
            // We need to respect the current DOM order of sponsored items
            const children = Array.from(parent.children);

            // Identify sponsored items and their indices
            const sponsoredIndices = new Set();
            children.forEach((child, index) => {
                if (child.dataset.tasteOsSponsored === 'true') {
                    sponsoredIndices.add(index);
                }
            });

            // Filter out sponsored items from our sorted list (they shouldn't be moved)
            // Actually, the input 'items' might not include sponsored ones if FeedScanner filtered them.
            // But we need to fill the non-sponsored slots with our sorted items.

            let sortedIndex = 0;
            const fragment = document.createDocumentFragment();

            // Reconstruct the order
            // This is tricky because we want to insert sorted items into non-sponsored slots
            // But 'appendChild' moves the element.

            // Simpler approach for MVP: 
            // 1. Extract all non-sponsored items.
            // 2. Sort them.
            // 3. Re-insert them into the DOM, skipping sponsored slots?
            // No, that's hard if we don't know which slots are which.

            // Better approach:
            // Just append them in order? No, that breaks mixed feeds.

            // "Google-official" robust way:
            // 1. Get all feed items in the container (both sponsored and organic).
            // 2. Separate them.
            // 3. Sort organic.
            // 4. Re-interleave.

            // For now, let's assume we just append them in sorted order at the end? No.
            // Let's try to swap them in place?

            // Let's go with:
            // 1. Get all items currently in DOM.
            // 2. If item is sponsored, keep it.
            // 3. If item is organic, replace it with the next best organic item.

            const organicItems = groupItems.filter(i => i.element.dataset.tasteOsSponsored !== 'true');
            // Sort organic items by score
            organicItems.sort((a, b) => b.score - a.score);

            let organicPtr = 0;

            // We need to move elements. 
            // We can loop through the DOM, find organic slots, and append the next best organic item.
            // But we can't easily "replace" without removing.

            // Strategy: 
            // Create a new list of nodes in the desired order.
            // Then append them to the parent? (This might cause scroll jump if not careful)

            const newOrder = [];
            children.forEach(child => {
                if (child.dataset.tasteOsSponsored === 'true') {
                    newOrder.push(child);
                } else {
                    // Is this child one of our managed items?
                    const isManaged = groupItems.find(i => i.element === child);
                    if (isManaged) {
                        if (organicPtr < organicItems.length) {
                            newOrder.push(organicItems[organicPtr].element);
                            organicPtr++;
                        }
                    } else {
                        // Unknown item (maybe header or other junk), keep it
                        newOrder.push(child);
                    }
                }
            });

            // Apply new order
            newOrder.forEach(node => parent.appendChild(node));
        });
    }
}
