import { BigInt, Bytes } from "@graphprotocol/graph-ts"

// =============================================================================
// CONTRACT ADDRESS CONFIGURATION
// =============================================================================

export class ContractAddresses {
  identityRegistry: Bytes
  reputationRegistry: Bytes
  validationRegistry: Bytes

  constructor(
    identityRegistry: Bytes,
    reputationRegistry: Bytes,
    validationRegistry: Bytes
  ) {
    this.identityRegistry = identityRegistry
    this.reputationRegistry = reputationRegistry
    this.validationRegistry = validationRegistry
  }
}

// =============================================================================
// ADDRESS RESOLUTION
// =============================================================================

export function getContractAddresses(chainId: BigInt): ContractAddresses {
  // Ethereum Sepolia (11155111) - Only supported chain
  if (chainId.equals(BigInt.fromI32(11155111))) {
    return new ContractAddresses(
      Bytes.fromHexString("0x8004a6090Cd10A7288092483047B097295Fb8847"), // Identity Registry
      Bytes.fromHexString("0x8004B8FD1A363aa02fDC07635C0c5F94f6Af5B7E"), // Reputation Registry
      Bytes.fromHexString("0x8004CB39f29c09145F24Ad9dDe2A108C1A2cdfC5")  // Validation Registry
    )
  }

  // Unsupported chain - return zero addresses
  return new ContractAddresses(
    Bytes.fromHexString("0x0000000000000000000000000000000000000000"),
    Bytes.fromHexString("0x0000000000000000000000000000000000000000"),
    Bytes.fromHexString("0x0000000000000000000000000000000000000000")
  )
}

// =============================================================================
// CHAIN NAME RESOLUTION
// =============================================================================

export function getChainName(chainId: BigInt): string {
  if (chainId.equals(BigInt.fromI32(11155111))) return "Ethereum Sepolia"
  return `Unsupported Chain ${chainId.toString()}`
}

// =============================================================================
// VALIDATION
// =============================================================================

export function validateContractAddresses(addresses: ContractAddresses): boolean {
  // Check if addresses are not zero addresses
  let zeroAddress = Bytes.fromHexString("0x0000000000000000000000000000000000000000")
  
  return !addresses.identityRegistry.equals(zeroAddress) &&
         !addresses.reputationRegistry.equals(zeroAddress) &&
         !addresses.validationRegistry.equals(zeroAddress)
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function isSupportedChain(chainId: BigInt): boolean {
  let addresses = getContractAddresses(chainId)
  return validateContractAddresses(addresses)
}

export function getSupportedChains(): BigInt[] {
  return [
    BigInt.fromI32(11155111)  // Ethereum Sepolia (only supported chain)
  ]
}
