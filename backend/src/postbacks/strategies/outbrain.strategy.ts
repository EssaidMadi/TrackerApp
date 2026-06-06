import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Click, Conversion, PostbackConfig } from '@prisma/client';
import { ConversionMethod } from '@prisma/client';
import { PostbackResult, PostbackStrategy } from '../interfaces/postback-strategy.interface';
import { httpRequestWithRetry } from '../helpers/facebook-graph-http.helper';

type CampaignWithProfile = {
  trafficSourceProfile?: {
    conversionMethod: ConversionMethod;
    postbackDefaults: unknown;
  } | null;
};

@Injectable()
export class OutbrainStrategy implements PostbackStrategy {
  constructor(private readonly http: HttpService) {}

  getNetwork(): string {
    return 'outbrain';
  }

  canHandle(
    config: PostbackConfig,
    campaign?: CampaignWithProfile,
  ): boolean {
    if (campaign?.trafficSourceProfile?.conversionMethod !== ConversionMethod.outbrain_s2s) {
      return false;
    }
    const defaults = (campaign?.trafficSourceProfile?.postbackDefaults || {}) as Record<
      string,
      unknown
    >;
    return Boolean(defaults.outbrainPostbackUrl);
  }

  async send(
    click: Click,
    conversion: Conversion,
    config: PostbackConfig,
    campaign?: CampaignWithProfile,
  ): Promise<PostbackResult> {
    if (!click.trackingId) {
      return {
        success: false,
        method: 'GET',
        url: '',
        response: 'No tracking_id on click — cannot fire Outbrain postback',
      };
    }

    const defaults = (campaign?.trafficSourceProfile?.postbackDefaults || {}) as Record<
      string,
      string
    >;
    const template =
      defaults.outbrainPostbackUrl ||
      'https://tr.outbrain.com/pixel?ob_click_id={tracking_id}';

    const url = template
      .replace(/\{tracking_id\}/g, encodeURIComponent(click.trackingId))
      .replace(/\{revenue\}/g, String(conversion.revenue || 0))
      .replace(/\{transaction_id\}/g, encodeURIComponent(conversion.transactionId || ''));

    try {
      const { data, status } = await httpRequestWithRetry(this.http, 'get', url);
      return {
        success: status >= 200 && status < 300,
        method: 'GET',
        url,
        httpStatus: status,
        response: typeof data === 'string' ? data : JSON.stringify(data),
      };
    } catch (err) {
      const e = err as { response?: { status?: number; data?: unknown }; message?: string };
      return {
        success: false,
        method: 'GET',
        url,
        httpStatus: e.response?.status,
        response: e.response?.data
          ? JSON.stringify(e.response.data)
          : e.message || 'Outbrain postback failed',
      };
    }
  }
}
