import React from 'react';

const routeRetriever = async function(){

	const address_1 = 'https://dev.virtualearth.net/REST/V1/Routes/Driving?wp.0='
	const address_2 = '%2Cwa&wp.1='
	const address_3 = '%2Cwa&key=AmuFbtSSx6QgGZHVVfruUMH7l49P29nXwK4VbU9fzKX9-QXEdaWjT8gtfuMe7G70&routeAttributes=routePath'

	const address_full = address_1 + 'redmond' + address_2 + 'Issaquah' + address_3

	//return fetch(address_full).then((response) => response.json()).then((json) => {
	//	console.log(json.resourceSets.resources)

	//	return json;
	//}).catch((error) => {
	//	console.error(error);
	//});

	try {
    let response = await fetch(
      address_full,
    );
    let responseJson = await response.json();
    //console.log(responseJson)
    var unit = responseJson.resourceSets
    var unit_2 = unit.resources
    console.log(unit[0].resources[0].routePath.line)

	} catch (error) {

	}
}

export default routeRetriever;