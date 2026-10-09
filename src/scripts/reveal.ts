// Fades sections in as they scroll into view. Only elements that start below the fold are
// hidden, and only when JS runs and motion is allowed, so content is never lost.
const STAGGER_MS = 90;
const STAGGER_GROUP = 3;
const THRESHOLD = 0.12;

function init(): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const below = [...document.querySelectorAll<HTMLElement>('.reveal')].filter(
    (el) => el.getBoundingClientRect().top > window.innerHeight,
  );
  const observer = new IntersectionObserver(
    (entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .forEach((entry) => {
          entry.target.classList.remove('pending');
          observer.unobserve(entry.target);
        });
    },
    { threshold: THRESHOLD },
  );
  below.forEach((el, i) => {
    el.style.transitionDelay = `${(i % STAGGER_GROUP) * STAGGER_MS}ms`;
    el.classList.add('pending');
    observer.observe(el);
  });
}

init();
