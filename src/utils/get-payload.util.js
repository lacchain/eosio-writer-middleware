module.exports = (req) => {
  if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
    const payload = {}
    Object.keys(req.payload).forEach((element) => {
      payload = { ...payload, ...JSON.parse(element) }
    })

    return payload
  }

  if (typeof req.payload === 'string') {
    return JSON.parse(req.payload)
  }

  return req.payload
}
