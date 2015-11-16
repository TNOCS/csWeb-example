# csWeb-example
Example project that can be used to quick start a new csWeb application. Fork me and roll-your-own app to get started.

Source code, Wiki's and issue tracker can all be found [here](https://github.com/TNOCS/csWeb).

## Getting started

Install all dependencies, compile and run node:
``` 
npm i
cd public && bower i
tsc
node server.js
``` 

### For developers 

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

