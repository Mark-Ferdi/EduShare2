// ========= NAVIGATION =========
const Nav = {
  current: 'marketplace',

  init() {
    // Bottom nav
    document.querySelectorAll('.bottom-nav-item').forEach(btn => {
      btn.addEventListener('click', () => this.goTo(btn.dataset.page));
    });
    // Desktop nav
    document.querySelectorAll('.desktop-nav .nav-item').forEach(btn => {
      btn.addEventListener('click', () => this.goTo(btn.dataset.page));
    });
    // FAB — on advice page, open post modal; else open item modal
    document.getElementById('fab-btn')?.addEventListener('click', () => {
      if (this.current === 'advice') {
        Modals.openPostModal();
      } else {
        Modals.openItemModal();
      }
    });
  },

  goTo(page) {
    if (this.current === page) return;
    this.current = page;

    // Update pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`${page}-page`)?.classList.add('active');

    // Update bottom nav
    document.querySelectorAll('.bottom-nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === page);
    });
    // Update desktop nav
    document.querySelectorAll('.desktop-nav .nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === page);
    });

    // Load page data
    if (page === 'marketplace') Marketplace.load();
    if (page === 'advice')      Advice.load();
    if (page === 'profile')     Profile.load();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },
};
