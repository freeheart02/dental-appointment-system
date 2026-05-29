const codes = {}

exports.sendCode = (phone) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  codes[phone] = {
    code,
    expiresAt: Date.now() + 5 * 60 * 1000
  }
  console.log(`发送验证码到 ${phone}: ${code}`)
  return { success: true, message: '验证码已发送' }
}

exports.verifyCode = (phone, code) => {
  const stored = codes[phone]
  if (!stored) {
    return { success: false, message: '请先获取验证码' }
  }
  if (Date.now() > stored.expiresAt) {
    delete codes[phone]
    return { success: false, message: '验证码已过期' }
  }
  if (stored.code !== code) {
    return { success: false, message: '验证码错误' }
  }
  delete codes[phone]
  return { success: true, message: '验证成功' }
}
