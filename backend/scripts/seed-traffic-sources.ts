/**
 * Manual seed — run on server if profiles are missing:
 *   cd backend && npx prisma generate && npx ts-node scripts/seed-traffic-sources.ts
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { SYSTEM_TRAFFIC_SOURCE_PROFILES } from '../src/traffic-sources/traffic-source-profiles.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding traffic source profiles...');

  for (const profile of SYSTEM_TRAFFIC_SOURCE_PROFILES) {
    await prisma.trafficSourceProfile.upsert({
      where: { slug: profile.slug },
      create: {
        slug: profile.slug,
        name: profile.name,
        trackingModeDefault: profile.trackingModeDefault,
        clickUrlTemplate: profile.clickUrlTemplate,
        directAdUrlTemplate: profile.directAdUrlTemplate,
        paramMappings: profile.paramMappings as unknown as Prisma.InputJsonValue,
        conversionMethod: profile.conversionMethod,
        postbackDefaults: profile.postbackDefaults as unknown as Prisma.InputJsonValue,
        setupNote: profile.setupNote,
        isSystem: profile.isSystem,
        active: true,
      },
      update: {
        name: profile.name,
        trackingModeDefault: profile.trackingModeDefault,
        clickUrlTemplate: profile.clickUrlTemplate,
        directAdUrlTemplate: profile.directAdUrlTemplate,
        paramMappings: profile.paramMappings as unknown as Prisma.InputJsonValue,
        conversionMethod: profile.conversionMethod,
        postbackDefaults: profile.postbackDefaults as unknown as Prisma.InputJsonValue,
        setupNote: profile.setupNote,
      },
    });
    console.log(`  ✓ ${profile.slug}`);
  }

  const profiles = await prisma.trafficSourceProfile.findMany();
  const bySlug = Object.fromEntries(profiles.map((p) => [p.slug, p.id]));

  const campaigns = await prisma.campaign.findMany({
    where: { trafficSourceProfileId: null },
  });

  for (const campaign of campaigns) {
    const profileId = bySlug[campaign.trafficSource];
    if (profileId) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { trafficSourceProfileId: profileId },
      });
      console.log(`  linked campaign "${campaign.name}" → ${campaign.trafficSource}`);
    }
  }

  const count = await prisma.trafficSourceProfile.count();
  console.log(`Done. ${count} profile(s) in database.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
