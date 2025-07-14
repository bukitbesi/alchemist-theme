/**
 * Blogger Recent Posts Widget
 * Vanilla JavaScript implementation for GitHub hosting
 * Preserves all original Blogger widget functionality
 */

// Configuration object for better organization
const RecentPostsConfig = {
    numPosts: 5,
    showThumbnails: true,
    displayMore: false,
    displaySeparator: false,
    showCommentNum: false,
    showPostDate: false,
    showPostSummary: false,
    numChars: 62,
    defaultThumbnail: 'https://2.bp.blogspot.com/-Q6S8qhkE33I/V0VwhvhULoI/AAAAAAAAHfQ/VZkkOgl_wX4X59EP31Jpl1swFsj6-n0TQCLcB/s1600/InfoArlina.png'
};

/**
 * Main function to render recent posts from Blogger feed
 * This function is called by the Blogger feed API callback
 * @param {Object} json - The JSON feed data from Blogger
 */
function renderRecentPosts(json) {
    // Create container
    let html = '<ul class="recent_posts_arlina">';
    
    const feed = json.feed;
    const entries = feed.entry || [];
    const postsToShow = Math.min(RecentPostsConfig.numPosts, entries.length);
    
    // Month names for date formatting
    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Process each post
    for (let i = 0; i < postsToShow; i++) {
        const entry = entries[i];
        const title = entry.title.$t;
        let postUrl = '';
        let commentUrl = '';
        let commentCount = '0 Comments';
        
        // Extract URLs and comment info from links
        if (entry.link) {
            for (let j = 0; j < entry.link.length; j++) {
                const link = entry.link[j];
                
                if (link.rel === 'alternate') {
                    postUrl = link.href;
                }
                
                if (link.rel === 'replies' && link.type === 'text/html') {
                    commentCount = link.title;
                    commentUrl = link.href;
                }
            }
        }
        
        // Extract thumbnail
        let thumbnailUrl = RecentPostsConfig.defaultThumbnail;
        
        try {
            // Try to get thumbnail from media
            if (entry.media$thumbnail) {
                thumbnailUrl = entry.media$thumbnail.url;
            }
        } catch (error) {
            // Fallback: Extract image from content
            const content = entry.content ? entry.content.$t : '';
            const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/);
            
            if (imgMatch && imgMatch[1]) {
                thumbnailUrl = imgMatch[1];
            }
        }
        
        // Format publish date
        const publishedDate = entry.published.$t;
        const year = publishedDate.substring(0, 4);
        const month = publishedDate.substring(5, 7);
        const day = publishedDate.substring(8, 10);
        
        // Start building post HTML
        html += '<li class="clearfix">';
        
        // Add thumbnail if enabled
        if (RecentPostsConfig.showThumbnails) {
            html += `<span class="wrapinfo">
                        <img class="recent_thumb" src="${thumbnailUrl}" alt="${title}"/>
                     </span>`;
        }
        
        // Add post title with link
        html += `<b><a href="${postUrl}" target="_top">${title}</a></b><br>`;
        
        // Add post summary if enabled
        if (RecentPostsConfig.showPostSummary) {
            let summary = '';
            
            if (entry.content) {
                summary = entry.content.$t;
            } else if (entry.summary) {
                summary = entry.summary.$t;
            }
            
            // Remove HTML tags
            summary = summary.replace(/<[^>]*>/g, '');
            
            // Truncate if needed
            if (summary.length > RecentPostsConfig.numChars) {
                summary = summary.substring(0, RecentPostsConfig.numChars);
                const lastSpace = summary.lastIndexOf(' ');
                if (lastSpace > 0) {
                    summary = summary.substring(0, lastSpace);
                }
                summary += '...';
            }
            
            if (summary) {
                html += `<i>${summary}</i>`;
            }
        }
        
        // Build metadata line
        let metadata = '';
        let hasMetadata = false;
        
        html += '<br>';
        
        // Add post date if enabled
        if (RecentPostsConfig.showPostDate) {
            metadata += `${monthNames[parseInt(month, 10)]}-${day} - ${year}`;
            hasMetadata = true;
        }
        
        // Add comment count if enabled
        if (RecentPostsConfig.showCommentNum) {
            if (hasMetadata) metadata += ' | ';
            
            // Format comment text
            if (commentCount === '1 Comments') {
                commentCount = '1 Comment';
            } else if (commentCount === '0 Comments') {
                commentCount = 'No Comments';
            }
            
            metadata += `<a href="${commentUrl}" target="_top">${commentCount}</a>`;
            hasMetadata = true;
        }
        
        // Add "More" link if enabled
        if (RecentPostsConfig.displayMore) {
            if (hasMetadata) metadata += ' | ';
            metadata += `<a href="${postUrl}" class="url" target="_top">More -></a>`;
            hasMetadata = true;
        }
        
        html += metadata;
        html += '</li>';
        
        // Add separator if enabled and not last post
        if (RecentPostsConfig.displaySeparator && i < postsToShow - 1) {
            html += '<hr size="0.5">';
        }
    }
    
    html += '</ul>';
    
    // Write the HTML to the document
    document.write(html);
}

/**
 * Initialize the widget
 * This function sets up the configuration and loads the Blogger feed
 */
function initRecentPostsWidget(config = {}) {
    // Override default config with user settings
    Object.assign(RecentPostsConfig, config);
    
    // Map old variable names to new config (for backward compatibility)
    if (typeof numPosts !== 'undefined') RecentPostsConfig.numPosts = numPosts;
    if (typeof showThumbnails !== 'undefined') RecentPostsConfig.showThumbnails = showThumbnails;
    if (typeof displayMore !== 'undefined') RecentPostsConfig.displayMore = displayMore;
    if (typeof displaySeparator !== 'undefined') RecentPostsConfig.displaySeparator = displaySeparator;
    if (typeof showCommentNum !== 'undefined') RecentPostsConfig.showCommentNum = showCommentNum;
    if (typeof showPostDate !== 'undefined') RecentPostsConfig.showPostDate = showPostDate;
    if (typeof showPostSummary !== 'undefined') RecentPostsConfig.showPostSummary = showPostSummary;
    if (typeof numChars !== 'undefined') RecentPostsConfig.numChars = numChars;
    
    // Load the Blogger feed
    const script = document.createElement('script');
    script.src = '/feeds/posts/default?orderby=published&alt=json-in-script&callback=renderRecentPosts';
    script.async = true;
    document.body.appendChild(script);
}

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initRecentPostsWidget());
} else {
    initRecentPostsWidget();
}
