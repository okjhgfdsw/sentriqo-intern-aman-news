// ==========================================================================
// API UTILITY LAYER (CURRENTS API - RELEVANCE & IMAGE FALLBACK FIX)
// ==========================================================================

const API_KEY = '6u5bLNq0b8uzTgU06Vek4sB5_pb_xRYpj8ahdJ__ge_O0CdV';
const BASE_URL = 'https://api.currentsapi.services/v1';

const GLOBAL_IMAGE_FALLBACK_POOL = [
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80'
];

const TECH_SCIENCE_BLACKLIST = [
    'ott', 'season', 'movie', 'actor', 'actress', 'episode', 'trailer', 'film',
    'release date', 'cast', 'thriller', 'box office', 'aliens', 'ufo', 'alien',
    'singer', 'starring', 'romantic', 'drama', 'bollywood', 'hollywood',
    'cricket', 'ipl', 'match', 'bcci', 'player', 'playoff', 'runs', 'wickets',
    'netflix', 'prime video', 'jiohotstar', 'streaming platforms', 'watch on'
];

// Added automated stock ticker spam terms to keep Business news relevant
const BUSINESS_BLACKLIST = [
    'chilli pickle', 'pickle', 'recipe', 'cook', 'ingredients', 'taste', 'tangy',
    'ipl', 'hardik pandya', 'rohit sharma', 'virat kohli', 'bcci', 'match', 'stadium',
    't20', 'williams', 'bollywood', 'actor', 'actress', 'divorce', 'romance', 'wedding',
    'marketbeat', 'stock holdings', 'raises stake', 'buys new stake', 'shares sold', 
    'lowered by', 'invests $', 'position in'
];

function buildEndpointUrl(cleanCategory, categoryRaw, page = 1) {
    if (cleanCategory.startsWith('state-')) {
        const targetedState = cleanCategory.split('-')[1] || 'india';
        return `${BASE_URL}/search?keywords=${encodeURIComponent(targetedState)}&page_number=${page}&language=en&apiKey=${API_KEY}`;
    }
    else if (cleanCategory.startsWith('search-')) {
        const rawSearchQuery = categoryRaw.substring(7).trim() || 'latest';
        return `${BASE_URL}/search?keywords=${encodeURIComponent(rawSearchQuery)}&page_number=${page}&language=en&apiKey=${API_KEY}`;
    }
    else if (cleanCategory.startsWith('world-')) {
        const targetedCountry = cleanCategory.split('-')[1] || 'world';
        return `${BASE_URL}/search?keywords=${encodeURIComponent(targetedCountry)}&page_number=${page}&language=en&apiKey=${API_KEY}`;
    }
    else if (cleanCategory.startsWith('platform-')) {
        const rawDomain = categoryRaw.substring(9).toLowerCase().trim();
        let searchKeyword = 'news';

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
            searchKeyword = rawDomain.split('.')[0] || 'news';
        }
        
        return `${BASE_URL}/search?keywords=${encodeURIComponent(searchKeyword)}&page_number=${page}&language=en&apiKey=${API_KEY}`;
    }
    else if (cleanCategory !== 'home') {
        return `${BASE_URL}/search?keywords=${encodeURIComponent(cleanCategory)}&page_number=${page}&language=en&apiKey=${API_KEY}`;
    }
    else {
        return `${BASE_URL}/search?keywords=india&page_number=${page}&language=en&apiKey=${API_KEY}`;
    }
}

export async function fetchTopHeadlines(category = '') {
    const cleanCategory = category ? category.trim().toLowerCase() : 'home';
    const batchPages = [1, 2, 3, 4, 5, 6]; 
    
    try {
        const batchFetchPromises = batchPages.map(async (pageIndex) => {
            const URL = buildEndpointUrl(cleanCategory, category, pageIndex);
            const response = await fetch(URL);
            if (!response.ok) return [];
            const payload = await response.json();
            return payload.news && Array.isArray(payload.news) ? payload.news : [];
        });

        const pagesResultsArray = await Promise.all(batchFetchPromises);
        const rawConsolidatedArticles = pagesResultsArray.flat();

        if (rawConsolidatedArticles.length > 0) {
            const localSelectionCache = new Set();

            const mappedNews = rawConsolidatedArticles.map(article => {
                const randomImageIndex = Math.floor(Math.random() * GLOBAL_IMAGE_FALLBACK_POOL.length);
                const assignedFallback = GLOBAL_IMAGE_FALLBACK_POOL[randomImageIndex];

                // Detect missing, invalid, or generic placeholder images (like MarketBeat logos)
                const hasValidImage = article.image && 
                                      article.image !== 'None' && 
                                      !article.image.toLowerCase().includes('marketbeat') &&
                                      !article.image.toLowerCase().includes('default');

                return {
                    title: article.title || 'No Title Available',
                    description: article.description || '',
                    source: article.author || 'Live Feed Updates',
                    time: article.published ? calculateRelativeTime(article.published) : 'Recent',
                    category: cleanCategory.startsWith('state-') ? 'State News' : cleanCategory.startsWith('world-') ? 'World News' : cleanCategory.startsWith('platform-') ? 'Publisher Feed' : category || 'General',
                    url: article.url || '#',
                    imgUrl: hasValidImage ? article.image : assignedFallback
                };
            });

            const deduplicatedNews = mappedNews.filter(article => {
                if (localSelectionCache.has(article.url)) {
                    return false;
                }
                localSelectionCache.add(article.url);
                return true;
            });

            let finalFilteredNews = deduplicatedNews;

            if (cleanCategory === 'technology' || cleanCategory === 'science') {
                finalFilteredNews = deduplicatedNews.filter(article => {
                    const dynamicMatchText = `${article.title} ${article.description}`.toLowerCase();
                    return !TECH_SCIENCE_BLACKLIST.some(forbiddenWord => dynamicMatchText.includes(forbiddenWord));
                });
            }

            if (cleanCategory === 'business') {
                finalFilteredNews = deduplicatedNews.filter(article => {
                    const dynamicMatchText = `${article.title} ${article.description}`.toLowerCase();
                    return !BUSINESS_BLACKLIST.some(forbiddenWord => dynamicMatchText.includes(forbiddenWord));
                });
            }

            return finalFilteredNews;
        }
        return [];

    } catch (networkError) {
        console.error("Fetch failure in connection layer:", networkError);
        throw networkError;
    }
}

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