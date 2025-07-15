/**
 * @name    Blogger User Sitemap with Thumbnails
 * @author  The Bukit Besi
 * @version 2.0
 * @file    blogger-sitemap-v2.js
 * @description Recreates a Blogger sitemap with thumbnails, navigation, and SEO enhancements.
 *              Uses modern Vanilla JS, fetch API, and robust thumbnail extraction.
 */

// Self-invoking function to avoid polluting the global namespace
(function() {
    // --- Configuration ---
    const config = {
        blogUrl: "https://bukitbesi.blogspot.com", // Your Blog's URL
        postsPerPage: 18, // Number of posts to show per page
        noImageUrl: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjhu_1tNK6stn8njZTiqOyJoK83q2bAIu9wlUGQ9k4KeIvMm26jqiTi5GHPY-uynpKkTQ6bLhWDZSXv1Nof4VRA7qasG1O29zFNjLhQ4oQgpZO2Kml7klSCpRp4MDuermU4Twrz9Lco05Bv/s1600/no-image.png",
        imageSize: 72, // The size of the thumbnail in pixels (e.g., 72 for 72x72)
        containerId: "recentpostsae",
        navId: "recentpostnavfeed",
        loaderHtml: '<div id="recentpostload"></div>'
    };

    // --- DOM Elements ---
    const postContainer = document.getElementById(config.containerId);
    const navContainer = document.getElementById(config.navId);

    // --- State Management ---
    let navUrls = {
        next: null,
        previous: null
    };

    /**
     * A robust function to extract a post's thumbnail.
     * It tries three methods in order:
     * 1. Check for the modern 'media$thumbnail' object.
     * 2. If not found, parse the post content to find the first image.
     * 3. If no image is found, return a default placeholder image.
     * @param {object} entry - The post entry object from the Blogger JSON feed.
     * @returns {string} The URL of the thumbnail image.
     */
    function getThumbnailUrl(entry) {
        // Method 1: Check for media$thumbnail (still works sometimes)
        if (entry.media$thumbnail && entry.media$thumbnail.url) {
            // Blogger Image URL trick: resize for performance and consistency
            return entry.media$thumbnail.url.replace(/\/s\d+(-c)?\//, `/w${config.imageSize}-h${config.imageSize}-c/`);
        }
        
        // Method 2: Parse the content for the first image
        const content = entry.content ? entry.content.$t : (entry.summary ? entry.summary.$t : '');
        if (content) {
            const match = content.match(/<img[^>]+src="([^">]+)"/);
            if (match && match[1]) {
                 // Apply the same resizing trick
                return match[1].replace(/\/s\d+(-c)?\//, `/w${config.imageSize}-h${config.imageSize}-c/`);
            }
        }
        
        // Method 3: Fallback to a default image
        return config.noImageUrl;
    }

    /**
     * Renders the list of posts into the container.
     * @param {Array} entries - An array of post entry objects.
     */
    function renderPosts(entries) {
        if (!entries || entries.length === 0) {
            postContainer.innerHTML = "<p>No posts found.</p>";
            return;
        }

        let html = '';
        entries.forEach(entry => {
            const title = entry.title.$t;
            const link = entry.link.find(l => l.rel === 'alternate').href;
            const thumbnailUrl = getThumbnailUrl(entry);

            html += `
                <div class='recentpostel'>
                    <a href='${link}'>
                        <img src='${thumbnailUrl}' alt='${title}' width='${config.imageSize}' height='${config.imageSize}' loading='lazy' />
                    </a>
                    <h6><a href='${link}'>${title}</a></h6>
                    <p></p> <!-- The original had an empty P tag, preserved for style consistency -->
                </div>
            `;
        });
        postContainer.innerHTML = html;
    }

    /**
     * Renders the navigation buttons (Previous, Next, Home).
     */
    function renderNavigation() {
        let html = '';
        // Previous Button
        html += navUrls.previous ?
            `<a href="#" data-nav-url="${navUrls.previous}" class="previous"><i class="fas fa-arrow-left"></i></a>` :
            `<span class="noactived previous"><i class="fas fa-arrow-left"></i></span>`;

        // Next Button
        html += navUrls.next ?
            `<a href="#" data-nav-url="${navUrls.next}" class="next"><i class="fas fa-arrow-right"></i></a>` :
            `<span class="noactived next"><i class="fas fa-arrow-right"></i></span>`;
            
        // Home Button
        html += `<a href="#" data-nav-url="home" class="home"><i class="fas fa-home"></i></a>`;
        
        navContainer.innerHTML = html;
    }

    /**
     * Creates and injects the JSON-LD Schema for SEO.
     * @param {Array} entries - The array of post entries for the current page.
     */
    function injectSchema(entries) {
        // Remove any existing schema script for this widget
        const existingSchema = document.getElementById('sitemap-schema');
        if (existingSchema) {
            existingSchema.remove();
        }

        if (!entries || entries.length === 0) return;

        const schema = {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Sitemap - " + document.title,
            "description": "A list of all posts available on the site.",
            "url": window.location.href,
            "mainEntity": {
                "@type": "ItemList",
                "itemListElement": entries.map((entry, index) => ({
                    "@type": "ListItem",
                    "position": index + 1,
                    "name": entry.title.$t,
                    "url": entry.link.find(l => l.rel === 'alternate').href
                }))
            }
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'sitemap-schema';
        script.textContent = JSON.stringify(schema);
        document.head.appendChild(script);
    }
    
    /**
     * Fetches post data from the Blogger JSON API.
     * @param {string} url - The API URL to fetch.
     */
    async function fetchAndDisplayPosts(url) {
        // Show loader
        postContainer.innerHTML = config.loaderHtml;
        navContainer.innerHTML = '';

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            const entries = data.feed.entry || [];
            
            // Update navigation URLs from the feed link relations
            navUrls.next = data.feed.link.find(l => l.rel === 'next')?.href || null;
            navUrls.previous = data.feed.link.find(l => l.rel === 'previous')?.href || null;

            // Render the content
            renderPosts(entries);
            renderNavigation();
            injectSchema(entries);

        } catch (error) {
            console.error("Failed to fetch sitemap posts:", error);
            postContainer.innerHTML = "<p>Error loading posts. Please try again later.</p>";
        }
    }

    /**
     * Handles navigation clicks.
     * @param {Event} e - The click event.
     */
    function handleNavigation(e) {
        e.preventDefault();
        const target = e.target.closest('a[data-nav-url]');
        if (!target) return;

        const navUrl = target.dataset.navUrl;
        let fetchUrl;

        if (navUrl === 'home') {
            fetchUrl = `${config.blogUrl}/feeds/posts/default?alt=json&max-results=${config.postsPerPage}&start-index=1`;
        } else {
            // The provided URLs are for the HTML view. We need to convert them to API URLs.
            // Example: https://bukitbesi.blogspot.com/search?updated-max=...&max-results=18
            // Becomes: https://bukitbesi.blogspot.com/feeds/posts/default?alt=json&...
            const params = new URL(navUrl).search; // Gets "?updated-max=...&max-results=18"
            fetchUrl = `${config.blogUrl}/feeds/posts/default${params}&alt=json`;
        }
        
        fetchAndDisplayPosts(fetchUrl);
    }
    
    /**
     * Initializes the sitemap widget.
     */
    function initSitemap() {
        if (!postContainer || !navContainer) {
            console.error("Sitemap container or navigation element not found. Aborting.");
            return;
        }

        // Add event listener to the navigation container for delegation
        navContainer.addEventListener('click', handleNavigation);

        // Initial load
        const initialUrl = `${config.blogUrl}/feeds/posts/default?alt=json&max-results=${config.postsPerPage}&start-index=1`;
        fetchAndDisplayPosts(initialUrl);
    }
    
    // Start the script once the DOM is fully loaded
    document.addEventListener('DOMContentLoaded', initSitemap);

})();
