import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export interface R2Config {
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
}

export class R2StorageService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(config: R2Config) {
    this.bucketName = config.bucketName;
    this.s3Client = new S3Client({
      region: 'auto', // R2 uses 'auto' region
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async uploadFile(key: string, file: File | ArrayBuffer, contentType: string): Promise<string> {
    const buffer = file instanceof File ? await file.arrayBuffer() : file;
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: new Uint8Array(buffer),
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000', // Cache for 1 year
    });

    await this.s3Client.send(command);
    
    // Return the public URL (adjust based on your R2 setup)
    return `https://${this.bucketName}.your-r2-domain.com/${key}`;
  }

  async getFile(key: string): Promise<ArrayBuffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const response = await this.s3Client.send(command);
    
    if (!response.Body) {
      throw new Error('File not found');
    }

    // Convert stream to ArrayBuffer
    const bytes = await response.Body.transformToByteArray();
    return bytes.buffer;
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  getPublicUrl(key: string): string {
    // Return the public URL for the file
    // This would be your R2 domain + key
    return `https://${this.bucketName}.your-r2-domain.com/${key}`;
  }
}

// Factory function to create R2 service from environment
export function createR2Service(env: any): R2StorageService | null {
  if (!env.R2_BUCKET_NAME || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_ENDPOINT) {
    console.warn('R2 environment variables not found, falling back to in-memory storage');
    return null;
  }

  return new R2StorageService({
    bucketName: env.R2_BUCKET_NAME,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    endpoint: env.R2_ENDPOINT,
  });
}
