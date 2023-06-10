export async function isDeployValid(deploy_hash){
    let result = (await (await fetch("https://event-store-api-clarity-testnet.make.services/raw-processed-deploys/"+deploy_hash)).json())
    if (result==null)
        return false;
    if(result.error.message == "Deploy not found.")
        return false;
    return true;
}