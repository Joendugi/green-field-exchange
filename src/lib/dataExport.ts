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

import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";

export const exportUserData = async (userId: string) => {
  try {
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;

    // Fetch all user data
    const [profileData, productsData, ordersData, postsData] = await Promise.all([
      databases.getDocument(dbId, 'profiles', userId).catch(() => null),
      databases.listDocuments(dbId, 'products', [Query.equal('farmer_id', userId)]).catch(() => ({ documents: [] })),
      databases.listDocuments(dbId, 'orders', [
        Query.or([
          Query.equal('buyer_id', userId),
          Query.equal('farmer_id', userId)
        ])
      ]).catch(() => ({ documents: [] })),
      databases.listDocuments(dbId, 'posts', [Query.equal('user_id', userId)]).catch(() => ({ documents: [] })),
    ]);

    // Export each dataset
    if (profileData) {
      exportToCSV([profileData], `agrilink_profile_${new Date().toISOString().split('T')[0]}.csv`);
    }

    if (productsData.documents && productsData.documents.length > 0) {
      exportToCSV(productsData.documents, `agrilink_products_${new Date().toISOString().split('T')[0]}.csv`);
    }

    if (ordersData.documents && ordersData.documents.length > 0) {
      exportToCSV(ordersData.documents, `agrilink_orders_${new Date().toISOString().split('T')[0]}.csv`);
    }

    if (postsData.documents && postsData.documents.length > 0) {
      exportToCSV(postsData.documents, `agrilink_posts_${new Date().toISOString().split('T')[0]}.csv`);
    }

    return { success: true };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, error };
  }
};

export const exportSystemData = async () => {
  try {
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const limit = 1000; // Basic limit for now

    // Fetch all system data
    const [profiles, products, orders, messages, notifications] = await Promise.all([
      databases.listDocuments(dbId, 'profiles', [Query.limit(limit)]).catch(() => ({ documents: [] })),
      databases.listDocuments(dbId, 'products', [Query.limit(limit)]).catch(() => ({ documents: [] })),
      databases.listDocuments(dbId, 'orders', [Query.limit(limit)]).catch(() => ({ documents: [] })),
      databases.listDocuments(dbId, 'messages', [Query.limit(limit)]).catch(() => ({ documents: [] })),
      databases.listDocuments(dbId, 'notifications', [Query.limit(limit)]).catch(() => ({ documents: [] })),
    ]);

    const date = new Date().toISOString().split('T')[0];

    if (profiles.documents.length > 0) exportToCSV(profiles.documents, `system_users_${date}.csv`);
    if (products.documents.length > 0) exportToCSV(products.documents, `system_products_${date}.csv`);
    if (orders.documents.length > 0) exportToCSV(orders.documents, `system_orders_${date}.csv`);
    if (messages.documents.length > 0) exportToCSV(messages.documents, `system_chat_logs_${date}.csv`);
    if (notifications.documents.length > 0) exportToCSV(notifications.documents, `system_activity_logs_${date}.csv`);

    return {
      success: true, count: {
        users: profiles.documents.length,
        products: products.documents.length,
        orders: orders.documents.length,
        messages: messages.documents.length,
        notifications: notifications.documents.length
      }
    };
  } catch (error) {
    console.error('System Export error:', error);
    return { success: false, error };
  }
};
