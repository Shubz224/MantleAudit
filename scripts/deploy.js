const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Deploying BlackBox contracts to Mantle Sepolia...\n");

    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("📝 Deploying with account:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", hre.ethers.formatEther(balance), "MNT\n");

    // Deploy AuditRegistry
    console.log("📦 Deploying AuditRegistry...");
    const AuditRegistry = await hre.ethers.getContractFactory("AuditRegistry");
    const auditRegistry = await AuditRegistry.deploy();
    await auditRegistry.waitForDeployment();
    const registryAddress = await auditRegistry.getAddress();
    console.log("✅ AuditRegistry deployed to:", registryAddress);

    // Deploy AMLVerifier (Groth16 ZK verifier)
    console.log("\n📦 Deploying AMLVerifier...");
    const AMLVerifier = await hre.ethers.getContractFactory("Groth16Verifier");
    const amlVerifier = await AMLVerifier.deploy();
    await amlVerifier.waitForDeployment();
    const amlVerifierAddress = await amlVerifier.getAddress();
    console.log("✅ AMLVerifier deployed to:", amlVerifierAddress);

    // Deploy AuditVerifier (requires AMLVerifier address)
    console.log("\n📦 Deploying AuditVerifier...");
    const AuditVerifier = await hre.ethers.getContractFactory("AuditVerifier");
    const auditVerifier = await AuditVerifier.deploy(amlVerifierAddress);
    await auditVerifier.waitForDeployment();
    const verifierAddress = await auditVerifier.getAddress();
    console.log("✅ AuditVerifier deployed to:", verifierAddress);

    // Deploy ComplianceNFT (optional)
    console.log("\n📦 Deploying ComplianceNFT...");
    const ComplianceNFT = await hre.ethers.getContractFactory("ComplianceNFT");
    const complianceNFT = await ComplianceNFT.deploy();
    await complianceNFT.waitForDeployment();
    const nftAddress = await complianceNFT.getAddress();
    console.log("✅ ComplianceNFT deployed to:", nftAddress);

    // Deploy MockMETH
    console.log("\n📦 Deploying MockMETH (Testnet mETH)...");
    const MockMETH = await hre.ethers.getContractFactory("MockMETH");
    const mockMETH = await MockMETH.deploy();
    await mockMETH.waitForDeployment();
    const mockMETHAddress = await mockMETH.getAddress();
    console.log("✅ MockMETH deployed to:", mockMETHAddress);

    // Deploy MockUSDT
    console.log("\n📦 Deploying MockUSDT (Testnet USDT)...");
    const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
    const mockUSDT = await MockUSDT.deploy();
    await mockUSDT.waitForDeployment();
    const mockUSDTAddress = await mockUSDT.getAddress();
    console.log("✅ MockUSDT deployed to:", mockUSDTAddress);

    // Deploy CuratorVault
    console.log("\n📦 Deploying CuratorVault...");
    const CuratorVault = await hre.ethers.getContractFactory("CuratorVault");
    const curatorVault = await CuratorVault.deploy(registryAddress);
    await curatorVault.waitForDeployment();
    const vaultAddress = await curatorVault.getAddress();
    console.log("✅ CuratorVault deployed to:", vaultAddress);

    // Save deployment addresses
    const deploymentInfo = {
        network: hre.network.name,
        chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {
            AuditRegistry: registryAddress,
            AMLVerifier: amlVerifierAddress,
            AuditVerifier: verifierAddress,
            ComplianceNFT: nftAddress,
            MockMETH: mockMETHAddress,
            MockUSDT: mockUSDTAddress,
            CuratorVault: vaultAddress
        }
    };

    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir);
    }

    const filename = `${hre.network.name}-${Date.now()}.json`;
    fs.writeFileSync(
        path.join(deploymentsDir, filename),
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("\n📄 Deployment info saved to:", filename);

    // Update .env file template
    console.log("\n📝 Update your .env file with these addresses:");
    console.log(`CONTRACT_ADDRESS_REGISTRY=${registryAddress}`);
    console.log(`CONTRACT_ADDRESS_AML_VERIFIER=${amlVerifierAddress}`);
    console.log(`CONTRACT_ADDRESS_VERIFIER=${verifierAddress}`);
    console.log(`CONTRACT_ADDRESS_COMPLIANCE_NFT=${nftAddress}`);
    console.log(`CONTRACT_ADDRESS_MOCK_METH=${mockMETHAddress}`);
    console.log(`CONTRACT_ADDRESS_MOCK_USDT=${mockUSDTAddress}`);
    console.log(`CONTRACT_ADDRESS_CURATOR_VAULT=${vaultAddress}`);

    console.log("\n⏳ Waiting 30 seconds before verification...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Verify contracts
    console.log("\n🔍 Verifying contracts on Mantle Sepolia Explorer...\n");

    try {
        await hre.run("verify:verify", {
            address: registryAddress,
            constructorArguments: [],
        });
        console.log("✅ AuditRegistry verified");
    } catch (error) {
        console.log("⚠️  AuditRegistry verification failed:", error.message);
    }

    try {
        await hre.run("verify:verify", {
            address: amlVerifierAddress,
            constructorArguments: [],
        });
        console.log("✅ AMLVerifier verified");
    } catch (error) {
        console.log("⚠️  AMLVerifier verification failed:", error.message);
    }

    try {
        await hre.run("verify:verify", {
            address: verifierAddress,
            constructorArguments: [amlVerifierAddress],
        });
        console.log("✅ AuditVerifier verified");
    } catch (error) {
        console.log("⚠️  AuditVerifier verification failed:", error.message);
    }

    try {
        await hre.run("verify:verify", {
            address: nftAddress,
            constructorArguments: [],
        });
        console.log("✅ ComplianceNFT verified");
    } catch (error) {
        console.log("⚠️  ComplianceNFT verification failed:", error.message);
    }

    try {
        await hre.run("verify:verify", {
            address: mockMETHAddress,
            constructorArguments: [],
        });
        console.log("✅ MockMETH verified");
    } catch (error) {
        console.log("⚠️  MockMETH verification failed:", error.message);
    }

    try {
        await hre.run("verify:verify", {
            address: vaultAddress,
            constructorArguments: [registryAddress],
        });
        console.log("✅ CuratorVault verified");
    } catch (error) {
        console.log("⚠️  CuratorVault verification failed:", error.message);
    }

    console.log("\n🎉 Deployment complete!");
    console.log("\n📋 Contract Addresses:");
    console.log("   AuditRegistry:", registryAddress);
    console.log("   AMLVerifier:", amlVerifierAddress);
    console.log("   AuditVerifier:", verifierAddress);
    console.log("   ComplianceNFT:", nftAddress);
    console.log("   MockMETH:", mockMETHAddress);
    console.log("   CuratorVault:", vaultAddress);
    console.log("\n🔗 View on Explorer:");
    console.log(`   https://sepolia.mantlescan.xyz/address/${registryAddress}`);
    console.log(`   https://sepolia.mantlescan.xyz/address/${amlVerifierAddress}`);
    console.log(`   https://sepolia.mantlescan.xyz/address/${verifierAddress}`);
    console.log(`   https://sepolia.mantlescan.xyz/address/${nftAddress}`);
    console.log(`   https://sepolia.mantlescan.xyz/address/${mockMETHAddress}`);
    console.log(`   https://sepolia.mantlescan.xyz/address/${vaultAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
