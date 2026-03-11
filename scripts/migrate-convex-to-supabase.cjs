const fs = require('fs');
const path = require('path');

console.log('🔄 Convex to Supabase Data Migration Tool\n');

// This script would need to be run with both Convex and Supabase clients available
// For now, it's a template showing what needs to be migrated

const migrationPlan = {
  // Tables that need data migration from Convex to Supabase
  tables: [
    {
      name: 'profiles',
      convexQuery: 'api.users.getProfile',
      supabaseTable: 'profiles',
      mapping: {
        'userId': 'user_id',
        'username': 'username', 
        'fullName': 'full_name',
        'avatarUrl': 'avatar_url',
        'bio': 'bio',
        'location': 'location',
        'website': 'website',
        'verified': 'verified',
        'verificationRequested': 'verification_requested',
        'onboarded': 'onboarded',
        'createdAt': 'created_at',
        'updatedAt': 'updated_at'
      }
    },
    {
      name: 'products',
      convexQuery: 'api.products.list',
      supabaseTable: 'products',
      mapping: {
        'farmerId': 'farmer_id',
        'name': 'name',
        'description': 'description',
        'price': 'price',
        'quantity': 'quantity',
        'unit': 'unit',
        'category': 'category',
        'location': 'location',
        'imageUrl': 'image_url',
        'imageStorageId': null, // Skip - Supabase uses direct URLs
        'isAvailable': 'is_available',
        'isHidden': 'is_hidden',
        'isFeatured': 'is_featured',
        'featuredUntil': 'featured_until',
        'expiryDate': 'expiry_date',
        'currency': 'currency',
        'createdAt': 'created_at',
        'updatedAt': 'updated_at'
      }
    },
    {
      name: 'orders',
      convexQuery: 'api.orders.list',
      supabaseTable: 'orders',
      mapping: {
        'buyerId': 'buyer_id',
        'farmerId': 'farmer_id',
        'productId': 'product_id',
        'quantity': 'quantity',
        'totalPrice': 'total_price',
        'currency': 'currency',
        'status': 'status',
        'escrowStatus': 'escrow_status',
        'paymentType': 'payment_type',
        'deliveryAddress': 'delivery_address',
        'createdAt': 'created_at',
        'updatedAt': 'updated_at'
      }
    },
    {
      name: 'offers',
      convexQuery: 'api.offers.list',
      supabaseTable: 'offers',
      mapping: {
        'productId': 'product_id',
        'buyerId': 'buyer_id',
        'farmerId': 'farmer_id',
        'quantity': 'quantity',
        'amountPerUnit': 'amount_per_unit',
        'status': 'status',
        'lastOfferedBy': 'last_offered_by',
        'message': 'message',
        'createdAt': 'created_at',
        'updatedAt': 'updated_at'
      }
    },
    {
      name: 'messages',
      convexQuery: 'api.messages.list',
      supabaseTable: 'messages',
      mapping: {
        'conversationId': 'conversation_id',
        'senderId': 'sender_id',
        'content': 'content',
        'isRead': 'is_read',
        'createdAt': 'created_at'
      }
    },
    {
      name: 'conversations',
      convexQuery: 'api.conversations.list',
      supabaseTable: 'conversations',
      mapping: {
        'participant1_id': 'participant1_id',
        'participant2_id': 'participant2_id',
        'lastMessage': 'last_message',
        'lastSenderId': 'last_sender_id',
        'updatedAt': 'updated_at'
      }
    },
    {
      name: 'notifications',
      convexQuery: 'api.notifications.list',
      supabaseTable: 'notifications',
      mapping: {
        'userId': 'user_id',
        'title': 'title',
        'message': 'message',
        'isRead': 'is_read',
        'type': 'type',
        'link': 'link',
        'createdAt': 'created_at'
      }
    },
    {
      name: 'reviews',
      convexQuery: 'api.reviews.list',
      supabaseTable: 'reviews',
      mapping: {
        'reviewerId': 'reviewer_id',
        'revieweeId': 'reviewee_id',
        'productId': 'product_id',
        'rating': 'rating',
        'comment': 'comment',
        'createdAt': 'created_at'
      }
    },
    {
      name: 'user_roles',
      convexQuery: 'api.users.getRole',
      supabaseTable: 'user_roles',
      mapping: {
        'userId': 'user_id',
        'role': 'role',
        'grantedBy': 'granted_by',
        'lastAdminAuth': 'last_admin_auth',
        'createdAt': 'created_at'
      }
    }
  ],

  // Data transformation functions
  transformers: {
    // Convert Convex timestamps (ms) to Supabase timestamps (ISO string)
    timestamp: (convexTimestamp) => new Date(convexTimestamp).toISOString(),
    
    // Handle UUID conversions
    uuid: (convexId) => {
      // Convex IDs are strings, Supabase expects UUIDs
      // This would need proper UUID generation logic
      return convexId; // Placeholder
    },
    
    // Handle array fields
    array: (convexArray) => {
      return convexArray || [];
    }
  }
};

console.log('📋 Migration Plan:');
console.log('==================');

migrationPlan.tables.forEach((table, index) => {
  console.log(`\n${index + 1}. ${table.name}`);
  console.log(`   Convex Query: ${table.convexQuery}`);
  console.log(`   Supabase Table: ${table.supabaseTable}`);
  console.log(`   Field Mappings:`);
  
  Object.entries(table.mapping).forEach(([convexField, supabaseField]) => {
    if (supabaseField) {
      console.log(`     ${convexField} → ${supabaseField}`);
    }
  });
});

console.log('\n⚠️  Migration Status: NOT IMPLEMENTED');
console.log('\n📝  To implement actual migration:');
console.log('1. Set up Convex client to read existing data');
console.log('2. Set up Supabase client to write new data');
console.log('3. For each table:');
console.log('   a. Read all records from Convex');
console.log('   b. Transform data according to mappings');
console.log('   c. Insert into Supabase in batches');
console.log('   d. Handle duplicates and conflicts');
console.log('   e. Verify data integrity');
console.log('\n🔄  Current Approach: Fresh Start');
console.log('The current implementation uses a "fresh start" approach:');
console.log('- New users sign up directly with Supabase');
console.log('- Existing users need to create new accounts');
console.log('- Data migration is manual (export/import if needed)');
console.log('\n💡  Recommendation:');
console.log('For production migration, implement this script with:');
console.log('- Batch processing for large datasets');
console.log('- Error handling and retry logic');
console.log('- Progress tracking and resume capability');
console.log('- Data validation before and after migration');

// Write migration plan to file
fs.writeFileSync(
  path.join(__dirname, '..', 'migration-plan.json'),
  JSON.stringify(migrationPlan, null, 2)
);

console.log('\n✅ Migration plan saved to migration-plan.json');
console.log('\n🎯 Next Steps:');
console.log('1. Apply database migrations to Supabase');
console.log('2. Test Supabase-only mode with new users');
console.log('3. If needed, implement data migration script');
console.log('4. Gradual cutover from Convex to Supabase');
