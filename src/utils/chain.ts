import { dataSource, log } from "@graphprotocol/graph-ts"

/**
 * Get the chain ID for the current data source network
 * @returns Chain ID as i32, or 0 for unknown networks
 */
export function getChainId(): i32 {
  let network = dataSource.network()
  
  // Map network names to chain IDs
  if (network == "mainnet") {
    return 1
  } else if (network == "sepolia") {
    return 11155111
  } else if (network == "goerli") {
    return 5
  } else if (network == "polygon") {
    return 137
  } else if (network == "arbitrum-one") {
    return 42161
  } else if (network == "optimism") {
    return 10
  } else if (network == "base") {
    return 8453
  } else if (network == "bsc") {
    return 56
  } else if (network == "avalanche") {
    return 43114
  } else {
    log.warning("Unknown network: {}, using chain ID 0", [network])
    return 0
  }
}
