import { CodeBlock } from '@/components/ui';

type Props = {
  trackerBaseUrl?: string;
  incomingConversionUrl?: string;
  incomingConversionUrlAlt?: string;
  trackingMode?: string;
  lpScriptSnippet?: string;
};

export function IncomingConversionGuide({
  trackerBaseUrl,
  incomingConversionUrl,
  incomingConversionUrlAlt,
  trackingMode,
  lpScriptSnippet,
}: Props) {
  const exampleClickId = 'dabc123xyz';
  const exampleUrl =
    incomingConversionUrl
      ?.replace('{click_id}', exampleClickId)
      .replace('{payout}', '25')
      .replace('{transaction_id}', 'TX-001') ||
    `${trackerBaseUrl || 'https://track.your-domain.com'}/postback?cid=${exampleClickId}&et=lead&payout=25&txid=TX-001`;

  return (
    <div className="space-y-4 text-sm text-zinc-600">
      <p>
        When a lead converts on your landing page, you must tell the tracker using the{' '}
        <strong>internal click ID</strong> from the visit — the same value in{' '}
        <code className="bg-zinc-100 px-1 text-xs">click_id</code> and{' '}
        <code className="bg-zinc-100 px-1 text-xs">tk-cid</code> on the LP URL. They are identical.
      </p>

      <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-900">
        <strong>Do not confuse:</strong> Mediago&apos;s ad{' '}
        <code className="bg-amber-100 px-1">click_id</code> macro ({'{TRACKING_ID}'}) is the network
        ID — stored as <em>tracking ID</em>. For conversion postback use our ID from the LP (
        <code className="bg-amber-100 px-1">d…</code> prefix), unless you only have the network ID
        and use <code className="bg-amber-100 px-1">tracking_id=</code> instead of{' '}
        <code className="bg-amber-100 px-1">cid=</code>.
      </div>

      <div>
        <h4 className="text-xs font-semibold text-zinc-800 mb-2">
          Option A — GET postback URL (CRM, webhook, server-side)
        </h4>
        <p className="text-xs text-zinc-500 mb-2">
          Each campaign uses its tracking domain. Paste this template in your LP backend / Zapier /
          form handler. Replace placeholders when the lead converts.
        </p>
        <CodeBlock>{incomingConversionUrl || exampleUrl}</CodeBlock>
        <p className="text-xs text-zinc-400 mt-2">Example with a real click ID:</p>
        <CodeBlock>{exampleUrl}</CodeBlock>
        {incomingConversionUrlAlt && (
          <>
            <p className="text-xs text-zinc-400 mt-2">Alternative (click ID in path):</p>
            <CodeBlock>
              {incomingConversionUrlAlt
                .replace('{click_id}', exampleClickId)
                .replace('{payout}', '25')}
            </CodeBlock>
          </>
        )}
      </div>

      <div>
        <h4 className="text-xs font-semibold text-zinc-800 mb-2">Accepted query parameters</h4>
        <ul className="text-xs space-y-1 font-mono text-zinc-700">
          <li>
            <code>cid</code> or <code>click_id</code> or <code>tk-cid</code> — visit click ID
            (required)
          </li>
          <li>
            <code>et</code> — event type: lead, sale (default: lead)
          </li>
          <li>
            <code>payout</code> — revenue (e.g. 25)
          </li>
          <li>
            <code>txid</code> — transaction / order ID
          </li>
          <li>
            <code>tracking_id</code> — network click ID if you don&apos;t have our click_id
          </li>
        </ul>
      </div>

      {trackingMode === 'direct' && lpScriptSnippet && (
        <div>
          <h4 className="text-xs font-semibold text-zinc-800 mb-2">
            Option B — LP script (Facebook / Google direct)
          </h4>
          <p className="text-xs text-zinc-500 mb-2">
            On form submit, call from your LP JavaScript (uses tk-cid cookie automatically):
          </p>
          <CodeBlock>{`tkCallback.registerConversion({
  email: 'user@example.com',
  phone: '+33600000000',
  fbp: '...',  // optional, Facebook
  fbc: '...'   // optional, Facebook
});`}</CodeBlock>
          <p className="text-xs text-zinc-400 mt-2">
            Sends POST to <code>{trackerBaseUrl}/conversions/track</code> with the visit click ID.
          </p>
        </div>
      )}
    </div>
  );
}
