import 'dotenv/config';
import { connectDB } from '../src/config/db.js';
import { Project } from '../src/models/Project.js';
import { Asset } from '../src/models/Asset.js';
import { Report } from '../src/models/Report.js';
import { verifyAsset } from '../src/services/verifyService.js';
import { dHash } from '../src/services/hashService.js';
import { analyzeImage, embedText } from '../src/services/gemini.js';
import { buildTransformations, uploadToCloudinary } from '../src/services/cloudinaryService.js';
import { extractExif } from '../src/services/exifService.js';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

// Curated public domain & CC conservation photography dataset
const SEED_PROJECTS = [
  {
    name: 'Watts Branch Stream Restoration — Public Source Demo',
    isPublicSourceDemo: true,
    location: 'Watts Branch, Anacostia River watershed',
    description:
      'Public-source documentary before-and-after photographs from the U.S. Fish & Wildlife Service, included for product demonstration and clearly distinct from ProofPoint field evidence.',
    startDate: new Date('2011-02-14'),
    assets: [
      {
        localPath: '../seed-images/watts-branch-demo/before.jpg',
        locationName: 'Watts Branch, Anacostia River watershed',
        capturedDate: new Date('2011-02-14T00:00:00Z'),
        sourceMetadata: {
          type: 'public_source_demo',
          sourceDate: new Date('2011-02-14T00:00:00Z'),
          credit: 'Mark Secrist, U.S. Fish & Wildlife Service',
          license: 'Public domain',
          url: 'https://www.flickr.com/photos/usfwsnortheast/7557235384/',
          context: 'Watts Branch, Anacostia River watershed',
        },
        caption: 'Public-source before photograph of Watts Branch before restoration.',
        tags: ['public-source-demo', 'watts-branch', 'stream-restoration', 'before'],
        activity: 'documentary before-restoration reference',
      },
      {
        localPath: '../seed-images/watts-branch-demo/after.jpg',
        locationName: 'Watts Branch, Anacostia River watershed',
        capturedDate: new Date('2011-08-19T00:00:00Z'),
        sourceMetadata: {
          type: 'public_source_demo',
          sourceDate: new Date('2011-08-19T00:00:00Z'),
          credit: 'Mark Secrist, U.S. Fish & Wildlife Service',
          license: 'Public domain',
          url: 'https://www.flickr.com/photos/usfwsnortheast/7557277790/',
          context: 'Watts Branch, Anacostia River watershed',
        },
        caption: 'Public-source after photograph of Watts Branch following restoration.',
        tags: ['public-source-demo', 'watts-branch', 'stream-restoration', 'after'],
        activity: 'documentary after-restoration reference',
      },
    ],
  },
  {
    name: 'Acre River Riparian Buffer Project',
    location: 'Acre Basin, Amazonia, Brazil',
    description:
      'Community-led reforestation and riparian buffer rehabilitation along degraded cattle-pasture riverbanks in the Acre watershed.',
    startDate: new Date('2024-02-10'),
    assets: [
      {
        locationName: 'Section 4B - River Mile 14',
        capturedDate: new Date('2024-03-12T10:14:00Z'),
        claimedGeo: { lat: -9.9749, lng: -67.8243 },
        exif: {
          lat: -9.9748,
          lng: -67.8242,
          takenAt: new Date('2024-03-12T10:14:00Z'),
          camera: 'Canon EOS 5D Mark IV',
          hasGps: true,
        },
        imageUrl:
          'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80',
        caption:
          'Severely eroded clay riverbank with sparse shrub groundcover and exposed topsoil prior to community sapling planting.',
        tags: ['riparian', 'riverbank', 'erosion', 'baseline', 'degraded-pasture', 'soil'],
        activity: 'baseline environmental terrain survey and soil assessment',
        metrics: {
          trees: 3,
          waste: 'low',
          waterClarity: 'fair',
          vegetationLevel: 'low',
          peopleCount: 2,
        },
      },
      {
        locationName: 'Section 4B - River Mile 14',
        capturedDate: new Date('2024-11-18T15:22:00Z'),
        claimedGeo: { lat: -9.9749, lng: -67.8243 },
        exif: {
          lat: -9.9749,
          lng: -67.8243,
          takenAt: new Date('2024-11-18T15:22:00Z'),
          camera: 'Canon EOS 5D Mark IV',
          hasGps: true,
        },
        imageUrl:
          'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1200&q=80',
        caption:
          'Established multi-tiered native riparian canopy and dense perennial shrub understory stabilizing the riverbank slope.',
        tags: ['riparian', 'reforestation', 'native-species', 'perennial-groundcover', 'stabilized', 'foliage'],
        activity: 'post-intervention monitoring and canopy measurement',
        metrics: {
          trees: 24,
          waste: 'low',
          waterClarity: 'good',
          vegetationLevel: 'high',
          peopleCount: 0,
        },
      },
      {
        locationName: 'Sector 2 - Floodplain Nursery',
        capturedDate: new Date('2024-05-04T08:30:00Z'),
        claimedGeo: { lat: -9.9682, lng: -67.8195 },
        exif: {
          lat: -9.9681,
          lng: -67.8194,
          takenAt: new Date('2024-05-04T08:30:00Z'),
          camera: 'Sony Alpha 7R IV',
          hasGps: true,
        },
        imageUrl:
          'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
        caption:
          'Community nursery bed cultivating 4,000 indigenous Inga and rubber tree saplings prepared for buffer transplantation.',
        tags: ['tree-nursery', 'seedlings', 'indigenous-species', 'community-forestry', 'saplings'],
        activity: 'nursery inventory and seedling rootstock hardening',
        metrics: {
          trees: 40,
          waste: 'low',
          waterClarity: 'n/a',
          vegetationLevel: 'high',
          peopleCount: 4,
        },
      },
      {
        locationName: 'Downstream Cattle Crossing Sector 7',
        capturedDate: new Date('2024-06-15T11:45:00Z'),
        claimedGeo: { lat: -9.9821, lng: -67.8312 },
        exif: {
          lat: null,
          lng: null,
          takenAt: new Date('2024-06-15T11:45:00Z'),
          camera: 'Nikon D850',
          hasGps: false, // Honest demonstration of missing GPS -> NEEDS REVIEW
        },
        imageUrl:
          'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80',
        caption:
          'Fenced riparian exclusion zone preventing cattle herd hoof trampling along the muddy river access corridor.',
        tags: ['exclusion-fencing', 'pasture-management', 'river-corridor', 'cattle-impact', 'buffer'],
        activity: 'perimeter fence inspection and hoof compaction survey',
        metrics: {
          trees: 8,
          waste: 'low',
          waterClarity: 'fair',
          vegetationLevel: 'medium',
          peopleCount: 1,
        },
      },
    ],
  },
  {
    name: 'Mara River Basin Riparian Corridor',
    location: 'Narok County, Kenya',
    description:
      'Community wildlife conservancy initiative protecting riverbanks from agricultural runoff and illegal sand harvesting.',
    startDate: new Date('2024-01-20'),
    assets: [
      {
        locationName: 'Talek Confluence Sandbar',
        capturedDate: new Date('2024-02-14T07:15:00Z'),
        claimedGeo: { lat: -1.3128, lng: 35.1432 },
        exif: {
          lat: -1.3129,
          lng: 35.1431,
          takenAt: new Date('2024-02-14T07:15:00Z'),
          camera: 'Fujifilm X-T4',
          hasGps: true,
        },
        imageUrl:
          'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=80',
        caption:
          'Exposed sandbar showing discarded plastic waste and severe soil erosion along wildlife watering track.',
        tags: ['sandbar', 'savanna', 'wildlife-corridor', 'plastic-pollution', 'riparian-degradation'],
        activity: 'waste baseline audit and habitat disturbance survey',
        metrics: {
          trees: 2,
          waste: 'high',
          waterClarity: 'poor',
          vegetationLevel: 'low',
          peopleCount: 0,
        },
      },
      {
        locationName: 'Talek Confluence Sandbar',
        capturedDate: new Date('2024-08-22T09:40:00Z'),
        claimedGeo: { lat: -1.3128, lng: 35.1432 },
        exif: {
          lat: -1.3128,
          lng: 35.1432,
          takenAt: new Date('2024-08-22T09:40:00Z'),
          camera: 'Fujifilm X-T4',
          hasGps: true,
        },
        imageUrl:
          'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80',
        caption:
          'Cleared riverfront habitat following volunteer trash remediation and natural reeds regeneration.',
        tags: ['river-cleanup', 'wildlife-sanctuary', 'remediated', 'reeds', 'water-corridor'],
        activity: 'post-cleanup inspection and water turbidity check',
        metrics: {
          trees: 5,
          waste: 'low',
          waterClarity: 'good',
          vegetationLevel: 'medium',
          peopleCount: 3,
        },
      },
      {
        locationName: 'Oloolaimutia Springhead',
        capturedDate: new Date('2024-04-10T14:10:00Z'),
        claimedGeo: { lat: -1.3541, lng: 35.2104 },
        exif: {
          lat: -1.3542,
          lng: 35.2103,
          takenAt: new Date('2024-04-10T14:10:00Z'),
          camera: 'Sony Alpha 7 III',
          hasGps: true,
        },
        imageUrl:
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        caption:
          'Protected natural springhead perimeter with stone retaining wall preventing sediment contamination.',
        tags: ['springhead', 'water-resource', 'watershed-protection', 'sediment-barrier'],
        activity: 'spring catchment maintenance and flow meter calibration',
        metrics: {
          trees: 11,
          waste: 'low',
          waterClarity: 'good',
          vegetationLevel: 'high',
          peopleCount: 1,
        },
      },
    ],
  },
  {
    name: 'Sundarbans Coastal Mangrove Protection',
    location: 'Khulna Division, Bangladesh',
    description:
      'Community tidal mangrove barrier restoration providing cyclone surge buffer and tiger habitat conservation.',
    startDate: new Date('2023-11-01'),
    assets: [
      {
        locationName: 'Kholpetua River Estuary Sector 3',
        capturedDate: new Date('2024-01-15T08:20:00Z'),
        claimedGeo: { lat: 21.9497, lng: 89.1833 },
        exif: {
          lat: 21.9496,
          lng: 89.1832,
          takenAt: new Date('2024-01-15T08:20:00Z'),
          camera: 'Nikon Z6 II',
          hasGps: true,
        },
        imageUrl:
          'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
        caption:
          'Mudflat baseline prior to Avicennia mangrove sapling plantation during winter low-tide window.',
        tags: ['mangrove', 'tidal-mudflat', 'estuary', 'cyclone-buffer', 'intertidal-zone'],
        activity: 'pre-planting intertidal soil salinity and mud firmness survey',
        metrics: {
          trees: 0,
          waste: 'medium',
          waterClarity: 'poor',
          vegetationLevel: 'low',
          peopleCount: 4,
        },
      },
      {
        locationName: 'Kholpetua River Estuary Sector 3',
        capturedDate: new Date('2024-09-28T11:05:00Z'),
        claimedGeo: { lat: 21.9497, lng: 89.1833 },
        exif: {
          lat: 21.9497,
          lng: 89.1834,
          takenAt: new Date('2024-09-28T11:05:00Z'),
          camera: 'Nikon Z6 II',
          hasGps: true,
        },
        imageUrl:
          'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1200&q=80',
        caption:
          'Vigorous mangrove seedling growth with extensive pneumatophore aerial root systems trapping coastal sediment.',
        tags: ['mangrove-plantation', 'pneumatophores', 'sediment-retention', 'coastal-resilience'],
        activity: 'seedling survival count and aerial root density audit',
        metrics: {
          trees: 35,
          waste: 'low',
          waterClarity: 'fair',
          vegetationLevel: 'high',
          peopleCount: 2,
        },
      },
    ],
  },
];

async function seedDatabase() {
  console.log('[Seed] Connecting to MongoDB...');
  await connectDB();

  // Clear existing collections for a pristine, authoritative demo experience
  console.log('[Seed] Clearing existing collections...');
  await Promise.all([
    Project.deleteMany({}),
    Asset.deleteMany({}),
    Report.deleteMany({}),
  ]);

  console.log('[Seed] Ingesting curated environmental restoration datasets...');

  for (const projectData of SEED_PROJECTS) {
    const project = await Project.create({
      name: projectData.name,
      location: projectData.location,
      description: projectData.description,
      startDate: projectData.startDate,
    });
    console.log(`[Seed] Created Project: "${project.name}"`);

    const createdProjectAssets = [];

    for (let i = 0; i < projectData.assets.length; i++) {
      const item = projectData.assets[i];

      if (item.localPath) {
        const buffer = await readFile(new URL(item.localPath, import.meta.url));
        const exif = await extractExif(buffer);
        const phash = await dHash(buffer);
        const uploadResult = await uploadToCloudinary(buffer, {
          folder: `proofpoint/${project.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
          resource_type: 'image',
          filename: item.localPath,
        });
        const transformations = buildTransformations(
          uploadResult.public_id,
          project.name,
          'image'
        );
        const analysisResult = await analyzeImage(buffer, 'image/jpeg');
        const ai =
          analysisResult && analysisResult.ok !== false
            ? { ...analysisResult, analyzedAt: new Date() }
            : null;
        const verification = verifyAsset(
          {
            exif,
            capturedDate: item.capturedDate,
            phash,
            ai,
          },
          createdProjectAssets
        );
        const textToEmbed = [
          item.caption,
          ...(item.tags || []),
          item.activity,
          item.locationName,
          project.name,
        ]
          .filter(Boolean)
          .join(' ');
        const embedding = await embedText(textToEmbed);
        const asset = await Asset.create({
          project: project._id,
          projectName: project.name,
          locationName: item.locationName,
          capturedDate: item.capturedDate,
          kind: 'image',
          cloudinary: {
            publicId: uploadResult.public_id,
            url: uploadResult.url,
            secureUrl: uploadResult.secure_url,
            width: uploadResult.width,
            height: uploadResult.height,
            format: uploadResult.format,
            bytes: uploadResult.bytes,
            resourceType: uploadResult.resource_type || 'image',
          },
          transformations,
          ai,
          exif,
          sourceMetadata: item.sourceMetadata,
          verification,
          phash,
          embedding,
          provenance: [
            {
              event: 'uploaded',
              at: new Date(),
              detail: `Public-source demo image ingested from ${item.sourceMetadata.url}; not original ProofPoint field evidence.`,
            },
            {
              event: 'source_attributed',
              at: item.sourceMetadata.sourceDate,
              detail: `Source credit: ${item.sourceMetadata.credit}. License: ${item.sourceMetadata.license}. Source: ${item.sourceMetadata.url}. Context: ${item.sourceMetadata.context}.`,
            },
            {
              event: ai ? 'analyzed' : 'analysis_failed',
              at: new Date(),
              detail: ai
                ? 'Visual analysis completed for public-source demo data.'
                : 'Visual analysis was unavailable; source image and verification data were retained.',
            },
            {
              event: 'verified',
              at: new Date(),
              detail: `Verification audit completed. Status assigned: ${verification.status.toUpperCase()} (${verification.score}/100).`,
            },
            {
              event: 'transformed',
              at: new Date(),
              detail: 'Cloudinary responsive delivery formats and watermarked evidence derivative generated.',
            },
          ],
          usedInReports: [],
        });

        createdProjectAssets.push(asset);
        console.log(
          `  -> Ingested Public-Source Frame: PP-${asset._id.toString().slice(-4).toUpperCase()} [${verification.status.toUpperCase()} ${verification.score}/100]`
        );
        continue;
      }

      if (item.imageUrl?.includes('images.unsplash.com')) {
        console.warn(
          `  -> Skipping legacy external seed image for ${item.locationName}; use a local field image instead.`
        );
        continue;
      }

      // Generate deterministic perceptual hash from text & index
      const simulatedHash = `${(i + 1).toString(16).repeat(8)}${(i + 7).toString(16).repeat(8)}`.slice(0, 16);

      // Verify asset against current project assets
      const verification = verifyAsset(
        {
          exif: item.exif,
          claimedGeo: item.claimedGeo,
          capturedDate: item.capturedDate,
          phash: simulatedHash,
          ai: { caption: item.caption, activity: item.activity },
        },
        createdProjectAssets
      );

      // Generate text embedding for semantic search
      const textToEmbed = [
        item.caption,
        ...(item.tags || []),
        item.activity,
        item.locationName,
        project.name,
      ].join(' ');
      const embedding = await embedText(textToEmbed);

      const publicId = `demo_${project._id}_${i + 1}`;
      const transformations = {
        thumb: item.imageUrl,
        medium: item.imageUrl,
        watermarked: item.imageUrl,
        poster: null,
      };

      const asset = await Asset.create({
        project: project._id,
        projectName: project.name,
        locationName: item.locationName,
        capturedDate: item.capturedDate,
        kind: 'image',
        cloudinary: {
          publicId,
          url: item.imageUrl,
          secureUrl: item.imageUrl,
          width: 1200,
          height: 800,
          format: 'jpg',
          bytes: 420000,
          resourceType: 'image',
        },
        transformations,
        ai: {
          caption: item.caption,
          tags: item.tags,
          activity: item.activity,
          metrics: item.metrics,
          analyzedAt: new Date(),
        },
        exif: item.exif,
        claimedGeo: item.claimedGeo,
        verification,
        phash: simulatedHash,
        duplicateOf: verification.duplicateOf,
        embedding,
        provenance: [
          {
            event: 'uploaded',
            at: item.capturedDate,
            detail: `Public source documentary photo ingested with authentic attribution.`,
          },
          {
            event: 'analyzed',
            at: new Date(item.capturedDate.getTime() + 60000),
            detail: `Multimodal vision extraction completed for ${item.locationName}.`,
          },
          {
            event: 'verified',
            at: new Date(item.capturedDate.getTime() + 120000),
            detail: `Integrity check completed: Status ${verification.status.toUpperCase()} (${verification.score}/100).`,
          },
          {
            event: 'transformed',
            at: new Date(item.capturedDate.getTime() + 180000),
            detail: `Cloudinary responsive derivative formats generated.`,
          },
        ],
        usedInReports: [],
      });

      createdProjectAssets.push(asset);
      console.log(`  -> Ingested Frame: PP-${asset._id.toString().slice(-4).toUpperCase()} [${verification.status.toUpperCase()} ${verification.score}/100]`);
    }

    // Auto-create an authoritative impact report for the project if at least 2 assets exist
    if (createdProjectAssets.length >= 2 && !projectData.isPublicSourceDemo) {
      const beforeAsset = createdProjectAssets[0];
      const afterAsset = createdProjectAssets[1];

      const verifiedCount = createdProjectAssets.filter(
        (a) => a.verification?.status === 'verified'
      ).length;
      const verifiedPercent = Math.round(
        (verifiedCount / createdProjectAssets.length) * 100
      );

      const slug = `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}-${Math.random().toString(36).substring(2, 8)}`;

      const report = await Report.create({
        title: `${project.name} Verified Impact Dossier`,
        slug,
        project: project._id,
        assetIds: createdProjectAssets.map((a) => a._id),
        heroAssetId: beforeAsset._id,
        beforeAssetId: beforeAsset._id,
        afterAssetId: afterAsset._id,
        headline: `Measurable Riparian Recovery Confirmed Across ${project.location}`,
        narrative: `Field teams completed systematic monitoring across ${project.location}, gathering ${createdProjectAssets.length} evidentiary frames (${verifiedPercent}% verified against hardware EXIF and boundary criteria). Comparative visual analysis reveals substantial ground foliage recovery, elimination of non-organic waste, and bank soil stabilization. Cryptographic chain of custody is established for donor review.`,
        socialCaption: `Documented restoration success in ${project.name}: ${verifiedPercent}% verified evidence confirms ecosystem recovery. Auditable proof for donors. #ProofPoint #OpenData #EnvironmentalImpact`,
        metricsSummary: [
          {
            label: 'Canopy Density Increase',
            before: `${beforeAsset.ai?.metrics?.trees || 3} trees`,
            after: `${afterAsset.ai?.metrics?.trees || 24} trees`,
            change: '+21 Native Trees',
            direction: 'improved',
          },
          {
            label: 'Surface Waste Remediated',
            before: `${beforeAsset.ai?.metrics?.waste || 'high'}`,
            after: `${afterAsset.ai?.metrics?.waste || 'low'}`,
            change: 'Remediation Confirmed',
            direction: 'improved',
          },
          {
            label: 'Water Clarity',
            before: `${beforeAsset.ai?.metrics?.waterClarity || 'fair'}`,
            after: `${afterAsset.ai?.metrics?.waterClarity || 'good'}`,
            change: 'Sediment Reduced',
            direction: 'improved',
          },
        ],
        verifiedPercent,
      });

      // Link report back to assets
      await Asset.updateMany(
        { _id: { $in: createdProjectAssets.map((a) => a._id) } },
        {
          $addToSet: { usedInReports: report._id },
          $push: {
            provenance: {
              event: 'added_to_report',
              at: new Date(),
              detail: `Published in public impact report "${report.title}" (/story/${report.slug})`,
            },
          },
        }
      );

      console.log(`  -> Published Impact Report: "/story/${report.slug}"`);
    }
  }

  console.log('[Seed] Seeding completed successfully!');
  process.exit(0);
}

seedDatabase().catch((err) => {
  console.error('[Seed Error]', err);
  process.exit(1);
});
