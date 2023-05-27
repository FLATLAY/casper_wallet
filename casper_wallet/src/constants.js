import axios from 'axios';
import {CasperClient , CasperServiceByJsonRPC} from 'casper-js-sdk'

async function get_contract_hash(){
    let result = String((await axios.get("https://apiv2dev.droplinked.com/storage/contract_hash")).data.value);
    return result;
}
export const contract_hash = "8259fd8ae5d5a4ecf9f93f2570336ec621fdf9e36fd252b8459c3315351952ad";//get_contract_hash();

export const metadata_uref  = "metadatas";
export const request_objects_uref  = "request_objects";
export const producer_requests_uref  = "producer_requests";
export const publisher_requests_uref  = "publiser_requests";
export const holders_uref = "holders";
export const owners_dict_uref  = "owners";
export const producers_approved_dict_uref  = "producers_approved";
export const publishers_approved_dict_uref  = "publishers_approved";
export const publishers_rejected_dict_uref  = "publisher_rejects";
export const approved_dict_uref = "approved";
export const token_id_by_metadata_hash = "token_id_by_hash";
export const network = "casper-test";

export const apiUrl = "http://188.40.47.161";
export const casperService = new CasperServiceByJsonRPC(apiUrl+":7777/rpc");
export const casperClient = new CasperClient(apiUrl+":7777/rpc");
