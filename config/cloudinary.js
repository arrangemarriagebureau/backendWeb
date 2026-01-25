const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Verify Cloudinary configuration on startup
console.log('\n☁️  Cloudinary Configuration:');
console.log('   Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ SET' : '❌ MISSING');
console.log('   API Key:', process.env.CLOUDINARY_API_KEY ? '✅ SET' : '❌ MISSING');
console.log('   API Secret:', process.env.CLOUDINARY_API_SECRET ? '✅ SET' : '❌ MISSING');

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.log('\n⚠️  WARNING: Cloudinary credentials not fully configured!');
    console.log('   Image uploads will fail. Please check your .env file.\n');
}

// Configure Multer Storage with Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'marriage-bureau-profiles',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        transformation: [
            { 
                width: 800, 
                height: 1000, 
                crop: 'limit',
                quality: 'auto',
                fetch_format: 'auto'
            }
        ],
        // Generate unique filename
        public_id: (req, file) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            return `profile-${uniqueSuffix}`;
        }
    }
});

// Configure Multer
const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Check file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.'), false);
        }
    }
});

// Helper function to delete image from Cloudinary
const deleteImage = async (cloudinaryId) => {
    try {
        if (cloudinaryId) {
            const result = await cloudinary.uploader.destroy(cloudinaryId);
            console.log('✅ Image deleted from Cloudinary:', cloudinaryId);
            return result;
        }
    } catch (error) {
        console.error('❌ Error deleting image from Cloudinary:', error.message);
        throw error;
    }
};

// Helper function to upload image buffer (alternative method)
const uploadBuffer = async (buffer, folder = 'marriage-bureau-profiles') => {
    try {
        return new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: folder,
                    transformation: [{ width: 800, height: 1000, crop: 'limit' }]
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(buffer);
        });
    } catch (error) {
        console.error('❌ Error uploading buffer to Cloudinary:', error.message);
        throw error;
    }
};

module.exports = { 
    cloudinary, 
    upload,
    deleteImage,
    uploadBuffer
};