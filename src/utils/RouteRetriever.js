import React from "react";


const routeRetriever = async function(start, end) {
    const address_1 = "https://dev.virtualearth.net/REST/V1/Routes/Driving?wp.0=";
    const address_2 = "%2Cwa&wp.1=";
    const address_3 = "%2Cwa&key=AmuFbtSSx6QgGZHVVfruUMH7l49P29nXwK4VbU9fzKX9-QXEdaWjT8gtfuMe7G70&routeAttributes=routePath"
    const address_full = address_1 + start + address_2 + end + address_3;
    
    try {
    let response = await fetch(
      address_full
    );
    let responseJson = await response.json();

    const result = responseJson.resourceSets[0].resources[0].routePath.line.coordinates;
    return result;
    } catch (error) {
        console.log(error);
    }
};

export default routeRetriever;
