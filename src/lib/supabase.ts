import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gzwkjigxxpbacgigftil.supabase.co';
const supabaseKey =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6d2tqaWd4eHBiYWNnaWdmdGlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MjI0MjUsImV4cCI6MjA3OTM5ODQyNX0.p9sdXP7iS7u1xfbGWh1G7rHW146jRWRtlMzkeXXIIgU';

export const supabase = createClient(supabaseUrl, supabaseKey);
