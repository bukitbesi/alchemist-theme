/**
 * Blogger Categorized Sitemap with Thumbnails
 */

(function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        blogUrl: 'https://bukitbesi.blogspot.com',
        postsPerLabel: 10, // Posts to show per category
        imageSize: 400, // Thumbnail size
        defaultThumb: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72"%3E%3Crect width="72" height="72" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="sans-serif" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E',
        maxLabels: 20, // Maximum labels to display
        excerptLength: 100
    };
    
    // Cache for loaded data
    const cache = {
        labels: [],
        posts: {},
        currentLabel: null
    };
    
    /**
     * Initialize the sitemap
     */
    function init() {
        const container = document.getElementById('recentpostsae');
        const navContainer = document.getElementById('recentpostnavfeed');
        
        if (!container || !navContainer) {
            console.error('Required containers not found');
            return;
        }
        
        // Load all labels first
        loadLabels();
    }
    
    /**
     * Load all labels/categories
     */
    function loadLabels() {
        showLoading();
        
        const script = document.createElement('script');
        script.src = `${CONFIG.blogUrl}/feeds/posts/summary?alt=json-in-script&max-results=0&callback=BloggerSitemap.processLabels`;
        document.head.appendChild(script);
    }
    
    /**
     * Process labels from feed
     */
    function processLabels(data) {
        const labelSet = new Set();
        
        // Extract all unique labels
        if (data.feed.category) {
            data.feed.category.forEach(cat => {
                labelSet.add(cat.term);
            });
        }
        
        cache.labels = Array.from(labelSet).sort().slice(0, CONFIG.maxLabels);
        
        // Display label navigation
        displayLabelNav();
        
        // Load first label's posts
        if (cache.labels.length > 0) {
            loadLabelPosts(cache.labels[0]);
        } else {
            // No labels found, load recent posts
            loadRecentPosts();
        }
    }
    
    /**
     * Display label navigation
     */
    function displayLabelNav() {
        const navContainer = document.getElementById('recentpostnavfeed');
        navContainer.innerHTML = '';
        
        const nav = document.createElement('div');
        nav.className = 'label-nav';
        nav.innerHTML = `
            <style>
.label-nav{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:20px;justify-content:center}.label-btn{background:#fff;border:1px solid #ddd;padding:8px 16px;border-radius:20px;cursor:pointer;transition:all 0.3s;font-size:14px;text-decoration:none;color:#333;display:inline-block}.label-btn:hover{background:#f0f0f0;transform:translateY(-2px);box-shadow:0 4px 8px rgb(0 0 0 / .1)}.label-btn.active{background:#333;color:#fff;border-color:#333}.all-posts-btn{background:#007bff;color:#fff;border-color:#007bff}.all-posts-btn:hover{background:#0056b3}
            </style>
        `;
        
        // Add "All Posts" button
        const allBtn = document.createElement('a');
        allBtn.href = '#';
        allBtn.className = 'label-btn all-posts-btn';
        allBtn.textContent = '📋 All Posts';
        allBtn.onclick = (e) => {
            e.preventDefault();
            document.querySelectorAll('.label-btn').forEach(b => b.classList.remove('active'));
            allBtn.classList.add('active');
            loadRecentPosts();
        };
        nav.appendChild(allBtn);
        
        // Add label buttons
        cache.labels.forEach(label => {
            const btn = document.createElement('a');
            btn.href = '#';
            btn.className = 'label-btn';
            btn.textContent = getEmojiForLabel(label) + ' ' + label;
            btn.onclick = (e) => {
                e.preventDefault();
                document.querySelectorAll('.label-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                loadLabelPosts(label);
            };
            nav.appendChild(btn);
        });
        
        navContainer.appendChild(nav);
    }
    
    /**
     * Get emoji for common labels
     */
    function getEmojiForLabel(label) {
        const emojiMap = {
            'Food': '🍔',
            'Pelancongan': '✈️',
            'Teknologi': '💻',
            'Tech': '💻',
            'Gaya Hidup': '🌟',
            'Fesyen': '👗',
            'Sukan': '⚽',
            'Muzik': '🎵',
            'Kesihatan': '💪',
            'Bisnes': '💼',
            'Pelajaran': '📚',
            'Berita': '📰',
            'Hiburan': '🎬',
            'Gaming': '🎮',
            'Fototgrafi': '📷',
            'Seni': '🎨',
            'Sains': '🔬',
            'Politik': '🏛️',
            'Alam Semulajadi': '🌿',
            'Haiwan': '🐾'
        };
        
        const lowerLabel = label.toLowerCase();
        for (const [key, emoji] of Object.entries(emojiMap)) {
            if (lowerLabel.includes(key)) return emoji;
        }
        return '📌'; // Default emoji
    }
    
    /**
     * Load posts for specific label
     */
    function loadLabelPosts(label) {
        showLoading();
        cache.currentLabel = label;
        
        // Check cache first
        if (cache.posts[label]) {
            displayPosts(cache.posts[label], label);
            return;
        }
        
        const script = document.createElement('script');
        script.src = `${CONFIG.blogUrl}/feeds/posts/default/-/${encodeURIComponent(label)}?alt=json-in-script&max-results=${CONFIG.postsPerLabel}&callback=BloggerSitemap.processPosts`;
        document.head.appendChild(script);
    }
    
    /**
     * Load recent posts (all categories)
     */
    function loadRecentPosts() {
        showLoading();
        cache.currentLabel = 'recent';
        
        if (cache.posts['recent']) {
            displayPosts(cache.posts['recent'], 'Recent Posts');
            return;
        }
        
        const script = document.createElement('script');
        script.src = `${CONFIG.blogUrl}/feeds/posts/default?alt=json-in-script&max-results=18&callback=BloggerSitemap.processPosts`;
        document.head.appendChild(script);
    }
    
    /**
     * Process posts from feed
     */
    function processPosts(data) {
        const posts = [];
        
        if (data.feed.entry) {
            data.feed.entry.forEach(entry => {
                const post = {
                    title: entry.title.$t,
                    url: entry.link.find(l => l.rel === 'alternate')?.href || '',
                    thumbnail: extractThumbnail(entry),
                    excerpt: extractExcerpt(entry),
                    published: new Date(entry.published.$t),
                    labels: entry.category ? entry.category.map(c => c.term) : []
                };
                posts.push(post);
            });
        }
        
        // Cache the results
        const cacheKey = cache.currentLabel === 'recent' ? 'recent' : cache.currentLabel;
        cache.posts[cacheKey] = posts;
        
        // Display posts
        displayPosts(posts, cache.currentLabel === 'recent' ? 'Recent Posts' : cache.currentLabel);
    }
    
    /**
     * Extract thumbnail with multiple fallbacks
     */
    function extractThumbnail(entry) {
        // Try media thumbnail first
        if (entry.media$thumbnail) {
            return entry.media$thumbnail.url.replace(/\/s\d+(-c)?\//, `/s${CONFIG.imageSize}-c/`);
        }
        
        // Try to extract from content
        const content = entry.content?.$t || entry.summary?.$t || '';
        const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/);
        if (imgMatch) {
            return imgMatch[1].replace(/\/s\d+(-c)?\//, `/s${CONFIG.imageSize}-c/`);
        }
        
        return CONFIG.defaultThumb;
    }
    
    /**
     * Extract clean excerpt
     */
    function extractExcerpt(entry) {
        const content = entry.content?.$t || entry.summary?.$t || '';
        const text = content.replace(/<[^>]+>/g, '').trim();
        return text.length > CONFIG.excerptLength 
            ? text.substring(0, CONFIG.excerptLength) + '...' 
            : text;
    }
    
    /**
     * Display posts in grid
     */
    function displayPosts(posts, labelName) {
        const container = document.getElementById('recentpostsae');
        
        // Add responsive grid styles
        const styles = `
            <style>
                .sitemap-header{text-align:center;margin:20px 0;font-size:24px;color:#333}.posts-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:20px;margin:20px 0}.recentpostel{background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgb(0 0 0 / .1);transition:transform 0.3s,box-shadow 0.3s;display:flex;flex-direction:column}.recentpostel:hover{transform:translateY(-5px);box-shadow:0 5px 20px rgb(0 0 0 / .15)}.post-thumb{width:100%;height:200px;object-fit:cover;background:#f0f0f0}.post-content{padding:15px;flex-grow:1;display:flex;flex-direction:column}.post-title{font-size:18px;font-weight:600;margin:0 0 10px 0;line-height:1.3}.post-title a{color:#333;text-decoration:none;transition:color 0.3s}.post-title a:hover{color:#007bff}.post-excerpt{color:#666;font-size:14px;line-height:1.5;flex-grow:1}.post-meta{display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding-top:10px;border-top:1px solid #eee;font-size:12px;color:#999}@media (max-width:768px){.posts-grid{grid-template-columns:1fr}}
            </style>
        `;
        
        let html = styles;
        html += `<h2 class="sitemap-header">${getEmojiForLabel(labelName)} ${labelName}</h2>`;
        html += '<div class="posts-grid">';
        
        posts.forEach(post => {
            const date = post.published.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            
            html += `
                <article class="recentpostel">
                    <img class="post-thumb" 
                         src="${post.thumbnail}" 
                         alt="${post.title}"
                         loading="lazy"
                         onerror="this.src='${CONFIG.defaultThumb}'">
                    <div class="post-content">
                        <h3 class="post-title">
                            <a href="${post.url}" rel="bookmark">${post.title}</a>
                        </h3>
                        ${post.excerpt ? `<p class="post-excerpt">${post.excerpt}</p>` : ''}
                        <div class="post-meta">
                            <span class="post-date">${date}</span>
                            <a href="${post.url}" class="read-more">Read More →</a>
                        </div>
                    </div>
                </article>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        // Generate Schema
        generateSchema(posts, labelName);
    }
    
    /**
     * Show loading state
     */
    function showLoading() {
        const container = document.getElementById('recentpostsae');
        container.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <div style="display: inline-block; width: 50px; height: 50px; border: 3px solid #f3f3f3; border-top: 3px solid #333; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            </div>
        `;
    }
    
    /**
     * Generate SEO Schema
     */
    function generateSchema(posts, categoryName) {
        const schema = {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": `${categoryName} - Blog Sitemap`,
            "description": `Collection of blog posts about ${categoryName}`,
            "url": window.location.href,
            "hasPart": posts.map((post, index) => ({
                "@type": "BlogPosting",
                "position": index + 1,
                "headline": post.title,
                "url": post.url,
                "image": post.thumbnail !== CONFIG.defaultThumb ? post.thumbnail : undefined,
                "datePublished": post.published.toISOString(),
                "description": post.excerpt
            }))
        };
        
        let scriptTag = document.getElementById('sitemap-schema');
        if (!scriptTag) {
            scriptTag = document.createElement('script');
            scriptTag.type = 'application/ld+json';
            scriptTag.id = 'sitemap-schema';
            document.head.appendChild(scriptTag);
        }
        scriptTag.textContent = JSON.stringify(schema);
    }
    
    // Public API
    window.BloggerSitemap = {
        init: init,
        processLabels: processLabels,
        processPosts: processPosts
    };
    
    // Auto-init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
