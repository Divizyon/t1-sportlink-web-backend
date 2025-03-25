import express from 'express';
import storageController from '../controllers/storageController';
import upload from '../middleware/uploadMiddleware';

const router = express.Router();

// Test endpoint
router.get('/test', storageController.testStorage);

// Dosya yükleme endpoint'i
router.post('/upload', upload.single('file'), storageController.uploadFile);

// Dosya alma endpoint'i
router.get('/:bucket/:filePath', storageController.getFile);

// Dosya silme endpoint'i
router.delete('/:bucket/:filePath', storageController.deleteFile);

export default router; 