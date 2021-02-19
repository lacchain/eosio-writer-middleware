const getAccountRoute = require('./get-account.route')
const getAccountsByAuthorizersRoute = require('./get-accounts-by-authorizers.route')
const getInfoRoute = require('./get-info.route')
const getRequiredKeysRoute = require('./get-required-keys.route')
const healthzRoute = require('./healthz.route')
const proxyRoute = require('./proxy.route')
const pushTransactionRoute = require('./push_transaction.route')
const sendTransactionRoute = require('./send_transaction.route')

module.exports = [
  getAccountRoute,
  getAccountsByAuthorizersRoute,
  getInfoRoute,
  getRequiredKeysRoute,
  healthzRoute,
  proxyRoute,
  pushTransactionRoute,
  sendTransactionRoute
]
