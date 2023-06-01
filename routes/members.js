const express = require('express');
const axios = require('axios');
const router = express.Router();

const { networkId, zerotierToken } = require('../app.js');


async function getMembers() {
  try {
    const response = await axios.get(`https://my.zerotier.com/api/network/${networkId}/member`, {
      headers: {
        Authorization: `Bearer ${zerotierToken}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching members:', error.message);
    throw error;
  }
}

function timeToHuman(time) {
  const minutes = Math.floor((time) / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const humanTime = days > 0 ? days + ' days ago' : hours > 0 ? hours + ' hours ago' : minutes > 0 ? minutes + ' minutes ago' : 'less than a minute'
  return humanTime
}


async function saveMember(memberId, passed_data) {
  const url = `https://my.zerotier.com/api/network/${networkId}/member/${memberId}`;
  const headers = {
    'Authorization': `Bearer ${zerotierToken}`,
    'Content-Type': 'application/json',
  };
  const data = passed_data;


  try {
    const response = await axios.post(url, data, { headers });
    if (response.status === 200) {
      console.log('Member updated successfully.');
    } else {
      console.log('Failed to update member.');
      console.log('Error message:', response.data);
    }
  } catch (error) {
    console.log('Failed to update name.');
    console.log('Error message:', error.message);
    console.log('Error \n', error)
  }
}
function createIPList(ip) {
  let ipList = '';
  for (let i = 0; i < ip.length; i++) {
    ipList += "<li><button id='" + i + "' onclick='deleteIPAssigment(this)' style='border:none;background:white;cursor:pointer'>&#128465;</button><span  id='" + i + "' class='ipListing' ondblclick='editIPAssigment(this)'>" + ip[i] + "</span></li>";
  }
  return ipList;
}

router.get('/', async (req, res) => {
  try {
    const members = await getMembers();
    let tableRows = '';
    members.forEach(member => {
      console.log(member)
      const id = member.id.substring(member.id.length - 10, member.id.length);
      const ipAssignments = member.config.ipAssignments || [];
      const ipList = createIPList(ipAssignments);

      const lastSeen = timeToHuman(member.clock - member.lastSeen)
      const authorized = member.config.authorized ? 'checked' : '';
      tableRows += `
        <tr>
            <td onclick="saveAuthorized(this)"><input type="checkbox" id="authorized" ${authorized}></td>
            <td>${id}</td>
            <td ondblclick="editName(this)">${member.name}</td>
            <td ondblclick="editDescription(this)">${member.description}</td>
            <td>${ipList}<li><input type="text" size="9"><button type="submit" onclick="addIPAssigment(this)">✓</button></td>
            <td>${lastSeen}</td>
            <td>${member.physicalAddress}</td>
            <td>${member.clientVersion}</td>
            
      </tr>
        `;
    });

    const table = `
        <table id="membersTable">
          <thead>
            <tr>
              <th onclick="sortTable(0)">Authorized?</th>
              <th onclick="sortTable(1)">ID</th>
              <th onclick="sortTable(2)">Name</th>
              <th onclick="sortTable(3)">Description</th>
              <th onclick="sortTable(4)">IP Assignments</th>
              <th onclick="sortTable(5)">Last Seen</th>
              <th onclick="sortTable(6)">Physical Address</th>
              <th onclick="sortTable(7)">Version</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      `;

    const script = `
        <script>
        function createIPList(ip){
          let ipList = '';
          for (let i = 0; i < ip.length; i++) {
            ipList += "<li><button id='" + i + "' onclick='deleteIPAssigment(this)' style='border:none;background:white;cursor:pointer'>&#128465;</button><span id='" + i + "' class='ipListing' ondblclick='editIPAssigment(this)'>" + ip[i] + "</span></li>";
          }
          return ipList + '<li><input type=\\"text\\" size=\\"9\\"><button type=\\"submit\\" onclick=\\"addIPAssigment(this)\\">✓</button>';          
        }
        function sortTable(columnIndex) {
          const table = document.getElementById('membersTable');
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
        
          function editName(cell) {
            const originalName = cell.innerText;
            cell.innerHTML = '<input type=\\"text\\" id=\\"newNameInput\\" value=\\"' + originalName + '\\"><button onclick=\\"saveName(event)\\">Save</button>';
          }
      
          function saveName(event) {
            const button = event.target;
            const row = button.parentNode.parentNode;
            const id = row.cells[1].innerText;
            const newNameInput = document.getElementById('newNameInput');
            const newName = newNameInput.value;
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/members/savename');
            xhr.setRequestHeader('Content-Type', 'application/json');   
            xhr.send(JSON.stringify({ id: id, newName: newName }));
            row.cells[2].innerText = newName;
          }
          
          function saveAuthorized(cell) {
            const row = cell.parentNode;
            console.log(row)
            const id = row.cells[1].innerText;
            const authorized = document.getElementById('authorized').checked;
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/members/saveauthorized');
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify({ id: id, authorized: authorized }));
          }
          
          function editIPAssigment(cell) {
            const originalIP = cell.innerText;
            cell.innerHTML = '<input type=\\"text\\" id=\\"newIPInput\\" value=\\"' + originalIP + '\\" size="9"><button onclick=\\"saveIP(event)\\">✓</button>';
          }
          
          function saveIP(event) {
            const button = event.target;
            const row = button.parentNode.parentNode.parentNode.parentNode;
            const id = row.cells[1].innerText;
            const newIPInput = document.getElementById('newIPInput');
            const newIP = newIPInput.value;
            let ip = [];
            for (let i = 0; i < row.cells[4].getElementsByClassName('ipListing').length; i++) {
              if (row.cells[4].getElementsByClassName('ipListing')[i].innerText == '✓') {
                ip.push(document.getElementById('newIPInput').value)
              }
              else {
              ip.push(row.cells[4].getElementsByClassName('ipListing')[i].innerText);
              }
            }
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/members/addipassignment');
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify({ id: id, ip: ip }));
            row.cells[4].innerHTML = createIPList(ip);
          }
          
          function addIPAssigment(button) {
            const row = button.parentNode.parentNode.parentNode;
            console.log(row)
            const id = row.cells[1].innerText;
            const ipInput = row.cells[4].getElementsByTagName('input')[0];
            const ip = [];
            for (let i = 0; i < row.cells[4].getElementsByTagName('li').length - 1; i++) {
              ip.push(row.cells[4].getElementsByClassName('ipListing')[i].innerText);
            }
            ip.push(ipInput.value);
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/members/addipassignment');
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify({ id: id, ip: ip }));
            row.cells[4].innerHTML = createIPList(ip);
          }
          
          
          function deleteIPAssigment(button) {
            const row = button.parentNode.parentNode.parentNode;
            const id = row.cells[1].innerText;
            const deletedIPIndex = button.id;
            console.log(deletedIPIndex)
            const ip = [];
            var ips = row.cells[4].getElementsByClassName('ipListing');
            let ips2 = [];
            for (let i = 0; i < ips.length; i++) {
              ips2.push(ips[i].innerText); 
            }
            for (let i = 0; i < ips2.length; i++) {
              if (i != deletedIPIndex) {
                ip.push(ips2[i]);
              }
            }
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/members/addipassignment');
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify({ id: id, ip: ip }));
            row.cells[4].innerHTML = createIPList(ip)
          }
          
          function editDescription(cell){
            const originalDescription = cell.innerText;
            cell.innerHTML = '<input type=\\"text\\" id=\\"newDescriptionInput\\" value=\\"' + originalDescription + '\\"><button onclick=\\"saveDescription(event)\\">✓</button>';
          }
          
          function saveDescription(event) {
            const button = event.target;
            const row = button.parentNode.parentNode;
            const id = row.cells[1].innerText;
            const newDescriptionInput = document.getElementById('newDescriptionInput');
            const newDescription = newDescriptionInput.value;
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/members/savedescription');
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify({ id: id, newDescription: newDescription }));
            row.cells[3].innerText = newDescription;
            
          }
        </script>
        
      `;

    const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>ZeroTier Members</title>
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
            <h1>ZeroTier Members</h1>
            ${table}
            ${script}
          </body>
        </html>
      `;

    res.send(html);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('An error occurred');
  }
});

router.post('/savename', (req, res) => {
  const id = req.body.id;
  const newName = req.body.newName;
  console.log('Saving member name:', newName, 'for member ID:', id)
  data = {
    'name': newName,
  }
  saveMember(id, data);
  res.send('Saved successfully');
});

router.post('/saveauthorized', (req, res) => {
  const id = req.body.id;
  const authorized = req.body.authorized;
  console.log('Saving member authorized:', authorized, 'for member ID:', id)
  data = {
    'authorized': authorized,
  }
  saveMember(id, data);
  res.send('Saved successfully');
});

router.post('/addipassignment', (req, res) => {
  const id = req.body.id;
  const ip = req.body.ip;
  console.log('Saving member IP assignment:', ip, 'for member ID:', id)
  const data = {
    'config': {
      'ipAssignments': ip,
    },
  }
  saveMember(id, data);
  res.send('Saved successfully');
});
router.post('/savedescription', (req, res) => {
  const id = req.body.id;
  const newDescription = req.body.newDescription;
  console.log('Saving member description:', newDescription, 'for member ID:', id)
  data = {
    'description': newDescription,
  }
  saveMember(id, data);
  res.send('Saved successfully');
});
module.exports = router;
