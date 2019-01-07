const fs = require('fs-extra');
const path = require('path');
const prompt = require('prompt');
const {
  bold, green, red, cyan,
} = require('colors');

const { METHOD_TEMPLATE, TEST_TEMPLATE } = require('../../common/constants');
const { getConfiguration, processTemplate } = require('../../common/utils');

function methodPrompts() {
  return new Promise((resolve, reject) => {
    const schema = {
      properties: {
        name: {
          pattern: /^[a-zA-Z_$][a-zA-Z_$0-9]*$/,
          description: 'Method name',
          required: true,
        },
        description: {
          description: 'Method description',
        },
      },
    };

    prompt.start();
    prompt.message = '';

    prompt.get(schema, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
}

module.exports = async (args, options, logger) => {
  const localPath = process.cwd();
  const { methodsPath, testsPath } = getConfiguration();

  // check if the configured methods path exists
  const localMethodsPath = path.resolve(localPath, methodsPath);
  if (!fs.pathExistsSync(localMethodsPath)) {
    logger.error(red('Methods path is missing.'));
    process.exit(1);
  }

  // check if the configured tests path exists
  const localTestsPath = path.resolve(localPath, testsPath);
  if (!fs.pathExistsSync(localTestsPath)) {
    logger.error(red('Tests path is missing.'));
    process.exit(1);
  }

  // doT.js templating variables
  const it = {};

  try {
    it.method = await methodPrompts();
  } catch (e) {
    console.error(e); // eslint-disable-line
    logger.error(red('Failed to create method. See error above for details.'));
    process.exit(1);
  }

  const { method } = it;

  // check that the destination files don't exist
  const localMethodFile = path.resolve(localMethodsPath, `${method.name}.method.js`);
  if (fs.existsSync(localMethodFile)) {
    logger.error(red(`Method ${method.name} already exists.`));
    process.exit(1);
  }
  const localTestFile = path.resolve(localTestsPath, `${method.name}.test.js`);
  if (fs.existsSync(localTestFile)) {
    logger.error(red(`Test ${method.name} already exists.`));
    process.exit(1);
  }

  // process the templates
  const methodContent = processTemplate(METHOD_TEMPLATE, it);
  const testContent = processTemplate(TEST_TEMPLATE, it);

  // write the files
  logger.info(`\t${bold(green('create'))}\t${method.name}.method.js`);
  fs.outputFileSync(localMethodFile, methodContent, 'utf8');
  logger.info(`\t${bold(green('create'))}\t${method.name}.test.js`);
  fs.outputFileSync(localTestFile, testContent, 'utf8');

  logger.log(bold(cyan('Finished!')));
};
