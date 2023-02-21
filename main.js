import express from 'express';
import * as path from 'path'
import dotenv from 'dotenv'
import { stringToPath } from '@cosmjs/crypto'
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { SigningStargateClient } from '@cosmjs/stargate';
import Checker from './checker';

dotenv.config();

const app = express()
const checker = new Checker()

app.use(express.json()) 

app.get('/', (req, res) => {
  res.sendFile(path.resolve('./assets/index.html'));
})

app.get('/logo.svg', (req, res) => {
  res.sendFile(path.resolve('./assets/logo.svg'));
})

app.post('/send/:address', async (req, res) => {
  const {address} = req.params;

  if (!address) {
    res.send({ result: 'address is required' });

    return;
  }

  if (!address.startsWith(process.env.SENDER_PREFIX)) {
    res.send({ result: `Address [${address}] is not supported.` })
    return;
  }

  try {
    const googleCaptchaResponse = await checker.checkRecaptcha(req);

    if (googleCaptchaResponse == null || !googleCaptchaResponse.success || googleCaptchaResponse.score < .7) {
      console.error(googleCaptchaResponse);  
      res.send({ result: 'Recaptcha check failed' })

      return;
    }

    if (!await checker.checkAddress(address) && await checker.checkIp(req.ip) ) {
      res.send({ result: 'Too many requests for address' })

      return;
    }

    checker.update(req.ip)

    const transactionResponse = await sendTx(address);

    console.log('sent tokens to:', address)
    
    checker.update(address)
    
    res.send({ result: transactionResponse })
  } catch (err) {
    console.error(err);
    res.send({ result: 'Failed, Please contact to admin.' })
  }
})

async function sendTx(recipient) {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(
    process.env.SENDER_MNEMONIC,
    {
      hdPaths: [stringToPath("m/44'/118'/0'/0/0")],
      prefix: process.env.SENDER_PREFIX,
    }
  );
  const [senderAccount] = await wallet.getAccounts();

  const client = await SigningStargateClient.connectWithSigner(
    process.env.RPC_ENDPOINT,
    wallet
  );

  const amount = {
    denom: process.env.TX_DENOM,
    amount: process.env.TX_AMMOUNT,
  };
  const fee = {
    amount: [
      {
        amount: process.env.FEE_AMMOUNT,
        denom: process.env.FEE_DENOM
      }
    ],
    gas: process.env.FEE_GAS
  };

  return client.sendTokens(senderAccount.address, recipient, [amount], fee);
}

app.listen(process.env.PORT, () => {
  console.log(`Faucet app listening on port ${process.env.PORT}`)
})
