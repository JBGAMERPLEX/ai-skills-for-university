const routes = [];

export function registerRoute(pattern, renderFn) {
  routes.push({ pattern, renderFn });
}

export function initRouter() {
  window.addEventListener('hashchange', resolveRoute);
  resolveRoute();
}

function resolveRoute() {
  const hash = window.location.hash.slice(1) || '/home';
  const main = document.getElementById('main-content');
  if (!main) return;

  main.innerHTML = '';

  // ตรวจสอบเส้นทางแบบมีพารามิเตอร์
  for (const { pattern, renderFn } of routes) {
    const params = matchRoute(pattern, hash);
    if (params) {
      renderFn(main, params);
      return;
    }
  }

  // fallback
  main.innerHTML = `<div class="text-center py-20"><h2 class="text-2xl">ไม่พบหน้า</h2></div>`;
}

function matchRoute(pattern, hash) {
  const patternParts = pattern.split('/');
  const hashParts = hash.split('/');

  if (patternParts.length !== hashParts.length) return null;

  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = hashParts[i];
    } else if (patternParts[i] !== hashParts[i]) {
      return null;
    }
  }
  return params;
}

export function navigate(hash) {
  window.location.hash = hash;
}