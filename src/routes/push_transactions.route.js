const axios = require('axios').default
const { Api, JsonRpc } = require('eosjs')
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig')
const fetch = require('node-fetch')
const { TextEncoder, TextDecoder } = require('util')

const { eosConfig } = require('../config')
const { errorUtil, rulesUtil, getPayloadUtil } = require('../utils')

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()
const rpc = new JsonRpc(eosConfig.apiEndpoint, { fetch })
const api = new Api({
  rpc,
  textDecoder,
  textEncoder,
  chainId: eosConfig.chainId,
  authorityProvider: {
    getRequiredKeys: () => {
      // TODO: get pubKey from vault
      return Promise.resolve([eosConfig.writer.pubKey])
    }
  },
  // TODO: get privateKey from vault
  signatureProvider: new JsSignatureProvider([eosConfig.writer.privateKey])
})

module.exports = {
  method: ['GET', 'POST'],
  path: '/v1/chain/push_transactions',
  handler: async (req, h) => {
    try {
      console.log('push_transactions', 'middleware')
      const transactions = getPayloadUtil(req)
      const newTransactions = []

      for (let index = 0; index < transactions.length; index++) {
        let unpackedTrx = await api.deserializeTransactionWithActions(
          transactions[index].packed_trx
        )

        if (await rulesUtil.allowBypassSignature(unpackedTrx)) {
          console.log('=> bypass writer signature')
          newTransactions.push(transactions[index])
        } else {
          rulesUtil.validateTransction(unpackedTrx)
          const newTransation = await api.transact(unpackedTrx, {
            broadcast: false
          })

          if (
            newTransation.signatures[0] !== transactions[index].signatures[0]
          ) {
            console.log('=> add writer signature')
            newTransactions.push({
              compression: transactions[index].compression,
              packed_context_free_data:
                transactions[index].packed_context_free_data,
              packed_trx: transactions[index].packed_trx,
              signatures: [
                ...transactions[index].signatures,
                ...newTransation.signatures
              ]
            })
          }
        }
      }

      const { data } = await axios.post(
        `${eosConfig.apiEndpoint}/v1/chain/push_transactions`,
        JSON.stringify(newTransactions)
      )

      return data
    } catch (error) {
      const standardError = errorUtil.getStandardError(error)

      return h.response(standardError).code(standardError.code)
    }
  }
}
