import { injectTrackerIntoHtml } from '../src/landers/inject-tracker';

describe('injectTrackerIntoHtml', () => {
  const snippet =
    '<script src="https://track.example.com/t/tracker.js" data-campaign="lp1" data-mode="direct"></script>';

  it('injects before closing head', () => {
    const html = '<html><head><title>T</title></head><body></body></html>';
    const out = injectTrackerIntoHtml(html, snippet);
    expect(out).toContain('tracker.js');
    expect(out.indexOf('tracker.js')).toBeLessThan(out.indexOf('</head>'));
  });

  it('does not double-inject when tracker already present', () => {
    const html = `<html><head>${snippet}</head><body></body></html>`;
    const out = injectTrackerIntoHtml(html, snippet);
    expect(out.match(/tracker\.js/g)?.length).toBe(1);
  });
});
