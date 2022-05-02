# Advanced Sample Hardhat Project

### Spinning up the app

Install all the dependencies
```shell
npm install
```

### Testing
To test project with hardhat, run:
```shell
npx hardhat coverage
```

## Deploying to the rinkeby network
To deploy you first need to create file named `.env` with the following format:
```shell
ALCHEMY_API_URL= <your alchemy api url>
OWNER=<your metamask private key>
ACC1=<your metamask private key>
ACC2=<your metamask private key>
ACC3=<your metamask private key>
```
Test eth can be obtained here
https://faucet.rinkeby.io/

Then deploy to the testnet
```shell
npx hardhat run scripts/deploy.ts --network rinkeby
```


## Running hardhat tasks

```shell
export CONTRACTADDRESS=<address which you received when deployed the contract>
```

To add voting with 3 days deadline
```shell
npx hardhat addVoting --deadline 256200 --address $CONTRACTADDRESS --network rinkeby
```

To participate in voting with provided election id and account id
```shell
npx hardhat participate --electionid 1 --account 1 --address $CONTRACTADDRESS --network rinkeby
```

To vote for a candidate
```shell
npx hardhat vote --address $CONTRACTADDRESS --candidate candidateAddress --election 1 --network rinkeby
```