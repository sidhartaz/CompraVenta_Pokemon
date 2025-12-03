        // =============== ADMIN: USUARIOS ==================
        async function loadAdminUsers() {
            if (!authToken) return alert('No autenticado');

            const res = await fetch('/api/admin/users', {
                headers: { 'Authorization': 'Bearer ' + authToken }
            });

            const data = await res.json();
            if (!res.ok) {
                return alert('Error: ' + data.message);
            }

            const table = document.getElementById('admin-users-table');
            table.innerHTML = `
                <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Activo</th>
                    <th>Acciones</th>
                </tr>
                ${data.users.map(u => `
                    <tr>
                        <td>${u.name}</td>
                        <td>${u.email}</td>
                        <td>${u.role}</td>
                        <td>${u.isActive ? 'Sí' : 'No'}</td>
                        <td>
                            <button onclick="promoteToSeller('${u._id}')">Hacer vendedor</button>
                            <button onclick="deleteUser('${u._id}')">Eliminar</button>
                        </td>
                    </tr>
                `).join('')}
            `;
        }

        async function promoteToSeller(userId) {
            if (!confirm('¿Convertir a vendedor?')) return;
            const res = await fetch('/api/admin/users/' + userId, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + authToken
                },
                body: JSON.stringify({ role: 'vendedor' })
            });
            const data = await res.json();
            if (!res.ok) return alert('Error: ' + data.message);
            loadAdminUsers();
        }

        async function deleteUser(userId) {
            if (!confirm('¿Eliminar usuario?')) return;
            const res = await fetch('/api/admin/users/' + userId, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + authToken }
            });
            const data = await res.json();
            if (!res.ok) return alert('Error: ' + data.message);
            loadAdminUsers();
        }

        // =============== ADMIN: PUBLICACIONES =============
        async function loadPendingPublications() {
            if (!authToken) return alert('No autenticado');

            const res = await apiFetch('/api/admin/publications?status=pendiente');

            const data = await res.json();
            if (!res.ok) {
                return alert('Error: ' + data.message);
            }

            const table = document.getElementById('admin-publications-table');
            table.innerHTML = `
                <tr>
                    <th>Carta</th>
                    <th>Vendedor</th>
                    <th>Precio</th>
                    <th>Acciones</th>
                </tr>
                ${data.listings.map(p => `
                    <tr>
                        <td>${p.card?.name || p.cardId}</td>
                        <td>${p.sellerId?.name || 'N/A'} (${p.sellerId?.email || ''})</td>
                        <td>${p.price}</td>
                        <td>
                            <button onclick="approvePublication('${p._id}')">Aprobar</button>
                            <button onclick="rejectPublication('${p._id}')">Rechazar</button>
                            <button onclick="deletePublication('${p._id}')">Eliminar</button>
                        </td>
                    </tr>
                `).join('')}
            `;
        }

        async function approvePublication(id) {
            const res = await apiFetch('/api/admin/publications/' + id + '/status', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'aprobada' })
            });
            const data = await res.json();
            if (!res.ok) return alert('Error: ' + data.message);
            loadPendingPublications();
        }

        async function rejectPublication(id) {
            const rejectionReason = prompt('Motivo de rechazo:');
            if (rejectionReason === null) return;
            if (!rejectionReason.trim()) return alert('Debes indicar un motivo.');

            const res = await apiFetch('/api/admin/publications/' + id + '/status', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'rechazada', rejectionReason })
            });
            const data = await res.json();
            if (!res.ok) return alert('Error: ' + data.message);
            loadPendingPublications();
        }

        async function deletePublication(id) {
            if (!confirm('¿Eliminar publicación?')) return;
            const res = await apiFetch('/api/admin/publications/' + id, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) return alert('Error: ' + data.message);
            loadPendingPublications();
        }
