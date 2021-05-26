const axios = require('axios').default

const { eosConfig } = require('../config')
const { errorUtil, getPayloadUtil } = require('../utils')

module.exports = {
  method: ['GET', 'POST'],
  path: '/{any*}',
  handler: async (req, h) => {
    try {
      console.log(req.path, 'proxy')
      const payload = getPayloadUtil(req) || {}
      const { data } = await axios.post(
        `${eosConfig.apiEndpoint}${req.path}`,
        payload
      )

      return data
    } catch (error) {
      const standardError = errorUtil.getStandardError(error)

      return h.response(standardError).code(standardError.code)
    }
  }
}
