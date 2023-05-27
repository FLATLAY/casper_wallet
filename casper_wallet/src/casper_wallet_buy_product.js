import axios from "axios";
import * as casper_consts from './constants'
import { CLByteArray, CLKey, CLPublicKey, CLString, CLU512, CLU64, Contracts, DeployUtil, NamedArg, RuntimeArgs } from "casper-js-sdk";
import { getCasperWalletInstance } from "./casper_wallet_auth";
async function get_price_signature(){
    let js = (await axios.get("https://apiv2dev.droplinked.com/payment/casper/signed-price")).data.data;
    return js;   
}
async function get_contract_hash(){
    let result = String((await axios.get("https://apiv2dev.droplinked.com/storage/contract_hash")).data.value);
    return casper_consts.contract_hash;
}

async function get_session(){
    let k = String((await axios.get("https://apiv2dev.droplinked.com/storage/session")).data.value);
    return k;
}

function arrayBufferToBase64(buffer) {
    const binary = [];
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) {
      binary.push(String.fromCharCode(bytes[i]));
    }
    return window.btoa(binary.join(''));
}
  
// Function to convert base64 to array buffer
function base64ToArrayBuffer(base64) {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}
/**
 * 
 * @param {number} quantity 
 * @param {number | Strign} approved_id 
 * @param {number | String} shipping_price 
 * @param {number | String} tax_price 
 * @param {number | String} product_price 
 * @param {{'publicKey' : string , 'account_hash' : string, 'signature' : string}} account_information 
 */
export async function buy_product(quantity, approved_id, shipping_price, tax_price, product_price,account_information){
    let deployParams = new DeployUtil.DeployParams(CLPublicKey.fromHex(account_information.publicKey), casper_consts.network , 1 , 1800000);
    let signed_price = await get_price_signature();
    let ratio = Number(signed_price.message.split("\n")[1].split(",")[0]);
    let shipping_price_512 = new CLU512(Math.floor(shipping_price * ratio));
    let tax_price_512 = new CLU512(Math.floor(tax_price * ratio));
    let amount_512 = new CLU512(Math.floor((product_price*quantity + tax_price + shipping_price) * ratio));
    let args = {
        "cnt" : quantity,
        "approved_id" : new CLU64(approved_id),
        "shipping_price" : shipping_price_512,
        "tax_price" : tax_price_512,
        "amount" : amount_512,
        "contract_hash" : new CLKey(new CLByteArray(Contracts.contractHashToByteArray(await get_contract_hash()))),
        "current_price_timestamp" : new CLString(String(signed_price.message.split("\n")[1])),
        "signature" : new CLString(String(signed_price.signature))
    }
    let arrayBuff = base64ToArrayBuffer(await get_session());//await (await fetch('src/session.wasm')).arrayBuffer()
    
    //console.log(arrayBuff);
    //console.log(arrayBufferToBase64(arrayBuff));
    //return;
    let module_bytes = new Uint8Array(arrayBuff);
    let named_args = [];
    named_args.push(new NamedArg("amount" , args.amount));
    named_args.push(new NamedArg("approved_id" , args.approved_id));
    named_args.push(new NamedArg("cnt" , new CLU64(quantity)));
    named_args.push(new NamedArg("shipping_price" , args.shipping_price));
    named_args.push(new NamedArg("tax_price" , args.tax_price));
    named_args.push(new NamedArg("contract_hash" , args.contract_hash));
    named_args.push(new NamedArg("current_price_timestamp" , args.current_price_timestamp));
    named_args.push(new NamedArg("signature" , args.signature));

    let runtime_args = RuntimeArgs.fromNamedArgs(named_args);
    const kk = DeployUtil.ExecutableDeployItem.newModuleBytes(module_bytes , runtime_args);
    const payment = DeployUtil.standardPayment(48013050000);
    let deploy = DeployUtil.makeDeploy(deployParams , kk , payment);
    const json = DeployUtil.deployToJson(deploy);
    const signature = await getCasperWalletInstance().sign(JSON.stringify(json), account_information.publicKey).catch((reason)=>{
        return "Cancelled";
    });
    const signedDeploy = DeployUtil.setSignature(
        deploy,
        signature.signature,
        CLPublicKey.fromHex(account_information.publicKey)
      );
    const deployres = await casper_consts.casperService.deploy(signedDeploy);
    return {"deploy" : deployres, "deployHash" : deployres.deploy_hash};
}