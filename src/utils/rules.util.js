const { eosConfig } = require('../config')
const { ValidationRuleError } = require('./error.util')
const eosApi = require('./eosapi')

const validateTransction = (transaction) => {
  // TODO: add new validation rules

  // at least 2 actions
  if (transaction.actions.length < 2) {
    throw new ValidationRuleError({
      code: 500,
      message: 'Internal Service Error',
      error: {
        code: 515193182,
        name: 'invalid_number_of_actions_exception',
        what: 'You must provide at least two actions',
        details: [
          {
            message: 'Writer action "run" an another one are required'
          }
        ]
      }
    })
  }

  // first action must be from writter account with run action
  const firstAction = transaction.actions[0]
  if (firstAction.account !== 'writer' || firstAction.name !== 'run') {
    throw new ValidationRuleError({
      code: 500,
      message: 'Internal Service Error',
      error: {
        code: 515193183,
        name: 'invalid_writer_action_exception',
        what:
          'Writer action "run" must be provided at beginning of the transaction',
        details: [
          {
            message:
              'Writer action "run" is required and must be the first action in the transaction'
          }
        ]
      }
    })
  }

  // first authorization must be the accountName set for this instance
  const firstAuthorization = firstAction.authorization[0]
  if (firstAuthorization.actor !== eosConfig.writer.accountName) {
    throw new ValidationRuleError({
      code: 500,
      message: 'Internal Service Error',
      error: {
        code: 515193184,
        name: 'invalid_actor_action_exception',
        what: 'Invalid actor for "run" action',
        details: [
          {
            message: `Actor for "run" action must be ${eosConfig.writer.accountName}`
          }
        ]
      }
    })
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

module.exports = {
  validateTransction,
  allowBypassSignature
}
