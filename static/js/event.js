document.addEventListener('DOMContentLoaded', () => {
    // Initial state
    state.filtered = contacts.slice();
    // wire UI
    wireUI();
    render();
    // Dark mode init
    initTheme();
});

document.addEventListener("DOMContentLoaded", () => {
  render();

  document.getElementById("perPage").addEventListener("change", e => {
    state.perPage = parseInt(e.target.value);
    state.page = 1;
    render();
  });

  document.getElementById("tagFilter").addEventListener("change", e => {
    const val = e.target.value;
    state.tag = val && val !== 'undefined' ? val : '';
    state.page = 1;
    render();
  });

  document.getElementById("globalSearch").addEventListener("input", e => {
    state.query = e.target.value;
    state.page = 1;
    render();
  });

  document.getElementById("prevPage").addEventListener("click", () => {
    if (state.page > 1) {
      state.page--;
      render();
    }
  });

  document.getElementById("nextPage").addEventListener("click", () => {
    state.page++;
    render();
  });
});

function wireUI() {
    // sorting
    els('th[data-sort]').forEach(h => {
    h.addEventListener('click', () => {
        const key = h.dataset.sort;
        if (state.sortBy === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
        else { state.sortBy = key; state.sortDir = 'asc'; }
        render();
    });
    });

    // add contact
    el('#addContactBtn').addEventListener('click', openAddModal);
    el('#closeModal').addEventListener('click', closeModal);
    el('#cancelForm').addEventListener('click', closeModal);
    el('#contactForm').addEventListener('submit', handleSaveContact);
    el('#c_avatar').addEventListener('change', handleAvatarPreview);

    // profile menu
    el('#profileMenuBtn').addEventListener('click', () => el('#profileMenu').classList.toggle('hidden'));

    // csv import/export
    el('#csvInput').addEventListener('change', handleCSVImport);
    el('#importBtn').addEventListener('click', () => el('#csvInput').click());
    el('#exportBtn').addEventListener('click', handleCSVExport);
    el('#printBtn').addEventListener('click', handlePrint);

    // mobile menu (toggles sidebar)
    el('#mobile-menu-btn').addEventListener('click', () => {
    const aside = document.querySelector('aside');
    aside.classList.toggle('hidden');
    });

    // detail close
    els('.closeDetail').forEach(btn => btn.addEventListener('click', () => el('#detailOverlay').classList.add('hidden')));

    // theme toggle
    el('#themeToggle').addEventListener('change', toggleTheme);

    // clicking outside modal closes
    el('#modalOverlay').addEventListener('click', (e) => {
    if (e.target === el('#modalOverlay')) closeModal();
    });
    el('#detailOverlay').addEventListener('click', (e) => {
    if (e.target === el('#detailOverlay')) el('#detailOverlay').classList.add('hidden');
    });
}

async function fetchContacts() {
  const params = new URLSearchParams({
    page: state.page,
    perPage: state.perPage,
    q: state.query
  });

  if (state.tag && state.tag !== 'undefined') {
    params.append('tag', state.tag);
  }

  const res = await fetch(`/contacts/api/?${params.toString()}`);
  return await res.json();
}

async function render() {
  const data = await fetchContacts();
  const tbody = document.getElementById("contactsTableBody");
  tbody.innerHTML = "";

  if (data.results.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">No contacts yet.</td></tr>`;
  } else {
    data.results.forEach(c => {
      tbody.innerHTML += `
        <tr>
          <td class="p-3">${c.name}</td>
          <td class="p-3">${c.email || ""}</td>
          <td class="p-3">${c.phone || ""}</td>
          <td class="p-3">
            ${c.tags.map(t => `<span class="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs">${t}</span>`).join(" ")}
          </td>
          <td class="p-3 text-right">
            <button onclick="viewContact(${c.id})" class="px-3 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><i data-feather="eye" class="w-4 h-4"></i></button>
            <button onclick="openEditModal(${c.id})" class="hover:bg-gray-100 dark:hover:bg-gray-700"><i data-feather="edit-2" class="w-4 h-4"></i></button>
            <button onclick="confirmDelete(${c.id})" class="px-3 py-1 rounded hover:bg-red-50 text-red-600 dark:hover:bg-red-900/30"><i data-feather="trash-2" class="w-4 h-4"></i></button>
          </td>
        </tr>
      `;
    });
  }

  // Update pagination
  document.getElementById("showingCount").textContent = data.total;
  document.getElementById("currentPage").textContent = data.page;
  document.getElementById("totalPages").textContent = data.pages;

  document.getElementById("prevPage").disabled = data.page <= 1;
  document.getElementById("nextPage").disabled = data.page >= data.pages;
  
  feather.replace();
}

function renderTable() {
    const tbody = el('#contactsTableBody');
    tbody.innerHTML = '';

    state.filtered.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="p-3">${c.name}</td>
            <td class="p-3">${c.email || ''}</td>
            <td class="p-3">${c.phone || ''}</td>
            <td class="p-3">${(c.tags || []).map(t => `<span class="tag">${t}</span>`).join(' ')}</td>
            <td class="p-3 text-right">
                <a href="/${c.id}/" class="text-blue-600">View</a> |
                <a href="/contacts/${c.id}/update-ajax/" class="text-yellow-600">Edit</a> |
                <a href="/contacts/${c.id}/delete-ajax/" class="text-red-600">Delete</a>
            </td>
        `;
        tbody.appendChild(tr);
    });

    feather.replace();
}

function updatePagination() {
    el('#showingCount').textContent = state.total;
    el('#currentPage').textContent = state.page;
    el('#totalPages').textContent = state.pages;

    el('#prevPage').disabled = state.page <= 1;
    el('#nextPage').disabled = state.page >= state.pages;
}

// -------------------------
// Rendering
// -------------------------
function applyFilters() {
    let arr = contacts.slice();

    // search query filter
    if (state.query) {
        arr = arr.filter(c => {
            const q = state.query;
            return (c.name || '').toLowerCase().includes(q) ||
                   (c.email || '').toLowerCase().includes(q) ||
                   (c.phone || '').toLowerCase().includes(q) ||
                   (c.tags || []).join(' ').toLowerCase().includes(q);
        });
    }

    // tag filter
    if (state.currentTags.size > 0) {
        const tag = Array.from(state.currentTags)[0];
        arr = arr.filter(c => (c.tags || []).includes(tag));
    }

    // sorting
    arr.sort((a,b) => {
        const k = state.sortBy;
        const va = (a[k] || '').toString().toLowerCase();
        const vb = (b[k] || '').toString().toLowerCase();
        if (va < vb) return state.sortDir === 'asc' ? -1 : 1;
        if (va > vb) return state.sortDir === 'asc' ? 1 : -1;
        return 0;
    });

    state.filtered = arr;
}
