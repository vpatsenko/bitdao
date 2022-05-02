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

async function vote(hre: any, contractAddress: string, candidate: string, electionID: string, voter: SignerWithAddress) {
	const DAO = await hre.ethers.getContractFactory("DAO");
	const dao = await DAO.attach(contractAddress);


	const options = { value: hre.ethers.utils.parseEther("0.01"), from: voter.address };
	let tx = await dao.connect(voter).vote(candidate, electionID, options);
	await tx.wait();
}

async function participate(hre: HardhatRuntimeEnvironment, contractAddress: string, electionID: string, userKeyPair: SignerWithAddress): Promise<void> {
	const DAO = await hre.ethers.getContractFactory("DAO");
	const dao = await DAO.attach(contractAddress);

	let tx = await dao.connect(userKeyPair).participate(electionID);
	await tx.wait();
}

async function finish(hre: HardhatRuntimeEnvironment, contractAddress: string, electionID: string) {
	const DAO = await hre.ethers.getContractFactory("DAO");
	const dao = await DAO.attach(contractAddress);

	let tx = await dao.finishElection(electionID);
	await tx.wait();
}

async function withdrawPrize(hre: HardhatRuntimeEnvironment, contractAddress: string, electionID: string, winner: SignerWithAddress) {
	const DAO = await hre.ethers.getContractFactory("DAO");
	const dao = await DAO.attach(contractAddress);

	let tx = await dao.connect(winner).withdrawPrize(electionID);
	await tx.wait();
}

async function withdrawFee(hre: HardhatRuntimeEnvironment, contractAddress: string) {
	const DAO = await hre.ethers.getContractFactory("DAO");
	const dao = await DAO.attach(contractAddress);

	let tx = await dao.withdrawFee();
	await tx.wait();
}



export { addElections, participate, vote, finish, withdrawPrize, withdrawFee };