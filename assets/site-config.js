/* Public site settings. Safe to publish: nothing secret goes here.
 *
 * stripe.*    Stripe Payment Link URLs (Stripe Dashboard → Payment Links → Share).
 *             Leave empty and the buttons open the contact form instead.
 * calendarUrl       A Cal.com or Calendly booking link for the free 20-minute call.
 *                   Leave empty and "Book a free call" opens the contact form.
 * auditCalendarUrl  Booking link for the 90-minute audit, shown after payment.
 */
window.BRB_CONFIG = {
  email: 'hello@businessrunsbetter.com',
  stripe: {
    timeAudit: '',
    runAndImprove: ''
  },
  calendarUrl: '',
  auditCalendarUrl: ''
};
