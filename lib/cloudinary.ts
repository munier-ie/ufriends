
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

export interface CloudinaryUploadResult {
    public_id: string;
    secure_url: string;
    [key: string]: any;
}

export async function uploadToCloudinary(
    fileBuffer: Buffer,
    folder: string = 'uploads'
): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            { folder, resource_type: 'auto' },
            (error: any, result: any) => {
                if (error) return reject(error);
                if (!result) return reject(new Error('Upload result is undefined'));
                resolve(result as CloudinaryUploadResult);
            }
        ).end(fileBuffer);
    });
}
