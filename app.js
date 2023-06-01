const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

app.use('/', require('./routes/index'));
app.use('/members', require('./routes/members'));
app.use('/ipv4', require('./routes/ipv4'));
app.use('/ipv6', require('./routes/ipv6'));
app.use('/dns', require('./routes/dns'));

const networkInterface = process.env.NETWORK_INTERFACE || 'eth0'; 
const networkIP = process.env.NETWORK_IP || 'localhost';
const port = process.env.NETWORK_PORT || 3000;

app.listen(port, networkIP, () => {
  console.log(`Server running on network interface ${networkInterface} on IP ${networkIP} on port ${port}`);
});
