import React from "react";

// Description: retrieve a route from the Bing Maps api.
const routeRetriever = async function(start, end, currentOrientation) {
    if( end != "" ) {
      tokens = end.split(" ");
      searchTarget = "";
    
      // convert to the correct format.
      for(i = 0 ; i < ( tokens.length - 1 ) ; i++)
      {
        searchTarget = searchTarget + tokens[i] + "%20";
      }
  
      startPoint = start.latitude.toString() + "," + start.longitude.toString();
      searchTarget = searchTarget + tokens[tokens.length-1];
      
      console.log("currentOrientation: ",currentOrientation);

      const address_1 = "https://dev.virtualearth.net/REST/V1/Routes/Driving?wp.0=";
      const address_2 = "&wp.1=";
      const address_3 = "&heading="+Math.floor(currentOrientation).toString();
      const address_4 = "&key=AmuFbtSSx6QgGZHVVfruUMH7l49P29nXwK4VbU9fzKX9-QXEdaWjT8gtfuMe7G70&routeAttributes=routePath"
      const address_full = address_1 + startPoint + address_2 + searchTarget + address_3 + address_4;
      
      try {
      let response = await fetch(
        address_full
      );
      let responseJson = await response.json();
      
      console.log("Bing Maps response:");
      console.log(responseJson);
  
      const result = responseJson.resourceSets[0].resources[0].routePath.line.coordinates;
      return result;
      } catch (error) {
          console.log(error);
      }
    }

};

export default routeRetriever;
