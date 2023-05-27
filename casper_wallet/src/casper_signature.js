import { CasperServiceByJsonRPC, Keys } from "casper-js-sdk";
import {Buffer} from 'buffer'
import axios from "axios";

export const apiUrl = "https://apiv2.droplinked.com/http-req?method=post&url=http://188.40.47.161";
export const casperService = new CasperServiceByJsonRPC(apiUrl+":7777/rpc");

async function getCasperRatio(usd_amount){
    let js = (await axios.post("https://apiv2.droplinked.com/payment/casper/price",{
        "usd_amount" : usd_amount   
    })).data.data;
    return js
}
async function get_signed_price_and_block_time(){
    let private_key = Keys.Ed25519.readBase64WithPEM("MC4CAQAwBQYDK2VwBCIEILs3mmIF5oZMLt1rt/rAm+aqlmG9HTABvzIGzeRHxR/i");
    let public_key = Keys.Ed25519.readBase64WithPEM("MCowBQYDK2VwAyEA/xoC/wj+cchucyMQX4fkWUUPNmhP5iTo4hgHh2B5AdQ=");
    let keyPair = Keys.Ed25519.parseKeyPair(public_key, private_key); 
    let price = (await getCasperRatio(1));
    let message = "Casper Message:\n"+String(price) + "," + String(new Date((await casperService.getStatus()).last_added_block_info.timestamp).getTime());   
    const signature = keyPair.sign(Buffer.from(message));
    return {
        'message' : message,
        'signature' : Buffer.from(signature).toString('hex'),
    }
}
export {get_signed_price_and_block_time}