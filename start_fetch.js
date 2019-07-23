const busy_hours = require('./processing_funcs').busy_hours;
const export_file = require('./processing_funcs').export_file;

let placeID = 'ChIJD4O5M3h644kR_nMnL0JA4no';
let APIkey = '';

busy_hours(placeID, APIkey)
    .then(data => {
        // console.log("This is response: " + JSON.stringify(data)); 
        for(let e of data){
            if(e.busy_hour[0].data == 'null') {
                console.log("There's no popular times data for this location!");
                break;
            }
            console.log("------- Day: " + e.weekday + " -------");
            e.busy_hour.map((hours) => {
                console.log(hours);
            })
        }

        data[0].busy_hour[0].data == 'null' ? console.log('No data to export.') : export_file(data);        

    }).catch(err => {
        console.log("Error: " + err);
    });