import { haversineDistanceKm } from '../utils/haversine.js';
import { hammingDistance } from './hashService.js';

export function verifyAsset({ exif, claimedGeo, capturedDate, phash, ai }, existingAssetsInProject = []) {
  const checks = [];
  let score = 0;
  let isDuplicate = false;
  let duplicateOf = null;

  // 1. GPS present (20 pts)
  if (exif && exif.hasGps && typeof exif.lat === 'number' && typeof exif.lng === 'number') {
    score += 20;
    checks.push({
      name: 'GPS Coordinates Present',
      passed: true,
      detail: `GPS coordinates present in EXIF (${exif.lat.toFixed(5)}, ${exif.lng.toFixed(5)})`,
    });
  } else {
    checks.push({
      name: 'GPS Coordinates Present',
      passed: false,
      detail: 'No GPS in this file, so location could not be checked.',
    });
  }

  // 2. Location matches claim (25 pts)
  if (claimedGeo && typeof claimedGeo.lat === 'number' && typeof claimedGeo.lng === 'number') {
    if (exif && exif.hasGps) {
      const distKm = haversineDistanceKm(exif.lat, exif.lng, claimedGeo.lat, claimedGeo.lng);
      if (distKm <= 2.0) {
        score += 25;
        checks.push({
          name: 'Location Matches Claim',
          passed: true,
          detail: `EXIF GPS location is within ${(distKm * 1000).toFixed(0)}m of claimed location (within 2km limit)`,
        });
      } else {
        checks.push({
          name: 'Location Matches Claim',
          passed: false,
          detail: `EXIF GPS location is ${distKm.toFixed(2)}km from claimed location (exceeds 2km threshold)`,
        });
      }
    } else {
      checks.push({
        name: 'Location Matches Claim',
        passed: false,
        detail: 'Cannot verify claimed location: EXIF GPS missing in photo',
      });
    }
  } else {
    // No claimed location specified
    score += 25;
    checks.push({
      name: 'Location Matches Claim',
      passed: true,
      detail: 'No specific coordinate claim provided; passed by default',
    });
  }

  // 3. Timestamp present (15 pts)
  if (exif && exif.takenAt) {
    score += 15;
    checks.push({
      name: 'EXIF Timestamp Present',
      passed: true,
      detail: `EXIF timestamp confirmed (${new Date(exif.takenAt).toISOString().split('T')[0]})`,
    });
  } else {
    checks.push({
      name: 'EXIF Timestamp Present',
      passed: false,
      detail: 'No internal timestamp found in file header',
    });
  }

  // 4. Date matches claim (+/- 2 days) (20 pts)
  if (exif && exif.takenAt && capturedDate) {
    const timeTaken = new Date(exif.takenAt).getTime();
    const timeClaimed = new Date(capturedDate).getTime();
    const diffDays = Math.abs(timeTaken - timeClaimed) / (1000 * 3600 * 24);

    if (diffDays <= 2.0) {
      score += 20;
      checks.push({
        name: 'Date Matches Claim',
        passed: true,
        detail: `Capture timestamp is within ${(diffDays * 24).toFixed(0)} hours of claimed date`,
      });
    } else {
      checks.push({
        name: 'Date Matches Claim',
        passed: false,
        detail: `Timestamp differs by ${diffDays.toFixed(1)} days from claimed date (exceeds 2-day limit)`,
      });
    }
  } else if (!exif || !exif.takenAt) {
    checks.push({
      name: 'Date Matches Claim',
      passed: false,
      detail: 'Cannot verify date match: file lacks internal capture timestamp',
    });
  } else {
    checks.push({
      name: 'Date Matches Claim',
      passed: false,
      detail: 'Claimed capture date not specified',
    });
  }

  // 5. Not a duplicate (15 pts)
  if (phash && Array.isArray(existingAssetsInProject) && existingAssetsInProject.length > 0) {
    for (const existing of existingAssetsInProject) {
      if (existing.phash) {
        const dist = hammingDistance(phash, existing.phash);
        if (dist <= 5) {
          isDuplicate = true;
          duplicateOf = existing._id;
          break;
        }
      }
    }
  }

  if (isDuplicate) {
    checks.push({
      name: 'Duplicate Image Detection',
      passed: false,
      detail: `Perceptual dHash match detected (hamming distance <= 5 with asset ${duplicateOf})`,
    });
  } else {
    score += 15;
    checks.push({
      name: 'Duplicate Image Detection',
      passed: true,
      detail: 'No duplicate image detected in project archive (dHash check passed)',
    });
  }

  // 6. AI analysis present (5 pts)
  if (ai && (ai.caption || ai.activity)) {
    score += 5;
    checks.push({
      name: 'AI Evidence Analysis',
      passed: true,
      detail: 'Visual observation, metrics, and contextual tags extracted',
    });
  } else {
    checks.push({
      name: 'AI Evidence Analysis',
      passed: false,
      detail: 'AI visual analysis was not completed or failed',
    });
  }

  // Final status assignment
  let status = 'needs_review';
  if (isDuplicate) {
    status = 'flagged';
  } else if (score >= 80) {
    status = 'verified';
  } else if (score >= 50) {
    status = 'needs_review';
  } else {
    status = 'flagged';
  }

  return {
    status,
    score,
    checks,
    duplicateOf,
  };
}
