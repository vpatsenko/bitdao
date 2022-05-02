import * as dotenv from "dotenv";

import { addElections, participate, finish, withdrawPrize, withdrawFee, vote } from "./task/task";
import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "solidity-coverage";

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();
  for (const account of accounts) {
    console.log(account.address);
  }
});

task("addVoting", "adds voting with given timout in seconds")
  .addParam("deadline", "the deadline for the voting to be finished")
  .addParam("address", "contract address")
  .setAction(async (taskArgs, hre) => {
    if (taskArgs.deadline === undefined) {
      throw new Error("deadline is required");
    }

    if (taskArgs.address == undefined) {
      throw new Error("address is required");
    }

    const electionID = await addElections(hre, taskArgs.address, taskArgs.deadline);
    console.log("=====================");
    console.log("Your election ID: ", electionID);
  }
  );

task("participate", "pariticipates with given hardhat id in the given election")
  .addParam("electionid", "electionid")
  .addParam("account", "number of account from list <npx hardhat accounts --network rinkeby> starting from zero")
  .addParam("address", "contract address")
  .setAction(async (taskArgs, hre) => {
    if (taskArgs.electionid === undefined) {
      throw new Error("deadline is required");
    }

    if (taskArgs.account === undefined) {
      throw new Error("account is required");
    }

    if (taskArgs.address == undefined) {
      throw new Error("address is required");
    }

    const signers = await hre.ethers.getSigners();
    if (signers.length <= taskArgs.account) {
      throw new Error("account is not valid");
    }

    const accountID = parseInt(taskArgs.account);
    await participate(hre, taskArgs.address, taskArgs.electionid, signers[accountID],);
  }
  );

task("vote", "votes for specified candidate")
  .addParam("address", "contract address number")
  .addParam("candidateid", "candidateid")
  .addParam("election", "electionID")
  .addParam("account", "number of account from list <npx hardhat accounts --network rinkeby> starting from zero")
  .setAction(async (taskArgs, hre) => {
    if (taskArgs.account === undefined) {
      throw new Error("account is required");
    }

    if (taskArgs.address === undefined) {
      throw new Error("contract address is required");
    }

    if (taskArgs.candidateid == undefined) {
      throw new Error("candidate is required");
    }

    if (taskArgs.election == undefined) {
      throw new Error("electionID is required");
    }

    const signers = await hre.ethers.getSigners();
    if (signers.length <= taskArgs.account) {
      throw new Error("account is not valid");
    }

    if (signers.length <= taskArgs.candidateid) {
      throw new Error("candidateid is not valid");
    }

    const accountID = parseInt(taskArgs.account);
    const candidateID = parseInt(taskArgs.candidateid);

    await vote(hre, taskArgs.address, signers[candidateID].address, taskArgs.election, signers[accountID]);
  });

task("finish", "finishes the election with given electionID")
  .addParam("address", "contract address number")
  .addParam("election", "electionID")
  .setAction(async (taskArgs, hre) => {
    if (taskArgs.address === undefined) {
      throw new Error("contract address is required");
    }

    if (taskArgs.election == undefined) {
      throw new Error("electionID is required");
    }

    await finish(hre, taskArgs.address, taskArgs.election);
  });

task("withdrawprize", "withdraws prize for winner")
  .addParam("address", "contract address number")
  .addParam("election", "electionID")
  .addParam("winner", "winner(id) from list <npx hardhat accounts --network rinkeby> starting from zero")
  .setAction(async (taskArgs, hre) => {
    if (taskArgs.winner === undefined) {
      throw new Error("winner is required");
    }

    if (taskArgs.address === undefined) {
      throw new Error("contract address is required");
    }

    if (taskArgs.election == undefined) {
      throw new Error("election is required");
    }

    const signers = await hre.ethers.getSigners();
    if (signers.length <= taskArgs.winner) {
      throw new Error("account is not valid");
    }

    const accountID = parseInt(taskArgs.winner);
    await withdrawPrize(hre, taskArgs.address, taskArgs.election, signers[accountID]);
  });

task("withdrawfee", "withdraws fee")
  .addParam("address", "contract address number")
  .setAction(async (taskArgs, hre) => {
    if (taskArgs.address === undefined) {
      throw new Error("contract address is required");
    }
    await withdrawFee(hre, taskArgs.address);
  });



// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more
const config: HardhatUserConfig = {
  solidity: "0.8.4",
  networks: {
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    rinkeby: {
      url: `${process.env.ALCHEMY_API_URL}`,
      accounts: [
        `${process.env.OWNER}`,
        `${process.env.ACC1}`,
        `${process.env.ACC2}`,
        `${process.env.ACC3}`,
      ]
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;