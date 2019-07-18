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
            let second = eval(script)[3][14].split(")]}'")[1].split(",[[[");

            for(let i = 0; i < second.length; i++) {
                if(second[i][0] == 7){
                    second = eval(script)[3][14].split(")]}'")[1].split(",[[[")[i].split(",[[");
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


    }
}