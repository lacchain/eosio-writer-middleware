const axios = require('axios').default

const { eosConfig } = require('../config')
const { errorUtil, rulesUtil, getPayloadUtil } = require('../utils')

module.exports = {
  method: ['GET', 'POST'],
  path: '/v1/chain/get_required_keys',
  handler: async (req, h) => {
    try {
      console.log('get_required_keys', 'middleware')
      const payload = getPayloadUtil(req)

      if (await rulesUtil.allowBypassSignature(payload.transaction)) {
        console.log('=> bypass writer signature')
        const { data } = await axios.post(
          `${eosConfig.apiEndpoint}/v1/chain/get_required_keys`,
          JSON.stringify(payload)
        )

        return data
      }

      rulesUtil.validateTransction(payload.transaction)
      const { data } = await axios.post(
        `${eosConfig.apiEndpoint}/v1/chain/get_required_keys`,
        JSON.stringify({
          ...payload,
          available_keys: [eosConfig.writer.pubKey, ...payload.available_keys]
        })
      )

      return {
        ...data,
        required_keys: data.required_keys.filter(
          (item) => item !== eosConfig.writer.pubKey
        )
      }
    } catch (error) {
      const standardError = errorUtil.getStandardError(error)

      return h.response(standardError).code(standardError.code)
    }
  }
}
