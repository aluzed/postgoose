const fs = require('fs');
const extract = require('extract-comments');

function ForRouter(pathToFile) {
  let fileContent = "";
  let routes = [];

  const routeRgx = /\.(get|post|put|delete)\(\s*['"](.+)['"]\s*\,/;

  function ParseAnnotation(str) {
    let route = {
      path        : "",
      description : "",
      in          : "",
      out         : "",
      constraints : []
    };

    str = str.split("\n");

    for(let i in str) {
      let currentNote = str[i];

      // Description
      if(!currentNote.match(/@/)) {
        if(currentNote.trim().length > 0)
          route.description += currentNote + "\n";
      }

      // In
      if(currentNote.match(/@in/))
        route.in = currentNote.replace(/@in/, '').trim();

      // Out
      if(currentNote.match(/@out/))
        route.in = currentNote.replace(/@out/, '').trim();

      // Constraint
      if(currentNote.match(/@constraint/))
        route.constraints.push(currentNote.replace(/@constraint/, '').trim());
    }

    return route;
  }

  function HandleJS(str) {
    let splittedFile = str.split("\n");
    let comments = extract(str);

    // Get only blocks
    for(let i in comments) {
      let currentComment = comments[i];

      if(currentComment.type === 'block' && currentComment.value.match(/@Route/)) {
        let tmpRoute = ParseAnnotation(currentComment.value);

        // Read the next line to get the route path
        let match = splittedFile[currentComment.loc.end.line].match(routeRgx);
        if(!!match) {
          tmpRoute.path = !!match[2] ? match[2] : "";

          // Add the route in the list
          routes.push(tmpRoute);
        }
      }
    }

    console.log(routes);
  }

  const readStream = fs.createReadStream(pathToFile);

  readStream.on('data', chunk => { fileContent += chunk });

  readStream.on('end', () => HandleJS(fileContent));
}

module.exports = {
  ForRouter
};
