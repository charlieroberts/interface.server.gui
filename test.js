/* 

This test is an example of using the interface.server.gui module.

Steps to run:

- config interface server to use the gui module by uncommenting it in config.js
- Run interface.server
- direct a webbrowser to  

*/

var oscMin = require( 'osc-min' ),
    udp = require( 'dgram' ),
    oscReceivePort = 15000,
    destinationIP = '127.0.0.1'

// open socket and listen for messages    
osc = udp.createSocket( 'udp4', function( msg, rinfo ){
   var oscMsg = oscMin.fromBuffer( msg )
   
   console.log( oscMsg ) 
})
osc.bind( oscReceivePort )

// define app
var app = "app = { name:'test1', transports: [{ type:'osc', port:" + oscReceivePort + " }]," +
    "inputs: { blah2: { min: 0, max: 1 } },"+
    "outputs :{},"+
    "mappings: [{ input: { io:'mydevice', name:'slider' }, output:{ io:'test1', name:'blah2' } }]"+
    "}"

// convert app to OSC buffer
var buf = oscMin.toBuffer({
    address: '/interface/applicationManager/createApplicationWithText',
    args: [ app ]
})

// send buffer
osc.send( buf, 0, buf.length, 12000, destinationIP )
