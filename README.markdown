#interface.server.gui

This module provides browser-based GUIs to Interface.Server. To test it, first make sure you've installed Interface.Server. Then:

- config interface server to use the gui module by uncommenting it in config.js
- Run interface.server
- direct a webbrowser to http://localhost:10080 (10080 is default port assigned in interface.server's config.js file) 
- run the test script using `node test.js`
- move the slider in the browser interface. you should see osc messages appear in the terminal window running `test.js`