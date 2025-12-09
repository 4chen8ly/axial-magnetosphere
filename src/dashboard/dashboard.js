import { VectorDB } from '../lib/vector_db.js';

const db = new VectorDB();

document.addEventListener('DOMContentLoaded', async () => {
    await db.init();
    renderStats();
    renderLogs();
    renderGraph();
});

async function renderStats() {
    const items = await db.getAll();
    document.getElementById('totalScanned').textContent = items.length;
    // Mock other stats for now or derive from items
    const interactions = items.filter(i => i.weight !== 1.0).length;
    document.getElementById('totalInteractions').textContent = interactions;
}

async function renderLogs() {
    const items = await db.getAll();
    // Filter items that have been modified (weight != 1.0)
    const logs = items
        .filter(i => i.weight !== 1.0)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10);

    const tbody = document.getElementById('logsTable');
    tbody.innerHTML = '';

    logs.forEach(item => {
        const tr = document.createElement('tr');
        const date = new Date(item.timestamp).toLocaleTimeString();
        const delta = (item.weight - 1.0).toFixed(2);
        const action = delta > 0 ? 'Positive' : 'Negative';

        tr.innerHTML = `
      <td>${date}</td>
      <td><span class="tag">${action}</span></td>
      <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.id}</td>
      <td style="color: ${delta > 0 ? '#10b981' : '#ef4444'}">${delta > 0 ? '+' : ''}${delta}</td>
    `;
        tbody.appendChild(tr);
    });
}

async function renderGraph() {
    const canvas = document.getElementById('tasteGraph');
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;

    const items = await db.getAll();
    const userProfile = await db.get('USER_PROFILE');

    ctx.clearRect(0, 0, width, height);

    // Draw center (User)
    const cx = width / 2;
    const cy = height / 2;

    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#8b5cf6';
    ctx.fill();
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#8b5cf6';

    // Draw items
    // Projection: 
    // Angle = hash of ID (random stable angle)
    // Distance = 1 - similarity (closer = more similar)

    items.forEach(item => {
        if (item.id === 'USER_PROFILE') return;

        let similarity = 0;
        if (userProfile && item.vector) {
            similarity = db.cosineSimilarity(item.vector, userProfile.vector);
        } else {
            similarity = Math.random(); // Fallback if no profile
        }

        // Normalize similarity -1 to 1 -> 0 to 1
        // Actually cosine is -1 to 1.
        // Distance should be inverse.
        // dist = (1 - sim) * scale

        const dist = (1 - similarity) * (Math.min(width, height) / 2 - 20);

        // Random angle based on ID
        let hash = 0;
        for (let i = 0; i < item.id.length; i++) hash = item.id.charCodeAt(i) + ((hash << 5) - hash);
        const angle = (hash % 360) * (Math.PI / 180);

        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist;

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = item.weight > 1.0 ? '#10b981' : (item.weight < 1.0 ? '#ef4444' : '#94a3b8');
        ctx.fill();
    });
}
