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
import {
  resolveMediagoAccountName,
  resolveMediagoTrackingId,
} from '../../shared/tracking/mediago-postback';

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
    const trackingId = resolveMediagoTrackingId(click);
    if (!trackingId) {
      return {
        success: false,
        method: 'GET',
        url: '',
        response:
          'No Mediago TRACKING_ID on click — ensure LP URL keeps click_id=${TRACKING_ID}',
      };
    }

    const profileDefaults = (campaign?.trafficSourceProfile?.postbackDefaults ||
      {}) as Record<string, unknown>;
    const accountName = resolveMediagoAccountName(config, profileDefaults);
    if (!accountName) {
      return {
        success: false,
        method: 'GET',
        url: '',
        response:
          'Mediago accountname is required — set it on the campaign postback config, traffic source profile, or MEDIAGO_ACCOUNT_NAME env',
      };
    }

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
