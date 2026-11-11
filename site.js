/* piano.rc-digital.it: comparsa dolce delle sezioni e barra di acquisto della pagina «Spartiti PDF».
   Senza questo file il sito funziona uguale: niente resta nascosto. */
(function () {
  var d = document;
  if (!("IntersectionObserver" in window)) return;
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var limit = window.innerHeight * 0.92;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (x) {
        if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); }
      });
    }, { rootMargin: "0px 0px -6% 0px" });
    d.querySelectorAll("[data-rv]").forEach(function (el) {
      // solo ciò che è ancora sotto lo schermo: quello che si vede subito non lampeggia
      if (el.getBoundingClientRect().top > limit) { el.classList.add("rv"); io.observe(el); }
    });
  }
  var bar = d.getElementById("buybar"), first = d.getElementById("hero-cta"), last = d.getElementById("final");
  if (bar && first) {
    var seen = { first: true, last: false };
    var ob = new IntersectionObserver(function (entries) {
      entries.forEach(function (x) { seen[x.target === first ? "first" : "last"] = x.isIntersecting; });
      bar.classList.toggle("on", !seen.first && !seen.last);
    });
    ob.observe(first);
    if (last) ob.observe(last);
  }
})();
