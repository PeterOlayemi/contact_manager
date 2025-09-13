// -------------------------
// CSV Import/Export and Print
// -------------------------
function setupImport(btnId, inputId) {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);

    if (btn && input) {
        btn.addEventListener("click", () => input.click());
        input.addEventListener("change", handleCSVImport);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    setupImport("importBtnSidebar", "csvInputSidebar");
    setupImport("importBtnHome", "csvInputHome");
});

function handleCSVImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
    try {
        const text = reader.result;
        const rows = text.split(/\r?\n/).filter(Boolean);
        const header = rows.shift().split(',').map(h => h.trim().toLowerCase());
        rows.forEach(r => {
        const cols = r.split(',');
        const obj = {};
        header.forEach((h,i) => obj[h] = (cols[i] || '').trim());
        const newContact = {
            id: uid(),
            name: obj.name || obj.fullname || 'No name',
            email: obj.email || '',
            phone: obj.phone || '',
            tags: (obj.tags || '').split(';').map(s => s.trim()).filter(Boolean),
            address: obj.address || '',
            notes: obj.notes || '',
            avatar: ''
        };
        contacts.unshift(newContact);
        });
        showToast('CSV imported', 'success');
        render();
    } catch (err) {
        console.error(err);
        showToast('Failed to import CSV', 'error');
    }
    };
    reader.readAsText(file);
    // reset input
    e.target.value = '';
}

function handleCSVExport() {
    // headers: name,email,phone,tags,address,notes
    const rows = [
    ['name','email','phone','tags','address','notes']
    ];
    contacts.forEach(c => rows.push([
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
    a.download = 'contacts_export.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('CSV exported', 'success');
}

function handlePrint() {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    const html = `
    <html>
        <head>
        <title>Print - Contacts</title>
        <style>
            body{font-family:system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;}
            table{width:100%;border-collapse:collapse}
            th,td{padding:8px;border:1px solid #ddd;text-align:left}
            th{background:#f4f4f4}
            .tags{font-size:11px;padding:4px;border-radius:6px;background:#eef2ff;color:#3730a3}
        </style>
        </head>
        <body>
        <h2>Contacts</h2>
        <table>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Tags</th></tr></thead>
            <tbody>
            ${contacts.map(c => `<tr><td>${escapeHtml(c.name)}</td><td>${escapeHtml(c.email)}</td><td>${escapeHtml(c.phone)}</td><td>${(c.tags||[]).map(t=>`<span class="tags">${escapeHtml(t)}</span>`).join(' ')}</td></tr>`).join('')}
            </tbody>
        </table>
        </body>
    </html>
    `;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
}

document.addEventListener("DOMContentLoaded", () => {
    const importBtn = document.getElementById("importBtn");
    const csvInput = document.getElementById("csvInput");

    if (importBtn && csvInput) {
        importBtn.addEventListener("click", () => {
            csvInput.click(); // opens the hidden file selector
        });

        csvInput.addEventListener("change", handleCSVImport); 
    }
});

document.addEventListener("DOMContentLoaded", () => {
    // existing setup...

    const exportBtn = document.getElementById("exportBtn");
    const printBtn = document.getElementById("printBtn");

    if (exportBtn) {
        exportBtn.addEventListener("click", handleCSVExport);
    }

    if (printBtn) {
        printBtn.addEventListener("click", handlePrint);
    }
});
