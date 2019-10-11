const nodemailer = require('nodemailer');
const mg = require('nodemailer-mailgun-transport');
// eslint-disable-next-line no-unused-vars
const {
  order
} = require('../model/main');

const auth = {
  auth: {
    api_key: process.env.MAILGUN_API,
    domain: process.env.MAILGUN_DOMAIN,
  },
};

const logo = `${process.env.DOMIN_TEST}/img/logo.png`;
const nodemailerMailgun = nodemailer.createTransport(mg(auth));


module.exports = {
  async sendTestEmail() {
    nodemailerMailgun.sendMail({
      from: 'pk@example.com',
      to: 'toomanychung@gmail.com', // An array if you have multiple recipients.
      subject: 'Hey you, awesome!',
      template: {
        name: 'views/mail/welcome.hbs',
        engine: 'handlebars',
        context: { id: '4nrejfdlmgfd' }
      }

    }, (err, info) => {
      if (err) {
        console.log(`Error: ${err}`);
      } else {
        console.log(`Response: ${info}`);
      }
    });
  },
  async sendBankInReminder(orderId) {
    order.findOne({ _id: orderId }, (err, res) => {
      //
      nodemailerMailgun.sendMail({
        from: 'noreply@sophieshk.com',
        to: res.cInfo.email, // An array if you have multiple recipients.
        subject: '<Reminder> Please Settle the bank-in payment',
        template: {
          name: 'views/mail/bank-in-reminder.hbs',
          engine: 'handlebars',
          context: { order: res, logo }
        }
      }, (err2, info) => {
        if (err2) {
          console.log(`Error: ${err2}`);
        } else {
          console.log(`Response: ${info}`);
        }
      });
      //
    });
  },
  async sendOrderConfirmationReminder(orderId) {
    order.findOne({ _id: orderId }, (err, res) => {
      //
      nodemailerMailgun.sendMail({
        from: 'noreply@sophieshk.com',
        to: res.cInfo.email, // An array if you have multiple recipients.
        subject: 'Thank you for your order!',
        template: {
          name: 'views/mail/order-confirmation.hbs',
          engine: 'handlebars',
          context: { order: res, logo }
        }
      }, (err2, info) => {
        if (err2) {
          console.log(`Error: ${err2}`);
        } else {
          console.log(`Response: ${info}`);
        }
      });
      //
    });
  },
  async testEmailRender() {
    const result = order.findOne({ _id: '5d9f65cd9c290966fb55425e' }, (err, res) => res);
    return result;
  }
};
