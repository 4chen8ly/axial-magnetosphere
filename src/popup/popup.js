document.addEventListener('DOMContentLoaded', () => {
    const enableToggle = document.getElementById('enableToggle');
    const strengthSlider = document.getElementById('strengthSlider');
    const noiseSlider = document.getElementById('noiseSlider');
    const strengthVal = document.getElementById('strengthVal');
    const noiseVal = document.getElementById('noiseVal');
    const resetBtn = document.getElementById('resetBtn');
    const dashboardBtn = document.getElementById('dashboardBtn');

    // Load settings
    chrome.storage.local.get(['enabled', 'strength', 'noise'], (result) => {
        if (result.enabled !== undefined) enableToggle.checked = result.enabled;
        if (result.strength !== undefined) {
            strengthSlider.value = result.strength;
            strengthVal.textContent = result.strength + '%';
        }
        if (result.noise !== undefined) {
            noiseSlider.value = result.noise;
            noiseVal.textContent = result.noise + '%';
        }
    });

    // Save settings
    const saveSettings = () => {
        chrome.storage.local.set({
            enabled: enableToggle.checked,
            strength: parseInt(strengthSlider.value),
            noise: parseInt(noiseSlider.value)
        });
    };

    enableToggle.addEventListener('change', saveSettings);

    strengthSlider.addEventListener('input', () => {
        strengthVal.textContent = strengthSlider.value + '%';
        saveSettings();
    });

    noiseSlider.addEventListener('input', () => {
        noiseVal.textContent = noiseSlider.value + '%';
        saveSettings();
    });

    // Open Dashboard
    dashboardBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('src/dashboard/dashboard.html') });
    });

    // Reset Profile
    resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset your taste profile? This cannot be undone.')) {
            // Send message to background/worker to clear DB
            // For now, just clear storage
            chrome.storage.local.clear();
            location.reload();
        }
    });
});
