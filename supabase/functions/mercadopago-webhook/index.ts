import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

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
        console.log("Webhook received. Method:", req.method);

        // 1. Parse the request body
        const body = await req.json();
        console.log("Webhook body:", JSON.stringify(body));

        // Mercado Pago sends different types of notifications.
        // We only care about 'payment' notifications.
        if (body.type === 'payment' && body.data && body.data.id) {
            const paymentId = body.data.id;
            console.log(`Processing payment ID: ${paymentId}`);

            const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN');
            if (!mpAccessToken) {
                throw new Error("MP_ACCESS_TOKEN is missing in environment");
            }

            // 2. Fetch payment details from Mercado Pago
            const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: {
                    'Authorization': `Bearer ${mpAccessToken}`,
                }
            });

            if (!mpResponse.ok) {
                const errorData = await mpResponse.text();
                console.error(`Error fetching payment ${paymentId}:`, errorData);
                throw new Error(`Failed to fetch payment details from MP: ${mpResponse.status}`);
            }

            const paymentData = await mpResponse.json();
            console.log(`Payment status: ${paymentData.status}, Ref: ${paymentData.external_reference}`);

            // 3. Check if payment is approved
            if (paymentData.status === 'approved') {
                const taskId = paymentData.external_reference;

                if (!taskId) {
                    console.warn("No external_reference found in payment data. Skipping update.");
                } else {
                    // 4. Update task status in Supabase
                    const supabaseUrl = Deno.env.get('SUPABASE_URL');
                    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

                    if (!supabaseUrl || !supabaseServiceKey) {
                        throw new Error("Supabase credentials missing in environment");
                    }

                    const supabase = createClient(supabaseUrl, supabaseServiceKey);

                    console.log(`Updating task ${taskId} to status 'paid'...`);
                    const { data, error } = await supabase
                        .from('tasks')
                        .update({ status: 'paid' })
                        .eq('id', taskId)
                        .select();

                    if (error) {
                        console.error(`Error updating task ${taskId}:`, error.message);
                        throw error;
                    }

                    console.log(`Task ${taskId} successfully updated to 'paid'. Rows affected:`, data?.length);
                }
            } else {
                console.log(`Payment ${paymentId} is in state: ${paymentData.status}. No action taken.`);
            }
        }

        // Always return 200 to acknowledge receipt to Mercado Pago
        return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error("Webhook Error:", error.message);
        // We still return 200/202 so MP doesn't keep retrying if it's a code error,
        // unless we WANT it to retry. Standard practice is to log and acknowledge.
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }
});
