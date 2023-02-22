import { Level } from 'level';
import https from 'https';

export default class Checker {
  constructor(
    dbPath,
    ipLimit,
    addressLimit,
    recaptchaSecret,
  ) {
    this.db = new Level(dbPath, { valueEncoding: 'json' });
    this.ipLimit = ipLimit;
    this.addressLimit = addressLimit;
    this.recaptchaSecret = recaptchaSecret;
  }

  async check(key, limit) {
    return new Promise((resolve) => {
      this.db.get(key, (err, value) => {
        if (!err) {
          resolve(value.length < limit);
          return;
        }

        if (err.code === 'LEVEL_NOT_FOUND') {
          resolve(true);
          return;
        }

        console.error(err);
        resolve(false);
      });
    });
  }

  async checkIp(ip) {
    return this.check(ip, this.ipLimit);
  }

  async checkAddress(address) {
    return this.check(address, this.addressLimit);
  }

  async update(key) {
    this.db.get(key, (err, history) => {
      if (err) {
        this.db.put(key, [Date.now()]);
      } else {
        history.push(Date.now());
        this.db.put(key, history);
      }
    });
  }

  async checkRecaptcha(request) {
    return (new Promise((resolve) => {
      https.get(
        `https://www.google.com/recaptcha/api/siteverify?secret=${this.recaptchaSecret}&response=${request.body.recaptcha}&remoteip=${request.ip}`,
        (res) => {
          let rawData = '';

          res.on('data', (chunk) => { rawData += chunk; });

          res.on('end', () => {
            try {
              resolve(JSON.parse(rawData));
            } catch (e) {
              console.error(e.message);
            }
          });
        },
      );
    }));
  }
}
