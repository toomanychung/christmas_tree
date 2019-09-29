const mongoose = require('mongoose');

const { Schema } = mongoose;

module.exports = new Schema({
  _id: Schema.Types.ObjectId,
  name: Schema.Types.String,
  value: Schema.Types.String,
  price: Schema.Types.Number,
  date: [Schema.Types.String]
});
