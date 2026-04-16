import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://resoeniuxsbpjtxpenab.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlc29lbml1eHNicGp0eHBlbmFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNTAxNDksImV4cCI6MjA5MTkyNjE0OX0.yVIUeSf8dpcTZPDT15dm0zKURmNEOKEYzrvVS_Aq6lM'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)