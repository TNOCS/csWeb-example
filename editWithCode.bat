start /B code .
start /B code ../csWeb
start tsc -p ../csWeb
start tsc -w 
start nodemon server
cd ../csWeb/
gulp watch