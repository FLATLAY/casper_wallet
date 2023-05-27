import { CLPublicKey, CLU64, Contracts, DeployUtil, NamedArg, RuntimeArgs } from "casper-js-sdk";
import * as casper_consts from './constants'
import { getCasperWalletInstance } from "./casper_wallet_auth";
/**
 * Approves the request with request_id using casper-signer
 * @param {int} request_id 
 * @param {{'publicKey' : string , 'account_hash' : string, 'signature' : string}} account_info 
 * @returns 
 */
export let approve_request = async function(request_id, account_info){
    const publicKeyHex = account_info.publicKey;
    const publicKey = CLPublicKey.fromHex(publicKeyHex);
    let gasPrice = 8941000000;
    const ttl = 1800000;
    let deployParams = new DeployUtil.DeployParams(publicKey, casper_consts.network , 1 , ttl);
    let contract_hash_string = casper_consts.contract_hash;
    let contract_byte_array = Contracts.contractHashToByteArray(contract_hash_string);
    let named_args = [];
    named_args.push(new NamedArg("request_id" , new CLU64(request_id)));
    let runtime_args = RuntimeArgs.fromNamedArgs(named_args);
    const kk = DeployUtil.ExecutableDeployItem.newStoredContractByHash(contract_byte_array  , "approve" , runtime_args);
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