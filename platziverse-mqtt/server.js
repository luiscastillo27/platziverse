'use stric'

const debug = require('debug')('platziverse:mqtt')
const mosca = require('mosca')
const redis = require('redis')
const chalk = require('chalk')
const db = require('platziverse-db')

const backend = {
  type: 'redis',
  redis,
  return_buffers: true
}

const config = {
  database: process.env.DB_NAME || 'platziverse',
  username: process.env.DB_USER || 'luis',
  password: process.env.DB_PASS || 'jimyluis',
  host: process.env.DB_HOST || 'localhost',
  dialect: 'postgres',
  logging: s => debug(s)
}

const settings = {
  port: 1883,
  backend
}

const server = new mosca.Server(settings)

let Agent, Metric

server.on('clientConnected', client => {
  debug(`Client connected: ${client.id}`)
})

server.on('clientDisconnected', client => {
  debug(`Client disconnected: ${client.id}`)
})

server.on('published', (packet, client) => {
  debug(`Received: ${packet.topic}`)
  debug(`Payload: ${packet.payload}`)
})

server.on('ready', async function () {
  const services = await db(config).catch(handleFatalError)
  Agent = services.Agent
  Metric = services.Metric
  console.log(`${chalk.green('[platziverse-mqtt]')} server is running`)
})

server.on('error', handleFatalError)
process.on('uncaughtException', handleFatalError)
process.on('unhandledRejection', handleFatalError)

function handleFatalError (err) {
  console.error(`${chalk.red('[Fatal error]')} ${err.message}`)
}
