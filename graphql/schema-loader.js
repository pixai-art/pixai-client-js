const dotenv = require('dotenv')
const fs = require('fs/promises')
const { buildSchema } = require('graphql')
const path = require('path')

dotenv.config()

const getTypeDefs = async schemaPath => {
  const files = await fs.readdir(schemaPath)
  const typeDefs = await Promise.all(
    files
      .filter(file => /\.graphql$/.test(file))
      .map(async file => {
        const p = path.resolve(schemaPath, file)
        console.log('Loading schema from', p)
        const data = await fs.readFile(p)
        return data.toString()
      }),
  )
  return typeDefs
}

const loadSchema = async (_, config) => {
  const schemaPath = process.env.GRAPHQL_SCHEMA_PATH

  if (!schemaPath) {
    console.log(
      `
      -----------------------------
      GRAPHQL_SCHEMA_PATH is not defined
      -----------------------------
      ${'\n\n\n'}
    `,
    )
    return
  }

  const typeDefs = await getTypeDefs(schemaPath)

  return buildSchema(typeDefs.join('\n'), config)
}

module.exports = loadSchema
