import { CodeBlock, bodyTextClass, inlineCodeClass, linkClass, mutedTextClass } from '@/components/ui';

type Props = {
  conversionMethod?: string | null;
  postback?: {
    mediagoEnabled?: boolean;
    mediagoConversionType?: number;
    facebookEnabled?: boolean;
    facebookPixelId?: string;
    facebookAccessToken?: string;
    googleEnabled?: boolean;
    googleConversionId?: string;
    googleConversionLabel?: string;
    googlePostbackUrl?: string;
  };
};

export function PostbackPreview({ conversionMethod, postback }: Props) {
  const method = conversionMethod || 'mediago_s2s';

  if (method === 'mediago_s2s') {
    const fallback = postback?.mediagoConversionType ?? 10;
    return (
      <div className={`space-y-3 text-sm ${bodyTextClass}`}>
        <p>
          When a conversion is recorded, the tracker sends a <strong>GET</strong> to Mediago. The{' '}
          <code className={inlineCodeClass}>conversiontype</code> is chosen from the event
          type (Table 1.1): viewcontent→1, click_button→12, call_connected→14, purchase→8, lead→10.
        </p>
        <CodeBlock>{`GET https://sync.mediago.io/api/bidder/postback
  ?trackingid={click.trackingId}      ← Mediago TRACKING_ID from ad URL
  &adid={click.adId}
  &conversiontype={event→code}        ← e.g. viewcontent=1, fallback=${fallback}
  &conversionprice={conversion.revenue}
  &includeintotalconversion=1`}</CodeBlock>
        <p className={`text-xs ${mutedTextClass}`}>
          Mediago docs may also use <code className={inlineCodeClass}>accountname</code> — not
          wired yet; tell us your account name to add it. Reference:{' '}
          <a
            href="https://sync.mediago.io/api/bidder/postback"
            className={linkClass}
            target="_blank"
            rel="noreferrer"
          >
            sync.mediago.io/api/bidder/postback
          </a>
        </p>
        <p>
          Status: {postback?.mediagoEnabled ? (
            <span className="text-green-700 dark:text-green-400 font-medium">Enabled</span>
          ) : (
            <span className="text-red-600 dark:text-red-400 font-medium">Disabled — enable in Postback config below</span>
          )}
        </p>
      </div>
    );
  }

  if (method === 'facebook_capi') {
    const pixel = postback?.facebookPixelId || 'YOUR_PIXEL_ID';
    const hasToken = !!postback?.facebookAccessToken;
    return (
      <div className={`space-y-3 text-sm ${bodyTextClass}`}>
        <p>
          Facebook uses <strong>Conversions API (CAPI)</strong>, not a simple GET URL. On conversion
          the tracker sends a <strong>POST</strong> to:
        </p>
        <CodeBlock>{`POST https://graph.facebook.com/v21.0/${pixel}/events

Body (JSON):
{
  "data": [{
    "event_name": "Lead",
    "event_time": <unix timestamp>,
    "action_source": "website",
    "user_data": {
      "em": "<sha256 hashed email>",     ← from LP: tkCallback.registerConversion({ email })
      "fbp": "<_fbp cookie>",           ← from LP metadata
      "fbc": "<_fbc cookie>",           ← from LP metadata
      "client_ip_address": "<click IP>",
      "client_user_agent": "<click UA>"
    },
    "custom_data": { "value": <revenue>, "currency": "EUR" }
  }],
  "access_token": "<YOUR_SYSTEM_USER_TOKEN>"
}`}</CodeBlock>
        <p>
          You must configure: <strong>Pixel ID</strong> + <strong>Access Token</strong> (System User
          token from Meta Business Manager with <code className={inlineCodeClass}>ads_management</code>
          ).
        </p>
        <p>
          Pixel: {postback?.facebookPixelId || <span className="text-amber-600 dark:text-amber-400">not set</span>}
          <br />
          Token: {hasToken ? <span className="text-green-700 dark:text-green-400">configured</span> : <span className="text-red-600 dark:text-red-400">missing</span>}
          <br />
          Enabled: {postback?.facebookEnabled ? 'yes' : 'no'}
        </p>
      </div>
    );
  }

  if (method === 'google_offline') {
    const convId = postback?.googleConversionId || 'AW-XXXXXXXX';
    const label = postback?.googleConversionLabel || 'YOUR_LABEL';
    return (
      <div className={`space-y-3 text-sm ${bodyTextClass}`}>
        <p>
          Google offline conversion uses the <strong>gclid</strong> captured on the click. On
          conversion the tracker sends a <strong>GET</strong>:
        </p>
        <CodeBlock>{postback?.googlePostbackUrl || `GET https://www.googleadservices.com/pagead/conversion/
  ?gclid={click.gclid}
  &conversion_id=${convId}
  &conversion_label=${label}
  &value={conversion.revenue}
  &currency_code=EUR`}</CodeBlock>
        <p>
          Configure <strong>Conversion ID</strong> (AW-xxx) and <strong>Conversion Label</strong> from
          Google Ads → Goals → Conversions → Tag setup.
        </p>
        <p>
          Conversion ID: {postback?.googleConversionId || <span className="text-amber-600 dark:text-amber-400">not set</span>}
          <br />
          Label: {postback?.googleConversionLabel || <span className="text-amber-600 dark:text-amber-400">not set</span>}
          <br />
          Enabled: {postback?.googleEnabled ? 'yes' : 'no'}
        </p>
      </div>
    );
  }

  if (method === 'outbrain_s2s') {
    return (
      <div className={`space-y-3 text-sm ${bodyTextClass}`}>
        <p>Outbrain S2S GET with tracking_id from the click URL.</p>
        <CodeBlock>{`GET https://tr.outbrain.com/pixel?ob_click_id={click.trackingId}&marketerId=YOUR_ID`}</CodeBlock>
      </div>
    );
  }

  return <p className={`text-sm ${mutedTextClass}`}>No outbound postback for this traffic source.</p>;
}
