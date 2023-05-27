import axios from "axios";
import { CLPublicKey, CLU512, DeployUtil, PurseIdentifier } from "casper-js-sdk";
import * as casper_consts from './constants'
import { getCasperWalletInstance } from "./casper_wallet_auth";

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
async function getCasperRatio(usd_amount){
    let js = (await axios.post("https://apiv2.droplinked.com/payment/casper/price",{
        "usd_amount" : usd_amount
    })).data.data;
    return new CLU512(js);   
}
async function direct_pay(sender_publicKey, reciver_publicKey, amount_in_usd){
    let amount_of_motes = (await getCasperRatio(amount_in_usd));
    const toPublicKey = CLPublicKey.fromHex(reciver_publicKey);
    const fromPublicKey = CLPublicKey.fromHex(sender_publicKey);
    const deploy = DeployUtil.makeDeploy(
        new DeployUtil.DeployParams(fromPublicKey, casper_consts.network , 1, 1800000),
        DeployUtil.ExecutableDeployItem.newTransfer(amount_of_motes.value(), toPublicKey, null, 0),
        DeployUtil.standardPayment(100000000)
    );
    const json = DeployUtil.deployToJson(deploy);
    const signature = await getCasperWalletInstance().sign(JSON.stringify(json), sender_publicKey).catch((reason)=>{
        return "Cancelled";
    });
    const signedDeploy = DeployUtil.setSignature(
        deploy,
        signature.signature,
        CLPublicKey.fromHex(sender_publicKey)
      );
    const deployres = await casper_consts.casperService.deploy(signedDeploy);
    return {"deploy" : deployres, "deployHash" : deployres.deploy_hash};
}

/**
 * 
 * @param {string} publicKey 
 * @returns {Promise<number>} balance
 */
export async function get_casper_balance(publicKey){
    let pk = CLPublicKey.fromHex(publicKey);
    let stateRootHash = await casper_consts.casperService.getStateRootHash();
    let balance_uref = await casper_consts.casperService.getAccountBalanceUrefByPublicKey(stateRootHash,pk);
    let balance = await casper_consts.casperService.getAccountBalance(stateRootHash, balance_uref);
    return balance.toNumber();
}

/**
 * 
 * @param {number} price_in_usd 
 * @param {string} publicKey 
 * @returns {Promise<boolean>}
 */
export async function check_balance_on_product(price_in_usd , publicKey){
    let expected_amount = (await getCasperRatio(price_in_usd)).data.toNumber();
    let current_amount = await get_casper_balance(publicKey);
    return current_amount>expected_amount;
}

export { direct_pay } 