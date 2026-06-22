// ==========================================================================
// COMPONENT COMPILER LAYER (DYNAMIC MULTI-MEDIA CONTAINMENT SPEC)
// ==========================================================================

/**
 * Compiles a single uniform news card element layout matching your exact dimensions
 * @param {Object} article - Unified sanitized data elements from API tier
 * @param {number} index - Sequence layout index position tracking number
 * @param {Function} onDelete - State pipeline handler to eliminate selected items
 * @param {Function} onSave - State pipeline handler to bookmark items persistently
 * @returns {HTMLElement} Compiled individual card node ready for attachment
 */
// Yeh function dynamic parameters accept karke single news card ka DOM structure taiyar karta hai
export function createNewsCard(article, index, onDelete, onSave) {
    // Card container div create karke uski class aur execution tracking index bind kar rahe hain
    const card = document.createElement('div');
    card.className = 'news-card';
    card.setAttribute('data-index', index);

    // Card container click event lagaya hai taaki main article URL naye tab me open ho sake
    card.addEventListener('click', (e) => {
        // Agar action buttons par click hua hai, toh page navigation block bypass kar denge
        if (e.target.classList.contains('bookmark-save-btn')) return;
        window.open(article.url, '_blank'); // Naye tab me full news copy open trigger hogi
    });

    // Multimedia container properties compile karne ke liye HTML layout buffer strings set
    let imageHTML = '';
    if (article.imgUrl) {
        // Regex format test pass karke handle kar rahe hain ki media source video stream format hai ya nahi
        const isVideoFormat = article.imgUrl.match(/\.(mp4|webm|ogv)(\?.*)?$/i) !== null;

        // Video configurations match hone par loop format html snippet structure apply hoga
        if (isVideoFormat) {
            imageHTML = `
                <div class="card-image-wrapper">
                    <video src="${article.imgUrl}" 
                           autoplay 
                           loop 
                           muted 
                           playsinline 
                           class="card-img"
                           style="background: #0f172a;">
                    </video>
                </div>
            `;
        // Standard picture configurations layout with inline fallback dynamic error tracing svg snippets
        } else {
            imageHTML = `
                <div class="card-image-wrapper">
                    <img src="${article.imgUrl}" 
                         loading="lazy" 
                         class="card-img" 
                         alt="News Thumbnail"
                         onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'100%\' height=\'100%\' viewBox=\'0 0 16 9\' style=\'background:%23e2e8f0;\'><text x=\'50%\' y=\'50%\' font-family=\'sans-serif\' font-size=\'1\' fill=\'%2394a3b8\' text-anchor=\'middle\' dominant-baseline=\'middle\'>📰 No Image</text></svg>';">
                </div>
            `;
        }
    // Agar dataset property index blank milti hai toh backup static text placeholder structure show hoga
    } else {
        imageHTML = `
            <div class="card-image-wrapper">
                <div class="card-img-placeholder" style="width:100%; height:100%; background:#e2e8f0; display:flex; align-items:center; justify-content:center;">
                    <span style="color:#94a3b8; font-size:0.85rem;">📰 Headline Update</span>
                </div>
            </div>
        `;
    }

    // Local profile checking steps array verifying if this specific link matches saved elements values
    const savedCollection = JSON.parse(localStorage.getItem('news_bookmarks_collection')) || [];
    const isBookmarked = savedCollection.some(item => item.url === article.url);
    const activeBookmarkClass = isBookmarked ? 'saved-active' : '';

    // Card block layout internal components placement map strings templates setup updates
    card.innerHTML = `
        <button class="bookmark-save-btn ${activeBookmarkClass}" title="Save item">⭐</button>
       
        ${imageHTML}
        <div class="card-content">
            <h3 class="card-title">${article.title}</h3>
            <div class="card-meta">
                <span class="card-source">${article.source}</span>
                <span class="card-time">${article.time}</span>
            </div>
        </div>
    `;

    // Core layout container click handlers binding actions properties metrics variables checks
    
    // Bookmarks tracking state adjustments changes routing buttons controllers mappings
    const saveBtn = card.querySelector('.bookmark-save-btn');
    saveBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Parent redirect listeners parameters processing execution cancel safely
        onSave(article, saveBtn); // Synchronization modules tracking update target functions callback running execution
    });

    return card; // Final ready individual layout block node object returns cleanly
}