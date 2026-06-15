// ==========================================================================
// API UTILITY LAYER (CURRENTS API - DEEP BATCH PAGINATION PIPELINE)
// ==========================================================================
// const API_KEY = 'Yn1WQVMWZz7L4u9Z8l2s4JcwXKSVbJGPvK_Xqxk6pn677D1b'; 
const API_KEY = 'L_KEiEMkb_k-VYhNWPBeBCBROFCeaypDw36zOmzZmoNsmaxB'; 
const BASE_URL = 'https://api.currentsapi.services/v1';

// Stable max threshold per single page request required by Currents API rules
const PAGE_SIZE_LIMIT = 50;

// 1. Tech & Science Clean Filter (Aggressive Cricket, Entertainment, and OTT block)
const TECH_SCIENCE_BLACKLIST = [
    'ott', 'season', 'movie', 'actor', 'actress', 'episode', 'trailer', 'film', 
    'release date', 'cast', 'thriller', 'box office', 'aliens', 'ufo', 'alien',
    'singer', 'starring', 'romantic', 'drama', 'bollywood', 'hollywood',
    'cricket', 'ipl', 'match', 'bcci', 'player', 'playoff', 'runs', 'wickets', 
    'netflix', 'prime video', 'jiohotstar', 'streaming platforms', 'watch on'
];

// 2. Business Filter Safeguard (Blocks gossip, cricket scandals, recipes, and lifestyle blogs)
const BUSINESS_BLACKLIST = [
    'chilli pickle', 'pickle', 'recipe', 'cook', 'ingredients', 'taste', 'tangy', 
    'ipl', 'hardik pandya', 'rohit sharma', 'virat kohli', 'bcci', 'match', 'stadium', 
    't20', 'williams', 'bollywood', 'actor', 'actress', 'divorce', 'romance', 'wedding'
];

/**
 * Helper to dynamically assemble endpoint string structures per specific pagination index numbers
 */
function buildEndpointUrl(cleanCategory, categoryRaw, pageNumber) {
    if (cleanCategory.startsWith('state-')) {
        const targetedState = cleanCategory.split('-')[1];
        return `${BASE_URL}/search?country=IN&limit=${PAGE_SIZE_LIMIT}&page_number=${pageNumber}&keywords=${encodeURIComponent(targetedState.toLowerCase())}&apiKey=${API_KEY}`;
    } 
    else if (cleanCategory.startsWith('search-')) {
        const rawSearchQuery = categoryRaw.substring(7).trim();
        return `${BASE_URL}/search?limit=${PAGE_SIZE_LIMIT}&page_number=${pageNumber}&keywords=${encodeURIComponent(rawSearchQuery.toLowerCase())}&apiKey=${API_KEY}`;
    }
    else if (cleanCategory.startsWith('world-')) {
        const targetedCountry = cleanCategory.split('-')[1].toLowerCase();
        if (targetedCountry === 'india') {
            return `${BASE_URL}/search?limit=${PAGE_SIZE_LIMIT}&page_number=${pageNumber}&keywords=${encodeURIComponent('indian national')}&apiKey=${API_KEY}`;
        } else {
            return `${BASE_URL}/latest-news?country=${targetedCountry}&page_size=${PAGE_SIZE_LIMIT}&page=${pageNumber}&apiKey=${API_KEY}`;
        }
    }
    else if (cleanCategory.startsWith('platform-')) {
        const targetDomain = categoryRaw.substring(9).trim();
        return `${BASE_URL}/search?limit=${PAGE_SIZE_LIMIT}&page_number=${pageNumber}&domain=${encodeURIComponent(targetDomain)}&apiKey=${API_KEY}`;
    }
    else if (cleanCategory !== 'home') {
        return `${BASE_URL}/search?country=IN&limit=${PAGE_SIZE_LIMIT}&page_number=${pageNumber}&keywords=${encodeURIComponent(cleanCategory)}&apiKey=${API_KEY}`;
    }
    else {
        return `${BASE_URL}/latest-news?country=IN&page_size=${PAGE_SIZE_LIMIT}&page=${pageNumber}&apiKey=${API_KEY}`;
    }
}

/**
 * Asynchronously fetches live headlines with parameter structural safety guarantees
 * @param {string} category - Incoming navigation filter tag or complex selection string
 * @returns {Promise<Array>} Standardized uniform array elements mapped for layout cards
 */
export async function fetchTopHeadlines(category = '') {
    const cleanCategory = category ? category.trim().toLowerCase() : 'home';
    const targetPagesToLoad = [1, 2, 3, 4];
    
    try {
        const networkFetchPromises = targetPagesToLoad.map(async (pageIndex) => {
            const URL = buildEndpointUrl(cleanCategory, category, pageIndex);
            const response = await fetch(URL);
            if (!response.ok) return []; 
            const payload = await response.json();
            return payload.news && Array.isArray(payload.news) ? payload.news : [];
        });

        const resolvingPagesMatrices = await Promise.all(networkFetchPromises);
        const rawConsolidatedArticles = resolvingPagesMatrices.flat();

        if (rawConsolidatedArticles.length > 0) {
            const localSelectionCache = new Set();

            const mappedNews = rawConsolidatedArticles.map(article => ({
                title: article.title || 'No Title Available',
                description: article.description || '',
                source: article.author || 'Live Feed Updates', 
                time: article.published ? calculateRelativeTime(article.published) : 'Recent',
                category: cleanCategory.startsWith('state-') ? 'State News' : cleanCategory.startsWith('world-') ? 'World News' : cleanCategory.startsWith('platform-') ? 'Publisher Feed' : category || 'General',
                url: article.url || '#',
                imgUrl: article.image && article.image !== 'None' ? article.image : null 
            }));

            // 1. Filter out cross-page duplicate returns to keep data points unique
            const deduplicatedNews = mappedNews.filter(article => {
                if (localSelectionCache.has(article.url)) {
                    return false;
                }
                localSelectionCache.add(article.url);
                return true;
            });

            // 2. NEW: Drop all news cards that do not have a valid, usable image URL
            const finalImageOnlyNews = deduplicatedNews.filter(article => article.imgUrl !== null);

            // 3. Apply filter specifically on technology or science fields
            if (cleanCategory === 'technology' || cleanCategory === 'science') {
                return finalImageOnlyNews.filter(article => {
                    const dynamicMatchText = `${article.title} ${article.description}`.toLowerCase();
                    return !TECH_SCIENCE_BLACKLIST.some(forbiddenWord => dynamicMatchText.includes(forbiddenWord));
                });
            }

            // 4. Apply filter layout logic directly on Business dashboard pipelines
            if (cleanCategory === 'business') {
                return finalImageOnlyNews.filter(article => {
                    const dynamicMatchText = `${article.title} ${article.description}`.toLowerCase();
                    return !BUSINESS_BLACKLIST.some(forbiddenWord => dynamicMatchText.includes(forbiddenWord));
                });
            }

            return finalImageOnlyNews;
        }
        return [];

    } catch (networkError) {
        console.error("Fetch failure in high-volume pagination tier:", networkError);
        throw networkError;
    }
}

/**
 * Utility Timestamp Helper
 */
function calculateRelativeTime(timestampString) {
    if (!timestampString) return 'Recent';
    const publicationDate = new Date(timestampString);
    const modernTimeContext = new Date();
    const temporalDifferenceMs = modernTimeContext - publicationDate;
    
    const calculatedHours = Math.floor(temporalDifferenceMs / (1000 * 60 * 60));
    
    if (calculatedHours < 1) {
        const calculatedMinutes = Math.floor(temporalDifferenceMs / (1000 * 60));
        return `${calculatedMinutes <= 0 ? 1 : calculatedMinutes} mins ago`;
    }
    if (calculatedHours < 24) {
        return `${calculatedHours} hour${calculatedHours > 1 ? 's' : ''} ago`;
    }
    return `${Math.floor(calculatedHours / 24)} days ago`;
}