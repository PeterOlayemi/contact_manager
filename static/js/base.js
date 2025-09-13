// Apply stored theme early to prevent flicker
(function () {
  const stored = localStorage.getItem('cm_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (stored === 'dark' || (!stored && prefersDark)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
})();

function initTheme() {
  const stored = localStorage.getItem('cm_theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  const toggle = document.querySelector('#themeToggle');
  const knob = document.querySelector('#themeKnob');

  if (!toggle || !knob) return;

  if (stored === 'dark') {
    toggle.checked = true;
    knob.classList.add('translate-x-6'); // move right
  } else {
    toggle.checked = false;
    knob.classList.remove('translate-x-6');
  }
}

function toggleTheme() {
  const toggle = document.querySelector('#themeToggle');
  const knob = document.querySelector('#themeKnob');
  if (!toggle || !knob) return;

  if (toggle.checked) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('cm_theme', 'dark');
    knob.classList.add('translate-x-6');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('cm_theme', 'light');
    knob.classList.remove('translate-x-6');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  const toggle = document.querySelector('#themeToggle');
  if (toggle) toggle.addEventListener('change', toggleTheme);
});

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".importBtn").forEach((btn, i) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".csvInput")[i].click();
    });
  });
})
