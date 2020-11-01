import React from "react";
import {
  multiply
} from "mathjs";
//import { TestScheduler } from "jest";

function adjustPoint(point, x_t, y_t) {
	point = [point[0] + x_t, point[1] + y_t];
	return point;
}

function rotateToXAxis(point) {
	theta = Math.atan2(point[1], point[0]);
	inv_theta = -1 * theta;
	// Matrix multiplication
	rotator = [[Math.cos(inv_theta), Math.sin(inv_theta)], [-1 * Math.sin(inv_theta), Math.cos(inv_theta)]];
	rotatedPoint = multiply(point, rotator);
	return rotatedPoint;
}

function withinRectangle(rectangle, adjPoint) {
	const top_left = rectangle.tl;
	const bottom_left = rectangle.bl;
	const top_right = rectangle.tr;
	const bottom_right = rectangle.br;

	if (adjPoint[0] > top_left[0] && adjPoint[1] < top_left[1]) {
		if (adjPoint[0] > bottom_left[0] && adjPoint[1] > bottom_left[1]) {
			if (adjPoint[0] < top_right[0] && adjPoint[1] < top_right[1]) {
				if (adjPoint[0] < bottom_right[0] && adjPoint[1] > bottom_right[1]) {
					return true;
				}
			}
		}
	}
	return false;
}

function adjustEdgeAndCurrent(edge, currentPoint) {
	const n0 = edge[0];
	const n1 = edge[1];
	const nCP = currentPoint;

	const adj_n1 = [n1[0] - n0[0], n1[1] - n0[1]];
	const adj_nCP = [nCP[0] - n0[0], nCP[1] - n0[1]];

	return { edge: [[0, 0], adj_n1], currentPoint: adj_nCP };
}

function rotateEdgeAndCurrent(edge, currentPoint) {
	n0 = edge[0];
	adj_n1 = edge[1];
	adj_nCP = currentPoint;

	rot_n1 = rotateToXAxis(adj_n1);
	rot_nCP = rotateToXAxis(adj_nCP);

	return { edge: [[0, 0], rot_n1], currentPoint: rot_nCP };
}

function createRectangle(edge, adj_translation) {
	rot_n0 = edge[0];
	rot_n1 = edge[1];

	top_left = [rot_n0[0], (rot_n0[1] + adj_translation)];
	bottom_left = [rot_n0[0], rot_n0[1] - adj_translation];

	top_right = [rot_n1[0], rot_n1[1] + adj_translation];
	bottom_right = [rot_n1[0], rot_n1[1] - adj_translation];

	return { tl: top_left, bl: bottom_left, tr: top_right, br: bottom_right };
}

// Non Adjusted GPS values
function findEdgeOrientation(edge) {
	n0 = edge[0];
	n1 = edge[1];

	adjuster = Math.PI / 180;
	La = n0[1] * adjuster;
	ThetaA = n0[0] * adjuster;
	Lb = n1[1] * adjuster;
	ThetaB = n1[0] * adjuster;
	DeltaL = Lb - La;
	X = Math.cos(ThetaB) * Math.sin(DeltaL);
	Y = Math.cos(ThetaA) * Math.sin(ThetaB) - Math.sin(ThetaA) * Math.cos(ThetaB) * Math.cos(DeltaL);
	Bearing = Math.atan2(X, Y);
	degrees = Bearing / adjuster;
	degrees = degrees + 360;
	degrees = degrees%360;
	return degrees;
}


function findCurrentEdge(startOfRoute, currentPoint) {
	const GPSADJUSTER = 111139;
	//Margin of Error for Metres
	const MOE_M = 15.0;

	const length = startOfRoute.length;
	var position = -1;
	var counter = 0;

	while (counter < length && position == -1) {
		var edge = startOfRoute[counter];
		adjEC = adjustEdgeAndCurrent(edge, currentPoint);
		a_edge = adjEC.edge;
		a_currentPoint = adjEC.currentPoint;
		
		rotEC = rotateEdgeAndCurrent(a_edge, a_currentPoint);
		r_edge = rotEC.edge;
		r_currentPoint = rotEC.currentPoint;

		rectangle = createRectangle(r_edge, (MOE_M / GPSADJUSTER));
		
		if (withinRectangle(rectangle, r_currentPoint)) {
			position = counter;
		}
		else{
			counter = counter + 1;
		}
	}
	return position;
}

function selectRouteStart(currentRoute,checkMax){
	counter = 0;
	startOfRoute = [];

	/*while(counter < checkMax && counter < currentRoute.length){
		edge = [currentRoute[counter].latitude,currentRoute[counter].longitude];
		startOfRoute.push(edge);
		counter = counter + 1;
	}*/
	while(counter < checkMax && counter < currentRoute.length){
		startOfRoute.push(currentRoute[counter]);
		counter = counter + 1;
	}
	return startOfRoute;
}

function convertToEdgeFormat(startOfRoute){
	counter = 0;
	arrayFormat = [];
	edgeFormat = [];

	if (startOfRoute.length > 1) {
		// convert to format [lat, long]
		while(counter < startOfRoute.length){
			edge = [startOfRoute[counter].latitude,startOfRoute[counter].longitude];
			arrayFormat.push(edge);
			counter = counter + 1;
		}

		counter = 0;
		// convert to format [[edge][edge]...], where edge = [[lat, long],[lat, long]]
		while(counter < arrayFormat.length-1){
			if(counter!=arrayFormat.length-1){
				var newEdge = [arrayFormat[counter],arrayFormat[counter+1]];
				edgeFormat.push(newEdge);
				counter = counter + 1;
			}
		}
	}

	return edgeFormat;
}

function routeIntegrity (currentDirection,currentPosition,currentRoute) {
	// Margin of Error for Orientation
	const MOE_Deg = 10.0;
	// Limit for edge check
	const CHECKMAX = 5;

	// Return variables
	var updatedRoute = [];

	var arrived = false;

	// A route is invalid if only a single GPS point.  The routing will not run and the route will be cleared(same status as arrival).
	if (currentRoute.length > 1) {

		var startOfRoute = selectRouteStart(currentRoute,CHECKMAX);

		var updatedFormat = convertToEdgeFormat(startOfRoute);

		console.log("1");
		if (updatedFormat.length > 1) {
			const position = routeTools.findCurrentEdge(updatedFormat, currentPosition);

			console.log("2 - position: ",position);
			if (position != -1) {
				// Non adjusted GPS values used here
				const edgeOrientation = routeTools.findEdgeOrientation(updatedFormat[position], (currentPosition.latitude, currentPosition.longitude));
				var diff = (Math.abs(edgeOrientation - currentDirection));
				console.log("3 - Orientation diff: ",diff);
				if ((Math.abs(edgeOrientation - currentDirection)) < MOE_Deg) {
					
					updatedRoute = currentRoute.splice(position);
					// Updating the first edge's node 0, this makes the route update smoother as some of the 
					// edges are really large which results in the route updating being jumpy.
					updatedRoute[0] = {latitude:currentPosition[0],longitude:currentPosition[1]};
				} 
			}
		}
		// Check if the current location is within the single edge, if it is, arrival has occurred.
		else if(updatedFormat.length == 1) {

			const position = routeTools.findCurrentEdge(updatedFormat, currentPosition);
			if (position == 0) {
				arrived = true;
				console.log("5");
			}
		}
	} else {
		arrived = true;
		console.log("6");
	}

	return {status : arrived, newRoute : updatedRoute};
}

const routeTools = {
	adjustPoint,
	rotateToXAxis,
	withinRectangle,
	adjustEdgeAndCurrent,
	rotateEdgeAndCurrent,
	createRectangle,
	findEdgeOrientation,
	findCurrentEdge,
	routeIntegrity,
	convertToEdgeFormat,
	selectRouteStart
};

export default routeTools;

