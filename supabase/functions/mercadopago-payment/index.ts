import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Always use the production Vercel URL for back_urls.
// Mercado Pago requires valid HTTPS URLs - capacitor:// won't work.
const BASE_URL = "https://estesi-pi.vercel.app";

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const bodyText = await req.text();
        console.log("[mercadopago-payment] Request body received:", bodyText);

        if (!bodyText) throw new Error('Empty request body');

        const { taskId, amount, description, userEmail } = JSON.parse(bodyText);
        const accessToken = Deno.env.get('MP_ACCESS_TOKEN');

        if (!accessToken) {
            console.error("[mercadopago-payment] CRITICAL: MP_ACCESS_TOKEN not found in environment secrets");
            return new Response(
                JSON.stringify({ error: "Missing MP_ACCESS_TOKEN in Supabase Secrets" }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
        }

        const preferenceBody = {
            items: [{
                title: description || `Servicio Arreglados`,
                quantity: 1,
                unit_price: Number(amount),
                currency_id: 'ARS'
            }],
            payer: {
                email: (userEmail && userEmail.includes('@')) ? userEmail : "test_user_123@testuser.com"
            },
            back_urls: {
                success: `${BASE_URL}/#/tasks?status=success`,
                failure: `${BASE_URL}/#/tasks?status=failure`,
                pending: `${BASE_URL}/#/tasks?status=pending`
            },
            auto_return: 'approved',
            external_reference: taskId,
            notification_url: `https://vmpqijxvcfgjswvvllli.supabase.co/functions/v1/mercadopago-webhook`
        };

        console.log("[mercadopago-payment] Sending Preference Body to MP:", JSON.stringify(preferenceBody));

        const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(preferenceBody),
        });

        const mpData = await mpResponse.json();
        console.log("[mercadopago-payment] MP Response Status:", mpResponse.status);
        console.log("[mercadopago-payment] MP Response Data:", JSON.stringify(mpData));

        if (!mpResponse.ok) {
            console.error("[mercadopago-payment] MP API Error Details:", JSON.stringify(mpData));
            return new Response(
                JSON.stringify({
                    error: "Mercado Pago API Error",
                    status: mpResponse.status,
                    details: mpData
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
        }

        if (!mpData.init_point) {
            console.error("[mercadopago-payment] CRITICAL: init_point missing in MP response", mpData);
            return new Response(
                JSON.stringify({ error: "No se obtuvo init_point de Mercado Pago", details: mpData }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
        }

        return new Response(
            JSON.stringify({ id: mpData.id, init_point: mpData.init_point }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );

    } catch (error) {
        console.error("[mercadopago-payment] Edge Function Exception:", error.message);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
    }
});
