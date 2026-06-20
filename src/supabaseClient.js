import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://aqmqwlakljxpxelvyzpc.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxbXF3bGFrbGp4cHhlbHZ5enBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MDU2NjMsImV4cCI6MjA5NzQ4MTY2M30.obt9IyUTal1qmp-GRlyLykAfS_lnZwQT7C2i55vdgbg"

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Sauvegarde une valeur sous une clé donnée
export async function saveData(key, value) {
  try {
    const { error } = await supabase
      .from('planning_data')
      .upsert({ key, value, updated_at: new Date().toISOString() })
    if (error) console.error('Erreur sauvegarde:', error)
  } catch (e) {
    console.error('Erreur sauvegarde:', e)
  }
}

// Charge une valeur depuis une clé donnée
export async function loadData(key) {
  try {
    const { data, error } = await supabase
      .from('planning_data')
      .select('value')
      .eq('key', key)
      .single()
    if (error) return null
    return data?.value ?? null
  } catch (e) {
    return null
  }
}
