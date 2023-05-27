import * as casper_consts from './constants';
import {CLAccountHash, CLKey, CLPublicKey, CLString, CLU256, CLU64, Contracts, DeployUtil, NamedArg, RuntimeArgs } from 'casper-js-sdk';
import {NFTStorage} from "nft.storage";
import { getCasperWalletInstance } from './casper_wallet_auth';

const client = new NFTStorage({ token : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDQ1MjMzMDAzNDY0YzcyNkNhY2QyOEIyMTkyYWFBNDdhMDg2MmJmQzUiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY3NTE3NzYwNzI1NywibmFtZSI6ImRyb3BsaW5rZWRfTkZUIn0.B44NWDZ7GAORBwXB36hLEw3VuWG8tOYRl8g6QNOUv-Q" });
async function uploadToIPFS(metadata) {
    if (typeof(metadata) == typeof({}) || typeof(metadata) == typeof([])){
        metadata = JSON.stringify(metadata);
    }
    const ipfs_hash = await client.storeBlob(new Blob([metadata]));
    return ipfs_hash;
}
async function get_sha256(sku_properties){
    if (typeof(sku_properties) == typeof({})){
        sku_properties = JSON.stringify(sku_properties);
    }
    const hashBuffer = await window.crypto.subtle.digest('SHA-256' , new TextEncoder().encode(sku_properties));
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const digest = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return digest;
}
async function record_merch(sku_properties , account_information, product_title , price , amount, comission){
    let IPFSHASH = await uploadToIPFS(sku_properties);
    let checksum = await get_sha256(sku_properties);
    let producer_public_key = account_information.publicKey;
    const publicKey = CLPublicKey.fromHex(producer_public_key);
    let gasPrice = 8*1000000000;
    const ttl = 1800000;
    let deployParams = new DeployUtil.DeployParams(publicKey, casper_consts.network , 1 , ttl);
    let contract_hash_string = casper_consts.contract_hash;
    let contract_byte_array = Contracts.contractHashToByteArray(contract_hash_string);    
    let named_args = [];
    named_args.push(new NamedArg("metadata" , new CLString(`{ "name" : "${product_title}" , "token_uri" : "${IPFSHASH}" , "checksum" : "${checksum}"}`)));
    
    named_args.push(new NamedArg("price" , new CLU64(price)));
    named_args.push(new NamedArg("amount" , new CLU64(amount)));
    named_args.push(new NamedArg("comission", new CLU64(comission)));
    let recipient = CLPublicKey.fromHex(producer_public_key).toAccountHash();
    named_args.push(new NamedArg("recipient" , new CLKey(new CLAccountHash(recipient))));
    let runtime_args = RuntimeArgs.fromNamedArgs(named_args);
    const kk = DeployUtil.ExecutableDeployItem.newStoredContractByHash(contract_byte_array  , "mint" , runtime_args);
    const payment = DeployUtil.standardPayment(gasPrice);
    let deploy = DeployUtil.makeDeploy(deployParams , kk , payment);
    const json = DeployUtil.deployToJson(deploy);
    const signature = await getCasperWalletInstance().sign(JSON.stringify(json), producer_public_key).catch((reason)=>{
        return "Cancelled";
    });
    const signedDeploy = DeployUtil.setSignature(
        deploy,
        signature.signature,
        CLPublicKey.fromHex(producer_public_key)
      );
    const deployres = await casper_consts.casperService.deploy(signedDeploy);
    return {"deploy" : deployres, "deployHash" : deployres.deploy_hash};
}
export { record_merch };