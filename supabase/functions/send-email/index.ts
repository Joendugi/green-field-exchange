// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
}

serve(async (req: any) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured');
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase client credentials missing');

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { to, subject, html }: EmailPayload = await req.json();

    let recipients: string[] = [];

    if (to === "ALL_USERS") {
      // Fetch all users via service role
      const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
      if (error) throw error;
      recipients = users.users.map((u: any) => u.email).filter(Boolean) as string[];
    } else {
      recipients = Array.isArray(to) ? to : [to];
    }

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No recipients' }), { headers: corsHeaders });
    }

    // Split recipients into batches of 100 (Resend limit per call)
    const batchSize = 100;
    const results = [];

    const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'onboarding@resend.dev';

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: EMAIL_FROM,
          to: batch,
          subject: subject,
          html: html,
        }),
      });

      const data = await response.json();
      results.push(data);

      // Log success/partial success to email_logs
      if (data.id) {
        await supabaseAdmin.from('email_logs').insert(
            batch.map(email => ({
                recipient: email,
                subject: subject,
                status: 'sent'
            }))
        );
      }
    }

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
