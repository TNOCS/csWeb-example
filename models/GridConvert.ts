require('rootpath')();
var turf = require('turf');

interface IProperty {
    [key: string]: any; //string | number | boolean;
}

interface IGridDataSourceParameters extends IProperty {
    /**
     * Grid type, for example 'custom' (default) or 'esri' ASCII Grid
     */
    gridType: string,
    /**
     * Projection of the ESRI ASCII GRID
     */
    projection: string,
    /**
     * Property name of the cell value of the generated json.
     */
    propertyName: string,
    /**
     * Skip a comment line when it starts with this character
     */
    commentCharacter?: string,
    /**
     * Character that separates cells. Default is space.
     */
    separatorCharacter?: string,
    /**
     * Skip a number of lines from the start.
     */
    skipLines?: number,
    /**
     * Skip a number of lines after a comment block ends.
     */
    skipLinesAfterComment?: number,
    /**
     * Skip a number of spaces from the start of the line.
     */
    skipSpacesFromLine?: number,
    /**
     * Number of grid columns.
     */
    columns: number,
    /**
     * Number of grid rows.
     */
    rows: number,
    /**
     * Start latitude in degrees.
     */
    startLat: number,
    /**
     * Start longitude in degrees.
     */
    startLon: number,
    /**
     * Add deltaLat after processing a grid cell.
     * NOTE: When the direction is negative, use a minus sign e.g. when counting from 90 to -90..
     */
    deltaLat: number,
    /**
     * Add deltaLon degrees after processing a grid cell.
     */
    deltaLon: number,
    /**
     * Skip a first column, e.g. containing the latitude degree.
     */
    skipFirstColumn?: boolean,
    /**
     * Skip a first row, e.g. containing the longitude degree.
     */
    skipFirstRow?: boolean,
    /**
     * When the cell value is below this threshold, it is ignored.
     */
    minThreshold?: number,
    /**
    * When the cell value is above this threshold, it is ignored.
     */
    maxThreshold?: number,
    /**
     * The input values to be NoData in the output raster. Optional. Default is -9999.
     */
    noDataValue: number
}

interface IGeoFeature {
    type: string;
    geometry: {
        type: string;
        coordinates: Array<number> | Array<Array<number>> | Array<Array<Array<number>>>
    };
    properties: Object
}

interface IGeoFeatureCollection {
    type: string;
    features: IGeoFeature[]
}

class GridConvert {
    gridParams: IGridDataSourceParameters;

    public convert(esri, location, toUniformGrid)
    {
        var x : number = parseFloat(location[0]);
        var y : number = parseFloat(location[1]);

        this.gridParams = <IGridDataSourceParameters> {};

        this.convertEsriHeaderToGridParams(esri, x, y, 1);
        if (toUniformGrid)
        {
            this.gridParams.startLon = -0.5;
            this.gridParams.startLat = -0.5;
            this.gridParams.deltaLon = 1;
            this.gridParams.deltaLat = 1;
        }
        console.log(this.gridParams);

        var data = this.convertDataToGeoJSON(esri, this.gridParams);

        return {data: data, params: this.gridParams};
    }

    public convertEsriHeaderToGridParams(data: string, override_x = -1, override_y = -1, override_delta = 1) {
        const regex = /(\S*)\s*([\d-.]*)/;

        var lines = data.split('\n', 6);
        var x: number,
            y: number;

        var isCenter = false;
        this.gridParams.skipLines = 0;
        lines.forEach(line => {
            var matches = line.match(regex);
            if (matches.length !== 3) return;
            this.gridParams.skipLines++;
            var value = +matches[2];
            switch (matches[1].toLowerCase()) {
                case 'ncols':
                    // Number of cell columns. Integer greater than 0.
                    this.gridParams.columns = value;
                    break;
                case 'nrows':
                    // Number of cell rows. Integer greater than 0.
                    this.gridParams.rows = value;
                    break;
                case 'xllcorner':
                    x = value;
                    // X coordinate of the origin (by lower left corner of the cell).
                    break;
                case 'yllcorner':
                    y = value;
                    // Y coordinate of the origin (by lower left corner of the cell).
                    break;
                case 'xllcenter':
                    // X coordinate of the origin (by center corner of the cell).
                    x = value;
                    isCenter = true;
                    break;
                case 'yllcenter':
                    // Y coordinate of the origin (by center corner of the cell).
                    y = value;
                    isCenter = true;
                    break;
                case 'cellsize':
                    // Cell size. Greater than 0.    
                    this.gridParams.deltaLon = 1;
                    this.gridParams.deltaLat = 1;
                    
                    break;
                case 'nodata_value':
                    // The input values to be NoData in the output raster. Optional. Default is -9999.
                    this.gridParams.noDataValue = value;
                    break;
            }
        });
        if (override_x !== -1)
            x = override_x;
        if (override_y !== -1)
            y = override_y;
          
        var point = turf.point([x, y]);

        // convert delta lat/lon to meters
        var point_east = turf.destination(point, this.gridParams.deltaLon / 1000, 90, 'kilometers');
        var point_north = turf.destination(point, this.gridParams.deltaLat / 1000, 0, 'kilometers');
   
        this.gridParams.deltaLon = point_east.geometry.coordinates[0] - point.geometry.coordinates[0];
        this.gridParams.deltaLat = point_north.geometry.coordinates[1] - point.geometry.coordinates[1];

        if (isCenter) {
            this.gridParams.startLon = x - this.gridParams.deltaLon / 2;
            this.gridParams.startLat = y - this.gridParams.deltaLat / 2;
        } else {
            this.gridParams.startLon = x;
            this.gridParams.startLat = y - this.gridParams.deltaLat;
        }
        
        switch (this.gridParams.projection || 'wgs84') {
            case 'wgs84':
                break;
            default:
                throw new Error('Current projection is not supported!')
                break;
        }
    }

    public createPolygonFeature(coordinates: Array<Array<Array<number>>>, properties: Object): IGeoFeature {
        if (coordinates === null) throw new Error('No coordinates passed');
        for (var i = 0; i < coordinates.length; i++) {
            var ring = coordinates[i];
            for (var j = 0; j < ring[ring.length - 1].length; j++) {
                if (ring.length < 4) {
                    new Error('Each LinearRing of a Polygon must have 4 or more Positions.');
                }
                if (ring[ring.length - 1][j] !== ring[0][j]) {
                    new Error('First and last Position are not equivalent.');
                }
            }
        }

        var polygon: IGeoFeature = {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": coordinates
            },
            "properties": properties
        };

        if (!polygon.properties) {
            polygon.properties = {};
        }

        return polygon;
    }

    /**
     * Takes one or more {@link Feature|Features} and creates a {@link FeatureCollection}.
     *
     * @param {Feature[]} features input features
     * @returns {FeatureCollection} a FeatureCollection of input features
     * @example
     * var features = [
     *  turf.point([-75.343, 39.984], {name: 'Location A'}),
     *  turf.point([-75.833, 39.284], {name: 'Location B'}),
     *  turf.point([-75.534, 39.123], {name: 'Location C'})
     * ];
     *
     * var fc = turf.featurecollection(features);
     *
     * @seealso https://github.com/Turfjs/turf-featurecollection/blob/master/index.js
     */
    public createFeatureCollection(features: IGeoFeature[]): IGeoFeatureCollection {
        return {
            type: "FeatureCollection",
            features: features
        };
    }

    public convertDataToGeoJSON(data: string, gridParams: IGridDataSourceParameters): {fc: IGeoFeatureCollection, desc: string} {
        var propertyName = gridParams.propertyName || "v";
        var noDataValue  = gridParams.noDataValue || -9999;

        var skipLinesAfterComment = gridParams.skipLinesAfterComment,
            skipSpacesFromLine    = gridParams.skipSpacesFromLine,
            skipFirstRow          = gridParams.skipFirstRow || false,
            skipFirstColumn       = gridParams.skipFirstColumn || false;

        var separatorCharacter    = gridParams.separatorCharacter || ' ',
            splitCellsRegex       = new RegExp("[^"+ separatorCharacter +"]+","g");

        var deltaLon = gridParams.deltaLon,
            deltaLat = gridParams.deltaLat,
            lat = gridParams.startLat,
            lon = gridParams.startLon;

        var uniformStartLon = 0;
        var uniformStartLat = 0;
        var uniformDeltaLon = 1;
        var uniformDeltaLat = 1;

        var features: IGeoFeature[] = [];

        var lines = data.split('\n');
        if (gridParams.skipLines) lines.splice(0, gridParams.skipLines);
        var uniformLat = uniformStartLat;
        var rowsToProcess = gridParams.rows || Number.MAX_VALUE;
        lines.forEach((line) => {
            if (gridParams.commentCharacter)
                if (line.substr(0, 1) === gridParams.commentCharacter) {
                    console.log(line);
                    return;
                }

            if (skipLinesAfterComment && skipLinesAfterComment > 0) {
                skipLinesAfterComment--;
                return;
            }

            if (skipFirstRow) {
                skipFirstRow = false;
                return;
            }
            rowsToProcess--;
            if (rowsToProcess < 0) return;

            var cells: RegExpMatchArray;
            if (skipSpacesFromLine)
                cells = line.substr(skipSpacesFromLine).match(splitCellsRegex);
            else
                cells = line.match(splitCellsRegex);

            if (skipFirstColumn && cells.length > 1) cells = cells.splice(1);

            if (!cells || (!gridParams.skipFirstColumn && cells.length < gridParams.columns)) return;

            lon = gridParams.startLon;
            var uniformLon = uniformStartLon;
            

            var minThreshold = gridParams.minThreshold || -Number.MAX_VALUE,
                maxThreshold = gridParams.maxThreshold || Number.MAX_VALUE;
            cells.forEach((n) => {
                var value = +n;
                if (value !== noDataValue && minThreshold <= value && value <= maxThreshold) {
                    var tl = [lon, lat + deltaLat],
                        tr = [lon + deltaLon, lat + deltaLat],
                        bl = [lon, lat],
                        br = [lon + deltaLon, lat],
                        result: IProperty = { };
                        result[propertyName] = value;
                        result['uniform_lon'] = uniformLon;
                        result['uniform_lat'] = uniformLat;

                    var pg = this.createPolygonFeature([[tl, tr, br, bl, tl]], result);
                    features.push(pg);
                }
                lon += deltaLon;
                uniformLon += 1;
                if (lon > 180) lon -= 360;
            });
            lat += deltaLat;
            uniformLat += 1;
        });

        var desc = "# Number of features above the threshold: " + features.length + ".\r\n";
        return {
            fc: this.createFeatureCollection(features),
            desc: desc
        };
    }
}

export = GridConvert;
