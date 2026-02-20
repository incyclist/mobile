import { createThumbnail } from 'react-native-create-thumbnail';
import { EventLogger } from 'gd-eventlog';
import type { ScreenshotProps,IVideoProcessor } from 'incyclist-services'

export class VideoProcessorBinding implements IVideoProcessor {
    isScreenshotSuported(): boolean {
        return false;
    }

    isConvertSuported(): boolean {
        return false;
    }

    /**
     * Creates a thumbnail from a video URL (local or remote)
     * @param url The video URL (file:// or https://)
     * @param props ScreenshotProps containing position in seconds
     * @returns Path to the generated image file
     */
    async screenshot(url: string, props?: ScreenshotProps): Promise<string> {
        try {
            // Convert position to milliseconds. 
            // If position is a string or undefined, default to 0.
            const time = props?.position ? Number(props.position) * 1000 : 0;

            const thumbnail = await createThumbnail({
                url,
                timeStamp: time,
                format: 'jpeg',
                cacheName: `thumb_${Date.now()}` // Optional: helps with cache management
            });

            return thumbnail.path;
        } catch (err: any) {
            const logger = new EventLogger('VideoBinding')
            logger.logEvent({message:'Could not create thumbnail', url, reason:err.message})
            throw err
        }
    }
    async convert(): Promise<any> {
        throw new Error('Video conversion not supported on mobile');
    }

    async convertOnline(): Promise<any> {
        throw new Error('Video conversion not supported on mobile');
    }
}

export const getVideoBinding = () => new VideoProcessorBinding();