// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract EnergyTrading {
    enum Role { None, Prosumer, Consumer }
    
    struct User {
        Role role;
        uint energyBalance; // in kWh
    }
    
    struct Trade {
        address prosumer;
        address consumer;
        uint amount; // in kWh
        uint pricePerKWh;
        uint totalPrice;
        uint timestamp;
    }

    mapping(address => User) public users;
    Trade[] public trades;

    event Registered(address user, Role role);
    event EnergyListed(address prosumer, uint amount);
    event EnergyPurchased(address consumer, address prosumer, uint amount, uint price);

    modifier onlyProsumer() {
        require(users[msg.sender].role == Role.Prosumer, "Not a prosumer");
        _;
    }

    modifier onlyConsumer() {
        require(users[msg.sender].role == Role.Consumer, "Not a consumer");
        _;
    }

    function registerAsProsumer() external {
        users[msg.sender] = User(Role.Prosumer, 0);
        emit Registered(msg.sender, Role.Prosumer);
    }

    function registerAsConsumer() external {
        users[msg.sender] = User(Role.Consumer, 0);
        emit Registered(msg.sender, Role.Consumer);
    }

    function addEnergy(uint _amount) external onlyProsumer {
        users[msg.sender].energyBalance += _amount;
        emit EnergyListed(msg.sender, _amount);
    }

    function buyEnergy(address _prosumer, uint _amount, uint _pricePerKWh) external payable onlyConsumer {
        require(users[_prosumer].role == Role.Prosumer, "Seller not a prosumer");
        require(users[_prosumer].energyBalance >= _amount, "Not enough energy");
        
        uint totalPrice = _amount * _pricePerKWh;
        require(msg.value >= totalPrice, "Not enough ETH sent");

        // Transfer ETH to prosumer
        payable(_prosumer).transfer(totalPrice);

        // Update balances
        users[_prosumer].energyBalance -= _amount;
        users[msg.sender].energyBalance += _amount;

        // Store trade record
        trades.push(Trade({
            prosumer: _prosumer,
            consumer: msg.sender,
            amount: _amount,
            pricePerKWh: _pricePerKWh,
            totalPrice: totalPrice,
            timestamp: block.timestamp
        }));

        emit EnergyPurchased(msg.sender, _prosumer, _amount, _pricePerKWh);
    }

    function getTradeHistory() external view returns (Trade[] memory) {
        return trades;
    }

    function getUser(address _user) external view returns (User memory) {
        return users[_user];
    }
}
