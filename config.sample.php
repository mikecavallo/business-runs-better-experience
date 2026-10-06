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
    'contact_to'   => 'hello@businessrunsbetter.com',

    // Sender address. Must be on your domain or spam filters will junk it.
    'contact_from' => 'website@businessrunsbetter.com',

    // Password for /leads.php. At least 12 characters. Make it long and unique.
    'admin_password' => '',

    // Stripe → Developers → Webhooks → your endpoint → "Signing secret" (starts with whsec_).
    'stripe_webhook_secret' => '',

    // Optional: the Time Audit Payment Link id (starts with plink_). The webhook also
    // recognizes the audit by its $500 price, so this is only needed if you change that.
    'stripe_audit_link_id' => '',
    'audit_price_cents'    => 50000,

    // Used for follow-up dates and timestamps.
    'timezone' => 'America/New_York',
];
