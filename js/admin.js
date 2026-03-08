/* ============================================================
   IMPULSE DRIVING SCHOOL - Admin Dashboard JavaScript
   Fetches data from API, renders tables, handles actions.
   ============================================================ */

(function () {
    'use strict';

    var API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : '';

    // ---- State ----
    var state = {
        stats: null,
        bookings: [],
        contacts: [],
        subscribers: [],
        currentSection: 'dashboard'
    };

    // ---- Confirm dialog state ----
    var pendingConfirm = null;

    // ========== INITIALISATION ==========

    function init() {
        bindNavigation();
        bindSidebar();
        bindRefresh();
        bindFilters();
        bindModals();
        loadAll();
    }

    // ========== NAVIGATION ==========

    function bindNavigation() {
        var navItems = document.querySelectorAll('[data-section]');
        for (var i = 0; i < navItems.length; i++) {
            (function (item) {
                item.addEventListener('click', function (e) {
                    e.preventDefault();
                    switchSection(item.getAttribute('data-section'));
                });
            })(navItems[i]);
        }
    }

    function switchSection(section) {
        state.currentSection = section;

        // Update nav active state
        var navItems = document.querySelectorAll('.sidebar-nav .nav-item');
        for (var i = 0; i < navItems.length; i++) {
            navItems[i].classList.toggle('active', navItems[i].getAttribute('data-section') === section);
        }

        // Show correct section
        var sections = document.querySelectorAll('.content-section');
        for (var j = 0; j < sections.length; j++) {
            sections[j].classList.toggle('active', sections[j].id === 'section-' + section);
        }

        // Update title
        var titles = { dashboard: 'Dashboard', bookings: 'Bookings', contacts: 'Messages', newsletter: 'Newsletter' };
        document.getElementById('pageTitle').textContent = titles[section] || 'Dashboard';

        // Close sidebar on mobile
        document.getElementById('sidebar').classList.remove('open');
    }

    // ========== SIDEBAR (MOBILE) ==========

    function bindSidebar() {
        document.getElementById('sidebarToggle').addEventListener('click', function () {
            document.getElementById('sidebar').classList.add('open');
        });
        document.getElementById('sidebarClose').addEventListener('click', function () {
            document.getElementById('sidebar').classList.remove('open');
        });
    }

    // ========== REFRESH ==========

    function bindRefresh() {
        document.getElementById('refreshBtn').addEventListener('click', function () {
            var icon = this.querySelector('i');
            this.classList.add('spinning');
            icon.style.animation = 'spin 1s linear infinite';
            loadAll().then(function () {
                icon.style.animation = '';
            });
        });
    }

    // ========== FILTERS ==========

    function bindFilters() {
        var bookingStatus = document.getElementById('bookingStatusFilter');
        var bookingSearch = document.getElementById('bookingSearch');
        var contactStatus = document.getElementById('contactStatusFilter');
        var contactSearch = document.getElementById('contactSearch');
        var newsletterSearch = document.getElementById('newsletterSearch');

        bookingStatus.addEventListener('change', renderBookings);
        bookingSearch.addEventListener('input', renderBookings);
        contactStatus.addEventListener('change', renderContacts);
        contactSearch.addEventListener('input', renderContacts);
        newsletterSearch.addEventListener('input', renderNewsletter);
    }

    // ========== MODALS ==========

    function bindModals() {
        // Detail modal
        document.getElementById('modalClose').addEventListener('click', closeDetailModal);
        document.getElementById('detailModal').addEventListener('click', function (e) {
            if (e.target === this) closeDetailModal();
        });

        // Confirm dialog
        document.getElementById('confirmClose').addEventListener('click', closeConfirmDialog);
        document.getElementById('confirmCancel').addEventListener('click', closeConfirmDialog);
        document.getElementById('confirmOk').addEventListener('click', function () {
            if (pendingConfirm) pendingConfirm();
            closeConfirmDialog();
        });
        document.getElementById('confirmDialog').addEventListener('click', function (e) {
            if (e.target === this) closeConfirmDialog();
        });

        // ESC key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                closeDetailModal();
                closeConfirmDialog();
            }
        });
    }

    function openDetailModal(title, html) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = html;
        document.getElementById('detailModal').classList.add('active');
    }

    function closeDetailModal() {
        document.getElementById('detailModal').classList.remove('active');
    }

    function openConfirmDialog(message, onConfirm) {
        document.getElementById('confirmMessage').textContent = message;
        pendingConfirm = onConfirm;
        document.getElementById('confirmDialog').classList.add('active');
    }

    function closeConfirmDialog() {
        document.getElementById('confirmDialog').classList.remove('active');
        pendingConfirm = null;
    }

    // ========== TOAST ==========

    function showToast(message, type) {
        type = type || 'info';
        var icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
        var container = document.getElementById('toastContainer');
        var toast = document.createElement('div');
        toast.className = 'toast toast-' + type;
        toast.innerHTML = '<i class="fas ' + (icons[type] || icons.info) + '"></i><span>' + escapeHtml(message) + '</span>';
        container.appendChild(toast);

        setTimeout(function () {
            toast.classList.add('toast-out');
            setTimeout(function () { toast.remove(); }, 300);
        }, 3000);
    }

    // ========== DATA LOADING ==========

    function loadAll() {
        return Promise.all([
            fetchJSON('/api/admin/stats'),
            fetchJSON('/api/admin/bookings'),
            fetchJSON('/api/admin/contacts'),
            fetchJSON('/api/admin/newsletter')
        ]).then(function (results) {
            if (results[0] && results[0].success) {
                state.stats = results[0].stats;
                renderStats();
            }
            if (results[1] && results[1].success) {
                state.bookings = results[1].bookings || [];
                renderBookings();
                renderRecentBookings();
            }
            if (results[2] && results[2].success) {
                state.contacts = results[2].contacts || [];
                renderContacts();
                renderRecentContacts();
            }
            if (results[3] && results[3].success) {
                state.subscribers = results[3].subscribers || [];
                renderNewsletter();
            }
        }).catch(function (err) {
            console.error('Failed to load admin data:', err);
            showToast('Failed to load data. Is the server running?', 'error');
        });
    }

    function fetchJSON(url, options) {
        return fetch(API_BASE + url, options).then(function (res) {
            return res.json();
        });
    }

    // ========== RENDER: STATS ==========

    function renderStats() {
        var s = state.stats;
        if (!s) return;
        document.getElementById('statTotalBookings').textContent = s.total_bookings;
        document.getElementById('statPendingBookings').textContent = s.pending_bookings;
        document.getElementById('statTotalContacts').textContent = s.total_contacts;
        document.getElementById('statUnreadContacts').textContent = s.unread_contacts;
        document.getElementById('statRevenue').textContent = '\u00A3' + Number(s.total_revenue).toLocaleString();
        document.getElementById('statSubscribers').textContent = s.total_subscribers;
    }

    // ========== RENDER: RECENT (DASHBOARD) ==========

    function renderRecentBookings() {
        var tbody = document.getElementById('recentBookingsBody');
        var recent = state.bookings.slice(0, 5);
        if (recent.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No bookings yet</td></tr>';
            return;
        }
        var html = '';
        for (var i = 0; i < recent.length; i++) {
            var b = recent[i];
            html += '<tr>'
                + '<td class="cell-ref">' + escapeHtml(b.reference) + '</td>'
                + '<td class="cell-name">' + escapeHtml(b.name) + '</td>'
                + '<td>' + escapeHtml(b.course) + '</td>'
                + '<td>' + formatDate(b.date) + '</td>'
                + '<td><span class="badge badge-' + b.status + '">' + b.status + '</span></td>'
                + '</tr>';
        }
        tbody.innerHTML = html;
    }

    function renderRecentContacts() {
        var tbody = document.getElementById('recentContactsBody');
        var recent = state.contacts.slice(0, 5);
        if (recent.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No messages yet</td></tr>';
            return;
        }
        var html = '';
        for (var i = 0; i < recent.length; i++) {
            var c = recent[i];
            html += '<tr class="' + (c.status === 'unread' ? 'unread' : '') + '">'
                + '<td class="cell-name">' + escapeHtml(c.name) + '</td>'
                + '<td>' + escapeHtml(c.subject) + '</td>'
                + '<td>' + formatDateTime(c.created_at) + '</td>'
                + '<td><span class="badge badge-' + c.status + '">' + c.status + '</span></td>'
                + '</tr>';
        }
        tbody.innerHTML = html;
    }

    // ========== RENDER: BOOKINGS ==========

    function renderBookings() {
        var tbody = document.getElementById('bookingsBody');
        var filtered = getFilteredBookings();
        document.getElementById('bookingsCount').textContent = filtered.length + ' booking' + (filtered.length !== 1 ? 's' : '');

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No bookings found</td></tr>';
            return;
        }

        var html = '';
        for (var i = 0; i < filtered.length; i++) {
            var b = filtered[i];
            html += '<tr data-id="' + b.id + '">'
                + '<td class="cell-ref">' + escapeHtml(b.reference) + '</td>'
                + '<td><span class="cell-name">' + escapeHtml(b.name) + '</span><br><span class="cell-email">' + escapeHtml(b.email) + '</span></td>'
                + '<td>' + escapeHtml(b.course) + '</td>'
                + '<td>' + escapeHtml(b.transmission || '') + '</td>'
                + '<td>' + formatDate(b.date) + '<br><span class="cell-email">' + escapeHtml(b.time_slot || '') + '</span></td>'
                + '<td><span class="badge badge-' + b.status + '">' + b.status + '</span></td>'
                + '<td><span class="badge badge-' + b.payment_status + '">' + b.payment_status + '</span></td>'
                + '<td><div class="action-group">'
                + '<button class="btn-action btn-view" title="View details" onclick="AdminPanel.viewBooking(' + b.id + ')"><i class="fas fa-eye"></i></button>'
                + '<select class="status-select" onchange="AdminPanel.updateBookingStatus(' + b.id + ', this.value)" title="Change status">'
                + statusOptions(['pending', 'confirmed', 'completed', 'cancelled'], b.status)
                + '</select>'
                + '<button class="btn-action btn-delete" title="Delete" onclick="AdminPanel.deleteBooking(' + b.id + ', \'' + escapeHtml(b.reference) + '\')"><i class="fas fa-trash"></i></button>'
                + '</div></td>'
                + '</tr>';
        }
        tbody.innerHTML = html;
    }

    function getFilteredBookings() {
        var status = document.getElementById('bookingStatusFilter').value;
        var search = document.getElementById('bookingSearch').value.toLowerCase();
        return state.bookings.filter(function (b) {
            if (status && b.status !== status) return false;
            if (search) {
                var hay = (b.name + ' ' + b.email + ' ' + b.reference + ' ' + b.course).toLowerCase();
                if (hay.indexOf(search) === -1) return false;
            }
            return true;
        });
    }

    // ========== RENDER: CONTACTS ==========

    function renderContacts() {
        var tbody = document.getElementById('contactsBody');
        var filtered = getFilteredContacts();
        document.getElementById('contactsCount').textContent = filtered.length + ' message' + (filtered.length !== 1 ? 's' : '');

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No messages found</td></tr>';
            return;
        }

        var html = '';
        for (var i = 0; i < filtered.length; i++) {
            var c = filtered[i];
            html += '<tr class="' + (c.status === 'unread' ? 'unread' : '') + '" data-id="' + c.id + '">'
                + '<td class="cell-name">' + escapeHtml(c.name) + '</td>'
                + '<td>' + escapeHtml(c.email) + '</td>'
                + '<td>' + escapeHtml(c.phone || '-') + '</td>'
                + '<td>' + escapeHtml(c.subject) + '</td>'
                + '<td class="cell-message" onclick="AdminPanel.viewContact(' + c.id + ')" title="Click to read">' + escapeHtml(c.message) + '</td>'
                + '<td>' + formatDateTime(c.created_at) + '</td>'
                + '<td><span class="badge badge-' + c.status + '">' + c.status + '</span></td>'
                + '<td><div class="action-group">'
                + '<button class="btn-action btn-view" title="View" onclick="AdminPanel.viewContact(' + c.id + ')"><i class="fas fa-eye"></i></button>'
                + '<select class="status-select" onchange="AdminPanel.updateContactStatus(' + c.id + ', this.value)" title="Change status">'
                + statusOptions(['unread', 'read', 'replied'], c.status)
                + '</select>'
                + '<button class="btn-action btn-delete" title="Delete" onclick="AdminPanel.deleteContact(' + c.id + ')"><i class="fas fa-trash"></i></button>'
                + '</div></td>'
                + '</tr>';
        }
        tbody.innerHTML = html;
    }

    function getFilteredContacts() {
        var status = document.getElementById('contactStatusFilter').value;
        var search = document.getElementById('contactSearch').value.toLowerCase();
        return state.contacts.filter(function (c) {
            if (status && c.status !== status) return false;
            if (search) {
                var hay = (c.name + ' ' + c.email + ' ' + c.subject).toLowerCase();
                if (hay.indexOf(search) === -1) return false;
            }
            return true;
        });
    }

    // ========== RENDER: NEWSLETTER ==========

    function renderNewsletter() {
        var tbody = document.getElementById('newsletterBody');
        var filtered = getFilteredSubscribers();
        document.getElementById('newsletterCount').textContent = filtered.length + ' subscriber' + (filtered.length !== 1 ? 's' : '');

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No subscribers found</td></tr>';
            return;
        }

        var html = '';
        for (var i = 0; i < filtered.length; i++) {
            var s = filtered[i];
            var statusClass = s.active ? 'active' : 'inactive';
            var statusText = s.active ? 'Active' : 'Inactive';
            html += '<tr data-id="' + s.id + '">'
                + '<td>' + escapeHtml(s.email) + '</td>'
                + '<td>' + formatDateTime(s.subscribed_at) + '</td>'
                + '<td><span class="badge badge-' + statusClass + '">' + statusText + '</span></td>'
                + '<td><div class="action-group">'
                + '<button class="btn-action btn-delete" title="Remove subscriber" onclick="AdminPanel.deleteSubscriber(' + s.id + ', \'' + escapeHtml(s.email) + '\')"><i class="fas fa-trash"></i></button>'
                + '</div></td>'
                + '</tr>';
        }
        tbody.innerHTML = html;
    }

    function getFilteredSubscribers() {
        var search = document.getElementById('newsletterSearch').value.toLowerCase();
        return state.subscribers.filter(function (s) {
            if (search && s.email.toLowerCase().indexOf(search) === -1) return false;
            return true;
        });
    }

    // ========== ACTIONS: BOOKINGS ==========

    function viewBooking(id) {
        var b = findById(state.bookings, id);
        if (!b) return;

        var html = ''
            + detailRow('Reference', b.reference)
            + detailRow('Customer', b.name)
            + detailRow('Email', b.email)
            + detailRow('Phone', b.phone)
            + detailRow('Course', b.course)
            + detailRow('Transmission', b.transmission)
            + detailRow('Date', formatDate(b.date))
            + detailRow('Time Slot', b.time_slot)
            + detailRow('Status', '<span class="badge badge-' + b.status + '">' + b.status + '</span>')
            + detailRow('Payment', '<span class="badge badge-' + b.payment_status + '">' + b.payment_status + '</span>')
            + detailRow('Amount', b.payment_amount ? '\u00A3' + Number(b.payment_amount).toLocaleString() : '-')
            + detailRow('Notes', b.notes || '-')
            + detailRow('Created', formatDateTime(b.created_at));

        openDetailModal('Booking ' + b.reference, html);
    }

    function updateBookingStatus(id, status) {
        fetchJSON('/api/admin/bookings/' + id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: status })
        }).then(function (result) {
            if (result.success) {
                updateLocalBooking(id, result.booking);
                showToast('Booking status updated to ' + status, 'success');
            } else {
                showToast(result.error || 'Update failed', 'error');
            }
        }).catch(function () {
            showToast('Failed to update booking', 'error');
        });
    }

    function deleteBooking(id, ref) {
        openConfirmDialog('Delete booking ' + ref + '? This cannot be undone.', function () {
            fetchJSON('/api/admin/bookings/' + id, { method: 'DELETE' })
                .then(function (result) {
                    if (result.success) {
                        state.bookings = state.bookings.filter(function (b) { return b.id !== id; });
                        renderBookings();
                        renderRecentBookings();
                        reloadStats();
                        showToast('Booking deleted', 'success');
                    } else {
                        showToast(result.error || 'Delete failed', 'error');
                    }
                }).catch(function () {
                    showToast('Failed to delete booking', 'error');
                });
        });
    }

    function updateLocalBooking(id, updated) {
        for (var i = 0; i < state.bookings.length; i++) {
            if (state.bookings[i].id === id) {
                state.bookings[i] = updated;
                break;
            }
        }
        renderBookings();
        renderRecentBookings();
        reloadStats();
    }

    // ========== ACTIONS: CONTACTS ==========

    function viewContact(id) {
        var c = findById(state.contacts, id);
        if (!c) return;

        var html = ''
            + detailRow('Name', c.name)
            + detailRow('Email', c.email)
            + detailRow('Phone', c.phone || '-')
            + detailRow('Subject', c.subject)
            + detailRow('Message', '<div style="white-space: pre-wrap;">' + escapeHtml(c.message) + '</div>')
            + detailRow('Status', '<span class="badge badge-' + c.status + '">' + c.status + '</span>')
            + detailRow('Received', formatDateTime(c.created_at));

        openDetailModal('Message from ' + c.name, html);

        // Auto-mark as read
        if (c.status === 'unread') {
            updateContactStatus(id, 'read');
        }
    }

    function updateContactStatus(id, status) {
        fetchJSON('/api/admin/contacts/' + id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: status })
        }).then(function (result) {
            if (result.success) {
                updateLocalContact(id, result.contact);
                showToast('Contact marked as ' + status, 'success');
            } else {
                showToast(result.error || 'Update failed', 'error');
            }
        }).catch(function () {
            showToast('Failed to update contact', 'error');
        });
    }

    function deleteContact(id) {
        openConfirmDialog('Delete this message? This cannot be undone.', function () {
            fetchJSON('/api/admin/contacts/' + id, { method: 'DELETE' })
                .then(function (result) {
                    if (result.success) {
                        state.contacts = state.contacts.filter(function (c) { return c.id !== id; });
                        renderContacts();
                        renderRecentContacts();
                        reloadStats();
                        showToast('Message deleted', 'success');
                    } else {
                        showToast(result.error || 'Delete failed', 'error');
                    }
                }).catch(function () {
                    showToast('Failed to delete message', 'error');
                });
        });
    }

    function updateLocalContact(id, updated) {
        for (var i = 0; i < state.contacts.length; i++) {
            if (state.contacts[i].id === id) {
                state.contacts[i] = updated;
                break;
            }
        }
        renderContacts();
        renderRecentContacts();
        reloadStats();
    }

    // ========== ACTIONS: NEWSLETTER ==========

    function deleteSubscriber(id, email) {
        openConfirmDialog('Remove subscriber ' + email + '?', function () {
            fetchJSON('/api/admin/newsletter/' + id, { method: 'DELETE' })
                .then(function (result) {
                    if (result.success) {
                        state.subscribers = state.subscribers.filter(function (s) { return s.id !== id; });
                        renderNewsletter();
                        reloadStats();
                        showToast('Subscriber removed', 'success');
                    } else {
                        showToast(result.error || 'Delete failed', 'error');
                    }
                }).catch(function () {
                    showToast('Failed to remove subscriber', 'error');
                });
        });
    }

    // ========== HELPERS ==========

    function reloadStats() {
        fetchJSON('/api/admin/stats').then(function (result) {
            if (result.success) {
                state.stats = result.stats;
                renderStats();
            }
        });
    }

    function findById(arr, id) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].id === id) return arr[i];
        }
        return null;
    }

    function statusOptions(values, current) {
        var html = '';
        for (var i = 0; i < values.length; i++) {
            html += '<option value="' + values[i] + '"' + (values[i] === current ? ' selected' : '') + '>' + capitalize(values[i]) + '</option>';
        }
        return html;
    }

    function detailRow(label, value) {
        return '<div class="detail-row"><span class="detail-label">' + escapeHtml(label) + '</span><span class="detail-value">' + value + '</span></div>';
    }

    function formatDate(dateStr) {
        if (!dateStr) return '-';
        try {
            var d = new Date(dateStr + (dateStr.indexOf('T') === -1 ? 'T00:00:00' : ''));
            return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch (e) {
            return dateStr;
        }
    }

    function formatDateTime(dateStr) {
        if (!dateStr) return '-';
        try {
            var d = new Date(dateStr);
            return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return dateStr;
        }
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function escapeHtml(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    // ========== PUBLIC API (for onclick handlers) ==========

    window.AdminPanel = {
        viewBooking: viewBooking,
        updateBookingStatus: updateBookingStatus,
        deleteBooking: deleteBooking,
        viewContact: viewContact,
        updateContactStatus: updateContactStatus,
        deleteContact: deleteContact,
        deleteSubscriber: deleteSubscriber
    };

    // ========== START ==========

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
