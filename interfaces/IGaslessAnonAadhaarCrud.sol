// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

interface IGaslessAnonAadhaarCrud {
    event UserAdded(address indexed userAddress, uint indexed nullifier);
    event RelayerAdded(address indexed relayer);
    event RelayerRemoved(address indexed relayer);

    function addRelayer(address relayer) external;
    function removeRelayer(address relayer) external;

    function addUserGasless(
        address userAddress,
        uint nullifierSeed,
        uint nullifier,
        uint timestamp,
        uint signal,
        uint[4] memory revealArray,
        uint[8] memory groth16Proof,
        uint256 nonce,
        bytes memory signature
    ) external;

    function getUserByNullifier(uint nullifier) external view returns (
        address userAddress,
        uint nullifierSeed,
        uint[4] memory revealedData
    );

    function getUserByAddress(address userAddress) external view returns (
        uint nullifier,
        uint nullifierSeed,
        uint[4] memory revealedData
    );

    function getAllUsers() external view returns (
        address[] memory userAddresses,
        uint[] memory nullifiers,
        uint[] memory nullifierSeeds,
        uint[4][] memory revealedDataArray
    );

    function withdraw(uint256 amount) external;
}