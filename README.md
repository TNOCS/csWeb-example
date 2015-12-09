# csWeb-example
Example project that can be used to quick start a new csWeb application. Fork me and roll-your-own app to get started.

Source code, Wiki's and issue tracker can all be found [here](https://github.com/TNOCS/csWeb).

# Getting started

## Tools of the trade
We need a few tools to get you going. First of all, install [node](https://nodejs.org). We are currently using version 4, and if you're on Windows, please install the msi package, as this will install the node package manager (npm) too. Currently (Dec 2015), node installs with npm version 2, but we need 3. Check your version (```npm -v```) and if you're still on version 2, update it to the latest version with
```
npm i -g npm@latest
```
When you have node and npm installed, install typescript (to compile the TypeScript sources to javascript).
```
npm i -g typescript
```
Optionally, you may also install ```nodemon``` and/or ```http-server``` to run a local web server that serves your files. The first as it continuously watches your files and restarts when something changes. The second to run the application stand-alone (without the node server - this is useful if you wish to share your application on a public html folder without running a server). 
```
npm i -g nodemon http-server
```
Finally, although you can use any text editor to edit the project, we use the free and open source [Visual Studio Code](https://code.visualstudio.com/Download), available for Windows, Linux and Mac.

## Getting the code
First, get the code in a local folder of your choice, either by forking this project or by downloading the zip file and unpacking it in a folder. Next, install all dependencies, compile and run node:
``` 
npm i
cd public && bower i
cd ..
tsc -p .
node server.js
``` 
Alternatively, replace the last command with ```nodemon server.js``` or go to the public folder and run ```http-server .```.

Visit ```http://localhost:3003``` to see the application running.

## Configuring the application
If everything went well, you should now have your application up and running. However, most likely you don't want to call your application csWeb-example, so here are a few steps to make the app your own.

### Change the project name

In your project, edit public/data/projects/projects.json and replace the projects property with the following (you can load multiple projects, but for now, let's start with just one - optionally, you can leave the others so you can switch between them and see more examples of what is possible):
```
    "projects": [{
        "title": "MY_TITLE",
        "url": "data/projects/MY_PROJECT_DATA/project.json",
        "dynamic": true
    }]
```
Where MY_TITLE and MY_PROJECT_DATA should be replaced with your names. You also need to rename the existing folder, named MY_PROJECT_DATA, to the folder name you selected.

### Change the project file

Edit ```data/projects/MY_PROJECT_DATA/project.json``` and (search and) replace MY_TITLE, and MY_PROJECT_DATA. Optionally, you can also replace the logo property.

### Change the project's map layers

By now, you should be able to reload your application in the browser and see your title. However, the data is still the same as before. Edit ```data/projects/MY_PROJECT_DATA/project.json``` and look for ```groups``` and ```layers```. The ```group``` represents a group of map layers. Edit its id, description, title. Next, edit the layers that belong in this group (note that all styling, filtering, and clustering operations are performed on a group level). For each layer, specify its id, title, description, and reference to the GEOJSON data (we also support KML, topojson, and grid files - see the other project.json files for examples). You can visit [geojson.io](geojson.io) to create a GEOJSON file manually.

### Making it look pretty - manual editing

A GEOJSON file only contains data (as key-value pairs in the properties field). To make it look pretty, we specify exactly how each feature should be displayed when selected, as well as each feature's property. The layer's ```typeUrl``` specifies the markup that is being used, and the ```defaultFeatureType``` specifies the default feature type that is used (unless overruled when a feature has a property named ```featureTypeId```).

So go to the ```data/resourceTypes``` folder and start editing ```POLYGON_FEATURE.json``` and ```POINT_FEATURE.json```. Each key in ```featureTypes``` refers to the ```defaultFeatureType``` (or ```featureTypeId```) in the ```project.json``` file. Replace its ```name```, ```iconUri```, ```nameLabel``` (refers to the feature's property that contains its name, which is shown upon hovering) and ```propertyTypeKeys```. The latter requires some explanation: A feature can have many properties. However, we only display those that you explicitly reference in the ```propertyTypeKeys```.

Finally, you can edit each the style that is used for each property. Edit the appropriate key in the ```propertyTypeData```, where the ```label``` refers to the property key in the data (e.g. ```people``` when you have a property ```"feature.properties.people": 5000``` in the data file), its ```title```, type (e.g. ```text, textarea, number, boolean, options```). For ```number```, you may specify the ```stringFormat``` (using the [.NET syntax](http://blog.stevex.net/string-formatting-in-csharp)).

For more information on ```FeatureType``` and ```PropertyType``` formats, see the [csWeb page](https://github.com/TNOCS/csWeb/wiki/FeatureType-and-PropertyType-format).
 
### Making it look pretty - using the integrated style editor

Switch to ```admin mode``` (using the top right icon, showing a user with a bookcase), and click on the gear icon to edit a style.
TODO...

## For developers 

If you wish to change the underlying csWeb framework, you also need to checkout [csWeb](https://github.com/TNOCS/csWeb). In csWeb, create npm and bower links, which you can subsequently use in csWeb-example.

I assume that csWeb-example and csWeb share the same parent folder. In csWeb, do the following:

```
gulp init
bower link
cd dist-npm && npm link
```

And in csWeb-example, run:

``` 
npm link csweb
cd public && bower link csweb
tsc
node server.js
```

