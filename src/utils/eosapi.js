const EosApi = require('eosjs-api')
const { eosConfig } = require('../config')

const eosApi = EosApi({
  httpEndpoint: eosConfig.apiEndpoint,
  verbose: false,
  fetchConfiguration: {}
})

module.exports = eosApi
