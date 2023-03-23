import express from 'express';
import * as path from 'path';
import dotenv from 'dotenv';
import Checker from './services/Checker';
import TransactionSender from './services/TransactionSender';
import TransactionController from './controllers/TransactionController';

dotenv.config();

const app = express();

const checker = new Checker(
  process.env.DB_PATH,
  process.env.LIMIT_PER_IP,
  process.env.LIMIT_PER_ADDRESS,
  process.env.RECAPTCHA_SECRET,
);
const transactionSender = new TransactionSender(
  process.env.SENDER_MNEMONIC,
  process.env.SENDER_PREFIX,
  process.env.RPC_ENDPOINT,
  process.env.TX_DENOM,
  process.env.TX_AMOUNT,
  process.env.FEE_DENOM,
  process.env.FEE_AMOUNT,
  process.env.FEE_GAS,
);

const transactionController = new TransactionController(
  checker,
  transactionSender,
);

const staticFiles = {
  '/': './assets/index.html',
  '/favicon.ico': './assets/static/favicon.ico',
};

app.use(express.json());

app.use('/static', express.static('./assets/static'));

Object.keys(staticFiles).forEach((url) => {
  app.get(url, (req, res) => {
    res.sendFile(path.resolve(staticFiles[url]));
  });
});

app.post('/send/:address', (req, res) => transactionController.sendTransaction(req, res));

export default app;
