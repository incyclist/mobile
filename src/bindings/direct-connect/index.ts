import { ReactNativeMdnsBinding } from './mdns/binding';
import { ReactNativeNetBinding } from './net/binding';
import { DirectConnectBinding } from './types';

class DirectConnect implements DirectConnectBinding  {
    static _instance:DirectConnect|null;

    static getInstance() {        
        DirectConnect._instance = DirectConnect._instance??new DirectConnect();
        return DirectConnect._instance;
    }


    public net: ReactNativeNetBinding
    public mdns: ReactNativeMdnsBinding

    constructor() {
        this.net  = new ReactNativeNetBinding()
        this.mdns = new ReactNativeMdnsBinding()

    }
};

export const getDirectConnectBinding = () => DirectConnect.getInstance()  

