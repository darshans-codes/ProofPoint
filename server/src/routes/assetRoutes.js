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
import { expensiveOperationLimiter, validateObjectId } from '../middleware/security.js';

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

router.post('/', requireAuth, expensiveOperationLimiter, upload.array('files', 15), uploadAssets);
router.get('/', validateObjectId('projectId'), getAssets);
router.get('/:id', validateObjectId('id'), getAssetById);
router.delete('/:id', requireAuth, validateObjectId('id'), deleteAsset);
router.post('/:id/reanalyze', requireAuth, expensiveOperationLimiter, validateObjectId('id'), reanalyzeAsset);

export default router;
