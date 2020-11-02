const axios = require('axios').default

const { eosConfig } = require('../config')
const { errorUtil } = require('../utils')

module.exports = {
  method: 'POST',
  path: '/v1/chain/get_accounts_by_authorizers',
  handler: async (req, h) => {
    try {
      console.log('get_accounts_by_authorizers', 'middleware')
      let payload = req.payload || {}

      if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
        payload = {}
        Object.keys(req.payload).forEach((element) => {
          payload = { ...payload, ...JSON.parse(element) }
        })
      }

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
