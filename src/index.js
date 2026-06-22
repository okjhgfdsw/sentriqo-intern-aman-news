// ==========================================================================
// CENTRAL RUNTIME APPLICATION ORCHESTRATOR LAYER (COMPLETE MATRIX SCOPE)
// ==========================================================================

// Alag-alag modules se functions import ho rahe hain components, API calls aur charts ke liye
import { createNewsCard } from './components/newsCard.js';
import { fetchTopHeadlines } from './utils/api.js';
import { rebuildAnalyticsVisualCharts, destroyChartInstances } from './utils/charts.js';

// Global variables initialize ho rahe hain state, filter aur timers manage karne ke liye
let localArticlesState = [];
let currentFeedContext = 'Business'; // Default context ko pehle se hi Business set kiya hai
let currentPublisherName = '';
let searchDebounceTimer = null;
let activeFormMode = 'login'; // Auth modal ka default status control karne ke liye
let globalBackupArticlesPool = []; // For dynamic badge counting matching active feeds

// ==========================================================================
// 🔑 MULTI-USER STORAGE SEPARATION ENGINE (FIXES ACCOUNT BLEEDING)
// ==========================================================================
window.getAccountStorageKey = function(baseKeyName) {
    const activeSession = JSON.parse(localStorage.getItem('news_active_session'));
    
    // If a Google user is actively signed in, append their lowercase email as a unique folder suffix
    if (activeSession && activeSession.isLoggedIn && activeSession.email) {
        const userSuffix = activeSession.email.trim().toLowerCase();
        return `${baseKeyName}_${userSuffix}`; // e.g., "news_bookmarks_collection_amanupadhyay1980@gmail.com"
    }
    
    // Fallback default key if no user is logged in
    return `${baseKeyName}_guest`;
};

window.getStorageSuffixKey = function() {
    const activeSession = JSON.parse(localStorage.getItem('news_active_session'));
    // If a Google user is signed in, return their unique email. Otherwise, use guest.
    if (activeSession && activeSession.isLoggedIn && activeSession.email) {
        return activeSession.email.trim().toLowerCase();
    }
    return 'guest';
};

// Ek Set unique track records ke liye taaki duplicate articles session mein na dikhein
const SEEN_ARTICLES_SESSION_LEDGER = new Set();

// Jab pura DOM web-browser mein read/load ho jayega, tab ye block trigger hoga
document.addEventListener('DOMContentLoaded', () => {
    // UI elements ko unki ID aur class ke throw select karke variables mein save kar rahe hain
    const newsGridDisplay = document.getElementById('news-grid');
    const dynamicHeadlineArea = document.getElementById('dynamic-headline-area');
    const searchFieldInput = document.querySelector('.search-field');
    const financialTickerWidget = document.querySelector('.financial-ticker');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const exportFeedBtn = document.getElementById('exportFeedBtn');
    
    // Dropdowns aur top navigation pills ke HTML element anchors
    const bookmarksPill = document.getElementById('bookmarks-shortcut-pill');
    const forYouPill = document.getElementById('foryou-news-pill');
    const forYouSelector = document.getElementById('foryou-selector');
    const indianPill = document.getElementById('indian-platforms-pill');
    const indianSelector = document.getElementById('indian-platform-selector');
    const intlPill = document.getElementById('intl-platforms-pill');
    const intlSelector = document.getElementById('intl-platform-selector');
    const stateNewsPill = document.getElementById('state-news-pill');
    const stateSelector = document.getElementById('state-selector');
    const worldNewsPill = document.getElementById('world-news-pill');
    const worldSelector = document.getElementById('world-selector');

    // Settings modal panels aur control inputs ke nodes
    const settingsToggleBtn = document.getElementById('settingsToggleBtn');
    const settingsModalOverlay = document.getElementById('settingsModalOverlay');
    const closeSettingsModal = document.getElementById('closeSettingsModal');
    const searchHistoryTagsTray = document.getElementById('searchHistoryTagsTray');
    const noiseFilterToggle = document.getElementById('noiseFilterToggle');
    const densityLayoutSelector = document.getElementById('densityLayoutSelector');
    const analyticsPanelToggle = document.getElementById('analyticsPanelToggle');
    const analyticsChartsContainer = document.getElementById('analyticsChartsContainer');
    const purgeCacheSystemBtn = document.getElementById('purgeCacheSystemBtn');

    // Authentication system ke login/signup fields aur error messages nodes
    const loginBtn = document.querySelector('.login-btn');
    const signupBtn = document.querySelector('.signup-btn');
    const avatarBtn = document.getElementById('avatarBtn');
    const avatarLetter = document.querySelector('.avatar-letter');
    const authModalOverlay = document.getElementById('authModalOverlay');
    const closeAuthModal = document.getElementById('closeAuthModal');
    const modalTitle = document.getElementById('modalTitle');
    const portalAuthForm = document.getElementById('portalAuthForm');
    const authUsernameInput = document.getElementById('authUsername');
    const authPasswordInput = document.getElementById('authPassword');
    const usernameError = document.getElementById('usernameError');
    const passwordError = document.getElementById('passwordError');
    const globalFormFeedback = document.getElementById('globalFormFeedback');

    // ==========================================================================
    // INTERACTIVE CONFIGURATION PANEL ARCHITECTURE
    // ==========================================================================
    
    // LocalStorage se historical queries pull karne ke liye helper logic
    function getSearchHistoryPool() {
        const dynamicHistoryKey = window.getAccountStorageKey('portal_search_history');
        return JSON.parse(localStorage.getItem(dynamicHistoryKey)) || [];
    }

    // New searches ko array ke top par lakar store aur maintain karne ka function
    function pushQueryToHistory(searchQueryText) {
        const dynamicHistoryKey = window.getAccountStorageKey('portal_search_history');
        let currentHistory = getSearchHistoryPool();
        
        // Purani same query ko filter karke drop karenge taaki repetition na ho
        currentHistory = currentHistory.filter(term => term.toLowerCase() !== searchQueryText.toLowerCase());
        currentHistory.unshift(searchQueryText); // Naya term starting mein push hoga
        if (currentHistory.length > 6) currentHistory.pop(); // Max 6 history entries ka limit lagaya hai
        
        localStorage.setItem(dynamicHistoryKey, JSON.stringify(currentHistory));
        renderHistoryTagsTrayElements(); // Display tags sync reload ho jayenge
    }

    // Saved recent searches ko UI mein dynamic visual pills banakar render karna
    function renderHistoryTagsTrayElements() {
        if (!searchHistoryTagsTray) return;
        const historyPool = getSearchHistoryPool();
        
        // Agar local cache bilkul zero hai toh empty status message inject karenge
        if (historyPool.length === 0) {
            searchHistoryTagsTray.innerHTML = `<span class="history-empty-status">No recent searches logged</span>`;
            return;
        }

        searchHistoryTagsTray.innerHTML = ''; // Container reset baseline clear
        historyPool.forEach(term => {
            const pillNode = document.createElement('span');
            pillNode.className = 'history-tag-pill';
            pillNode.textContent = term;
            // Tag pill par click karte hi search execution override chalega
            pillNode.addEventListener('click', () => {
                if (searchFieldInput) searchFieldInput.value = term;
                clearAllSelectionHighlights();
                resetAllDropdownsExcept(null);
                closeSettingsModalOverlay();
                renderPortalFeed(`search-${term}`);
            });
            searchHistoryTagsTray.appendChild(pillNode);
        });
    }

    // Settings popup area toggle open event pipeline
    function openSettingsModalOverlay() {
        renderHistoryTagsTrayElements();
        // Charts visualization visible state checking toggles array sync
        if (analyticsPanelToggle && analyticsChartsContainer) {
            analyticsPanelToggle.checked = analyticsChartsContainer.style.display === 'block';
        }
        if (settingsModalOverlay) settingsModalOverlay.classList.add('active');
    }

    // Popup interface window close dynamic execution wrapper
    function closeSettingsModalOverlay() {
        if (settingsModalOverlay) settingsModalOverlay.classList.remove('active');
    }

    // Setup element event trackers clicking logic triggers
    if (settingsToggleBtn) settingsToggleBtn.addEventListener('click', openSettingsModalOverlay);
    if (closeSettingsModal) closeSettingsModal.addEventListener('click', closeSettingsModalOverlay);
    if (settingsModalOverlay) {
        settingsModalOverlay.addEventListener('click', (e) => {
            if (e.target === settingsModalOverlay) closeSettingsModalOverlay();
        });
    }

    // Card alignment distribution updates switching trigger handlers
    if (densityLayoutSelector) {
        densityLayoutSelector.addEventListener('change', () => {
            SEEN_ARTICLES_SESSION_LEDGER.clear(); // Counts persistent rakhne ke liye session tracks clean karenge
            renderActiveStateGrid(); 
        });
    }

    // Charts tracking panel on/off condition updates listener handler
    if (analyticsPanelToggle) {
        analyticsPanelToggle.addEventListener('change', () => {
            if (analyticsPanelToggle.checked) {
                analyticsChartsContainer.style.display = 'block';
                localStorage.setItem('portal_analytics_visible', 'true');
                rebuildAnalyticsVisualCharts(localArticlesState, analyticsChartsContainer); 
            } else {
                analyticsChartsContainer.style.display = 'none';
                localStorage.setItem('portal_analytics_visible', 'false');
                destroyChartInstances(); // Memory release karne ke liye charts destroy karte hain
            }
        });
    }

    // ==========================================================================
    // CACHE PURGE SYSTEM WORKSPACE WORKFLOW
    // ==========================================================================
    if (purgeCacheSystemBtn) {
        const customConfirmOverlay = document.getElementById('customConfirmOverlay');
        const confirmCancelBtn = document.getElementById('confirmCancelBtn');
        const confirmProceedBtn = document.getElementById('confirmProceedBtn');

        // Main button click handler
        purgeCacheSystemBtn.addEventListener('click', () => {
            // Close the main system preferences modal overlay first
            if (settingsModalOverlay) settingsModalOverlay.classList.remove('active');
            
            // Pop open the custom confirmation dialog precisely centered on screen
            if (customConfirmOverlay) customConfirmOverlay.classList.add('active');
        });

        // "Proceed" Action: Wipe memory cache structures instantly
        confirmProceedBtn.addEventListener('click', () => {
            console.log("💥 Executing complete cache database purge cleanup routines...");
            
            localStorage.clear();
            SEEN_ARTICLES_SESSION_LEDGER.clear();
            destroyChartInstances();
            
            if (customConfirmOverlay) customConfirmOverlay.classList.remove('active');
            
            // Instantly trigger full layout system synchronized page refresh
            window.location.reload();
        });

        // "Cancel" Action: Close overlay seamlessly without breaking anything
        confirmCancelBtn.addEventListener('click', () => {
            if (customConfirmOverlay) customConfirmOverlay.classList.remove('active');
        });

        // Clicking on the dim backdrop mask also cancels out the operation safely
        customConfirmOverlay.addEventListener('click', (e) => {
            if (e.target === customConfirmOverlay) {
                customConfirmOverlay.classList.remove('active');
            }
        });
    }

    // ==========================================================================
    // ADVANCED FEATURE 1: THEME CONTROLLER & STORAGE PURSUIT
    // ==========================================================================
    
    // System initialization dark/light appearance checking sequences
    function initializeApplicationTheme() {
        const cachedThemeMode = localStorage.getItem('portal_theme_preference') || 'light';
        document.documentElement.setAttribute('data-theme', cachedThemeMode);
        if (themeToggleBtn) {
            themeToggleBtn.textContent = cachedThemeMode === 'dark' ? '🌙' : '☀️';
        }
        const chartsCachedVisibility = localStorage.getItem('portal_analytics_visible');
        if (chartsCachedVisibility === 'true' && analyticsChartsContainer && analyticsPanelToggle) {
            analyticsChartsContainer.style.display = 'block';
            analyticsPanelToggle.checked = true;
        }
    }

    // Click handler checking logic to flip client visualization parameters
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentActiveMode = document.documentElement.getAttribute('data-theme');
            const calculatedTargetTheme = currentActiveMode === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', calculatedTargetTheme);
            localStorage.setItem('portal_theme_preference', calculatedTargetTheme);
            themeToggleBtn.textContent = calculatedTargetTheme === 'dark' ? '🌙' : '☀️';
            
            // Re-render data graphs visual charts parameters alignment safely
            if (analyticsChartsContainer && analyticsChartsContainer.style.display === 'block') {
                rebuildAnalyticsVisualCharts(localArticlesState, analyticsChartsContainer);
            }
        });
    }

    // ==========================================================================
    // AUTHENTICATION AND LOGIN/SIGNUP STATE PIPELINE
    // ==========================================================================
    
    // Local profile checking logic verifying logs to update desktop header buttons
    function checkAndApplyAuthAuthLayoutState() {
        const activeUserSession = JSON.parse(localStorage.getItem('news_active_session'));
        
        // Target your custom signup button node
        const googleSignupBtn = document.querySelector('.signup-btn');

        if (activeUserSession && activeUserSession.isLoggedIn) {
            // 1. Hide default credentials buttons if they exist
            if (loginBtn) loginBtn.style.display = 'none';

            // 🛠️ TRANSFORM TO LOGOUT BUTTON STATE NATIVELY:
            if (googleSignupBtn) {
                googleSignupBtn.textContent = "Logout";
                googleSignupBtn.classList.add('logout-active-state'); 
                
                // Attach silent logout executor execution block
                googleSignupBtn.onclick = function(e) {
                    e.preventDefault();
                    executeApplicationLogoutPipeline();
                };
            }
        } else {
            // 2. Restore default state if logged out
            if (loginBtn) loginBtn.style.display = 'block';

            // 🛠️ RESTORE BACK TO GOOGLE SIGNIN OAUTH INTERACTION:
            if (googleSignupBtn) {
                googleSignupBtn.textContent = "Sign in using Google";
                googleSignupBtn.classList.remove('logout-active-state');
                
                googleSignupBtn.onclick = function(e) {
                    e.preventDefault();
                    if (typeof window.launchGoogleAuthSequence === 'function') {
                        window.launchGoogleAuthSequence();
                    }
                };
            }
        }
    }

    // Centralized silent logout pipeline to instantly flush states with zero alerts
    function executeApplicationLogoutPipeline() {
        try {
            localStorage.removeItem('news_active_session');
            SEEN_ARTICLES_SESSION_LEDGER.clear();
            if (typeof destroyChartInstances === 'function') {
                destroyChartInstances();
            }
        } catch (err) {
            console.warn("Minor variable cleanup hitch:", err);
        }
        
        console.log("🔒 Session terminated silently.");
        checkAndApplyAuthAuthLayoutState();
        window.location.reload();
    }

    // Login window layout configuration launcher pipeline
    function openModalLayout(mode) {
        activeFormMode = mode;
        clearValidationErrors();
        if (portalAuthForm) portalAuthForm.reset();
        if (modalTitle) modalTitle.textContent = mode === 'signup' ? "Create Account Plan" : "Account Access Portal";
        if (authModalOverlay) authModalOverlay.classList.add('active');
    }

    // Close authentication panel sequence handler
    function closeModalLayout() {
        if (authModalOverlay) authModalOverlay.classList.remove('active');
        clearValidationErrors();
    }

    // Clearing existing notification labels indicators blocks
    function clearValidationErrors() {
        if (usernameError) usernameError.textContent = '';
        if (passwordError) passwordError.textContent = '';
        if (globalFormFeedback) {
            globalFormFeedback.textContent = '';
            globalFormFeedback.className = 'global-form-feedback';
        }
        if (authUsernameInput) authUsernameInput.classList.remove('input-invalid');
        if (authPasswordInput) authPasswordInput.classList.remove('input-invalid');
    }

    // Connecting handlers clicking tracking nodes
    if (signupBtn) signupBtn.addEventListener('click', () => openModalLayout('signup'));
    if (loginBtn) loginBtn.addEventListener('click', () => openModalLayout('login'));
    if (closeAuthModal) closeAuthModal.addEventListener('click', closeModalLayout);
    if (authModalOverlay) {
        authModalOverlay.addEventListener('click', (e) => {
            if (e.target === authModalOverlay) closeModalLayout();
        });
    }

    // Capturing authorization processing submissions validation triggers
    if (portalAuthForm) {
        portalAuthForm.addEventListener('submit', (event) => {
            event.preventDefault();
            clearValidationErrors();

            const inputUsername = authUsernameInput.value.trim();
            const inputPassword = authPasswordInput.value.trim();
            let isFormValid = true;

            // Username filtering restrictions evaluation boundary constraints
            if (!inputUsername) {
                if (usernameError) usernameError.textContent = "❌ Username field cannot be left blank.";
                authUsernameInput.classList.add('input-invalid');
                isFormValid = false;
            } else if (inputUsername.length < 3) {
                if (usernameError) usernameError.textContent = "❌ Username must contain at least 3 characters.";
                authUsernameInput.classList.add('input-invalid');
                isFormValid = false;
            }

            // Password constraints compliance tracking checks limits
            if (!inputPassword) {
                if (passwordError) passwordError.textContent = "❌ Password field cannot be left blank.";
                authPasswordInput.classList.add('input-invalid');
                isFormValid = false;
            } else if (inputPassword.length < 6) {
                if (passwordError) passwordError.textContent = "❌ Password must be at least 6 characters long.";
                authPasswordInput.classList.add('input-invalid');
                isFormValid = false;
            }

            if (!isFormValid) return; // Processing terminated if limits failed

            const savedProfile = JSON.parse(localStorage.getItem('news_user_profile'));

            // New accounts creation setup pipeline parameters registry blocks
            if (activeFormMode === 'signup') {
                const profilePayload = { username: inputUsername, password: inputPassword };
                localStorage.setItem('news_user_profile', JSON.stringify(profilePayload));
                
                if (globalFormFeedback) {
                    globalFormFeedback.textContent = "🎉 Account created successfully! Proceeding to access clearance...";
                    globalFormFeedback.classList.add('success-state');
                }
                
                setTimeout(() => {
                    const sessionPayload = { 
                        isLoggedIn: true, 
                        username: inputUsername,
                        email: `${inputUsername.toLowerCase()}@local.com` 
                    };
                    localStorage.setItem('news_active_session', JSON.stringify(sessionPayload));
                    checkAndApplyAuthAuthLayoutState();
                    closeModalLayout();
                    window.location.reload();
                }, 1200);

            // Existing profiles evaluation sequence checks matched arrays login routing
            } else {
                if (savedProfile && savedProfile.username === inputUsername && savedProfile.password === inputPassword) {
                    const sessionPayload = { 
                        isLoggedIn: true, 
                        username: savedProfile.username,
                        email: `${savedProfile.username.toLowerCase()}@local.com`
                    };
                    localStorage.setItem('news_active_session', JSON.stringify(sessionPayload));
                    
                    if (globalFormFeedback) {
                        globalFormFeedback.textContent = "✅ Verification complete. Access authorized.";
                        globalFormFeedback.classList.add('success-state');
                    }

                    setTimeout(() => {
                        checkAndApplyAuthAuthLayoutState();
                        closeModalLayout();
                        window.location.reload();
                    }, 1000);
                } else {
                    if (globalFormFeedback) {
                        globalFormFeedback.textContent = "❌ Authorization mismatch. Invalid username details combo.";
                        globalFormFeedback.classList.add('error-state');
                    }
                    authUsernameInput.classList.add('input-invalid');
                    authPasswordInput.classList.add('input-invalid');
                }
            }
        });
    }

    // ==========================================================================
    // CORE APPLICATION RENDERING PIPELINE
    // ==========================================================================
    
    // Core engine module data fetch loader system pipeline routines
    async function renderPortalFeed(selectedFilter) {
        currentFeedContext = selectedFilter;
        SEEN_ARTICLES_SESSION_LEDGER.clear(); // Naya segment switch load hone par track reset clear
        
        // FEATURE 1: SKELETON PLACEHOLDERS setup loop block
        let skeletonHTML = '';
        for (let i = 0; i < 12; i++) {
            skeletonHTML += `
                <div class="skeleton-card">
                    <div class="skeleton-image" style="background: #334155; height: 180px; width: 100%; border-radius: 12px 12px 0 0; opacity: 0.6; animation: skeleton-pulse 1.5s infinite ease-in-out;"></div>
                    <div class="skeleton-body" style="padding: 1.25rem; display: flex; flex-direction: column; gap: 0.5rem;">
                        <div class="skeleton-line title-long" style="background: #334155; height: 1.2rem; width: 85%; border-radius: 4px; animation: skeleton-pulse 1.5s infinite ease-in-out;"></div>
                        <div class="skeleton-line title-short" style="background: #334155; height: 1.2rem; width: 50%; border-radius: 4px; animation: skeleton-pulse 1.5s infinite ease-in-out;"></div>
                        <div class="skeleton-meta-row" style="display: flex; justify-content: space-between; margin-top: 1rem;">
                            <div class="skeleton-line meta-left" style="background: #334155; height: 0.8rem; width: 30%; border-radius: 4px; animation: skeleton-pulse 1.5s infinite ease-in-out;"></div>
                            <div class="skeleton-line meta-right" style="background: #334155; height: 0.8rem; width: 20%; border-radius: 4px; animation: skeleton-pulse 1.5s infinite ease-in-out;"></div>
                        </div>
                    </div>
                </div>
            `;
        }
        if (newsGridDisplay) newsGridDisplay.innerHTML = skeletonHTML;

        // Bookmarks specific loading block bypassing network queries calls
        if (selectedFilter === 'Bookmarks') {
            const dynamicBookmarkKey = window.getAccountStorageKey('news_bookmarks_collection');
            localArticlesState = JSON.parse(localStorage.getItem(dynamicBookmarkKey)) || [];
            globalBackupArticlesPool = localArticlesState;
            renderActiveStateGrid();
            return;
        }
        
        // Dynamic operational API processing dataset recovery sequence try structures
        try {
            const networkDataset = await fetchTopHeadlines(selectedFilter);
            localArticlesState = networkDataset;
            globalBackupArticlesPool = networkDataset; 
            renderActiveStateGrid();
        }  catch (apiError) {
            console.error("Feed orchestrator caught engine failure:", apiError);
            
            // FEATURE 2: ERROR BOUNDARY UI STATE execution blocks layout mapping inject
            if (newsGridDisplay) {
                newsGridDisplay.innerHTML = `
                    <div class="feed-status-message error-boundary-state" style="text-align: center; padding: 4rem 2rem; grid-column: 1/-1; background: rgba(239, 68, 68, 0.05); border: 1px dashed #ef4444; border-radius: 12px; margin: 1rem 0; position: relative; z-index: 999; pointer-events: auto;">
                        <span style="font-size: 3rem; display: block; margin-bottom: 1rem;">⚠️</span>
                        <h3 style="color: #ef4444; font-size: 1.35rem; font-weight: 600; margin-bottom: 0.5rem;">Pipeline Synapse Severed</h3>
                        <p style="color: #94a3b8; font-size: 0.95rem; max-width: 500px; margin: 0 auto 1.5rem;">${apiError.message || 'The downstream news aggregation terminal encountered a connection timeout.'}</p>
                        <button id="retryPipelineBtn" style="background: #ef4444; color: #ffffff; border: none; padding: 10px 20px; font-weight: 600; border-radius: 6px; cursor: pointer; transition: background 0.2s; position: relative; z-index: 10000; pointer-events: auto !important;">Re-establish Downstream Connection</button>
                    </div>
                `;
                
                // Retry listeners configuration mappings validation anchors delays execution
                setTimeout(() => {
                    const retryBtn = document.getElementById('retryPipelineBtn');
                    if (retryBtn) {
                        retryBtn.style.cursor = 'pointer';
                        
                        retryBtn.onclick = function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log("🔄 Click detected! Re-executing active feed recovery trace...");
                            renderPortalFeed(currentFeedContext);
                        };
                    } else {
                        console.error("❌ Critical: Could not attach listener because retryPipelineBtn is missing from DOM!");
                    }
                }, 50);
            }
        }
    }

    // Grid nodes renderer evaluation mapping framework blocks arrays tracking parameters
    function renderActiveStateGrid() {
        if (!newsGridDisplay) return;
        newsGridDisplay.innerHTML = ''; // System container baseline node flushing
        
        const isPlatform = currentFeedContext.toLowerCase().startsWith('platform-');
        const isSearchQuery = currentFeedContext.toLowerCase().startsWith('search-');
        const isBookmarksView = currentFeedContext === 'Bookmarks';

        // 🛠️ ISOLATION FIX: Extract custom account key structure dynamically
        const dynamicBlacklistKey = window.getAccountStorageKey('news_dismissed_blacklist');
        const dismissedArticlesBlacklist = JSON.parse(localStorage.getItem(dynamicBlacklistKey)) || [];
        let visibleArticles = localArticlesState.filter(article => !dismissedArticlesBlacklist.includes(article.url));
        
        // Low fidelity media components string filter screening mechanisms algorithms logic
        if (noiseFilterToggle && noiseFilterToggle.checked) {
            const CRITICAL_WORDS_BLACKLIST = ['cricket', 'ipl', 'match', 'bollywood', 'actor', 'actress', 'ott', 'season', 'movie', 'divorce'];
            visibleArticles = visibleArticles.filter(art => {
                const combinedBodyText = `${art.title} ${art.description}`.toLowerCase();
                return !CRITICAL_WORDS_BLACKLIST.some(badWord => combinedBodyText.includes(badWord));
            });
        }

        // Duplicate tracking screening parameters titles deduplication sets boundaries
        const currentGridTitlesCheck = new Set();
        if (!isBookmarksView) {
            visibleArticles = visibleArticles.filter(article => {
                const cleanTitleKey = article.title.trim().toLowerCase();
                if (SEEN_ARTICLES_SESSION_LEDGER.has(article.url) || currentGridTitlesCheck.has(cleanTitleKey)) {
                    return false;
                }
                currentGridTitlesCheck.add(cleanTitleKey);
                return true;
            });
        }

        const totalItemsCount = visibleArticles.length;
        const userLayoutPreference = densityLayoutSelector ? densityLayoutSelector.value : 'adaptive';
        
        // CSS target updates routing layout selections definitions patterns sets
        if (userLayoutPreference === 'horizontal') {
            newsGridDisplay.className = 'platform-rows-layout-deck';
        } else if (userLayoutPreference === 'vertical-stream') {
            newsGridDisplay.className = 'instagram-vertical-stream';
        } else {
            newsGridDisplay.className = 'cards-layout-grid';
        }

        // 🛠️ BALANCED BADGE COUNTS: Track precise un-dismissed remaining structures
        const totalRemainingAvailable = globalBackupArticlesPool.filter(
            article => !dismissedArticlesBlacklist.includes(article.url)
        ).length;
        const displayCountNumber = totalRemainingAvailable > 0 ? totalRemainingAvailable : totalItemsCount;

        // Titles header layout updates calculations tags matching display sets
        if (isPlatform) {
            if (dynamicHeadlineArea) {
                dynamicHeadlineArea.innerHTML = `
                    <div class="platform-header-brand-block">
                        <h1 class="platform-display-title">${currentPublisherName} <span class="headline-counter-badge">${displayCountNumber}</span></h1>
                        <div class="platform-sub-bar-navigation">
                            <span class="platform-sub-pill active">Recent</span>
                            <span class="platform-sub-pill">News Showcase</span>
                        </div>
                    </div>
                `;
            }
        } else if (isSearchQuery) {
            const queryLabel = currentFeedContext.substring(7);
            if (dynamicHeadlineArea) dynamicHeadlineArea.innerHTML = `<h2 class="feed-headline">Search results for: "${queryLabel}" <span class="headline-counter-badge">${displayCountNumber}</span></h2>`;
        } else if (isBookmarksView) {
            if (dynamicHeadlineArea) dynamicHeadlineArea.innerHTML = `<h2 class="feed-headline">Saved Bookmarks ⭐ <span class="headline-counter-badge">${displayCountNumber}</span></h2>`;
        } else {
            if (dynamicHeadlineArea) dynamicHeadlineArea.innerHTML = `<h2 class="feed-headline">Top stories <span class="headline-counter-badge">${displayCountNumber}</span></h2>`;
        }

        // Analytical visualizations framework generation sync sequences pipelines threads
        setTimeout(() => {
            rebuildAnalyticsVisualCharts(localArticlesState, analyticsChartsContainer);
        }, 0);

        // FEATURE 3: EMPTY STATES validation structures feedback notification cards structures
        if (totalItemsCount === 0) {
            newsGridDisplay.innerHTML = `
                <div class="feed-status-message empty-state" style="grid-column: 1/-1; padding: 5rem 2rem; text-align: center; background: rgba(30, 41, 59, 0.4); border-radius: 12px; border: 1px dashed #334155;">
                    <span style="font-size: 3.5rem; display: block; margin-bottom: 1rem;">📭</span>
                    <h3 style="color: #cbd5e1; font-size: 1.25rem; font-weight: 600; margin-bottom: 0.4rem;">News Not Found !</h3>
                    <p style="color: #64748b; font-size: 0.9rem; max-width: 400px; margin: 0 auto;">No records match your active filtering preferences or query strings in this workspace index.</p>
                </div>
            `;
            return;
        }

        // Loop array rendering card element structures tracking maps parameters index elements
        visibleArticles.forEach((article, idx) => {
            try {
                if (!isBookmarksView) SEEN_ARTICLES_SESSION_LEDGER.add(article.url);
                const compiledCardNode = createNewsCard(article, idx, executeDeleteAction, executeSaveAction);
                
                if (newsGridDisplay.className === 'platform-rows-layout-deck') {
                    compiledCardNode.className = 'news-horizontal-row';
                } else if (newsGridDisplay.className === 'instagram-vertical-stream') {
                    compiledCardNode.className = 'instagram-vertical-post';
                } else {
                    compiledCardNode.className = 'news-card';
                }
                newsGridDisplay.appendChild(compiledCardNode);
            } catch (err) { console.error("Error creating card node:", err); }
        });
    }

    // Dismiss deletion processing items configurations registry updates traces callbacks
    function executeDeleteAction(targetItemUrl) {
        const dynamicBlacklistKey = window.getAccountStorageKey('news_dismissed_blacklist');
        const dismissedArticlesBlacklist = JSON.parse(localStorage.getItem(dynamicBlacklistKey)) || [];
        
        if (!dismissedArticlesBlacklist.includes(targetItemUrl)) {
            dismissedArticlesBlacklist.push(targetItemUrl);
            localStorage.setItem(dynamicBlacklistKey, JSON.stringify(dismissedArticlesBlacklist));
        }
        
        if (currentFeedContext === 'Bookmarks') {
            const dynamicBookmarkKey = window.getAccountStorageKey('news_bookmarks_collection');
            let bookmarks = JSON.parse(localStorage.getItem(dynamicBookmarkKey)) || [];
            bookmarks = bookmarks.filter(item => item.url !== targetItemUrl);
            localStorage.setItem(dynamicBookmarkKey, JSON.stringify(bookmarks));
            localArticlesState = bookmarks;
        }
        
        // Remove from UI array tracking baseline context loops immediately
        localArticlesState = localArticlesState.filter(article => article.url !== targetItemUrl);
        renderActiveStateGrid();
    }

    // Bookmarks saving execution path
    function executeSaveAction(articleObj, buttonNode) {
        const dynamicBookmarkKey = window.getAccountStorageKey('news_bookmarks_collection');
        
        let bookmarks = JSON.parse(localStorage.getItem(dynamicBookmarkKey)) || [];
        const matchesIndex = bookmarks.findIndex(item => item.url === articleObj.url);
        
        if (matchesIndex > -1) {
            bookmarks.splice(matchesIndex, 1);
            buttonNode.classList.remove('saved-active');
            if (currentFeedContext === 'Bookmarks') {
                localArticlesState = bookmarks;
                renderActiveStateGrid();
            }
        } else {
            bookmarks.push(articleObj);
            buttonNode.classList.add('saved-active');
        }
        
        localStorage.setItem(dynamicBookmarkKey, JSON.stringify(bookmarks));
    }

    // Cleaning visual elements navigation indicator status parameters sets loops
    function clearAllSelectionHighlights() {
        if (forYouPill) forYouPill.classList.remove('selected');
        if (bookmarksPill) bookmarksPill.classList.remove('selected');
        if (indianPill) indianPill.classList.remove('selected');
        if (intlPill) intlPill.classList.remove('selected');
        if (stateNewsPill) stateNewsPill.classList.remove('selected');
        if (worldNewsPill) worldNewsPill.classList.remove('selected');
    }

    // Dropdown elements indexing default validation resets conditions settings updates overrides
    function resetAllDropdownsExcept(activeSelector) {
        if (forYouSelector && activeSelector !== forYouSelector) forYouSelector.selectedIndex = 0;
        if (indianSelector && activeSelector !== indianSelector) indianSelector.value = "timesofindia.indiatimes.com";
        if (intlSelector && activeSelector !== intlSelector) intlSelector.value = "bbc.com";
        if (stateSelector && activeSelector !== stateSelector) stateSelector.value = "maharashtra";
        if (worldSelector && activeSelector !== worldSelector) worldSelector.value = "india";
    }

    // For You selections changes updates trackers handling workflows routing
    if (forYouSelector) {
        forYouSelector.addEventListener('change', (event) => {
            clearAllSelectionHighlights();
            if (forYouPill) forYouPill.classList.add('selected');
            resetAllDropdownsExcept(forYouSelector);
            if (searchFieldInput) searchFieldInput.value = '';
            renderPortalFeed(event.target.value || 'Business');
        });
    }

    if (forYouPill) {
        forYouPill.addEventListener('click', (event) => {
            if (event.target === forYouSelector) return;
            clearAllSelectionHighlights();
            forYouPill.classList.add('selected');
            resetAllDropdownsExcept(forYouSelector);
            renderPortalFeed(forYouSelector ? forYouSelector.value || 'Business' : 'Business');
        });
    }

    // Bookmarks tab link clicking validation sequence trace pipeline maps
    if (bookmarksPill) {
        bookmarksPill.addEventListener('click', () => {
            clearAllSelectionHighlights();
            bookmarksPill.classList.add('selected');
            resetAllDropdownsExcept(null);
            if (searchFieldInput) searchFieldInput.value = '';
            renderPortalFeed('Bookmarks');
        });
    }

    // Regional domestic media channels select update configurations tracker
    if (indianSelector) {
        indianSelector.addEventListener('change', (event) => {
            if (!event.target.value) return;
            clearAllSelectionHighlights();
            if (indianPill) indianPill.classList.add('selected');
            resetAllDropdownsExcept(indianSelector);
            if (searchFieldInput) searchFieldInput.value = '';
            currentPublisherName = indianSelector.options[indianSelector.selectedIndex].text;
            renderPortalFeed(`PLATFORM-${event.target.value}`);
        });
    }

    if (indianPill) {
        indianPill.addEventListener('click', (event) => {
            if (event.target === indianSelector) return;
            clearAllSelectionHighlights();
            indianPill.classList.add('selected');
            resetAllDropdownsExcept(indianSelector);
            currentPublisherName = indianSelector ? indianSelector.options[indianSelector.selectedIndex].text : '';
            renderPortalFeed(`PLATFORM-${indianSelector ? indianSelector.value : ''}`);
        });
    }

    // Global International media routing dropdown updates event handling configurations
    if (intlSelector) {
        intlSelector.addEventListener('change', (event) => {
            if (!event.target.value) return;
            clearAllSelectionHighlights();
            if (intlPill) intlPill.classList.add('selected');
            resetAllDropdownsExcept(intlSelector);
            if (searchFieldInput) searchFieldInput.value = '';
            currentPublisherName = intlSelector.options[intlSelector.selectedIndex].text;
            renderPortalFeed(`PLATFORM-${event.target.value}`);
        });
    }

    if (intlPill) {
        intlPill.addEventListener('click', (event) => {
            if (event.target === intlSelector) return;
            clearAllSelectionHighlights();
            intlPill.classList.add('selected');
            resetAllDropdownsExcept(intlSelector);
            currentPublisherName = intlSelector ? intlSelector.options[intlSelector.selectedIndex].text : '';
            renderPortalFeed(`PLATFORM-${intlSelector ? intlSelector.value : ''}`);
        });
    }

    // State level local sorting filters matching dropdowns changes handling
    if (stateSelector) {
        stateSelector.addEventListener('change', (event) => {
            if (!event.target.value) return;
            clearAllSelectionHighlights();
            if (stateNewsPill) stateNewsPill.classList.add('selected');
            resetAllDropdownsExcept(stateSelector);
            if (searchFieldInput) searchFieldInput.value = '';
            renderPortalFeed(`STATE-${event.target.value}`);
        });
    }

    if (stateNewsPill) {
        stateNewsPill.addEventListener('click', (event) => {
            if (event.target === stateSelector) return;
            clearAllSelectionHighlights();
            stateNewsPill.classList.add('selected');
            resetAllDropdownsExcept(stateSelector);
            renderPortalFeed(`STATE-${stateSelector ? stateSelector.value : ''}`);
        });
    }

    // World geopolitics global segments changes routing controllers handles
    if (worldSelector) {
        worldSelector.addEventListener('change', (event) => {
            if (!event.target.value) return;
            clearAllSelectionHighlights();
            if (worldNewsPill) worldNewsPill.classList.add('selected');
            resetAllDropdownsExcept(worldSelector);
            if (searchFieldInput) searchFieldInput.value = '';
            renderPortalFeed(`WORLD-${event.target.value}`);
        });
    }

    if (worldNewsPill) {
        worldNewsPill.addEventListener('click', (event) => {
            if (event.target === worldSelector) return;
            clearAllSelectionHighlights();
            worldNewsPill.classList.add('selected');
            resetAllDropdownsExcept(worldSelector);
            renderPortalFeed(`WORLD-${worldSelector ? worldSelector.value : ''}`);
        });
    }

    // Input text search field engine tracking filters execution processing layout debouncing
    if (searchFieldInput) {
        searchFieldInput.addEventListener('input', (event) => {
            const rawQueryString = event.target.value.trim();
            clearTimeout(searchDebounceTimer); // Purane pending timer instance ko clean down karenge
            
            if (rawQueryString.length === 0) {
                resetAllDropdownsExcept(null);
                renderPortalFeed('Business');
                return;
            }
            if (rawQueryString.length < 3) return; // Filtering bypass trigger if string limit too small

            // Debounce processing window timeout setup configuration delays parameters mapping
            searchDebounceTimer = setTimeout(() => {
                clearAllSelectionHighlights();
                resetAllDropdownsExcept(null);
                pushQueryToHistory(rawQueryString);
                renderPortalFeed(`search-${rawQueryString}`);
            }, 400);
        });
    }

    // Financial ticker panel clicks routing default configurations triggers mappings
    if (financialTickerWidget) {
        financialTickerWidget.addEventListener('click', () => {
            clearAllSelectionHighlights();
            if (forYouPill) forYouPill.classList.add('selected');
            resetAllDropdownsExcept(forYouSelector);
            if (forYouSelector) forYouSelector.value = 'Business';
            renderPortalFeed('Business');
        });
    }

    // Real time live desk timing display strings updater modules methods
    function updateLiveDateTimeStamp() {
        const dateBox = document.getElementById('live-date-box');
        if (!dateBox) return;
        const currentClockState = new Date();
        dateBox.textContent = currentClockState.toLocaleDateString('en-US', {
            weekday: 'long', day: 'numeric', month: 'long'
        });
    }

    // Reverse geocoding server parsing engines tracking methods mapping address targets
    async function fetchDistrictName(latitude, longitude) {
        const locationBox = document.getElementById('location-box');
        if (!locationBox) return;
        try {
            const geocodeUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&email=ecs_student_dev@domain.com`;
            const response = await fetch(geocodeUrl, { 
                method: 'GET',
                headers: { 'User-Agent': 'PremiumMarketIntelligenceTerminal/3.0 (contact: aman_ecs@domain.com)' } 
            });
            if (!response.ok) throw new Error("OSM Request Throttled");
            const data = await response.json();
            const addr = data.address;
            locationBox.textContent = addr.district || addr.city_district || addr.suburb || addr.city || addr.town || addr.state_district || "Amravati";
        } catch (error) { 
            console.warn("Geocoding safely routed to defaults:", error);
            locationBox.textContent = "Amravati"; 
        }
    }

    // Weather forecast networking data streams collection engines setups methods pipelines
    async function fetchRealTimeLocalWeather(latitude, longitude) {
        const tempBox = document.getElementById('temp-box');
        const iconBox = document.getElementById('weather-icon');
        fetchDistrictName(latitude, longitude); // Pull target region tags alongside trackers loop
        try {
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
            const response = await fetch(weatherUrl);
            if (!response.ok) throw new Error("Weather unreachable");
            const data = await response.json();
            const current = data.current_weather;
            if (tempBox) tempBox.textContent = `${Math.round(current.temperature)}°C`;
            if (iconBox) {
                const isDayTime = current.is_day === 1;
                const code = current.weathercode;
                if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) iconBox.textContent = '🌧️';
                else if ([95, 96, 99].includes(code)) iconBox.textContent = '⛈️';
                else if ([1, 2, 3].includes(code)) iconBox.textContent = '☁️';
                else iconBox.textContent = isDayTime ? '☀️' : '🌙';
            }
        } catch (e) { 
            console.error("Weather data fetch cycle terminated:", e); 
            if (tempBox) tempBox.textContent = "--°C";
            if (iconBox) iconBox.textContent = "☀️";
        }
    }

    // ==========================================================================
    // 📥 OFFLINE FEED EXPORT SYSTEM MECHANICS
    // ==========================================================================
    if (exportFeedBtn) {
        exportFeedBtn.addEventListener('click', () => {
            if (!localArticlesState || localArticlesState.length === 0) {
                if (typeof triggerSystemModalAlert === 'function') {
                    triggerSystemModalAlert(
                        "Export Action Blocked", 
                        "No articles available in the active feed to export!", 
                        true
                    );
                } else {
                    alert("No articles available in the active feed to export!");
                }
                return;
            }

            let detachedPageHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exported News Feed Matrix</title>
    <style>
        :root {
            --bg-body: #0f172a;
            --bg-card: #1e293b;
            --text-main: #f8fafc;
            --text-sub: #94a3b8;
            --accent: #38bdf8;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: var(--bg-body);
            color: var(--text-main);
            margin: 0;
            padding: 2rem;
        }
        .container { max-width: 1100px; margin: 0 auto; }
        header { border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1.5rem; margin-bottom: 2rem; }
        h1 { font-size: 2rem; margin: 0; letter-spacing: -0.02em; }
        .meta-stamp { font-size: 0.9rem; color: var(--text-sub); margin-top: 0.5rem; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
        .card { background-color: var(--bg-card); border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; }
        .img-box { width: 100%; height: 180px; background-color: #334155; }
        .img-box img { width: 100%; height: 100%; object-fit: cover; }
        .content { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; flex-grow: 1; }
        .source { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent); font-weight: 700; }
        h3 { font-size: 1.15rem; margin: 0; line-height: 1.4; }
        p { font-size: 0.88rem; color: var(--text-sub); margin: 0; line-height: 1.5; }
        .footer-link { margin-top: auto; padding-top: 0.5rem; }
        .btn { display: inline-block; font-size: 0.85rem; font-weight: 600; color: #0f172a; background-color: var(--accent); padding: 8px 14px; text-decoration: none; border-radius: 6px; }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>📰 Exported Intel Deck</h1>
            <div class="meta-stamp">Context View: <strong>${currentFeedContext}</strong> | Generated on: ${new Date().toLocaleString()}</div>
        </header>
        <main class="grid">
            ${localArticlesState.map(art => `
                <div class="card">
                    <div class="img-box">
                        <img src="${art.imgUrl || ''}" alt="Thumbnail" onerror="this.style.display='none';">
                    </div>
                    <div class="content">
                        <span class="source">${art.source || ''} • ${art.time || ''}</span>
                        <h3>${art.title || ''}</h3>
                        <p>${art.description || 'No description summary available.'}</p>
                        <div class="footer-link">
                            <a href="${art.url || '#'}" target="_blank" class="btn">Read Article ↗</a>
                        </div>
                    </div>
                </div>
            `).join('')}
        </main>
    </div>
</body>
</html>`;

            const blobLedger = new Blob([detachedPageHtml], { type: 'text/html' });
            const temporaryDownloadUrl = URL.createObjectURL(blobLedger);

            const hiddenAnchorNode = document.createElement('a');
            hiddenAnchorNode.href = temporaryDownloadUrl;
            hiddenAnchorNode.download = `news-feed-export-${currentFeedContext.toLowerCase().replace(/\s+/g, '-')}.html`;
            
            document.body.appendChild(hiddenAnchorNode);
            hiddenAnchorNode.click();
            
            document.body.removeChild(hiddenAnchorNode);
            URL.revokeObjectURL(temporaryDownloadUrl);
        });
    }

    // Triggering routines tracking layout baselines startup execution systems sequences
    initializeApplicationTheme(); 
    updateLiveDateTimeStamp();
    checkAndApplyAuthAuthLayoutState(); 
    resetAllDropdownsExcept(null);
    
    setTimeout(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => fetchRealTimeLocalWeather(pos.coords.latitude, pos.coords.longitude),
                () => fetchRealTimeLocalWeather(21.1458, 79.0882) // Fallback Amravati/Nagpur coordinates
            );
        } else {
            fetchRealTimeLocalWeather(21.1458, 79.0882);
        }
    }, 0);

    renderPortalFeed('Business'); // Launch startup stream feed mapping default set
}); // <--- DOMContentLoaded global listener block closed out cleanly here

// ==========================================================================
// GLOBAL EVENT INTERCEPTOR FORCE-REFRESH OVERRIDE
// ==========================================================================
window.addEventListener('click', (event) => {
    const clickTarget = event.target.closest('#retryPipelineBtn');
    if (clickTarget) {
        console.log("💥 Global Interceptor Triggered! Forcing page refresh sync...");
        window.location.reload(true); 
    }
}, { capture: true });

// ==========================================================================
// GLOBAL OAUTH NEW WINDOW TAB LAUNCHER UTILITY
// ==========================================================================
window.launchGoogleAuthSequence = function() {
    console.log("🚀 Redirecting target stream to Google account chooser on the SAME tab...");
    
    const clientId = "146685345388-lgjnhuj26h75peb2j03fbq6vb8cks2bo.apps.googleusercontent.com"; 
    const redirectUri = window.location.origin; 
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
        `client_id=${encodeURIComponent(clientId)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=token&` + 
        `scope=${encodeURIComponent('https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email')}&` +
        `include_granted_scopes=true&` +
        `prompt=select_account`; 

    window.location.href = googleAuthUrl;
};

// ==========================================================================
// 📥 AUTOMATIC FRAGMENT REDIRECT PARSER
// ==========================================================================
function checkAndParseUrlHashToken() {
    const urlHash = window.location.hash;
    if (!urlHash) return;

    if (urlHash.includes('access_token=')) {
        console.log("📥 Token found in URL fragment. Processing profile data...");
        
        const params = new URLSearchParams(urlHash.substring(1)); 
        const accessToken = params.get('access_token');

        if (accessToken) {
            window.history.replaceState(null, null, window.location.pathname + window.location.search);

            fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`)
                .then(res => {
                    if (!res.ok) throw new Error("Google API handshake refused");
                    return res.json();
                })
                .then(profileObj => {
                    console.log("🔒 Verified Profile via UserInfo Service:", profileObj.email);
                    
                    const activeUserPayload = {
                        isLoggedIn: true,
                        isGoogleUser: true,
                        username: profileObj.name || profileObj.given_name,
                        email: profileObj.email.trim().toLowerCase(), 
                        avatar: profileObj.picture
                    };

                    localStorage.setItem('news_active_session', JSON.stringify(activeUserPayload));
                    window.location.reload(); 
                })
                .catch(err => console.error("❌ Authentication session failed:", err));
        }
    }
}
checkAndParseUrlHashToken();

// ==========================================================================
// GLOBAL IDENTITY MATRIX PAYLOAD TOKEN TRANSLATOR
// ==========================================================================
window.handleGoogleIdentityTokenResponse = function(authResponse) {
    try {
        console.log("📥 Parsing credentials from secure Google endpoint...");

        const rawJwtToken = authResponse.credential;
        const base64UrlString = rawJwtToken.split('.')[1];
        const base64CleanString = base64UrlString.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayloadString = decodeURIComponent(atob(base64CleanString).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const profileObj = JSON.parse(jsonPayloadString);
        
        const activeUserPayload = {
            isLoggedIn: true,
            isGoogleUser: true,
            username: profileObj.name,
            email: profileObj.email.trim().toLowerCase(), 
            avatar: profileObj.picture
        };

        localStorage.setItem('news_active_session', JSON.stringify(activeUserPayload));
        console.log("🔒 Session established for ID:", activeUserPayload.email);
        
        window.location.reload();

    } catch (jwtError) {
        console.error("❌ Token handler execution failure:", jwtError);
    }
};