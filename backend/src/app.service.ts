import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return {
      ok: true,
      service: 'tracker-api',
      endpoints: {
        click: '/{campaign-id}',
        trackerScript: '/t/tracker.js',
        directVisit: 'POST /t/visit',
        conversions: 'POST /conversions',
        admin: '/api/*',
      },
    };
  }
}
