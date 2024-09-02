import { ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from 'fs';
import { packGroth16Proof } from '@anon-aadhaar/core';
dotenv.config();

const ABI = [
  {
    "inputs": [
      {"internalType": "uint", "name": "nullifierSeed", "type": "uint"},
      {"internalType": "uint", "name": "nullifier", "type": "uint"},
      {"internalType": "uint", "name": "timestamp", "type": "uint"},
      {"internalType": "uint", "name": "signal", "type": "uint"},
      {"internalType": "uint[4]", "name": "revealArray", "type": "uint[4]"},
      {"internalType": "uint[8]", "name": "groth16Proof", "type": "uint[8]"}
    ],
    "name": "addUser",
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
  }
];

async function testAnonAadhaarIdentity() {
  const proofPath = 'proof.json';
  const proofData = JSON.parse(fs.readFileSync(proofPath, 'utf8'));

  const provider = new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${process.env.API_KEY_SEPOLIA}`);
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("Private key not found in .env file");
  }

  const wallet = new ethers.Wallet(privateKey, provider);
  console.log("Wallet address:", wallet.address);

  const contractAddress = '0x2EE3aFB372cECF82Bd1BbE5bbc7D44d6cDDbD1af';
  const contract = new ethers.Contract(contractAddress, ABI, wallet);

  const nullifierSeed = proofData.proof.nullifierSeed;
  const nullifier = proofData.proof.nullifier;
  const timestamp = proofData.proof.timestamp;
  const signal = wallet.address;
  const revealArray = [
    proofData.proof.ageAbove18,
    proofData.proof.gender,
    proofData.proof.pincode,
    proofData.proof.state
  ];

  const groth16Proof = packGroth16Proof(proofData.proof.groth16Proof);

  console.log('NullifierSeed:', nullifierSeed);
  console.log('Nullifier:', nullifier);
  console.log('Timestamp:', timestamp);
  console.log('Signal:', signal);
  console.log('RevealArray:', revealArray);
  console.log('Groth16Proof:', groth16Proof);
  
  try {
    console.log('Adding user...');
    const tx = await contract.addUser(
      nullifierSeed,
      nullifier,
      timestamp,
      signal,
      revealArray,
      groth16Proof
    );
    console.log('Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('Transaction confirmed in block:', receipt.blockNumber);
  } catch (error) {
    console.error('Error:', error);
  }

// const getUserData = await contract.getUserByAddress(wallet.address);
// console.log('User data:', getUserData);

}

testAnonAadhaarIdentity().catch(console.error);
