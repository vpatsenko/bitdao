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

  beforeEach(async () => {
    const DAO = await ethers.getContractFactory("DAO");
    dao = await DAO.deploy();
    await dao.deployed();

    // the first signer is owner by default
    [owner, add1, add2, add3] = await ethers.getSigners();
  });

  it("It should addVoting and get electionID", async function () {

    let participants = [add1.address, add2.address, add3.address];

    // await dao.addVoting(participants);
    // let receipe = await tx.wait(1);

    // let electionID: string;
    // let invokerAddress: string;


    // receipe.events?.map(x => {
    //   x.args?.map(y => {
    //     console.log(y)
    //   })
    // })


    await expect(dao.addVoting(participants))
      .to.emit(dao, 'VotingIsAddedForAddressAndElectionID')
      .withArgs(owner.address, "1");

    // console.log(invokerAddress[0]);

  });
});

    // const options = { value: ethers.utils.parseEther("1.0"), from: add1.address };
    // let tx = await dao.connect(add1).deposit(options);