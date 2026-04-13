import { EventLogger } from "gd-eventlog"
import { RestLogAdapter } from "../../bindings/logging/Adapters/RestLogAdapter"
import { ApiConfiguration } from "../IncyclistApi";
import { Platform } from "react-native";
import { getAppInfoBinding, getChannel} from "../../bindings/appInfo";
import { getUserSettingsBinding } from "../../bindings/user-settings";


const DEFAULT_LOG_URL = 'https://analytics.test.incyclist.com/api/v1'
const DEFAULT_LOG_INTERVAL = 10

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

        const logUrl = settings.get('logRest.url',DEFAULT_LOG_URL )
        const sendInterval = settings.get('logRest.sendInterval',DEFAULT_LOG_INTERVAL)
        const enabled = settings.get('logRest.enabled',true)

        const uuid = settings.get('uuid',undefined)

        if (enabled) {

            if (uuid) {
                apiConfig.addHeader('x-uuid',uuid)
            }
            apiConfig.addHeader('x-platform',Platform.OS)
            apiConfig.addHeader('x-channel', getChannel())
            

            const restAdapter = new RestLogAdapter({url:logUrl,sendInterval});            
            EventLogger.registerAdapter(restAdapter, restLogFilter)
        }
        else {
            console.log('# Rest logging disabled', {enabled, logUrl,sendInterval})
        }

        const logger = new EventLogger('Incyclist')
        const appInfo = await getAppInfoBinding()
        
        const appVersion = appInfo.getAppVersion()
        const version= appInfo.getUIVersion()



        logger.setGlobal({version, appVersion, uuid})
        logger.logEvent( {message:'Logging initialiazed'})
    }
    catch(err) {
        console.log('Error', err)
    }
}
