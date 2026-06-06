export interface BotDetectionResult {
  isBot: boolean;
  score: number;
  reasons: string[];
}

const BOT_UA_PATTERNS: RegExp[] = [
  /bot\b/i,
  /crawler/i,
  /spider/i,
  /slurp/i,
  /googlebot/i,
  /bingbot/i,
  /yandex/i,
  /baiduspider/i,
  /duckduckbot/i,
  /facebookexternalhit/i,
  /facebot/i,
  /twitterbot/i,
  /linkedinbot/i,
  /pinterestbot/i,
  /whatsapp/i,
  /telegrambot/i,
  /discordbot/i,
  /applebot/i,
  /semrush/i,
  /ahrefsbot/i,
  /mj12bot/i,
  /dotbot/i,
  /petalbot/i,
  /bytespider/i,
  /headless/i,
  /phantomjs/i,
  /selenium/i,
  /puppeteer/i,
  /playwright/i,
  /webdriver/i,
  /curl\//i,
  /wget\//i,
  /python-requests/i,
  /axios\//i,
  /go-http-client/i,
  /java\//i,
  /libwww-perl/i,
  /scrapy/i,
  /httpclient/i,
  /okhttp/i,
  /postman/i,
  /insomnia/i,
];

const SUSPICIOUS_UA_PATTERNS: RegExp[] = [
  /^mozilla\/5\.0$/i,
  /compatible;\s*$/i,
  /linux;\s*u;/i,
];

export interface BotDetectionInput {
  userAgent?: string;
  acceptLanguage?: string;
  isProxy?: boolean;
  isHosting?: boolean;
  hasSecFetchHeaders?: boolean;
}

export function detectBot(input: BotDetectionInput): BotDetectionResult {
  const reasons: string[] = [];
  let score = 0;
  const ua = (input.userAgent || '').trim();

  if (!ua) {
    reasons.push('missing_user_agent');
    score += 70;
  } else if (ua.length < 20) {
    reasons.push('short_user_agent');
    score += 40;
  }

  for (const pattern of BOT_UA_PATTERNS) {
    if (pattern.test(ua)) {
      reasons.push(`ua_pattern:${pattern.source}`);
      score += 80;
      break;
    }
  }

  for (const pattern of SUSPICIOUS_UA_PATTERNS) {
    if (pattern.test(ua)) {
      reasons.push(`suspicious_ua:${pattern.source}`);
      score += 25;
    }
  }

  if (ua && !input.acceptLanguage) {
    reasons.push('missing_accept_language');
    score += 15;
  }

  if (input.isProxy) {
    reasons.push('proxy_ip');
    score += 30;
  }

  if (input.isHosting) {
    reasons.push('hosting_datacenter_ip');
    score += 35;
  }

  if (ua && !input.hasSecFetchHeaders && /chrome|safari|firefox|edge/i.test(ua)) {
    reasons.push('missing_sec_fetch_headers');
    score += 10;
  }

  score = Math.min(100, score);
  return {
    isBot: score >= 50,
    score,
    reasons: [...new Set(reasons)],
  };
}
