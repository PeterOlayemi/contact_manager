// Select all functionality
document.addEventListener('change', function(e) {
  if (e.target.id === 'selectAllContacts') {
    document.querySelectorAll('.contact-checkbox').forEach(cb => {
      cb.checked = e.target.checked;
    });
  }
});

// Get selected contact IDs
function getSelectedContactIds() {
  return Array.from(document.querySelectorAll('.contact-checkbox:checked')).map(cb => cb.value);
}

// Multi-delete
document.getElementById('multiDeleteBtn').addEventListener('click', () => {
  const ids = getSelectedContactIds();
  if (ids.length === 0) return alert('No contacts selected!');
  confirmMultiDelete(ids);  // ✅ use modal
});

// Multi-export
document.getElementById('multiExportBtn').addEventListener('click', () => {
  const ids = getSelectedContactIds();
  if (ids.length === 0) return alert('No contacts selected!');
  const selectedContacts = contacts.filter(c => ids.includes(String(c.id)));
  exportContactsToCSV(selectedContacts);
});

// Helper for CSV export
function exportContactsToCSV(selectedContacts) {
  const rows = [
    ['name','email','phone','tags','address','notes']
  ];
  selectedContacts.forEach(c => rows.push([
    escapeCsv(c.name),
    escapeCsv(c.email),
    escapeCsv(c.phone),
    escapeCsv((c.tags||[]).join(';')),
    escapeCsv(c.address),
    escapeCsv(c.notes)
  ]));
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], {type: 'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'contacts_selected_export.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
