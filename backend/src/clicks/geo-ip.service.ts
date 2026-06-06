import { Injectable } from '@nestjs/common';
import * as geoip from 'geoip-lite';

export interface GeoData {
  country: string | null;
  countryCode: string | null;
  region: string | null;
  city: string | null;
}

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

@Injectable()
export class GeoIpService {
  lookup(ip?: string): GeoData {
    if (!ip) {
      return { country: null, countryCode: null, region: null, city: null };
    }

    const cleanIp = ip.replace(/^::ffff:/, '');
    const geo = geoip.lookup(cleanIp);

    if (!geo) {
      return { country: null, countryCode: null, region: null, city: null };
    }

    const countryCode = geo.country || null;
    let country: string | null = countryCode;
    if (countryCode) {
      try {
        country = regionNames.of(countryCode) || countryCode;
      } catch {
        country = countryCode;
      }
    }

    return {
      country,
      countryCode,
      region: geo.region || null,
      city: geo.city || null,
    };
  }
}
