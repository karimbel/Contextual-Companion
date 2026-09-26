/* ============================================================
   Compagnon contextuel — démo de défilement
   Défilement natif : on se contente d'observer où en est la page.
   ============================================================ */

const BAND_TOP = 24;        // ligne de décision, en % de la hauteur de la fenêtre
const BAND_HEIGHT = 4;      // épaisseur de la bande qui déclenche le recalcul

const flow = document.querySelector('.flow');
const sections = Array.from(flow.querySelectorAll('.section'));
const markers = sections.map((section) => section.querySelector('.marker'));

/* La bascule ne touche que les vues du compagnon figé. Les cartes que le
   téléphone pose au-dessus de chaque section portent leur contenu dans
   le flux : si une version antérieure de la page y logeait une `.view`,
   elle doit rester affichée quand même. */
const views = Array.from(
  document.querySelector('aside.companion').querySelectorAll('.view')
);

let currentId = null;

/* L'IntersectionObserver sert de déclencheur : il ne réveille le code
   que lorsqu'un marqueur entre ou sort de la bande. Le choix de la
   section active, lui, se fait sur la position des marqueurs par
   rapport à la ligne. */
const bandObserver = new IntersectionObserver(
  onBandChange,
  {
    rootMargin: `-${BAND_TOP}% 0px -${100 - BAND_TOP - BAND_HEIGHT}% 0px`,
    threshold: 0
  }
);

markers.forEach((marker) => bandObserver.observe(marker));

function onBandChange() {
  applyActive(resolveActive());
}

function line() {
  return (window.innerHeight * BAND_TOP) / 100;
}

/* Dernier marqueur à avoir franchi la ligne = section active.
   S'il n'y en a pas encore, on prend la première qui s'en approche. */
function resolveActive() {
  const limit = line();
  let crossed = null;
  let upcoming = null;

  for (const marker of markers) {
    if (marker.getBoundingClientRect().top <= limit) {
      crossed = marker;
    } else if (upcoming === null) {
      upcoming = marker;
    }
  }

  return (crossed ?? upcoming ?? markers[0]).dataset.section;
}

function applyActive(id) {
  if (id === currentId) return;   // rien n'a bougé : pas de transition à relancer

  currentId = id;

  views.forEach((view) => {
    const isActive = view.dataset.view === id;
    view.classList.toggle('is-active', isActive);
    view.setAttribute('aria-hidden', String(!isActive));
  });

  sections.forEach((section) => {
    section.classList.toggle('is-active', section.id === id);
  });
}

/* ── Gestes factices : sélection locale, aucune logique ───── */

/* Le compagnon figé et les cartes du téléphone portent chacun leur
   quiz et leur menu : le geste ne doit pas se limiter à la carte
   affichée. */
document.querySelectorAll('.companion__stage').forEach((stage) => {
  stage.addEventListener('click', (event) => {
    const choice = event.target.closest('.choice');
    if (choice) {
      choice.closest('.choices').querySelectorAll('.choice').forEach((button) => {
        button.setAttribute('aria-pressed', String(button === choice));
      });
      return;
    }

    const item = event.target.closest('.menu__item');
    if (!item) return;

    item.closest('.menu').querySelectorAll('.menu__item').forEach((button) => {
      button.setAttribute('aria-current', String(button === item));
    });
  });
});

/* ── Recalculs : la ligne bouge avec la fenêtre ──────────── */

window.addEventListener('resize', onBandChange);
window.addEventListener('load', onBandChange);

/* Chaque marqueur transporte l'id de sa section. */
sections.forEach((section, index) => {
  markers[index].dataset.section = section.id;
});

onBandChange();
