import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'
import { getCloudflareContext } from '@opennextjs/cloudflare'

const clients = new WeakMap<object, PrismaClient>()

function getClient(): PrismaClient {
  const env = getCloudflareContext().env as unknown as { DB: object }
  const db = env.DB
  let client = clients.get(db)
  if (!client) {
    client = new PrismaClient({ adapter: new PrismaD1(env.DB as ConstructorParameters<typeof PrismaD1>[0]) })
    clients.set(db, client)
  }
  return client
}

export const prisma = new Proxy({} as PrismaClient, {
  get: (_, prop) => Reflect.get(getClient(), prop),
})

export default prisma
