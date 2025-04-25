# Sample Hardhat Project

Decentralized P2P Energy Trading Simulation

This project simulates a blockchain-based peer-to-peer (P2P) energy trading model between a Prosumer (who produces and sells energy) and a Consumer (who buys and consumes energy). It uses a smart contract to handle energy trades in kilowatt-hours (kWh), recording transactions, prices, and payments on-chain.

The simulation includes test scenarios to measure performance metrics such as transaction time, verification time, gas cost, and scalability. This model is compared to traditional utility-based (centralized) energy billing systems.

🔧 Built with Solidity
🧪 Tested using Hardhat
📊 Metrics can be extended using Python or MATLAB for further analysis

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.ts
```
