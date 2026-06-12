const express = require('express')
const path = require('path')
const router = express.Router()
const fileStore = require('../utils/fileStore')

// 获取备份列表
router.get('/list', (req, res) => {
  try {
    const backups = fileStore.getBackupList()
    res.json({ success: true, backups })
  } catch (err) {
    res.status(500).json({ success: false, message: '获取备份列表失败' })
  }
})

// 创建手动备份
router.post('/create', (req, res) => {
  try {
    const result = fileStore.createBackup()
    res.json(result)
  } catch (err) {
    res.status(500).json({ success: false, message: '创建备份失败' })
  }
})

// 下载备份文件
router.get('/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename
    // 安全检查：只允许下载 backup_ 开头的 .json 文件
    if (!filename || !filename.startsWith('backup_') || !filename.endsWith('.json')) {
      return res.status(400).json({ success: false, message: '无效的文件名' })
    }
    const filePath = path.join(fileStore.BACKUP_DIR, filename)
    res.download(filePath, filename)
  } catch (err) {
    res.status(500).json({ success: false, message: '下载失败' })
  }
})

// 恢复备份
router.post('/restore/:filename', (req, res) => {
  try {
    const filename = req.params.filename
    // 安全检查
    if (!filename || !filename.startsWith('backup_') || !filename.endsWith('.json')) {
      return res.status(400).json({ success: false, message: '无效的文件名' })
    }
    const result = fileStore.restoreBackup(filename)
    res.json(result)
  } catch (err) {
    res.status(500).json({ success: false, message: '恢复备份失败' })
  }
})

// 删除备份
router.delete('/:filename', (req, res) => {
  try {
    const filename = req.params.filename
    // 安全检查
    if (!filename || !filename.startsWith('backup_') || !filename.endsWith('.json')) {
      return res.status(400).json({ success: false, message: '无效的文件名' })
    }
    const fs = require('fs')
    const filePath = path.join(fileStore.BACKUP_DIR, filename)
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: '备份文件不存在' })
    }
    fs.unlinkSync(filePath)
    res.json({ success: true, message: '删除成功' })
  } catch (err) {
    res.status(500).json({ success: false, message: '删除失败' })
  }
})

module.exports = router
