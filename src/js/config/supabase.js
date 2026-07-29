import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = 'https://qpmglhxlnbdzozrtffmf.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwbWdsaHhsbmJkem96cnRmZm1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1ODAyOTEsImV4cCI6MjA5MzE1NjI5MX0.LxZ-w8fkYv3wLcCyyxp8nft9uh1YI9kaV12mzUjh8YA'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
