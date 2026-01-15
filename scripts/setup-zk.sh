#!/bin/bash
# ZK Proof Setup Script - Run ONCE for entire project

set -e

echo "🚀 BlackBox ZK Proof Setup"
echo "=============================="

# Use local binary
CIRCOM="./bin/circom"
SNARKJS="./node_modules/.bin/snarkjs"

# Step 1: Powers of Tau (ONCE for all circuits)
echo "📦 Step 1: Generating Powers of Tau (bn128, 2^14)..."
if [ ! -f "circuits/ptau/pot14_final.ptau" ]; then
    $SNARKJS powersoftau new bn128 14 circuits/ptau/pot14_0000.ptau
    $SNARKJS powersoftau contribute circuits/ptau/pot14_0000.ptau circuits/ptau/pot14_0001.ptau --name="BlackBox" -v
    $SNARKJS powersoftau prepare phase2 circuits/ptau/pot14_0001.ptau circuits/ptau/pot14_final.ptau -v
    echo "✅ Powers of Tau complete"
else
    echo "✅ Powers of Tau already exists"
fi

# Step 2: Compile AML Circuit
echo ""
echo "🔧 Step 2: Compiling AML circuit..."
$CIRCOM circuits/aml_proof.circom -l node_modules --r1cs --wasm --sym -o circuits/build

# Step 3: Groth16 Setup for AML
echo ""
echo "🔐 Step 3: Groth16 setup for AML circuit..."
$SNARKJS groth16 setup circuits/build/aml_proof.r1cs circuits/ptau/pot14_final.ptau circuits/build/aml_0000.zkey
$SNARKJS zkey contribute circuits/build/aml_0000.zkey circuits/build/aml_final.zkey --name="BlackBox AML" -v
$SNARKJS zkey export verificationkey circuits/build/aml_final.zkey circuits/build/aml_vk.json

# Step 4: Generate Solidity Verifier
echo ""
echo "📝 Step 4: Generating Solidity verifier..."
$SNARKJS zkey export solidityverifier circuits/build/aml_final.zkey contracts/AMLVerifier.sol

echo ""
echo "✅ ZK Proof setup complete!"
echo ""
echo "Next steps:"
echo "1. Deploy contracts/AMLVerifier.sol to Mantle Sepolia"
echo "2. Update AuditVerifier.sol with AMLVerifier address"
echo "3. Test proof generation with backend"
