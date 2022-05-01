import { ethers } from "hardhat";

require("@nomiclabs/hardhat-web3");
require("@nomiclabs/hardhat-ethers");



async function addElections(contractAddress: string, deadline: string) {
	const DAO = await ethers.getContractFactory("DAO");
	const dao = await DAO.attach(contractAddress);


	await dao.addVoting(deadline);
}

export { addElections };