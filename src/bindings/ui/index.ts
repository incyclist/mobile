import { INativeUI, SelectDirectoryResult, TakeScreenshotProps } from "incyclist-services";
import { navigate } from "../../services";

export class UIBinding implements INativeUI {

    
    quit(): void {
        throw new Error("Method not implemented.");
    }
    toggleFullscreen(): void {
        return; // nothing to do UI is always full scren on mobile
    }

    // avoids that screen is turned off, because there was no user interactoin
    disableScreensaver(): void {
        throw new Error("Method not implemented.");
    }

    // re-enabels screen saver that was switched off with disableSceenSaver)=
    enableScreensaver(): void {
        throw new Error("Method not implemented.");
    }

    // take a screenshot of the current scree
    takeScreenshot(props: TakeScreenshotProps): Promise<string> {
        throw new Error("Method not implemented.");
    }

    // open a webview of a given url
    openBrowserWindow(url: string): void {
        throw new Error("Method not implemented.");
    }

    openAppWindow(url: string): void {
        // TODO: the derive the App Page based on url ( will have file:// URL)
        this.openPage(url )
    }

    // open a dialog that allows user to select a directory (to e.g. define where files should be downloaded)
    selectDirectory(): SelectDirectoryResult {
        throw new Error("Method not implemented.");
    }
    
    // open a dialog that shows a file in its parent folder. This allows the user to open or share this file
    showItemInFolder(fileName: string): void {
        throw new Error("Method not implemented.");
    }

    getPathForFile(_file: string): string {
        // not used in mobile 
        return ''
    }

    // detect the selected user language 
    detectLanguage(): Array<string> | string {
        throw new Error("Method not implemented.");
    }
    openPage(route: string) {
        // Strip leading slash if business logic provides '/main'
        const screenName = route.startsWith('/') ? route.substring(1) : route;
        navigate(screenName);
    }

}

export const getUIBinding = () => new UIBinding()