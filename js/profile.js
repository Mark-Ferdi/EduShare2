// ========= PROFILE =========
const Profile = {
  async load() {
    await Auth.loadProfile();
    const user    = Auth.currentUser;
    const profile = Auth.currentProfile;

    if (!user) return;

    // Header info
    const name  = profile?.name || user.email?.split('@')[0] || 'Student';
    const email = user.email || '';
    const joined = profile?.created_at
      ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      : '';

    document.getElementById('profile-name').textContent  = name;
    document.getElementById('profile-email').textContent = email;
    document.getElementById('profile-joined').textContent = joined ? `Member since ${joined}` : '';
    document.getElementById('profile-avatar').textContent = name[0]?.toUpperCase() || '?';

    // Load items and posts in parallel
    const [{ data: items }, { data: posts }] = await Promise.all([
      supabase.from('items').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('posts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);

    // Stats
    document.getElementById('stat-items').textContent = items?.length || 0;
    document.getElementById('stat-posts').textContent  = posts?.length || 0;

    // My Items
    const myItemsGrid  = document.getElementById('my-items-grid');
    const myItemsEmpty = document.getElementById('my-items-empty');
    if (items?.length) {
      myItemsEmpty.classList.add('hidden');
      myItemsGrid.innerHTML = items.map(item => Marketplace.renderCard(item)).join('');
      myItemsGrid.querySelectorAll('.item-card').forEach((card, i) => {
        card.addEventListener('click', () => Modals.openItemDetailModal(items[i], name));
      });
    } else {
      myItemsGrid.innerHTML = '';
      myItemsEmpty.classList.remove('hidden');
    }

    // My Posts
    const myPostsFeed  = document.getElementById('my-posts-feed');
    const myPostsEmpty = document.getElementById('my-posts-empty');
    if (posts?.length) {
      myPostsEmpty.classList.add('hidden');
      // Get upvote counts
      const ids = posts.map(p => p.id);
      const { data: upvoteData } = await supabase.from('upvotes').select('post_id').in('post_id', ids);
      const counts = {};
      (upvoteData || []).forEach(r => { counts[r.post_id] = (counts[r.post_id] || 0) + 1; });
      posts.forEach(p => { p._upvotes = counts[p.id] || 0; });
      const userUpvotes = new Set();
      myPostsFeed.innerHTML = posts.map(post => Advice.renderPost(post, name)).join('');
      myPostsFeed.querySelectorAll('.upvote-btn').forEach(btn => {
        btn.addEventListener('click', () => Advice.toggleUpvote(btn.dataset.postId));
      });
      myPostsFeed.querySelectorAll('.post-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (confirm('Delete this post?')) Advice.deletePost(btn.dataset.postId);
        });
      });
    } else {
      myPostsFeed.innerHTML = '';
      myPostsEmpty.classList.remove('hidden');
    }
  },
};
