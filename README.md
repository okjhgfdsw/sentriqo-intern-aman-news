

## Sentriqo News Aggregator terminal

[![Deployment Status](https://img.shields.io/badge/Deployment-Live_on_GitHub_Pages-22c55e?style=for-the-badge&logo=github)](https://okjhgfdsw.github.io/sentriqo-intern-aman-news/)
[![Tech Stack](https://img.shields.io/badge/Stack-Vanilla_JS_||_HTML5_||_CSS3-38bdf8?style=for-the-badge)](https://github.com/okjhgfdsw/sentriqo-intern-aman-news)

A clean and fast News Aggregator Dashboard built using pure Vanilla JavaScript during my 8-week software engineering internship at Sentriqo. The application fetches live news from public APIs, organizes data on a responsive dashboard, and allows users to search and filter topics seamlessly and also provide bookmark
to read news later.

🔗 **Live Production URL:** [https://okjhgfdsw.github.io/sentriqo-intern-aman-news/](https://okjhgfdsw.github.io/sentriqo-intern-aman-news/)

---

## Core Features

### 1. 🔒 Secure Google Sign-In 
* Google Login (OAuth): Safely handles login tokens inside a single browser tab.

* Multi-User Protection: Uses window.getAccountStorageKey to separate user bookmarks and search histories, preventing data leaking between different accounts on the same browser.
### 2.🔍 Smart Search & Content Filtering
* Triggers search operations explicitly when clicking the "Search" button .

* Noise Filter: Cleans up live news feeds by blocking unwanted keywords (like matches or entertainment) .

### 3. 📊 Visual Analytics Graph & Dynamic Layouts
* **Real-time Charting System:** Integrated `Chart.js` to know the trusted platform from where my website fetched news .
* 
* **Responsive Layout:** Built modular structural components executing user preference layout selection arrays (Modular Grid Cards, Force Horizontal view).



## 🛠️ Architecture and Tech Stack

* Core Languages: Vanilla JS (ES6+), HTML5, CSS3
* **User Interface Layer:** Semantic HTML5 Markup and Complex CSS3 Layout Engine
* **External Integrations:** Google Identity Provider Platform SDK, Chart.js Visual Engines, Open-Meteo Meteorological APIs, OpenStreetMap Reverse Geocoding Infrastructure.
