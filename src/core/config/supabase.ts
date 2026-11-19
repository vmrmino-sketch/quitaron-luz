import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dxoicoirasrctloiwosr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_GQekCJjFIqkQ40nkMc6eMQ_bQ5uoNYJ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);