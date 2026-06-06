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
export class GoogleStrategy implements PostbackStrategy {
  constructor(private readonly http: HttpService) {}

  getNetwork(): string {
    return 'google';
  }

  canHandle(config: PostbackConfig, campaign?: CampaignPostbackContext): boolean {
    const method = campaign?.trafficSourceProfile?.conversionMethod;
    if (method && method !== ConversionMethod.google_offline) return false;
    return config.googleEnabled;
  }

  async send(click: Click, conversion: Conversion, config: PostbackConfig): Promise<PostbackResult> {
    if (!click.gclid) {
      return {
        success: false,
        method: 'GET',
        url: '',
        response: 'No gclid on click — cannot fire Google postback',
      };
    }

    let url: string;

    if (config.googlePostbackUrl) {
      url = config.googlePostbackUrl
        .replace('{gclid}', encodeURIComponent(click.gclid))
        .replace('{conversion_id}', encodeURIComponent(config.googleConversionId || ''))
        .replace('{conversion_label}', encodeURIComponent(config.googleConversionLabel || ''))
        .replace('{revenue}', String(conversion.revenue || 0))
        .replace('{click_id}', encodeURIComponent(click.clickId));
    } else {
      const params = new URLSearchParams({
        gclid: click.gclid,
        conversion_id: config.googleConversionId || '',
        conversion_label: config.googleConversionLabel || '',
        value: String(conversion.revenue || 0),
        currency_code: 'EUR',
      });
      url = `https://www.googleadservices.com/pagead/conversion/?${params.toString()}`;
    }

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
          : e.message || 'Google postback failed',
      };
    }
  }
}
