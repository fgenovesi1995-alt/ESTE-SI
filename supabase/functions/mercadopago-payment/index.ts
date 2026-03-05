import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const bodyText = await req.text();
        if (!bodyText) throw new Error('Empty request body');

        const { taskId, amount, description, userEmail } = JSON.parse(bodyText);
        const accessToken = Deno.env.get('MP_ACCESS_TOKEN');

        if (!accessToken) {
            return new Response(
                JSON.stringify({ error: "Missing MP_ACCESS_TOKEN in Supabase Secrets" }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
        }

        const origin = req.headers.get('origin') || 'http://localhost:5173';
        const absoluteBaseUrl = origin.endsWith('/') ? origin.slice(0, -1) : origin;

        const preferenceBody = {
            items: [{
                title: description || `Servicio Arreglado`,
                quantity: 1,
                unit_price: Number(amount),
                currency_id: 'ARS'
            }],
            payer: {
                email: (userEmail && userEmail.includes('@')) ? userEmail : "test_user_123@testuser.com"
            },
            back_urls: {
                success: `${absoluteBaseUrl}/#/tasks?status=success`,
                failure: `${absoluteBaseUrl}/#/tasks?status=failure`,
                pending: `${absoluteBaseUrl}/#/tasks?status=pending`
            },
            // REMOVED auto_return: 'approved' because it strictly requires HTTPS and causes 400 errors on localhost
            external_reference: taskId
        };

        const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(preferenceBody),
        });

        const mpData = await mpResponse.json();

        if (!mpResponse.ok) {
            return new Response(
                JSON.stringify({
                    error: "Mercado Pago API Error",
                    status: mpResponse.status,
                    details: mpData
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
        }

        return new Response(
            JSON.stringify({ id: mpData.id, init_point: mpData.init_point }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
    }
});
