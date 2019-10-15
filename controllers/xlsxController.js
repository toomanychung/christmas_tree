/* eslint-disable no-lonely-if */
/* eslint-disable no-underscore-dangle */
const XlsxTemplate = require('xlsx-template');
const fs = require('fs');
const path = require('path');
const {
  order
} = require('../model/main');

function formatSize(pwSize) {
  const result = pwSize.replace(/\D/g, '');
  return result;
}

function formatColor(pwSize) {
  if (pwSize.endsWith('W')) {
    return '白色';
  }
  return '紅色';
}

function read(orderId) {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(__dirname, '../', 'templates', 'delivery_note.xlsx'), async (err, data) => {
      if (err) {
        reject(err);
      } else {
        // xlsx template here
        // eslint-disable-next-line no-shadow
        let treeIndex = 1;
        let pIndex = 1;
        let dIndex = 1;
        const orderObj = await order.findOne({ _id: orderId }, null, (_err, res) => res);
        if (!orderObj) {
          reject(new Error('order Not found'));
          return;
        }
        const template = new XlsxTemplate(data);
        const sheetNumber = 1;
        const values = {
          name: orderObj.cInfo.name,
          order_date: orderObj.create_time,
          delivery_date: orderObj.cInfo.delivery_date,
          address_eng: orderObj.cInfo.address,
          address_chi: orderObj.cInfo.address_chi || orderObj.cInfo.address,
          telephone: orderObj.cInfo.phone,
          order_id: orderObj._id.toString(),
          remark: orderObj.remark,
        };
        orderObj.item.forEach((itemObj) => {
          if (itemObj.product !== 'pw') {
            const obj = {
              stand: itemObj.stand,
              product: itemObj.product,
              size: itemObj.size,
              qty: 1
            };
            values[`tree${treeIndex}`] = obj;
            treeIndex += 1;
          } else {
            if (itemObj.size.startsWith('H')) {
              const obj = {
                color: formatColor(itemObj.size),
                size: formatSize(itemObj.size),
                qty: parseInt(itemObj.quantity, 10)
              };
              values[`p${pIndex}`] = obj;
              pIndex += 1;
            } else {
              const obj = {
                size: formatSize(itemObj.size),
                qty: parseInt(itemObj.quantity, 10)
              };
              values[`d${dIndex}`] = obj;
              dIndex += 1;
            }
          }
        });
        template.substitute(sheetNumber, values);
        const result = template.generate({ type: 'nodebuffer' });
        resolve(result);
      }
    });
  });
}

module.exports = {
  xlstTesting() {
    return read('5da5b6c51f60570ccc99c431').then(res => res);
  },
  genDeliveryNote(orderId) {
    return read(orderId).then(res => res);
  },
};
