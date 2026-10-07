'use strict';

function createOpenIssueInventoryCache(){
  let issues=null;
  return {
    async load(fetchIssues){
      if(!issues)issues=await fetchIssues();
      return issues;
    },
    record(issue){
      if(!issues||!issue||issue.pull_request)return;
      const index=issues.findIndex(item=>Number(item.number)===Number(issue.number));
      if(issue.state==='closed'){
        if(index>=0)issues.splice(index,1);
        return;
      }
      if(index>=0)issues[index]=issue;
      else issues.push(issue);
    }
  };
}

module.exports={createOpenIssueInventoryCache};
