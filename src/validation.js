const _ = require(`lodash`);

/**
 * Validates wether the project language codenames configuration
 * is in correct form.
 * @param {Array} languageCodenames language codenames configuration
 * @throws {Error}
 */
const validateLanguageCodenames = (languageCodenames) => {
  if (!_.isArray(languageCodenames)) {
    throw new Error(`languageCodenames argument is either not defined
or not an array.`);
  }

  if (languageCodenames.length <= 0) {
    throw new Error(`languageCodenames does not contain any value,
neither the default language`);
  }
};

/**
 * Validates wether the content types are in correct format
 * @param {Array} contentTypeNodes Kentico Cloud content type nodes
 */
const checkTypesObjectStructure = (contentTypeNodes) => {
  if (!hasBasicValidStructure(contentTypeNodes)) {
    throw new Error(`contentTypeNodes is not an array of valid objects.`);
  }
};

/**
 * Validates wether the content items are in correct format
 * @param {Array} contentItemNodes Kentico Cloud content item nodes
 */
const checkItemsObjectStructure = (contentItemNodes) => {
  if (!hasBasicValidStructure(contentItemNodes)
    && _.every(contentItemNodes, (item) =>
      _.has(item, 'system.language')
      && _.has(item, 'system.type')
    )) {
    throw new Error(`contentItemNodes is not an array of valid objects.`);
  }
};

const hasBasicValidStructure = (contentTypeNodes) => {
  return _.every(contentTypeNodes, ((item) =>
    _.has(item, 'system.id')
    && _.has(item, 'system.name')
    && _.has(item, 'system.codename')
    && _.has(item, 'elements')));
};

module.exports = {
  validateLanguageCodenames,
  checkTypesObjectStructure,
  checkItemsObjectStructure,
};
;

