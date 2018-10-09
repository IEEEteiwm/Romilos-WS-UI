const SerialPort = require('serialport')
const createTable = require('data-table')
const Readline = require('@serialport/parser-readline')
let initialized = false;
let port;

let liveData = [];

document.querySelector('#connect').addEventListener('click', () => {
  port = new SerialPort(document.querySelector('#port').value,
    {
      autoOpen: false,
      baudRate: 9600,
    }
  );

  port.open(function (err) {
    if (err) {
      return console.log('Error opening port: ', err.message);
    }

    port.write('main screen turn on');
  });

  const parser = port.pipe(new Readline({ delimiter: '\r\n' }))
  parser.on('data', renderData);

  document.querySelector('#connection').classList.add('hidden')
});

SerialPort.list((err, ports) => {
  if (err) {
    document.getElementById('error').textContent = err.message
    return
  } else {
    document.getElementById('error').textContent = ''
  }

  if (ports.length === 0) {
    document.getElementById('error').textContent = 'No ports discovered'
  }

  const headers = Object.keys(ports[0])
  const table = createTable(headers)
  tableHTML = ''
  table.on('data', data => tableHTML += data)
  table.on('end', () => document.getElementById('ports').innerHTML = tableHTML)
  ports.forEach(port => {
    table.write(port)
  })
  table.end();
});


function renderData(data) {
  if (!initialized) {
    if (data.includes('SETUP END')) initialized = true;

    return;
  }
  const headers = ['#', 'Wind direction', 'Wind speed', 'Humidity', 'Temprature', 'Rainfall', 'Pressure', 'Brightness']
  const table = createTable(headers)
  tableHTML = ''
  table.on('data', data => tableHTML += data)
  table.on('end', () => document.getElementById('ports').innerHTML = tableHTML)

  const temp = data.split('|');
  const obj = {};
  temp.forEach(t => {
    obj[t.split(':')[0].trim()] = t.split(':')[1];
  });

  liveData.push(obj);

  if (liveData.length > 30) {
    liveData.shift();
  }
  liveData.forEach((ld, index) => {
    console.log(index);
    ld['#'] = index + 1;
    table.write(ld)
  });



  table.end();
}
