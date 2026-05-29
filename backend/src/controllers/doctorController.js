const { getAllDoctors, getDoctorById, createDoctor, updateDoctor, deleteDoctor } = require('../utils/fileStore')

exports.getAllDoctors = async (req, res) => {
  try {
    res.json(getAllDoctors())
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
}

exports.getDoctorById = async (req, res) => {
  try {
    const doctor = getDoctorById(req.params.id)
    if (!doctor) {
      return res.status(404).json({ message: '医生不存在' })
    }
    res.json(doctor)
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
}

exports.createDoctor = async (req, res) => {
  try {
    const { name, title, specialty, description, department, slotInterval } = req.body
    if (!name) {
      return res.status(400).json({ message: '请输入医生姓名' })
    }
    const doctor = createDoctor({ name, title, specialty, description, department, slotInterval })
    res.json({ success: true, message: '医生创建成功', doctor })
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
}

exports.updateDoctor = async (req, res) => {
  try {
    const { name, title, specialty, description, department, slotInterval } = req.body
    const doctor = updateDoctor(req.params.id, { name, title, specialty, description, department, slotInterval })
    if (!doctor) {
      return res.status(404).json({ message: '医生不存在' })
    }
    res.json({ success: true, message: '医生更新成功', doctor })
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
}

exports.deleteDoctor = async (req, res) => {
  try {
    const doctor = deleteDoctor(req.params.id)
    if (!doctor) {
      return res.status(404).json({ message: '医生不存在' })
    }
    res.json({ success: true, message: '医生删除成功' })
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
}
