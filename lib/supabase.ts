import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gulufjpszyanwfinpwvn.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1bHVmanBzenlhbndmaW5wd3ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTAyMjEsImV4cCI6MjA2ODI2NjIyMX0.Bh1X3cuLaD_stb2hdsdVFkAf0qdzAr_Sj33hWUZeYtc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})