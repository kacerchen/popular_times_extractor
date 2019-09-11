const fetch = require('axios');
module.exports = { 
    
    busy_hours: async function (place_id, key) {

        if (!(place_id && key)) {
            return {status: 'error', message: 'Place ID / API key missing'};
        }

        const gmaps = require('@google/maps').createClient({
            key: key,
            Promise: Promise
        });

        const format_output = array => {
            return {
                hour: array[0],
                percentage: array[1]
            }
        };

        const extract_data = html => {
            // ACHTUNG! HACKY AF
            let str = ['APP_INITIALIZATION_STATE=', 'window.APP_FLAGS'],
                script = html.substring(html.lastIndexOf(str[0]) + str[0].length, html.lastIndexOf(str[1]));

            // Extract common parts of script for different place ID which include busy hour data
            // console.log(eval(script)[3][6].split(")]}'")[1].split(",[[["));
            let second = eval(script)[3][6].split(")]}'")[1].split(",[[[");

            for(let i = 0; i < second.length; i++) {
                if(second[i][0] == 7){
                    second = eval(script)[3][6].split(")]}'")[1].split(",[[[")[i].split(",[[");
                }
            }
            let results = [];
            const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            for (let i = 1; i < second.length; i++) {
                // console.log("------- Day: " + weekdays[i-1] + " -------");
                
                let result = {};
                let second2 = "[" + second[i];
                let arr = second2.split("]");
                let busy_hour = extract_busy_hours(arr, i);
                result["weekday"] = weekdays[i-1];
                result["busy_hour"] = busy_hour;
                results.push(result);
            }
            
            return results;
        };

        function extract_busy_hours(arr, i){
            let j = 0;
            let array = [];
            
            for(let e of arr){
                if(j == 18){
                    break;
                } else if(j == 0 && i == 0){
                    j++;
                    continue;
                }
                
                let e2 = e.split(",");
                array.push(print_data(e2, j));
                j++;
            }

            return array;
        };

        function print_data(arr, j){
            let k = 0;
            let result = {};

            for(let e2e of arr){
                
                if(j == 0){
                    if(k == 1){
                        // console.log("Data: " + e2e);
                        result["data"] = e2e;
                        k++;
                        continue;
                    }else if(k == 4){
                        // console.log("Time: " + e2e);
                        result["time"] = e2e.replace(/"/g, "");
                        k++;
                        continue;
                    }else {
                        k++;
                        continue;
                    }
                }
                if(k == 2){
                    // console.log("Data: " + e2e);
                    result["data"] = e2e;
                }else if(k == 5){
                    // console.log("Time: " + e2e);
                    result["time"] = e2e.replace(/"/g, "");
                }
                k++;
            }
            return result;
        }

        const process_html = html => {
            console.log("Start process html");
            const popular_times = extract_data(html);

            if (!popular_times) {
                return {status: 'error', message: 'Place has no popular hours'};
            }

            const data = {status: 'ok'};
            const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

            data.week = Array.from(Array(7).keys()).map(index => {
                let hours = [];
                if (popular_times[0][index] && popular_times[0][index][1]) {
                    hours = Array.from(popular_times[0][index][1]).map(array => format_output(array));
                }
                return {
                    day: weekdays[index],
                    hours: hours
                };

            });
            const crowded_now = popular_times[7];

            if (crowded_now !== undefined) {
                data.now = format_output(crowded_now);
            }
            return data;

        };

        const fetch_html = async(url) => {
            try {
                const html = await fetch({
                    url: url,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.108 Safari/537.36'
                    }
                });
                return html.data;
            }
            catch (err) {
                return {status: 'error', message: 'Invalid url'};
            }
        };

        try {
            console.log("Start fetching... ");
            const place = await gmaps.place({placeid: place_id}).asPromise();
            const result = place.json.result;
            const {name, formatted_address, geometry:{location}} = result;
            const html = await fetch_html(result.url);
            console.log("Location details: " + name + ", " + formatted_address + ", " + location);
            // return Object.assign({name, formatted_address, location}, process_html(html));
            return extract_data(html);
        } catch (err) {
            return {status: 'error', message: 'Error: ' + err.json.status || err};
        }


    },

    export_file: function(data, place_id) {
        const csvWriter = require('csv-writer').createObjectCsvWriter({
            path: 'out_' + place_id + '.csv',
            header: [
              {id: 'time', title: 'Time'},
              {id: 'Mon', title: 'Mon'},
              {id: 'Tue', title: 'Tue'},
              {id: 'Wed', title: 'Wed'},
              {id: 'Thu', title: 'Thu'},
              {id: 'Fri', title: 'Fri'},
              {id: 'Sat', title: 'Sat'},
              {id: 'Sun', title: 'Sun'}
            ]
        });
        const times_en = ['6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM', '9 PM', '10 PM', '11 PM'];
        const times_zh = ['6時', '7時', '8時', '9時', '10時', '11時', '12時', '13時', '14時', '15時', '16時', '17時', '18時', '19時', '20時', '21時', '22時', '23時'];
        let times = [];
        let filedata = [];

        data[0].busy_hour[0].time.includes('AM') ? times = times_en : times = times_zh;

        try{
            for(let time of times) {
                let index = times.indexOf(time);
                let obj = {time: times_en[index], Mon: '', Tue: '', Wed: '', Thu: '', Fri: '', Sat: '', Sun: ''};
                for(let e of data) {
                    e.busy_hour.map((hours) => {
                        if(hours.time == time) {
                          switch(e.weekday) {
                            case 'Sun':
                              obj.Sun = hours.data;
                              break;
                            case 'Mon':
                              obj.Mon = hours.data;
                              break;
                            case 'Tue':
                              obj.Tue = hours.data;
                              break;
                            case 'Wed':
                              obj.Wed = hours.data;
                              break;
                            case 'Thu':
                              obj.Thu = hours.data;
                              break;
                            case 'Fri':
                              obj.Fri = hours.data;
                              break;
                            case 'Sat':
                              obj.Sat = hours.data;
                              break;
                          }
                        }
                    })
                }
                filedata.push(obj);
            }
      
            csvWriter
            .writeRecords(filedata)
            .then(()=> console.log('The CSV file was written successfully'));
        } catch (err) {
            return {status: 'error', message: 'Error: ' + err};
        }
    }
}