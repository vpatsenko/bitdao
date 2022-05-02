import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
async function addElections(hre: any, contractAddress: string, deadline: string): Promise<string> {
	const DAO = await hre.ethers.getContractFactory("DAO");
	const dao = await DAO.attach(contractAddress);

	let tx = await dao.addVoting(deadline);
	let res = await tx.wait();

	let args: any;
	if (res.events) {
		args = res.events[0].args;
	}

	return args[0].toString();
}

async function vote(hre: any, contractAddress: string, voter: SignerWithAddress, candidate: string, electionID: string) {
	const DAO = await hre.ethers.getContractFactory("DAO");
	const dao = await DAO.attach(contractAddress);

	let tx = await dao.vote(candidate, electionID);
}

async function participate(hre: HardhatRuntimeEnvironment, contractAddress: string, electionID: string): Promise<void> {
	const DAO = await hre.ethers.getContractFactory("DAO");
	const dao = await DAO.attach(contractAddress);

	let tx = await dao.participate(electionID);
	await tx.wait();
}

export { addElections };