const express = require('express');
const axios = require('axios');
const router = express.Router();

const { networkId, zerotierToken } = require('../app.js');

async function getRoutes() {
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

async function updateRoutes(routes) {
  try {
    for (let i = 0; i < routes.length; i++) {
        if (routes[i].via === 'undefined' || routes[i].via === '' || routes[i].via === 'LAN') {
            routes[i].via = null;
        }
    }

        
    const response = await axios.post(`https://api.zerotier.com/api/v1/network/${networkId}`, {
      config: {
        routes: routes,
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
    const network = await getRoutes();
    let routes = network.config.routes;
    let tableRows = '';
    routes.forEach(route => {
      tableRows += `
        <tr>
          <td>${route.target}</td>
          <td>${route.via === undefined ? 'LAN' : route.via}</td>
          <td><button type="submit" onclick="deleteRoute(this)" style='border:none;background:white;cursor:pointer'>🗑</button></td>
        </tr>
      `;
    });
    let table = `
      <table id="routesTable">
        <thead>
          <tr>
            <th>Target</th>
            <th>Via</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
          <td>          <input id="targetInput" type="text" placeholder="Target"> </td>
          <td><input id="viaInput" type="text" placeholder="Via">
          <button type="submit" onclick="addRoute()">Add</button></td>
        </tbody>
      </table>
    `;

    const script = `
      <script>
        function createRouteRow(target, via) {
          return \`
            <tr>
              <td>\${target}</td>
              <td>\${via}</td>
              <td><button type="submit" onclick="deleteRoute(this)" style='border:none;background:white;cursor:pointer'>🗑</button></td>
            </tr>
          \`;
        }

        function addRoute() {
          const targetInput = document.getElementById('targetInput');
          const viaInput = document.getElementById('viaInput');
          const routesTable = document.getElementById('routesTable');

          const target = targetInput.value;
          const via = viaInput.value === '' ? 'LAN' : viaInput.value;

          const newRow = createRouteRow(target, via);
          routesTable.tBodies[0].innerHTML += newRow;

          targetInput.value = '';
          viaInput.value = '';

          updateRoutes(getRoutesFromTable());
        }

        function deleteRoute(button) {
          const row = button.parentNode.parentNode;
          row.parentNode.removeChild(row);

          updateRoutes(getRoutesFromTable());
        }

        function getRoutesFromTable() {
  const routesTable = document.getElementById('routesTable');
  const rows = Array.from(routesTable.getElementsByTagName('tr'));
  const routes = rows.map(row => {
    const cells = Array.from(row.getElementsByTagName('td'));
    const targetCell = cells[0];
    const viaCell = cells[1];
    if (targetCell && viaCell) {
      const target = targetCell.innerText.trim();
      const via = viaCell.innerText.trim();
      if (target) {
        return {
          target,
          via,
        };
      }
    }
  });
  return routes.filter(route => route !== undefined);
}



        async function updateRoutes(routes) {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/routes/update');
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.send(JSON.stringify({ routes: routes }));
        }
      </script>
    `;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>ZeroTier Routes</title> 
          <style>
            table {
              border-collapse: collapse;
              width: 100%;
            }
            th, td {
              padding: 8px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
          </style>
        </head>
        <body style="font-family:'Courier New', Courier, monospace">
          <h2><a href="/">Home</a></h2>
          <h1>ZeroTier Routes</h1>
          ${table}
          

          ${script}
        </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Error fetching network:', error.message);
    throw error;
  }
});

router.post('/update', async (req, res) => {
  try {
    const routes = req.body.routes;
    updateRoutes(routes);
    res.send('Routes updated');
  } catch (error) {
    console.error('Error updating routes:', error.message);
    throw error;
  }
});

module.exports = router;
