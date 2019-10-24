/* eslint-disable no-param-reassign */
/* eslint-disable no-lonely-if */
/* eslint-disable no-underscore-dangle */
const XlsxTemplate = require('xlsx-template');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
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

function formatStatus(status) {
  switch (+status) {
    case -3:
      return 'Refunded';
    case -2:
      return 'Cancelled';
    case -1:
      return 'Waiting';
    case 0:
      return 'Pending';
    case 1:
      return 'Deliverying';
    case 2:
      return 'Complete';
    default:
      return status;
  }
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
          telephone2: orderObj.cInfo.phone2,
          order_id: orderObj._id.toString(),
          invoice_no: orderObj.invoice_no,
          remark: orderObj.cInfo.remark,
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

function genReport(rawData) {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(__dirname, '../', 'templates', 'report_template.xlsx'), async (err, data) => {
      if (err) {
        reject(err);
      } else {
        const template = new XlsxTemplate(data);
        const sheetNumber = 1;
        rawData.forEach((item, index) => {
          rawData[index].status2 = formatStatus(item.status);
          rawData[index].newPrice = item.total_price / 100;
          rawData[index].id2 = item.id.slice(item.id.length - 5);
          rawData[index].create_time2 = moment(item.create_time).format('YYYY-MM-DD');
          rawData[index].delivery_method = (item.cInfo.delivery_method === 0 ? 'Self-Pickup' : 'Standard Delivery');
          rawData[index].payment_method = (item.payment_method === 0 ? 'Credit Card' : 'Bank-in');
        });
        const values = { rawData };
        template.substitute(sheetNumber, values);
        const result = template.generate({ type: 'nodebuffer' });
        resolve(result);
      }
    });
  });
}

module.exports = {
  xlstTesting() {
    return genReport();
  },
  genDeliveryNote(orderId) {
    return read(orderId).then(res => res);
  },
  genOrderReport(data) {
    return genReport(data);
  }
};
