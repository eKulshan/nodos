import { promises as fs } from 'fs';
import _ from 'lodash';
import yml from 'js-yaml'; // eslint-disable-line
import Router from '../index.js';

let routesMap;

beforeAll(async () => {
  const routesData = await fs.readFile(`${__dirname}/../__fixtures__/routes.yml`);
  routesMap = yml.safeLoad(routesData);
});

test('nodos-routing', async () => {
  const sortRoutes = (routes) => _.sortBy(routes, ['actionName', 'url']);
  const { routes } = new Router(routesMap, { host: 'http://site.com' });

  const expectedRoutes = [
    { actionName: 'default', url: '/', method: 'get' },
    { actionName: 'index', url: '/api/users', method: 'get' },
    { actionName: 'build', url: '/api/users/build', method: 'get' },
    { actionName: 'create', url: '/api/users', method: 'post' },
    { actionName: 'show', url: '/api/users/:id', method: 'get' },
    { actionName: 'show', url: '/session', method: 'get' },
    { actionName: 'update', url: '/session', method: 'patch' },
    { actionName: 'show', url: '/session/tokens/:id', method: 'get' },
    { actionName: 'index', url: '/articles', method: 'get' },
    { actionName: 'update', url: '/articles/:id', method: 'patch' },
    { actionName: 'index', url: '/articles/:article_id/comments', method: 'get' },
    { actionName: 'show', url: '/articles/:article_id/comments/:id', method: 'get' },
    { actionName: 'create', url: '/articles/:article_id/metadata', method: 'post' },
    { actionName: 'default', url: '/test', method: 'get' },
  ];

  const actualRoutes = routes
    .map(({ actionName, url, method }) => ({ actionName, url, method }))
    .filter((r) => expectedRoutes.find((e) => _.isEqual(e, r)));

  expect(sortRoutes(actualRoutes)).toEqual(sortRoutes(expectedRoutes));
});

test('nodos-routing check only', async () => {
  const { routes } = new Router(routesMap, { host: 'http://site.com' });
  const userRootRoutes = routes.filter((route) => route.url.startsWith('/users'));

  expect(userRootRoutes).toHaveLength(1);
  expect(userRootRoutes[0]).toMatchObject({
    method: 'get',
    actionName: 'show',
    url: '/users/:id',
  });
});

test('nodos-routing check except', async () => {
  const { routes } = new Router(routesMap, { host: 'http://site.com' });

  const sessionBuildRoute = _.find(routes, { resourceName: 'session', name: 'build' });
  expect(sessionBuildRoute).toBeUndefined();
});

test('nodos-routing route helpers should return correct url', async () => {
  const router = new Router(routesMap, { host: 'http://site.com' });
  const article = { id: 123 };
  const comment = { id: 321 };

  const rootPath = router.route('root');
  const expectedRootPath = 'http://site.com/';
  expect(rootPath).toBe(expectedRootPath);

  const apiRootPath = router.route('apiRoot');
  const expectedApiRootPath = 'http://site.com/api';
  expect(apiRootPath).toBe(expectedApiRootPath);

  const apiUsersPath = router.route('apiUsers');
  const expectedApiUsersPath = 'http://site.com/api/users';
  expect(apiUsersPath).toBe(expectedApiUsersPath);

  const buildArticlesPath = router.route('buildArticle');
  const expectedBuildArticlesPath = 'http://site.com/articles/build';
  expect(buildArticlesPath).toBe(expectedBuildArticlesPath);

  const articleCommentsPath = router.route('articleComments', article.id);
  const expectedArticleCommentsPath = `http://site.com/articles/${article.id}/comments`;
  expect(articleCommentsPath).toBe(expectedArticleCommentsPath);

  const articleCommentPath = router.route('articleComment', article.id, comment.id);
  const expectedArticleCommentPath = `http://site.com/articles/${article.id}/comments/${comment.id}`;
  expect(articleCommentPath).toBe(expectedArticleCommentPath);
});

test('nodos-routing throws an error if schema is invalid', async () => {
  const routesData = await fs.readFile(`${__dirname}/../__fixtures__/routesWithInvalidSchema.yml`);
  const invalidRoutesMap = yml.safeLoad(routesData);

  expect(() => new Router(invalidRoutesMap)).toThrow(/Routes schema is invalid/);
});

test('nodos-routing throws an error if routes key is missing', async () => {
  const routesData = await fs.readFile(`${__dirname}/../__fixtures__/scopeWithoutRoutes.yml`);
  const invalidRoutesMap = yml.safeLoad(routesData);

  expect(() => new Router(invalidRoutesMap, { host: 'http://site.com' })).toThrow(/Routes schema is invalid/);
});
