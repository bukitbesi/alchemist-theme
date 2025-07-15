/**
 * Created by The Bukit Besi
 */

(function() {
    'use strict';
    
    // Configuration
    const config = {
        numPosts: 18,
        blogUrl: 'https://bukitbesi.blogspot.com',
        noImageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjhu_1tNK6stn8njZTiqOyJoK83q2bAIu9wlUGQ9k4KeIvMm26jqiTi5GHPY-uynpKkTQ6bLhWDZSXv1Nof4VRA7qasG1O29zFNjLhQ4oQgpZO2Kml7klSCpRp4MDuermU4Twrz9Lco05Bv/s1600/no-image.png',
        excerptLength: 0, // Set to 0 to disable excerpts
        imageSize: 's72-c', // Optimize image size
        startIndex: 1
    };
    
    // State management
    const state = {
        currentScript: null,
        urlPrevious: '',
        urlNext: '',
        posts: []
    };
    
    /**
     * Strip HTML tags and truncate text
     */
    function stripHtml(html, maxLength) {
        if (!maxLength || maxLength === 0) return '';
        
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        const text = tmp.textContent || tmp.innerText || '';
        return text.substring(0, maxLength - 1);
    }
    
    /**
     * Get optimized thumbnail URL
     */
    function getThumbnail(entry) {
        if ('media$thumbnail' in entry) {
            // Replace with optimized size
            return entry.media$thumbnail.url.replace(/\/s\d+(-c)?\//, `/${config.imageSize}/`);
        }
        return config.noImageUrl;
    }
    
    /**
     * Generate Schema.org JSON-LD
     */
    function generateSchema(posts) {
        const schema = {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Blog Sitemap",
            "description": "Complete list of blog posts with thumbnails",
            "url": window.location.href,
            "numberOfItems": posts.length,
            "itemListElement": posts.map((post, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                    "@type": "BlogPosting",
                    "name": post.title,
                    "url": post.url,
                    "image": post.thumbnail,
                    "description": post.excerpt || post.title
                }
            }))
        };
        
        // Remove existing schema if any
        const existingSchema = document.getElementById('sitemap-schema');
        if (existingSchema) {
            existingSchema.remove();
        }
        
        // Add new schema
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'sitemap-schema';
        script.textContent = JSON.stringify(schema);
        document.head.appendChild(script);
    }
    
    /**
     * Render posts with lazy loading for images
     */
    function renderPosts(data) {
        const container = document.getElementById('recentpostsae');
        const navContainer = document.getElementById('recentpostnavfeed');
        
        if (!container || !navContainer) return;
        
        // Extract navigation URLs
        state.urlPrevious = '';
        state.urlNext = '';
        
        if (data.feed.link) {
            data.feed.link.forEach(link => {
                if (link.rel === 'previous') state.urlPrevious = link.href;
                if (link.rel === 'next') state.urlNext = link.href;
            });
        }
        
        // Process posts
        state.posts = [];
        const fragment = document.createDocumentFragment();
        
        data.feed.entry.slice(0, config.numPosts).forEach(entry => {
            const title = entry.title.$t;
            let url = '';
            
            // Find alternate link
            if (entry.link) {
                const altLink = entry.link.find(link => link.rel === 'alternate');
                if (altLink) url = altLink.href;
            }
            
            const content = entry.content?.$t || entry.summary?.$t || '';
            const thumbnail = getThumbnail(entry);
            const excerpt = stripHtml(content, config.excerptLength);
            
            // Store for schema
            state.posts.push({ title, url, thumbnail, excerpt });
            
            // Create post element
            const postEl = document.createElement('div');
            postEl.className = 'recentpostel';
            
            // Use template literals for better readability
            postEl.innerHTML = `
                <a href="${url}" rel="bookmark">
                    <img src="${thumbnail}" 
                         alt="${title}" 
                         loading="lazy" 
                         width="72" 
                         height="72">
                </a>
                <h6><a href="${url}" rel="bookmark">${title}</a></h6>
                ${excerpt ? `<p>${excerpt}</p>` : ''}
            `;
            
            fragment.appendChild(postEl);
        });
        
        // Clear and append
        container.innerHTML = '';
        container.appendChild(fragment);
        
        // Render navigation
        renderNavigation();
        
        // Generate schema
        generateSchema(state.posts);
    }
    
    /**
     * Render navigation with improved accessibility
     */
    function renderNavigation() {
        const navContainer = document.getElementById('recentpostnavfeed');
        if (!navContainer) return;
        
        const nav = document.createElement('nav');
        nav.setAttribute('aria-label', 'Sitemap pagination');
        
        let navHtml = '';
        
        // Previous button
        if (state.urlPrevious) {
            navHtml += `<a href="javascript:void(0);" 
                           class="previous" 
                           onclick="BloggerSitemap.navigate(-1)"
                           aria-label="Previous page">
                           <i class="fas fa-arrow-left" aria-hidden="true"></i>
                        </a>`;
        } else {
            navHtml += `<span class="noactived previous" aria-disabled="true">
                           <i class="fas fa-arrow-left" aria-hidden="true"></i>
                        </span>`;
        }
        
        // Next button
        if (state.urlNext) {
            navHtml += `<a href="javascript:void(0);" 
                           class="next" 
                           onclick="BloggerSitemap.navigate(1)"
                           aria-label="Next page">
                           <i class="fas fa-arrow-right" aria-hidden="true"></i>
                        </a>`;
        } else {
            navHtml += `<span class="noactived next" aria-disabled="true">
                           <i class="fas fa-arrow-right" aria-hidden="true"></i>
                        </span>`;
        }
        
        // Home button
        navHtml += `<a href="javascript:void(0);" 
                       class="home" 
                       onclick="BloggerSitemap.navigate(0)"
                       aria-label="First page">
                       <i class="fas fa-home" aria-hidden="true"></i>
                    </a>`;
        
        nav.innerHTML = navHtml;
        navContainer.innerHTML = '';
        navContainer.appendChild(nav);
    }
    
    /**
     * Load feed data with error handling
     */
    function loadFeed(params) {
        // Show loading state
        const container = document.getElementById('recentpostsae');
        const navContainer = document.getElementById('recentpostnavfeed');
        
        if (container) {
            container.innerHTML = '<div id="recentpostload" aria-live="polite" aria-label="Loading posts"></div>';
        }
        if (navContainer) {
            navContainer.innerHTML = '';
        }
        
        // Remove previous script if exists
        if (state.currentScript) {
            state.currentScript.remove();
            state.currentScript = null;
        }
        
        // Build URL
        const url = `${config.blogUrl}/feeds/posts/default${params}&callback=BloggerSitemap.handleData`;
        
        // Create and load script
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;
        script.id = 'sitemap-feed-script';
        script.onerror = function() {
            if (container) {
                container.innerHTML = '<div class="error">Failed to load posts. Please try again.</div>';
            }
        };
        
        state.currentScript = script;
        document.head.appendChild(script);
    }
    
    /**
     * Navigation handler
     */
    function navigate(direction) {
        let params = '';
        
        if (direction === -1 && state.urlPrevious) {
            const index = state.urlPrevious.indexOf('?');
            params = state.urlPrevious.substring(index);
        } else if (direction === 1 && state.urlNext) {
            const index = state.urlNext.indexOf('?');
            params = state.urlNext.substring(index);
        } else {
            params = `?start-index=${config.startIndex}&max-results=${config.numPosts}&orderby=published&alt=json-in-script`;
        }
        
        loadFeed(params);
    }
    
    /**
     * Initialize sitemap
     */
    function init() {
        // Check if containers exist
        const container = document.getElementById('recentpostsae');
        const navContainer = document.getElementById('recentpostnavfeed');
        
        if (!container || !navContainer) {
            console.error('Sitemap containers not found');
            return;
        }
        
        // Start loading
        navigate(0);
    }
    
    // Public API
    window.BloggerSitemap = {
        init: init,
        navigate: navigate,
        handleData: renderPosts,
        config: config // Allow runtime configuration
    };
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
