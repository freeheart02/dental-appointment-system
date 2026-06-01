# dental-appointment-system
A dental appointment system created via Trae.
The front-end features a patient appointment interface where patients must enter their phone number, click to send a verification code, and then input the code to log in before accessing the appointment page. Patients can select a department, doctor, and time slot to make an appointment.
The back-end management system consists of six modules: dashboard, patient management, doctor management, scheduling management, appointment management, and statistical reporting.
Upon entering the management backend, users are directed to the dashboard, which displays a calendar view and a list of patients scheduled for the current day.
The patient management module allows administrators to add or delete patient records and track no-show occurrences. Patients who have missed appointments three or more times will be restricted from making further bookings until their information is manually updated in the backend.
The doctor management interface enables maintenance of doctor profiles. Available consultation durations include 15, 20, 30, 40, 45, and 60 minutes.
The scheduling management module allows administrators to assign doctors' schedules. For regular appointments, users can set start and end dates to schedule multiple sessions at once.
The appointment management module handles the maintenance of appointment details.
The statistical reporting module provides data analysis and statistics on appointment volumes and doctor workloads. This module still requires further development.

前端设置患者预约界面，患者须填写手机号，点击发送验证码，填入验证码登录后，进入预约界面。
患者可选科室、医生、时间段进行预约。
后台管理界面包括控制台、患者管理、医生管理、排班管理、预约管理和统计报表6个模块。
进入管理后台后显示的界面就是控制台界面，会显示月历及当天预约患者的列表。
患者管理模块用于患者管理，可以添加和删除患者，记录患者爽约次数，爽约大于等于3次的患者，将无法再次预约。在后台修改信息后才可以继续预约。
医生管理界面用于医生信息的维护。医生出诊的时间段包括15、20、30、40、45、60分钟可选。
排班管理模块用于为医生排班，规律出诊时，设定开始及结束日期，批量排班。
预约管理模块用于维护预约信息。
统计报表模块用于预约和医生工作量数据的统计和分析。尚需完善。
