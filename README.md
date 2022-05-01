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

### Deploying to the rinkeby network
To deploy you first need to create file named `.env` with the following format:
```shell
PRIVATE_KEY= <your metamask private key>
RINKEBY_API_URL= <your alchemy api url>
```
Test eth can be obtained here
https://faucet.rinkeby.io/

Then deploy to the testnet
```shell
npx hardhat run scripts/deploy.ts --network rinkeby
```

