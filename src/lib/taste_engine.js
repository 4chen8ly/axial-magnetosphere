import { VectorDB } from './vector_db.js';
// import * as ort from 'onnxruntime-web'; // Will be imported in worker context, but here we just define the logic class

export class TasteEngine {
    constructor() {
        this.db = new VectorDB();
        this.userProfile = null; // { vector: Float32Array }
        this.isInitialized = false;
    }

    async init() {
        await this.db.init();
        // Load user profile from DB or calculate it
        // For MVP, let's say we store a special item 'USER_PROFILE'
        const profile = await this.db.get('USER_PROFILE');
        if (profile) {
            this.userProfile = profile;
        } else {
            // Initialize random or zero profile
            this.userProfile = { vector: new Float32Array(384).fill(0), id: 'USER_PROFILE' }; // 384 for MiniLM-L6
        }
        this.isInitialized = true;
        console.log('TasteOS: Engine initialized');
    }

    async getEmbedding(text) {
        // TODO: Implement actual ONNX inference
        // For now, return a random normalized vector
        const dim = 384;
        const vec = new Float32Array(dim);
        for (let i = 0; i < dim; i++) {
            vec[i] = Math.random() - 0.5;
        }
        return this.db.normalize(vec);
    }

    async scoreItems(items) {
        // items: array of { id, text, timestamp, ... }
        const scoredItems = [];

        for (const item of items) {
            // Check cache
            let vector;
            const cached = await this.db.get(item.id);
            if (cached) {
                vector = cached.vector;
            } else {
                vector = await this.getEmbedding(item.text);
                // Store in DB
                await this.db.add({
                    id: item.id,
                    text: item.text,
                    vector: vector,
                    timestamp: Date.now(),
                    weight: 1.0
                });
            }

            // Calculate score
            // score = (0.7 * cosine_similarity) + (0.2 * user_weight_preference) + (0.1 * freshness_score)

            const similarity = this.db.cosineSimilarity(vector, this.userProfile.vector);

            // Freshness
            const hoursSince = (Date.now() - (item.timestamp || Date.now())) / (1000 * 60 * 60);
            const freshness = Math.exp(-hoursSince / 36); // 36h decay

            // Weight preference (from DB or default)
            const weight = cached ? (cached.weight || 1.0) : 1.0;

            const score = (0.7 * similarity) + (0.2 * weight) + (0.1 * freshness);

            scoredItems.push({
                ...item,
                score,
                vector // optional to return
            });
        }

        return scoredItems;
    }

    async updateUserProfile(itemId, action) {
        // Reinforcement learning
        // Action: 'click' (+0.3), 'long_view' (+0.6), 'short_view' (-0.3), 'skip' (-0.5)

        const item = await this.db.get(itemId);
        if (!item) return;

        let delta = 0;
        switch (action) {
            case 'click': delta = 0.3; break;
            case 'long_view': delta = 0.6; break;
            case 'short_view': delta = -0.3; break;
            case 'skip': delta = -0.5; break;
        }

        // Update item weight
        item.weight = (item.weight || 1.0) + delta;
        await this.db.add(item);

        // Update user profile vector (move towards/away from item vector)
        // Simple moving average or gradient descent step
        const learningRate = 0.1;
        const direction = delta > 0 ? 1 : -1;

        for (let i = 0; i < this.userProfile.vector.length; i++) {
            this.userProfile.vector[i] += direction * learningRate * item.vector[i];
        }
        // Re-normalize user profile
        this.userProfile.vector = this.db.normalize(this.userProfile.vector);

        await this.db.add(this.userProfile);
    }
}
