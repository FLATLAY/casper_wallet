import { CLAccountHash, CLKey, CLPublicKey, CLU64, Contracts, DeployUtil, NamedArg, RuntimeArgs } from "casper-js-sdk";
import * as casper_consts from './constants'
import { getCasperWalletInstance } from "./casper_wallet_auth";
/**
 * Approves the request with request_id using casper-signer
 * @param {int} request_id 
 * @param {{'publicKey' : string , 'account_hash' : string, 'signature' : string}} account_info 
 * @returns 
 */
export let disapprove_request = async function(approved_id, amount, publisher_account_hash, account_info){
    const fromHexString = (hexString) =>
        Uint8Array.from(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
    let publisher_hash = new CLAccountHash(fromHexString(publisher_account_hash));
    const publicKeyHex = account_info.publicKey;
    const publicKey = CLPublicKey.fromHex(publicKeyHex);
    let gasPrice = 8941000000;
    const ttl = 1800000;
    let deployParams = new DeployUtil.DeployParams(publicKey, casper_consts.network , 1 , ttl);
    let contract_hash_string = casper_consts.contract_hash;
    let contract_byte_array = Contracts.contractHashToByteArray(contract_hash_string);
    let named_args = [];
    named_args.push(new NamedArg("approved_id" , new CLU64(approved_id)));
    named_args.push(new NamedArg("amount" , new CLU64(amount)));
    named_args.push(new NamedArg("publisher-account" , new CLKey(publisher_hash)));
    
    let runtime_args = RuntimeArgs.fromNamedArgs(named_args);
    const kk = DeployUtil.ExecutableDeployItem.newStoredContractByHash(contract_byte_array  , "disapprove" , runtime_args);
    const payment = DeployUtil.standardPayment(gasPrice);
    let deploy = DeployUtil.makeDeploy(deployParams , kk , payment);
    const json = DeployUtil.deployToJson(deploy);
    const signature = await getCasperWalletInstance().sign(JSON.stringify(json), publicKeyHex).catch((reason)=>{
        return "Cancelled";
    });
    const signedDeploy = DeployUtil.setSignature(
        deploy,
        signature.signature,
        CLPublicKey.fromHex(publicKeyHex)
      );
    const deployres = await casper_consts.casperService.deploy(signedDeploy);
    return {"deploy" : deployres, "deployHash" : deployres.deploy_hash};
}