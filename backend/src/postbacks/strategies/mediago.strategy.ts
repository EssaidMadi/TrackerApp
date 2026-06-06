import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Click, Conversion, ConversionMethod, PostbackConfig } from '@prisma/client';
import {
  CampaignPostbackContext,
  PostbackResult,
  PostbackStrategy,
} from '../interfaces/postback-strategy.interface';
import { httpRequestWithRetry } from '../helpers/facebook-graph-http.helper';

@Injectable()
export class MediagoStrategy implements PostbackStrategy {
  constructor(private readonly http: HttpService) {}

  getNetwork(): string {
    return 'mediago';
  }

  canHandle(config: PostbackConfig, campaign?: CampaignPostbackContext): boolean {
    const method = campaign?.trafficSourceProfile?.conversionMethod;
    if (method && method !== ConversionMethod.mediago_s2s) return false;
    return config.mediagoEnabled;
  }

  async send(
    click: Click,
    conversion: Conversion,
    config: PostbackConfig,
  ): Promise<PostbackResult> {
    if (!click.trackingId) {
      return {
        success: false,
        method: 'GET',
        url: '',
        response: 'No tracking_id on click — cannot fire Mediago postback',
      };
    }

    const params = new URLSearchParams({
      trackingid: click.trackingId,
      conversiontype: String(config.mediagoConversionType),
      conversionprice: String(conversion.revenue || 0),
      includeintotalconversion: '1',
    });

    if (click.adId) {
      params.set('adid', click.adId);
    }

    const url = `https://sync.mediago.io/api/bidder/postback?${params.toString()}`;

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
          : e.message || 'Mediago postback failed',
      };
    }
  }
}
