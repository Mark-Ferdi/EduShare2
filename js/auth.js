// ========= AUTH =========
const Auth = {
  currentUser: null,
  currentProfile: null,

  async init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      this.currentUser = session.user;
      await this.loadProfile();
      return true;
    }
    return false;
  },

  async loadProfile() {
    if (!this.currentUser) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', this.currentUser.id)
      .single();
    this.currentProfile = data;
  },

  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    this.currentUser = data.user;
    await this.loadProfile();
    return data.user;
  },

  async signup(name, email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    this.currentUser = data.user;

    // Create profile
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        name: name,
        created_at: new Date().toISOString(),
      });
      if (profileError) console.error('Profile creation error:', profileError);
      await this.loadProfile();
    }
    return data.user;
  },

  async logout() {
    await supabase.auth.signOut();
    this.currentUser = null;
    this.currentProfile = null;
    location.reload();
  },

  isOwner(userId) {
    return this.currentUser?.id === userId;
  },
};

// ========= AUTH UI =========
function initAuthUI() {
  // Tab switching
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`${tab.dataset.tab}-form`).classList.add('active');
    });
  });

  // Login
  document.getElementById('login-btn').addEventListener('click', async () => {
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    if (!email || !password) { Toast.error('Please fill in all fields'); return; }

    const btn = document.getElementById('login-btn');
    setButtonLoading(btn, true);
    try {
      await Auth.login(email, password);
      showApp();
    } catch (e) {
      Toast.error(e.message || 'Login failed');
    } finally {
      setButtonLoading(btn, false);
    }
  });

  // Signup
  document.getElementById('signup-btn').addEventListener('click', async () => {
    const name     = document.getElementById('signup-name').value.trim();
    const email    = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    if (!name || !email || !password) { Toast.error('Please fill in all fields'); return; }
    if (password.length < 6) { Toast.error('Password must be at least 6 characters'); return; }

    const btn = document.getElementById('signup-btn');
    setButtonLoading(btn, true);
    try {
      await Auth.signup(name, email, password);
      Toast.success('Welcome to EduShare!');
      showApp();
    } catch (e) {
      Toast.error(e.message || 'Signup failed');
    } finally {
      setButtonLoading(btn, false);
    }
  });

  // Logout buttons
  document.getElementById('logout-btn-desktop')?.addEventListener('click', () => Auth.logout());
  document.getElementById('logout-btn-mobile')?.addEventListener('click', () => Auth.logout());
}

function showApp() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');
  App.onSignedIn();
}

function showAuth() {
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('app-shell').classList.add('hidden');
}

// Utility
function setButtonLoading(btn, loading) {
  btn.querySelector('.btn-text').classList.toggle('hidden', loading);
  btn.querySelector('.btn-spinner').classList.toggle('hidden', !loading);
  btn.disabled = loading;
}
