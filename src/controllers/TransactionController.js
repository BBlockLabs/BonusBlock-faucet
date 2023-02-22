export default class TransactionController {
  /**
   * @param {Checker} checker
   * @param {TransactionSender} transactionSender
   */
  constructor(checker, transactionSender) {
    this.checker = checker;
    this.transactionSender = transactionSender;
  }

  /**
   * @param  {IncomingMessage}
   * @param  {ServerResponse}
   * @return {Promise<void>}
   */
  async sendTransaction(req, res) {
    const { address } = req.params;

    if (!address) {
      res.send({ result: 'address is required' });

      return;
    }

    if (!address.startsWith(process.env.SENDER_PREFIX)) {
      res.send({ result: `Address [${address}] is not supported.` });
      return;
    }

    try {
      const googleCaptchaResponse = await this.checker.checkRecaptcha(req);

      if (
        googleCaptchaResponse == null
        || !googleCaptchaResponse.success
        || googleCaptchaResponse.score < 0.7
      ) {
        console.error(googleCaptchaResponse);
        res.send({ result: 'Recaptcha check failed' });

        return;
      }

      if (!await this.checker.checkAddress(address) || !await this.checker.checkIp(req.ip)) {
        res.send({ result: 'Too many requests for address' });

        return;
      }

      this.checker.update(req.ip);

      const transactionResponse = await this.transactionSender.sendTransaction(address);

      console.info('sent tokens to:', address);

      this.checker.update(address);

      res.send({ result: transactionResponse });
    } catch (err) {
      console.error(err);
      res.send({ result: 'Failed, Please contact to admin.' });
    }
  }
}
