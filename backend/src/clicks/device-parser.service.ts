import { Injectable } from '@nestjs/common';
import { UAParser } from 'ua-parser-js';

export interface ParsedDevice {
  device: string;
  os: string | null;
  osVersion: string | null;
  brand: string | null;
  model: string | null;
  browser: string | null;
  browserVersion: string | null;
}

@Injectable()
export class DeviceParserService {
  parse(userAgent?: string): ParsedDevice {
    if (!userAgent) {
      return {
        device: 'Unknown',
        os: null,
        osVersion: null,
        brand: null,
        model: null,
        browser: null,
        browserVersion: null,
      };
    }

    const parser = new UAParser(userAgent);
    const device = parser.getDevice();
    const os = parser.getOS();
    const browser = parser.getBrowser();

    const deviceType = device.type;
    let deviceLabel = 'Desktop';
    if (deviceType === 'mobile') deviceLabel = 'Mobile phone';
    else if (deviceType === 'tablet') deviceLabel = 'Tablet';
    else if (deviceType === 'smarttv') deviceLabel = 'Smart TV';
    else if (deviceType === 'wearable') deviceLabel = 'Wearable';
    else if (deviceType === 'console') deviceLabel = 'Console';

    const brand = device.vendor || null;
    const model = device.model
      ? brand
        ? `${brand} ${device.model}`
        : device.model
      : brand
        ? `${brand}`
        : deviceType === undefined
          ? 'Desktop'
          : null;

    const osName = os.name || null;
    const browserName = browser.name || null;

    return {
      device: deviceLabel,
      os: osName,
      osVersion: os.version && osName ? `${osName} ${os.version}`.trim() : null,
      brand: brand || (deviceLabel === 'Desktop' ? 'Desktop' : null),
      model: model || (deviceLabel === 'Desktop' ? 'Desktop' : null),
      browser: browserName,
      browserVersion:
        browser.version && browserName
          ? `${browserName} ${browser.version}`.trim()
          : null,
    };
  }
}
