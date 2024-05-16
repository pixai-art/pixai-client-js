import { CodegenConfig } from '@graphql-codegen/cli'
import path from 'path'

const config: CodegenConfig = {
  schema: [
    {
      'schema.graphql': {
        loader: path.resolve(__dirname, 'schema-loader.js'),
      },
    },
    {
      './graphql/*.graphql': {},
    },
  ],
  documents: ['./graphql/*.graphql'],
  generates: {
    './src/generated/graphql.ts': {
      config: {
        scalars: {
          ID: 'string',
          JSON: 'any',
          JSONObject: 'any',
        },
        documentMode: 'string',
        maybeValue: 'T | undefined',
        inputMaybeValue: 'T | undefined | null',
        dedupeFragments: true,
        usingObservableFrom: `import { Observable } from 'rxjs'`,
        onlyOperationTypes: true,
        omitObjectTypes: true,
      },
      plugins: [
        'graphql-codegen-typescript-operation-types',
        'typescript-operations',
        'typescript-generic-sdk',
      ],
    },
  },
}

export default config
