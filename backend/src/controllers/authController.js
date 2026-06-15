const jwt = require('jsonwebtoken')
const { sendCode, verifyCode } = require('../utils/sms')
const { getUserByPhone, createUser, getPatientByPhone, createPatient } = require('../utils/fileStore')

exports.sendCode = async (req, res) => {
  try {
    const { phone } = req.body
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ message: '请输入正确的手机号码' })
    }
    const result = sendCode(phone)
    res.json(result)
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
}

exports.verifyCode = async (req, res) => {
  try {
    const { phone, code, name } = req.body
    if (!phone || !code) {
      return res.status(400).json({ message: '请输入手机号和验证码' })
    }
    const result = verifyCode(phone, code)
    if (!result.success) {
      return res.json(result)
    }
    let user = getUserByPhone(phone)
    let patient = getPatientByPhone(phone)
    
    if (!user) {
      user = createUser({ phone, name: name || '用户' })
    }
    if (!patient) {
      patient = createPatient({ phone, name: name || '用户' })
    }
    
    const token = jwt.sign(
      { userId: user._id, phone, role: user.role, patientId: patient._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )
    
    res.json({ success: true, message: '登录成功', token, user: { id: user._id, phone, name: user.name, role: user.role, patientId: patient._id } })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ message: '服务器错误' })
  }
}

exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body
    
    if (username === 'admin' && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign(
        { userId: 'admin', username, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      )
      res.json({ success: true, message: '登录成功', token, user: { username, role: 'admin' } })
    } else {
      res.json({ success: false, message: '用户名或密码错误' })
    }
  } catch (err) {
    console.error('Admin login error:', err)
    res.status(500).json({ message: '服务器错误' })
  }
}