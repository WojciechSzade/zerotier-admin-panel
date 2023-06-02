const express = require('express');
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config();

app.use(bodyParser.json());

const networkId = process.env.NETWORK_ID || 'ENTER-YOUR-NETWORK-ID-HERE';
const zerotierToken = process.env.API_KEY || 'ENTER-YOUR-API-KEY-HERE';
module.exports = { networkId, zerotierToken };

app.use('/', require('./routes/index'));
app.use('/members', require('./routes/members'));
app.use('/ip', require('./routes/ip'));
app.use('/dns', require('./routes/dns'));
app.use('/routes', require('./routes/routes'));

const networkInterface = process.env.NETWORK_INTERFACE || 'eth0'; 
const networkIP = process.env.NETWORK_IP || 'localhost';
const port = process.env.NETWORK_PORT || 3000;


app.listen(port, networkIP, () => {
  console.log(`Server running on network interface ${networkInterface} on IP http://${networkIP}:${port}`);
});
