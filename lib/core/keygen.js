

import fs from 'fs-extra'
import path from 'path'
import crypto from 'node:crypto'

export async function generateKeyPair(name = 'agent') {
  const keyDir = path.resolve(process.cwd(), '.dokugent/keys')
  await fs.ensureDir(keyDir)

  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  })

  const pubPath = path.join(keyDir, `${name}.public.pem`)
  const privPath = path.join(keyDir, `${name}.private.pem`)

  await fs.writeFile(pubPath, publicKey)
  await fs.writeFile(privPath, privateKey)

  console.log(`🔐 Key pair generated:`)
  console.log(`- Public: ${pubPath}`)
  console.log(`- Private: ${privPath}`)
}