import { Router } from 'express';
import multer from 'multer';
import {
  uploadAssets,
  getAssets,
  getAssetById,
  deleteAsset,
  reanalyzeAsset,
} from '../controllers/assetController.js';
import { requireAuth } from '../middleware/auth.js';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    files: 15,
    fileSize: 25 * 1024 * 1024, // 25 MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'video/mp4') {
      cb(null, true);
    } else {
      cb(new Error('Only image files and MP4 videos are supported.'), false);
    }
  },
});

const router = Router();

router.post('/', requireAuth, upload.array('files', 15), uploadAssets);
router.get('/', getAssets);
router.get('/:id', getAssetById);
router.delete('/:id', requireAuth, deleteAsset);
router.post('/:id/reanalyze', requireAuth, reanalyzeAsset);

export default router;
