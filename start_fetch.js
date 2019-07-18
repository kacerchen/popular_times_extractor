const busy_hours = require('./processing_funcs').busy_hours;

let placeID = 'ChIJD4GOEqSMGGAR5j34yZSIKzc';
let APIkey = 'AIzaSyCNvvXK6LlKWV5F6QpRIobRz541qYt865A';

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
    }).catch(err => {
        console.log("Error: " + err);
    });