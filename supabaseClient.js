// supabaseClient.js
const { createClient } = require('@supabase/supabase-js');

// Replace with your actual keys
const supabaseUrl = 'https://your-project-id.supabase.cohttps://zxscemvhpjtqmdrdymja.supabase.co';
const supabaseKey = 'your-aneyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4c2NlbXZocGp0cW1kcmR5bWphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4Njc5ODAsImV4cCI6MjA2MDQ0Mzk4MH0.NwUj7FeAEboYayc1rpist1zyGJUVA8kE2hM3JL9m3WAon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
