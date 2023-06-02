const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
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
            <h1>ZeroTier Admin Panel</h1>
            <table>
              <thead>
                <tr>
                  <th><a href ="/members">Members</a></th>
                  <th><a href ="/ip">IP</a></th>
                  <th><a href ="/dns">DNS</a></th>
                  <th><a href ="/routes">Routing</a></th>
                </tr>
          </body>
        </html>
  `
  res.send(html);
});

module.exports = router;
