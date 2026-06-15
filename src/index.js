// ==========================================================================
// CENTRAL RUNTIME APPLICATION ORCHESTRATOR LAYER (COMPLETE MATRIX SCOPE)
// ==========================================================================
import { createNewsCard } from './components/newsCard.js';
import { fetchTopHeadlines } from './utils/api.js';

let localArticlesState = [];
let currentFeedContext = 'Home';
let currentPublisherName = '';
let searchDebounceTimer = null;
let activeFormMode = 'login'; // Track state mode cleanly: 'login' or 'signup'

document.addEventListener('DOMContentLoaded', () => {
    const newsGridDisplay = document.getElementById('news-grid');
    const dynamicHeadlineArea = document.getElementById('dynamic-headline-area');
    const searchFieldInput = document.querySelector('.search-field');
    
    // Navigation item anchor hooks
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

    // Authenticated State Controls Interface Hooks
    const loginBtn = document.querySelector('.login-btn');
    const signupBtn = document.querySelector('.signup-btn');
    const avatarBtn = document.getElementById('avatarBtn');
    const avatarLetter = document.querySelector('.avatar-letter');
    const configTriggerBtn = document.querySelector('.config-trigger');

    // Form Modal Interface Elements Hooks
    const authModalOverlay = document.getElementById('authModalOverlay');
    const closeAuthModal = document.getElementById('closeAuthModal');
    const modalTitle = document.getElementById('modalTitle');
    const portalAuthForm = document.getElementById('portalAuthForm');
    const authUsernameInput = document.getElementById('authUsername');
    const authPasswordInput = document.getElementById('authPassword');
    
    // Inline Error Message Wrappers Spans Hooks
    const usernameError = document.getElementById('usernameError');
    const passwordError = document.getElementById('passwordError');
    const globalFormFeedback = document.getElementById('globalFormFeedback');

    // ==========================================================================
    // AUTHENTICATION STATE CONTROL PIPELINE
    // ==========================================================================
    function checkAndApplyAuthLayoutState() {
        const activeUserSession = JSON.parse(localStorage.getItem('news_active_session'));
        
        if (activeUserSession && activeUserSession.isLoggedIn) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (signupBtn) signupBtn.style.display = 'none';
            
            if (avatarBtn) {
                avatarBtn.style.display = 'flex';
                avatarBtn.classList.add('logged-in');
            }
            if (avatarLetter && activeUserSession.username) {
                avatarLetter.textContent = activeUserSession.username.substring(0, 1).toUpperCase();
            }
        } else {
            if (loginBtn) loginBtn.style.display = 'block';
            if (signupBtn) signupBtn.style.display = 'block';
            if (avatarBtn) {
                avatarBtn.style.display = 'none';
                avatarBtn.classList.remove('logged-in');
            }
        }
    }

    // Modal Interaction Handlers
    function openModalLayout(mode) {
        activeFormMode = mode;
        clearValidationErrors();
        portalAuthForm.reset();
        
        if (mode === 'signup') {
            modalTitle.textContent = "Create Account Plan";
        } else {
            modalTitle.textContent = "Account Access Portal";
        }
        
        authModalOverlay.classList.add('active');
    }

    function closeModalLayout() {
        authModalOverlay.classList.remove('active');
        clearValidationErrors();
        portalAuthForm.reset();
    }

    function clearValidationErrors() {
        if (usernameError) usernameError.textContent = '';
        if (passwordError) passwordError.textContent = '';
        if (globalFormFeedback) {
            globalFormFeedback.textContent = '';
            globalFormFeedback.className = 'global-form-feedback';
        }
        authUsernameInput.classList.remove('input-invalid');
        authPasswordInput.classList.remove('input-invalid');
    }

    if (signupBtn) signupBtn.addEventListener('click', () => openModalLayout('signup'));
    if (loginBtn) loginBtn.addEventListener('click', () => openModalLayout('login'));
    if (closeAuthModal) closeAuthModal.addEventListener('click', closeModalLayout);
    
    // Close overlay window safely if clicking outside the main white form card box
    authModalOverlay.addEventListener('click', (e) => {
        if (e.target === authModalOverlay) closeModalLayout();
    });

    // Form validation submit core event pipeline listener
    if (portalAuthForm) {
        portalAuthForm.addEventListener('submit', (event) => {
            event.preventDefault();
            clearValidationErrors();

            const inputUsername = authUsernameInput.value.trim();
            const inputPassword = authPasswordInput.value.trim();
            let isFormValid = true;

            // Constraint 1: Username Character Boundaries Checks
            if (!inputUsername) {
                usernameError.textContent = "❌ Username field cannot be left blank.";
                authUsernameInput.classList.add('input-invalid');
                isFormValid = false;
            } else if (inputUsername.length < 3) {
                usernameError.textContent = "❌ Username must contain at least 3 characters.";
                authUsernameInput.classList.add('input-invalid');
                isFormValid = false;
            }

            // Constraint 2: Password Complexity Check
            if (!inputPassword) {
                passwordError.textContent = "❌ Password field cannot be left blank.";
                authPasswordInput.classList.add('input-invalid');
                isFormValid = false;
            } else if (inputPassword.length < 6) {
                passwordError.textContent = "❌ Password must be at least 6 characters long.";
                authPasswordInput.classList.add('input-invalid');
                isFormValid = false;
            }

            if (!isFormValid) return; // Halt operations if inline errors exist

            const savedProfile = JSON.parse(localStorage.getItem('news_user_profile'));

            if (activeFormMode === 'signup') {
                // Execute Secure Sign Up Registration Database Actions
                const profilePayload = { username: inputUsername, password: inputPassword };
                localStorage.setItem('news_user_profile', JSON.stringify(profilePayload));
                
                globalFormFeedback.textContent = "🎉 Account created successfully! Proceeding to access clearance...";
                globalFormFeedback.classList.add('success-state');
                
                // Automatically log user in right after signing up
                setTimeout(() => {
                    const sessionPayload = { isLoggedIn: true, username: inputUsername };
                    localStorage.setItem('news_active_session', JSON.stringify(sessionPayload));
                    checkAndApplyAuthLayoutState();
                    closeModalLayout();
                }, 1200);

            } else {
                // Execute Authentication Login Checks Against Browser LocalStorage Rows
                if (savedProfile && savedProfile.username === inputUsername && savedProfile.password === inputPassword) {
                    const sessionPayload = { isLoggedIn: true, username: savedProfile.username };
                    localStorage.setItem('news_active_session', JSON.stringify(sessionPayload));
                    
                    globalFormFeedback.textContent = "✅ Verification complete. Access authorized.";
                    globalFormFeedback.classList.add('success-state');

                    setTimeout(() => {
                        checkAndApplyAuthLayoutState();
                        closeModalLayout();
                    }, 1000);
                } else {
                    globalFormFeedback.textContent = "❌ Authorization mismatch. Invalid username or security token password combo.";
                    globalFormFeedback.classList.add('error-state');
                    authUsernameInput.classList.add('input-invalid');
                    authPasswordInput.classList.add('input-invalid');
                }
            }
        });
    }

    if (avatarBtn) {
        avatarBtn.addEventListener('click', () => {
            if (confirm("Would you like to securely log out of your current session context?")) {
                localStorage.removeItem('news_active_session');
                checkAndApplyAuthLayoutState();
            }
        });
    }

    // ==========================================================================
    // INTERACTIVE SETTINGS APP CONFIGURATION PIPELINE
    // ==========================================================================
    if (configTriggerBtn) {
        configTriggerBtn.addEventListener('click', () => {
            const currentCacheSetting = localStorage.getItem('news_dismissed_blacklist') 
                ? JSON.parse(localStorage.getItem('news_dismissed_blacklist')).length 
                : 0;

            const systemsConfigDialogue = confirm(
                `🔧 SYSTEM PREFERENCES CONFIGURATION\n\n` +
                `• Monitored Dismissed Items: ${currentCacheSetting} articles hidden\n` +
                `• Operational Engine Pool Size: 200 items/fetch\n\n` +
                `Press OK if you want to completely flush your custom hidden/dismissed items list and start fresh, or press Cancel to return.`
            );

            if (systemsConfigDialogue) {
                localStorage.removeItem('news_dismissed_blacklist');
                alert("Hidden items cache database wiped successfully. Refreshing live views...");
                renderActiveStateGrid();
            }
        });
    }

    // ==========================================================================
    // CORE APPLICATION RENDERING PIPELINE
    // ==========================================================================
    async function renderPortalFeed(selectedFilter) {
        currentFeedContext = selectedFilter;
        
        let skeletonHTML = '';
        for (let i = 0; i < 12; i++) {
            skeletonHTML += `
                <div class="skeleton-card">
                    <div class="skeleton-image"></div>
                    <div class="skeleton-body">
                        <div class="skeleton-line title-long"></div>
                        <div class="skeleton-line title-short"></div>
                        <div class="skeleton-meta-row">
                            <div class="skeleton-line meta-left"></div>
                            <div class="skeleton-line meta-right"></div>
                        </div>
                    </div>
                </div>
            `;
        }
        newsGridDisplay.innerHTML = skeletonHTML;

        if (selectedFilter === 'Bookmarks') {
            localArticlesState = JSON.parse(localStorage.getItem('news_bookmarks_collection')) || [];
            renderActiveStateGrid();
            return;
        }
        
        try {
            const networkDataset = await fetchTopHeadlines(selectedFilter);
            localArticlesState = networkDataset;
            renderActiveStateGrid();
        } catch (apiError) {
            console.error("Feed orchestrator caught engine failure:", apiError);
            newsGridDisplay.innerHTML = `
                <div class="feed-status-message error-boundary-state" style="text-align: center; padding: 3rem; grid-column: 1/-1;">
                    <h3 style="color: #ef4444; font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">Feed Unavailable</h3>
                    <p style="color: #666666; font-size: 0.95rem;">${apiError.message || 'Check your data connections.'}</p>
                </div>
            `;
        }
    }

    function renderActiveStateGrid() {
        newsGridDisplay.innerHTML = '';
        
        const isPlatform = currentFeedContext.toLowerCase().startsWith('platform-');
        const isSearchQuery = currentFeedContext.toLowerCase().startsWith('search-');
        const isBookmarksView = currentFeedContext === 'Bookmarks';

        const dismissedArticlesBlacklist = JSON.parse(localStorage.getItem('news_dismissed_blacklist')) || [];
        const visibleArticles = isBookmarksView 
            ? localArticlesState 
            : localArticlesState.filter(article => !dismissedArticlesBlacklist.includes(article.url));

        const totalItemsCount = visibleArticles.length;
        
        if (isPlatform) {
            newsGridDisplay.className = 'platform-rows-layout-deck';
            dynamicHeadlineArea.innerHTML = `
                <div class="platform-header-brand-block">
                    <h1 class="platform-display-title">${currentPublisherName} <span class="headline-counter-badge">${totalItemsCount}</span></h1>
                    <div class="platform-sub-bar-navigation">
                        <span class="platform-sub-pill active">Recent</span>
                        <span class="platform-sub-pill">News Showcase</span>
                    </div>
                </div>
            `;
        } else if (isSearchQuery) {
            newsGridDisplay.className = 'cards-layout-grid';
            const queryLabel = currentFeedContext.substring(7);
            dynamicHeadlineArea.innerHTML = `<h2 class="feed-headline">Search results for: "${queryLabel}" <span class="headline-counter-badge">${totalItemsCount}</span></h2>`;
        } else if (isBookmarksView) {
            newsGridDisplay.className = 'cards-layout-grid';
            dynamicHeadlineArea.innerHTML = `<h2 class="feed-headline">Saved Bookmarks ⭐ <span class="headline-counter-badge">${totalItemsCount}</span></h2>`;
        } else {
            newsGridDisplay.className = 'cards-layout-grid';
            dynamicHeadlineArea.innerHTML = `<h2 class="feed-headline">Top stories <span class="headline-counter-badge">${totalItemsCount}</span></h2>`;
        }

        if (totalItemsCount === 0) {
            newsGridDisplay.innerHTML = `<div class="feed-status-message empty-state" style="grid-column: 1/-1; padding: 3rem; text-align: center; color: #64748b;">No articles found matching this view.</div>`;
            return;
        }

        visibleArticles.forEach((article, idx) => {
            try {
                const compiledCardNode = createNewsCard(article, idx, executeDeleteAction, executeSaveAction);
                if (isPlatform) {
                    compiledCardNode.className = 'news-horizontal-row';
                }
                newsGridDisplay.appendChild(compiledCardNode);
            } catch (err) { console.error("Error creating card node:", err); }
        });
    }

    function executeDeleteAction(targetItemUrl) {
        const dismissedArticlesBlacklist = JSON.parse(localStorage.getItem('news_dismissed_blacklist')) || [];
        if (!dismissedArticlesBlacklist.includes(targetItemUrl)) {
            dismissedArticlesBlacklist.push(targetItemUrl);
            localStorage.setItem('news_dismissed_blacklist', JSON.stringify(dismissedArticlesBlacklist));
        }

        if (currentFeedContext === 'Bookmarks') {
            let bookmarks = JSON.parse(localStorage.getItem('news_bookmarks_collection')) || [];
            bookmarks = bookmarks.filter(item => item.url !== targetItemUrl);
            localStorage.setItem('news_bookmarks_collection', JSON.stringify(bookmarks));
            localArticlesState = bookmarks;
        }

        renderActiveStateGrid();
    }

    function executeSaveAction(articleObj, buttonNode) {
        let bookmarks = JSON.parse(localStorage.getItem('news_bookmarks_collection')) || [];
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
        localStorage.setItem('news_bookmarks_collection', JSON.stringify(bookmarks));
    }

    function clearAllSelectionHighlights() {
        forYouPill.classList.remove('selected');
        if (bookmarksPill) bookmarksPill.classList.remove('selected');
        indianPill.classList.remove('selected');
        intlPill.classList.remove('selected');
        stateNewsPill.classList.remove('selected');
        worldNewsPill.classList.remove('selected');
    }

    function resetAllDropdownsExcept(activeSelector) {
        if (activeSelector !== forYouSelector) forYouSelector.selectedIndex = 0;
        if (activeSelector !== indianSelector) indianSelector.value = "timesofindia.indiatimes.com";
        if (activeSelector !== intlSelector) intlSelector.value = "bbc.com";
        if (activeSelector !== stateSelector) stateSelector.value = "maharashtra";
        if (activeSelector !== worldSelector) worldSelector.value = "india";
    }

    forYouSelector.addEventListener('change', (event) => {
        clearAllSelectionHighlights();
        forYouPill.classList.add('selected');
        resetAllDropdownsExcept(forYouSelector);
        if (searchFieldInput) searchFieldInput.value = '';
        renderPortalFeed(event.target.value || 'Home');
    });

    forYouPill.addEventListener('click', (event) => {
        if (event.target === forYouSelector) return;
        clearAllSelectionHighlights();
        forYouPill.classList.add('selected');
        resetAllDropdownsExcept(forYouSelector);
        renderPortalFeed(forYouSelector.value || 'Home');
    });

    if (bookmarksPill) {
        bookmarksPill.addEventListener('click', () => {
            clearAllSelectionHighlights();
            bookmarksPill.classList.add('selected');
            resetAllDropdownsExcept(null);
            if (searchFieldInput) searchFieldInput.value = '';
            renderPortalFeed('Bookmarks');
        });
    }

    indianSelector.addEventListener('change', (event) => {
        if (!event.target.value) return;
        clearAllSelectionHighlights();
        indianPill.classList.add('selected');
        resetAllDropdownsExcept(indianSelector);
        if (searchFieldInput) searchFieldInput.value = '';
        currentPublisherName = indianSelector.options[indianSelector.selectedIndex].text;
        renderPortalFeed(`PLATFORM-${event.target.value}`);
    });

    indianPill.addEventListener('click', (event) => {
        if (event.target === indianSelector) return;
        clearAllSelectionHighlights();
        indianPill.classList.add('selected');
        resetAllDropdownsExcept(indianSelector);
        currentPublisherName = indianSelector.options[indianSelector.selectedIndex].text;
        renderPortalFeed(`PLATFORM-${indianSelector.value}`);
    });

    intlSelector.addEventListener('change', (event) => {
        if (!event.target.value) return;
        clearAllSelectionHighlights();
        intlPill.classList.add('selected');
        resetAllDropdownsExcept(intlSelector);
        if (searchFieldInput) searchFieldInput.value = '';
        currentPublisherName = intlSelector.options[intlSelector.selectedIndex].text;
        renderPortalFeed(`PLATFORM-${event.target.value}`);
    });

    intlPill.addEventListener('click', (event) => {
        if (event.target === intlSelector) return;
        clearAllSelectionHighlights();
        intlPill.classList.add('selected');
        resetAllDropdownsExcept(intlSelector);
        currentPublisherName = intlSelector.options[intlSelector.selectedIndex].text;
        renderPortalFeed(`PLATFORM-${intlSelector.value}`);
    });

    stateSelector.addEventListener('change', (event) => {
        if (!event.target.value) return;
        clearAllSelectionHighlights();
        stateNewsPill.classList.add('selected');
        resetAllDropdownsExcept(stateSelector);
        if (searchFieldInput) searchFieldInput.value = '';
        renderPortalFeed(`STATE-${event.target.value}`);
    });

    stateNewsPill.addEventListener('click', (event) => {
        if (event.target === stateSelector) return;
        clearAllSelectionHighlights();
        stateNewsPill.classList.add('selected');
        resetAllDropdownsExcept(stateSelector);
        renderPortalFeed(`STATE-${stateSelector.value}`);
    });

    worldSelector.addEventListener('change', (event) => {
        if (!event.target.value) return;
        clearAllSelectionHighlights();
        worldNewsPill.classList.add('selected');
        resetAllDropdownsExcept(worldSelector);
        if (searchFieldInput) searchFieldInput.value = '';
        renderPortalFeed(`WORLD-${event.target.value}`);
    });

    worldNewsPill.addEventListener('click', (event) => {
        if (event.target === worldSelector) return;
        clearAllSelectionHighlights();
        worldNewsPill.classList.add('selected');
        resetAllDropdownsExcept(worldSelector);
        renderPortalFeed(`WORLD-${worldSelector.value}`);
    });

    if (searchFieldInput) {
        searchFieldInput.addEventListener('input', (event) => {
            const rawQueryString = event.target.value.trim();
            clearTimeout(searchDebounceTimer);
            if (rawQueryString.length === 0) {
                resetAllDropdownsExcept(null);
                renderPortalFeed('Home');
                return;
            }
            if (rawQueryString.length < 3) return;

            searchDebounceTimer = setTimeout(() => {
                clearAllSelectionHighlights();
                resetAllDropdownsExcept(null);
                renderPortalFeed(`search-${rawQueryString}`);
            }, 400);
        });
    }

    const financialTickerWidget = document.querySelector('.financial-ticker');
    if (financialTickerWidget) {
        financialTickerWidget.addEventListener('click', () => {
            clearAllSelectionHighlights();
            forYouPill.classList.add('selected');
            resetAllDropdownsExcept(forYouSelector);
            forYouSelector.value = 'Business';
            renderPortalFeed('Business');
        });
    }

    function updateLiveDateTimeStamp() {
        const dateBox = document.getElementById('live-date-box');
        if (!dateBox) return;
        const currentClockState = new Date();
        dateBox.textContent = currentClockState.toLocaleDateString('en-US', {
            weekday: 'long', day: 'numeric', month: 'long'
        });
    }

    async function fetchDistrictName(latitude, longitude) {
        const locationBox = document.getElementById('location-box');
        if (!locationBox) return;
        try {
            const geocodeUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
            const response = await fetch(geocodeUrl, { headers: { 'User-Agent': 'NewsAggregatorApp/1.0' } });
            if (!response.ok) throw new Error("Geocoding failed");
            const data = await response.json();
            const addr = data.address;
            locationBox.textContent = addr.district || addr.city_district || addr.suburb || addr.city || addr.town || addr.state_district || "Amravati";
        } catch (error) { locationBox.textContent = "Amravati"; }
    }

    async function fetchRealTimeLocalWeather(latitude, longitude) {
        const tempBox = document.getElementById('temp-box');
        const iconBox = document.getElementById('weather-icon');
        try {
            fetchDistrictName(latitude, longitude);
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
        } catch (e) { console.error(e); }
    }

    function initializeUserLocationDiscovery() {
        const locationBox = document.getElementById('location-box');
        if (!navigator.geolocation) {
            if (locationBox) locationBox.textContent = "Unsupported";
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => fetchRealTimeLocalWeather(pos.coords.latitude, pos.coords.longitude),
            () => {
                if (locationBox) locationBox.textContent = "Amravati (Default)";
                fetchRealTimeLocalWeather(20.9374, 77.7796); 
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
        );
    }

    // System Startup Sequence Initialization
    updateLiveDateTimeStamp();
    initializeUserLocationDiscovery();
    checkAndApplyAuthLayoutState(); 
    resetAllDropdownsExcept(null);
    renderPortalFeed('Home');
});