const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

app.use('/', require('./routes/index'));
app.use('/members', require('./routes/members'));
app.use('/ipv4', require('./routes/ipv4'));
app.use('/ipv6', require('./routes/ipv6'));
app.use('/dns', require('./routes/dns'));

const port = 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
