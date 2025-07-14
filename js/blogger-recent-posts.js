    /**
     * @name   Enhanced Recent Posts Widget for Blogger
     * @version 2.1.0 (Vanilla JS Version)
     * @author TBB
     * @description A modern, SEO-optimized, and performance-focused recent posts widget using vanilla JavaScript.
     * Features: JSON-LD Schema for SEO, lazy loading, semantic HTML, and easy configuration.
     * No jQuery or AI features.
     */
    document.addEventListener('DOMContentLoaded', () => {

        // --- Configuration Object ---
        const config = {
            blogURL: 'https://bukitbesi.blogspot.com', // **IMPORTANT: Change to your blog's URL**
            containerId: 'recent-posts-target',
            schemaContainerId: 'posts-schema',
            numPosts: 5,
            showThumbnails: true,
            thumbnailSize: 200,
            showSummary: true,
            summaryLength: 100,
            showDate: true,
            showComments: true,
            showReadMore: true,
            readMoreText: 'Read More',
            noThumbnailImage: 'https://placehold.co/200x200/EFEFEF/AAAAAA?text=No+Image',
            monthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        };

        const container = document.getElementById(config.containerId);
        if (!container) {
            console.error(`Error: Container with ID '${config.containerId}' not found.`);
            return;
        }

        // --- Main Function to Fetch and Render Posts ---
        async function fetchRecentPosts() {
            const feedURL = `${config.blogURL.replace(/\/+$/, '')}/feeds/posts/default?alt=json-in-script&max-results=${config.numPosts}&callback=renderPosts`;
            const script = document.createElement('script');
            script.src = feedURL;
            script.onerror = handleInstallError;
            document.body.appendChild(script);
        }

        // --- Global Callback Function ---
        window.renderPosts = (json) => {
            try {
                if (!json || !json.feed || !json.feed.entry || json.feed.entry.length === 0) {
                    displayError("No posts found or the feed is empty.");
                    return;
                }
                const posts = json.feed.entry;
                const postList = document.createElement('ul');
                postList.className = 'post-list';
                
                const schemaData = { "@context": "https://schema.org", "@graph": [] };

                posts.forEach(post => {
                    const postElement = createPostElement(post);
                    postList.appendChild(postElement);
                    const postSchema = createPostSchema(post);
                    if (postSchema) schemaData["@graph"].push(postSchema);
                });

                container.innerHTML = '';
                container.appendChild(postList);
                
                const schemaContainer = document.getElementById(config.schemaContainerId);
                if (schemaContainer) {
                    schemaContainer.textContent = JSON.stringify(schemaData, null, 2);
                }
            } catch (error) {
                console.error("Error rendering posts:", error);
                displayError("An unexpected error occurred while displaying posts.");
            }
            // Clean up the script tag
            document.querySelectorAll(`script[src*="/feeds/posts/default"]`).forEach(s => s.remove());
        };

        // --- Create HTML for a Single Post ---
        function createPostElement(post) {
            const entry = {
                title: post.title.$t,
                url: post.link.find(link => link.rel === 'alternate').href,
                published: new Date(post.published.$t),
                summary: ("summary" in post) ? post.summary.$t.replace(/<.*?>/g, "") : "",
                thumbnail: ("media$thumbnail" in post) ? post.media$thumbnail.url : config.noThumbnailImage,
                comments: ("thr$total" in post) ? post.thr$total.$t : "0"
            };
            const listItem = document.createElement('li');
            listItem.className = 'post-item';
            let postHTML = '';
            
            if (config.showThumbnails) {
                const resizedThumb = entry.thumbnail.replace(/\/s\d+(-c)?\//, `/s${config.thumbnailSize}-c/`);
                postHTML += `<a href="${entry.url}" class="post-thumbnail-link"><img src="${resizedThumb}" alt="Thumbnail for ${entry.title}" class="post-thumbnail" loading="lazy" width="${config.thumbnailSize}" height="${config.thumbnailSize}" onerror="this.onerror=null;this.src='${config.noThumbnailImage}';"></a>`;
            }
            
            postHTML += '<div class="post-content">';
            postHTML += `<h3 class="post-title"><a href="${entry.url}">${entry.title}</a></h3>`;
            
            if (config.showSummary && entry.summary) {
                const shortSummary = entry.summary.substring(0, config.summaryLength) + (entry.summary.length > config.summaryLength ? '...' : '');
                postHTML += `<p class="post-summary">${shortSummary}</p>`;
            }
            
            postHTML += '<div class="post-meta">';
            if (config.showDate) {
                const formattedDate = `${config.monthNames[entry.published.getMonth()]} ${entry.published.getDate()}, ${entry.published.getFullYear()}`;
                postHTML += `<span class="post-date"><time datetime="${entry.published.toISOString()}">${formattedDate}</time></span>`;
            }
            if (config.showComments) {
                const commentText = entry.comments === '1' ? '1 Comment' : `${entry.comments} Comments`;
                postHTML += `<span class="post-comments">${commentText}</span>`;
            }
            if (config.showReadMore) {
                postHTML += `<a href="${entry.url}" class="post-read-more">${config.readMoreText}</a>`;
            }
            postHTML += '</div></div>'; // End .post-meta and .post-content
            
            listItem.innerHTML = postHTML;
            return listItem;
        }
        
        // --- Create JSON-LD Schema for a Single Post ---
        function createPostSchema(post) {
            try {
                 const entry = {
                    title: post.title.$t,
                    url: post.link.find(link => link.rel === 'alternate').href,
                    published: post.published.$t,
                    updated: post.updated.$t,
                    authorName: post.author[0].name.$t,
                    summary: ("summary" in post) ? post.summary.$t.replace(/<.*?>/g, "").substring(0, 150) : "",
                    thumbnail: ("media$thumbnail" in post) ? post.media$thumbnail.url.replace(/\/s\d+(-c)?\//, '/s1200/') : config.noThumbnailImage
                };
                return { "@type": "BlogPosting", "mainEntityOfPage": { "@type": "WebPage", "@id": entry.url }, "headline": entry.title, "image": entry.thumbnail, "datePublished": entry.published, "dateModified": entry.updated, "author": { "@type": "Person", "name": entry.authorName }, "publisher": { "@type": "Organization", "name": document.title, "logo": { "@type": "ImageObject", "url": "https://placehold.co/600x60/CCCCCC/FFFFFF?text=Your+Logo" } }, "description": entry.summary };
            } catch(e) {
                console.warn("Could not generate schema for a post.", e);
                return null;
            }
        }

        // --- Error Handling ---
        function handleInstallError() {
            displayError("Installation Error: Could not fetch recent posts. Please check the 'blogURL' in the configuration and ensure the blog is public.");
        }

        function displayError(message) {
            container.innerHTML = `<div class="error-message">${message}</div>`;
        }

        // --- Initialize the Widget ---
        fetchRecentPosts();
    });
