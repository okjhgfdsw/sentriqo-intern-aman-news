// ==========================================================================
// CENTRAL STORAGE PERSISTENCE UTILITY LAYER (DYNAMIC ACCOUNTS STORAGE)
// ==========================================================================

const BASE_BOOKMARKS_KEY = 'sentriqo_news_bookmarks'; 

/**
 * Helper function to dynamically construct an account-specific storage key string.
 */
const getDynamicAccountKey = () => {
    // Automatically checks if window.getStorageSuffixKey exists, fallback to 'guest'
    const suffix = (typeof window.getStorageSuffixKey === 'function') 
        ? window.getStorageSuffixKey() 
        : 'guest';
    
    // Returns something like 'sentriqo_news_bookmarks_amanupadhyay1980@gmail.com'
    return `${BASE_BOOKMARKS_KEY}_${suffix}`;
};

export const saveBookmarks = (bookmarks) => {
    try {
        const data = JSON.stringify(bookmarks); // Convert array into string representation
        const dynamicKey = getDynamicAccountKey(); // 🛠️ Find the exact user folder key location
        
        localStorage.setItem(dynamicKey, data); 
        console.log(`💾 Saved bookmarks into secure location: [${dynamicKey}]`);
    } catch (error) {
        console.error("Error saving to localStorage:", error);
    }
};

export const getBookmarks = () => {
    try {
        const dynamicKey = getDynamicAccountKey(); // 🛠️ Find the exact user folder key location
        const data = localStorage.getItem(dynamicKey);
        
        let result;
        if (data) {
            result = JSON.parse(data); // Convert string representation back into an Array
        } else {
            result = [];
        }
        
        console.log(`📂 Loaded bookmarks from location: [${dynamicKey}] - Count: ${result.length}`);
        return result;
    } catch (error) {
        console.error("Error reading from localStorage:", error);
        return [];
    }
};