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
      IMAGES_TABLE: "Images-${self:provider.stage}",
      IMAGE_ID_INDEX: "ImageIdIndex",
    },
    iamRoleStatements: [
      {
        Effect: "Allow",
        Action: ["dynamodb:Scan", "dynamodb:PutItem", "dynamodb:GetItem"],
        Resource: [
          "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.GROUPS_TABLE}",
        ],
      },
      {
        Effect: "Allow",
        Action: ["dynamodb:Query"],
        Resource: [
          "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.IMAGES_TABLE}",
        ],
      },
      {
        Effect: "Allow",
        Action: ["dynamodb:Query"],
        Resource: [
          "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.IMAGES_TABLE}/index/${self:provider.environment.IMAGE_ID_INDEX}",
        ],
      },
    ],
  },

  // custom: {
  //   documentation: {
  //     api: {
  //       info: {
  //         version: "v1.0.0",
  //         title: "Udagram API",
  //         description: "severless application for image sharing",
  //       },
  //     },
  //     models: [
  //       {
  //         name: "GroupRequest",
  //         contentType: "application/json",
  //         schema: "${file(models/create-group-request.json)}",
  //       },
  //     ],
  //   },
  // },
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
    CreateGroup: {
      handler: "src/lambda/http/createGroup.handler",
      events: [
        {
          http: {
            method: "post",
            path: "groups",
            cors: true,
            request: {
              schemas: {
                "application/json": "${file(models/create-group-request.json)}",
              },
            },

            // reqValidatorName: "RequestBodyValidator",
            // documentation: {
            //   summary: "Create a new group",
            //   description: "Create a new group",
            //   requestModels: "'application/json': GroupRequest",
            // },
          },
        },
      ],
    },
    GetImages: {
      handler: "src/lambda/http/getImages.handler",
      events: [
        {
          http: {
            method: "get",
            path: "/groups/{groupId}/images",
          },
        },
      ],
    },
    GetImage: {
      handler: "src/lambda/http/getImage.handler",
      events: [
        {
          http: {
            method: "get",
            path: "images/{imageId}",
            cors: true,
          },
        },
      ],
    },
  },
  resources: {
    Resources: {
      // RequestBodyValidator: {
      //   Type: "AWS::ApiGateway::RequestValidator",
      //   Properties: {
      //     Name: "request-body-validator",
      //     RestApiId: {
      //       Ref: "ApiGatewayRestApi",
      //     },
      //     ValidateRequestBody: true,
      //     ValidateRequestParameters: false,
      //   },
      // },

      GroupsDynamoDBTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
          KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
          BillingMode: "PAY_PER_REQUEST",
          TableName: "${self:provider.environment.GROUPS_TABLE}",
        },
      },
      ImagesDynamoDBTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          AttributeDefinitions: [
            { AttributeName: "groupId", AttributeType: "S" },
            { AttributeName: "timestamp", AttributeType: "S" },
            { AttributeName: "imageId", AttributeType: "S" },
          ],
          KeySchema: [
            { AttributeName: "groupId", KeyType: "HASH" },
            {
              AttributeName: "timestamp",
              KeyType: "RANGE",
            },
          ],
          GlobalSecondaryIndexes: [
            {
              IndexName: "${self:provider.environment.IMAGE_ID_INDEX}",
              KeySchema: [
                {
                  AttributeName: "imageId",
                  KeyType: "HASH",
                },
              ],
              Projection: {
                ProjectionType: "ALL",
              },
            },
          ],
          BillingMode: "PAY_PER_REQUEST",

          TableName: "${self:provider.environment.IMAGES_TABLE}",
        },
      },
    },
  },
}

module.exports = serverlessConfiguration
