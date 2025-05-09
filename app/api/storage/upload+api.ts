import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import heicConvert from 'heic-convert';

// --- GCP Storage Initialization ---
let gcsClient: Storage | null = null;
let bucketName: string | undefined;

function initGCPStorageOnce() {
    if (gcsClient) return gcsClient;
    try {
        // if (!process.env.GCP_CREDENTIALS_BASE64) {
        //     throw new Error('GCP_CREDENTIALS_BASE64 environment variable is not set.');
        // }
        const decodedCredentials = Buffer.from('ewogICAidHlwZSI6ICJzZXJ2aWNlX2FjY291bnQiLAogICAicHJvamVjdF9pZCI6ICJsb29rYWktcHJvamVjdDAiLAogICAicHJpdmF0ZV9rZXlfaWQiOiAiNjhkYzFmNzhkMjdhNWNiMzhlZmI1NjFiMTUwN2Y2ZjBiZjdmYTE1YSIsCiAgICJwcml2YXRlX2tleSI6ICItLS0tLUJFR0lOIFBSSVZBVEUgS0VZLS0tLS1cbk1JSUV2UUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktjd2dnU2pBZ0VBQW9JQkFRQzhXRU5mSk9xZk5keTFcblM5cU9JVGM3TkVkY05OTXEzdGx3d2g5WkFFdkJhQmpUK0ZvUWc4Ymh6YXpkekJVS1hrSXZJK1I1YlFXUTVwcS9cbjBKUERpTnovbmdWRnhTd0pXWXoxZEJvSWt3OGpNc2lIVHZUUE1qNS9ZVDd5WndRRmZsaFZtR2xlWG1DVkl1OTlcbmtqTlBBa2JpWUpJdlN3Q21hcTE3WEM2TEZ6MEZ2Z0IvRkdvV2ZjTHBweStKSDVITW4vWXZodkx1WUEvQkRWQlpcbllSUWpvNkZzdXJuRG5wem9xMWRYa2lWYXNTbTVhTVFtajJvV0Frbm14WWt0OWJuczdEZE93QitDdGhpdTF6NFBcbk5MQlcyQW4vZS96MkdEV29UREdmSzQ5RW5TQ1lOUXcyNzdITUZqOVlJbjNHUWYxbTR2UXRzZEtia2RpcVNwRUJcbkwxeCtvTnp2QWdNQkFBRUNnZ0VBTHh0bVVsd3g0SHRBeGdtQVV1OGsyTVoxR0s5UHA1ZlFTNzhKeHlGblVTcmZcbmx0aTFjZzc3aGN1QzhvQ1NQS01ocTVldkU5MjhPQ2N0U2s5NVBiMDBCU3o1UlorUXFZLy96UDVxYW4yWm1pU2ZcbitoTzU4RDZ4V2Z1eEdrREF4VHo2REFLUVRCMlB5NDFPMkJuaWdsN2Y2c3ZibEQrT25KRHU3ZjA2Mk9nSmg2ODFcbmVuZmZKSGJSa0hIajN1VlVWZU45S2g3SFBWalRPd0hnWVVpanBDUkdtK0ZRY2FnaVJtZzRUT2lzczBKTllQUWpcbmlwTzUyUmJ4R1M5clRWdWtSSGN4R1ovc1JSRFRsTitLTnIzc3BFR3pqUzYwSGFIZDExVkFIQjhwQnU1SDJtV2dcbmNVK0pNNmNGNlN2NmFRZDVqY1I3dS9aRVZCZVRiNlJqUFRFT3UwRmVyUUtCZ1FEb3dZU0JDZStiWDZpOC9mRFJcbkFyNlk3Sy9qTDBCeXZVbytqV2dMY2lUTXF6Q01UWWxmNTFSV1BXNDdFUWpwWWRWYXh4TGJFRUhVZEEzUWRSUjVcbnNJMUJiUWYvT09waVkrVGY1NHlmSHR3UE5wV3BMSFE1cE9PK0x0V1JVME9CbWdaMnlGam1FSXVveFRqQ0NDcnhcbmRkVko4VFJNQlFzOCtXaFVwanBtZWpiK2RRS0JnUURQSjF3Y3JTbDlPT1lpSVhaWGVWbUErRGdJOFd0MTBRYVdcblZjek9MVHFwdmZUbnFHRUlaVmRPUEpYNmZBWld3K3lrNzZTWW9WMFFXQTdHa2lZRHJRbnJsYWp5ZlRWTlZITEVcbndvRmVPRHlUKzJsalBIeVl2RDVzbDZaTjc1eVlBa291MXR5cGZzek9qNUtSb1A3cWNBS2poWDczUWVMb3d2clJcbjh4dnh3YWxKVXdLQmdRREJYTXNrbkVtSFRiQVQyZTh1NUZYTkc0eC9jeWphYVhEOWlHSXdhQkkwU2QrYUgyd0pcbjFWZFdFZEM2bDB0TS8yN003R2M0d0VmQUpPMjVDUnNLZ1diSVBMa1JDWXFHVkxDMlpsbUhjNDZqd05nU1pCRG1cbk5wclF5MzIzTG5IOWdDVHdsejVyV3NGN1l1VGxKUDN2L05GRmpYSEIyY3JkUytHbHVUYjVIWDBFWlFLQmdIbFZcblFueUJhRld5S0FsQnRFRVVFTHFicUthRVVUN1d5WmJ3ZGw4azJzRmxRN2NVUnBGV1drYTI4ZG1mSDA5ZXZwTDBcbjBtR2IwaGlxbXl6dm1WaDUxOSttN3lmbzhubHl4eTQ4QnU0YTNsQ0c1M2w2aWpnanVpUjh4cW5MZU5zSUxFODNcbkJsUTRzdGtoK3VWVmVUbnpsWGdWendJZ0V6bm1TbWNDa0JHUUx3bUZBb0dBVnYrSjhWOEZkaDdHODhIVG1odmtcblRJQXVrV29hR2FEY3M1M29qNWZ1YmhzaXlHd1BYMzZaamdNQ25OQ3o2WXRmMG8zTHovaVNZakNtS1ZSeW9vY2dcbkpHWUZmQ2dDK0E2NjdWeGhpSjJOTkhMUXU2TG9YWkliWTVGdmMwcGQzSGtPQjVsekpiM21CM1kycjZJQ2F0TXlcbjk1TUlDOUh1SDRvd2o3bUlMYTl0alpjPVxuLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLVxuIiwKICAgImNsaWVudF9lbWFpbCI6ICJpbWFnZS1hY2Nlc3NAbG9va2FpLXByb2plY3QwLmlhbS5nc2VydmljZWFjY291bnQuY29tIiwKICAgImNsaWVudF9pZCI6ICIxMDg4NTg3NjUwNjI4MTM0Nzk4MTgiLAogICAiYXV0aF91cmkiOiAiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tL28vb2F1dGgyL2F1dGgiLAogICAidG9rZW5fdXJpIjogImh0dHBzOi8vb2F1dGgyLmdvb2dsZWFwaXMuY29tL3Rva2VuIiwKICAgImF1dGhfcHJvdmlkZXJfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9vYXV0aDIvdjEvY2VydHMiLAogICAiY2xpZW50X3g1MDlfY2VydF91cmwiOiAiaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vcm9ib3QvdjEvbWV0YWRhdGEveDUwOS9pbWFnZS1hY2Nlc3MlNDBsb29rYWktcHJvamVjdDAuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICAidW5pdmVyc2VfZG9tYWluIjogImdvb2dsZWFwaXMuY29tIgp9IA==', 'base64').toString('utf-8');
        const credentials = JSON.parse(decodedCredentials);
        bucketName = process.env.GCP_BUCKET_NAME || credentials.gcs_bucket_name || 'lookai-ui'; // Allow bucket name in credentials too
        
        gcsClient = new Storage({
            projectId: process.env.GCP_PROJECT_ID || credentials.project_id,
            credentials,
        });
        console.log('GCP Storage client initialized successfully for bucket:', bucketName);
        return gcsClient;
    } catch (error: any) {
        console.error('Error initializing GCP Storage:', error);
        gcsClient = null; 
        throw new Error(`Failed to initialize GCP Storage client: ${error.message}`);
    }
}

// --- Helper Functions ---

const extractBase64Data = (data: string): { contentType: string; buffer: Buffer; extension: string } | null => {
    // ... (implementation from previous step)
    if (!data) return null;
    try {
        const matches = data.match(/^data:([A-Za-z0-9-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
            const mimeType = matches[1];
            return {
                contentType: mimeType,
                buffer: Buffer.from(matches[2], 'base64'),
                extension: getExtensionFromMimeType(mimeType) || 'jpeg',
            };
        }
        return {
            contentType: 'image/jpeg',
            buffer: Buffer.from(data, 'base64'),
            extension: 'jpeg',
        };
    } catch (error) {
        console.error('Error extracting base64 data:', error);
        return null;
    }
};

const getExtensionFromMimeType = (mimeType?: string): string | null => {
    // ... (implementation from previous step)
    if (!mimeType) return 'jpeg';
    const parts = mimeType.split('/');
    return parts[1]?.split('+')[0] || 'jpeg'; 
};

const convertHeicToJpegIfNeeded = async (buffer: Buffer, originalName: string = '', contentType?: string): Promise<{ buffer: Buffer; finalContentType: string; finalExtension: string }> => {
    // ... (implementation from previous step)
    const isHeicByName = originalName.toLowerCase().endsWith('.heic') || originalName.toLowerCase().endsWith('.heif');
    const isHeicByType = contentType === 'image/heic' || contentType === 'image/heif';
    if (!isHeicByName && !isHeicByType) {
        return { buffer, finalContentType: contentType || 'image/jpeg', finalExtension: getExtensionFromMimeType(contentType) || 'jpeg' };
    }
    console.log('HEIC/HEIF image detected, attempting conversion to JPEG');
    try {
        const jpegBuffer = await heicConvert({
            buffer: buffer,
            format: 'JPEG',
            quality: 0.9,
        });
        console.log('HEIC conversion successful');
        return { buffer: Buffer.from(jpegBuffer), finalContentType: 'image/jpeg', finalExtension: 'jpeg' };
    } catch (error) {
        console.error('Error converting HEIC to JPEG:', error);
        console.warn('Proceeding with original HEIC/HEIF buffer after conversion failure.')
        return { buffer, finalContentType: contentType || 'application/octet-stream', finalExtension: getExtensionFromMimeType(contentType) || 'heic' };
    }
};

// --- API Route Handler ---

export async function POST(request: NextRequest) {
    try {
        const gcs = initGCPStorageOnce();
        if (!gcs || !bucketName) {
             throw new Error("GCS Client or Bucket Name not initialized.");
        }
        const bucket = gcs.bucket(bucketName);

        const authorization = request.headers.get('authorization');
        if (!authorization) {
            console.warn("WARN: No authorization header found in upload request.");
        }

        const contentTypeHeader = request.headers.get('content-type') || 'multipart/form-data';
        let fileBuffer: Buffer;
        let detectedType: string;
        let fileExtension: string;
        let originalName: string = 'uploaded_file';

        if (contentTypeHeader.includes('multipart/form-data')) {
            const formData = await request.formData();
            const file = formData.get('file') as File | null;
            if (!file) {
                return NextResponse.json({ error: 'No file found in form data' }, { status: 400 });
            }
            fileBuffer = Buffer.from(await file.arrayBuffer());
            detectedType = file.type || 'application/octet-stream';
            originalName = file.name || originalName;
            const conversionResult = await convertHeicToJpegIfNeeded(fileBuffer, originalName, detectedType);
            fileBuffer = conversionResult.buffer;
            detectedType = conversionResult.finalContentType;
            fileExtension = conversionResult.finalExtension;
        } else if (contentTypeHeader.includes('application/json') || contentTypeHeader.includes('text/plain')) {
            const rawBody = await request.text();
            const extracted = extractBase64Data(rawBody);
            if (!extracted) {
                return NextResponse.json({ error: 'Invalid base64 image data' }, { status: 400 });
            }
            fileBuffer = extracted.buffer;
            detectedType = extracted.contentType;
            const conversionResult = await convertHeicToJpegIfNeeded(fileBuffer, 'base64_upload', detectedType);
            fileBuffer = conversionResult.buffer;
            detectedType = conversionResult.finalContentType;
            fileExtension = conversionResult.finalExtension;
        } else {
            return NextResponse.json({ error: `Unsupported Content-Type: ${contentTypeHeader}` }, { status: 415 });
        }

        const timestamp = Date.now();
        const uniqueId = uuidv4();
        const fileName = `uploads/${timestamp}-${uniqueId}.${fileExtension}`;
        const gcsFile = bucket.file(fileName);

        const stream = gcsFile.createWriteStream({
            resumable: false,
            contentType: detectedType,
            metadata: {
                contentType: detectedType,
                metadata: {
                  originalName: originalName,
                  uploadedAt: new Date().toISOString(),
                },
            },
        });

        // Store the result from the promise
        const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
            stream.on('error', (err: Error) => { 
                console.error('GCP Upload Stream Error:', err);
                reject(new Error(`Failed to upload to GCP: ${err.message}`));
            });
            stream.on('finish', async () => {
                try {
                    // Make the file publicly accessible
                    const [signedUrl] = await gcsFile.getSignedUrl({
                      action: 'read',
                      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
                    });
            
                    
                    // Resolve the promise with the public URL
                    resolve({ secure_url: signedUrl }); 

                } catch (error: any) {
                    console.error('Error making file public, falling back to signed URL:', error);
                    // Fallback: Still return success if we can't make it public, just use a signed URL
                    reject(new Error(`Failed to upload to GCP: ${error.message}`));
                }
            });
            stream.end(fileBuffer);
        });

        // Respond with the resolved URL and other useful info
        return NextResponse.json({
            secure_url: uploadResult.secure_url, 
            public_id: fileName, 
            format: fileExtension,
            resource_type: 'image',
            bytes: fileBuffer.length,
            asset_id: uniqueId, 
            created_at: new Date().toISOString(),
            type: 'upload',
            url: uploadResult.secure_url // Duplicate URL often useful for compatibility
        });

    } catch (error: any) {
        console.error('File upload API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to upload file' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    // ... (GET handler remains the same)
    try {
        initGCPStorageOnce();
        if (!gcsClient || !bucketName) {
             return NextResponse.json({ status: "error", message: "GCS Client or Bucket Name not initialized." });
        }
        return NextResponse.json({ status: "ok", message: "File upload API is ready. Use POST.", bucket: bucketName });
    } catch (error: any) {
        return NextResponse.json({ status: "error", message: `GCS Initialization Failed: ${error.message}` });
    }
} 