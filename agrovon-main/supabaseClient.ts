import { createClient } from '@supabase/supabase-js';

// REPLACE THESE WITH YOUR KEYS FROM SUPABASE DASHBOARD -> SETTINGS -> API
const SUPABASE_URL = 'https://kdochuishhqltcarvhks.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtkb2NodWlzaGhxbHRjYXJ2aGtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MjEzNDQsImV4cCI6MjA4NDk5NzM0NH0.QhqphVD5HefFyVnH5pcMAE-2I5f_HHr7HghWUXqycYA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);