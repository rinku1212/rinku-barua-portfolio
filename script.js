
/* =========================================
   RINKU BARUA — PORTFOLIO INTERACTIONS
========================================= */

document.addEventListener("DOMContentLoaded", function () {

  // MOBILE NAVIGATION
  const menuToggle = document.querySelector(".menu-toggle");
  const navigation = document.querySelector(".primary-navigation");
  const navigationLinks = document.querySelectorAll(
    ".primary-navigation a"
  );

  if (menuToggle && navigation) {

    menuToggle.addEventListener("click", function () {

      const isOpen = navigation.classList.toggle("active");

      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute(
        "aria-label",
        isOpen ? "Close navigation menu" : "Open navigation menu"
      );

    });

    // Close menu after selecting a section
    navigationLinks.forEach(function (link) {

      link.addEventListener("click", function () {

        navigation.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute(
          "aria-label",
          "Open navigation menu"
        );

      });

    });

    // Close menu when clicking outside
    document.addEventListener("click", function (event) {

      const clickedInside =
        navigation.contains(event.target) ||
        menuToggle.contains(event.target);

      if (!clickedInside) {

        navigation.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute(
          "aria-label",
          "Open navigation menu"
        );

      }

    });

  }


  // CURRENT YEAR IN FOOTER
  const footerParagraphs = document.querySelectorAll(
    ".site-footer p"
  );

  footerParagraphs.forEach(function (paragraph) {

    if (paragraph.textContent.includes("2026 Rinku Barua")) {
      paragraph.textContent =
        "© " + new Date().getFullYear() +
        " Rinku Barua. All rights reserved.";
    }

  });


  // ACTIVE NAVIGATION LINK
  const sections = document.querySelectorAll(
    "main section[id]"
  );

  if ("IntersectionObserver" in window) {

    const observer = new IntersectionObserver(
      function (entries) {

        entries.forEach(function (entry) {

          if (entry.isIntersecting) {

            navigationLinks.forEach(function (link) {
              link.classList.remove("active-link");

              if (
                link.getAttribute("href") ===
                "#" + entry.target.id
              ) {
                link.classList.add("active-link");
              }

            });

          }

        });

      },
      {
        rootMargin: "-25% 0px -65% 0px"
      }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });

  }

});
