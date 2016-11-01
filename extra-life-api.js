// TeamID = 31783
// ParticipantID = 233009

const extraLife = require('extra-life-api');
const fs = require('fs');
const winston = require('winston');
const dgram = require('dgram');

var logger = new (winston.Logger)({
  transports: [
    new winston.transports.File(
      {
        level: 'info',
        colorize: false,
        timestamp: true,
        json: false,
        filename: 'logs/log.log',
        handleExceptions: true
      })
  ]
});

const userId = process.argv[2];

let donations = [];
try {
  donations = JSON.parse(fs.readFileSync(`data/${userId}.json`, 'utf8'));
} catch(err) {
  if (err.errno !== -4058) {
    logger.error(err);
  }
}

const client = dgram.createSocket('udp4', arg => logger.debug('socket created', arg));
const newDonations = [];

extraLife.getRecentDonations( userId, data => {
  let allNew = false;
  for (i in data) {
    for (n in donations) {
      if (data[i].createdOn === donations[n].createdOn) {
        allNew = true;
        break;
      }
    }
    if (allNew) {
      break;
    } else {
      donations.push(data[i]);
      newDonations.push(JSON.stringify(data[i]));
      logger.debug(`new donation ${JSON.stringify(data[i])}`);
    }
  }
  let size = newDonations.length;
  newDonations.forEach(donation => {
    client.send(donation, 3333, '127.0.0.1', err => {
      if (err) {
        logger.error(err);
      }
      size--;
      if (!size) {
        client.close();
        logger.debug('all new donations sent');
      }
    });
  })
  fs.writeFileSync(`data/${userId}.json`, JSON.stringify(donations));
});
