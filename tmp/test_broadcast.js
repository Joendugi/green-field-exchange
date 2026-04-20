
const SUPABASE_URL = "https://ktrisnezcdsedqrsiujr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_AsvtcwDElUo6ydxK5D9OMw_amhRK-iu";

async function testBroadcast() {
  console.log("🚀 Starting global broadcast test...");

  const payload = {
    to: "ALL_USERS",
    subject: "AgriLink Platform Update 🚜",
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #1a2e1c;">
        <h1 style="color: #166534;"> wakulima agri-connect Platform Update</h1>
        <p>This is a test broadcast to all registered users of the  wakulima agri-connect Exchange.</p>
        <p>Our platform is currently being optimized for better performance and reliability.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <footer style="font-size: 12px; color: #6b7280;">
          Regards,<br />
          The  wakulima agri-connect Team
        </footer>
      </div>
    `
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("✅ Response from server:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("❌ Error sending broadcast:", error);
  }
}

testBroadcast();
