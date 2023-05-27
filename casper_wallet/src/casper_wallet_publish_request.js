import { CLAccountHash, CLKey, CLPublicKey, CLU64, Contracts, DeployUtil, NamedArg, RuntimeArgs } from 'casper-js-sdk';
import * as casper_consts from './constants';
import { getCasperWalletInstance } from './casper_wallet_auth';
/**
 * Deploys the publish request
 * @param {int} holder_id 
 * @param {int} amount 
 * @param {int} comission 
 * @param {string} producer_account_hash 
 * @param {{'publicKey' : string , 'account_hash' : string, 'signature' : string}} account_info
 * @returns 
 */
export let publish_request = async function(holder_id , amount , producer_account_hash,account_info){
    const fromHexString = (hexString) =>
        Uint8Array.from(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
    let producer_hash = new CLAccountHash(fromHexString(producer_account_hash));
    console.log(producer_hash);
    const publicKeyHex = account_info.publicKey;
    const publicKey = CLPublicKey.fromHex(publicKeyHex);
    let gasPrice = 3800000000;
    const ttl = 1800000;
    let deployParams = new DeployUtil.DeployParams(publicKey, casper_consts.network , 1 , ttl);
    let contract_hash_string = casper_consts.contract_hash;
    let contract_byte_array = Contracts.contractHashToByteArray(contract_hash_string);
    let named_args = [];
    named_args.push(new NamedArg("holder_id" , new CLU64(holder_id)));
    named_args.push(new NamedArg("amount" , new CLU64(amount)));
    named_args.push(new NamedArg("producer-account" , new CLKey(producer_hash)));
    let runtime_args = RuntimeArgs.fromNamedArgs(named_args);
    const kk = DeployUtil.ExecutableDeployItem.newStoredContractByHash(contract_byte_array  , "publish_request" , runtime_args);
    const payment = DeployUtil.standardPayment(gasPrice);
    let deploy = DeployUtil.makeDeploy(deployParams , kk , payment);
    const json = DeployUtil.deployToJson(deploy);
    console.log(publicKeyHex);
    console.log(json);
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