const EXPLORER_BASE_URL = 'https://sepolia.etherscan.io/tx';

export function getExplorerUrl(txHash: string): string {
  return `${EXPLORER_BASE_URL}/${txHash}`;
}

export function shortenTxHash(txHash: string): string {
  return `${txHash.slice(0, 10)}...${txHash.slice(-6)}`;
}
