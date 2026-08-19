import { EventLogger } from "gd-eventlog"
import { RestLogAdapter } from "../../bindings/logging/Adapters/RestLogAdapter"
import { ApiConfiguration } from "../IncyclistApi";
import { Platform } from "react-native";
import { getAppInfoBinding, getChannel} from "../../bindings/appInfo";
import { getUserSettingsBinding } from "../../bindings/user-settings";
import { getLogBacklog } from "../../bindings/logging/Adapters/BacklogAdapter";


const DEFAULT_LOG_URL = 'https://analytics.incyclist.com/api/v1'
//const TEST_LOG_URL = 'https://analytics.test.incyclist.com/api/v1'
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

let restAdapter: RestLogAdapter | undefined

/**
 * Hands the events that were logged before this adapter existed over to it.
 *
 * They carry their original timestamps, so they sort correctly server-side even though
 * they arrive late, and they are tagged `replayed` so that is visible rather than
 * surprising. The globals are applied here because `setGlobal` only affects events logged
 * after it - a replayed event would otherwise arrive without the version and uuid that
 * every other line carries.
 */
const replayBacklog = (adapter: RestLogAdapter, globals: Record<string, any>): number => {
    const entries = getLogBacklog().drain().filter(({ context, event }) => restLogFilter(context, event));

    entries.forEach(({ context, event }) => {
        adapter.log(context, { ...globals, ...event, replayed: true });
    });

    return entries.length;
}

/**
 * Best-effort immediate flush of any queued log events, bypassing the normal 10s send interval.
 * Used before app-exit paths that may kill the process (e.g. Android back button), since queued
 * events would otherwise be lost rather than waiting for the next scheduled send.
 * Bounded by a timeout so a hung request can never delay app exit.
 */
export const flushLogs = async (timeoutMs = 2000): Promise<void> => {
    if (!restAdapter)
        return

    await Promise.race([
        restAdapter.send(true),
        new Promise<void>(resolve => setTimeout(resolve, timeoutMs))
    ])
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
            

            restAdapter = new RestLogAdapter({url:logUrl,sendInterval});
            EventLogger.registerAdapter(restAdapter, restLogFilter)
        }
        else {
            // Nothing will ever consume the backlog, so stop retaining and release it.
            getLogBacklog().stop()
            console.log('# Rest logging disabled', {enabled, logUrl,sendInterval})
        }

        const logger = new EventLogger('Incyclist')
        const appInfo = await getAppInfoBinding()
        
        const appVersion = appInfo.getAppVersion()
        const version= appInfo.getUIVersion()



        // `session` and `app-channel` are also set by incyclist-services once it initialises
        // its own logging, but that happens later in startup - so without setting them here
        // every event logged in between (all of app init, including the whole mq connect)
        // reached the server without a session to correlate it against. Both values are
        // already available at this point, and services sets the same ones afterwards.
        const globals = {
            version, appVersion, uuid,
            session: appInfo.session,
            'app-channel': getChannel(),
        }

        logger.setGlobal(globals)

        const replayed = restAdapter ? replayBacklog(restAdapter, globals) : 0

        logger.logEvent( {message:'Logging initialiazed', replayed})
    }
    catch(err) {
        console.log('Error', err)
    }
}
