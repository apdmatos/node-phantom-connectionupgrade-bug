var phantom = require('./node-phantom');

var ignorePhantomProcess = false;

console.log('creating process...');
phantom.create(function(err, ph){
    if(err) {
        console.log('upss... error creating phantom process...');
        return;
    }

    if(ignorePhantomProcess) {
        console.log('WARN!!! Phantom process is being ignored, because node-phantom is just called the callback twice... ignoring it...');
        return;
    }
    ignorePhantomProcess = true;


    console.log('creating page...');
    ph.createPage(function(err, page){
        if(err) {
            console.log('upss... error creating page...');
            ph.exit();
            return;
        }

        console.log('opening page www.abola.pt...');
        page.open('http://www.abola.pt', function(err, status) {

            if(err) {
                console.log('error opening page www.abola.pt...');
                page.close();
                ph.exit();
            }

            console.log('page www.abola.pt opened');

            setTimeout(function() {
                console.log('closing page www.abola.pt');

                page.close();


                console.log('creating page...');
                ph.createPage(function(err, page){
                    if(err) {
                        console.log('upss... error creating page...');
                        ph.exit();
                        return;
                    }

                    console.log('opening page www.record.pt...');

                    page.open('http://www.record.pt', function(err, status) {

                        if(err) {
                            console.log('error opening page www.record.pt...');
                            page.close();
                            ph.exit();
                        }

                        console.log('page www.record.pt opened');

                        setTimeout(function() {

                            console.log('closing page www.record.pt');
                            page.close();
                            ph.exit();
                        
                        }, 5000);

                    });

                });



            }, 2000);

        });
    });
    
});