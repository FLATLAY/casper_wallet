
import { approve_request } from "./src/casper_wallet_approve_request";
import { casper_login, getCasperWalletInstance, isCasperWalletExtentionInstalled } from "./src/casper_wallet_auth";
import { cancel_request } from "./src/casper_wallet_cancel_request";
import { deploy_contract } from "./src/casper_wallet_deploy_contract";
import { disapprove_request } from "./src/casper_wallet_disapprove_request";
import { publish_request } from "./src/casper_wallet_publish_request";
import {record_merch} from "./src/casper_wallet_record"
import { direct_pay } from "./src/casper_wallet_direct_pay";
import { get_signed_price_and_block_time } from "./src/casper_signature";
import { getCasperRatio, paymentWithFee } from "./src/casper_wallet_payment";
import * as casper_consts from './src/constants'
import { buy_product } from "./src/casper_wallet_buy_product";
import { convert_hex_to_holder, get_approved_nft, get_dict_item_bytes, get_dictionary_item, get_holder, get_metadata, get_request } from "./src/casper_helper";

document.getElementById("install_btn").addEventListener("click" , async () => {
  casper_login(async (acc_info)=>{
    let result = await deploy_contract(acc_info.publicKey);
    console.log(result);
  })
});

document.getElementById("mint_btn").addEventListener("click" , async ()=>{
  casper_login(async (acc_info)=>{
    let price = 10; // This price is in USD
    let amount = 1000; // the amount of the product that we want to mint
    // The comission in next line, defines how much of the selling profit, is for the co-seller (publisher)!
    let comission = 1234; // It's actually 12.34%, but we do not have floating point numbers on contract, so we have to send it to contract as an integer!
    
    let product_properties = {
      "color" : "yellow",
      "size" : "XXL",
      "Company" : "WormBros",
      "someOtherField" : "some value!"
    }
    let result = await record_merch(product_properties, acc_info, "Y-Tshirt" , price * 100, amount, comission);
    console.log(result);
  });
});

document.getElementById("request_btn").addEventListener("click" , async () => {
  casper_login(async (acc_info)=>{
    // Note : put the accountHash of the producer on the below, producer is the minter of the product!
    let holder_id = 1; 
    let amount_to_request = 13;
    let result = await publish_request(holder_id, amount_to_request , "649ff2294eb022e9e4af6e3bf4eac9026c3fe96b725c3f85eb728d3ffaafaa39" , acc_info);
    console.log(result);
  });
});

document.getElementById("accept_btn").addEventListener("click" , async () => {
  casper_login(async (acc_info)=>{
    let request_id = 1;
    let result = await approve_request(request_id, acc_info);
    console.log(result);
  });
});

document.getElementById("cancel_btn").addEventListener("click" , async () => {
  casper_login(async (acc_info)=>{
    let result = await cancel_request(2, acc_info);
    console.log(result);
  });
});

document.getElementById("disapprove_btn").addEventListener("click" , async () => {
  casper_login(async (acc_info)=>{
    // Note : put the accountHash of the publisher on the below
    let result = await disapprove_request(1, 2, "43ad4246c311c084a4cf9784974628c6e9a55692ba9a12035ef8634d20becfd4", acc_info);
    console.log(result);
  });
});

document.getElementById("direct_pay_btn").addEventListener("click" , async () => {
  casper_login(async (acc_info)=>{
    // Note : put the accountHash of the producer on the below
    let result = await direct_pay(acc_info.publicKey , "43ad4246c311c084a4cf9784974628c6e9a55692ba9a12035ef8634d20becfd4", 2.3);
    console.log(result);
  });
});

document.getElementById("generate_signature_btn").addEventListener("click" , async () => {
  casper_login(async (acc_info)=>{
    let message = "20466346164,1683895058432";
    console.log(await getCasperWalletInstance().signMessage(message , acc_info.publicKey))
  });
});

document.getElementById("buy_btn").addEventListener("click" , async () => {
  casper_login(async (acc_info)=>{
    let amount_to_buy = 1; // number of nfts to buy from co-seller
    let approved_id = 1; // the approved_id of that NFTs
    let shipping_price = 1; // its in USD
    let tax_price = 1; // also in USD
    let product_price = 10;  // It must be the same as the minted product!
    let result = await buy_product(amount_to_buy, approved_id, shipping_price, tax_price, product_price, acc_info);
    console.log(result);
  });
});

document.getElementById("get_holder_btn").addEventListener("click" , async () => {
  console.log(await get_holder(document.getElementById("holder_id_txt").value))
})
document.getElementById("get_approved_btn").addEventListener("click" , async () => {
  console.log(await get_approved_nft(document.getElementById("approved_id_txt").value))
})
document.getElementById("get_request_btn").addEventListener("click" , async () => {
  console.log(await get_request(document.getElementById("request_id_txt").value))
})
document.getElementById("get_token_btn").addEventListener("click" , async ()=>{
  console.log(await get_metadata(document.getElementById("token_id_txt").value))
})

console.log(await paymentWithFee("0203f8bb23592a52d3e30a8b9c56e10fdcdff71f202a98838c50f1bd4f73a612864c" , "020291ae0395616413d08f7b61be72915c1a7f050d271bbd43770c1fa688daa8040c", 10, 1, 1));