// Google Drive API v3 Integration Client
export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  iconLink?: string;
  thumbnailLink?: string;
  webViewLink?: string;
  webContentLink?: string;
  shared?: boolean;
  owners?: { displayName: string; emailAddress: string; photoLink?: string }[];
  parents?: string[];
}

export interface GoogleDriveQuota {
  limit?: string;
  usage?: string;
  usageInDrive?: string;
  usageInDriveTrash?: string;
}

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

/**
 * Fetch files and folders from Google Drive
 */
export async function fetchGoogleDriveFiles(
  accessToken: string,
  folderId: string = 'root',
  searchQuery: string = '',
  filterCategory: string = 'all'
): Promise<GoogleDriveFile[]> {
  try {
    let qParts: string[] = [`trashed = false`];

    if (searchQuery.trim()) {
      const escaped = searchQuery.replace(/'/g, "\\'");
      qParts.push(`name contains '${escaped}'`);
    } else {
      qParts.push(`'${folderId}' in parents`);
    }

    if (filterCategory === 'images') {
      qParts.push(`mimeType contains 'image/'`);
    } else if (filterCategory === 'videos') {
      qParts.push(`mimeType contains 'video/'`);
    } else if (filterCategory === 'audio') {
      qParts.push(`mimeType contains 'audio/'`);
    } else if (filterCategory === 'documents') {
      qParts.push(
        `(mimeType contains 'pdf' or mimeType contains 'document' or mimeType contains 'text/' or mimeType contains 'sheet' or mimeType contains 'presentation')`
      );
    } else if (filterCategory === 'folders') {
      qParts.push(`mimeType = 'application/vnd.google-apps.folder'`);
    }

    const query = encodeURIComponent(qParts.join(' and '));
    const fields = encodeURIComponent(
      'files(id, name, mimeType, size, createdTime, modifiedTime, iconLink, thumbnailLink, webViewLink, webContentLink, shared, owners, parents)'
    );
    const orderBy = encodeURIComponent('folder,modifiedTime desc');

    const res = await fetch(
      `${DRIVE_API_BASE}/files?q=${query}&fields=${fields}&orderBy=${orderBy}&pageSize=60`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    );

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Google Drive API error: ${res.statusText}`);
    }

    const data = await res.json();
    return data.files || [];
  } catch (error: any) {
    console.error('Failed to fetch Google Drive files:', error);
    throw error;
  }
}

/**
 * Fetch Drive User Storage Quota
 */
export async function fetchGoogleDriveQuota(accessToken: string): Promise<GoogleDriveQuota | null> {
  try {
    const res = await fetch(`${DRIVE_API_BASE}/about?fields=storageQuota`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.storageQuota || null;
  } catch {
    return null;
  }
}

/**
 * Create a new folder inside Google Drive
 */
export async function createGoogleDriveFolder(
  accessToken: string,
  folderName: string,
  parentFolderId: string = 'root'
): Promise<GoogleDriveFile> {
  try {
    const metadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    };

    const res = await fetch(`${DRIVE_API_BASE}/files`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || 'فشل إنشاء المجلد في Google Drive');
    }

    return await res.json();
  } catch (error: any) {
    console.error('Failed to create folder in Drive:', error);
    throw error;
  }
}

/**
 * Upload a standard file (Blob/File) using multipart upload
 */
export async function uploadFileToGoogleDrive(
  accessToken: string,
  file: File,
  parentFolderId: string = 'root',
  onProgress?: (percent: number) => void
): Promise<GoogleDriveFile> {
  try {
    const metadata = {
      name: file.name,
      mimeType: file.type || 'application/octet-stream',
      parents: [parentFolderId],
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const fileReader = new FileReader();

    const fileDataPromise = new Promise<ArrayBuffer>((resolve, reject) => {
      fileReader.onload = () => resolve(fileReader.result as ArrayBuffer);
      fileReader.onerror = () => reject(fileReader.error);
      fileReader.readAsArrayBuffer(file);
    });

    const fileArrayBuffer = await fileDataPromise;

    const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
      metadata
    )}\r\n`;

    const mediaHeader = `${delimiter}Content-Type: ${metadata.mimeType}\r\n\r\n`;

    const encoder = new TextEncoder();
    const metadataBuffer = encoder.encode(metadataPart);
    const mediaHeaderBuffer = encoder.encode(mediaHeader);
    const closeDelimiterBuffer = encoder.encode(closeDelimiter);

    const totalLength =
      metadataBuffer.byteLength +
      mediaHeaderBuffer.byteLength +
      fileArrayBuffer.byteLength +
      closeDelimiterBuffer.byteLength;

    const combined = new Uint8Array(totalLength);
    let offset = 0;

    combined.set(metadataBuffer, offset);
    offset += metadataBuffer.byteLength;

    combined.set(mediaHeaderBuffer, offset);
    offset += mediaHeaderBuffer.byteLength;

    combined.set(new Uint8Array(fileArrayBuffer), offset);
    offset += fileArrayBuffer.byteLength;

    combined.set(closeDelimiterBuffer, offset);

    if (onProgress) onProgress(50);

    const res = await fetch(
      `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,thumbnailLink`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: combined,
      }
    );

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || 'فشل رفع الملف إلى Google Drive');
    }

    if (onProgress) onProgress(100);

    return await res.json();
  } catch (error: any) {
    console.error('Failed to upload file to Google Drive:', error);
    throw error;
  }
}

/**
 * Upload text/JSON payload directly (useful for Chat backups and exports)
 */
export async function uploadTextToGoogleDrive(
  accessToken: string,
  filename: string,
  content: string,
  mimeType: string = 'application/json',
  parentFolderId: string = 'root'
): Promise<GoogleDriveFile> {
  try {
    const blob = new Blob([content], { type: mimeType });
    const file = new File([blob], filename, { type: mimeType });
    return await uploadFileToGoogleDrive(accessToken, file, parentFolderId);
  } catch (error: any) {
    console.error('Failed to upload text to Drive:', error);
    throw error;
  }
}

/**
 * Delete a file or folder from Google Drive
 */
export async function deleteGoogleDriveFile(accessToken: string, fileId: string): Promise<void> {
  try {
    const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok && res.status !== 204) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || 'فشل حذف الملف من Google Drive');
    }
  } catch (error: any) {
    console.error('Failed to delete file from Google Drive:', error);
    throw error;
  }
}

/**
 * Ensure a "Chat Backups" folder exists, creating it if necessary
 */
export async function getOrCreateChatBackupsFolder(accessToken: string): Promise<string> {
  try {
    const files = await fetchGoogleDriveFiles(accessToken, 'root', 'نسخ الدردشة الاحتياطية', 'folders');
    const existing = files.find(
      (f) => f.name === 'نسخ الدردشة الاحتياطية' && f.mimeType === 'application/vnd.google-apps.folder'
    );
    if (existing) return existing.id;

    const newFolder = await createGoogleDriveFolder(accessToken, 'نسخ الدردشة الاحتياطية', 'root');
    return newFolder.id;
  } catch {
    return 'root';
  }
}

/**
 * Helpers for formatting bytes into human readable format
 */
export function formatBytes(bytes?: number | string): string {
  if (!bytes) return '0 B';
  const num = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (isNaN(num) || num === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(num) / Math.log(k));
  return parseFloat((num / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
