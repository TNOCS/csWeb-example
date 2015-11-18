start /B code .
start /B code ../csWeb/csComp
start /B code ../csWeb/csServerComp
start tsc -p ../csWeb/csServerComp -w
start tsc -p ../csWeb/csComp -w
start tsc -w
start nodemon server
cd ../csWeb/
gulp