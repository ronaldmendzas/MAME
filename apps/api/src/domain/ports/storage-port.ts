export interface UploadResult {
  fileKey: string
  url: string
  bytes: number
}

export interface StoragePort {
  upload(file: ArrayBuffer, filename: string, mimeType: string): Promise<UploadResult>
  getSignedUrl(fileKey: string, expiresInSec?: number): string
  delete(fileKey: string): Promise<void>
}
