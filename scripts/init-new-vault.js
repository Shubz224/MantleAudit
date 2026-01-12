const hre = require("hardhat");

async function main() {
    console.log("🏦 Initializing NEW Curator Vault...\n");

    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("Using account:", deployer.address);

    // NEW vault address from latest deployment
    const VAULT_ADDRESS = process.env.CONTRACT_ADDRESS_CURATOR_VAULT || "0xd3ec7999EDdAd985a5b79591Ddf793f7F893D646";
    const METH_TOKEN = "0xf6C198a6A58924D73fBdc59Da1C157Eb8A48E9dE"; // New MockMETH
    const CURATOR = deployer.address; // Owner is also curator for demo

    console.log("📋 Configuration:");
    console.log("  Vault Contract:", VAULT_ADDRESS);
    console.log("  mETH Token:", METH_TOKEN);
    console.log("  Curator:", CURATOR);

    // Get vault contract
    const CuratorVault = await hre.ethers.getContractFactory("CuratorVault");
    const vault = CuratorVault.attach(VAULT_ADDRESS);

    // Check if vault already initialized
    try {
        const vaultInfo = await vault.getVaultInfo();

        // Check if vault is active (means it's initialized)
        if (vaultInfo.active) {
            console.log("\n✅ Vault is already initialized!");
            console.log("\nVault Details:");
            console.log("  Curator:", vaultInfo.curator);
            console.log("  Asset:", vaultInfo.asset);
            console.log("  Total AUM:", vaultInfo.totalAUM.toString());
            console.log("  Active:", vaultInfo.active);
            return;
        }
    } catch (error) {
        // Vault not initialized, continue
    }

    // Create vault
    console.log("\n📦 Creating vault...");
    const tx = await vault.createVault(METH_TOKEN, CURATOR);
    console.log("Transaction sent:", tx.hash);

    console.log("⏳ Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log("✅ Vault created successfully!");
    console.log("Block number:", receipt.blockNumber);

    // Verify creation
    const vaultInfo = await vault.getVaultInfo();
    console.log("\n📊 Vault Information:");
    console.log("  Curator:", vaultInfo.curator);
    console.log("  Primary Asset:", vaultInfo.asset);
    console.log("  Total AUM:", vaultInfo.totalAUM.toString());
    console.log("  Active:", vaultInfo.active);
    console.log("  Created At:", new Date(Number(vaultInfo.createdAt) * 1000).toISOString());

    console.log("\n🎉 Vault is ready to use!");
    console.log("\nNext steps:");
    console.log("  1. Deposit tokens: npx hardhat run scripts/test-deposit.js --network mantleSepolia");
    console.log("  2. Execute swap: npx hardhat run scripts/test-swap.js --network mantleSepolia");
    console.log("  3. Test privacy: npx hardhat run scripts/test-private-transfer.js --network mantleSepolia");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
