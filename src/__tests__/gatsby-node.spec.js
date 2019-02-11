const { KenticoCloudJsSdkTestHttpService }
  = require('kentico-cloud-js-sdk-test-http-service');
const { ContentItem, TypeResolver } = require('kentico-cloud-delivery');

const { sourceNodes } = require('../gatsby-node');
const { customTrackingHeader } = require('../config');
const { name, version } = require('../../package.json');
const fakeItemsResponseWithRichTextElement =
  require('./fakeItemsResponseWithRichTextElement.json');
const fakeTypesResponseWithRichTextElement =
  require('./fakeTypesResponseWithRichTextElement.json');
const { expectedResolvedRichTextComponent } =
  require('./expectedOutputs/gatsby-node.output');


describe('customTrackingHeader', () => {
  it('has correct name', () => {
    expect(customTrackingHeader.header).toEqual('X-KC-SOURCE');
  });

  it('has correct value according to package name and package version', () => {
    const expectedHeaderValue = `${name};${version}`;
    expect(customTrackingHeader.value).toEqual(expectedHeaderValue);
  });
});

describe('sourceNodes', () => {
  const fakeEmptyResponseConfig = new Map();
  fakeEmptyResponseConfig.set(
    /https:\/\/deliver.kenticocloud.com\/.*\/items/,
    {
      fakeResponseJson: {
        items: [],
        pagination: {
          continuation_token: null,
          next_page: null,
        },
      },
      throwCloudError: false,
    });
  fakeEmptyResponseConfig.set(
    /https:\/\/deliver.kenticocloud.com\/.*\/types/,
    {
      fakeResponseJson: {
        types: [],
        pagination: {
          continuation_token: null,
          next_page: null,
        },
      },
      throwCloudError: false,
    });

  const fakeEmptyTestService =
    new KenticoCloudJsSdkTestHttpService(fakeEmptyResponseConfig);

  const dummyCreateNodeID = jest.fn();
  dummyCreateNodeID.mockReturnValue('dummyId');

  const dummyCreation = {
    actions: {
      createNode: jest.fn(),
    },
    createNodeId: dummyCreateNodeID,
  };


  it('does add tracking header', async () => {
    const deliveryClientConfig = {
      projectId: 'dummyEmptyProject',
      httpService: fakeEmptyTestService,
    };

    await sourceNodes(
      dummyCreation,
      {
        deliveryClientConfig,
        languageCodenames: ['default'],
      }
    );

    expect(deliveryClientConfig.globalHeaders)
      .toContainEqual(customTrackingHeader);
  });

  it('does update tracking header value', async () => {
    const deliveryClientConfig = {
      projectId: 'dummyEmptyProject',
      httpService: fakeEmptyTestService,
      globalHeaders: [
        {
          header: customTrackingHeader.header,
          value: 'dummyValue',
        },
      ],
    };

    await sourceNodes(
      dummyCreation,
      {
        deliveryClientConfig,
        languageCodenames: ['default'],
      }
    );

    expect(deliveryClientConfig.globalHeaders)
      .toContainEqual(customTrackingHeader);
    expect(deliveryClientConfig.globalHeaders.length)
      .toEqual(1);
  });

  it('does not influence other tracking header value', async () => {
    const anotherHeader = {
      header: 'another-header-name',
      value: 'dummyValue',
    };
    const deliveryClientConfig = {
      projectId: 'dummyEmptyProject',
      httpService: fakeEmptyTestService,
      globalHeaders: [
        anotherHeader,
      ],
    };

    await sourceNodes(
      dummyCreation,
      {
        deliveryClientConfig,
        languageCodenames: ['default'],
      }
    );

    expect(deliveryClientConfig.globalHeaders)
      .toContainEqual(customTrackingHeader);
    expect(deliveryClientConfig.globalHeaders)
      .toContainEqual(anotherHeader);
    expect(deliveryClientConfig.globalHeaders.length)
      .toEqual(2);
  });

  class LandingPageImageSection extends ContentItem {
    constructor() {
      super({
        richTextResolver: (_contentItem, _context) =>
          '###landing_page_image_section###',
      });
    }
  }

  class Project extends ContentItem {
    constructor() {
      super({
        linkResolver: (_link, _context) => '###projectlink###',
      });
    }
  }


  it('does resolve rich text element', async () => {
    const fakeRichTextResponseConfig = new Map();
    fakeRichTextResponseConfig.set(
      /https:\/\/deliver.kenticocloud.com\/.*\/items/,
      {
        fakeResponseJson: fakeItemsResponseWithRichTextElement,
        throwCloudError: false,
      });
    fakeRichTextResponseConfig.set(
      /https:\/\/deliver.kenticocloud.com\/.*\/types/,
      {
        fakeResponseJson: fakeTypesResponseWithRichTextElement,
        throwCloudError: false,
      });
    const deliveryClientConfig = {
      projectId: 'dummyProject',
      typeResolvers: [
        new TypeResolver('landing_page_image_section', () =>
          new LandingPageImageSection()
        ),
        new TypeResolver('project', () =>
          new Project()),
      ],
      httpService: new KenticoCloudJsSdkTestHttpService(
        fakeRichTextResponseConfig
      ),
    };
    const expectedRichTextValue = fakeItemsResponseWithRichTextElement
      .items
      .filter((item) => item.system.codename === 'simple_landing_page')[0]
      .elements
      .content
      .value;

    const createNodeMock = jest.fn();
    const actions = {
      actions: {
        createNode: createNodeMock,
      },
      createNodeId: dummyCreation.createNodeId,
    };
    const pluginConfiguration = {
      deliveryClientConfig,
      languageCodenames: ['default'],
    };

    await sourceNodes(actions, pluginConfiguration);

    const landingPageCallNodeSelection = createNodeMock
      .mock
      .calls
      .filter((call) => {
        const firstArgument = call[0];
        return firstArgument.internal.type.startsWith('KenticoCloudItem')
          && firstArgument.system.codename === 'simple_landing_page';
      });
    expect(landingPageCallNodeSelection).toHaveLength(1);
    expect(landingPageCallNodeSelection[0]).toHaveLength(1);
    const landingPageNode = landingPageCallNodeSelection[0][0];

    const expectedResolvedHtml = expectedResolvedRichTextComponent;
    expect(landingPageNode)
      .toHaveProperty('elements.content.value', expectedRichTextValue);
    expect(landingPageNode)
      .toHaveProperty('elements.content.resolvedHtml', expectedResolvedHtml);
  });
});

