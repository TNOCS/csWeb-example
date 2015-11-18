import Winston = require('winston');
import * as csweb from "csweb";


Winston.remove(Winston.transports.Console);
Winston.add(Winston.transports.Console, <Winston.ConsoleTransportOptions>{
    colorize: true,
    label: 'csWeb',
    prettyPrint: true
})

var cs = new csweb.csServer(__dirname, <csweb.csServerOptions>{
    port : 3003
});
cs.start(() => {
    console.log('started');
        //    //{ key: "imb", s: new ImbAPI.ImbAPI("app-usdebug01.tsn.tno.nl", 4000),options: {} }
        //    var ml = new MobileLayer.MobileLayer(api, "mobilelayer", "/api/resources/SGBO", server, messageBus, cm);
});
