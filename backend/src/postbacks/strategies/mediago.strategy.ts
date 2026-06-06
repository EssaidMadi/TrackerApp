import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Click, Conversion, ConversionMethod, PostbackConfig } from '@prisma/client';
import {
  CampaignPostbackContext,
  PostbackResult,
  PostbackStrategy,
} from '../interfaces/postback-strategy.interface';
import { httpRequestWithRetry } from '../helpers/facebook-graph-http.helper';
import {
  DEFAULT_MEDIAGO_POSTBACK_URL,
  resolvePostbackUrlTemplate,
} from '../../shared/tracking/postback-url';

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
    campaign?: CampaignPostbackContext,
  ): Promise<PostbackResult> {
    if (!click.trackingId) {
      return {
        success: false,
        method: 'GET',
        url: '',
        response: 'No tracking_id on click — cannot fire Mediago postback',
      };
    }

    const profileDefaults = (campaign?.trafficSourceProfile?.postbackDefaults ||
      {}) as Record<string, unknown>;
    const template =
      (profileDefaults.postbackUrlTemplate as string) || DEFAULT_MEDIAGO_POSTBACK_URL;

    const url = resolvePostbackUrlTemplate(template, {
      click,
      conversion,
      config,
      profileDefaults,
      paramMappings: campaign?.trafficSourceProfile?.paramMappings,
      campaign: campaign?.campaign,
    });

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
