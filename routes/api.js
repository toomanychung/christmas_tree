const { Router } = require('express');
const productController = require('../controllers/productController');
const deliveryController = require('../controllers/deliveryController');
const couponController = require('../controllers/couponController');
const mailController = require('../controllers/mailController');
const xlsxController = require('../controllers/xlsxController');

const router = Router();

/* Test */
router.get('/product', async (req, res) => {
  const result = await productController.getProductDetails();
  res.json(result);
});

router.get('/delivery', async (req, res) => {
  const result = await deliveryController.getDeliveryDetails();
  res.json(result);
});

/* Coupon */
router.post('/coupon', async (req, res) => {
  const { code } = req.query;
  if (req.query.code) {
    const result = await couponController.applyCoupon(code);
    if (result) {
      res.status(200).json({
        msg: 'Coupon applied',
        code: result.code,
        discount: result.discount
      });
    } else {
      res.status(200).json({
        msg: 'Code invalid.'
      });
    }
  } else {
    res.status(400).json({
      msg: 'Empty code.'
    });
  }
});

/* Test */
router.get('/test-mail', async (req, res) => {
  mailController.sendBankInReminder('5d9f65cd9c290966fb55425e');
  const order = await mailController.testEmailRender();
  const logo = `${process.env.DOMIN_TEST}/img/logo.png`;
  res.render('mail/order-confirmation', { layout: false, order, logo });
});

router.get('/test-xlsx', async (req, res) => {
  const data = await xlsxController.xlstTesting();
  // console.log('get from controller', data);
  // res.json(data);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats');
  res.setHeader('Content-Disposition', 'attachment; filename=894594759.xlsx');
  res.end(data, 'binary');
});

module.exports = router;
