'use strict';
// Prints SQL only. Execution requires the operator's existing D1 access.
const {mlsAutooptSchema,mlsAutooptRetention}=require('../MLS R32 EDITORIAL/autoopt.js');
const args=process.argv.slice(2), command=args.shift();
const quote=value=>"'"+String(value).replace(/'/g,"''")+"'";
let sql;
if(command==='schema') sql=mlsAutooptSchema().join(';\n')+';';
else if(command==='prune') sql=mlsAutooptRetention().join(';\n')+';';
else if(command==='inspect') {
  sql=`SELECT version,prompt,scope,scope_id,family,updated_at,
    json_extract(stats,'$.validationAttempts') AS validation_attempts,
    json_extract(stats,'$.published') AS published,
    1.0*json_extract(stats,'$.successfulFirstPass')/NULLIF(json_extract(stats,'$.firstAttempts'),0) AS first_pass_rate,
    1.0*json_extract(stats,'$.wordsSuccessful')/NULLIF(json_extract(stats,'$.published'),0) AS mean_successful_words,
    1.0*json_extract(stats,'$.validationAttempts')/NULLIF(json_extract(stats,'$.published'),0) AS validations_per_publication,
    json_extract(stats,'$.deferred') AS deferred,
    json_extract(stats,'$.needsReview') AS needs_review,
    json_extract(stats,'$.r32FalsePositiveLikeFailures') AS activity_like_rejections,
    stats FROM wiki_autoopt_stats ORDER BY scope,prompt,scope_id;`;
} else if(command==='reset') {
  const scope=args.shift(),value=args.shift();
  if(scope==='all' && !value) sql='DELETE FROM wiki_autoopt_stats;';
  else if(scope==='family' && value && /^[a-z_]+$/.test(value)) sql=`DELETE FROM wiki_autoopt_stats WHERE scope='family' AND family=${quote(value)};`;
  else if(scope==='prompt' && value && /^[a-zA-Z0-9.]+$/.test(value)) sql=`DELETE FROM wiki_autoopt_stats WHERE prompt=${quote(value)};`;
  else if(scope==='global' && !value) sql="DELETE FROM wiki_autoopt_stats WHERE scope='global';";
}
if(!sql || args.length) { console.error('Uso: node "scripts/autoopt admin.cjs" schema|inspect|prune|reset all|reset global|reset family FAMILIA|reset prompt VERSION');process.exitCode=1; }
else process.stdout.write(sql+'\n');
