// -------------------------
// Modals & Form handling
// -------------------------
function openAddModal() {
    el('#modalTitle').textContent = 'Add Contact';
    el('#contactForm').reset();
    el('#editingId').value = '';
    el('#avatarPreview').innerHTML = '';
    // hide errors
    ['err_name','err_email','err_phone'].forEach(id => el('#'+id).classList.add('hidden'));
    el('#modalOverlay').classList.remove('hidden');
}
function closeModal() {
    el('#modalOverlay').classList.add('hidden');
}

function handleAvatarPreview(e) {
    const file = e.target.files[0];
    if (!file) {
    el('#avatarPreview').innerHTML = '';
    return;
    }
    const reader = new FileReader();
    reader.onload = () => {
    el('#avatarPreview').innerHTML = `<img src="${reader.result}" alt="avatar" class="w-20 h-20 rounded-full object-cover shadow" />`;
    el('#avatarPreview').dataset.preview = reader.result;
    };
    reader.readAsDataURL(file);
}

function validateForm(data){
    let ok = true;
    // name
    if (!data.name || !data.name.trim()) {
    el('#err_name').classList.remove('hidden'); ok = false;
    } else el('#err_name').classList.add('hidden');
    // phone
    if (!data.phone_number || !data.phone_number.trim()) {
        el('#err_phone').classList.remove('hidden'); ok = false;
    } else el('#err_phone').classList.add('hidden');
    // optional email simple check
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    el('#err_email').classList.remove('hidden'); ok = false;
    } else el('#err_email').classList.add('hidden');

    return ok;
}

// helper: read CSRF cookie
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function openEditModal(id) {
  const contact = state.filtered.find(c => c.id === id);
  if (!contact) return;

  // fill form
  el('#editingId').value = id;
  el('#modalTitle').textContent = "Edit Contact";
  el('#c_name').value = contact.name || "";
  el('#c_email').value = contact.email || "";
  el('#c_phone').value = contact.phone || "";
  el('#c_tags').value = (contact.tags || []).join(", ");
  el('#c_address').value = contact.address || "";
  el('#c_notes').value = contact.note || "";

  el('#modalOverlay').classList.remove('hidden');
}

async function handleSaveContact(e) {
  e.preventDefault();

  const formData = Object.fromEntries(new FormData(el('#contactForm')).entries());
  if (!validateForm(formData)) return;  // prevent invalid submit

  const id = el('#editingId').value;
  const sendData = new FormData(el('#contactForm'));
  let url = "/create-contact/";
  if (id) url = `/contacts/${id}/update-ajax/`;

  const res = await fetch(url, { method: "POST", body: sendData });
  const data = await res.json();

  if (data.success) {
    closeModal();
    window.location.href = "/";  // ✅ reload to home
  } else {
    alert("Error: " + JSON.stringify(data.errors));
  }
}

let deletingId = null;
function confirmDelete(id) {
  deletingId = id;
  el('#deleteModal').classList.remove('hidden');
}

function closeDeleteModal() {
  deletingId = null;
  el('#deleteModal').classList.add('hidden');
}

el('#confirmDeleteBtn').addEventListener('click', async () => {
  if (!deletingId) return;

  const res = await fetch(`/contacts/${deletingId}/delete-ajax/`, {
    method: "DELETE",
    headers: {"X-CSRFToken": getCookie("csrftoken")}
  });

  const data = await res.json();
  if (data.success) {
    closeDeleteModal();
    window.location.href = "/";  // ✅ force reload home
  } else {
    alert("Delete failed!");
  }
});

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>"']/g, m => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[m]));
}

async function viewContact(id) {
  const res = await fetch(`/contacts/api/?id=${id}`);
  if (!res.ok) return;
  const c = await res.json();

  const detail = document.querySelector('#detailCard');
  detail.innerHTML = `
    <img src="${c.avatar || 'https://ui-avatars.com/api/?name='+encodeURIComponent(c.name)}" 
         class="w-24 h-24 rounded-full mx-auto shadow" alt="${c.name}" />
    <div>
      <h4 class="text-xl font-semibold">${escapeHtml(c.name)}</h4>
      <p class="text-sm text-gray-500">${escapeHtml(c.note || '')}</p>
    </div>
    <div class="grid grid-cols-1 divide-y mt-4 text-sm text-left">
      <div class="py-2"><strong>Email:</strong> ${escapeHtml(c.email || '—')}</div>
      <div class="py-2"><strong>Phone:</strong> ${escapeHtml(c.phone || '—')}</div>
      <div class="py-2"><strong>Address:</strong> ${escapeHtml(c.address || '—')}</div>
      <div class="py-2"><strong>Tags:</strong> ${(c.tags || []).map(
        t => `<span class="inline-block text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 mr-1">${escapeHtml(t)}</span>`
      ).join('')}</div>
    </div>
  `;
  document.querySelector('#detailOverlay').classList.remove('hidden');
}

document.querySelectorAll('.closeDetail').forEach(btn => {
  btn.addEventListener('click', () => {
    el('#detailOverlay').classList.add('hidden');
  });
});
