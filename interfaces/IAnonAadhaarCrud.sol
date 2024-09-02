// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

interface IAnonAadhaarCrud {
    function addUser(
        uint nullifierSeed,
        uint nullifier,
        uint timestamp,
        uint signal,
        uint[4] memory revealArray,
        uint[8] memory groth16Proof
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
}