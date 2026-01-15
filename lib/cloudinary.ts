
import { v2 as cloudinary } from 'cloudinary';

const cloud_name = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();
const api_key = (process.env.CLOUDINARY_API_KEY || "").trim();
const api_secret = (process.env.CLOUDINARY_API_SECRET || "").trim();

cloudinary.config({
    cloud_name,
    api_key,
    api_secret,
});

export default cloudinary;

export interface CloudinaryUploadResult {
    public_id: string;
    secure_url: string;
    [key: string]: any;
}

export async function uploadToCloudinary(
    fileBuffer: Buffer,
    folder: string = 'uploads' // Parameter kept for signature but unused in strict simplified call below
): Promise<CloudinaryUploadResult> {
    if (!cloud_name || !api_key || !api_secret) {
        throw new Error("Missing Cloudinary credentials. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in Vercel.");
    }

    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            { resource_type: 'auto' }, // Removed folder parameter to simplify and debug signature
            (error: any, result: any) => {
                if (error) return reject(error);
                if (!result) return reject(new Error('Upload result is undefined'));
                resolve(result as CloudinaryUploadResult);
            }
        ).end(fileBuffer);
    });
}
