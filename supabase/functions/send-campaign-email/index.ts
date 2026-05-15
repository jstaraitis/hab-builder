import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { logId, campaignName, subject, htmlContent, textContent, contentType, excludeOptedOut, targetUserIds } = await req.json();

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all user emails
    let userQuery = supabaseClient
      .from('profiles')
      .select('id, email');

    if (targetUserIds && targetUserIds.length > 0) {
      // If specific user IDs are provided, filter to those
      userQuery = userQuery.in('id', targetUserIds);
    }

    const { data: users, error: usersError } = await userQuery;

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    let emailList = users?.map(u => u.email).filter(Boolean) as string[] || [];

    // Exclude opted-out users if requested
    if (excludeOptedOut && contentType === 'marketing') {
      const { data: optedOut, error: optError } = await supabaseClient
        .from('email_opt_out')
        .select('email')
        .in('email_type', ['marketing', 'all']);

      if (optError) {
        console.error('Error fetching opt-out list:', optError);
      } else {
        const optedOutEmails = new Set((optedOut || []).map(o => o.email));
        emailList = emailList.filter(email => !optedOutEmails.has(email));
      }
    }

    console.log(`Sending email campaign to ${emailList.length} users`);

    // Update log status to 'sending'
    await supabaseClient
      .from('email_logs')
      .update({
        status: 'sending',
        recipient_count: emailList.length,
      })
      .eq('id', logId);

    // Send emails via Resend API (or your preferred email service)
    // Using Resend as example - adjust based on your email provider
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      console.error('RESEND_API_KEY environment variable not set');
      throw new Error('Email service not configured');
    }

    // Batch send emails (send in batches to avoid rate limits)
    const batchSize = 50;
    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < emailList.length; i += batchSize) {
      const batch = emailList.slice(i, i + batchSize);
      
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@habitat-builder.app',
            to: batch,
            subject: subject,
            html: htmlContent,
            text: textContent || 'This email requires an HTML-capable client',
          }),
        });

        if (response.ok) {
          sentCount += batch.length;
        } else {
          console.error(`Failed to send batch ${i / batchSize + 1}`);
          failedCount += batch.length;
        }
      } catch (error) {
        console.error('Error sending batch:', error);
        failedCount += batch.length;
      }

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < emailList.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Update log with final status
    const finalStatus = failedCount === 0 ? 'completed' : 'failed';
    await supabaseClient
      .from('email_logs')
      .update({
        status: finalStatus,
        recipient_count: sentCount,
      })
      .eq('id', logId);

    return new Response(
      JSON.stringify({
        success: true,
        recipientCount: sentCount,
        failedCount: failedCount,
        logId: logId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Email function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
