import { casper_login } from './src/casper_wallet_auth';
import { record_merch } from './src/casper_wallet_record'
casper_login(async (account_information) =>{
    let sku_0 = {"color" : "red" , "created at" : "2023" , "details": {"owner":"k3rn3lpanic"}, "name" : "red shirt - 2023"};
    let product_title = "T-shirt";
    let price = 100;
    let amount = 100;
    let signedDeploy = await record_merch(sku_0, account_information, product_title, price, amount);
    console.log(signedDeploy);
    // you should send this signedDeploy.deployHash to backend api
});