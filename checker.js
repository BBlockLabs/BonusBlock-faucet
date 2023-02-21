import { Level } from 'level';
import https from 'https';

const WINDOW = 86400 * 1000 // milliseconds in a day

export default class FrequencyChecker {
  constructor() {
    this.db = new Level(process.env.DB_PATH, { valueEncoding: 'json' });
  }

  async check(key, limit) {
    return new Promise((resolve) => {
      this.db.get(key, function (err, value) {
        resolve(err || value && value.filter(x => Date.now() - x < WINDOW).length < limit)
      });
    })
  }

  async checkIp(ip) {
    return this.check(ip, process.env.LIMIT_PER_IP)
  }
  
  async checkAddress(address) {
    return this.check(address, process.env.LIMIT_PER_ADDRESS)
  }

  async update(key) {
    this.db.get(key, (err, history) => {
      if (err) {
        this.db.put(key, [Date.now()])
      } else {
        history.push(Date.now())
        this.db.put(key, history)
      }
    });
  }

  async checkRecaptcha(request) {
    return (new Promise(resolve => {
      https.get(
        `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${request.body.recaptcha}&remoteip=${request.ip}`, 
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
        }
      );
    }));
  }
}
