import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InvitationPayload {
  type: 'INSERT'
  table: 'invitations'
  record: {
    id: string
    organization_id: string
    email: string
    role: string
    token: string
    invited_by: string
    status: string
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Edge function called')
    console.log('RESEND_API_KEY exists:', !!RESEND_API_KEY)

    const payload: InvitationPayload = await req.json()
    console.log('Payload received:', JSON.stringify(payload))

    // Only send email for new pending invitations
    if (payload.type !== 'INSERT' || payload.record.status !== 'pending') {
      console.log('Skipping - not a new pending invitation')
      return new Response('OK', { headers: corsHeaders, status: 200 })
    }

    const { record } = payload

    // Get organization name
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: org, error: orgError } = await supabaseClient
      .from('organizations')
      .select('name')
      .eq('id', record.organization_id)
      .single()

    if (orgError) {
      console.error('Error fetching organization:', orgError)
    }

    const organizationName = org?.name || 'the organization'
    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173'
    const inviteUrl = `${siteUrl}/invite/${record.token}`

    console.log('Sending email to:', record.email)
    console.log('Organization:', organizationName)
    console.log('Invite URL:', inviteUrl)
    console.log('Token from record:', record.token)
    console.log('Full record:', JSON.stringify(record))

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Route Maker <noreply@verify.e3dev.solutions>',
        to: [record.email],
        subject: `You've been invited to join ${organizationName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>You've been invited</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background: #ffffff;
                border: 1px solid #e5e5e5;
                border-radius: 8px;
                padding: 40px;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              h1 {
                color: #1a1a1a;
                font-size: 24px;
                margin: 0 0 10px 0;
              }
              .content {
                margin-bottom: 30px;
              }
              .button {
                display: inline-block;
                background-color: #0070f3;
                color: #ffffff;
                text-decoration: none;
                padding: 12px 30px;
                border-radius: 6px;
                font-weight: 500;
                text-align: center;
              }
              .button-container {
                text-align: center;
                margin: 30px 0;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e5e5;
                font-size: 12px;
                color: #666;
                text-align: center;
              }
              .link {
                color: #0070f3;
                word-break: break-all;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>You've been invited to join ${organizationName}</h1>
              </div>

              <div class="content">
                <p>Hello,</p>
                <p>You've been invited to join <strong>${organizationName}</strong> on Route Maker as a ${record.role}.</p>
                <p>Click the button below to accept your invitation and get started:</p>
              </div>

              <div class="button-container">
                <a href="${inviteUrl}" class="button">Accept Invitation</a>
              </div>

              <div class="content">
                <p style="font-size: 14px; color: #666;">
                  Or copy and paste this link into your browser:<br>
                  <a href="${inviteUrl}" class="link">${inviteUrl}</a>
                </p>
                <p style="font-size: 14px; color: #666;">
                  This invitation will expire in 7 days.
                </p>
              </div>

              <div class="footer">
                <p>If you didn't expect this invitation, you can safely ignore this email.</p>
                <p>&copy; ${new Date().getFullYear()} Route Maker. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      console.error('Resend API error:', error)
      throw new Error(`Resend API error: ${error}`)
    }

    const data = await res.json()
    console.log('Email sent successfully:', data)
    console.log('Resend email ID:', data.id)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error sending invitation email:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
