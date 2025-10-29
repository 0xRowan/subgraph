import { Bytes, dataSource, json, log, BigInt, JSONValueKind } from '@graphprotocol/graph-ts'
import { AgentRegistrationFile, Agent } from '../generated/schema'

function safeSaveRegistrationFile(metadata: AgentRegistrationFile, cid: string): void {
  let existing = AgentRegistrationFile.load(cid)
  if (existing == null) {
    metadata.save()
  } else {
    log.info("Metadata file already exists, skipping save for CID: {}", [cid])
  }
}

export function parseRegistrationFile(content: Bytes): void {
  let context = dataSource.context()
  let agentId = context.getString('agentId')
  let cid = dataSource.stringParam()
  
  log.info("Parsing registration file for agent: {}, CID: {}", [agentId, cid])
  
  // Check if already exists (immutable entity)
  let metadata = AgentRegistrationFile.load(cid)
  if (metadata != null) {
    log.info("Registration file already indexed for CID: {}, agent: {}", [cid, agentId])
    return // Already processed
  }
  
  // Create new registration file
  metadata = new AgentRegistrationFile(cid)
  metadata.agentId = agentId
  metadata.createdAt = context.getBigInt('timestamp')
  metadata.supportedTrusts = []
  metadata.mcpTools = []
  metadata.mcpPrompts = []
  metadata.mcpResources = []
  metadata.a2aSkills = []
  
  let result = json.try_fromBytes(content)
  if (result.isError) {
    log.error("Failed to parse JSON for registration file CID: {}", [cid])
    safeSaveRegistrationFile(metadata, cid)
    return
  }
  
  let value = result.value
  
  if (value.kind != JSONValueKind.OBJECT) {
    log.error("JSON value is not an object for registration file CID: {}, kind: {}", [cid, value.kind.toString()])
    safeSaveRegistrationFile(metadata, cid)
    return
  }
  
  let obj = value.toObject()
  if (obj == null) {
    log.error("Failed to convert JSON to object for registration file CID: {}", [cid])
    safeSaveRegistrationFile(metadata, cid)
    return
  }
  
  let name = obj.get('name')
  if (name && !name.isNull()) {
    metadata.name = name.toString()
  }
  
  let description = obj.get('description')
  if (description && !description.isNull()) {
    metadata.description = description.toString()
  }
  
  let image = obj.get('image')
  if (image && !image.isNull()) {
    metadata.image = image.toString()
  }
  
  let active = obj.get('active')
  if (active && !active.isNull()) {
    metadata.active = active.toBool()
  }
  
  let x402support = obj.get('x402support')
  if (x402support && !x402support.isNull()) {
    metadata.x402support = x402support.toBool()
  }
  
  let supportedTrusts = obj.get('supportedTrusts')
  if (!supportedTrusts || supportedTrusts.isNull()) {
    supportedTrusts = obj.get('supportedTrust')
  }
  if (supportedTrusts && !supportedTrusts.isNull()) {
    let trustsArray = supportedTrusts.toArray()
    let trusts: string[] = []
    for (let i = 0; i < trustsArray.length; i++) {
      trusts.push(trustsArray[i].toString())
    }
    metadata.supportedTrusts = trusts
  }
  
  // Parse endpoints array
  let endpoints = obj.get('endpoints')
  if (endpoints && !endpoints.isNull()) {
    let endpointsArray = endpoints.toArray()
    
    for (let i = 0; i < endpointsArray.length; i++) {
      let endpoint = endpointsArray[i].toObject()
      
      let endpointName = endpoint.get('name')
      if (endpointName && !endpointName.isNull()) {
        let nameStr = endpointName.toString()
        
        if (nameStr == 'MCP') {
          let mcpEndpoint = endpoint.get('endpoint')
          if (mcpEndpoint && !mcpEndpoint.isNull()) {
            metadata.mcpEndpoint = mcpEndpoint.toString()
          }
          
          let mcpVersion = endpoint.get('version')
          if (mcpVersion && !mcpVersion.isNull()) {
            metadata.mcpVersion = mcpVersion.toString()
          }
          
          // Extract mcpTools from MCP endpoint
          let mcpTools = endpoint.get('mcpTools')
          if (mcpTools && !mcpTools.isNull()) {
            let toolsArray = mcpTools.toArray()
            let tools: string[] = []
            for (let j = 0; j < toolsArray.length; j++) {
              tools.push(toolsArray[j].toString())
            }
            metadata.mcpTools = tools
          }
          
          // Extract mcpPrompts from MCP endpoint
          let mcpPrompts = endpoint.get('mcpPrompts')
          if (mcpPrompts && !mcpPrompts.isNull()) {
            let promptsArray = mcpPrompts.toArray()
            let prompts: string[] = []
            for (let j = 0; j < promptsArray.length; j++) {
              prompts.push(promptsArray[j].toString())
            }
            metadata.mcpPrompts = prompts
          }
          
          // Extract mcpResources from MCP endpoint
          let mcpResources = endpoint.get('mcpResources')
          if (mcpResources && !mcpResources.isNull()) {
            let resourcesArray = mcpResources.toArray()
            let resources: string[] = []
            for (let j = 0; j < resourcesArray.length; j++) {
              resources.push(resourcesArray[j].toString())
            }
            metadata.mcpResources = resources
          }
        } else if (nameStr == 'A2A') {
          let a2aEndpoint = endpoint.get('endpoint')
          if (a2aEndpoint && !a2aEndpoint.isNull()) {
            metadata.a2aEndpoint = a2aEndpoint.toString()
          }
          
          let a2aVersion = endpoint.get('version')
          if (a2aVersion && !a2aVersion.isNull()) {
            metadata.a2aVersion = a2aVersion.toString()
          }
          
          // Extract a2aSkills from A2A endpoint
          let a2aSkills = endpoint.get('a2aSkills')
          if (a2aSkills && !a2aSkills.isNull()) {
            let skillsArray = a2aSkills.toArray()
            let skills: string[] = []
            for (let j = 0; j < skillsArray.length; j++) {
              skills.push(skillsArray[j].toString())
            }
            metadata.a2aSkills = skills
          }
        } else if (nameStr == 'agentWallet') {
          let agentWallet = endpoint.get('endpoint')
          if (agentWallet && !agentWallet.isNull()) {
            let walletStr = agentWallet.toString()
            
            // Parse EIP-155 format: eip155:1:0x742d35...
            if (walletStr.startsWith("eip155:")) {
              let parts = walletStr.split(":")
              let hasAddress = parts.length > 2
              if (hasAddress) {
                let addressPart = parts[2]
                if (addressPart.startsWith("0x") && addressPart.length == 42) {
                  metadata.agentWallet = Bytes.fromHexString(addressPart)
                  let chainIdPart = parts[1]
                  if (chainIdPart.length > 0) {
                    metadata.agentWalletChainId = BigInt.fromString(chainIdPart)
                  }
                }
              }
            } else if (walletStr.startsWith("0x") && walletStr.length == 42) {
              metadata.agentWallet = Bytes.fromHexString(walletStr)
            }
          }
        } else if (nameStr == 'ENS') {
          let ensEndpoint = endpoint.get('endpoint')
          if (ensEndpoint && !ensEndpoint.isNull()) {
            metadata.ens = ensEndpoint.toString()
          }
        } else if (nameStr == 'DID') {
          let didEndpoint = endpoint.get('endpoint')
          if (didEndpoint && !didEndpoint.isNull()) {
            metadata.did = didEndpoint.toString()
          }
        }
      }
    }
  }
  
  safeSaveRegistrationFile(metadata, cid)
  
  log.info("Successfully parsed registration file for CID: {}, name: {}, description: {}", [cid, metadata.name ? metadata.name! : "null", metadata.description ? metadata.description! : "null"])
  
  // Note: We cannot update chain entities (Agent) from file data source handlers due to isolation rules.
  // The metadataFile connection is set from the chain handler in identity-registry.ts
}
