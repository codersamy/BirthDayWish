const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure data and uploads directories exist
[DATA_DIR, UPLOADS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
});


app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '/')));
app.use('/uploads', express.static(UPLOADS_DIR)); // Serve uploaded files

// Configure multer for file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOADS_DIR);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// API to handle file uploads
app.post('/api/upload', upload.single('media'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
});


// API to save a new birthday configuration
app.post('/api/birthday', (req, res) => {
    try {
        const id = crypto.randomBytes(8).toString('hex');
        const filePath = path.join(DATA_DIR, `${id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2));
        res.status(201).json({ id: id, message: 'Birthday site created successfully.' });
    } catch (error) {
        console.error('Failed to save birthday data:', error);
        res.status(500).json({ message: 'Error creating birthday site.' });
    }
});

// API to retrieve a birthday configuration
app.get('/api/birthday/:id', (req, res) => {
    const { id } = req.params;
    // Sanitize ID to prevent directory traversal
    const safeId = path.normalize(id).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(DATA_DIR, `${safeId}.json`);

    if (fs.existsSync(filePath)) {
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            res.json(JSON.parse(data));
        } catch (error) {
            console.error(`Failed to read or parse data for id ${safeId}:`, error);
            res.status(500).json({ message: 'Error reading birthday data.' });
        }
    } else {
        res.status(404).json({ message: 'Birthday site not found.' });
    }
});

// Serve the main app for the root and view routes
app.get(['/', '/view/:id', '/view/*'], (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});