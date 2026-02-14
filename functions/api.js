const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./utils/cloudinary');
const path = require('path');
require('dotenv').config();

const app = express();
const router = express.Router();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Configure multer for Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'birthday-app-media',
        resource_type: 'auto',
    },
});

const upload = multer({ storage: storage });

// API to handle file uploads
router.post('/upload', upload.single('media'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }
    // req.file.path contains the secure URL from Cloudinary
    res.status(201).json({ url: req.file.path });
});

// API to save a new birthday configuration
router.post('/birthday', (req, res) => {
    const jsonData = JSON.stringify(req.body, null, 2);
    // Upload JSON data as a raw file to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'raw', folder: 'birthday-app-data' },
        (error, result) => {
            if (error) {
                console.error('Failed to save birthday data to Cloudinary:', error);
                return res.status(500).json({ message: 'Error creating birthday site.' });
            }
            const id = path.parse(result.public_id).name.split('/')[1];
            res.status(201).json({ id: id, message: 'Birthday site created successfully.' });
        }
    );
    uploadStream.end(jsonData);
});

// API to retrieve a birthday configuration
router.get('/birthday/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const publicId = `birthday-app-data/${id}`;
        const resource = await cloudinary.api.resource(publicId, { resource_type: 'raw' });
        
        const response = await fetch(resource.secure_url);
        if (!response.ok) {
            return res.status(404).json({ message: 'Birthday site not found.' });
        }
        const data = await response.json();
        res.json(data);
    } catch (error) {
        if (error.http_code === 404) {
             return res.status(404).json({ message: 'Birthday site not found.' });
        }
        console.error(`Failed to read data for id ${id} from Cloudinary:`, error);
        res.status(500).json({ message: 'Error reading birthday data.' });
    }
});

// API to check the site password
router.post('/check-password', (req, res) => {
    const { password } = req.body;
    if (password && password === process.env.SITE_PASSWORD) {
        res.status(200).json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Incorrect Password' });
    }
});


app.use('/.netlify/functions/api', router); // Main entry point for Netlify
app.use('/api', router); // For local development via `netlify dev`

module.exports.handler = serverless(app);
