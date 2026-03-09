const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv');
dotenv.config();

const { SUPABASE_URL, SUPABASE_KEY } = process.env;

// Create a single supabase client for interacting with your database
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

module.exports = { supabase };