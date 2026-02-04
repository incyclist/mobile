import { ConsoleAdapter, EventLogger, LogAdapter } from "gd-eventlog";
//import { ConsoleAdapter,  } from "./Adapters/ConsoleAdapter";


export type LogAdapterProps = {
    mode: 'development' | 'production'
}

export type ILogBinding = {
    createAdapter: (props: LogAdapterProps) => LogAdapter;
    EventLogger: any;
};
export class EventLogging implements ILogBinding {
    protected static _instance: EventLogging;  
    protected adapter!: LogAdapter

    static getInstance() {
        if (!EventLogging._instance) {
            EventLogging._instance = new EventLogging();
        }
        return this._instance;
    }

    get EventLogger():any {
        return EventLogger
    }

    createAdapter (props: LogAdapterProps):LogAdapter {
        if (props.mode==='development') {
            this.adapter = new ConsoleAdapter({depth:1} )
        }
        return this.adapter

    }


}

export const getLogBinding = () => { return new EventLogging() }