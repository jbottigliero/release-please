exports['CLI release-pr supports custom changelogSections 1'] = `
[
  [
    "CHANGELOG.md",
    {
      "content": "# Changelog\\n\\n### [1.0.1](https://www.github.com/googleapis/release-please-cli/compare/v1.0.0...v1.0.1) (2020-10-04)\\n\\n\\n### Bug Fixes\\n\\n* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([1f9663c](https://www.github.com/googleapis/release-please-cli/commit/1f9663cf08ab1cf3b68d95dee4dc99b7c4aac373))\\n* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([fcd1c89](https://www.github.com/googleapis/release-please-cli/commit/fcd1c890dc1526f4d62ceedad561f498195c8939))\\n\\n\\n### Miscellaneous Chores\\n\\n* update common templates ([3006009](https://www.github.com/googleapis/release-please-cli/commit/3006009a2b1b2cb4bd5108c0f469c410759f3a6a))\\n",
      "mode": "100644"
    }
  ],
  [
    "package.json",
    {
      "content": "{\\n  \\"name\\": \\"simple-package\\",\\n  \\"version\\": \\"1.0.1\\"\\n}\\n",
      "mode": "100644"
    }
  ]
]
`
