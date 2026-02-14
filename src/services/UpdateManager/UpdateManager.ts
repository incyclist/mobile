import { unzip } from 'react-native-zip-archive';
import { Platform } from 'react-native';
import { CachesDirectoryPath, copyFile, DocumentDirectoryPath, downloadFile, exists, mkdir, unlink } from 'react-native-fs';

const BUNDLE_DIR = `${DocumentDirectoryPath}/bundle`;
const ZIP_TEMP_PATH = `${CachesDirectoryPath}/update.zip`;

export class UpdateManager {
  /**
   * Simple check to see if we already have a local bundle
   */
  static async hasLocalBundle(): Promise<boolean> {
    const bundleFile = Platform.OS === 'ios' ? 'main.jsbundle' : 'index.android.bundle';
    return await exists(`${BUNDLE_DIR}/${bundleFile}`);
  }

  /**
   * Downloads the ZIP, wipes the old bundle folder, and extracts the new one
   */
  static async downloadAndUnpack(url: string): Promise<void> {
    try {


      const isLocal = url.startsWith('file://');
      const sourcePath = isLocal ? url.replace('file://', '') : url;

      if (isLocal) {
        console.log('[UpdateManager] Local file detected, copying instead of downloading...');
        // Clean up any old temp zip
        if (await exists(ZIP_TEMP_PATH)) await unlink(ZIP_TEMP_PATH);
        
        // Copy to our managed temp path
        await copyFile(sourcePath, ZIP_TEMP_PATH);
      } else {
        console.log('[UpdateManager] Remote URL detected, downloading...');
        // Use your existing downloadFile logic here for production

        console.log(`download file ... ${url} -> ${ZIP_TEMP_PATH}`)
        // 1. Download to cache
        const download = downloadFile({
            fromUrl: url,
            toFile: ZIP_TEMP_PATH,
        });
        const result = await download.promise;
        if (result.statusCode !== 200) throw new Error('Download failed');

      }


      // 2. Prepare clean directory
      if (await exists(BUNDLE_DIR)) {
        await unlink(BUNDLE_DIR);
      }
      await mkdir(BUNDLE_DIR);

      // 3. Unpack
      await unzip(ZIP_TEMP_PATH, BUNDLE_DIR);
      
      // 4. Cleanup
      await unlink(ZIP_TEMP_PATH);
    } catch (error) {
      console.error('[UpdateManager] Error:', error);
      throw error;
    }
  }

  /**
   * Utility to wipe the local bundle (useful for testing fallbacks)
   */
  static async clearLocalBundle(): Promise<void> {
    if (await exists(BUNDLE_DIR)) {
      await unlink(BUNDLE_DIR);
    }
  }  
}
