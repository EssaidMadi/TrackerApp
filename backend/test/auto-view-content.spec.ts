import { shouldSendAutoViewContent } from '../src/shared/tracking/auto-view-content';

describe('shouldSendAutoViewContent', () => {
  it('skips viewcontent for lp1 (click_button optimization)', () => {
    expect(shouldSendAutoViewContent('lp1')).toBe(false);
  });

  it('sends viewcontent for other campaigns', () => {
    expect(shouldSendAutoViewContent('auto')).toBe(true);
  });
});
