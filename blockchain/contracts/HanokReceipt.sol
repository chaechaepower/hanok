// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract HanokReceipt is ERC721, Ownable {

    uint256 private _tokenIdCounter;

    // NFT 하나에 담길 거래 정보
    struct ReceiptData {
        uint256 escrowId;   // 에스크로 ID
        uint256 price;      // 낙찰 금액
        string  itemName;   // 상품명
        uint256 mintedAt;   // 민팅 시각 (unix timestamp)
    }

    // tokenId → 거래 정보 매핑
    mapping(uint256 => ReceiptData) public receipts;

    constructor() ERC721("HanokReceipt", "HNR") Ownable(msg.sender) {}

    // 서버 지갑(owner)만 호출 가능
    function mintReceipt(
        address buyer,      // 구매자 지갑 주소
        uint256 escrowId,
        uint256 price,
        string memory itemName
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = ++_tokenIdCounter;
        _mint(buyer, tokenId);
        receipts[tokenId] = ReceiptData(escrowId, price, itemName, block.timestamp);
        return tokenId;
    }

    // tokenId로 거래 정보 조회
    function getReceipt(uint256 tokenId) external view returns (ReceiptData memory) {
        return receipts[tokenId];
    }
}