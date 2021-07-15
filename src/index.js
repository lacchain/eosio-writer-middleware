const Hapi = require('@hapi/hapi')
const routes = require('./routes')
const { serverConfig } = require('./config')


const init = async () => {
  const server = Hapi.server({
    port: serverConfig.port,
    host: serverConfig.host,
    routes: {
      cors: { origin: ['*'] }
    }
  })
  server.route(routes)
  await server.start()

  console.log(`🚀 Server ready at ${server.info.uri}`)
  server.table().forEach((route) => console.log(`${route.method}\t${route.path}`))
}

init()
