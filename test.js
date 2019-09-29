var arp = require('node-arp');

arp.getMAC('172.16.1.168', function(err, mac) {
    if (!err) {
        console.log(mac);
    }
});