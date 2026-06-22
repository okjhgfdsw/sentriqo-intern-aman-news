// ==========================================================================
// DUAL 3D ANALYTICS MODULE (DYNAMIC AGGREGATION ENGINE)
// ==========================================================================

// Chart.js ke objects ko tracking state me rakhne ke liye globally do variables banaye hain
let sourceShareChartInstance = null;
let textDensityChartInstance = null;

/**
 * Rebuilds the CSS sentiment meters and renders both Chart.js configurations.
 * @param {Array} localArticlesState - Current array of active articles
 * @param {HTMLElement} analyticsChartsContainer - Parent DOM element wrapper
 */
// Yeh function news feed ka text analytics perform karke graphs build aur update karta hai
export function rebuildAnalyticsVisualCharts(localArticlesState, analyticsChartsContainer) {
    // Agar charts container grid block existing nahi hai ya phir display hidden hai toh runtime bypass hoga
    if (!analyticsChartsContainer || analyticsChartsContainer.style.display === 'none') return;

    // Active visual properties reading ke hisab se text aur layout borders colors configure honge
    const currentActiveMode = document.documentElement.getAttribute('data-theme') || 'light';
    const labelTextColor = currentActiveMode === 'dark' ? '#cbd5e1' : '#334155';
    const axisGridColor = currentActiveMode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.06)';

    // DOM metrics layout container elements ke targets pull kiye ja rahe hain
    const bullBar = document.getElementById('sentimentBullBar');
    const bearBar = document.getElementById('sentimentBearBar');
    const topicBadge = document.getElementById('hotTopicBadge');
    
    // Chart graphics paint karne ke liye canvas DOM handles coordinate mapping set kiya hai
    const ctxLeftPie = document.getElementById('textDensityChart');
    const ctxRightBar = document.getElementById('sourceShareChart');

    // Dismissed data records list fetch karke unmatched content lines store karne ke liye parameters filter check
    const dismissedArticlesBlacklist = JSON.parse(localStorage.getItem('news_dismissed_blacklist')) || [];
    let visibleData = localArticlesState.filter(a => !dismissedArticlesBlacklist.includes(a.url));

    // Agar pure database dataset matrix ka items count zero hai toh process yahan se hi end ho jayega
    if (visibleData.length === 0) return;

    // Dynamic metrics mathematical evaluations maps configurations variables setup
    let expansionCount = 0;
    let riskCount = 0;
    const sourceMap = {};
    const wordFrequencyMap = {};

    // Word dictionary categories lists definitions sets boundary evaluation systems logic
    const bullKeywords = ['raise', 'funding', 'expand', 'growth', 'profit', 'deal', 'billion', 'million', 'launch', 'surges', 'boost', 'highest honour'];
    const bearKeywords = ['fail', 'reject', 'crash', 'kill', 'drop', 'decline', 'risk', 'crisis', 'lawsuit', 'strike', 'nuclear', 'weapon', 'dispute'];
    const exclusionNoiseWords = ['the', 'a', 'to', 'in', 'and', 'of', 'for', 'on', 'with', 'at', 'by', 'is', 'it', 'from', 'that', 'this', 'as', 'are', 'was'];

    // Input data processing mapping verification values tracking loop running sequences lines
    visibleData.forEach(article => {
        const fullBodyText = `${article.title} ${article.description || ''}`.toLowerCase();
        const headingText = article.title.toLowerCase();

        // 1. Title aur body values pass karke positive market flags count filter kiya ja raha hai
        if (bullKeywords.some(w => fullBodyText.includes(w))) expansionCount++;
        if (bearKeywords.some(w => fullBodyText.includes(w))) riskCount++;

        // 2. Active news platform publishers frequency indexing structure metrics registry update
        if (article.source) {
            sourceMap[article.source] = (sourceMap[article.source] || 0) + 1;
        }

        // 3. Noise elimination check rules algorithms processing word tracking filters loops
        headingText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "").split(/\s+/).forEach(word => {
            if (word.length > 3 && !exclusionNoiseWords.includes(word)) {
                wordFrequencyMap[word] = (wordFrequencyMap[word] || 0) + 1;
            }
        });
    });

    // Sentiment visual tracking indicators calculation constraints rules mappings
    const totalSentiments = (expansionCount + riskCount) || 1;
    const bullPercentage = Math.max(15, Math.min(85, (expansionCount / totalSentiments) * 100));
    const bearPercentage = 100 - bullPercentage;

    // CSS bar graphics visual layout styles layout parameters dynamic value adjustments strings
    if (bullBar && bearBar) {
        bullBar.style.width = `${bullPercentage}%`;
        bearBar.style.width = `${bearPercentage}%`;
    }

    // High density anchor words parameters sorting tag layout processing text insertions setup
    if (topicBadge) {
        const hotAnchorWord = Object.keys(wordFrequencyMap).reduce((max, key) => wordFrequencyMap[key] > wordFrequencyMap[max] ? key : max, "");
        topicBadge.textContent = hotAnchorWord ? `#${hotAnchorWord.toUpperCase()}` : "#GLOBAL_FEED";
    }

    // Top list parameters filtration array setups extraction mechanisms bounds
    const allSources = Object.keys(sourceMap).sort((a, b) => sourceMap[b] - sourceMap[a]);
    const MAX_VISIBLE = 6;
    
    let finalLabels = allSources.slice(0, MAX_VISIBLE);
    let finalCounts = finalLabels.map(s => sourceMap[s]);

    // Maximum charts entries rules override bypass blocks merging items under single cluster tag
    if (allSources.length > MAX_VISIBLE) {
        const remaining = allSources.slice(MAX_VISIBLE).reduce((sum, s) => sum + sourceMap[s], 0);
        finalLabels.push("Others");
        finalCounts.push(remaining);
    }

    // ==========================================
    // LEFT: PIE CHART
    // ==========================================
    
    // Purane left chart reference instances trace pointers clear clean data load safe steps runtime
    if (textDensityChartInstance) textDensityChartInstance.destroy();
    if (ctxLeftPie) {
        textDensityChartInstance = new Chart(ctxLeftPie, {
            type: 'pie',
            data: {
                labels: finalLabels,
                datasets: [{
                    data: finalCounts,
                    backgroundColor: ['#38bdf8', '#a78bfa', '#10b981', '#fb923c', '#f43f5e', '#eab308', '#64748b'],
                    borderWidth: 2,
                    borderColor: currentActiveMode === 'dark' ? '#1e293b' : '#ffffff',
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: labelTextColor, font: { size: 10 } } }
                }
            }
        });
    }

    // ==========================================
    // RIGHT: BAR GRAPH
    // ==========================================
    
    // Current right side column reference instances cleanup configurations update mapping variables sets
    if (sourceShareChartInstance) sourceShareChartInstance.destroy();
    if (ctxRightBar) {
        sourceShareChartInstance = new Chart(ctxRightBar, {
            type: 'bar',
            data: {
                labels: finalLabels,
                datasets: [{
                    data: finalCounts,
                    backgroundColor: ['#38bdf8', '#a78bfa', '#10b981', '#fb923c', '#f43f5e', '#eab308', '#64748b'],
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: axisGridColor }, ticks: { color: labelTextColor } },
                    y: { grid: { display: false }, ticks: { color: labelTextColor, font: { size: 11, weight: '600' } } }
                }
            }
        });
    }
}

// Memory block allocation variables reference pointers wipeout reset cleaner execution units method
export function destroyChartInstances() {
    if (sourceShareChartInstance) sourceShareChartInstance.destroy();
    if (textDensityChartInstance) textDensityChartInstance.destroy();
    sourceShareChartInstance = null;
    textDensityChartInstance = null;
}