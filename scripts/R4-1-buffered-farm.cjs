'use strict';
// Chat-native CLI: all commands operate on local, exportable files; no GitHub API calls.
require('../MLS R32 EDITORIAL/r4 buffered sync.cjs').cli(process.argv.slice(2))
  .then(result=>process.stdout.write(JSON.stringify(result,null,2)+'\n'))
  .catch(error=>{console.error(error.code||'R41_BUFFER_ERROR',error.message);process.exitCode=2;});
