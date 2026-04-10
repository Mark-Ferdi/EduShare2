// ========= ADVICE FEED =========
const Advice = {
  posts: [],
  userUpvotes: new Set(),
  filter: 'all',
  profileCache: {},

  async load() {
    this.showSkeletons();
    try {
      const [{ data: posts }, { data: upvotes }] = await Promise.all([
        supabase.from('posts').select('*').order('created_at', { ascending: false }),
        supabase.from('upvotes').select('post_id').eq('user_id', Auth.currentUser.id),
      ]);
      this.posts = posts || [];
      this.userUpvotes = new Set((upvotes || []).map(u => u.post_id));
      await this.loadUpvoteCounts();
      this.render();
    } catch (e) {
      Toast.error('Failed to load advice feed');
    }
  },

  async loadUpvoteCounts() {
    if (this.posts.length === 0) return;
    const ids = this.posts.map(p => p.id);
    const { data } = await supabase
      .from('upvotes')
      .select('post_id')
      .in('post_id', ids);
    const counts = {};
    (data || []).forEach(r => { counts[r.post_id] = (counts[r.post_id] || 0) + 1; });
    this.posts.forEach(p => { p._upvotes = counts[p.id] || 0; });
  },

  showSkeletons() {
    const feed = document.getElementById('posts-feed');
    feed.innerHTML = Array(3).fill('<div class="post-card skeleton tall"></div>').join('');
    document.getElementById('posts-empty').classList.add('hidden');
  },

  async render() {
    let posts = this.posts;
    if (this.filter !== 'all') posts = posts.filter(p => p.category === this.filter);

    const feed = document.getElementById('posts-feed');
    const empty = document.getElementById('posts-empty');

    if (posts.length === 0) {
      feed.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');

    const names = await this.resolveNames(posts.map(p => p.user_id));
    feed.innerHTML = posts.map(post => this.renderPost(post, names[post.user_id])).join('');

    // Upvote handlers
    feed.querySelectorAll('.upvote-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleUpvote(btn.dataset.postId);
      });
    });
    // Delete handlers
    feed.querySelectorAll('.post-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Delete this post?')) this.deletePost(btn.dataset.postId);
      });
    });
  },

  renderPost(post, authorName) {
    const isUpvoted = this.userUpvotes.has(post.id);
    const isOwner   = Auth.isOwner(post.user_id);
    const initial   = (authorName || '?')[0].toUpperCase();
    const timeAgo   = formatTimeAgo(post.created_at);

    return `
      <div class="post-card" data-post-id="${post.id}">
        <div class="post-card-header">
          <div class="post-author-info">
            <div class="author-avatar">${initial}</div>
            <div>
              <div class="author-name">${escapeHtml(authorName || 'Anonymous')}</div>
              <div class="post-time">${timeAgo}</div>
            </div>
          </div>
          <span class="post-category-badge">${escapeHtml(post.category)}</span>
        </div>
        <div class="post-content">${escapeHtml(post.content)}</div>
        <div class="post-card-footer">
          <button class="upvote-btn ${isUpvoted ? 'upvoted' : ''}" data-post-id="${post.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="${isUpvoted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/>
              <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>
            </svg>
            <span class="upvote-count">${post._upvotes || 0}</span>
          </button>
          ${isOwner ? `<button class="post-delete-btn" data-post-id="${post.id}" title="Delete">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
            </svg>
          </button>` : ''}
        </div>
      </div>
    `;
  },

  async toggleUpvote(postId) {
    const alreadyUpvoted = this.userUpvotes.has(postId);
    // Optimistic update
    const post = this.posts.find(p => p.id === postId);
    if (alreadyUpvoted) {
      this.userUpvotes.delete(postId);
      if (post) post._upvotes = Math.max(0, (post._upvotes || 1) - 1);
    } else {
      this.userUpvotes.add(postId);
      if (post) post._upvotes = (post._upvotes || 0) + 1;
    }
    this.render();

    try {
      if (alreadyUpvoted) {
        await supabase.from('upvotes').delete()
          .eq('user_id', Auth.currentUser.id).eq('post_id', postId);
      } else {
        await supabase.from('upvotes').insert([{
          user_id: Auth.currentUser.id,
          post_id: postId,
        }]);
      }
    } catch (e) {
      // Revert
      if (alreadyUpvoted) { this.userUpvotes.add(postId); if (post) post._upvotes++; }
      else { this.userUpvotes.delete(postId); if (post) post._upvotes--; }
      this.render();
      Toast.error('Failed to upvote');
    }
  },

  async savePost() {
    const btn = document.getElementById('save-post-btn');
    setButtonLoading(btn, true);
    try {
      const content  = document.getElementById('post-content').value.trim();
      const category = document.getElementById('post-category').value;
      if (!content) { Toast.error('Please write something'); return; }

      const { error } = await supabase.from('posts').insert([{
        user_id:    Auth.currentUser.id,
        content,
        category,
        created_at: new Date().toISOString(),
      }]);
      if (error) throw error;
      Toast.success('Advice posted!');
      Modals.close('post-modal');
      this.load();
    } catch (e) {
      Toast.error(e.message || 'Failed to post');
    } finally {
      setButtonLoading(btn, false);
    }
  },

  async deletePost(postId) {
    try {
      await supabase.from('upvotes').delete().eq('post_id', postId);
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
      Toast.success('Post deleted');
      this.load();
      if (Nav.current === 'profile') Profile.load();
    } catch (e) {
      Toast.error('Failed to delete post');
    }
  },

  async resolveNames(userIds) {
    const unique = [...new Set(userIds)].filter(id => !this.profileCache[id]);
    if (unique.length > 0) {
      const { data } = await supabase.from('profiles').select('id, name').in('id', unique);
      (data || []).forEach(p => { this.profileCache[p.id] = p.name; });
    }
    const result = {};
    userIds.forEach(id => { result[id] = this.profileCache[id] || 'Anonymous'; });
    return result;
  },

  initFilters() {
    document.querySelectorAll('#advice-filter-chips .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('#advice-filter-chips .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.filter = chip.dataset.filter;
        this.render();
      });
    });
    document.getElementById('save-post-btn')?.addEventListener('click', () => this.savePost());
  },
};

// ========= TIME FORMAT =========
function formatTimeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
