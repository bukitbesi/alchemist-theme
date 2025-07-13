/**
 * ===================================================================
 * THE ALCHEMIST V1 - PWA SERVICE WORKER
 * Maximum performance with offline capabilities
 * ===================================================================
 */

const CACHE_NAME = 'alchemist-theme-v1.0.0';
const STATIC_CACHE = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE = `${CACHE_NAME}-dynamic`;
const IMAGE_CACHE = `${CACHE_NAME}-images`;

// Assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/offline.html', // Create this fallback page
    'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
    'https://cdn.jsdelivr.net/gh/bukitbesi/tbb@main/alchemist/css/styles.css',
    'https://cdn.jsdelivr.net/gh/bukitbesi/tbb@main/alchemist/css/dark.css',
    'https://cdn.jsdelivr.net/gh/bukitbesi/tbb@main/alchemist/js/scripts.js'
];

// Assets to cache on demand
const CACHE_STRATEGIES = {
    // Cache first (for static assets)
    cacheFirst: [
        /\.(?:js|css|woff2?|ttf|eot)$/,
        /cdn\.jsdelivr\.net/,
        /fonts\.googleapis\.com/,
        /fonts\.gstatic\.com/
    ],
    
    // Network first (for dynamic content)
    networkFirst: [
        /\/feeds\//,
        /\.json$/,
        /api\./
    ],
    
    // Stale while revalidate (for images and posts)
    staleWhileRevalidate: [
        /\.(?:png|jpg|jpeg|gif|webp|svg|ico)$/,
        /blogger\.googleusercontent\.com/,
        /blogspot\.com/
    ]
};

// Maximum cache sizes
const CACHE_LIMITS = {
    [STATIC_CACHE]: 50,
    [DYNAMIC_CACHE]: 100,
    [IMAGE_CACHE]: 200
};

// ===================================================================
// SERVICE WORKER INSTALLATION
// ===================================================================

self.addEventListener('install', event => {
    console.log('🔧 Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('📦 Caching static assets...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('✅ Static assets cached successfully');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('❌ Failed to cache static assets:', error);
            })
    );
});

// ===================================================================
// SERVICE WORKER ACTIVATION
// ===================================================================

self.addEventListener('activate', event => {
    console.log('🚀 Service Worker activating...');
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            cleanupOldCaches(),
            // Take control immediately
            self.clients.claim()
        ]).then(() => {
            console.log('✅ Service Worker activated successfully');
        })
    );
});

// ===================================================================
// FETCH HANDLER WITH ADVANCED CACHING STRATEGIES
// ===================================================================

self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip cross-origin requests (except allowed CDNs)
    if (url.origin !== self.location.origin && !isAllowedOrigin(url.origin)) {
        return;
    }
    
    event.respondWith(handleRequest(request));
});

// ===================================================================
// ADVANCED REQUEST HANDLING
// ===================================================================

async function handleRequest(request) {
    const url = new URL(request.url);
    
    try {
        // Determine caching strategy
        const strategy = getCachingStrategy(request);
        
        switch (strategy) {
            case 'cacheFirst':
                return await cacheFirst(request);
            case 'networkFirst':
                return await networkFirst(request);
            case 'staleWhileRevalidate':
                return await staleWhileRevalidate(request);
            default:
                return await networkFirst(request);
        }
    } catch (error) {
        console.error('❌ Request failed:', request.url, error);
        return await getFallbackResponse(request);
    }
}

// ===================================================================
// CACHING STRATEGIES
// ===================================================================

// Cache First - Good for static assets
async function cacheFirst(request) {
    const cachedResponse = await getCachedResponse(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            await cacheResponse(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        return await getFallbackResponse(request);
    }
}

// Network First - Good for dynamic content
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            await cacheResponse(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        const cachedResponse = await getCachedResponse(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        return await getFallbackResponse(request);
    }
}

// Stale While Revalidate - Good for images and frequently updated content
async function staleWhileRevalidate(request) {
    const cachedResponse = await getCachedResponse(request);
    
    // Always try to fetch from network in background
    const networkPromise = fetch(request)
        .then(response => {
            if (response.ok) {
                cacheResponse(request, response.clone());
            }
            return response;
        })
        .catch(error => {
            console.warn('Background fetch failed:', request.url, error);
        });
    
    // Return cached version immediately if available
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // If no cache, wait for network
    try {
        return await networkPromise;
    } catch (error) {
        return await getFallbackResponse(request);
    }
}

// ===================================================================
// CACHE MANAGEMENT
// ===================================================================

async function getCachedResponse(request) {
    const cacheNames = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE];
    
    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const response = await cache.match(request);
        if (response) {
            return response;
        }
    }
    
    return null;
}

async function cacheResponse(request, response) {
    if (!response || !response.ok) {
        return;
    }
    
    const cacheName = getCacheNameForRequest(request);
    const cache = await caches.open(cacheName);
    
    try {
        await cache.put(request, response);
        await limitCacheSize(cacheName);
    } catch (error) {
        console.warn('Failed to cache response:', request.url, error);
    }
}

function getCacheNameForRequest(request) {
    const url = request.url;
    
    if (CACHE_STRATEGIES.cacheFirst.some(pattern => pattern.test(url))) {
        return STATIC_CACHE;
    }
    
    if (url.match(/\.(?:png|jpg|jpeg|gif|webp|svg|ico)$/)) {
        return IMAGE_CACHE;
    }
    
    return DYNAMIC_CACHE;
}

async function limitCacheSize(cacheName) {
    const limit = CACHE_LIMITS[cacheName];
    if (!limit) return;
    
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (keys.length > limit) {
        // Remove oldest entries
        const keysToDelete = keys.slice(0, keys.length - limit);
        await Promise.all(keysToDelete.map(key => cache.delete(key)));
        console.log(`🧹 Cleaned ${keysToDelete.length} old entries from ${cacheName}`);
    }
}

async function cleanupOldCaches() {
    const cacheNames = await caches.keys();
    const validCaches = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE];
    
    const deletePromises = cacheNames
        .filter(cacheName => !validCaches.includes(cacheName))
        .map(cacheName => {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
        });
    
    return Promise.all(deletePromises);
}

// ===================================================================
// UTILITY FUNCTIONS
// ===================================================================

function getCachingStrategy(request) {
    const url = request.url;
    
    for (const [strategy, patterns] of Object.entries(CACHE_STRATEGIES)) {
        if (patterns.some(pattern => pattern.test(url))) {
            return strategy;
        }
    }
    
    return 'networkFirst'; // default
}

function isAllowedOrigin(origin) {
    const allowedOrigins = [
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
        'https://cdn.jsdelivr.net',
        'https://blogger.googleusercontent.com'
    ];
    
    return allowedOrigins.includes(origin);
}

async function getFallbackResponse(request) {
    const url = new URL(request.url);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
        const offlineCache = await caches.open(STATIC_CACHE);
        const offlinePage = await offlineCache.match('/offline.html');
        
        if (offlinePage) {
            return offlinePage;
        }
        
        // Create a basic offline response
        return new Response(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Offline - Bukit Besi Blog</title>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width,initial-scale=1">
                <style>
                    body { 
                        font-family: 'Poppins', sans-serif; 
                        text-align: center; 
                        padding: 2rem; 
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0;
                    }
                    .offline-container {
                        background: rgba(255,255,255,0.1);
                        padding: 3rem;
                        border-radius: 20px;
                        backdrop-filter: blur(10px);
                        max-width: 500px;
                    }
                    h1 { font-size: 2.5rem; margin-bottom: 1rem; }
                    p { font-size: 1.2rem; line-height: 1.6; margin-bottom: 2rem; }
                    .emoji { font-size: 4rem; margin-bottom: 1rem; }
                    .retry-btn {
                        background: rgba(255,255,255,0.2);
                        color: white;
                        border: 2px solid white;
                        padding: 1rem 2rem;
                        border-radius: 30px;
                        cursor: pointer;
                        font-size: 1rem;
                        transition: all 0.3s ease;
                    }
                    .retry-btn:hover {
                        background: white;
                        color: #667eea;
                    }
                </style>
            </head>
            <body>
                <div class="offline-container">
                    <div class="emoji">🌐</div>
                    <h1>You're Offline</h1>
                    <p>It looks like you're not connected to the internet. Please check your connection and try again.</p>
                    <button class="retry-btn" onclick="window.location.reload()">Retry</button>
                </div>
            </body>
            </html>
        `, {
            status: 200,
            statusText: 'OK',
            headers: {
                'Content-Type': 'text/html; charset=utf-8'
            }
        });
    }
    
    // Return placeholder for images
    if (request.destination === 'image') {
        return new Response(
            `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#f8f9fa"/>
                <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#6c757d" font-family="Arial, sans-serif" font-size="16">
                    📷 Image not available offline
                </text>
            </svg>`,
            {
                status: 200,
                headers: {
                    'Content-Type': 'image/svg+xml',
                    'Cache-Control': 'no-cache'
                }
            }
        );
    }
    
    // Generic fallback
    return new Response('Content not available offline', {
        status: 503,
        statusText: 'Service Unavailable'
    });
}

// ===================================================================
// BACKGROUND SYNC (for future features)
// ===================================================================

self.addEventListener('sync', event => {
    console.log('🔄 Background sync triggered:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    try {
        // Sync any pending operations
        console.log('🔄 Performing background sync...');
        
        // Example: Send queued analytics data
        // Example: Update cached content
        // Example: Sync form submissions
        
        console.log('✅ Background sync completed');
    } catch (error) {
        console.error('❌ Background sync failed:', error);
        throw error; // This will retry the sync
    }
}

// ===================================================================
// PUSH NOTIFICATIONS (for future features)
// ===================================================================

self.addEventListener('push', event => {
    console.log('📱 Push notification received');
    
    const options = {
        body: 'New content available on Bukit Besi Blog!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Read Now',
                icon: '/icons/check.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/icons/cross.png'
            }
        ]
    };
    
    if (event.data) {
        const payload = event.data.json();
        options.body = payload.body || options.body;
        options.data.url = payload.url;
    }
    
    event.waitUntil(
        self.registration.showNotification('Bukit Besi Blog', options)
    );
});

self.addEventListener('notificationclick', event => {
    console.log('📱 Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        const url = event.notification.data.url || '/';
        event.waitUntil(
            clients.openWindow(url)
        );
    }
});

// ===================================================================
// PERFORMANCE MONITORING
// ===================================================================

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'PERFORMANCE_MEASURE') {
        console.log('📊 Performance measure:', event.data.data);
        
        // Store performance data for analytics
        // Could be sent to analytics service when online
    }
});

// ===================================================================
// ERROR HANDLING
// ===================================================================

self.addEventListener('error', event => {
    console.error('❌ Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
    console.error('❌ Unhandled promise rejection in SW:', event.reason);
});

// ===================================================================
// PERIODIC BACKGROUND SYNC (for modern browsers)
// ===================================================================

self.addEventListener('periodicsync', event => {
    if (event.tag === 'content-sync') {
        event.waitUntil(syncLatestContent());
    }
});

async function syncLatestContent() {
    try {
        console.log('🔄 Syncing latest content...');
        
        // Fetch latest posts and update cache
        const response = await fetch('/feeds/posts/default?alt=json&max-results=5');
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            await cache.put('/feeds/posts/default?alt=json&max-results=5', response);
            console.log('✅ Latest content synced');
        }
    } catch (error) {
        console.error('❌ Content sync failed:', error);
    }
}

// ===================================================================
// INITIALIZATION
// ===================================================================

console.log('🔧 Service Worker script loaded');

// Register for periodic background sync if available
if ('periodicSync' in self.registration) {
    self.registration.periodicSync.register('content-sync', {
        minInterval: 24 * 60 * 60 * 1000 // 24 hours
    }).catch(error => {
        console.log('Periodic sync registration failed:', error);
    });
}
