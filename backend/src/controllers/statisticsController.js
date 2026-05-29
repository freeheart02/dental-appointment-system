const { getDashboardStats, getAppointments, getAllDoctors } = require('../utils/fileStore')

exports.getDashboardStats = async (req, res) => {
  try {
    const stats = getDashboardStats()
    res.json(stats)
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
}

exports.getNoShowRate = async (req, res) => {
  try {
    const appointments = getAppointments()
    const total = appointments.length
    const noShow = appointments.filter(a => a.status === 'no_show').length
    const rate = total > 0 ? (noShow / total * 100).toFixed(1) : 0
    
    res.json({ total, noShow, rate: parseFloat(rate) })
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
}

exports.getAppointmentTrend = async (req, res) => {
  try {
    const appointments = getAppointments()
    const trend = {}
    
    appointments.forEach(a => {
      const date = a.date
      if (!trend[date]) {
        trend[date] = { total: 0, completed: 0, no_show: 0 }
      }
      trend[date].total++
      if (a.status === 'completed') trend[date].completed++
      if (a.status === 'no_show') trend[date].no_show++
    })
    
    const sortedDates = Object.keys(trend).sort()
    const result = sortedDates.map(date => ({
      date,
      ...trend[date]
    }))
    
    res.json(result)
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
}

exports.getDoctorWorkload = async (req, res) => {
  try {
    const appointments = getAppointments()
    const doctors = getAllDoctors()
    
    const workload = doctors.map(doctor => {
      const doctorAppointments = appointments.filter(a => a.doctorId === doctor._id)
      return {
        doctorId: doctor._id,
        doctorName: doctor.name,
        total: doctorAppointments.length,
        completed: doctorAppointments.filter(a => a.status === 'completed').length,
        no_show: doctorAppointments.filter(a => a.status === 'no_show').length
      }
    })
    
    res.json(workload)
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
}

exports.getNoShowStats = async (req, res) => {
  try {
    const appointments = getAppointments()
    const noShowList = appointments
      .filter(a => a.status === 'no_show')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    
    res.json(noShowList)
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
}

exports.getAppointmentStats = async (req, res) => {
  try {
    const appointments = getAppointments()
    const stats = {
      total: appointments.length,
      pending: appointments.filter(a => a.status === 'pending').length,
      completed: appointments.filter(a => a.status === 'completed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
      no_show: appointments.filter(a => a.status === 'no_show').length
    }
    res.json(stats)
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
}
