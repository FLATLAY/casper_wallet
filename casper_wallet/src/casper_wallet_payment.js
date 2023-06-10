import { getCasperWalletInstance } from "./casper_wallet_auth";
import axios from "axios";
import { CLByteArray, CLKey, CLPublicKey, CLString, CLU512, Contracts, DeployUtil, NamedArg, PurseIdentifier, RuntimeArgs } from "casper-js-sdk";
import * as casper_consts from './constants'

/**
 * 
 * @param {DeployUtil.Deploy} deploy_object 
 */
async function transfer_details(deploy_object) {    
    if (!deploy_object.isTransfer()){
        return false;
    }
    let amount = Number(deploy_object.session.asTransfer().args.args.get("amount").data)/(1000000000);
    let target = CLPublicKey.fromEd25519(deploy_object.session.asTransfer().args.args.get("target").data);
    let sender = deploy_object.header.account.toHex();
    return{
        'sender' : sender,
        'amount_in_cspr' : amount,
        'target' : target.toHex()
    }
}
/**
 * 
 * @param {number} usd_amount is the amount of USDs you want to convert to motes (each mote is 10^-9 CSPR) 
 * @returns  the amount of motes that are equal to $usd_amount dollars 
 */
export async function getCasperRatio(usd_amount){
    let js = (await axios.post("https://apiv2.droplinked.com/payment/casper/price",{
        "usd_amount" : usd_amount   
    })).data.data;
    return js
}
async function customerPayment1(sender_publicKey, reciver_publicKey, amount_in_usd){
    await getCasperWalletInstance().requestConnection();
    let amount_of_motes = (await getCasperRatio(amount_in_usd));
    const toPublicKey = CLPublicKey.fromHex(reciver_publicKey);
    const fromPublicKey = CLPublicKey.fromHex(sender_publicKey);
    const deploy = DeployUtil.makeDeploy(
        new DeployUtil.DeployParams(fromPublicKey, casper_consts.network , 1, 1800000),
        DeployUtil.ExecutableDeployItem.newTransfer(amount_of_motes.value(), toPublicKey, null, 0),
        DeployUtil.standardPayment(100000000)
    );
    const json = DeployUtil.deployToJson(deploy);
    const signature = await getCasperWalletInstance().sign(JSON.stringify(json), sender_publicKey, reciver_publicKey).catch((reason)=>{
        console.log("cancelled by ueser");
        return "cancelled";
    });
    const signedDeploy = DeployUtil.setSignature(
        deploy,
        signature.signature,
        CLPublicKey.fromHex(sender_publicKey)
    );
    const signed = await casper_consts.casperService.deploy(signedDeploy);
    let transfer_detail = await transfer_details(signedDeploy);
    return {
        'deploy_hash' : signed.deploy_hash,
        'sender' : transfer_detail.sender,
        'target' : transfer_detail.target,
        'cspr_amount' : transfer_detail.amount_in_cspr
    }
}

async function get_payment(){
    let k = String((await axios.get("https://apiv2dev.droplinked.com/storage/payment")).data.value);
    return k;
}
async function get_price_signature(){
    let js = (await axios.get("https://apiv2dev.droplinked.com/payment/casper/signed-price")).data.data;
    return js;   
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
export async function paymentWithFee(sender_publicKey, reciver_publicKey, product_price, shipping_price, tax_price){
    const publicKeyHex = sender_publicKey;
    let signed_price = await get_price_signature();
    let ratio = Number(signed_price.message.split("\n")[1].split(",")[0]);
    let shipping_price_512 = new CLU512(Math.floor(shipping_price * ratio));
    let tax_price_512 = new CLU512(Math.floor(tax_price * ratio));
    let product_price_512 = new CLU512(Math.floor(product_price * ratio))
    let amount_512 = new CLU512(Math.floor((product_price + tax_price + shipping_price) * ratio));
    let args = {
        "shipping_price" : shipping_price_512,
        "tax_price" : tax_price_512,
        "amount" : amount_512,
        "product_price" : product_price_512,
        "contract_hash" : new CLKey(new CLByteArray(Contracts.contractHashToByteArray(casper_consts.contract_hash))),
        "recipient" : new CLString(String(reciver_publicKey)),
    }
    let arrayBuff = base64ToArrayBuffer(await get_payment());
    let module_bytes = new Uint8Array(arrayBuff);
    let named_args = [];
    named_args.push(new NamedArg("amount" , args.amount));
    named_args.push(new NamedArg("shipping_price" , args.shipping_price));
    named_args.push(new NamedArg("product_price" , args.product_price));
    named_args.push(new NamedArg("tax_price" , args.tax_price));
    named_args.push(new NamedArg("contract_hash" , args.contract_hash));
    named_args.push(new NamedArg("recipient" , args.recipient));
    let runtime_args = RuntimeArgs.fromNamedArgs(named_args);
    const kk = DeployUtil.ExecutableDeployItem.newModuleBytes(module_bytes , runtime_args);
    const payment = DeployUtil.standardPayment(48013050000);
    let deployParams = new DeployUtil.DeployParams(CLPublicKey.fromHex(publicKeyHex), casper_consts.network , 1 , 1800000);
    let deploy = DeployUtil.makeDeploy(deployParams , kk , payment);
    const json = DeployUtil.deployToJson(deploy);
    const signature = await getCasperWalletInstance().sign(JSON.stringify(json), publicKeyHex);
    if(signature.cancelled){
        return "Cancelled";
    }
    const signedDeploy = DeployUtil.setSignature(
        deploy,
        signature.signature,
        CLPublicKey.fromHex(publicKeyHex)
      );
    const deployres = await casper_consts.casperService.deploy(signedDeploy);
    return {"deploy" : deployres, "deployHash" : deployres.deploy_hash};
}


export { customerPayment1 } 

// usage : 
//console.log(await customerPayment1("01e0dc0d50aa1c9c487143c3225a0f43dd656b17e4293511d29abe3fd5228bc571", "01eb9b0e8e73de521f86f40666d985529ae316aff5ace6c4049a42364f442e0e76", 4.53));
