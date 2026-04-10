// ========= APP BOOTSTRAP =========
const App = {
  async init() {
    // Init UI components
    Modals.init();
    initAuthUI();

    // Check existing session
    const isLoggedIn = await Auth.init();
    if (isLoggedIn) {
      showApp();
    } else {
      showAuth();
    }

    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') showAuth();
    });
  },

  onSignedIn() {
    Nav.init();
    Marketplace.initFilters();
    Advice.initFilters();
    Marketplace.load();
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
