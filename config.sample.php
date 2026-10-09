<?php
/**
 * Private settings for businessrunsbetter.com.
 *
 * DO NOT put this file in public_html. Copy it to:
 *   /home/<your-cpanel-user>/brb-private/config.php
 * (the folder next to public_html, not inside it).
 */
return [
    // Inbox that receives new inquiries and payment alerts. Use one you check daily.
    'contact_to'   => 'mikecavallo@gmail.com',

    // Resend API key (resend.com → API Keys, starts with re_). When set, all email goes
    // through Resend instead of the web host's mail server.
    'resend_api_key' => '',

    // Sender address.
    // - Before businessrunsbetter.com is verified in Resend: keep 'onboarding@resend.dev'.
    //   Resend then only delivers to the email you signed up to Resend with, so contact_to
    //   must be that address, and the visitor auto-reply is skipped.
    // - After verifying the domain in Resend (Domains → Add, then add its DNS records in
    //   Cloudflare): use e.g. 'info@businessrunsbetter.com' and auto-replies turn on.
    'contact_from' => 'onboarding@resend.dev',

    // Password for /leads.php. At least 12 characters. Make it long and unique.
    'admin_password' => '',

    // Stripe → Developers → Webhooks → your endpoint → "Signing secret" (starts with whsec_).
    'stripe_webhook_secret' => '',

    // Optional: the Time Audit Payment Link id (starts with plink_). The webhook also
    // recognizes the audit by its $500 price, so this is only needed if you change that.
    'stripe_audit_link_id' => '',
    'audit_price_cents'    => 50000,

    // Send each person who fills in the form an instant "got your message" email.
    'auto_reply'   => true,
    // Optional booking link included in that email (Cal.com, Calendly, Odoo...).
    'calendar_url' => '',

    // Optional push notifications to your phone for new leads and payments, free via ntfy:
    // install the ntfy app, subscribe to a long random topic name, and put it here.
    // Anyone who knows the topic can read it, so make it unguessable, e.g. brb-leads-7f3k9q2xw8.
    'ntfy_topic' => '',

    // Used for follow-up dates and timestamps.
    'timezone' => 'America/New_York',
];
