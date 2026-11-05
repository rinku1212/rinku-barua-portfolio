// Update copyright year automatically
const yearElement = document.getElementById("current-year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// Mobile navigation
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("active");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("active");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

// Close mobile menu when clicking outside
document.addEventListener("click", (event) => {
  if (
    menuToggle &&
    navLinks &&
    !menuToggle.contains(event.target) &&
    !navLinks.contains(event.target)
  ) {
    navLinks.classList.remove("active");
    menuToggle.setAttribute("aria-expanded", "false");
  }
});
