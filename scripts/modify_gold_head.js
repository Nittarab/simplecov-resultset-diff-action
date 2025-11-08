#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const headPath = path.join(__dirname, '../__tests__/fixtures/gold_coverage_head.json');
const head = JSON.parse(fs.readFileSync(headPath, 'utf8'));

const coverage = head.Minitest.coverage;

// 1. Improve controller coverage - users_controller.rb (make some methods tested)
const usersController = '/Users/git/private/example_app/app/controllers/users_controller.rb';
coverage[usersController].lines[7] = 2;  // show action called
coverage[usersController].lines[21] = 1; // edit action called
coverage[usersController].lines[29] = 2; // update action called
coverage[usersController].lines[31] = 2;
coverage[usersController].lines[32] = 1;
coverage[usersController].lines[33] = 0;
coverage[usersController].lines[102] = 2; // destroy called

// 2. Add a new service file
coverage['/Users/git/private/example_app/app/services/user_deletion_service.rb'] = {
  lines: [null, null, 1, 1, 1, null, 1, 1, null, 1, 5, 5, 5, null, 5, null, null, 1, 5, 4, null, 1, null, null],
  branches: {
    '[:if, 0, 19, 4, 19, 35]': {
      '[:then, 1, 19, 4, 19, 12]': 4,
      '[:else, 2, 19, 4, 19, 35]': 1
    }
  }
};

// 3. Delete an unused helper
delete coverage['/Users/git/private/example_app/app/helpers/ai_models_helper.rb'];

// 4. Improve model coverage - user.rb
const user = '/Users/git/private/example_app/app/models/user.rb';
coverage[user].lines[86] = 3;
coverage[user].lines[87] = 3;
coverage[user].lines[88] = 2;
coverage[user].lines[91] = 2;
coverage[user].lines[95] = 1;
coverage[user].lines[96] = 1;

// 5. Improve search_run.rb coverage
const searchRun = '/Users/git/private/example_app/app/models/search_run.rb';
coverage[searchRun].lines[76] = 3;
coverage[searchRun].lines[77] = 3;

// 6. Worsen coverage in a file - reduce application_helper.rb
const appHelper = '/Users/git/private/example_app/app/helpers/application_helper.rb';
coverage[appHelper].lines[42] = 15; // was 27
coverage[appHelper].lines[50] = 15; // was 27
coverage[appHelper].lines[51] = 15; // was 27

// 7. Improve ai.rb lib file
const ai = '/Users/git/private/example_app/lib/ai.rb';
coverage[ai].lines[98] = 2;
coverage[ai].lines[99] = 2;

// 8. Add coverage to previously untested evaluator
const factualEval = '/Users/git/private/example_app/app/evaluators/factual_accuracy_evaluator.rb';
coverage[factualEval].lines[4] = 2;
coverage[factualEval].lines[6] = 2;
coverage[factualEval].lines[15] = 2;
coverage[factualEval].lines[18] = 2;
coverage[factualEval].lines[20] = 2;

// 9. Improve branch coverage in search_task.rb
const searchTask = '/Users/git/private/example_app/app/models/search_task.rb';
coverage[searchTask].branches['[:unless, 0, 54, 4, 54, 41]']['[:then, 2, 54, 4, 54, 10]'] = 5;

// 10. Add new job file
coverage['/Users/git/private/example_app/app/jobs/cleanup_job.rb'] = {
  lines: [null, null, 1, 1, null, 1, 3, null, 3, 3, 3, null, null],
  branches: {}
};

// 11. Improve article.rb coverage
const article = '/Users/git/private/example_app/app/models/article.rb';
coverage[article].lines[37] = 2;
coverage[article].lines[38] = 1;

// 12. Delete unused rake task
delete coverage['/Users/git/private/example_app/lib/tasks/credits.rake'];

// Write the modified head fixture
fs.writeFileSync(headPath, JSON.stringify(head, null, 2));
console.log('✓ Created gold_coverage_head.json with modifications to 12 files:');
console.log('  • 1 controller improved (users_controller.rb)');
console.log('  • 1 service added (user_deletion_service.rb)');
console.log('  • 1 helper deleted (ai_models_helper.rb)');
console.log('  • 2 models improved (user.rb, search_run.rb)');
console.log('  • 1 helper worsened (application_helper.rb)');
console.log('  • 1 lib improved (ai.rb)');
console.log('  • 1 evaluator improved (factual_accuracy_evaluator.rb)');
console.log('  • 1 model branch improved (search_task.rb)');
console.log('  • 1 job added (cleanup_job.rb)');
console.log('  • 1 model improved (article.rb)');
console.log('  • 1 rake task deleted (credits.rake)');
