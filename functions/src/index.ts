import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const bucket = admin.storage().bucket('recap-d22e0.firebasestorage.app');

export const getSignedUploadUrl = functions.https.onRequest(async (req, res) => {
    const { filename, contentType } = req.query;

    console.log("getSignedUploadUrl function invoked at", new Date().toISOString());
    console.log("Received request:", { filename, contentType });

    if (!filename || typeof filename !== 'string') {
        console.error("Invalid filename:", filename);
        res.status(400).json({ error: 'Missing or invalid filename' });
        return;
    }

    const contentTypeStr = typeof contentType === 'string' ? contentType : '';

    let path: string;
    if (contentTypeStr.startsWith('video/')) {
        path = `uploads/${filename}/content.mov`;
    } else if (contentTypeStr.startsWith('image/')) {
        path = `uploads/${filename}/thumbnail.jpg`;
    } else {
        console.error("Unsupported content type:", contentTypeStr);
        res.status(400).json({ error: 'Unsupported content type' });
        return;
    }

    try {
        const file = bucket.file(path);
        const [url] = await file.getSignedUrl({
            version: 'v4',
            action: 'write',
            expires: Date.now() + 15 * 60 * 1000,
            contentType: contentTypeStr,
        });

        console.log("Generated signed URL for:", path);
        res.status(200).json({ url });
    } catch (err) {
        console.error('Error generating signed URL:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export const getSignedDownloadUrl = functions.https.onRequest(async (req, res) => {
    const { filename } = req.query;

    if (!filename || typeof filename !== 'string') {
        res.status(400).json({ error: 'Missing or invalid filename' });
        return;
    }

    try {
        const file = bucket.file(`uploads/${filename}`);
        const [url] = await file.getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        });
        res.status(200).json({ url });
    } catch (err) {
        console.error('Error generating signed download URL:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
