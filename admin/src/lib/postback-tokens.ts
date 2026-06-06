export interface PostbackTokenDef {
  token: string;
  description: string;
}

/** Voluum-compatible outbound postback placeholders (mirrors backend/shared/tracking/postback-url.ts) */
export const POSTBACK_TOKEN_DEFINITIONS: PostbackTokenDef[] = [
  { token: '{externalid}', description: 'Traffic source click ID' },
  { token: '{click.id}', description: 'Internal tracker click ID' },
  { token: '{payout}', description: 'Conversion revenue' },
  { token: '{payout.currency}', description: 'Revenue currency (EUR)' },
  { token: '{conversiontype}', description: 'Mediago conversion type' },
  { token: '{accountname}', description: 'Mediago account name' },
  { token: '{transaction.id}', description: 'Transaction ID' },
  { token: '{eventType}', description: 'Event type (Lead, Sale)' },
  { token: '{campaign.id}', description: 'Campaign ID' },
  { token: '{campaign.name}', description: 'Campaign name' },
  { token: '{var1}', description: 'Usually Ad ID' },
  { token: '{var2}', description: 'Usually Ad title' },
  { token: '{var3}', description: 'Usually Campaign ID' },
  { token: '{var4}', description: 'Usually Publisher' },
  { token: '{var5}', description: 'Usually Site ID' },
  { token: '{var6}', description: 'Usually Content' },
  { token: '{var7}', description: 'Usually Platform' },
  { token: '{var8}', description: 'Usually Asset ID' },
  { token: '{country}', description: 'Country code' },
  { token: '{city}', description: 'City' },
  { token: '{ip}', description: 'IP address' },
  { token: '{useragent}', description: 'User agent' },
  { token: '{device}', description: 'Device' },
  { token: '{browser}', description: 'Browser' },
  { token: '{os}', description: 'OS' },
  { token: '{gclid}', description: 'Google click ID' },
  { token: '{param1}', description: 'Incoming postback param 1' },
  { token: '{param2}', description: 'Incoming postback param 2' },
  { token: '{param3}', description: 'Incoming postback param 3' },
  { token: '{param4}', description: 'Incoming postback param 4' },
  { token: '{param5}', description: 'Incoming postback param 5' },
];

export const DEFAULT_MEDIAGO_POSTBACK_URL =
  'https://sync.mediago.io/api/bidder/postback?trackingid={externalid}&adid={var1}&conversiontype={conversiontype}&conversionprice={payout}&includeintotalconversion=1&accountname={accountname}';
