import { stringToPath } from '@cosmjs/crypto';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { SigningStargateClient } from '@cosmjs/stargate';

export default class TransactionSender {
  constructor(
    mnemonic,
    senderPrefix,
    rpcEndpoint,
    transactionDenom,
    transactionAmmount,
    feeDenom,
    feeAmmount,
    feeGas,
  ) {
    this.transactionDenom = transactionDenom;
    this.transactionAmmount = transactionAmmount;
    this.feeDenom = feeDenom;
    this.feeAmmount = feeAmmount;
    this.feeGas = feeGas;

    this.init = (async () => {
      this.wallet = await DirectSecp256k1HdWallet.fromMnemonic(
        mnemonic,
        {
          hdPaths: [stringToPath("m/44'/118'/0'/0/0")],
          prefix: senderPrefix,
        },
      );

      this.client = await SigningStargateClient.connectWithSigner(
        rpcEndpoint,
        this.wallet,
      );

      const [senderAccount] = await this.wallet.getAccounts();

      this.senderAddress = senderAccount.address;
    })();
  }

  async sendTransaction(recipient) {
    await this.init;

    const amount = {
      denom: this.transactionDenom,
      amount: this.transactionAmmount,
    };

    const fee = {
      amount: [
        {
          denom: this.feeDenom,
          amount: this.feeAmmount,
        },
      ],
      gas: this.feeGas,
    };

    return this.client.sendTokens(this.senderAddress, recipient, [amount], fee);
  }
}
