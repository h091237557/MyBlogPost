var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');
app.listen(3000); 
function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

var nsp = io.of('my-nsp');
nsp.on('connection', function(socket){
    console.log('connectioned');
});
nsp.emit('hi','everone');

// io.on('connection', function (socket) {
//   socket.join('1101');
//   io.to('1101').emit('news', {hello: 'world'});
// //   socket.emit('news', { hello: 'world' });
//   socket.on('my other event', function (data) {
//     console.log(data);
//   });

//   socket.on('disconnect', function(socket){
//       console.log(socket);
//       console.log('by bye');
//   });
// });
