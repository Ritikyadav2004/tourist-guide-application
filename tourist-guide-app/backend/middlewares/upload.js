const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

// Check if cloudinary is configured
if (!cloudinary.config().cloud_name) {
  console.error('❌ ERROR: Cloudinary not configured properly in upload middleware');
}

// Memory Storages for Multer parsing (local parsing, no network calls, extremely fast & no timeouts)
const storageMemory = multer.memoryStorage();

const memoryMulter = multer({
  storage: storageMemory,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    console.log('📁 [Multer Memory Storage] File received:', file.originalname, 'Type:', file.mimetype);
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

const memoryMulterAvatar = multer({
  storage: storageMemory,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB for avatars
  },
  fileFilter: (req, file, cb) => {
    console.log('📁 [Multer Memory Storage] Avatar file received:', file.originalname, 'Type:', file.mimetype);
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

/**
 * Uploads a buffer to Cloudinary using its streaming API wrapped in a Promise with timeout handling.
 * @param {Buffer} buffer 
 * @param {Object} options Cloudinary upload configuration (folder, transformation, etc.)
 * @returns {Promise<Object>} The Cloudinary API upload result
 */
const uploadBufferToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const timeoutMs = 25000; // 25 seconds timeout limit
    const timeoutId = setTimeout(() => {
      const err = new Error('Cloudinary upload request timed out (25s limit reached)');
      err.name = 'TimeoutError';
      err.http_code = 499; // Using 499 as Client Closed Request / Request Timeout
      reject(err);
    }, timeoutMs);

    console.log(`[Cloudinary Stream] Starting upload. Destination folder: "${options.folder}"`);

    const stream = cloudinary.uploader.upload_stream(
      {
        ...options,
        timeout: timeoutMs
      },
      (error, result) => {
        clearTimeout(timeoutId);
        if (error) {
          console.error('[Cloudinary Stream] Upload error response received:', error);
          reject(error);
        } else {
          console.log(`[Cloudinary Stream] Upload successful! URL: ${result.secure_url} (ID: ${result.public_id})`);
          resolve(result);
        }
      }
    );

    Readable.from(buffer).pipe(stream);
  });
};

/**
 * Express middleware generator for single file upload to Cloudinary.
 */
const handleCloudinarySingleUpload = (options) => {
  return async (req, res, next) => {
    if (!req.file) {
      console.log('[Cloudinary Single Upload] No file parsed. Skipping Cloudinary upload.');
      return next();
    }

    try {
      console.log(`[Cloudinary Single Upload] Uploading ${req.file.originalname} to Cloudinary...`);
      const uploadOptions = {
        folder: options.folder,
        allowed_formats: options.allowed_formats || ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: options.transformation || []
      };

      const result = await uploadBufferToCloudinary(req.file.buffer, uploadOptions);
      
      // Inject details onto req.file to keep backwards compatibility with Multer-Storage-Cloudinary
      req.file.path = result.secure_url;
      req.file.cloudinaryId = result.public_id;

      next();
    } catch (error) {
      console.error('[Cloudinary Single Upload] Failed to upload image:', error);
      
      // Return a clean error response instead of crashing
      res.status(error.http_code || 500).json({
        success: false,
        message: 'Image upload failed due to a server timeout or network issue.',
        error: error.message || 'Unknown upload error'
      });
    }
  };
};

/**
 * Express middleware generator for multiple files upload to Cloudinary.
 */
const handleCloudinaryMultipleUpload = (options) => {
  return async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      console.log('[Cloudinary Multiple Upload] No files parsed. Skipping Cloudinary upload.');
      return next();
    }

    try {
      console.log(`[Cloudinary Multiple Upload] Uploading ${req.files.length} files to Cloudinary...`);
      const uploadOptions = {
        folder: options.folder,
        allowed_formats: options.allowed_formats || ['jpg', 'jpeg', 'png', 'webp'],
        transformation: options.transformation || []
      };

      // Perform all stream uploads in parallel
      const uploadPromises = req.files.map(async (file, index) => {
        console.log(`[Cloudinary Multiple Upload] Uploading [${index + 1}/${req.files.length}]: ${file.originalname}`);
        const result = await uploadBufferToCloudinary(file.buffer, uploadOptions);
        
        file.path = result.secure_url;
        file.cloudinaryId = result.public_id;
        console.log(`[Cloudinary Multiple Upload] Uploaded [${index + 1}/${req.files.length}]: ${file.originalname} -> ${file.path}`);
      });

      await Promise.all(uploadPromises);
      console.log('[Cloudinary Multiple Upload] All files uploaded successfully.');
      next();
    } catch (error) {
      console.error('[Cloudinary Multiple Upload] One or more uploads failed:', error);
      
      res.status(error.http_code || 500).json({
        success: false,
        message: 'One or more image uploads failed due to a server timeout or network issue.',
        error: error.message || 'Unknown upload error'
      });
    }
  };
};

// Re-expose identical interface but using our decoupled memory parsing + stream upload pipeline.
const upload = {
  single: (fieldName) => [
    memoryMulter.single(fieldName),
    handleCloudinarySingleUpload({
      folder: 'GullyGuide/posts',
      transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
    })
  ]
};

const uploadAvatar = {
  single: (fieldName) => [
    memoryMulterAvatar.single(fieldName),
    handleCloudinarySingleUpload({
      folder: 'GullyGuide/avatars',
      transformation: [{ width: 500, height: 500, crop: 'limit' }]
    })
  ]
};

const uploadMultiple = (fieldName, maxCount = 5) => [
  memoryMulter.array(fieldName, maxCount),
  handleCloudinaryMultipleUpload({
    folder: 'GullyGuide/assets',
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
  })
];

const uploadSingle = (fieldName) => [
  memoryMulter.single(fieldName),
  handleCloudinarySingleUpload({
    folder: 'GullyGuide/assets',
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
  })
];

module.exports = { upload, uploadAvatar, uploadMultiple, uploadSingle };
