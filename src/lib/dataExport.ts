// Data export utilities for user data portability

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) {
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Handle values that might contain commas or quotes
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

export const exportUserData = async (supabase: any, userId: string) => {
  try {
    // Fetch all user data
    const [profileData, productsData, ordersData, postsData] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('products').select('*').eq('farmer_id', userId),
      supabase.from('orders').select('*').or(`buyer_id.eq.${userId},farmer_id.eq.${userId}`),
      supabase.from('posts').select('*').eq('user_id', userId),
    ]);

    // Export each dataset
    if (profileData.data) {
      exportToCSV([profileData.data], `agrilink_profile_${new Date().toISOString().split('T')[0]}.csv`);
    }

    if (productsData.data && productsData.data.length > 0) {
      exportToCSV(productsData.data, `agrilink_products_${new Date().toISOString().split('T')[0]}.csv`);
    }

    if (ordersData.data && ordersData.data.length > 0) {
      exportToCSV(ordersData.data, `agrilink_orders_${new Date().toISOString().split('T')[0]}.csv`);
    }

    if (postsData.data && postsData.data.length > 0) {
      exportToCSV(postsData.data, `agrilink_posts_${new Date().toISOString().split('T')[0]}.csv`);
    }

    return { success: true };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, error };
  }
};
