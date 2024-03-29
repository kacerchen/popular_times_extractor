# Popular Times Extractor

This package supports popular times data fetching which official Google Place API does not support.

## How To Use

### Step 1.

Download packages by running following command in editor:
> git clone https://github.com/kacerchen/popular_times_extractor.git

Or click `Clone or download` green button in the up-right corner -> and download by `Download ZIP` button

### Step 2.

Install node js
[Download](https://nodejs.org/en/download/)

### Step 3.

Search a place ID via the link:
[Click Here!](https://developers.google.com/places/web-service/place-id)

### Step 4.

Replace the place ID you got from Step 2 with the `placeID` in `start_fetch.js` file.

> ex. let placeID = 'ChIJD4GOEqSMGGAR5j34yZSIKzc';

### Step 5.

Paste your API key in `APIkey` in `start_fetch.js` file.

> ex. let APIkey = 'AIzaSyCNvvXK6LlKWV5F6QpRIobRz541qYjuio2';

If you don't have it yet, please go to [Here](https://developers.google.com/places/web-service/get-api-key) follow the instruction to get one.

### Step 6.

Run the following command to get data in terminal:

> node ./start_fetch.js