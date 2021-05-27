const axios = require('axios').default

const { eosConfig } = require('../config')
const { errorUtil, getPayloadUtil } = require('../utils')

module.exports = {
  method: ['GET', 'POST'],
  path: '/v1/chain/get_accounts_by_authorizers',
  handler: async (req, h) => {
    try {
      console.log('get_accounts_by_authorizers', 'middleware')
      const payload = getPayloadUtil(req) || {}
      const { data } = await axios.post(
        `${eosConfig.apiEndpoint}/v1/chain/get_accounts_by_authorizers`,
        payload
      )

      return data
    } catch (error) {
      const standardError = errorUtil.getStandardError(error)

      return h.response(standardError).code(standardError.code)
    }
  }
}
