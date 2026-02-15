import { EventLogger } from "gd-eventlog"
import { RestLogAdapter } from "../../bindings/logging/Adapters/RestLogAdapter"
import { ApiConfiguration } from "../IncyclistApi";
import { Platform } from "react-native";
import { getChannel} from "../../bindings/appInfo";
import { getUserSettingsBinding } from "../../bindings/user-settings";


const LOG_BLACKLIST = ['user', 'auth', 'cacheDir', 'baseDir', 'pageDir', 'appDir'];
EventLogger.setKeyBlackList(LOG_BLACKLIST);



const restLogFilter = (context:string, event:any) => {
    if (event === undefined || context === undefined)
        return false;

    if (context === 'Requests' || context === 'RestLogAdapter')
        return false;

    return true;

}


export const initRestLogging = async () => {
    try {
        const settings = getUserSettingsBinding()
        const apiConfig = ApiConfiguration.getInstance()
        

        await settings.getAll()

        const logUrl = settings.get('logRest.url',undefined)
        const sendInterval = settings.get('logRest.sendInterval',undefined)
        const enabled = settings.get('logRest.enabled',true)

        if (enabled) {

            const uuid = settings.get('uuid',undefined)

            apiConfig.addHeader('x-uuid',uuid)
            apiConfig.addHeader('x-platform',Platform.OS)
            apiConfig.addHeader('x-channel', getChannel())
            

            const restAdapter = new RestLogAdapter({url:logUrl,sendInterval});            
            EventLogger.registerAdapter(restAdapter, restLogFilter)
        }
        else {
            console.log('# Rest logging disabled', {enabled, logUrl,sendInterval})
        }
    }
    catch(err) {
        console.log('Error', err)
    }
}
