import type { AWS } from "@serverless/typescript"

//import GroupsTable from "@functions/getGroups"

const serverlessConfiguration: AWS = {
  service: "serverless-udagram-app",
  frameworkVersion: "3",
  plugins: ["serverless-esbuild"],
  provider: {
    name: "aws",
    runtime: "nodejs14.x",

    stage: "${opt:stage, 'dev'}",
    region: "us-east-1",

    environment: {
      GROUPS_TABLE: "Groups-${self:provider.stage}",
    },
    iamRoleStatements: [
      {
        Effect: "Allow",
        Action: ["dynamodb:Scan"],
        Resource: [
          "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.GROUPS_TABLE}",
        ],
      },
    ],
  },
  // import the function via paths
  // functions: { GroupsTable },
  // package: { individually: true },

  // custom: {
  //   esbuild: {
  //     bundle: true,
  //     minify: false,
  //     sourcemap: true,

  //     target: "node14",
  //     define: { "require.resolve": undefined },
  //     platform: "node",
  //     concurrency: 10,
  //   },
  // },
  functions: {
    GetGroups: {
      handler: "src/lambda/http/getGroups.handler",
      events: [
        {
          http: {
            method: "get",
            path: "groups",
            cors: true,
          },
        },
      ],
    },
  },
  resources: {
    Resources: {
      GroupsDynamoDBTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
          KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
          BillingMode: "PAY_PER_REQUEST",
          TableName: "${self:provider.environment.GROUPS_TABLE}",
        },
      },
    },
  },
}

module.exports = serverlessConfiguration
