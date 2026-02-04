import { LogAdapter,BaseAdapter } from 'gd-eventlog';

export  class RNConsoleAdapter extends BaseAdapter implements LogAdapter {
    log(contextName: string, event: any, raw?: any): void {

        try {
        event.context = contextName;

        let logEvent = event;

        try {
            if ( raw!==undefined && raw!==null && this.props.depth!==undefined) {
                let {name,data} = raw.context.get(raw.event,this.props.depth);
                logEvent = data;
                logEvent.context = name;
            }
        }
        catch {}


        const message = logEvent.message
        const context = logEvent.context

        delete logEvent.ts
        delete logEvent.message
        delete logEvent.context

        const getLog = (l:any, key:string)=> {
            const v = l[key]
            if (typeof v==='function') {
                return ''
            }

            if (typeof v==='object') {
                try {
                    return `${key}:${JSON.stringify(v)}`
                }catch {}
            }
            if (typeof v==='string') {
                return `${key}:'${v}'`
            }

            return key+':'+v

        }

        const items = Object.keys(logEvent)
        const logs = items.map(key=>`${getLog(logEvent,key)}`).join('\t')
        console.log(`[${context}] ${message} ${logs}`)
        }
        catch (err:any) {
            console.log('[Err]',err.message, event, raw, err.stack)
        }



    }
}
