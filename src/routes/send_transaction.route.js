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
  path: '/v1/chain/send_transaction',
  handler: async (req, h) => {
    try {
      console.log('send_transaction', 'middleware')
      const payload = getPayloadUtil(req)
      const orinalTransation = await api.deserializeTransactionWithActions(
        payload.packed_trx
      )

      if (await rulesUtil.allowBypassSignature(orinalTransation)) {
        console.log('=> bypass writer signature')
        const { data } = await axios.post(
          `${eosConfig.apiEndpoint}/v1/chain/push_transaction`,
          req.payload
        )

        return data
      }

      rulesUtil.validateTransction(orinalTransation)
      const localTransaction = await api.transact(orinalTransation, {
        broadcast: false
      })
      let newPayload = payload

      if (localTransaction.signatures[0] !== payload.signatures[0]) {
        console.log('=> add writer signature')
        newPayload = {
          compression: payload.compression,
          packed_context_free_data: payload.packed_context_free_data,
          packed_trx: payload.packed_trx,
          signatures: [...localTransaction.signatures, ...payload.signatures]
        }
      }

      const { data } = await axios.post(
        `${eosConfig.apiEndpoint}/v1/chain/push_transaction`,
        JSON.stringify(newPayload)
      )

      return data
    } catch (error) {
      const standardError = errorUtil.getStandardError(error)

      return h.response(standardError).code(standardError.code)
    }
  }
}
