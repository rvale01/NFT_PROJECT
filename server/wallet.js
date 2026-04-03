import algosdk from 'algosdk'

// Load wallet from mnemonic env var, or generate a new one on first run.
// In production, always set SERVER_WALLET_MNEMONIC so the address is stable.
let account

if (process.env.SERVER_WALLET_MNEMONIC) {
  account = algosdk.mnemonicToSecretKey(process.env.SERVER_WALLET_MNEMONIC)
} else {
  account = algosdk.generateAccount()
  console.warn('⚠️  No SERVER_WALLET_MNEMONIC set — generated a temporary wallet.')
  console.warn('   Address:', account.addr)
  console.warn('   Mnemonic:', algosdk.secretKeyToMnemonic(account.sk))
  console.warn('   Set SERVER_WALLET_MNEMONIC in .env to make this permanent.')
}

export const clawbackAddress = account.addr.toString()
export const clawbackSk = account.sk
