/* eslint-disable no-underscore-dangle */
const { coupon } = require('../model/main');

module.exports = {
  async applyCoupon(code) {
    try {
      const result = await coupon.findOne({ code, valid: true }, { _id: 0 }, (err, res) => res);
      return result;
    } catch (err) {
      console.log(err);
      return '';
    }
  },
  async getCouponCode() {
    try {
      const result = await coupon.find({}, (err, res) => res);
      return result;
    } catch (err) {
      console.log(err);
      return [];
    }
  },
  async editCouponCode(codeList) {
    var ops = [];
    try {
      codeList.forEach((item) => {
        if (item.discount > 1 || item.discount < 0) {
          throw new Error('Invalid discount amount');
        }
        if (item._id) {
          ops.push(
            {
              updateOne: {
                filter: { _id: item._id },
                update: {
                  $set: {
                    code: item.code,
                    discount: item.discount,
                    valid: item.valid
                  },
                },
                upsert: true,
              }
            }
          );
        } else {
          ops.push(
            {
              insertOne: {
                document: {
                  code: item.code,
                  discount: item.discount,
                  valid: item.valid
                }
              }
            }
          );
        }
      });
      const result = await coupon.bulkWrite(ops, { ordered: false, bypassDocumentValidation: false })
        .then(res => res.modifiedCount);
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  }
};
