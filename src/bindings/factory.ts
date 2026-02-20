import { getBindings, IncyclistBindings  } from "incyclist-services"
import { getLogBinding } from "./logging"
import { getAppInfoBinding } from "./appInfo"
import { getUserSettingsBinding } from "./user-settings"
import { getSecretBinding } from "./secret"
import { getMessageQueueBinding } from "./mq"
import { getDirectConnectBinding } from "./direct-connect"
import { getBleBinding } from "./ble"
import { getUIBinding } from "./ui"
import { getFileSystemBinding } from "./fs"
import { getPathBinding } from "./path"
import { getVideoBinding } from "./video"
import { getRepositoryBinding } from "./db"
import { getFileLoaderBinding } from "./loader"
import { getCryptoBinding } from "./crypto"


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
    bindings.ble = getBleBinding()
    bindings.ui = getUIBinding()
    bindings.fs = getFileSystemBinding()
    bindings.path = getPathBinding()
    bindings.video = getVideoBinding()
    bindings.db = getRepositoryBinding()
    bindings.loader = getFileLoaderBinding()
    bindings.crypto = getCryptoBinding()

    
    // bindings.downloadManager = DownloadManager.getInstance()
    // bindings.form = FormPostBinding.getInstance()
    // bindings.crypto = getCryptoBinding()
    // bindings.outh = OAuthBinding.getInstance()

    _bindings = bindings
    return bindings
    
}