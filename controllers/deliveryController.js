const moment = require('moment');

const { delivery } = require('../model/main');

module.exports = {
  async getDeliveryDetails() {
    try {
      const result = await delivery.find({}, { _id: 0 }, { sort: { value: 1 } }, (err, res) => res);
      result.forEach((item) => {
        item.date.sort();
      });
      return result;
    } catch (err) {
      console.log(err);
      return [];
    }
  },
  async editDelivery(dateList) {
    var ops = [];
    try {
      dateList.forEach((item) => {
        item.date.forEach((day) => {
          const isDateValid = moment(day, 'YYYY-MM-DD', true).isValid();
          if (!isDateValid) {
            throw new Error('Date Not valid');
          }
        });
        ops.push(
          {
            updateOne: {
              filter: { value: item.value },
              update: {
                $set: {
                  date: item.date,
                  price: item.price
                },
              },
              upsert: true,
            }
          }
        );
      });
      const result = await delivery.bulkWrite(ops, { ordered: false, bypassDocumentValidation: false })
        .then(res => res.modifiedCount);
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }
};
