const path = require('path');
const { calculateCoverageDiff } = require('./src/main.ts');

const paths = {
  base: path.resolve(__dirname, './__tests__/fixtures/resultset1.json'),
  head: path.resolve(__dirname, './__tests__/fixtures/resultset2.json')
};

try {
  const result = calculateCoverageDiff(paths);
  console.log('Result:');
  console.log(result);
} catch (error) {
  console.error('Error:', error.message);
}
