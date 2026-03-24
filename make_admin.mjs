import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = 'https://ktrisnezcdsedqrsiujr.supabase.co';
const supabaseServiceKey = 'sb_secret_key_placeholder'; // We'll need to get this from .env

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function getUserByEmail(email) {
  const { data, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error("Error listing users:", error);
    throw error;
  }
  
  const user = data.users.find(u => u.email === email);
  return user || null;
}

async function makeUserAdmin(email) {
  try {
    console.log(`Finding user with email: ${email}`);
    
    // Get the user by email
    const user = await getUserByEmail(email);
    
    if (!user) {
      console.error(`User with email ${email} not found`);
      return;
    }
    
    console.log(`Found user: ${user.id} (${user.email})`);
    
    // Update the user's role to 'admin' directly in the database
    const { error } = await supabase
      .from('user_roles')
      .upsert({ 
        user_id: user.id, 
        role: 'admin',
        created_at: new Date().toISOString()
      }, { 
        onConflict: 'user_id,role' 
      });
    
    if (error) {
      console.error("Error updating user role:", error);
      throw error;
    }
    
    console.log(`Successfully made ${email} an admin`);
    
  } catch (error) {
    console.error("Error making user admin:", error);
    throw error;
  }
}

// Make joeeroctib@gmail.com an admin
makeUserAdmin("joeeroctib@gmail.com");
