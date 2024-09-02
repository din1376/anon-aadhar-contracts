import { ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from 'fs';
import { packGroth16Proof } from '@anon-aadhaar/core';
dotenv.config();

const ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "userAddress", "type": "address"},
      {"internalType": "uint256", "name": "nullifierSeed", "type": "uint256"},
      {"internalType": "uint256", "name": "nullifier", "type": "uint256"},
      {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"internalType": "uint256", "name": "signal", "type": "uint256"},
      {"internalType": "uint256[4]", "name": "revealArray", "type": "uint256[4]"},
      {"internalType": "uint256[8]", "name": "groth16Proof", "type": "uint256[8]"},
      {"internalType": "uint256", "name": "nonce", "type": "uint256"},
      {"internalType": "bytes", "name": "signature", "type": "bytes"}
    ],
    "name": "addUserGasless",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "userAddress", "type": "address"}
    ],
    "name": "getUserByAddress",
    "outputs": [
      {"internalType": "uint", "name": "nullifier", "type": "uint"},
      {"internalType": "uint", "name": "nullifierSeed", "type": "uint"},
      {"internalType": "uint[4]", "name": "revealedData", "type": "uint[4]"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllUsers",
    "outputs": [
      {"internalType": "address[]", "name": "userAddresses", "type": "address[]"},
      {"internalType": "uint256[]", "name": "nullifiers", "type": "uint256[]"},
      {"internalType": "uint256[]", "name": "nullifierSeeds", "type": "uint256[]"},
      {"internalType": "uint256[4][]", "name": "revealedDataArray", "type": "uint256[4][]"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "relayer", "type": "address"}],
    "name": "authorizedRelayers",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function testGaslessAnonAadhaarIdentity() {
  const proofPath = 'proof.json';
  const proofData = JSON.parse(fs.readFileSync(proofPath, 'utf8'));

  const provider = new ethers.JsonRpcProvider(`https://polygon-amoy.infura.io/v3/${process.env.API_KEY_AMOY}`);
  const userPrivateKey = process.env.PRIVATE_KEY;
  const relayerPrivateKey = process.env.PRIVATE_KEY_SEPOLIA;
  if (!userPrivateKey || !relayerPrivateKey) {
    throw new Error("Private keys not found in .env file");
  }

  const userWallet = new ethers.Wallet(userPrivateKey, provider);
  const relayerWallet = new ethers.Wallet(relayerPrivateKey, provider);
  console.log("User wallet address:", userWallet.address);
  console.log("Relayer wallet address:", relayerWallet.address);

  const contractAddress = '0x1e0F5B806D70F7BEf0e1bB9338347746b3a875e4';
  const contract = new ethers.Contract(contractAddress, ABI, relayerWallet);

  // Check if the relayer is authorized
  const isAuthorized = await contract.authorizedRelayers(relayerWallet.address);
  console.log(`Is relayer authorized? ${isAuthorized}`);

  if (!isAuthorized) {
    console.log("Relayer is not authorized. Please ensure the relayer has been added correctly.");
    return;
  }

  const nullifierSeed = proofData.proof.nullifierSeed;
  const nullifier = proofData.proof.nullifier;
  const timestamp = proofData.proof.timestamp;
  const signal = BigInt(userWallet.address);
  const revealArray = [
    proofData.proof.ageAbove18,
    proofData.proof.gender,
    proofData.proof.pincode,
    proofData.proof.state
  ];

  const groth16Proof = packGroth16Proof(proofData.proof.groth16Proof);
  const nonce = BigInt(Date.now());

  console.log('NullifierSeed:', nullifierSeed);
  console.log('Nullifier:', nullifier);
  console.log('Timestamp:', timestamp);
  console.log('Signal:', signal);
  console.log('RevealArray:', revealArray);
  console.log('Groth16Proof:', groth16Proof);
  console.log('Nonce:', nonce);

  // Create message hash
  const messageHash = ethers.solidityPackedKeccak256(
    ['address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256[4]', 'uint256[8]', 'uint256'],
    [userWallet.address, nullifierSeed, nullifier, timestamp, signal, revealArray, groth16Proof, nonce]
  );

  // Sign the message
  const signature = await userWallet.signMessage(ethers.getBytes(messageHash));

  console.log('Message hash:', messageHash);
  console.log('Signature:', signature);

  try {
    console.log('Adding user gasless...');
    const tx = await contract.addUserGasless(
      userWallet.address,
      nullifierSeed,
      nullifier,
      timestamp,
      signal,
      revealArray,
      groth16Proof,
      nonce,
      signature
    );
    console.log('Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('Transaction confirmed in block:', receipt.blockNumber);

    // Fetch and log user data
    const getUserData = await contract.getUserByAddress(userWallet.address);
    console.log('User data:', getUserData);

    // Fetch and log all users
    const allUsers = await contract.getAllUsers();
    console.log('All users:');
    console.log('User Addresses:', allUsers.userAddresses);
    console.log('Nullifiers:', allUsers.nullifiers);
    console.log('Nullifier Seeds:', allUsers.nullifierSeeds);
    console.log('Revealed Data:', allUsers.revealedDataArray);

  } catch (error) {
    console.error('Error:', error);
  }
}

testGaslessAnonAadhaarIdentity().catch(console.error);