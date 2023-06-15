const express = require('express');
const axios = require('axios');
const router = express.Router();

const { networkId, zerotierToken } = require('../app.js');

async function getIP() {
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

async function updateIP(ipListStart, ipListEnd) {
  let data = {
    config: {
      ipAssignmentPools: []
  }
  };
  for (let i = 0; i < ipListStart.length; i++) {
    data.config.ipAssignmentPools.push({
      ipRangeStart: ipListStart[i],
      ipRangeEnd: ipListEnd[i]
    });
  }
  try {
    const response = await axios.post(`https://api.zerotier.com/api/v1/network/${networkId}`, data, {
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
    const network = await getIP();
    ipAssignmentPools = network.config.ipAssignmentPools;
    let ipLength = 0;
    let tableRows = '';
    ipAssignmentPools.forEach(pool => {
      let ipType = pool.ipRangeStart.length > 15 ? 'IPv6' : 'IPv4';
      ipLength++;
      tableRows += `
      <tr>
          <td>${ipLength}</td>
          <td>${ipType}</td>
          <td ondblclick="editIpStart(this)"><button onclick='deleteIp(this)' style='border:none;background:white;cursor:pointer'>&#128465;</button>${pool.ipRangeStart}</td>
          <td ondblclick="editIpEnd(this)">${pool.ipRangeEnd}</td>
      </tr>
      `
    });
    tableRows += `
      <tr>
        <td>${ipLength + 1}</td>
        <td>IPv4/IPv6</td>
        <td><input type='text' id='ipStart' placeholder='Enter IP Start' required/></td>
        <td><input type='text' id='ipEnd' placeholder='Enter IP End' required/><button type="submit" onclick=addIP(this)>Add</button></td>
      </tr>
      `;
    
    const table = `
        <table id='ipTable'>
          <thead>
            <tr>
              <th onclick="sortTable(0)">#</th>
              <th onclick="sortTable(1)">Type</th>
              <th onclick="sortTable(2)">Start</th>
              <th onclick="sortTable(3)">End</th>  
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
    `;
    const script = `
      <script>
      function sortTable(columnIndex) {
        const table = document.getElementById('ipTable');
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
      
      function getAllIpStart() {
        const table = document.getElementById('ipTable');
        const rows = Array.from(table.getElementsByTagName('tr'));
        const ipStart = [];
        for (let i = 1; i < rows.length - 1; i++) {
          ipStart.push(rows[i].getElementsByTagName('td')[2].innerText.replace("🗑", ""));
        }
        return ipStart; 
      }
      
      function getAllIpEnd() {
        const table = document.getElementById('ipTable');
        const rows = Array.from(table.getElementsByTagName('tr'));
        const ipEnd = [];
        for (let i = 1; i < rows.length - 1; i++) {
          ipEnd.push(rows[i].getElementsByTagName('td')[3].innerText.replace("🗑", ""));
        }
        return ipEnd;
      }
      
      function editIpStart(cell) {
        const originalIpStart = cell.innerText;
        cell.innerHTML = "<input type='text' value='" + originalIpStart + "'/><button onclick='saveIpStart(this)'>✓</button>";
      }
      
      function saveIpStart(button) {
        const row = button.parentNode.parentNode;
        const id = row.getElementsByTagName('td')[0].innerText;
        const ipStart = row.getElementsByTagName('input')[0].value.replace("🗑", "");
        if (ipStart.length < 7) {
          alert('Invalid IP Start');
          return;
        }
        let ipListStart = getAllIpStart();
        ipListStart[id - 1] = ipStart;
        const ipListEnd = getAllIpEnd();
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/ip/updateIP');     
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({ ipListStart : ipListStart, ipListEnd : ipListEnd }));
        row.getElementsByTagName('td')[2].innerText = ipStart;
      }
      
      function editIpEnd(cell) {
        const originalIpEnd = cell.innerText;
        cell.innerHTML = "<input type='text' value='" + originalIpEnd + "'/><button onclick='saveIpEnd(this)'>✓</button>";
      }
      
      function saveIpEnd(button) {
        const row = button.parentNode.parentNode; 
        const id = row.getElementsByTagName('td')[0].innerText; 
        const ipEnd = row.getElementsByTagName('input')[0].value;
        if (ipEnd.length < 7) {
          alert('Invalid IP End');
          return;
        }
        let ipListEnd = getAllIpEnd();
        ipListEnd[id - 1] = ipEnd;
        const ipListStart = getAllIpStart();
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/ip/updateIP');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({ ipListStart : ipListStart, ipListEnd : ipListEnd }));
        row.getElementsByTagName('td')[3].innerText = ipEnd;
      }
      
      function addIP(button) {
        const row = button.parentNode.parentNode;
        const ipStart = row.getElementsByTagName('input')[0].value;
        const ipEnd = row.getElementsByTagName('input')[1].value;
        if (ipStart.length < 7 || ipEnd.length < 7) {
          alert('Invalid IP');
          return;
        }
        let ipListStart = getAllIpStart();
        let ipListEnd = getAllIpEnd(); 
        ipListStart.push(ipStart);
        ipListEnd.push(ipEnd);
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/ip/updateIP');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({ ipListStart : ipListStart, ipListEnd : ipListEnd }));
        row.getElementsByTagName('input')[0].value = '';
        row.getElementsByTagName('input')[1].value = '';
        const table = document.getElementById('ipTable');
        const tableBody = table.getElementsByTagName('tbody')[0];
        const newRow = tableBody.insertRow(tableBody.rows.length - 1);
        const cell1 = newRow.insertCell(0);
        const cell2 = newRow.insertCell(1);
        const cell3 = newRow.insertCell(2);
        const cell4 = newRow.insertCell(3);
        cell1.innerHTML = tableBody.rows.length - 1;  
        cell2.innerHTML = ipStart.length > 15 ? 'IPv6' : 'IPv4';
        cell3.innerHTML = ipStart;
        cell4.innerHTML = ipEnd; 
      }
      
      function deleteIp(button) {
        const row = button.parentNode.parentNode;
        const id = row.getElementsByTagName('td')[0].innerText;
        let ipListStart = getAllIpStart();
        let ipListEnd = getAllIpEnd();
        ipListStart.splice(id - 1, 1);
        ipListEnd.splice(id - 1, 1);
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/ip/updateIP');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({ ipListStart : ipListStart, ipListEnd : ipListEnd }));
        
        const table = document.getElementById('ipTable');
        const tableBody = table.getElementsByTagName('tbody')[0];
        tableBody.deleteRow(id);
        for (let i = id; i < tableBody.rows.length - 1; i++) {
          tableBody.rows[i].getElementsByTagName('td')[0].innerText = i;
        }
        
      }
      </script>
      `;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>IPv4</title>
          <style>
            table {
              border-collapse: collapse;
              width: 100%;
            }
            th, td {
              padding 8px;
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
        <body style="font-family:'Courier New'>, Courier, monospace">
          <h2><a href="/">Home</a></h2>
          <h1>IP Assignment Pools</h1>
          ${table}
          ${script}
        </body>
      </html>
      `;

    res.send(html);

  } catch (error) {
    console.error('Error fetching network:', error.message);
    res.status(500).send('Error fetching network');
  }
});

router.post('/updateIP', (req, res) => { 
  try {
    const ipListStart = req.body.ipListStart;
    const ipListEnd = req.body.ipListEnd;
    console.log("Saving ip range ", ipListStart, ipListEnd);
    updateIP(ipListStart, ipListEnd);
    res.send('IP updated');
  } catch (error) {
    console.error('Error updating IP:', error.message);
    res.status(500).send('Error updating IP');
  }
});

module.exports = router;
