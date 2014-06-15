node-phantom connection upgrade bug
===================================

This repository aims to reproduce a bug with node-phantom hanging the application.
To reproduce the bug I've copied the node-phantom scripts:
* node.phantom.js
* bridge.js

And changed the dependency for socketio for 
    
    "socket.io": "0.9.x"

There's a problem in this code using the socketio version 1.x.x


About the bug
-------------

When running a process with node-phantom, to load a webpage, after opening the second page, on the same process, the connection will be upgraded. Calling the http method upgrade on the server.

As node-phantom relies on socketio to do bidirectional communication, the socketio will handle the http upgrade call, as a new connection executing the callback on the event:

    io.sockets.on('connection',function(socket){

As a result, node-phantom assumes that a new process was created and executes the callback with a new proxy:

    callback(null,proxy);

The older socket connection seems to be discarded, and calls to the older proxy have no action.

At the moment we have 2 execution flows on the same function, loading the same page. The first one that executed partially (and cannot do nothing more, because its proxy connection seems to be closed), and a new one that is starting.

If we protect the user code, to ignore further executions, 
    
    if(ignorePhantomProcess) {
        console.log('Phantom process is being ignored, because node-phantom is just called the callback twice... ignoring it...');
        return;
    }

the node process will hang, even if we call
    
    ph.exit()

because the connection seems to be disposed, the phantom process do not exit, and we still have a child process executing. So, the node process is hanged.


How to reproduce it
-------------------

To reproduce this bug:
* just clone this repository
* run: npm install
* run: node node-phantom-bug.js


1. Firstly it will create a phantom process
2. Create a page
3. Open the website http://abola.pt
4. Close the page
5. Create a new page
6. Open the website http://www.record.pt
7. After the website opens, the callback is executed again: 

    WARN!!! Phantom process is being ignored, because node-phantom is just called the callback twice... ignoring it...

8. Webpage opens
9. Close the webpage
10. Node process tries to exit the phantom process, but the process does not exit. 
11. Node process is hanged


Note: when reviewing the fix, just notice that this does not happen with all websites. But can be reproduced with these two:

* http://www.abola.pt
* http://www.record.pt


The fix
-------

The fix is very simple and is done on this [node-phantom fork](https://github.com/apdmatos/node-phantom)

Basically, the connection upgrade must be transparent to the user, and the callback function must not be executed twice.

To do this, basically the socket is stored on a scope level

    var connectionSocket = null;
    io.sockets.on('connection',function(socket){

Updated when the connection callback is executed, and we only call the phantom created callback, only and if this variable is null. This means that is the first time the connection socket is opened.

    var executeCallback = !connectionSocket;
    connectionSocket = socket;
    if(executeCallback) {
        callback(null,proxy);
    }

Pull request
------------

The fix is done on this [repository](https://github.com/apdmatos/node-phantom) and the code has been [pull requested](https://github.com/alexscheelmeyer/node-phantom/pull/103)

