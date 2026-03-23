const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("HanokReceiptModule", (m) => {
    const hanokReceipt = m.contract("HanokReceipt");
    return { hanokReceipt };
});