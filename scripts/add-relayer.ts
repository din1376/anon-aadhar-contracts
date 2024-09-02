import { ethers } from "hardhat";

async function main() {
  // Explicitly connect to the Amoy network
  const provider = new ethers.JsonRpcProvider(`https://polygon-amoy.infura.io/v3/${process.env.API_KEY_AMOY}`);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY_AMOY || '', provider);

  const contractAddress = "0x1e0F5B806D70F7BEf0e1bB9338347746b3a875e4"; // Your deployed contract address on Amoy
  const relayerAddress = "0xdd459ecb07d084D86895019FC49A6DA9591F95c9"; // Your relayer address

  const GaslessAnonAadhaarCrud = await ethers.getContractFactory("GaslessAnonAadhaarCrud");
  const contract = GaslessAnonAadhaarCrud.attach(contractAddress).connect(signer);

  console.log("Checking if relayer is already authorized...");
  let isAuthorized = await contract.authorizedRelayers(relayerAddress);
  console.log(`Is relayer currently authorized? ${isAuthorized}`);

  if (!isAuthorized) {
    console.log("Adding relayer...");
    const tx = await contract.addRelayer(relayerAddress);
    await tx.wait();
    console.log(`Transaction hash: ${tx.hash}`);
    console.log("Relayer addition transaction completed.");

    // Check again if the relayer is now authorized
    isAuthorized = await contract.authorizedRelayers(relayerAddress);
    console.log(`Is relayer now authorized? ${isAuthorized}`);

    if (isAuthorized) {
      console.log(`Relayer ${relayerAddress} successfully added and authorized.`);
    } else {
      console.log(`Failed to authorize relayer ${relayerAddress}. Please check the contract's addRelayer function.`);
    }
  } else {
    console.log(`Relayer ${relayerAddress} is already authorized.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});