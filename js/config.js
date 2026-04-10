// =============================================
// EDUSHARE — SUPABASE CONFIG
// Replace with your actual Supabase credentials
// =============================================
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Storage bucket name (create in Supabase Storage)
const STORAGE_BUCKET = 'item-images';
