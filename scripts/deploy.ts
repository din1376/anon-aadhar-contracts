import '@nomiclabs/hardhat-ethers'
import { ethers } from 'hardhat'
import { productionPublicKeyHash, testPublicKeyHash } from "@anon-aadhaar/core"
import * as dotenv from "dotenv";
dotenv.config();

// write all the contract addresses to a json file
import fs from 'fs'

// ... rest of your Hardhat config
//load test.json as an object by reading and parsing
const testJson = JSON.parse(fs.readFileSync('test.json', 'utf-8'));


let publicKeyHash = testPublicKeyHash
// To deploy contract with production UIDAI public key, will verify real Aadhaar
if (process.env.PRODUCTION_KEY === 'true') {
  console.log('Using production key...')
  publicKeyHash = productionPublicKeyHash
}


async function main() {
  // const verifier = await ethers.deployContract('Verifier')
  // await verifier.waitForDeployment()

  // const _verifierAddress = await verifier.getAddress()
  // testJson.verifier = _verifierAddress
  

  // console.log(`Verifier contract deployed to ${_verifierAddress}`)

  // const anonAadhaar = await ethers.deployContract('AnonAadhaar', [
  //   _verifierAddress,
  //   publicKeyHash,
  // ])

  //  await anonAadhaar.waitForDeployment()
  //  const _anonAadhaarAddress = await anonAadhaar.getAddress()
  // testJson.anonAadhaar = _anonAadhaarAddress
  // console.log(`AnonAadhaar contract deployed to ${_anonAadhaarAddress}`)

 const _anonAadhaarAddress = '0xAE7a6696a6b629286c3A62D205838eb864dB6443'
  const gaslessAnonAadhaarCrud = await ethers.deployContract('GaslessAnonAadhaarCrud',[
    _anonAadhaarAddress
])

  await gaslessAnonAadhaarCrud.waitForDeployment()

  testJson.gaslessAnonAadhaarCrud = await gaslessAnonAadhaarCrud.getAddress()
  console.log(
    `GaslessgaslessAnonAadhaarCrud contract deployed to ${await gaslessAnonAadhaarCrud.getAddress()}`,
  )
  fs.writeFileSync('test.json', JSON.stringify(testJson, null, 2))
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error)
  process.exitCode = 1
})



