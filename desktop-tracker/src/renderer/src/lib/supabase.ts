import { createClient } from '@supabase/supabase-js'

// These are public/anon keys — safe to include in desktop apps
const supabaseUrl = 'https://hyhnivzbnmcmjpreqgvx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aG5pdnpibm1jbWpwcmVxZ3Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5OTQ1MjAsImV4cCI6MjA4NzU3MDUyMH0.dQ6uwTiXl_XvI7MR8RGwe6OsqzGqhi0Rv2wh6XzRov8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Production API URL — TeamoraPH website on Vercel
export const API_URL = 'https://teamora-ph-rose.vercel.app'
