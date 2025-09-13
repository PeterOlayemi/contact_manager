// Application state (UI)
const state = {
    filtered: [],
    query: "",
    sortBy: "name",
    sortDir: "asc",
    perPage: 10,
    page: 1,
    tag: "",
    currentTags: new Set()
};

// Utility functions
function uid() {
    return 'id-' + Math.random().toString(36).slice(2, 9);
}
function el(sel){ return document.querySelector(sel); }
function els(sel){ return Array.from(document.querySelectorAll(sel)); }

// -------------------------
// Toasts
// -------------------------
function showToast(message, type='info', timeout=3000) {
    const id = uid();
    const container = el('#toastContainer');
    const t = document.createElement('div');
    t.id = id;
    t.className = 'toast-enter toast-show flex items-center gap-3 p-3 rounded shadow-lg bg-white dark:bg-gray-800';
    t.style.minWidth = '220px';
    t.innerHTML = `
    <div class="p-2 rounded-full ${type==='error' ? 'bg-red-100 text-red-800' : type==='success' ? 'bg-green-100 text-green-800' : 'bg-indigo-100 text-indigo-800'}">
        <i data-feather="${type==='error' ? 'x-circle' : type==='success' ? 'check-circle' : 'info'}" class="w-4 h-4"></i>
    </div>
    <div><div class="font-medium">${escapeHtml(message)}</div></div>
    `;
    container.appendChild(t);
    feather.replace();
    setTimeout(() => {
    if (t) { t.remove(); }
    }, timeout);
}

// -------------------------
// Helpers / Sanitizers
// -------------------------
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function escapeCsv(v) {
    if (v == null) return '';
    v = String(v);
    if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return '"' + v.replace(/"/g, '""') + '"';
    }
    return v;
}

// -------------------------
// Small extras
// -------------------------
// Close profile menu on click outside
document.addEventListener('click', function(e){
    const pm = el('#profileMenu');
    if (!pm) return;
    if (!el('#profileMenuBtn').contains(e.target) && !pm.contains(e.target)) pm.classList.add('hidden');
});

// quick keyboard shortcuts
document.addEventListener('keydown', function(e){
    if (e.key === 'n' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); openAddModal(); }
});

// end of script
