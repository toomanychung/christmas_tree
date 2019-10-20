const mongoose = require('mongoose');

const { Schema } = mongoose;

module.exports = new Schema({
  _id: Schema.Types.ObjectId,
  type: String,
  content: String,
  count: Number
});
