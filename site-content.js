(function () {
  const selectors = {
    "hero.name": [".hero-name"],
    "hero.role": [".hero-role"],
    "hero.description": [".hero-description"],
    "about.title": ["#about h2"],
    "about.intro": ["#about .section-intro"],
    "contact.title": ["#contact h2"],
    "contact.intro": ["#contact .section-intro"],
    "contact.email": ["#contact a[href^='mailto:']"],
    "contact.phone": ["#contact a[href^='tel:']"],
    "contact.location": ["#contact .contact-item:last-child p"],
    "footer.tagline": [".site-footer p:first-of-type"]
  };

  function getPath(object, path) {
    return path.split(".").reduce((value, key) => value && value[key], object);
  }

  function setText(selector, value) {
    document.querySelectorAll(selector).forEach(element => {
      element.textContent = String(value);
    });
  }

  async function applyPublishedContent() {
    try {
      const response = await fetch("/api/public-content", { headers: { "Accept": "application/json" } });
      if (!response.ok) return;
      const result = await response.json();
      const content = result && result.content;
      if (!content || typeof content !== "object") return;

      Object.entries(selectors).forEach(([path, targets]) => {
        const value = getPath(content, path);
        if (typeof value === "string" && value.trim()) targets.forEach(selector => setText(selector, value));
      });

      if (typeof content.contact?.email === "string" && content.contact.email.trim()) {
        document.querySelectorAll("#contact a[href^='mailto:']").forEach(a => a.href = "mailto:" + content.contact.email.trim());
      }
      if (typeof content.contact?.phone === "string" && content.contact.phone.trim()) {
        const digits = content.contact.phone.replace(/[^0-9+]/g, "");
        document.querySelectorAll("#contact a[href^='tel:']").forEach(a => a.href = "tel:" + digits);
      }

      if (typeof content.cv?.url === "string" && content.cv.url.trim()) {
        const area = document.querySelector(".cv-download-area");
        if (area) {
          const old = area.querySelector(".cv-placeholder");
          if (old) {
            const link = document.createElement("a");
            link.className = "primary-button";
            link.href = content.cv.url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = content.cv.label || "Download CV (PDF)";
            old.replaceWith(link);
          }
        }
      }

      if (content.theme && typeof content.theme === "object") {
        const root = document.documentElement;
        const allowed = { navy: "--navy", gold: "--gold", offWhite: "--off-white" };
        Object.entries(allowed).forEach(([key, variable]) => {
          const value = content.theme[key];
          if (typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value)) root.style.setProperty(variable, value);
        });
      }

      if (content.visibility && typeof content.visibility === "object") {
        Object.entries(content.visibility).forEach(([id, visible]) => {
          if (typeof visible !== "boolean") return;
          const section = document.getElementById(id);
          if (section && id !== "home") section.hidden = !visible;
        });
      }
    } catch {
      // The static portfolio remains available if the published-content service is temporarily unavailable.
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyPublishedContent, { once: true });
  } else {
    applyPublishedContent();
  }
})();
