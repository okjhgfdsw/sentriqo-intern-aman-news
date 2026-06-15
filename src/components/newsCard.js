// ==========================================================================
// COMPONENT COMPILER LAYER (ORIGINAL VERTICAL BLOCK CARDS WITH STAR OPTIONS)
// ==========================================================================

/**
 * Compiles a single uniform news card element layout matching your exact dimensions
 * @param {Object} article - Unified sanitized data elements from API tier
 * @param {number} index - Sequence layout index position tracking number
 * @param {Function} onDelete - State pipeline handler to eliminate selected items
 * @param {Function} onSave - State pipeline handler to bookmark items persistently
 * @returns {HTMLElement} Compiled individual card node ready for attachment
 */
export function createNewsCard(article, index, onDelete, onSave) {
    const card = document.createElement('div');
    card.className = 'news-card';
    card.setAttribute('data-index', index);

    // Dynamic clean redirection to the original article source URL
    card.addEventListener('click', (e) => {
        if (e.target.classList.contains('crud-delete-overlay-btn') || e.target.classList.contains('bookmark-save-btn')) return;
        window.open(article.url, '_blank');
    });

    // Image wrapper segment compilation featuring lazy loading and broken link guards
    let imageHTML = '';
    if (article.imgUrl) {
        imageHTML = `
            <div class="card-image-wrapper">
                <img src="${article.imgUrl}" 
                     loading="lazy" 
                     class="card-img" 
                     alt="News Image"
                     onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'100%\' height=\'100%\' viewBox=\'0 0 16 9\' style=\'background:%23e2e8f0;\'><text x=\'50%\' y=\'50%\' font-family=\'sans-serif\' font-size=\'1\' fill=\'%2394a3b8\' text-anchor=\'middle\' dominant-baseline=\'middle\'>📰 No Image</text></svg>';">
            </div>
        `;
    } else {
        imageHTML = `
            <div class="card-image-wrapper">
                <div class="card-img-placeholder" style="width:100%; height:100%; background:#e2e8f0; display:flex; align-items:center; justify-content:center;">
                    <span style="color:#94a3b8; font-size:0.85rem;">📰 Headline Update</span>
                </div>
            </div>
        `;
    }

    // Determine current bookmark active status style layout indicators
    const savedCollection = JSON.parse(localStorage.getItem('news_bookmarks_collection')) || [];
    const isBookmarked = savedCollection.some(item => item.url === article.url);
    const activeBookmarkClass = isBookmarked ? 'saved-active' : '';

    // Classic core vertical layout framework with clean, isolated explicit star action buttons
    card.innerHTML = `
        <button class="bookmark-save-btn ${activeBookmarkClass}" title="Save item">⭐</button>
        <button class="crud-delete-overlay-btn" title="Dismiss item">×</button>
        ${imageHTML}
        <div class="card-content">
            <h3 class="card-title">${article.title}</h3>
            <div class="card-meta">
                <span class="card-source">${article.source}</span>
                <span class="card-time">${article.time}</span>
            </div>
        </div>
    `;

    // Connect dismiss structural delete triggers cleanly
    const deleteBtn = card.querySelector('.crud-delete-overlay-btn');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onDelete(article.url);
    });

    // Connect bookmark state updates securely
    const saveBtn = card.querySelector('.bookmark-save-btn');
    saveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onSave(article, saveBtn);
    });

    return card;
}