const ethers = require('ethers');
require('dotenv').config();

const CURATOR_VAULT_ABI = require('../artifacts/contracts/CuratorVault.sol/CuratorVault.json').abi;

async function main() {
    console.log("🔍 STARTING DEBUG FETCH...");
    console.log("----------------------------------------");

    const rpcUrl = process.env.MANTLE_RPC_URL;
    const vaultAddress = process.env.CONTRACT_ADDRESS_CURATOR_VAULT;

    console.log("RPC URL:", rpcUrl);
    console.log("Vault Address:", vaultAddress);

    if (!vaultAddress) {
        console.error("❌ ERROR: CONTRACT_ADDRESS_CURATOR_VAULT is missing in .env");
        return;
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Check block number
    const currentBlock = await provider.getBlockNumber();
    console.log("Current Block:", currentBlock);

    const vaultContract = new ethers.Contract(vaultAddress, CURATOR_VAULT_ABI, provider);

    // Filter
    console.log("Creating filter for PrivateTransferExecuted...");
    const filter = vaultContract.filters.PrivateTransferExecuted();

    // Scan range - scan last 5000 blocks
    const startBlock = Math.max(0, currentBlock - 5000);
    console.log(`Scanning from ${startBlock} to ${currentBlock} (Range: ${currentBlock - startBlock})`);

    try {
        const events = await vaultContract.queryFilter(filter, startBlock, currentBlock);
        console.log(`\n✅ FOUND ${events.length} EVENTS:`);

        events.forEach((event, i) => {
            console.log(`\n[${i + 1}] Tx: ${event.transactionHash}`);
            console.log(`    Block: ${event.blockNumber}`);
            console.log(`    PAC: ${event.args.pac}`);
            console.log(`    To: ${event.args.to}`);
        });

    } catch (error) {
        console.error("\n❌ ERROR FETCHING EVENTS:", error);
    }
    console.log("\n----------------------------------------");
}

main();
