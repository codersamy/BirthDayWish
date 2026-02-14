// This service handles uploading files to Cloudinary.
// It requires two environment variables to be set:
// - process.env.CLOUDINARY_CLOUD_NAME: Your Cloudinary cloud name.
// - process.env.CLOUDINARY_UPLOAD_PRESET: The name of an *unsigned* upload preset you created in Cloudinary.

export const uploadToCloudinary = async (file: File, cloudName: string, uploadPreset: string): Promise<string> => {
    if (!cloudName || !uploadPreset) {
        const errorMessage = "Cloudinary credentials not provided. Cannot upload media.";
        console.error(errorMessage);
        // In a real app, you might guide the user to a configuration page or show a more prominent error.
        // For this generator, we throw an error to make the misconfiguration clear.
        throw new Error(errorMessage);
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const resourceType = file.type.startsWith('video') ? 'video' : 'image';

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message || 'Cloudinary upload failed due to a server error.');
        }

        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error('Error during Cloudinary upload:', error);
        throw new Error('Upload failed. Please check the console for details and verify your Cloudinary configuration.');
    }
};