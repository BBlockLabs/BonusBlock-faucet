import { stringToPath } from '@cosmjs/crypto';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { SigningStargateClient } from '@cosmjs/stargate';

export default class TransactionSender {
  /**
   * @param {String} mnemonic
   * @param {String} senderPrefix
   * @param {String} rpcEndpoint
   * @param {String} transactionDenom
   * @param {Number} transactionAmount
   * @param {String} feeDenom
   * @param {Number} feeAmount
   * @param {Number} feeGas
   */
  constructor(
    mnemonic,
    senderPrefix,
    rpcEndpoint,
    transactionDenom,
    transactionAmount,
    feeDenom,
    feeAmount,
    feeGas,
  ) {
    this.transactionDenom = transactionDenom;
    this.transactionAmount = transactionAmount;
    this.feeDenom = feeDenom;
    this.feeAmount = feeAmount;
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

  /**
   * @param  {String} recipient
   * @return {Promise<any>}
   */
  async sendTransaction(recipient) {
    await this.init;

    const amount = {
      denom: this.transactionDenom,
      amount: this.transactionAmount,
    };

    const fee = {
      amount: [
        {
          denom: this.feeDenom,
          amount: this.feeAmount,
        },
      ],
      gas: this.feeGas,
    };

    return this.client.sendTokens(this.senderAddress, recipient, [amount], fee);
  }
}
