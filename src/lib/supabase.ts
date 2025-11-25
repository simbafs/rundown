import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gzwkjigxxpbacgigftil.supabase.co';
const supabaseKey = 'sb_publishable_5P0D8RY-KqM6N1Lq_qMpsg_oy8L5ft3';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const table = {
	entry: 'entry',
	user: 'user',
	team: 'team',
	team_member: 'team_member',
};
