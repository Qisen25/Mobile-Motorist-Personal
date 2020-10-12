import routeTools from "../src/utils/RouteTools";

//========================================================
//FUNCTION: convertToEdgeFormat
//CASE: convert a section of points into a section of edges.
//RESULT: the points are formed into edges in the format [[n0,n1],[n1,n2],...]
test('selectRouteStart', () => {					
	var currentRoute = [
							{latitude:1,longitude:1},{latitude:2,longitude:2},{latitude:3,longitude:3},
							{latitude:4,longitude:4},{latitude:5,longitude:5},{latitude:6,longitude:6},
							{latitude:7,longitude:7}
						];

	var startRoute = 	[
							[[1,1],[2,2]],
							[[2,2],[3,3]],
							[[3,3],[4,4]],
							[[4,4],[5,5]],
						];
	expect(routeTools.selectRouteStart(currentRoute,5)).toStrictEqual(startRoute);
});
//========================================================
//FUNCTION: convertToEdgeFormat
//CASE: convert a section of points into a section of edges.
//RESULT: the points are formed into edges in the format [[n0,n1],[n1,n2],...]
test('convertToEdgeFormat', () => {					
	var testRoute = [
						[-31.900476, 115.783005], [-31.899899, 115.781279], [-31.89992, 115.781263], [-31.89995, 115.781132], [-31.89985, 115.781049]
					];
	var correctRoute = 	[
							[[-31.900476, 115.783005],[-31.899899, 115.781279]],
							[[-31.899899, 115.781279],[-31.89992, 115.781263]],
							[[-31.89992, 115.781263],[-31.89995, 115.781132]],
							[[-31.89995, 115.781132],[-31.89985, 115.781049]]
						];

	expect(routeTools.convertToEdgeFormat(testRoute)).toStrictEqual(correctRoute);
});
//========================================================
//FUNCTION: routeIntegrity
//CASE: NoRoute
//RESULT: returns empty route
test('routeIntegrity equals []', () => {
	expect(routeTools.routeIntegrity((0,0),0.0,[])).toStrictEqual([]);
});

//CASE: Route, but not following
//RESULT: returns empty route
//MOCK: routeTools.findCurrentEdge
test('routeIntegrity equals []', () => {
	var currentRoute = [{latitude:1,longitude:1},{latitude:2,longitude:2},{latitude:3,longitude:3},{latitude:4,longitude:4},{latitude:5,longitude:5}];
	var currentPosition = (20,20);
	
	origFindCurrentEdge = routeTools.findCurrentEdge;

	routeTools.findCurrentEdge = jest.fn().mockReturnValue(-1);
	expect(routeTools.routeIntegrity(currentPosition,0.0,currentRoute)).toStrictEqual([]);

	routeTools.findCurrentEdge = origFindCurrentEdge;	
});

//CASE: Route and following but incorrect orientation
//RESULT: returns empty route
//MOCK: routeTools.findCurrentEdge, routeTools.findEdgeOrientation
test('routeIntegrity equals []', () => {
	var currentRoute = [{latitude:1,longitude:1},{latitude:2,longitude:2},{latitude:3,longitude:3},{latitude:4,longitude:4},{latitude:5,longitude:5}];
	var currentPosition = (1.5,1.5);
	
	origFindCurrentEdge = routeTools.findCurrentEdge;
	origFindEdgeOrientation = routeTools.findEdgeOrientation;

	routeTools.findCurrentEdge = jest.fn().mockReturnValue(0);
	routeTools.findEdgeOrientation = jest.fn().mockReturnValue(20);
	expect(routeTools.routeIntegrity(currentPosition,0.0,currentRoute)).toStrictEqual([]);

	routeTools.findCurrentEdge = origFindCurrentEdge;
	routeTools.findEdgeOrientation = origFindEdgeOrientation;
});

//CASE: Route and following and correct orientation
//RESULT: returns shrunk route
//MOCK: routeTools.findCurrentEdge, routeTools.findEdgeOrientation
test('routeIntegrity equals []', () => {
	var currentRoute = [{latitude:1,longitude:1},{latitude:2,longitude:2},{latitude:3,longitude:3},{latitude:4,longitude:4},{latitude:5,longitude:5}];
	var currentPosition = (1.5,1.5);

	origFindCurrentEdge = routeTools.findCurrentEdge;
	origFindEdgeOrientation = routeTools.findEdgeOrientation;

	routeTools.findCurrentEdge = jest.fn().mockReturnValue(0);
	routeTools.findEdgeOrientation = jest.fn().mockReturnValue(1);
	expect(routeTools.routeIntegrity(currentPosition,0.0,currentRoute)).toStrictEqual([{latitude:1,longitude:1},{latitude:2,longitude:2},{latitude:3,longitude:3},{latitude:4,longitude:4},{latitude:5,longitude:5}]);
	
	routeTools.findCurrentEdge = origFindCurrentEdge;
	routeTools.findEdgeOrientation = origFindEdgeOrientation;
});
//========================================================
//FUNCTION: adjustPoint
//CASE: adjusting an arbitrary cartesian point.
//RESULT: the point is translated correctly in the x and y dimensions.
 test('adjustPoint equals [2,2]', () => {
 	expect(routeTools.adjustPoint([1,1],1,1)).toStrictEqual([2,2]);
 });
//========================================================
//FUNCTION:rotateToXAxis 
//CASE: an arbitrary point is rotated to align with the x axis.
//RESULT: the point is rotated to be on the x axis.
test('rotateToXAxis equals [3,0]', () => {
	expect(routeTools.rotateToXAxis([-3,0])[0]).toStrictEqual(3);
	expect(routeTools.rotateToXAxis([-3,0])[1]).toBeCloseTo(0);
});
//========================================================
//FUNCTION: withinRectangle
//CASE: check whether  an arbitrary point is within a rectangle
//RESULT: the point is determined to be within the rectangle.
test('withinRectangle equals true', () => {
	 expect(routeTools.withinRectangle({tl:[0,2],bl:[0,0],tr:[2,2],br:[2,0]},[1,1])).toStrictEqual(true);
});

//FUNCTION: withinRectangle
//CASE: check whether  an arbitrary point is not within a rectangle
//RESULT: the point is determined to be outside the rectangle
test('withinRectangle equals false', () => {
	expect(routeTools.withinRectangle({tl:[0,2],bl:[0,0],tr:[2,2],br:[2,0]},[3,3])).toStrictEqual(false);
});

//========================================================
//FUNCTION: adjustEdgeAndCurrent
//CASE: adjuste the values of an edge and point, so they are all on an x-y plane with the
// first node of the edge acting as the origin.
//RESULT: the values of the first node of the  edge are subtracted from the values of the second node, and the point.
test('adjustEdgeAndCurrent equals [[1,1],[2,2]],[1,1]', () => {
 	expect(routeTools.adjustEdgeAndCurrent([[1,1],[2,2]],[1,1])).toStrictEqual({ edge: [[0,0], [1,1]], currentPoint: [0,0] });
});

//========================================================
//FUNCTION: rotateEdgeAndCurrent
//CASE: rotate an adjusted edge and point so they are both rotated to fall on the positive x-axis.
//RESULT: the edge and point fall on the positive x axis.
test('rotateEdgeAndCurrent equals { edge: [[0, 0], [4.2426,0]], currentPoint: [4.2426,0] }', () => {
	expect(routeTools.rotateEdgeAndCurrent([[0,0],[-3,3]],[-3,3]).edge[0]).toStrictEqual([0, 0]);
	expect(routeTools.rotateEdgeAndCurrent([[0,0],[-3,3]],[-3,3]).edge[1][0]).toBeCloseTo(4.2426)
	expect(routeTools.rotateEdgeAndCurrent([[0,0],[-3,3]],[-3,3]).edge[1][1]).toBeCloseTo(0)
	expect(routeTools.rotateEdgeAndCurrent([[0,0],[-3,3]],[-3,3]).currentPoint[0]).toBeCloseTo(4.2426)
	expect(routeTools.rotateEdgeAndCurrent([[0,0],[-3,3]],[-3,3]).currentPoint[1]).toBeCloseTo(0)
});
//========================================================
//FUNCTION: createRectangle
//CASE: create an aribtrary rectangle.
//RESULT: a rectangle is created from the edge using the translation value.
test('createRectangle equals { tl: [ 0, 1 ], bl: [ 0, -1 ], tr: [ 2, 1 ], br: [ 2, -1 ] }', () => {
 	expect(routeTools.createRectangle([[0,0],[2,0]],1)).toStrictEqual({tl:[0,1],bl:[0,-1],tr:[2,1],br:[2,-1]});
});
//========================================================
//FUNCTION: findEdgeOrientation
//CASE: find the angle between an edge of two arbitrary gps coordinates.
//RESULT: the correct angle between the two gps points is determined.
test('findEdgeOrientation equals 96.51262423499946', () => {
	 expect(routeTools.findEdgeOrientation([[39.099912, -94.581213],[38.627089, -90.200203]])).toStrictEqual(96.51262423499946);
});
//========================================================
//FUNCTION: findCurrentEdge
//CASE: find the edge of a route which a specified gps point falls within. (First valid edge)
//RESULT: the point is found within the first edge.
test('findCurrentEdge equals ...', () => {
	var testRoute = [
						[[-31.950867800462632,115.83314710686174],[-31.95171441657448,115.8322566134688]],
						[[-31.95171441657448,115.8322566134688],[-31.952333442771934,115.83144122192827]],
						[[-31.952333442771934,115.83144122192827],[-31.953116322871416,115.83067947456804]],
						[[-31.953116322871416,115.83067947456804],[-31.953862783729196,115.82966023514238]],
						[[-31.953862783729196,115.82966023514238],[-31.955009772737842,115.82844787666765]],
						[[-31.955009772737842,115.82844787666765],[-31.955492232089128,115.82792216370073]],
						[[-31.955492232089128,115.82792216370073],[-31.9564025258504,115.82675272057024]],
						[[-31.9564025258504,115.82675272057024],[-31.95747666088493,115.82554036209551]],
					]
	//Within edge 0
	var edge_number = 0;
	//Find half way between the edge points in terms of latitude
	//(node1.x-node0.x)/2
	var difference = (testRoute[edge_number][1][0]-testRoute[edge_number][0][0])/2
	//Create a test point that will be midway between the selected edge
	var testPoint = [testRoute[edge_number][0][0]+difference,testRoute[edge_number][0][1]];
	
	expect(routeTools.findCurrentEdge(testRoute,testPoint,5)).toStrictEqual(edge_number);
});
//========================================================
//FUNCTION: findCurrentEdge
//CASE: find the edge of a route which a specified gps point falls within. (within last valid edge)
//RESULT: the point is found within the last valid edge.  Valid meaning  the highest edge number
// that the algorithm will consider checking.
test('findCurrentEdge equals ...', () => {
	var testRoute = [
						[[-31.950867800462632,115.83314710686174],[-31.95171441657448,115.8322566134688]],
						[[-31.95171441657448,115.8322566134688],[-31.952333442771934,115.83144122192827]],
						[[-31.952333442771934,115.83144122192827],[-31.953116322871416,115.83067947456804]],
						[[-31.953116322871416,115.83067947456804],[-31.953862783729196,115.82966023514238]],
						[[-31.953862783729196,115.82966023514238],[-31.955009772737842,115.82844787666765]],
						[[-31.955009772737842,115.82844787666765],[-31.955492232089128,115.82792216370073]],
						[[-31.955492232089128,115.82792216370073],[-31.9564025258504,115.82675272057024]],
						[[-31.9564025258504,115.82675272057024],[-31.95747666088493,115.82554036209551]],
					]
	//Within edge 4
	var edge_number = 4;
	//Find half way between the edge points in terms of latitude
	//(node1.x-node0.x)/2
	var difference = (testRoute[edge_number][1][0]-testRoute[edge_number][0][0])/2
	//Create a test point that will be midway between the selected edge
	var testPoint = [testRoute[edge_number][0][0]+difference,testRoute[edge_number][0][1]];
	
	expect(routeTools.findCurrentEdge(testRoute,testPoint,5)).toStrictEqual(edge_number);
});
//========================================================
//FUNCTION: findCurrentEdge
//CASE: find the edge of a route which a specified gps point falls within. (within invalid edge)
//RESULT: although the point falls within an edge it is not found as 
// the edge is not valid
test('findCurrentEdge equals ...', () => {
	var testRoute = [
						[[-31.950867800462632,115.83314710686174],[-31.95171441657448,115.8322566134688]],
						[[-31.95171441657448,115.8322566134688],[-31.952333442771934,115.83144122192827]],
						[[-31.952333442771934,115.83144122192827],[-31.953116322871416,115.83067947456804]],
						[[-31.953116322871416,115.83067947456804],[-31.953862783729196,115.82966023514238]],
						[[-31.953862783729196,115.82966023514238],[-31.955009772737842,115.82844787666765]],
						[[-31.955009772737842,115.82844787666765],[-31.955492232089128,115.82792216370073]],
						[[-31.955492232089128,115.82792216370073],[-31.9564025258504,115.82675272057024]],
						[[-31.9564025258504,115.82675272057024],[-31.95747666088493,115.82554036209551]],
					]
	//Within edge 5
	var edge_number = 5;
	//Find half way between the edge points in terms of latitude
	//(node1.x-node0.x)/2
	var difference = (testRoute[edge_number][1][0]-testRoute[edge_number][0][0])/2
	//Create a test point that will be midway between the selected edge
	var testPoint = [testRoute[edge_number][0][0]+difference,testRoute[edge_number][0][1]];
	
	expect(routeTools.findCurrentEdge(testRoute,testPoint,5)).toStrictEqual(-1);
});
//========================================================
//FUNCTION: findCurrentEdge
//CASE: find the edge of a route which a specified gps point falls within. (not in any edge)
//RESULT: although the point falls within an edge it is not found as 
// the edge is not valid
test('findCurrentEdge equals ...', () => {
	var testRoute = [
						[[-31.950867800462632,115.83314710686174],[-31.95171441657448,115.8322566134688]],
						[[-31.95171441657448,115.8322566134688],[-31.952333442771934,115.83144122192827]],
						[[-31.952333442771934,115.83144122192827],[-31.953116322871416,115.83067947456804]],
						[[-31.953116322871416,115.83067947456804],[-31.953862783729196,115.82966023514238]],
						[[-31.953862783729196,115.82966023514238],[-31.955009772737842,115.82844787666765]],
						[[-31.955009772737842,115.82844787666765],[-31.955492232089128,115.82792216370073]],
						[[-31.955492232089128,115.82792216370073],[-31.9564025258504,115.82675272057024]],
						[[-31.9564025258504,115.82675272057024],[-31.95747666088493,115.82554036209551]],
					]

	//Create a test point that will be midway between the selected edge
	var testPoint = [-32,116];
	expect(routeTools.findCurrentEdge(testRoute,testPoint,5)).toStrictEqual(-1);
});



