require('rootpath')();
import express = require('express');
var najax = require('najax');
var jQuery = require('jquery-deferred');
var GridConvert = require('models/GridConvert');
var turf = require('turf');
var fs = require('fs');
var request = require('request');
var async = require('async');

// import ConfigurationService = require('ServerComponents/configuration/ConfigurationService');

// var config = new ConfigurationService('./configuration.json');

class Effects {    
    server_url : string = "";

    //delay in ms between polls to server
    polling_delay = 500;
    max_retries = 50;
    current_try = 0;
    // current_status = -1; 

    heights = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

    nd_array;

    public process(req, res)
    {
        this.current_try = 0;

        var calculationRequest = req.body;
        var location = calculationRequest["CalculationRequest"].FeatureLocation ? calculationRequest["CalculationRequest"].FeatureLocation : [3,53];

        console.log('sending request to effects tno practice server for model ' + calculationRequest["CalculationRequest"].ModelName + ' and location ' + location[0] + ',' + location[1]);

        switch (calculationRequest["CalculationRequest"].transformationType)
        {
            case 'isolines':
                this.createIsoLines(calculationRequest, location, res);
            break;
 
            case 'raw':
            default:
                // this might return a LOT of points
                this.createRawPoints(calculationRequest, location, res);
            break;
        }

    }

    private createRawPoints(calculationRequest, location, res)
    {
        var results = [];
        if (true) {
            async.eachSeries(this.heights, (height, next) => {
                console.log('getting for height ' + height);
                this.getModelforHeight(calculationRequest, height, (model_data) => {
                    model_data.forEach((parameter) => {
                        if (parameter["Name"] === calculationRequest["CalculationRequest"]["resultParameter"]["Name"])
                        {
                            console.log('converting to json');
                            var obj = this.convertESRIToJSON(parameter["Data"]["Value"], location);
                            var JSON = obj.data;

                            var points = this.PolygonToPoint(JSON, height);

                            this.writeFile(points, 'raw-points-height-' + height);

                            results.push({points: points, params: obj.params});
                            next();
                        }
                    });
                });
            }, (error) => {
                console.log('promises for points done');
                var combined_features = [];
                var gridparams = [];
                results.forEach(result => {
                    gridparams.push(result.params);
                    combined_features = combined_features.concat(result.points.features);
                });
                var fc = turf.featureCollection(combined_features);
                this.writeFile(fc, 'raw-points-all');
                res.send(fc);
            });
        } 
    }

    private createIsoLines(calculationRequest, location, res)
    {
        var results = [];
        async.eachSeries(this.heights, (height, next) => {
            console.log('getting for height ' + height);
            this.getModelforHeight(calculationRequest, height, (model_data) => {
                model_data.forEach((parameter) => {
                    if (parameter["Name"] === calculationRequest["CalculationRequest"]["resultParameter"]["Name"])
                    {
                        console.log('converting to json');
                        var obj = this.convertESRIToJSON(parameter["Data"]["Value"], location, true);
                        var JSON = obj.data;

                        var isolines = this.convertToIsoLines(JSON, height);
                        results.push(isolines);
                        next();
                    }
                });
            });
        }, (error) => {
            console.log('promises done');
            var combined_features = [];
            results.forEach(result => {
                combined_features = combined_features.concat(result.features);
            });

            res.send(turf.featureCollection(combined_features));
        });
    }

    private convertToIsoLines(JSON, height)
    {
        var points = this.PolygonToPoint(JSON);
        if (points["features"].length === 0)
            return turf.featureCollection();

        console.log('jenks natural breaks algorithm');
        var breaks = turf.jenks(points, 'v', 10);

        console.log(breaks);

        console.log('isolines calculation');
        var isolines = turf.isolines(points, 'v', 90, breaks);

        // override featuretype and height
        isolines["features"].forEach((f: IFeature) => {
            f.properties["FeatureTypeId"] = "transform_test_linestring";
            f.geometry.coordinates.forEach(c => {
                c[2] = height;
            });
        });
        console.log('done');

        return isolines;
    }

    private PolygonToPoint(JSON, height: number = 0)
    {
        console.log('polygon to point conversion');
        var result = [];

        JSON["fc"]["features"].forEach(f => {
            if (f.properties['v'] !== -1e+300)
            {
                var centroid = turf.centroid(f);
                centroid.properties = f.properties;

                // override featuretype and height
                centroid.geometry.coordinates[2] = height;
                centroid.properties['uniform_z'] = height;

                result.push(centroid);
            }
        });

        return turf.featureCollection(result);
    }

    private convertESRIToJSON(esri: string, location, toUniformGrid: boolean = false)
    {
        var gc = new GridConvert();
        var obj = gc.convert(esri, location, toUniformGrid);
        return obj;
    }

    private getModelforHeight(calculationRequest: Object, height: number, callback)
    {
        var calculation_request = this.createCalculationRequestObject(calculationRequest, height);

        async.waterfall([
            (callback_request) => { this.sendCalculateRequest(calculation_request, callback_request); },
            (calculation_id, callback_status) => { this.waitUntilDone(calculation_id, callback_status); },
            (calculation_id, callback_results) => { this.getResults(calculation_id, callback_results); }
        ], (error, results) => { callback(results); });
    }

    public processModels(req: Express.Request, res)
    {
        this.getModelNames((error, model_names) => {
            res.send(model_names);
        });
    }

    public getModelNames(callback)
    {
        request
            .get(this.server_url + "Models",
            (error, response, body) => {
                if (error) console.log(error);

                if (response.statusCode === 200)
                    callback(null, JSON.parse(body));
            });
    }

    public processModel(req, res)
    {
        var modelName = req.query.name ? req.query.name : "";

        console.log('parameters requested for ' + modelName);
        this.getModelParameters(modelName, (error, model_parameters) => {
            res.send(model_parameters);
        });
    }

    private waitUntilDone(calculation_id, callback)
    {
        this.current_try = 0;
        console.log('wait until done');
        var m_object = this;
        async.during(
            (callback_test) => { setTimeout(function(){ m_object.getStatus(calculation_id, callback_test) }, this.polling_delay); },
            (callback_sleep) => { setTimeout(callback_sleep, this.polling_delay); },
            (error) => {
                 if (error) console.log(error);
                 callback(null, calculation_id);
            }
        )
    }    
    
    private writeFile(fc, name)
    {
        if (fc !== undefined) {
            var filename = './public/data/projects/effects/' + name + '.json';

            fs.writeFileSync(filename, JSON.stringify(fc));
            console.log('written to file ' + name);
        }
    }
    
    private getStatus(calculation_id: string, callback)
    {
        console.log('sleeping.. try ' + this.current_try++);

        request 
            .get(this.server_url + "Calculations/Status?guid={" + calculation_id + "}",
            (error, response, body) => {
                if (error) console.log(error);
                if (response.statusCode === 200)
                {
                    var object = JSON.parse(body);
                    // this.current_status = object["Status"]["Status"];
                    callback(null, object["Status"]["Status"] < 2);
                }
            });
    } 


    private getModelParameters(modelName: string, callback)
    {
        console.log('getting model parameter object');
        request
            .get(this.server_url + "Models/Parameters?Name=" + modelName,
            (error, response, body) => {
                if (error || response.statusCode === 500) console.log(error);

                callback(null, body);
            });
    }

    private createCalculationRequestObject(calculationRequest: Object, height: number) : Object {
        calculationRequest["CalculationRequest"]["Parameters"].forEach(parameter => {
            if (parameter["Name"] === "Z coordinate of study")
                parameter["Data"]["Value"] = height;
        });
        return calculationRequest;
    }

    private sendCalculateRequest(calculationRequest, callback)
    {
        console.log('sending calculation request');

        request.post({
                url: this.server_url + "Calculations/Start",
                body: JSON.stringify(calculationRequest)
            },
            (error, response, body) => {
                if (error) console.log(error);

                var object = JSON.parse(body);

                callback(null, object["Status"]["ID"]);
            });
    }

    private getResults(calculationId: string, callback)
    {
        console.log('getting results');

        request
            .get(this.server_url + "Calculations/Result?guid={" + calculationId + "}",
            (error, response, body) => {
                if (error) console.log(error);
                if (response.statusCode === 200)
                {
                    var object = JSON.parse(body);
                    var result = object["Result"];
                    callback(null, result["Parameters"]);
                }
            });
    }
}
export = Effects;
