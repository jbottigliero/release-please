// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import {readFileSync} from 'fs';
import {resolve} from 'path';

import {describe, it, afterEach} from 'mocha';
import {expect} from 'chai';
import * as suggester from 'code-suggester';
import * as sinon from 'sinon';
import * as nock from 'nock';
import * as snapshot from 'snap-shot-it';

import {ReleasePRFactory} from '../src/release-pr-factory';
import {ReleasePROptions} from '../src/release-pr';

import command from '../src/bin/command';
import yargs = require('yargs');

const sandbox = sinon.createSandbox();


function getExampleConfigurationPath() {
  return resolve('./test/fixtures', 'example-config.json');
}


describe('CLI', () => {

  afterEach(() => {
    sandbox.restore();
  });

  describe('release-pr', () => {

    it('can be configured using flags', () => {
      const argv = command.parse('release-pr --no-op=true --repo-url=googleapis/release-please-cli --package-name=cli-package ') as ReleasePROptions;
      expect(argv).includes({
        repoUrl: 'googleapis/release-please-cli',
        releaseType: 'node',
        packageName: 'cli-package'
      });
    });


    it('can be configured using a file', () => {
      const argv = command.parse(`release-pr  --no-op=true --config=${getExampleConfigurationPath()}`) as ReleasePROptions;
      expect(argv).includes({
        repoUrl: 'googleapis/release-please-cli',
        releaseType: 'node',
        packageName: 'cli-package--config'
      });
    });

    it('supports custom changelogSections', async () => {
      // Fake the createPullRequest step, and capture a set of files to assert against:
      let expectedChanges = null;
      sandbox.replace(
        suggester,
        'createPullRequest',
        (_octokit, changes): Promise<number> => {
          expectedChanges = [...(changes as Map<string, object>)]; // Convert map to key/value pairs.
          return Promise.resolve(22);
        }
      );

      const graphql = JSON.parse(
        readFileSync(resolve('./test/releasers/fixtures/node', 'commits.json'), 'utf8')
      );

      const existingPackageResponse = {
        content: Buffer.from(JSON.stringify({
          name: 'simple-package',
          version: '1.0.0'
        }), 'utf8').toString('base64'),
        sha: 'abc123',
      };
      
      const scope = nock('https://api.github.com')
          // Check for in progress, merged release PRs:
          .get('/repos/googleapis/release-please-cli/pulls?state=closed&per_page=100')
          .reply(200, undefined)
          // fetch semver tags, this will be used to determine
          // the delta since the last release.
          .get('/repos/googleapis/release-please-cli/tags?per_page=100')
          .reply(200, [
            {
              name: 'v1.0.0',
              commit: {
                sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
              },
            },
          ])
          // now we fetch the commits via the graphql API;
          // note they will be truncated to just before the tag's sha.
          .post('/graphql')
          .reply(200, {
            data: graphql,
          })
          .get('/repos/googleapis/release-please-cli/contents/package.json')
          .reply(200, existingPackageResponse)
          .get('/repos/googleapis/release-please-cli')
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          .reply(200, require('../../test/fixtures/repo-get-1.json'))
          .get('/repos/googleapis/release-please-cli/contents/CHANGELOG.md?ref=refs%2Fheads%2Fmaster')
          .reply(404)
          .get('/repos/googleapis/release-please-cli/contents/package-lock.json?ref=refs%2Fheads%2Fmaster')
          .reply(404)
          .get('/repos/googleapis/release-please-cli/contents/samples/package.json?ref=refs%2Fheads%2Fmaster')
          .reply(404)
          .get('/repos/googleapis/release-please-cli/contents/package.json?ref=refs%2Fheads%2Fmaster')
          .reply(200, existingPackageResponse)
          // this step tries to match any existing PRs; just return an empty list.
          .get('/repos/googleapis/release-please-cli/pulls?state=open&per_page=100')
          .reply(200, [])
          // Add autorelease: pending label to release PR:
          .post('/repos/googleapis/release-please-cli/issues/22/labels')
          .reply(200)
          // this step tries to close any existing PRs; just return an empty list.
          .get('/repos/googleapis/release-please-cli/pulls?state=open&per_page=100')
          .reply(200, [])

      const argv = command.parse(`release-pr --no-op=true --config=${getExampleConfigurationPath()}`) as ReleasePROptions;

      const rp = ReleasePRFactory.build(argv.releaseType, argv);
      await rp.run();
      
      scope.done();
      snapshot(JSON.stringify(expectedChanges, null, 2));
    });
  });
});
