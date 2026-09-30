import exifr from 'exifr';

export async function extractExif(buffer) {
  let lat = null;
  let lng = null;
  let takenAt = null;
  let camera = null;
  let hasGps = false;

  try {
    const gps = await exifr.gps(buffer);
    if (gps && typeof gps.latitude === 'number' && typeof gps.longitude === 'number') {
      lat = gps.latitude;
      lng = gps.longitude;
      hasGps = true;
    }
  } catch (err) {
    // Missing GPS or corrupted GPS block is normal
  }

  try {
    const parsed = await exifr.parse(buffer, [
      'DateTimeOriginal',
      'CreateDate',
      'ModifyDate',
      'Make',
      'Model',
    ]);
    if (parsed) {
      takenAt = parsed.DateTimeOriginal || parsed.CreateDate || parsed.ModifyDate || null;
      if (parsed.Make || parsed.Model) {
        camera = [parsed.Make, parsed.Model].filter(Boolean).join(' ').trim();
      }
    }
  } catch (err) {
    // Missing camera tags is normal
  }

  return {
    lat,
    lng,
    takenAt,
    camera,
    hasGps,
  };
}
