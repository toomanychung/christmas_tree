const { product } = require('../model/main');

module.exports = {
  async getProductDetails() {
    try {
      const result = await product.findOne({}, { _id: 0, create_time: 0, update_time: 0 }, (err, res) => res);
      return result;
    } catch (err) {
      console.log(err);
      return [];
    }
  }
};
