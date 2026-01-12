const hre = require("hardhat");

/**
 * Deploy a fresh CuratorVault contract with the balance fix
 */
async function main() {
    console.log("🚀 Deploying NEW CuratorVault with balance fix...\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying from account:", deployer.address);

    // Get contract addresses
    const AUDIT_REGISTRY_ADDRESS = process.env.CONTRACT_ADDRESS_REGISTRY; // Fixed to match .env

    console.log("📋 Using AuditRegistry:", AUDIT_REGISTRY_ADDRESS);
    console.log("");

    // Deploy new vault
    console.log("Deploying CuratorVault...");
    const CuratorVault = await hre.ethers.getContractFactory("CuratorVault");
    const vault = await CuratorVault.deploy(AUDIT_REGISTRY_ADDRESS);

    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();

    console.log("\n✅ CuratorVault deployed!");
    console.log("📍 Address:", vaultAddress);
    console.log("");
    console.log("⚠️  IMPORTANT: Update your .env file:");
    console.log(`   CONTRACT_ADDRESS_CURATOR_VAULT=${vaultAddress}`);
    console.log("");
    console.log("Next steps:");
    console.log("1. Update backend .env");
    console.log("2. Update frontend .env.local");
    console.log("3. Run: npx hardhat run scripts/init-new-vault.js --network mantleSepolia");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
