import {
  extractMediagoRecordBatch,
  parseMediagoCampaignItem,
} from '../src/platform-sync/mediago/mediago-api.client';

describe('Mediago API response parsing', () => {
  it('parses direct array campaign list', () => {
    const batch = extractMediagoRecordBatch([
      { campaign_id: '5208604', campaign_name: 'nexoquote LP', ads: [] },
    ]);
    expect(batch).toHaveLength(1);
    expect(parseMediagoCampaignItem(batch[0])).toEqual({
      campaignId: '5208604',
      campaignName: 'nexoquote LP',
      accountId: undefined,
    });
  });

  it('parses wrapped results', () => {
    const batch = extractMediagoRecordBatch({
      results: [{ id: '99', name: 'Test' }],
    });
    expect(parseMediagoCampaignItem(batch[0])?.campaignId).toBe('99');
    expect(parseMediagoCampaignItem(batch[0])?.campaignName).toBe('Test');
  });
});
