// ========= MARKETPLACE =========
const Marketplace = {
  items: [],
  filter: 'all',
  search: '',
  profileCache: {},

  async load() {
    this.showSkeletons();
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      this.items = data || [];
      this.render();
    } catch (e) {
      Toast.error('Failed to load marketplace');
      document.getElementById('items-grid').innerHTML = '';
    }
  },

  showSkeletons() {
    const grid = document.getElementById('items-grid');
    grid.innerHTML = Array(4).fill('<div class="item-card skeleton"></div>').join('');
    document.getElementById('items-empty').classList.add('hidden');
  },

  render() {
    let items = this.items;
    if (this.filter !== 'all') items = items.filter(i => i.category === this.filter);
    if (this.search) {
      const q = this.search.toLowerCase();
      items = items.filter(i =>
        (i.title || '').toLowerCase().includes(q) ||
        (i.subject || '').toLowerCase().includes(q) ||
        (i.category || '').toLowerCase().includes(q)
      );
    }

    const grid = document.getElementById('items-grid');
    const empty = document.getElementById('items-empty');

    if (items.length === 0) {
      grid.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');
    grid.innerHTML = items.map(item => this.renderCard(item)).join('');

    // Attach click handlers
    grid.querySelectorAll('.item-card').forEach((card, i) => {
      const item = items[i];
      card.addEventListener('click', async () => {
        const ownerName = await this.getOwnerName(item.user_id);
        Modals.openItemDetailModal(item, ownerName);
      });
    });
  },

  renderCard(item) {
    const isOwner = Auth.isOwner(item.user_id);
    const imageEl = item.image_url
      ? `<img src="${item.image_url}" alt="${item.title}" loading="lazy" />`
      : getCategoryEmoji(item.category);

    return `
      <div class="item-card" data-id="${item.id}">
        <div class="item-card-image">${imageEl}</div>
        <div class="item-card-body">
          <div class="item-card-title">${escapeHtml(item.title)}</div>
          <div class="item-subject">${escapeHtml(item.subject || item.category || '')}</div>
          <div class="item-card-meta">
            <span class="${item.price ? 'item-price' : 'item-price free'}">${item.price ? '₹' + item.price : 'Free'}</span>
            <span class="badge badge-${item.status}">${item.status}</span>
          </div>
        </div>
      </div>
    `;
  },

  async getOwnerName(userId) {
    if (this.profileCache[userId]) return this.profileCache[userId];
    const { data } = await supabase.from('profiles').select('name').eq('id', userId).single();
    this.profileCache[userId] = data?.name || 'Unknown';
    return this.profileCache[userId];
  },

  async saveItem() {
    const btn = document.getElementById('save-item-btn');
    setButtonLoading(btn, true);
    try {
      const editId = document.getElementById('edit-item-id').value;
      const title  = document.getElementById('item-title').value.trim();
      if (!title) { Toast.error('Title is required'); return; }

      let image_url = null;
      const fileInput = document.getElementById('item-image');
      if (fileInput.files[0]) {
        image_url = await this.uploadImage(fileInput.files[0]);
      } else if (editId) {
        // Keep existing image
        const existing = this.items.find(i => i.id === editId);
        image_url = existing?.image_url || null;
      }

      const payload = {
        title,
        subject:   document.getElementById('item-subject').value.trim(),
        category:  document.getElementById('item-category').value,
        condition: document.getElementById('item-condition').value,
        price:     parseFloat(document.getElementById('item-price').value) || null,
        location:  document.getElementById('item-location').value.trim(),
        status:    document.getElementById('item-status').value,
        user_id:   Auth.currentUser.id,
        image_url,
      };

      if (editId) {
        const { error } = await supabase.from('items').update(payload).eq('id', editId);
        if (error) throw error;
        Toast.success('Item updated!');
      } else {
        const { error } = await supabase.from('items').insert([{ ...payload, created_at: new Date().toISOString() }]);
        if (error) throw error;
        Toast.success('Item listed!');
      }

      Modals.close('item-modal');
      this.load();
    } catch (e) {
      Toast.error(e.message || 'Failed to save item');
    } finally {
      setButtonLoading(btn, false);
    }
  },

  async uploadImage(file) {
    const ext = file.name.split('.').pop();
    const path = `${Auth.currentUser.id}/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.path);
    return publicUrl;
  },

  async deleteItem(id) {
    try {
      const { error } = await supabase.from('items').delete().eq('id', id);
      if (error) throw error;
      Toast.success('Item removed');
      this.load();
      if (Nav.current === 'profile') Profile.load();
    } catch (e) {
      Toast.error('Failed to delete item');
    }
  },

  initFilters() {
    // Category chips
    document.querySelectorAll('#filter-chips .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('#filter-chips .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.filter = chip.dataset.filter;
        this.render();
      });
    });

    // Search input
    let debounce;
    document.getElementById('search-input')?.addEventListener('input', (e) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        this.search = e.target.value.trim();
        this.render();
      }, 280);
    });

    // Save item
    document.getElementById('save-item-btn')?.addEventListener('click', () => this.saveItem());
  },
};

// ========= HELPERS =========
function getCategoryEmoji(cat) {
  const map = { Books: '📚', Notes: '📝', Equipment: '🔬', Software: '💿', Other: '📦' };
  return map[cat] || '📦';
}
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
