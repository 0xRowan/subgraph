import { Bytes, dataSource, json, log, BigInt, JSONValueKind } from '@graphprotocol/graph-ts'
import { FeedbackFile, Feedback } from '../generated/schema'

function safeSaveFeedbackFile(feedbackFile: FeedbackFile, cid: string): void {
  let existing = FeedbackFile.load(cid)
  if (existing == null) {
    feedbackFile.save()
  } else {
    log.info("Feedback file already exists, skipping save for CID: {}", [cid])
  }
}

export function parseFeedbackFile(content: Bytes): void {
  let context = dataSource.context()
  let feedbackId = context.getString('feedbackId')
  let cid = dataSource.stringParam()
  let tag1OnChain = context.getString('tag1OnChain')
  let tag2OnChain = context.getString('tag2OnChain')
  
  log.info("Parsing feedback file for feedback: {}, CID: {}", [feedbackId, cid])
  
  // Check if already exists (immutable entity)
  let feedbackFile = FeedbackFile.load(cid)
  if (feedbackFile != null) {
    log.info("Feedback file already indexed for CID: {}, feedback: {}", [cid, feedbackId])
    return // Already processed
  }
  
  // Create new feedback file
  feedbackFile = new FeedbackFile(cid)
  feedbackFile.feedbackId = feedbackId
  feedbackFile.createdAt = context.getBigInt('timestamp')
  
  let result = json.try_fromBytes(content)
  if (result.isError) {
    log.error("Failed to parse JSON for feedback file CID: {}", [cid])
    safeSaveFeedbackFile(feedbackFile, cid)
    return
  }
  
  let value = result.value
  
  if (value.kind != JSONValueKind.OBJECT) {
    log.error("JSON value is not an object for feedback file CID: {}, kind: {}", [cid, value.kind.toString()])
    safeSaveFeedbackFile(feedbackFile, cid)
    return
  }
  
  let obj = value.toObject()
  if (obj == null) {
    log.error("Failed to convert JSON to object for feedback file CID: {}", [cid])
    safeSaveFeedbackFile(feedbackFile, cid)
    return
  }
  
  let text = obj.get('text')
  if (text && !text.isNull()) {
    feedbackFile.text = text.toString()
  }
  
  let capability = obj.get('capability')
  if (capability && !capability.isNull()) {
    feedbackFile.capability = capability.toString()
  }
  
  let name = obj.get('name')
  if (name && !name.isNull()) {
    feedbackFile.name = name.toString()
  }
  
  let skill = obj.get('skill')
  if (skill && !skill.isNull()) {
    feedbackFile.skill = skill.toString()
  }
  
  let task = obj.get('task')
  if (task && !task.isNull()) {
    feedbackFile.task = task.toString()
  }
  
  let contextStr = obj.get('context')
  if (contextStr && !contextStr.isNull()) {
    feedbackFile.context = contextStr.toString()
  }
  
  let proofOfPayment = obj.get('proof_of_payment')
  if (proofOfPayment && !proofOfPayment.isNull()) {
    let proofObj = proofOfPayment.toObject()
    
    let fromAddress = proofObj.get('fromAddress')
    if (fromAddress && !fromAddress.isNull()) {
      feedbackFile.proofOfPaymentFromAddress = fromAddress.toString()
    }
    
    let toAddress = proofObj.get('toAddress')
    if (toAddress && !toAddress.isNull()) {
      feedbackFile.proofOfPaymentToAddress = toAddress.toString()
    }
    
    let chainId = proofObj.get('chainId')
    if (chainId && !chainId.isNull()) {
      feedbackFile.proofOfPaymentChainId = chainId.toString()
    }
    
    let txHash = proofObj.get('txHash')
    if (txHash && !txHash.isNull()) {
      feedbackFile.proofOfPaymentTxHash = txHash.toString()
    }
  }
  
  if (tag1OnChain.length == 0) {
    let tag1 = obj.get('tag1')
    if (tag1 && !tag1.isNull()) {
      feedbackFile.tag1 = tag1.toString()
    }
  }
  
  if (tag2OnChain.length == 0) {
    let tag2 = obj.get('tag2')
    if (tag2 && !tag2.isNull()) {
      feedbackFile.tag2 = tag2.toString()
    }
  }
  
  safeSaveFeedbackFile(feedbackFile, cid)
  
  // Cannot update chain entities from file handlers due to isolation rules
}
