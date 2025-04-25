import { expect } from "chai";
import hre from "hardhat";


describe("EnergyTrading", function() {
  let Energy:any, energy:any, prosumer:any, consumer:any, other:any;
  const PRICE_PER_KWH = hre.ethers.parseUnits("1", "wei"); // 1 wei per kWh
  const AMOUNT = 100;
  let totalPrice: any

  beforeEach(async () => {
    [prosumer, consumer, other] = await hre.ethers.getSigners();
    Energy = await hre.ethers.getContractFactory("EnergyTrading");
    energy = await Energy.deploy();
  });

  describe("Registration", function() {
    it("lets a user register as a prosumer", async function() {
      await expect(energy.connect(prosumer).registerAsProsumer())
        .to.emit(energy, "Registered")
        .withArgs(prosumer.address, 1); // Role.Prosumer === 1

      const user = await energy.getUser(prosumer.address);
      expect(user.role).to.equal(1);
      expect(user.energyBalance).to.equal(0);
    });

    it("lets a user register as a consumer", async function() {
      await expect(energy.connect(consumer).registerAsConsumer())
        .to.emit(energy, "Registered")
        .withArgs(consumer.address, 2); // Role.Consumer === 2

      const user = await energy.getUser(consumer.address);
      expect(user.role).to.equal(2);
      expect(user.energyBalance).to.equal(0);
    });
  });

  describe("Access control", function() {
    it("blocks addEnergy for non‑prosumer", async function() {
      await energy.connect(consumer).registerAsConsumer();
      await expect(
        energy.connect(consumer).addEnergy(AMOUNT)
      ).to.be.revertedWithCustomError(energy, "NotProsumer");
    });

    it("blocks buyEnergy for non‑consumer", async function() {
      await energy.connect(prosumer).registerAsProsumer();
      await expect(
        energy.connect(prosumer).buyEnergy(prosumer.address, AMOUNT, PRICE_PER_KWH, { value: AMOUNT })
      ).to.be.revertedWith("Not a consumer");
    });
  });

  describe("Energy listing", function() {
    beforeEach(async () => {
      await energy.connect(prosumer).registerAsProsumer();
    });

    it("increases the prosumer's balance and emits event", async function() {
      await expect(energy.connect(prosumer).addEnergy(AMOUNT))
        .to.emit(energy, "EnergyListed")
        .withArgs(prosumer.address, AMOUNT);

      const user = await energy.getUser(prosumer.address);
      expect(user.energyBalance).to.equal(AMOUNT);
    });
  });

  describe("Buying energy", function() {
    beforeEach(async () => {
      // setup
      await energy.connect(prosumer).registerAsProsumer();
      await energy.connect(prosumer).addEnergy(AMOUNT);
      await energy.connect(consumer).registerAsConsumer();
    });

    it("Include Gas Cost Calculation and allows consumer to buy energy, transfers ETH, updates balances, logs trade", async function() {
    const AMOUNT = hre.ethers.toNumber("100");        // 100 kWh
    const PRICE_PER_KWH = hre.ethers.toNumber("5");   // 5 wei per kWh

    // 2. Now .mul works as expected
        totalPrice = AMOUNT * PRICE_PER_KWH
        const beforeProsumerEth = await hre.ethers.provider.getBalance(prosumer.address);
        const beforeConsumerBal = (await energy.getUser(consumer.address)).energyBalance;
        console.log("🚀 ~ it ~ beforeConsumerBal:", beforeConsumerBal)
  
        const tx = await energy.connect(consumer).buyEnergy(
          prosumer.address,
          AMOUNT,
          PRICE_PER_KWH,
          { value: totalPrice }
        );
  
        await expect(tx)
          .to.emit(energy, "EnergyPurchased")
          .withArgs(consumer.address, prosumer.address, AMOUNT, PRICE_PER_KWH);
  
        const afterProsumerEth = await hre.ethers.provider.getBalance(prosumer.address);
        expect(afterProsumerEth -(beforeProsumerEth)).to.equal(totalPrice);
  
        const prosumerBal = (await energy.getUser(prosumer.address)).energyBalance;
        const consumerBal = (await energy.getUser(consumer.address)).energyBalance;
        expect(prosumerBal).to.equal(0);
        // expect(consumerBal).to.equal(beforeConsumerBal + (AMOUNT));
  
        const trades = await energy.getTradeHistory();
        expect(trades.length).to.equal(1);
        const trade = trades[0];
        expect(trade.prosumer).to.equal(prosumer.address);
        expect(trade.consumer).to.equal(consumer.address);
        expect(trade.amount).to.equal(AMOUNT);
        expect(trade.pricePerKWh).to.equal(PRICE_PER_KWH);
        expect(trade.totalPrice).to.equal(totalPrice);
        // expect(trade.timestamp).to.be.a("number");
      });

      it("allows consumer to buy energy, transfers ETH, updates balances, logs trade", async function() {
        const AMOUNT = 100;
        const PRICE_PER_KWH = 5;
        totalPrice = BigInt(AMOUNT * PRICE_PER_KWH);
      
        const beforeProsumerEth = await hre.ethers.provider.getBalance(prosumer.address);
        const beforeConsumerEth = await hre.ethers.provider.getBalance(consumer.address);
      
        const txResponse = await energy.connect(consumer).buyEnergy(
          prosumer.address,
          AMOUNT,
          PRICE_PER_KWH,
          { value: totalPrice }
        );
      
        const txReceipt = await txResponse.wait();
        const gasUsed = txReceipt.gasUsed;
        const gasPrice = txResponse.gasPrice ?? txReceipt.effectiveGasPrice;
        const gasCost = gasUsed * gasPrice;
      
        console.log("📊 Gas used:", gasUsed.toString());
        console.log("💰 Gas price:", gasPrice.toString());
        console.log("💸 Total gas cost (wei):", gasCost.toString());
      
        const afterProsumerEth = await hre.ethers.provider.getBalance(prosumer.address);
        expect(afterProsumerEth - beforeProsumerEth).to.equal(totalPrice);
      
        const afterConsumerEth = await hre.ethers.provider.getBalance(consumer.address);
        const ethDiff = beforeConsumerEth - afterConsumerEth;
        const expectedSpent = totalPrice + gasCost;
      
        expect(ethDiff).to.be.closeTo(expectedSpent, 10n ** 12n); // Allow minor variance
      
        // Check balances
        const prosumerBal = (await energy.getUser(prosumer.address)).energyBalance;
        const consumerBal = (await energy.getUser(consumer.address)).energyBalance;
        expect(prosumerBal).to.equal(0);
        expect(consumerBal).to.equal(AMOUNT);
      
        // Check trade log
        const trades = await energy.getTradeHistory();
        expect(trades.length).to.equal(1);
        const trade = trades[0];
        expect(trade.prosumer).to.equal(prosumer.address);
        expect(trade.consumer).to.equal(consumer.address);
        expect(trade.amount).to.equal(AMOUNT);
        expect(trade.pricePerKWh).to.equal(PRICE_PER_KWH);
        expect(trade.totalPrice).to.equal(totalPrice);
      });
      
      

      it("reverts if not enough ETH sent", async function() {
        const totalPrice = BigInt(AMOUNT) * PRICE_PER_KWH; // recalculate
        const insufficients = totalPrice.toString() ;
        const insufficient = Number(insufficients) - 1 ;
      
        await expect(
          energy.connect(consumer).buyEnergy(
            prosumer.address,
            AMOUNT,
            PRICE_PER_KWH,
            { value: insufficient }
          )
        ).to.be.revertedWith("Not enough ETH sent");
      });
      

    it("reverts if prosumer has insufficient energy", async function() {
      const result = PRICE_PER_KWH * BigInt(AMOUNT + 1);
      await expect(
        energy.connect(consumer).buyEnergy(
          prosumer.address,
          AMOUNT + 1, // more than listed
          PRICE_PER_KWH,
          { value: result  }
        )
      ).to.be.revertedWith("Not enough energy");
    });

    it("reverts if target is not a prosumer", async function() {
      const result = PRICE_PER_KWH * BigInt(AMOUNT);
      await energy.connect(other).registerAsConsumer();
      await expect(
        energy.connect(consumer).buyEnergy(
          other.address,
          AMOUNT,
          PRICE_PER_KWH,
          { value: result }
        )
      ).to.be.revertedWith("Seller not a prosumer");
    });
  });
});
