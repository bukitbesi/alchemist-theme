/**
 * Optimized Blogger Sitemap with Thumbnails
 * Version: 2.0
 * Features: Vanilla JS, SEO Optimized, Schema.org Support, Performance Optimized
 */

(function() {
    'use strict';
    
    // Configuration
    const config = {
        numfeed: 18,
        startfeed: 0,
        urlblog: "https://bukitbesi.blogspot.com/",
        charac: 0,
        defaultThumb: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjhu_1tNK6stn8njZTiqOyJoK83q2bAIu9wlUGQ9k4KeIvMm26jqiTi5GHPY-uynpKkTQ6bLhWDZSXv1Nof4VRA7qasG1O29zFNjLhQ4oQgpZO2Kml7klSCpRp4MDuermU4Twrz9Lco05Bv/s1600/no-image.png",
        loadingGif: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhzZyAHdLYscDdye1hvM4uiTcvKO9KaklJPy-kU37jrfKm3JnOp45vq2nl-NSuqNKTlydEYwWbB2b3mGHTktavqTpyZUJE7TX11qe4LyUtrZUH6HWviyEl90jjYIQQUagABtv7p4kURFjNp/s1600/ellipsis-preloader.gif"
    };
    
    // State management
    let state = {
        urlprevious: "",
        urlnext: "",
        currentScript: null
    };
    
    /**
     * Strip HTML tags and truncate text
     * @param {string} html - HTML content
     * @param {number} maxLength - Maximum character length
     * @returns {string} Plain text truncated to maxLength
     */
    function stripHtml(html, maxLength) {
        const tmp = document.createElement("div");
        tmp.innerHTML = html;
        let text = tmp.textContent || tmp.innerText || "";
        return maxLength > 0 ? text.substring(0, maxLength - 1) : text;
    }
    
    /**
     * Get optimized thumbnail URL
     * @param {string} url - Original thumbnail URL
     * @returns {string} Optimized thumbnail URL
     */
    function getOptimizedThumb(url) {
        if (!url) return config.defaultThumb;
        
        // Replace with optimized size for better performance
        return url.replace(/\/s\d+(-c)?\//, '/s72-c/');
    }
    
    /**
     * Create Schema.org JSON-LD for blog posting
     * @param {Array} entries - Blog post entries
     * @returns {object} Schema.org structured data
     */
    function createSchemaData(entries) {
        const schema = {
            "@context": "https://schema.org",
            "@type": "Blog",
            "url": config.urlblog,
            "blogPost": entries.map(entry => ({
                "@type": "BlogPosting",
                "headline": entry.title,
                "url": entry.url,
                "thumbnailUrl": entry.thumbnail,
                "description": entry.summary
            }))
        };
        
        return schema;
    }
    
    /**
     * Inject Schema.org data into page
     * @param {object} schemaData - Schema.org structured data
     */
    function injectSchema(schemaData) {
        // Remove existing schema if any
        const existingSchema = document.getElementById('sitemap-schema');
        if (existingSchema) {
            existingSchema.remove();
        }
        
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'sitemap-schema';
        script.textContent = JSON.stringify(schemaData);
        document.head.appendChild(script);
    }
    
    /**
     * Create post element with lazy loading
     * @param {object} post - Post data
     * @returns {string} HTML string for post element
     */
    function createPostElement(post) {
        return `
            <div class='recentpostel'>
                <a href='${post.url}' title='${post.title}'>
                    <img src='${post.thumbnail}' 
                         alt='${post.title}' 
                         loading='lazy'
                         width='72' 
                         height='72' />
                </a>
                <h6><a href='${post.url}' title='${post.title}'>${post.title}</a></h6>
                <p>${post.summary}</p>
            </div>
        `;
    }
    
    /**
     * Process feed data and render posts
     * @param {object} json - Blogger feed JSON response
     */
    function processFeed(json) {
        // Clear navigation URLs
        state.urlprevious = "";
        state.urlnext = "";
        
        // Extract navigation links
        if (json.feed.link) {
            json.feed.link.forEach(link => {
                if (link.rel === "previous") state.urlprevious = link.href;
                if (link.rel === "next") state.urlnext = link.href;
            });
        }
        
        // Process entries
        const posts = [];
        const entries = json.feed.entry || [];
        const maxPosts = Math.min(config.numfeed, entries.length);
        
        for (let i = 0; i < maxPosts; i++) {
            const entry = entries[i];
            const post = {
                title: entry.title.$t,
                url: "",
                summary: "",
                thumbnail: config.defaultThumb
            };
            
            // Get post URL
            if (entry.link) {
                for (let j = 0; j < entry.link.length; j++) {
                    if (entry.link[j].rel === "alternate") {
                        post.url = entry.link[j].href;
                        break;
                    }
                }
            }
            
            // Get summary
            if (entry.content) {
                post.summary = stripHtml(entry.content.$t, config.charac);
            } else if (entry.summary) {
                post.summary = stripHtml(entry.summary.$t, config.charac);
            }
            
            // Get thumbnail
            if (entry.media$thumbnail) {
                post.thumbnail = getOptimizedThumb(entry.media$thumbnail.url);
            }
            
            posts.push(post);
        }
        
        // Render posts
        renderPosts(posts);
        
        // Render navigation
        renderNavigation();
        
        // Inject Schema.org data
        injectSchema(createSchemaData(posts));
    }
    
    /**
     * Render posts to DOM
     * @param {Array} posts - Array of post objects
     */
    function renderPosts(posts) {
        const container = document.getElementById("recentpostsae");
        if (!container) return;
        
        const html = posts.map(post => createPostElement(post)).join('');
        container.innerHTML = html;
        
        // Trigger layout after render
        requestAnimationFrame(() => {
            container.style.opacity = '1';
        });
    }
    
    /**
     * Render navigation buttons
     */
    function renderNavigation() {
        const navContainer = document.getElementById("recentpostnavfeed");
        if (!navContainer) return;
        
        let navHtml = "";
        
        // Previous button
        if (state.urlprevious) {
            navHtml += `<a href='javascript:void(0);' class='previous' onclick='BloggerSitemap.navigate(-1);' aria-label='Previous page'>
                <i class='fas fa-arrow-left' aria-hidden='true'></i>
            </a>`;
        } else {
            navHtml += `<span class='noactived previous' aria-disabled='true'>
                <i class='fas fa-arrow-left' aria-hidden='true'></i>
            </span>`;
        }
        
        // Next button
        if (state.urlnext) {
            navHtml += `<a href='javascript:void(0);' class='next' onclick='BloggerSitemap.navigate(1);' aria-label='Next page'>
                <i class='fas fa-arrow-right' aria-hidden='true'></i>
            </a>`;
        } else {
            navHtml += `<span class='noactived next' aria-disabled='true'>
                <i class='fas fa-arrow-right' aria-hidden='true'></i>
            </span>`;
        }
        
        // Home button
        navHtml += `<a href='javascript:void(0);' class='home' onclick='BloggerSitemap.navigate(0);' aria-label='First page'>
            <i class='fas fa-home' aria-hidden='true'></i>
        </a>`;
        
        navContainer.innerHTML = navHtml;
    }
    
    /**
     * Show loading state
     */
    function showLoading() {
        const postsContainer = document.getElementById("recentpostsae");
        const navContainer = document.getElementById("recentpostnavfeed");
        
        if (postsContainer) {
            postsContainer.style.opacity = '0.5';
            postsContainer.innerHTML = `<div id='recentpostload' style='background-image: url(${config.loadingGif})'></div>`;
        }
        
        if (navContainer) {
            navContainer.innerHTML = "";
        }
    }
    
    /**
     * Navigate to different page
     * @param {number} direction - -1 for previous, 1 for next, 0 for home
     */
    function navigate(direction) {
        let queryString;
        
        if (direction === -1 && state.urlprevious) {
            const idx = state.urlprevious.indexOf("?");
            queryString = state.urlprevious.substring(idx);
        } else if (direction === 1 && state.urlnext) {
            const idx = state.urlnext.indexOf("?");
            queryString = state.urlnext.substring(idx);
        } else {
            queryString = `?start-index=1&max-results=${config.numfeed}&orderby=published&alt=json-in-script`;
        }
        
        queryString += "&callback=BloggerSitemap.processFeed";
        loadFeed(queryString);
    }
    
    /**
     * Load feed data via JSONP
     * @param {string} queryString - Query parameters for feed
     */
    function loadFeed(queryString) {
        // Show loading state
        showLoading();
        
        // Remove existing script if any
        if (state.currentScript) {
            state.currentScript.remove();
            state.currentScript = null;
        }
        
        // Create new script element
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.src = `${config.urlblog}feeds/posts/default${queryString}`;
        script.id = "galihlabel";
        script.onerror = function() {
            console.error("Failed to load feed");
            const container = document.getElementById("recentpostsae");
            if (container) {
                container.innerHTML = "<p>Error loading posts. Please try again.</p>";
            }
        };
        
        // Add script to document
        document.head.appendChild(script);
        state.currentScript = script;
    }
    
    /**
     * Initialize sitemap
     */
    function init() {
        // Check if containers exist
        const postsContainer = document.getElementById("recentpostsae");
        const navContainer = document.getElementById("recentpostnavfeed");
        
        if (!postsContainer || !navContainer) {
            console.error("Sitemap containers not found");
            return;
        }
        
        // Start loading first page
        navigate(0);
    }
    
    // Public API
    window.BloggerSitemap = {
        init: init,
        navigate: navigate,
        processFeed: processFeed
    };
    
    // Auto-initialize when DOM is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
