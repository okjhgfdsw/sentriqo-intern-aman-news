// ==========================================================================
// API UTILITY LAYER (CURRENTS API - DEEP BATCH PAGINATION PIPELINE)
// ==========================================================================

// Currents API server se connect karne ke liye unique secret token keys aur URL setup kiya hai
//const API_KEY = 'L_KEiEMkb_k-VYhNWPBeBCBROFCeaypDw36zOmzZmoNsmaxB';
const API_KEY = 'Yn1WQVMWZz7L4u9Z8l2s4JcwXKSVbJGPvK_Xqxk6pn677D1b';
const BASE_URL = 'https://api.currentsapi.services/v1';

// Currents API standard rules ke hisab se ek page par max 50 items ka load limit set kiya hai
const PAGE_SIZE_LIMIT = 50;

// Agar news article me image na mile, toh display block blank na dikhe isliye background pools array
const GLOBAL_IMAGE_FALLBACK_POOL = [
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80', // Newspaper stack
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80', // Tech/Abstract mesh
    'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=600&q=80', // Media/Global streaming 
    'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?auto=format&fit=crop&w=600&q=80', // Stock Market/Business board
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80'  // Digital communication/World network
];

// 1. Technology aur science category se ipl cricket, entertainment aur OTT updates block karne ke liye list
const TECH_SCIENCE_BLACKLIST = [
    'ott', 'season', 'movie', 'actor', 'actress', 'episode', 'trailer', 'film', 
    'release date', 'cast', 'thriller', 'box office', 'aliens', 'ufo', 'alien',
    'singer', 'starring', 'romantic', 'drama', 'bollywood', 'hollywood',
    'cricket', 'ipl', 'match', 'bcci', 'player', 'playoff', 'runs', 'wickets', 
    'netflix', 'prime video', 'jiohotstar', 'streaming platforms', 'watch on'
];

// 2. Business content segment se faltu gossip, recipes, lifestyle blogs aur match updates filter karne ke liye array
const BUSINESS_BLACKLIST = [
    'chilli pickle', 'pickle', 'recipe', 'cook', 'ingredients', 'taste', 'tangy', 
    'ipl', 'hardik pandya', 'rohit sharma', 'virat kohli', 'bcci', 'match', 'stadium', 
    't20', 'williams', 'bollywood', 'actor', 'actress', 'divorce', 'romance', 'wedding'
];

/**
 * Helper to dynamically assemble endpoint string structures per specific pagination index numbers
 */
// Yeh function parameters receive karke particular endpoint URL compile karta hai
function buildEndpointUrl(cleanCategory, categoryRaw, pageNumber) {
    // Agar keyword filter 'state-' se start hota hai, toh country IN aur state ka naam pass karenge
    if (cleanCategory.startsWith('state-')) {
        const targetedState = cleanCategory.split('-')[1];
        return `${BASE_URL}/search?country=IN&limit=${PAGE_SIZE_LIMIT}&page_number=${pageNumber}&keywords=${encodeURIComponent(targetedState.toLowerCase())}&apiKey=${API_KEY}`;
    } 
    // Agar search input context chal raha hai, toh user string query encode karke endpoints generate hoga
    else if (cleanCategory.startsWith('search-')) {
        const rawSearchQuery = categoryRaw.substring(7).trim();
        return `${BASE_URL}/search?limit=${PAGE_SIZE_LIMIT}&page_number=${pageNumber}&keywords=${encodeURIComponent(rawSearchQuery.toLowerCase())}&apiKey=${API_KEY}`;
    }
    // World news tabs filters updates routing block structures check
    else if (cleanCategory.startsWith('world-')) {
        const targetedCountry = cleanCategory.split('-')[1].toLowerCase();
        // Indian context queries ke liye manually explicit keyword text match bind kiya hai
        if (targetedCountry === 'india') {
            return `${BASE_URL}/search?limit=${PAGE_SIZE_LIMIT}&page_number=${pageNumber}&keywords=${encodeURIComponent('indian national')}&apiKey=${API_KEY}`;
        } else {
            return `${BASE_URL}/latest-news?country=${targetedCountry}&page_size=${PAGE_SIZE_LIMIT}&page=${pageNumber}&apiKey=${API_KEY}`;
        }
    }
    // Publisher names dynamic matching parsing loop block parameters extraction
    else if (cleanCategory.startsWith('platform-')) {
        const rawDomain = categoryRaw.substring(9).toLowerCase().trim();
        let searchKeyword = '';

        // Domain address mapping parameters check logic to assign search keyword text strings
        if (rawDomain.includes('timesofindia')) searchKeyword = 'Times of India';
        else if (rawDomain.includes('thehindu')) searchKeyword = 'The Hindu';
        else if (rawDomain.includes('economictimes')) searchKeyword = 'Economic Times';
        else if (rawDomain.includes('theverge')) searchKeyword = 'The Verge';
        else if (rawDomain.includes('bbc')) searchKeyword = 'BBC News';
        else if (rawDomain.includes('nytimes')) searchKeyword = 'New York Times';
        else if (rawDomain.includes('hindustantimes')) searchKeyword = 'Hindustan Times';
        else if (rawDomain.includes('theguardian')) searchKeyword = 'The Guardian';
        else if (rawDomain.includes('moneycontrol')) searchKeyword = 'Moneycontrol';
        else if (rawDomain.includes('ndtv')) searchKeyword = 'NDTV News';
        else if (rawDomain.includes('indianexpress')) searchKeyword = 'Indian Express';
        else if (rawDomain.includes('livemint')) searchKeyword = 'Mint';
        else if (rawDomain.includes('business-standard')) searchKeyword = 'Business Standard';
        else if (rawDomain.includes('reuters')) searchKeyword = 'Reuters';
        else if (rawDomain.includes('cnn')) searchKeyword = 'CNN';
        else {
            searchKeyword = rawDomain.split('.')[0]; // Backup logic to chop address dots strings directly
        }
        
        return `${BASE_URL}/search?limit=${PAGE_SIZE_LIMIT}&page_number=${pageNumber}&keywords=${encodeURIComponent(searchKeyword)}&apiKey=${API_KEY}`;
    }
    // Agar default context list nahi hai, toh runtime direct search routing query lagayi jayegi
    else if (cleanCategory !== 'home') {
        return `${BASE_URL}/search?country=IN&limit=${PAGE_SIZE_LIMIT}&page_number=${pageNumber}&keywords=${encodeURIComponent(cleanCategory)}&apiKey=${API_KEY}`;
    }
    // Home feed configurations targets default national headlines trigger endpoints returns
    else {
        return `${BASE_URL}/latest-news?country=IN&page_size=${PAGE_SIZE_LIMIT}&page=${pageNumber}&apiKey=${API_KEY}`;
    }
}

/**
 * Asynchronously fetches live headlines with parameter structural safety guarantees
 * @param {string} category - Incoming navigation filter tag or complex selection string
 * @returns {Promise<Array>} Standardized uniform array elements mapped for layout cards
 */
// Main service asynchronous loader system methods routing data fetch flows parameters
export async function fetchTopHeadlines(category = '') {
    const cleanCategory = category ? category.trim().toLowerCase() : 'home';
    const targetPagesToLoad = [1, 2, 3, 4]; // Deep pagination batches sequence tracking loops array
    
    try {
        // Promise.map pipeline pattern framework execution parallel async connection requests load
        const networkFetchPromises = targetPagesToLoad.map(async (pageIndex) => {
            const URL = buildEndpointUrl(cleanCategory, category, pageIndex);
            const response = await fetch(URL);
            if (!response.ok) return []; // Request fail hone par empty layout logs return safely
            const payload = await response.json();
            return payload.news && Array.isArray(payload.news) ? payload.news : [];
        });

        // Parallel processing promises resolution array elements flat execution blocks matrix
        const resolvingPagesMatrices = await Promise.all(networkFetchPromises);
        const rawConsolidatedArticles = resolvingPagesMatrices.flat();

        if (rawConsolidatedArticles.length > 0) {
            const localSelectionCache = new Set(); // Internal processing index memory checks deduplication block

            // Loop checking elements mapping object mapping parameters configurations properties
            const mappedNews = rawConsolidatedArticles.map(article => {
                // Background fallback logic array index calculations processing randomly targets setup
                const randomImageIndex = Math.floor(Math.random() * GLOBAL_IMAGE_FALLBACK_POOL.length);
                const assignedFallback = GLOBAL_IMAGE_FALLBACK_POOL[randomImageIndex];

                return {
                    title: article.title || 'No Title Available',
                    description: article.description || '',
                    source: article.author || 'Live Feed Updates', 
                    time: article.published ? calculateRelativeTime(article.published) : 'Recent',
                    category: cleanCategory.startsWith('state-') ? 'State News' : cleanCategory.startsWith('world-') ? 'World News' : cleanCategory.startsWith('platform-') ? 'Publisher Feed' : category || 'General',
                    url: article.url || '#',
                    // Image string key validation checking loop baseline properties assign rules targets
                    imgUrl: article.image && article.image !== 'None' ? article.image : assignedFallback 
                };
            });

            // 1. Cross-page network fetches duplicate items tracking removal sets checks criteria filtering
            const deduplicatedNews = mappedNews.filter(article => {
                if (localSelectionCache.has(article.url)) {
                    return false;
                }
                localSelectionCache.add(article.url);
                return true;
            });

            // 2. Clean distribution filter tracking sets variables processing baseline blocks layout
            let finalFilteredNews = deduplicatedNews;

            // Technology and science filtering checks execution match text evaluation rules block
            if (cleanCategory === 'technology' || cleanCategory === 'science') {
                finalFilteredNews = deduplicatedNews.filter(article => {
                    const dynamicMatchText = `${article.title} ${article.description}`.toLowerCase();
                    return !TECH_SCIENCE_BLACKLIST.some(forbiddenWord => dynamicMatchText.includes(forbiddenWord));
                });
            }

            // Commercial business segment filters matching array check verification rules properties execution
            if (cleanCategory === 'business') {
                finalFilteredNews = deduplicatedNews.filter(article => {
                    const dynamicMatchText = `${article.title} ${article.description}`.toLowerCase();
                    return !BUSINESS_BLACKLIST.some(forbiddenWord => dynamicMatchText.includes(forbiddenWord));
                });
            }

            return finalFilteredNews; // Cleaned parsed structural articles array results return
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
// Article date formats to relative readable times calculator processor logic script mapping methods
function calculateRelativeTime(timestampString) {
    if (!timestampString) return 'Recent';
    const publicationDate = new Date(timestampString);
    const modernTimeContext = new Date();
    const temporalDifferenceMs = modernTimeContext - publicationDate;
    
    const calculatedHours = Math.floor(temporalDifferenceMs / (1000 * 60 * 60));
    
    // Minutes metrics differences routing validation steps updates boundaries
    if (calculatedHours < 1) {
        const calculatedMinutes = Math.floor(temporalDifferenceMs / (1000 * 60));
        return `${calculatedMinutes <= 0 ? 1 : calculatedMinutes} mins ago`;
    }
    // Day cycle calculations thresholds checking string formatting outputs properties triggers
    if (calculatedHours < 24) {
        return `${calculatedHours} hour${calculatedHours > 1 ? 's' : ''} ago`;
    }
    return `${Math.floor(calculatedHours / 24)} days ago`;
}