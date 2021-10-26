const axios = require('axios').default
const { Api, JsonRpc } = require('eosjs')
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig')
const fetch = require('node-fetch')
const { TextEncoder, TextDecoder } = require('util')

const { eosConfig } = require('../config')
const { errorUtil, rulesUtil } = require('../utils')
const eosApi = require('../utils/eosapi')

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()
const rpc = new JsonRpc(eosConfig.apiEndpoint, { fetch })
const apiData = {
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
}

module.exports = {
  method: ['GET', 'POST'],
  path: '/v1/chain/push_transaction',
  handler: async (req, h) => {
    try {
      console.log('push_transaction', 'middleware')

      const api = new Api(apiData)
      const originalPayload = JSON.parse(req.payload)
      const orinalTransation = await api.deserializeTransactionWithActions(
        originalPayload.packed_trx
      )

      if (await allowBypassSignature(orinalTransation)) {
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
      let payload = originalPayload

      if (localTransaction.signatures[0] !== originalPayload.signatures[0]) {
        console.log('=> add writer signature')
        payload = {
          compression: originalPayload.compression,
          packed_context_free_data: originalPayload.packed_context_free_data,
          packed_trx: originalPayload.packed_trx,
          signatures: [
            ...localTransaction.signatures,
            ...originalPayload.signatures
          ]
        }
      }

      const { data } = await axios.post(
        `${eosConfig.apiEndpoint}/v1/chain/push_transaction`,
        JSON.stringify(payload)
      )

      return data
    } catch (error) {
      const standardError = errorUtil.getStandardError(error)

      return h.response(standardError).code(standardError.code)
    }
  }
}

const allowBypassSignature = async (transation) => {
  const permission = transation.actions[0].authorization[0].permission

  if (permission === 'writer') {
    return false
  }

  const eosioAccount = transation.actions.find((action) =>
    action.authorization.find(
      (authorization) => authorization.actor === 'eosio'
    )
  )

  if (eosioAccount) {
    return true
  }

  const account = transation.actions[0].authorization[0].actor
  const { rows: entities } = await eosApi.getTableRows({
    json: true,
    code: 'eosio',
    scope: 'eosio',
    table: 'entity',
    lower_bound: account,
    limit: 1
  })
  const entity = entities.find((entity) => entity.name === account)

  if (entity) {
    return true
  }

  return false
}
