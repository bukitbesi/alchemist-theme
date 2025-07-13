// Alchemist V1 Theme Scripts //

(function () {
  "use strict";

  // Utility Functions
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);

  // Debounce function for performance
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Lazy Load Images
  function lazyLoadImages() {
    const images = $$("img[data-src]");
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute("data-src");
          img.classList.add("loaded");
          observer.unobserve(img);
        }
      });
    });

    images.forEach((img) => imageObserver.observe(img));
  }

  // Enhanced Breaking News Ticker
  class BreakingNewsTicker {
    constructor() {
      this.container = $("#breakingNewsItems");
      this.posts = [];
      this.currentIndex = 0;
      this.init();
    }

    async init() {
      if (!this.container) return;

      try {
        const response = await fetch(
          "/feeds/posts/default?alt=json&max-results=10"
        );
        const data = await response.json();

        if (data.feed && data.feed.entry) {
          this.posts = data.feed.entry.map((post) => ({
            title: post.title.$t,
            url: post.link.find((link) => link.rel === "alternate").href,
          }));

          this.createTicker();
          this.startRotation();
        }
      } catch (error) {
        console.error("Failed to load breaking news:", error);
      }
    }

    createTicker() {
      const html = this.posts
        .map(
          (post, index) =>
            `<a href="${post.url}" class="news-item ${
              index === 0 ? "active" : ""
            }">${post.title}</a>`
        )
        .join("");

      this.container.innerHTML = html;
    }

    startRotation() {
      setInterval(() => {
        const items = $$(".news-item");
        items[this.currentIndex].classList.remove("active");
        this.currentIndex = (this.currentIndex + 1) % this.posts.length;
        items[this.currentIndex].classList.add("active");
      }, 5000);
    }
  }

  // Advanced TOC with Progress Indicator
  class TableOfContents {
    constructor() {
      this.postBody = $("#postBody");
      this.tocContainer = $("#autoTOC");
      this.tocList = $("#tocList");
      this.headings = [];
      this.init();
    }

    init() {
      if (!this.postBody || !this.tocContainer) return;

      this.headings = this.postBody.querySelectorAll("h2, h3");

      if (this.headings.length < 3) {
        this.tocContainer.style.display = "none";
        return;
      }

      this.generateTOC();
      this.addProgressIndicator();
      this.setupScrollSpy();
    }

    generateTOC() {
      const fragment = document.createDocumentFragment();

      this.headings.forEach((heading, index) => {
        const id = `heading-${index}`;
        heading.id = id;

        const li = document.createElement("li");
        const a = document.createElement("a");

        a.href = `#${id}`;
        a.textContent = heading.textContent;
        a.className = heading.tagName.toLowerCase();

        // Smooth scroll
        a.addEventListener("click", (e) => {
          e.preventDefault();
          heading.scrollIntoView({ behavior: "smooth", block: "start" });
        });

        li.appendChild(a);
        fragment.appendChild(li);
      });

      this.tocList.appendChild(fragment);
      this.tocContainer.classList.remove("hidden");
    }

    addProgressIndicator() {
      const progress = document.createElement("div");
      progress.className = "toc-progress";
      progress.innerHTML = '<div class="toc-progress-bar"></div>';
      this.tocContainer.insertBefore(progress, this.tocContainer.firstChild);
    }

    setupScrollSpy() {
      const tocLinks = this.tocList.querySelectorAll("a");
      const progressBar = $(".toc-progress-bar");

      const updateActiveLink = debounce(() => {
        const scrollPos = window.scrollY + 100;
        const docHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (window.scrollY / docHeight) * 100;

        if (progressBar) {
          progressBar.style.width = `${scrollPercent}%`;
        }

        let activeFound = false;

        for (let i = this.headings.length - 1; i >= 0; i--) {
          if (this.headings[i].offsetTop <= scrollPos) {
            tocLinks.forEach((link) => link.classList.remove("active"));
            tocLinks[i].classList.add("active");
            activeFound = true;
            break;
          }
        }

        if (!activeFound && tocLinks.length > 0) {
          tocLinks.forEach((link) => link.classList.remove("active"));
          tocLinks[0].classList.add("active");
        }
      }, 10);

      window.addEventListener("scroll", updateActiveLink);
      updateActiveLink();
    }
  }

  // Smart Content Parser - Fixes old content formatting
  class ContentParser {
    constructor() {
      this.postBody = $("#postBody");
      this.init();
    }

    init() {
      if (!this.postBody) return;

      this.fixBrTags();
      this.enhanceImages();
      this.createButtons();
      this.enhanceTables();
    }

    fixBrTags() {
      let content = this.postBody.innerHTML;

      // Only process if no paragraphs exist
      if (!content.includes("<p>") && content.includes("<br")) {
        // Replace double BR with paragraph breaks
        content = content.replace(/<br\s*\/?>\s*<br\s*\/?>/gi, "</p><p>");

        // Wrap content in paragraphs
        if (!content.startsWith("<p>")) {
          content = "<p>" + content;
        }
        if (!content.endsWith("</p>")) {
          content = content + "</p>";
        }

        // Clean up empty paragraphs
        content = content.replace(/<p>\s*<\/p>/g, "");

        this.postBody.innerHTML = content;
      }
    }

    enhanceImages() {
      const images = this.postBody.querySelectorAll("img");

      images.forEach((img) => {
        // Add loading lazy attribute
        img.loading = "lazy";

        // Wrap in figure if not already
        if (img.parentElement.tagName !== "FIGURE") {
          const figure = document.createElement("figure");
          const caption = img.alt ? `<figcaption>${img.alt}</figcaption>` : "";

          img.parentElement.insertBefore(figure, img);
          figure.appendChild(img);

          if (caption) {
            figure.insertAdjacentHTML("beforeend", caption);
          }
        }

        // Add click to enlarge
        img.style.cursor = "zoom-in";
        img.addEventListener("click", () =>
          this.showLightbox(img.src, img.alt)
        );
      });
    }

    createButtons() {
      // Find download/demo links and convert to buttons
      const links = this.postBody.querySelectorAll(
        'a[href*="download"], a[href*="demo"]'
      );

      links.forEach((link) => {
        const text = link.textContent.toLowerCase();

        if (
          text.includes("download") &&
          !link.classList.contains("download-button")
        ) {
          link.className = "download-button";
        } else if (
          text.includes("demo") &&
          !link.classList.contains("demo-button")
        ) {
          link.className = "demo-button";
        }
      });
    }

    enhanceTables() {
      const tables = this.postBody.querySelectorAll("table");

      tables.forEach((table) => {
        // Wrap in responsive container
        if (!table.parentElement.classList.contains("table-responsive")) {
          const wrapper = document.createElement("div");
          wrapper.className = "table-responsive";
          table.parentElement.insertBefore(wrapper, table);
          wrapper.appendChild(table);
        }
      });
    }

    showLightbox(src, alt) {
      const lightbox = document.createElement("div");
      lightbox.className = "lightbox";
      lightbox.innerHTML = `
        <div class="lightbox-content">
          <img src="${src}" alt="${alt || ""}">
          <button class="lightbox-close">&times;</button>
        </div>
      `;

      document.body.appendChild(lightbox);

      // Prevent body scroll
      document.body.style.overflow = "hidden";

      // Close handlers
      const close = () => {
        lightbox.remove();
        document.body.style.overflow = "";
      };

      lightbox
        .querySelector(".lightbox-close")
        .addEventListener("click", close);
      lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) close();
      });

      // ESC key to close
      const escHandler = (e) => {
        if (e.key === "Escape") {
          close();
          document.removeEventListener("keydown", escHandler);
        }
      };
      document.addEventListener("keydown", escHandler);
    }
  }

  // Living Post Framework
  class LivingPost {
    constructor() {
      this.init();
    }

    init() {
      this.greetUser();
      this.trackSource();
      this.personalizeContent();
    }

    greetUser() {
      const visits = parseInt(localStorage.getItem("visitCount") || "0");
      localStorage.setItem("visitCount", visits + 1);

      if (visits > 0) {
        const greetings = [
          "Welcome back! 👋",
          "Good to see you again! 🎉",
          "Thanks for returning! 💖",
          "Hey there, friend! 🌟",
        ];

        const greeting =
          greetings[Math.floor(Math.random() * greetings.length)];
        this.showNotification(greeting, "greeting");
      }
    }

    trackSource() {
      const referrer = document.referrer;
      const searchParams = new URLSearchParams(window.location.search);
      const source = searchParams.get("utm_source") || searchParams.get("ref");

      if (source) {
        localStorage.setItem("trafficSource", source);
      } else if (referrer) {
        if (referrer.includes("google")) {
          localStorage.setItem("trafficSource", "google");
        } else if (referrer.includes("facebook")) {
          localStorage.setItem("trafficSource", "facebook");
        } else if (referrer.includes("twitter")) {
          localStorage.setItem("trafficSource", "twitter");
        }
      }
    }

    personalizeContent() {
      const source = localStorage.getItem("trafficSource");
      const postBody = $("#postBody");

      if (source && postBody) {
        // Add personalized message based on source
        const messages = {
          google: "Found us on Google? Don't forget to bookmark!",
          facebook: "Thanks for visiting from Facebook! Share if you enjoyed!",
          twitter: "Welcome from Twitter! Tweet us your thoughts!",
        };

        if (messages[source]) {
          const notice = document.createElement("div");
          notice.className = "personalized-notice";
          notice.textContent = messages[source];
          postBody.insertBefore(notice, postBody.firstChild);
        }
      }
    }

    showNotification(message, type = "info") {
      const notification = document.createElement("div");
      notification.className = `notification notification-${type}`;
      notification.textContent = message;

      document.body.appendChild(notification);

      // Animate in
      setTimeout(() => notification.classList.add("show"), 100);

      // Remove after 3 seconds
      setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }
  }

  // Sentient Schema Engine
  class SchemaGenerator {
    constructor() {
      this.schema = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
      };
      this.init();
    }

    init() {
      if (!document.body.classList.contains("single-post")) return;

      this.generateBasicSchema();
      this.detectVideoContent();
      this.detectFAQContent();
      this.detectHowToContent();
      this.injectSchema();
    }

    generateBasicSchema() {
      const title = $(".post-title");
      const author = $(".post-meta span");
      const datePublished = $('meta[property="article:published_time"]');
      const image = $(".post-body img");

      Object.assign(this.schema, {
        headline: title ? title.textContent : "",
        author: {
          "@type": "Person",
          name: author ? author.textContent.replace("By ", "") : "Bukit Besi",
        },
        datePublished: datePublished
          ? datePublished.content
          : new Date().toISOString(),
        dateModified: new Date().toISOString(),
        publisher: {
          "@type": "Organization",
          name: "Bukit Besi Blog",
          logo: {
            "@type": "ImageObject",
            url: "https://cdn.jsdelivr.net/gh/bukitbesi/the@main/assets/logo.png",
          },
        },
      });

      if (image) {
        this.schema.image = image.src;
      }
    }

    detectVideoContent() {
      const videos = $$(
        '.post-body iframe[src*="youtube"], .post-body iframe[src*="vimeo"]'
      );

      if (videos.length > 0) {
        this.schema.video = videos[0].src
          ? {
              "@type": "VideoObject",
              embedUrl: videos[0].src,
              name: this.schema.headline,
              uploadDate: this.schema.datePublished,
            }
          : undefined;
      }
    }

    detectFAQContent() {
      // Look for FAQ patterns
      const possibleFAQs = $$(".post-body h3");
      const faqItems = [];

      possibleFAQs.forEach((heading) => {
        const text = heading.textContent;
        if (
          text.includes("?") ||
          text.match(/^(what|why|how|when|where|who)/i)
        ) {
          const answer = heading.nextElementSibling;
          if (answer && answer.tagName === "P") {
            faqItems.push({
              "@type": "Question",
              name: text,
              acceptedAnswer: {
                "@type": "Answer",
                text: answer.textContent,
              },
            });
          }
        }
      });

      if (faqItems.length > 2) {
        this.schema["@type"] = ["BlogPosting", "FAQPage"];
        this.schema.mainEntity = faqItems;
      }
    }

    detectHowToContent() {
      const title = $(".post-title");
      if (title && title.textContent.match(/how to|tutorial|guide|step/i)) {
        const steps = $$(".post-body ol li");

        if (steps.length > 2) {
          this.schema["@type"] = ["BlogPosting", "HowTo"];
          this.schema.step = Array.from(steps).map((step, index) => ({
            "@type": "HowToStep",
            position: index + 1,
            name: `Step ${index + 1}`,
            text: step.textContent,
          }));
        }
      }
    }

    injectSchema() {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(this.schema, null, 2);
      document.head.appendChild(script);
    }
  }

  // Interactive Toolkit
  class InteractiveToolkit {
    constructor() {
      this.init();
    }

    init() {
      this.createChecklists();
      this.createCalculators();
      this.createQuizzes();
    }

    createChecklists() {
      const checklistContainers = $$("[data-checklist]");

      checklistContainers.forEach((container) => {
        const items = container.dataset.checklist.split("|");
        const checklist = document.createElement("div");
        checklist.className = "interactive-checklist";

        const savedState = JSON.parse(
          localStorage.getItem("checklist-" + container.id) || "{}"
        );

        items.forEach((item, index) => {
          const id = `check-${container.id}-${index}`;
          const checked = savedState[id] || false;

          const checkItem = document.createElement("div");
          checkItem.className = "checklist-item";
          checkItem.innerHTML = `
            <input type="checkbox" id="${id}" ${checked ? "checked" : ""}>
            <label for="${id}">${item}</label>
          `;

          checklist.appendChild(checkItem);
        });

        container.appendChild(checklist);

        // Save state on change
        checklist.addEventListener("change", () => {
          const state = {};
          checklist.querySelectorAll("input").forEach((input) => {
            state[input.id] = input.checked;
          });
          localStorage.setItem(
            "checklist-" + container.id,
            JSON.stringify(state)
          );
        });
      });
    }

    createCalculators() {
      // Placeholder for calculator functionality
      const calculators = $$("[data-calculator]");

      calculators.forEach((calc) => {
        const type = calc.dataset.calculator;

        switch (type) {
          case "roi":
            this.createROICalculator(calc);
            break;
          case "savings":
            this.createSavingsCalculator(calc);
            break;
        }
      });
    }

    createROICalculator(container) {
      container.innerHTML = `
        <div class="calculator roi-calculator">
          <h3>ROI Calculator</h3>
          <div class="calc-field">
            <label>Initial Investment:</label>
            <input type="number" id="initial-investment" placeholder="1000">
          </div>
          <div class="calc-field">
            <label>Final Value:</label>
            <input type="number" id="final-value" placeholder="1500">
          </div>
          <button id="calculate-roi">Calculate ROI</button>
          <div id="roi-result" class="calc-result"></div>
        </div>
      `;

      const calculateBtn = container.querySelector("#calculate-roi");
      calculateBtn.addEventListener("click", () => {
        const initial = parseFloat(
          container.querySelector("#initial-investment").value
        );
        const final = parseFloat(container.querySelector("#final-value").value);

        if (initial && final) {
          const roi = (((final - initial) / initial) * 100).toFixed(2);
          container.querySelector("#roi-result").innerHTML = `
            <strong>ROI: ${roi}%</strong>
            <p>Profit: ${(final - initial).toFixed(2)}</p>
          `;
        }
      });
    }

    createSavingsCalculator(container) {
      // Similar implementation for savings calculator
    }

    createQuizzes() {
      // Quiz functionality
      const quizzes = $$("[data-quiz]");

      quizzes.forEach((quiz) => {
        // Parse quiz data and create interactive quiz
      });
    }
  }

  // Performance Monitoring
  class PerformanceMonitor {
    constructor() {
      this.init();
    }

    init() {
      if ("performance" in window) {
        window.addEventListener("load", () => {
          setTimeout(() => {
            const perfData = performance.getEntriesByType("navigation")[0];

            // Send to analytics if needed
            console.log(
              "Page Load Time:",
              perfData.loadEventEnd - perfData.fetchStart,
              "ms"
            );

            // Check Core Web Vitals
            this.checkWebVitals();
          }, 0);
        });
      }
    }

    checkWebVitals() {
      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log("LCP:", lastEntry.renderTime || lastEntry.loadTime, "ms");
      }).observe({ entryTypes: ["largest-contentful-paint"] });

      // First Input Delay
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          console.log("FID:", entry.processingStart - entry.startTime, "ms");
        });
      }).observe({ entryTypes: ["first-input"] });

      // Cumulative Layout Shift
      let clsScore = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsScore += entry.value;
          }
        }
        console.log("CLS:", clsScore);
      }).observe({ entryTypes: ["layout-shift"] });
    }
  }

  // Initialize Everything
  document.addEventListener("DOMContentLoaded", () => {
    // Core features
    new BreakingNewsTicker();
    new TableOfContents();
    new ContentParser();

    // Advanced features
    new LivingPost();
    new SchemaGenerator();
    new InteractiveToolkit();
    new PerformanceMonitor();

    // Lazy load images
    lazyLoadImages();

    // Service Worker for offline support
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  });

  // Font Loading Optimization
  (function () {
    // Only load fonts for text that's actually on the page
    var fontObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          document.documentElement.classList.add("fonts-loaded");
          fontObserver.disconnect();
        }
      });
    });

    var textElements = document.querySelectorAll("h1, h2, h3, p");
    if (textElements.length > 0) {
      fontObserver.observe(textElements[0]);
    }
  })();

  // Image Format Optimization
  document.addEventListener("DOMContentLoaded", function () {
    // Convert images to WebP on supported browsers
    if ("loading" in HTMLImageElement.prototype) {
      document.querySelectorAll("img").forEach(function (img) {
        img.loading = "lazy";

        // Add WebP support detection
        var webp = new Image();
        webp.onload = webp.onerror = function () {
          if (webp.height === 2) {
            // WebP supported
            if (img.src.includes(".jpg") || img.src.includes(".png")) {
              img.dataset.originalSrc = img.src;
              // You can implement WebP conversion here
            }
          }
        };
        webp.src =
          "data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA";
      });
    }
  });

  // Content Freshness Signal
  (function () {
    var posts = document.querySelectorAll(".post-date");
    posts.forEach(function (post) {
      var date = new Date(post.textContent);
      var now = new Date();
      var days = Math.floor((now - date) / (1000 * 60 * 60 * 24));

      if (days < 7) {
        post.innerHTML += ' <span class="fresh-content">🔥 Fresh</span>';
      } else if (days < 30) {
        post.innerHTML += ' <span class="recent-content">✨ Recent</span>';
      }
    });
  })();

  // Reading Time Calculator
  (function () {
    var content = document.querySelector(".post-body");
    if (content) {
      var words = content.textContent.split(" ").length;
      var readingTime = Math.ceil(words / 200);

      var readingTimeEl = document.createElement("div");
      readingTimeEl.className = "reading-time";
      readingTimeEl.innerHTML = "⏱️ " + readingTime + " min read";

      content.parentElement.insertBefore(readingTimeEl, content);
    }
  })();

  // Engagement Signals
  document.addEventListener("DOMContentLoaded", function () {
    // Track scroll depth
    var scrollPoints = [25, 50, 75, 100];
    var scrolled = [];

    window.addEventListener(
      "scroll",
      debounce(function () {
        var scrollPercent =
          (window.scrollY /
            (document.documentElement.scrollHeight - window.innerHeight)) *
          100;

        scrollPoints.forEach(function (point) {
          if (scrollPercent >= point && !scrolled.includes(point)) {
            scrolled.push(point);
            // Send to Analytics
            if (window.gtag) {
              gtag("event", "scroll_depth", {
                percent: point,
              });
            }
          }
        });
      }, 100)
    );
  });

  // Global utilities
  window.AlchemistTheme = {
    version: "1.0.0",
    showNotification: (msg, type) =>
      new LivingPost().showNotification(msg, type),
    trackEvent: (category, action, label) => {
      if (window.gtag) {
        gtag("event", action, {
          event_category: category,
          event_label: label,
        });
      }
    },
  };
})();

