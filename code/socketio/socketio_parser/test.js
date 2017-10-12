var parser = require('socket.io-parser');
var encoder = new parser.Encoder();
var packet = {
  type: parser.ACK,
  data: 'test-packet',
  id: 22
};
encoder.encode(packet, function(encodedPackets) {
	console.log(encodedPackets);
  var decoder = new parser.Decoder();
  decoder.on('decoded', function(decodedPacket) {
      console.log(decodedPacket);
    // decodedPacket.type == parser.EVENT
    // decodedPacket.data == 'test-packet'
    // decodedPacket.id == 13
  });

	console.log("e")
  for (var i = 0; i < encodedPackets.length; i++) {
    decoder.add(encodedPackets[i]);
  }
});
