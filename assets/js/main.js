/**
 * Client-side interactions for the CP-Tech Lab static website.
 */
(function () {
  "use strict";

  const header = document.getElementById("site-header");
  const mobileToggle = document.getElementById("mobile-menu-toggle");
  const mobileNav = document.getElementById("mobile-nav");

  function updateMobileToggleState() {
    if (!mobileToggle || !header) return;
    const menuOpen = mobileNav?.classList.contains("is-open");
    const forceSolid = !document.getElementById("home");
    const scrolled = forceSolid || window.scrollY > 16;
    header.classList.toggle("is-menu-open", Boolean(menuOpen));
    document.body.classList.toggle("is-mobile-nav-open", Boolean(menuOpen));
    mobileToggle.classList.toggle("text-foreground", scrolled || menuOpen);
    mobileToggle.classList.toggle("text-white", !scrolled && !menuOpen);
  }

  function closeMobileMenu() {
    if (!mobileToggle || !mobileNav) return;
    mobileNav.classList.remove("is-open");
    mobileNav.setAttribute("aria-hidden", "true");
    mobileToggle.querySelector(".menu-open-icon")?.classList.remove("hidden");
    mobileToggle.querySelector(".menu-close-icon")?.classList.add("hidden");
    mobileToggle.setAttribute("aria-expanded", "false");
    updateMobileToggleState();
  }

  function initScrollHeader() {
    if (!header) return;
    // Homepage has a dark hero (#home); other pages are light from the start,
    // so keep the solid (dark-text) header style even at scrollY === 0.
    const forceSolid = !document.getElementById("home");
    const onScroll = () => {
      const scrolled = forceSolid || window.scrollY > 16;
      header.classList.toggle("is-scrolled", scrolled);
      updateMobileToggleState();
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function initMobileMenu() {
    if (!mobileToggle || !mobileNav) return;
    mobileToggle.addEventListener("click", () => {
      const isOpen = mobileNav.classList.toggle("is-open");
      mobileNav.setAttribute("aria-hidden", String(!isOpen));
      mobileToggle.querySelector(".menu-open-icon")?.classList.toggle("hidden", isOpen);
      mobileToggle.querySelector(".menu-close-icon")?.classList.toggle("hidden", !isOpen);
      mobileToggle.setAttribute("aria-expanded", String(isOpen));
      updateMobileToggleState();
    });
    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMobileMenu);
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth >= 1024) closeMobileMenu();
    });
  }

  function initActiveSection() {
    const navLinks = document.querySelectorAll("[data-nav-target]");
    if (!navLinks.length) return;
    const sections = Array.from(navLinks)
      .map((link) => {
        const target = link.getAttribute("data-nav-target");
        if (!target || !target.startsWith("#")) return null;
        return document.querySelector(target);
      })
      .filter(Boolean);

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = `#${entry.target.id}`;
          navLinks.forEach((link) => {
            if (link.getAttribute("data-nav-target")?.startsWith("#")) {
              link.classList.toggle("is-active", link.getAttribute("data-nav-target") === id);
            }
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
  }

  function initReveal() {
    document.querySelectorAll("[data-reveal]").forEach((item) => {
      item.classList.add("is-visible");
    });
    const items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 },
    );
    items.forEach((item) => observer.observe(item));
  }

  function initSmoothNavScroll() {
    document.querySelectorAll('a[href*="#"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        const href = link.getAttribute("href") || "";
        const hashIndex = href.indexOf("#");
        if (hashIndex === -1) return;
        const hash = href.slice(hashIndex);
        if (!hash || hash === "#") return;

        // Only smooth-scroll when the hash target is on this page.
        const pathPart = href.slice(0, hashIndex);
        const currentPath = window.location.pathname.replace(/index\.html$/, "");
        const linkPath = pathPart
          ? new URL(pathPart, window.location.href).pathname.replace(/index\.html$/, "")
          : currentPath;
        if (linkPath && linkPath !== currentPath && !href.startsWith("#")) {
          return;
        }

        const target = document.querySelector(hash);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        history.pushState(null, "", hash);
        closeMobileMenu();
      });
    });
  }

  function initPublications() {
    const dataElement = document.getElementById("publications-data");
    const listElement = document.getElementById("pub-list");
    const emptyElement = document.getElementById("pub-empty");
    const searchInput = document.getElementById("pub-search");
    const tabs = document.querySelectorAll("[data-pub-tab]");
    if (!dataElement || !listElement) return;

    let publications = [];
    try {
      publications = JSON.parse(dataElement.textContent || "[]");
    } catch (error) {
      publications = [];
    }

    let activeTab = "All";
    let query = "";

    function renderPublications() {
      const filtered = publications.filter((publication) => {
        const matchesTab = activeTab === "All" || publication.category === activeTab;
        const haystack = `${publication.title} ${publication.authors} ${publication.venue}`.toLowerCase();
        const matchesQuery = !query || haystack.includes(query.toLowerCase());
        return matchesTab && matchesQuery;
      });

      listElement.innerHTML = filtered
        .map((publication) => {
          const url = publication.url || "#";
          const externalAttrs = publication.external
            ? ' target="_blank" rel="noopener noreferrer"'
            : "";
          return `
          <li>
            <a href="${url}" class="card-link flex items-start justify-between gap-4 p-5 transition-colors hover:bg-secondary/40"${externalAttrs}>
              <div>
                <h3 class="font-medium leading-snug text-foreground">${publication.title}</h3>
                <p class="mt-1 text-sm text-muted-foreground">${publication.authors}</p>
                <p class="mt-1 text-sm"><span class="text-primary">${publication.venue}</span><span class="text-muted-foreground"> · ${publication.year}</span></p>
              </div>
              <span class="shrink-0 rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">${publication.category}</span>
            </a>
          </li>`;
        })
        .join("");

      if (emptyElement) {
        emptyElement.classList.toggle("hidden", filtered.length > 0);
      }
    }

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        activeTab = tab.getAttribute("data-pub-tab") || "All";
        tabs.forEach((button) => {
          button.classList.toggle("is-active", button === tab);
          button.classList.toggle("text-muted-foreground", button !== tab);
        });
        renderPublications();
      });
    });

    if (searchInput) {
      searchInput.addEventListener("input", (event) => {
        query = event.target.value;
        renderPublications();
      });
    }

    renderPublications();
  }

  function resolveScholarFeedUrl(personSlug) {
    const meta = document.querySelector('meta[name="cms-origin"]');
    const origin = (meta?.getAttribute("content") || window.CMS_ORIGIN || "").replace(/\/$/, "");
    const path = "/api/scholar-feed/";
    const params = new URLSearchParams({ person: personSlug, only_new: "0" });
    if (origin) {
      return `${origin}${path}?${params}`;
    }
    if (window.location.pathname.includes("/static-preview/")) {
      return `${path}?${params}`;
    }
    // Same-origin Django (admin host serving preview or API).
    if (window.location.port === "8000" || /localhost|127\.0\.0\.1/.test(window.location.hostname)) {
      return `${path}?${params}`;
    }
    return "";
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function initScholarFeed() {
    const section = document.querySelector("[data-scholar-person]");
    if (!section || !window.fetch) return;

    const personSlug = section.getAttribute("data-scholar-person");
    if (!personSlug) return;

    const status = section.querySelector("[data-scholar-status]");
    const list = section.querySelector("[data-scholar-list]");
    const feedUrl = resolveScholarFeedUrl(personSlug);
    if (!feedUrl) {
      if (status) {
        status.textContent =
          "Connect the CMS (set CMS_ORIGIN) to load new Google Scholar works live.";
      }
      return;
    }

    fetch(feedUrl, { method: "GET", credentials: "omit", cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (!data || data.ok === false) {
          throw new Error(data?.error || data?.reason || "Scholar feed unavailable");
        }
        if (data.skipped) {
          if (status) status.textContent = data.reason || "Google Scholar sync is disabled.";
          return;
        }
        const articles = Array.isArray(data.articles) ? data.articles : [];
        if (!articles.length) {
          if (status) {
            status.textContent = "No publications found on this Google Scholar profile.";
          }
          return;
        }
        if (status) {
          status.textContent = `${articles.length} work${articles.length === 1 ? "" : "s"} from Google Scholar.`;
        }
        if (!list) return;
        list.innerHTML = articles
          .map((article) => {
            const href = article.url || (article.doi ? `https://doi.org/${article.doi}` : "#");
            const meta = [article.venue, article.year, article.doi].filter(Boolean).join(" · ");
            const badge = article.is_new
              ? '<span class="shrink-0 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">New</span>'
              : `<span class="shrink-0 rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">${escapeHtml(article.category || "Scholar")}</span>`;
            return `
              <li>
                <a href="${escapeHtml(href)}" class="card-link flex items-start justify-between gap-4 p-5 transition-colors hover:bg-secondary/40" target="_blank" rel="noopener noreferrer">
                  <div>
                    <h3 class="font-medium leading-snug text-foreground">${escapeHtml(article.title)}</h3>
                    <p class="mt-1 text-sm text-muted-foreground">${escapeHtml(article.authors)}</p>
                    <p class="mt-1 text-sm text-muted-foreground">${escapeHtml(meta)}</p>
                  </div>
                  ${badge}
                </a>
              </li>`;
          })
          .join("");
        list.classList.remove("hidden");
      })
      .catch(() => {
        if (status) {
          status.textContent =
            "Could not reach Google Scholar right now. Open the profile link above, or try again later.";
        }
      });
  }

  initScrollHeader();
  initMobileMenu();
  initSmoothNavScroll();
  initActiveSection();
  initReveal();
  initPublications();
  initScholarFeed();
})();
