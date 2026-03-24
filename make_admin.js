const { supabase } = require("./src/integrations/supabase/client");
const { updateRole } = require("./src/integrations/supabase/admin");

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
    
    // Update the user's role to 'admin'
    await updateRole(user.id, 'admin');
    
    console.log(`Successfully made ${email} an admin`);
    
  } catch (error) {
    console.error("Error making user admin:", error);
    throw error;
  }
}

// Make joeeroctib@gmail.com an admin
makeUserAdmin("joeeroctib@gmail.com");
