// ========= MODAL MANAGER =========
const Modals = {
  open(id) {
    document.getElementById(id)?.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },
  close(id) {
    document.getElementById(id)?.classList.add('hidden');
    document.body.style.overflow = '';
  },

  openItemModal(item = null) {
    // Reset form
    document.getElementById('edit-item-id').value = item?.id || '';
    document.getElementById('item-title').value    = item?.title || '';
    document.getElementById('item-subject').value  = item?.subject || '';
    document.getElementById('item-category').value = item?.category || 'Books';
    document.getElementById('item-condition').value= item?.condition || 'Good';
    document.getElementById('item-price').value    = item?.price || '';
    document.getElementById('item-location').value = item?.location || '';
    document.getElementById('item-status').value   = item?.status || 'available';
    document.getElementById('item-modal-title').textContent = item ? 'Edit Item' : 'List an Item';
    document.getElementById('save-item-btn').querySelector('.btn-text').textContent = item ? 'Save Changes' : 'List Item';
    // Reset image
    document.getElementById('image-preview').classList.add('hidden');
    document.getElementById('file-upload-placeholder').classList.remove('hidden');
    document.getElementById('item-image').value = '';
    this.open('item-modal');
  },

  openItemDetailModal(item, ownerName) {
    document.getElementById('detail-title').textContent = item.title;
    const img = document.getElementById('detail-image');
    const placeholder = document.getElementById('detail-image-placeholder');
    if (item.image_url) {
      img.src = item.image_url;
      img.classList.remove('hidden');
      placeholder.classList.add('hidden');
    } else {
      img.classList.add('hidden');
      placeholder.classList.remove('hidden');
    }

    const statusBadge = document.getElementById('detail-status-badge');
    statusBadge.textContent = item.status;
    statusBadge.className = `badge badge-${item.status}`;

    document.getElementById('detail-category-badge').textContent = item.category || '—';
    document.getElementById('detail-price').textContent = item.price ? `₹${item.price}` : 'Free';
    document.getElementById('detail-subject').textContent = item.subject || '—';
    document.getElementById('detail-condition').textContent = item.condition || '—';
    document.getElementById('detail-location').textContent = item.location || '—';
    document.getElementById('detail-owner').textContent = ownerName || '—';

    // Owner actions
    const actionsEl = document.getElementById('detail-actions');
    if (Auth.isOwner(item.user_id)) {
      actionsEl.innerHTML = `
        <button class="btn btn-ghost" data-close="item-detail-modal">Close</button>
        <button class="btn btn-ghost" id="edit-from-detail">Edit</button>
        <button class="btn btn-danger" id="delete-from-detail">Delete</button>
      `;
      document.getElementById('edit-from-detail').onclick = () => {
        this.close('item-detail-modal');
        this.openItemModal(item);
      };
      document.getElementById('delete-from-detail').onclick = async () => {
        if (!confirm('Delete this item?')) return;
        await Marketplace.deleteItem(item.id);
        this.close('item-detail-modal');
      };
    } else {
      actionsEl.innerHTML = `<button class="btn btn-ghost btn-full" data-close="item-detail-modal">Close</button>`;
    }
    this.open('item-detail-modal');
  },

  openPostModal() {
    document.getElementById('post-content').value  = '';
    document.getElementById('post-category').value = 'Academics';
    this.open('post-modal');
  },

  init() {
    // Close buttons
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => this.close(btn.dataset.close));
    });
    // Backdrop click closes
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.close(overlay.id);
      });
    });
    // Image preview
    document.getElementById('item-image')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const preview = document.getElementById('image-preview');
        preview.src = ev.target.result;
        preview.classList.remove('hidden');
        document.getElementById('file-upload-placeholder').classList.add('hidden');
      };
      reader.readAsDataURL(file);
    });
    // Desktop add buttons
    document.getElementById('add-item-btn-desktop')?.addEventListener('click', () => this.openItemModal());
    document.getElementById('add-post-btn-desktop')?.addEventListener('click', () => this.openPostModal());
  },
};
