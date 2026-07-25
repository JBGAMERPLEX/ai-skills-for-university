const loadedScripts = new Map();

/**
 * โหลด external script แบบ lazy และ return เมื่อโหลดเสร็จ
 * @param {string} src - URL ของ script
 * @param {string} id - ชื่อสำหรับป้องกันการโหลดซ้ำ (optional)
 * @returns {Promise<void>}
 */
export function loadScript(src, id = src) {
  if (loadedScripts.has(id)) {
    return loadedScripts.get(id);
  }

  const promise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.hasAttribute('data-loaded')) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => {
        existing.setAttribute('data-loaded', 'true');
        resolve();
      });
      existing.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.setAttribute('data-loaded', 'true');
      loadedScripts.set(id, Promise.resolve());
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });

  loadedScripts.set(id, promise);
  return promise;
}

/**
 * Lazy load Chart.js
 */
export function loadChartJS() {
  return loadScript('https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js', 'chartjs');
}

/**
 * Lazy load Quill.js (CSS + JS)
 */
export async function loadQuill() {
  // CSS
  if (!document.querySelector('link[href*="quill.snow.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.snow.css';
    document.head.appendChild(link);
  }
  return loadScript('https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.js', 'quill');
}

/**
 * Lazy load jsPDF library for certificate generation
 */
export function loadJsPDF() {
  return loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', 'jspdf');
}


export function loadHtml2Canvas() {
  return loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', 'html2canvas');
}