import { CLPublicKey, CLString, CLU512, CLU64, Contracts, DeployUtil, NamedArg, RuntimeArgs } from 'casper-js-sdk'
import * as casper_constants from './constants'
import { getCasperWalletInstance } from './casper_wallet_auth';

export async function deploy_contract(publicKeyHex){
    let k  = new Contracts.Contract(casper_constants.casperClient);
    let arrayBuff = await (await fetch('src/contract.wasm')).arrayBuffer()
    let module_bytes = new Uint8Array(arrayBuff);
    let named_args = [];
    named_args.push(new NamedArg("ratio_verifier" , new CLString("01ff1a02ff08fe71c86e7323105f87e459450f36684fe624e8e2180787607901d4")));
    named_args.push(new NamedArg("fee" , new CLU64(100)));// 100 is 1%
    
    let runtime_args = RuntimeArgs.fromNamedArgs(named_args);
    let payment_amount = "231420060000";
    let sender_publicKey = CLPublicKey.fromHex(publicKeyHex);
    let deploy = k.install(module_bytes, runtime_args, payment_amount, sender_publicKey, casper_constants.network);
    const json = DeployUtil.deployToJson(deploy);
    const signature = await getCasperWalletInstance().sign(JSON.stringify(json), publicKeyHex).catch((reason)=>{
        return "Cancelled";
    });
    const signedDeploy = DeployUtil.setSignature(
        deploy,
        signature.signature,
        CLPublicKey.fromHex(publicKeyHex)
      );
    const deployres = await casper_constants.casperService.deploy(signedDeploy);
    return {"deploy" : deployres, "deployHash" : deployres.deploy_hash};
}