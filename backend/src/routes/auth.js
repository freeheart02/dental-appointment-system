const express = require('express')
const router = express.Router()
const { sendCode, verifyCode, adminLogin } = require('../controllers/authController')

router.post('/send-code', sendCode)
router.post('/verify-code', verifyCode)
router.post('/admin/login', adminLogin)

module.exports = router
