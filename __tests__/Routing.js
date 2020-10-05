import { 
	adjustPoint,
	rotateToXAxis,
	withinRectangle,
	adjustEdgeAndCurrent,
	rotateEdgeAndCurrent,
	createRectangle,
	findEdgeOrientation,
	findCurrentEdge
	}  from '../src/utils/RouteTools';

test('adjustPoint equals [2,2]', () => {
	expect(adjustPoint([1,1],1,1)).toStrictEqual([2,2]);
});

// Note this test fails because it is comparing 0 to 1.8369701987210297e-16
// The difference is meaningless, will need to consider bounds for precision
test('rotateToXAxis equals [3,0]', () => {
	expect(rotateToXAxis([0,3])).toStrictEqual([3,0]);
});

test('withinRectangle equals true', () => {
	expect(withinRectangle({tl:[0,2],bl:[0,0],tr:[2,2],br:[2,0]},[1,1])).toStrictEqual(true);
});

test('adjustEdgeAndCurrent equals [[1,1],[2,2]],[1,1]', () => {
	expect(adjustEdgeAndCurrent([[1,1],[2,2]],[1,1])).toStrictEqual({ edge: [[0,0], [1,1]], currentPoint: [0,0] });
});

//test('rotateEdgeAndCurrent equals ...', () => {
//	expect(rotateEdgeAndCurrent([[0,0],[-1,0]],[0,1]).toStrictEqual();
//});

test('createRectangle equals { tl: [ 0, 1 ], bl: [ 0, -1 ], tr: [ 2, 1 ], br: [ 2, -1 ] }', () => {
	expect(createRectangle([[0,0],[2,0]],1)).toStrictEqual({tl:[0,1],bl:[0,-1],tr:[2,1],br:[2,-1]});
});

test('findEdgeOrientation equals 96.51262423499946', () => {
	expect(findEdgeOrientation([[39.099912, -94.581213],[38.627089, -90.200203]])).toStrictEqual(96.51262423499946);
});

//test('findCurrentEdge equals ...', () => {
//	expect(findCurrentEdge().toStrictEqual();
//});



