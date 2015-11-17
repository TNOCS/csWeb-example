start /B code .
start /B code ../csWeb/csComp
start /B code ../csWeb/csServerComp
WHERE /q conemuc	
IF ERRORLEVEL 1 (
	ECHO ConEmuC wasn't found. Please add me to your path. 
	EXIT /B
)
start 							   conemuc /c tsc -w -new_console:t:"TSC Example" 
start cd ../csWeb/csComp 		&& conemuc /c tsc -w -new_console:t:"TSC csComp" 
start cd ../csWeb/csServerComp  && conemuc /c tsc -w -new_console:t:"TSC csServerComp" 
start conemuc /c gulp -new_console:t:"GULP Example" 
start conemuc /c nodemon server.js -new_console:t:"NODEMON" 
:end
start http://localhost:3002
