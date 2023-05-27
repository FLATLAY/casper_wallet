import { approved_dict_uref, casperClient, contract_hash, holders_uref, metadata_uref, request_objects_uref } from "./constants";
import {Buffer} from 'buffer'
/**
 * Gets the item from contract's dictionary and returns it
 * @param {{'dictionaryUref' : string , 'dictionaryItemKey' : string}} vars 
 * @returns 
 */
export let get_dictionary_item = async function(vars) {
    console.log(vars)
    let stateRootHash  = await casperClient.nodeClient.getStateRootHash();
    let dictionaryItem = await casperClient.nodeClient.getDictionaryItemByName(stateRootHash, "hash-"+contract_hash, vars.dictionaryUref , vars.dictionaryItemKey).catch( (reason) => {
        console.log("error : " , vars , reason);
        return null;
    });
    if (dictionaryItem==null){
        return null;
    }
    console.log("Get Dict Item : " , vars , "\nResult : " , dictionaryItem.CLValue?.value());
    return dictionaryItem.CLValue?.value();
};

/**
 * Gets the item from contract's dictionary and returns it
 * @param {{'dictionaryUref' : string , 'dictionaryItemKey' : string}} vars 
 * @returns 
 */
export let get_dict_item_bytes = async function(vars) {
    let stateRootHash = await casperClient.nodeClient.getStateRootHash();
    let dictionaryItem = await casperClient.nodeClient.getDictionaryItemByName(stateRootHash, "hash-"+contract_hash ,vars.dictionaryUref ,  vars.dictionaryItemKey , {rawData : true}).catch(
        (reason)=>{
            console.log("error :" , vars , reason);
        }
    );
    let strings = dictionaryItem;
    let jj = JSON.parse(JSON.stringify(strings));
    let result = {"bytes" : jj};
    //console.log("Get Dict Item : " , vars , "\nResult : " , result);
    return result;
}

function to_little_endian(x) {
    let buff  = Buffer.from(x, 'hex');
    let result = buff.readBigUInt64LE(0);
    return Number(result);
}

/**
 * Gets hexadecimal representation of the holder, converts it to holder and returns it
 * @param {string} hex 
 * @returns 
 */
export let convert_hex_to_holder = async function (hex){
    let bytes = Buffer.from(hex, 'hex');
    let amount = to_little_endian(bytes.subarray(0,8).toString('hex'));
    let token_id = to_little_endian(bytes.subarray(8,16).toString('hex'));
    let result = {'amount' : amount , 'token_id' : token_id};
    return result;
}

export let get_holder = async function (holder_id){
    return await convert_hex_to_holder(String((await get_dict_item_bytes({
        'dictionaryUref' : holders_uref,
        'dictionaryItemKey' : String(holder_id)
      })).bytes.CLValue.bytes));
}

/**
 * Gets hexadecimal representation of approved token and returns it
 * @param {string} hex 
 * @returns 
 */
export let convert_hex_to_approved = async function (hex){
    //approved is : holder_id : 8 bytes , amount : 8 bytes , owneraccount : 32 bytes , publisheraccount : 32 bytes, token_id : 8 bytes , percentage : 1 bytes
    let bytes = Buffer.from(hex, 'hex');
    let holder_id = to_little_endian(bytes.subarray(0,8).toString('hex'));
    let amount = to_little_endian(bytes.subarray(8,16).toString('hex'));
    let owneraccount = bytes.subarray(16,48).toString('hex');
    let publisheraccount = bytes.subarray(48,80).toString('hex');
    let token_id = to_little_endian(bytes.subarray(80,88).toString('hex'));
    let result = {'holder_id' : holder_id , 'amount' : amount , 'owneraccount' : owneraccount , 'publisheraccount' : publisheraccount , 'token_id' : token_id};
    return result;
}

/**
 * Gets hexadecimal representation of approved token and returns it
 * @param {string} hex 
 * @returns 
 */
export let convert_hex_to_request = async function (hex){
    //approved is : holder_id : 8 bytes , amount : 8 bytes , owneraccount : 32 bytes , publisheraccount : 32 bytes, token_id : 8 bytes , percentage : 1 bytes
    let bytes = Buffer.from(hex, 'hex');
    let holder_id = to_little_endian(bytes.subarray(0,8).toString('hex'));
    let amount = to_little_endian(bytes.subarray(8,16).toString('hex'));
    let producer = bytes.subarray(16,48).toString('hex');
    let publisher = bytes.subarray(48,80).toString('hex');
    let result = {'holder_id' : holder_id , 'amount' : amount , 'producer' : producer , 'publisher' : publisher};
    return result;
}

/**
 * Gets hexadecimal representation of approved token and returns it
 * @param {string} hex 
 * @returns 
 */
export let convert_hex_to_metadata = async function (hex){
    //approved is : holder_id : 8 bytes , amount : 8 bytes , owneraccount : 32 bytes , publisheraccount : 32 bytes, token_id : 8 bytes , percentage : 1 bytes
    let bytes = Buffer.from(hex, 'hex');
    let comission = to_little_endian(bytes.subarray(bytes.length-8,bytes.length).toString('hex'));
    let price = to_little_endian(bytes.subarray(bytes.length-16,bytes.length-8).toString('hex'));
    let nameTokenUriChecksum = bytes.subarray(0,bytes.length-16).toString().split("\u0000\u0000\u0000");
    let name = nameTokenUriChecksum[1];
    let ipfs_uri = nameTokenUriChecksum[2];
    let checksum = nameTokenUriChecksum[3];
    let result = {'comission' : comission , 'price' : price , 'name' : name, 'ipfs_uri' : 'ipfs://'+ipfs_uri.substring(0,ipfs_uri.length-1) , 'checksum' : checksum};
    return result;
}


export let get_approved_nft = async function (approved_id){
    return await convert_hex_to_approved(String((await get_dict_item_bytes({
        'dictionaryUref' : approved_dict_uref,
        'dictionaryItemKey' : String(approved_id)
      })).bytes.CLValue.bytes));
}

export let get_request = async function (request_id){
    return await convert_hex_to_request(String((await get_dict_item_bytes({
        'dictionaryUref' : request_objects_uref,
        'dictionaryItemKey' : String(request_id)
      })).bytes.CLValue.bytes));
}

export let get_metadata = async function (token_id){
    return await convert_hex_to_metadata(String((await get_dict_item_bytes({
        'dictionaryUref' : metadata_uref,
        'dictionaryItemKey' : String(token_id)
      })).bytes.CLValue.bytes));
}