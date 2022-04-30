import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { DAO } from "../typechain";

describe("DAO", function () {

  let dao: DAO;
  let owner: SignerWithAddress;
  let add1: SignerWithAddress;
  let add2: SignerWithAddress;
  let add3: SignerWithAddress;
  let add4: SignerWithAddress;

  beforeEach(async () => {
    const DAO = await ethers.getContractFactory("DAO");
    dao = await DAO.deploy();
    await dao.deployed();

    // the first signer is owner by default
    [owner, add1, add2, add3, add4] = await ethers.getSigners();
  });

  it("It should addVoting, check electionId and then vote with address which was not a participant", async function () {
    let participants = [add1.address, add2.address, add3.address];

    await expect(dao.addVoting(participants, "256200"))
      .to.emit(dao, 'VotingWithElectionID')
      .withArgs("1");

    const options = { value: ethers.utils.parseEther("0.01"), from: add4.address };
    await expect(dao.connect(add4).vote(add1.address, "1", options))
      .to.revertedWith("voter is not a participant");
  });

  it("It should addVoting, check electionId and then vote for a candidate wich is not a participant", async function () {
    let participants = [add1.address, add2.address, add3.address];

    await expect(dao.addVoting(participants, "256200"))
      .to.emit(dao, 'VotingWithElectionID')
      .withArgs("1");

    const options = { value: ethers.utils.parseEther("0.01"), from: add2.address };
    await expect(dao.connect(add2).vote(add4.address, "1", options))
      .to.revertedWith("candidate is not a participant");
  });

  it("It should addVoting, check electionId and then vote for a candidate normally", async function () {
    let participants = [add1.address, add2.address, add3.address];

    await expect(dao.addVoting(participants, "256200"))
      .to.emit(dao, 'VotingWithElectionID')
      .withArgs("1");

    const options = { value: ethers.utils.parseEther("0.01"), from: add1.address };
    await expect(dao.connect(add1).vote(add3.address, "1", options))
      .to.emit(dao, 'Received')
      .withArgs(add1.address, "10000000000000000");
  });

  it("It should addVoting, check electionId and then vote for a candidate normally and then vote for the second time a", async function () {
    let participants = [add1.address, add2.address, add3.address];

    await expect(dao.addVoting(participants, "256200"))
      .to.emit(dao, 'VotingWithElectionID')
      .withArgs("1");

    const options = { value: ethers.utils.parseEther("0.01"), from: add1.address };
    await expect(dao.connect(add1).vote(add3.address, "1", options))
      .to.emit(dao, 'Received')
      .withArgs(add1.address, "10000000000000000");

    await expect(dao.connect(add1).vote(add2.address, "1", options))
      .to.revertedWith("address has voted already");
  });

  it("It should addVoting, check electionId, vote for a candidate with wrong eth amount ", async function () {
    let participants = [add1.address, add2.address, add3.address];

    await expect(dao.addVoting(participants, "256200"))
      .to.emit(dao, 'VotingWithElectionID')
      .withArgs("1");

    const options = { value: ethers.utils.parseEther("0.001"), from: add1.address };
    await expect(dao.connect(add1).vote(add2.address, "1", options))
      .to.revertedWith("amount is not 0.01 eth");
  });

  it("It should addVoting, check electionId, vote for with wrong electionID ", async function () {
    let participants = [add1.address, add2.address, add3.address];

    await expect(dao.addVoting(participants, "256200"))
      .to.emit(dao, 'VotingWithElectionID')
      .withArgs("1");

    const options = { value: ethers.utils.parseEther("0.01"), from: add1.address };
    await expect(dao.connect(add1).vote(add2.address, "2", options))
      .to.revertedWith("election is not inited");
  });

  it("It should addVoting with small deadline, sleep, and be reverted due to the ended deadline", async function () {
    let participants = [add1.address, add2.address, add3.address];

    await expect(dao.addVoting(participants, "2"))
      .to.emit(dao, 'VotingWithElectionID')
      .withArgs("1");

    await sleep(2500);

    const options = { value: ethers.utils.parseEther("0.01"), from: add1.address };
    await expect(dao.connect(add1).vote(add2.address, "1", options))
      .to.revertedWith("election is finished");
  });
});


async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}