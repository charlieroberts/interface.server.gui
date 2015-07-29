GUI
===
The GUI IO generates browser-based GUIs by wrapping the interface.js library

**lo-dash** is our utility library of choice. **keypress** is the module that snags individual keyboardes from `stdin`.

    var EventEmitter = require( 'events' ).EventEmitter,
        util         = require( 'util' ),
        fs           = require( 'fs' ),
        _            = require( 'lodash'),
        ws                = require('ws'),
        url               = require('url'),
        connect           = require('connect'),
        app               = connect(),
        directory         = require( 'serve-index' ),
        static            = require( 'serve-static' ),
        oscMin            = require( 'osc-min' ),
        udp               = require( 'dgram' ),
        clients_in        = null, //new ws.Server({ port:socketPort }),
        clients           = {},
        root              = __dirname + "/node_modules/interface.js/server/interfaces",
        midiInit          = false,
        interfaceJS       = null,
        server            = null,
        serveInterfaceJS  = null,
        osc,
        idNumber = 0, IS;
        
    var GUI = {
      inputs: {},
      outputs:{},
      devices:[],
      getDeviceNames: function() { /* return _.pluck( this.devices, 'product' ) */ },
      init: function() {
        if( this.onload ) this.onload()
    
        var webServerPort = IS.config.IO.gui.webServerPort
    
        webServerPort     = IS.config.IO.gui.webServerPort || 10080
        socketPort        = IS.config.IO.gui.webSocketPort || webServerPort + 1
        oscOutPort        = IS.config.IO.gui.oscOutPort || webServerPort + 2
        oscInPort         = IS.config.IO.gui.oscInPort  || webServerPort + 3
        appendID          = IS.config.IO.gui.appendID   || false
                
        if( IS.config.IO.gui.interfaceDirectory ) {
          //console.log("CHANGING ROOT", IS.config.IO.gui.interfaceDirectory )
          root = IS.config.IO.gui.interfaceDirectory
        }
        
        this.clients_in = new ws.Server({ port:socketPort })
    
        //interfaceJS =  fs.readFileSync( '../external/zepto.js', ['utf-8'] );
        interfaceJS = fs.readFileSync( __dirname + '/node_modules/interface.js/build/interface.js', ['utf-8'] );
        interfaceJS += fs.readFileSync( __dirname + '/node_modules/interface.js/server/interface.client.js', ['utf-8'] );
    
        osc = udp.createSocket( 'udp4', function( _msg, rinfo ) {
          var msg = oscMin.fromBuffer( _msg )
      
          var firstPath = msg.address.split('/')[1],
              isNumber  = ! isNaN( firstPath ),
              tt = '',
              msgArgs = []

          for( var i = 0 ; i < msg.args.length; i++ ) {
            var arg = msg.args[ i ]
            tt += arg.type[ 0 ]
            msgArgs.push( arg.value )
          }
          if( ! isNumber ) {
            for( var key in clients ) {
              clients[ key ].send( JSON.stringify({ type:'osc', address:msg.address, typetags: tt, parameters:msgArgs }) )
            }
          }else{
            clients[ firstPath ].send( JSON.stringify({ type:'osc', address:'/'+msg.address.split('/')[2], typetags: tt, parameters:msgArgs }) )
          }
        })
        osc.bind( oscInPort )
        serveInterfaceJS = function(req, res, next){
        	req.uri = url.parse( req.url );
        	if( req.uri.pathname == "/interface.js" ) {
        		res.writeHead( 200, {
        			'Content-Type': 'text/javascript',
        			'Content-Length': interfaceJS.length
        		})
        		res.end( interfaceJS );

        		return;
        	}
          next();
        };
        server = app
          .use( directory( root, { hidden:false,icons:true } ) )
          .use( serveInterfaceJS )
          .use( static(root) )
          .listen( webServerPort );
      
        this.clients_in.on( 'connection', function ( socket ) {
          //console.log( "device connection received", socket.upgradeReq.headers );
          var clientIP = socket.upgradeReq.headers.origin.split( ':' )[ 1 ].split( '//' )[ 1 ]
          console.log("client connected:", clientIP )
          clients[ idNumber ] = socket
          socket.ip = clientIP
          socket.idNumber = idNumber++
          socket.on( 'message', function( obj ) {
            var msg = JSON.parse( obj );
        
            if(msg.type === 'osc') {
              if( appendID ) {  // append client id
                msg.parameters.push( socket.idNumber )
              }

              socket.device.emit( msg.address.slice(1), msg.parameters )
            }else{
              msg.values.unshift( msg.address )
              var output = IS.switchboard.route.call( IS.switchboard, msg.values )
          
              if( msg.address === '/interface/ioManager/createDevice' ) {
                socket.device = output
              }
            }
          });
        });
    
        this.emit( 'new device', 'gui', GUI )
      }
    }

    GUI.__proto__ = new EventEmitter()
    GUI.__proto__.setMaxListeners( 0 )

    module.exports = function( __IS ) { if( typeof IS === 'undefined' ) { IS = __IS; } return GUI; }