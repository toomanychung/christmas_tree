const { setting } = require('../model/main');

module.exports = {
  async getAnnouncementSetting() {
    try {
      const result = await setting.findOne({ type: 'announcement' }, { _id: 0 }, (err, res) => res);
      return result;
    } catch (err) {
      console.log(err);
      return null;
    }
  },
  async changeAnnouncementSetting(text) {
    const response = await setting.updateOne({ type: 'announcement' }, { content: text }, (err, res) => res);
    return response.ok;
  }
};
