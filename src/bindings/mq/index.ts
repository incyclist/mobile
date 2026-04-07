import * as Mqtt from '@fdfedin/react-native-native-mqtt';
import { EventEmitter } from 'events';
import { getSecretBinding } from '../secret';
import { EventLogger } from 'gd-eventlog';
import { v4} from 'uuid'
import { Platform } from 'react-native';

const CONNECT_RETRY_INTERVAL = 10000;   // 10 seconds
const CONNECT_RETRY_CNT = 5             // number of attempts before taking a pause
const CONNECT_TIMEOUT = 5000;           // 5 seconds

export class MessageQueue extends EventEmitter  {
    private client!: Mqtt.Client;
    private isConnected: boolean = false;
    private connectPromise!: Promise<boolean>|null
    private logger:EventLogger
    private queue: Array< {topic:string,payload:string,ts:number }>=[]
    private internalEmitter = new EventEmitter()
    

    static _instance:MessageQueue|null;

    static getInstance() {        
        MessageQueue._instance = MessageQueue._instance??new MessageQueue();
        return MessageQueue._instance;
    }


    constructor() {
        super();
        
        this.logger = new EventLogger('mq')
        this.connect()
            

    }




    enabled(): boolean {
        const uri = this.getSecret('MQ_BROKER');
        if (!uri) return false;
        if (Platform.OS === 'ios' && uri.startsWith('mqtt://')) return false;
        return true;
    }

    subscribe(topic: string) {
        try {
            if (!this.client)
                return;

            // QoS is usually required by this lib (0, 1, or 2)
            this.client.subscribe([topic], [0]); 
            this.emit('mq-subscribed',topic)
        }
        catch(err) {
            this.logError(err,'subscribe')
        }
    }

    unsubscribe(topic: string) {
        try {
            if (!this.client)
                return;

            this.client.unsubscribe([topic]);
        }
        catch(err) {
            this.logError(err,'subscribe')
        }
    }

    publish(topic: string, payload: object) {
        try {
            let message:string|undefined
            try {
                message = JSON.stringify(payload);
                if (!this.isConnected) {
                    this.queue.push( {topic,payload:message,ts:Date.now()})
                    return
                }

                this.send(topic,message)
            }
            catch {
                if (message)
                    this.queue.push( {topic,payload:message,ts:Date.now()})
            
            }
        }
        catch(err) {
            this.logError(err,'publish')
        }
    }

    private send(topic:string, message:string) {
            const data = Buffer.from( message,'utf-8')
            this.client.publish(topic, data, 0, false);

    }

    private async connect(): Promise<boolean> {
        if (this.connectPromise!==null && this.connectPromise!==undefined)
            return await this.connectPromise

        const uri = this.getSecret('MQ_BROKER')

        if (!this.enabled()) {
            this.logger.logEvent({ message: 'mqtt disabled', reason: uri? 'no broker specified' :'non-TLS broker not supported on iOS' });
            return false;
        }        

        const username = this.getSecret('MQ_USER');
        const password = this.getSecret('MQ_PASSWORD');

        if (!uri || !username || !password)
            return false

        this.client = new Mqtt.Client(uri);


        const onConnected = () => {
            this.isConnected = true;
            this.logger.logEvent( {message:'mqtt connected'})
            this.internalEmitter.emit('connected')


            if (this.queue) {
                let done = false
                while(this.queue.length && !done) {
                    const element = this.queue.pop()
                    if (!element)
                        done = true
                    else {
                        if (Date.now()-element.ts> 3600*1000)
                            continue
                        this.send( element.topic, element.payload)
                    }
                }
            }
        }

        const onDisconnected = (reason:string) => {
            this.isConnected = false;
            this.logger.logEvent( {message:'mqtt connection disconnected', reason})
            this.internalEmitter.emit('disconnected')
        }

        const onEror = (err:string) => {
            this.logger.logEvent( {message:'mqtt error', info:err})
            
        }

        this.client.on(Mqtt.Event.Connect,onConnected);
        this.client.on(Mqtt.Event.Disconnect,onDisconnected );
        this.client.on(Mqtt.Event.Message,this.onMessage.bind(this) );
        this.client.on(Mqtt.Event.Error, onEror);

        this.logger.logEvent( {message:'trying to connect to mqtt'})

        this.connectPromise = new Promise<boolean>( done=> {
            const clientId = 'mobile'+v4()
            const options: Mqtt.ConnectionOptions = {
                username, password,clientId,
                timeout:CONNECT_TIMEOUT, keepAlive:60, autoReconnect:true,                
            }

            this.connectRetries( options, CONNECT_RETRY_CNT, CONNECT_RETRY_INTERVAL,onConnected )
                .then(done)
        })

        this.isConnected = await this.connectPromise
        this.connectPromise = null
        return this.isConnected

    }

    private async connectRetries(options:Mqtt.ConnectionOptions, max:number, delay:number,onConnected:()=>void):Promise<boolean> {
        let success = false
        let failed = 0;


        const sleep = (ms:number) => new Promise<void>(done=>setTimeout(done,ms))

        while (!success) {
            success = await this.doConnect(options)
            if (success && !this.isConnected) {
                onConnected()
            }
            if (!success) {
                ++failed;
                if (failed>=max) {
                    return success
                }
                await sleep(delay)
            }
        }

        return success
    }


    private doConnect(options:Mqtt.ConnectionOptions):Promise<boolean> {
        return new Promise<boolean> (resolve=> {

            this.internalEmitter.once('connected',()=>{
                this.internalEmitter.removeAllListeners()
                resolve(true)
            })
            this.internalEmitter.once('disconnected',()=>{
                this.internalEmitter.removeAllListeners()
                resolve(false)
            })
                
            this.client.connect(options,
                (error?:Error)=>{ 
                    if (error!==null && error!==undefined) {
                        this.internalEmitter.removeAllListeners()
                        resolve(false)
                    }
                }
            )
        })
    }



    private onMessage(topic: string, message: Uint8Array)  {
        try {
            // Convert Uint8Array to string then parse JSON
            this.emit('mq-message', topic,message);
        } catch (err:any) {
            this.logger.logEvent({message:'error', fn:'onMessage',error:err.message })
        }
    }

    protected logError(err:any, fn:string) {
        this.logger.logEvent({ message:'error', fn, error:err.message, stack:err.stack})
    }

    protected getSecret(key:string) {
        return getSecretBinding().getSecret(key)
    }

}


export const getMessageQueueBinding = () =>MessageQueue.getInstance()