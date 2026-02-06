import { getBindings, IncyclistBindings  } from "incyclist-services"
import { getLogBinding } from "./logging"
import { getAppInfoBinding } from "./appInfo"
import { getUserSettingsBinding } from "./user-settings"
import { getSecretBinding } from "./secret"
import { getMessageQueueBinding } from "./mq"
import { getDirectConnectBinding } from "./direct-connect"


let _bindings:IncyclistBindings|undefined

export const initBindings = async  ()=> {

    // should only be called once
    if (_bindings) {
        return _bindings
    }

    const bindings = getBindings()


    bindings.logging = getLogBinding()
    bindings.appInfo = await getAppInfoBinding()
    bindings.settings = getUserSettingsBinding()
    bindings.secret = getSecretBinding()
    bindings.mq = getMessageQueueBinding()
    bindings.wifi = getDirectConnectBinding() 

    
    // bindings.db = getRepositoryBinding() 
    // bindings.path =PathBinding.getInstance()
    // bindings.loader=FileLoader.getInstance()
    // bindings.video = new VideoProcessing()
    // bindings.fs = fs
    // bindings.downloadManager = DownloadManager.getInstance()
    // bindings.mq = MessageQueue.getInstance()
    // bindings.form = FormPostBinding.getInstance()
    // bindings.ui = NativeUiService.getInstance()
    // bindings.crypto = getCryptoBinding()
    // bindings.outh = OAuthBinding.getInstance()
    // bindings.serial = initSerialBinding()
    // bindings.ant = getAntBinding()
    // bindings.ble = getBleBinding()

    _bindings = bindings
    return bindings
    
}