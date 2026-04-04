import algosdk from 'algosdk'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const walletFile = join(__dirname, '.wallet.json')

let account

if (process.env.SERVER_WALLET_MNEMONIC) {
  account = algosdk.mnemonicToSecretKey(process.env.SERVER_WALLET_MNEMONIC)
} else if (fs.existsSync(walletFile)) {
  // Reuse persisted wallet so the clawback address stays the same across restarts
  const { mnemonic } = JSON.parse(fs.readFileSync(walletFile, 'utf8'))
  account = algosdk.mnemonicToSecretKey(mnemonic)
} else {
  // First run — generate and persist
  account = algosdk.generateAccount()
  const mnemonic = algosdk.secretKeyToMnemonic(account.sk)
  fs.writeFileSync(walletFile, JSON.stringify({ mnemonic }), 'utf8')
  console.log('Generated new marketplace wallet — saved to server/.wallet.json')
}

console.log(`\n Marketplace clawback wallet: ${account.addr}`)
console.log(' Fund this address with testnet ALGO: https://bank.testnet.algorand.network\n')

export const clawbackAddress = account.addr.toString()
export const clawbackSk = account.sk
