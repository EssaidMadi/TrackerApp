import { Card, inlineCodeClass, mutedTextClass, sectionHeadingClass, tableRowClass } from '@/components/ui';

const ROWS = [
  { code: 1, label: 'View Content', events: 'viewcontent' },
  { code: 2, label: 'App Install', events: 'app_install' },
  { code: 3, label: 'Complete Registration', events: 'complete_registration' },
  { code: 4, label: 'Add to Cart', events: 'add_to_cart' },
  { code: 5, label: 'Add Payment Info', events: 'add_payment_info' },
  { code: 6, label: 'Search', events: 'search' },
  { code: 7, label: 'Start Checkout', events: 'start_checkout' },
  { code: 8, label: 'Purchase', events: 'purchase, sale, sales' },
  { code: 9, label: 'Add to Wishlist', events: 'add_to_wishlist' },
  { code: 10, label: 'Lead', events: 'lead, postalcode' },
  { code: 12, label: 'Click Button', events: 'click_button, call_click' },
  { code: 13, label: 'Lead Qualified', events: 'lead_qualified, age_60, hearing_loss' },
  { code: 14, label: 'Call Connected', events: 'call_connected' },
  { code: 15, label: 'Appointment Booked', events: 'appointment_booked' },
  { code: 16, label: 'Application Started', events: 'account_opening, application_started' },
  { code: 17, label: 'Application Approved', events: 'account_validated, application_approved' },
  { code: 18, label: 'Account Created', events: 'account_created' },
  { code: 19, label: 'Deal Completed', events: 'deal_completed' },
];

export function MediagoConversionTypeTable({ compact = false }: { compact?: boolean }) {
  return (
    <Card className={compact ? 'p-3' : ''}>
      <h3 className={`${sectionHeadingClass} ${compact ? 'text-sm mb-2' : 'mb-3'}`}>
        Mediago conversion type map (Table 1.1)
      </h3>
      <p className={`text-xs ${mutedTextClass} mb-3`}>
        Outbound Mediago postbacks use <code className={inlineCodeClass}>conversiontype=</code> from
        the event type (<code className={inlineCodeClass}>et=</code> on incoming postbacks). When{' '}
        <code className={inlineCodeClass}>utm_source=mediago</code>, the LP script auto-fires{' '}
        <strong>View Content (1)</strong> on page load.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className={`text-left ${mutedTextClass} border-b border-zinc-100 dark:border-zinc-800`}>
              <th className="py-1.5 pr-3">Code</th>
              <th className="py-1.5 pr-3">Mediago type</th>
              <th className="py-1.5">Event slugs (et=)</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.code} className={tableRowClass}>
                <td className="py-1.5 pr-3 font-mono">{r.code}</td>
                <td className="py-1.5 pr-3">{r.label}</td>
                <td className={`py-1.5 font-mono ${mutedTextClass}`}>{r.events}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
