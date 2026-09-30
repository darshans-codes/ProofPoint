import sharp from 'sharp';
import { Project } from '../src/models/Project.js';
import { connectDB } from '../src/config/db.js';
import 'dotenv/config';

async function run() {
  await connectDB();
  const project = await Project.findOne();
  if (!project) {
    console.error('No project found');
    process.exit(1);
  }

  // Generate a test JPEG with sharp
  const testBuffer = await sharp({
    create: {
      width: 800,
      height: 600,
      channels: 3,
      background: { r: 47, g: 93, b: 70 },
    },
  })
    .jpeg()
    .toBuffer();

  const formData = new FormData();
  formData.append('projectId', project._id.toString());
  formData.append('locationName', 'Section 4B - River Mile 14');
  formData.append('capturedDate', new Date().toISOString());
  formData.append('lat', '-9.9749');
  formData.append('lng', '-67.8243');
  formData.append(
    'files',
    new Blob([testBuffer], { type: 'image/jpeg' }),
    'field_specimen_01.jpg'
  );

  const res = await fetch('http://127.0.0.1:5000/api/assets', {
    method: 'POST',
    body: formData,
  });

  const json = await res.json();
  console.log('Upload response status:', res.status);
  console.log('Created assets:', json.assets?.length);
  if (json.assets?.length > 0) {
    const a = json.assets[0];
    console.log('Asset ID:', a._id);
    console.log('Status:', a.verification?.status, 'Score:', a.verification?.score);
    console.log('Transformations:', a.transformations);
    console.log('Checks:', a.verification?.checks);
  }
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
