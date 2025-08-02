const express = require('express');
const cors = require('cors');
const i18n = require('i18n');
const path = require('path');
const sequelize = require('./database');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
i18n.configure({
  locales: ['zh_TW'],
  directory: path.join(__dirname, 'locales'),
  defaultLocale: 'zh_TW',
  objectNotation: true,
});
app.use(i18n.init);

app.use('/api/users', require('./routes/users'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/enrollments', require('./routes/enrollments'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/attendance', require('./routes/attendance'));

sequelize.sync({ force: false }).then(() => {
  console.log('兔子音樂資料庫同步完成');
});

app.get('/', (req, res) => {
  res.send('兔子音樂後端 (RabbitMusic)');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`伺服器運行於端口 ${PORT}`));