const express = require('express');
const axios = require('axios');
const router = express.Router();

const { networkId, zerotierToken } = require('../app.js');

async function getDNS() {
  try {
    const response = await axios.get(`https://api.zerotier.com/api/v1/network/${networkId}`, {
      headers: {  
        'Authorization': `Bearer ${zerotierToken}`, 
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching network:', error.message);
    throw error;
  }
}

async function updateDNS(domain = null, servers = null) {
  if (domain === null) {
    const network = await getDNS();
    domain = network.config.dns.domain;
  }
  if (servers === null) {
    const network = await getDNS();
    servers = network.config.dns.servers;
  }
  try {
    const response = await axios.post(`https://api.zerotier.com/api/v1/network/${networkId}`, {
      config: {
        dns: {
          domain: domain,
          servers: servers,
        },
      },
    }, {
      headers: {
        'Authorization': `Bearer ${zerotierToken}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating network:', error.message);
    throw error;
  }
}

          


router.get('/', async (req, res) => {
  try {
    const network = await getDNS();
    let domain = network.config.dns.domain;
    let servers = network.config.dns.servers;
    let tableRows = '';
    servers.forEach(server => {
      tableRows += `
          <td><button type="submit" onclick=deleteServer(this) style='border:none;background:white;cursor:pointer'>🗑</button>${server}</td>
        </tr>
        <tr>
        <td></td>`;
    }
    );
    tableRows = tableRows.substring(0, tableRows.length - 20);
    tableRows += `
    <tr><td></td>
    <td><input type="text"><button type="submit" onclick="addServer(this)">Add</button></td>
    </tr>
    `
    let table = `
        <table id = "dnsTable">
          <thead>
            <tr> 
              <th>Domain</th>
              <th onclick="sortTable(1)">Servers</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${domain}</td>
              ${tableRows}
            </tr>
          </tbody>
          </table>
        `;
        
    const script = `
    <script>
      function sortTable(columnIndex) {
        const table = document.getElementById('dnsTable');
        const rows = Array.from(table.getElementsByTagName('tr'));
      
        const sortedRows = rows.slice(1);
      
        sortedRows.sort((a, b) => {
          const cellA = a.cells[columnIndex].innerText.toLowerCase();
          const cellB = b.cells[columnIndex].innerText.toLowerCase();
      
          if (cellA < cellB) {
            return -1;
          } else if (cellA > cellB) {
            return 1;
          }
      
          return 0;
        });
      
        if (table.classList.contains('asc1')) {
          sortedRows.reverse();
          table.classList.remove('asc1');
          table.classList.add('desc1');
        } else {
          table.classList.remove('desc1');
          table.classList.add('asc1');
        }
        for (let i = 0; i < sortedRows.length; i++) {
          table.tBodies[0].appendChild(sortedRows[i]);
        }
        const headers = table.getElementsByTagName('th');
        for (let i = 0; i < headers.length; i++) {
          headers[i].classList.remove('asc', 'desc');
        }
        headers[columnIndex].classList.add(table.classList.contains('asc1') ? 'asc' : 'desc');
    
      }
      
      function createServerList(servers){
        let serverList = '';
        for (let i = 0; i < servers.length; i++) {
          serverList += "<td><button type='submit' onclick=deleteServer(this) style='border:none;background:white;cursor:pointer'>🗑</button>" + servers[i] + "</td>"
        }
        return serverList;
      }
        
      
      function addServer(button){
        const table = document.getElementById('dnsTable');
        const rows = Array.from(table.getElementsByTagName('tr'));
        const newServer = button.previousElementSibling.value;
        let servers = [];
        for (let i = 1; i < rows.length - 1; i++) {
          servers.push(rows[i].getElementsByTagName('td')[1].innerText.replace('🗑', ''));  
        }
        servers.push(newServer);
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/dns/updateServer');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({servers: servers}));
        const row = button.parentNode.parentNode;
        const newRow = document.createElement('tr');
        newRow.innerHTML = "<td></td><td><button type='submit' onclick=deleteServer(this) style='border:none;background:white;cursor:pointer'>🗑</button>" + newServer + "</td>";
        row.parentNode.insertBefore(newRow, row.previousSibling);
        button.previousElementSibling.value = ''; 
      }
      
      function deleteServer(button){
        const table = document.getElementById('dnsTable');
        const rows = Array.from(table.getElementsByTagName('tr'));
        let servers = [];
        for (let i = 1; i < rows.length - 1; i++) {
          servers.push(rows[i].getElementsByTagName('td')[1].innerText.replace('🗑', ''));
        }
        const serverToDelete = button.parentNode.innerText.replace('🗑', '');
        servers.splice(servers.indexOf(serverToDelete), 1);
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/dns/updateServer');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({servers: servers}));
        const row = button.parentNode.parentNode;
        row.parentNode.removeChild(row.previousSibling);
        row.parentNode.removeChild(row);
      }
      
      </script>
    `
        
    const html = `
    <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>ZeroTier DNS</title> 
              <style>
                table {
                  border-collapse: collapse;
                  width: 100%;
                }
                th, td {
                  padding: 8px;
                  text-align: left;
                  border-bottom: 1px solid #ddd;
                  cursor: pointer;
                }
                .asc:after {
                  content: ' ▲';
                }
                .desc:after {
                  content: ' ▼';
                }
                ul {
                  padding: 0;
                  margin: 0;
                }
              </style>
            </head>
            <body style="font-family:'Courier New', Courier, monospace">
              <h2><a href="/">Home</a></h2>
              <h1>ZeroTier DNS</h1>
              ${table}
              ${script}
            </body>
          </html>
    `
    res.send(html);
    
    
  }
  catch (error) {
    console.error('Error fetching network:', error.message);
    throw error;
  }
});

router.post('/updateServer', async (req, res) => {
  try {
    const servers = req.body.servers;
    updateDNS(null, servers);
    res.send('dns servers updated');
  }
  catch (error) {
    console.error('Error updating servers:', error.message);
    throw error;
  }
});


module.exports = router;
