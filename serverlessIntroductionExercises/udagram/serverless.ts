import type { AWS } from "@serverless/typescript"

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
      CONNECTIONS_TABLE: "Connections-${self:provider.stage}",
      IMAGES_S3_BUCKET: "udagram-images-760612056946-${self:provider.stage}",
      SIGNED_URL_EXPIRATION: "300",
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
        Action: ["dynamodb:Query", "dynamodb:PutItem"],
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
      {
        Effect: "Allow",
        Action: ["s3:PutObject", "s3:GetObject"],
        Resource:
          "arn:aws:s3:::${self:provider.environment.IMAGES_S3_BUCKET}/*",
      },
      {
        Effect: "Allow",
        Action: ["dynamodb:Scan", "dynamodb:PutItem", "dynamodb:DeleteItem"],

        Resource:
          "arn:aws:dynamodb:${opt:region, self:provider.region}:*:table/${self:provider.environment.CONNECTIONS_TABLE}",
      },
    ],
  },

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
    CreateImage: {
      handler: "src/lambda/http/createImage.handler",
      events: [
        {
          http: {
            method: "post",
            path: "/groups/{groupId}/images",
            cors: true,
            request: {
              schemas: {
                "application/json": "${file(models/create-image-request.json)}",
              },
            },
          },
        },
      ],
    },
    SendUploadNotifications: {
      environment: {
        STAGE: "${self:provider.stage}",
        API_ID: {
          Ref: "WebsocketsApi",
        },
      },
      handler: "src/lambda/s3/sendNotifications.handler",
    },
    ConnectHandler: {
      handler: "src/lambda/websocket/connect.handler",
      events: [
        {
          websocket: {
            route: "$connect",
          },
        },
      ],
    },
    DisconnectHandler: {
      handler: "src/lambda/websocket/disconnect.handler",
      events: [
        {
          websocket: {
            route: "$disconnect",
          },
        },
      ],
    },
    SyncWithElasticsearch: {
      // environment:{
      //   ES_ENDPOINT: "!GetAtt ImagesSearch.DomainEndpoint"
      // },
      handler: "src/lambda/dynamoDb/elasticSearchSync.handler",
      events: [
        {
          stream: {
            type: "dynamodb",
            arn: { "Fn::GetAtt": ["ImagesDynamoDBTable", "StreamArn"] },
            //arn: "!GetAtt ImagesDynamoDBTable.StreamArn",
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
          StreamSpecification: {
            StreamViewType: "NEW_IMAGE",
          },

          TableName: "${self:provider.environment.IMAGES_TABLE}",
        },
      },
      WebSocketConnectionsDynamoDBTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          AttributeDefinitions: [
            {
              AttributeName: "id",
              AttributeType: "S",
            },
          ],
          KeySchema: [
            {
              AttributeName: "id",
              KeyType: "HASH",
            },
          ],
          BillingMode: "PAY_PER_REQUEST",
          TableName: "${self:provider.environment.CONNECTIONS_TABLE}",
        },
      },
      AttachmentsBucket: {
        Type: "AWS::S3::Bucket",
        Properties: {
          BucketName: "${self:provider.environment.IMAGES_S3_BUCKET}",
          NotificationConfiguration: {
            LambdaConfigurations: [
              {
                Event: "s3:ObjectCreated:*",
                Function: {
                  "Fn::GetAtt": [
                    "SendUploadNotificationsLambdaFunction",
                    "Arn",
                  ],
                },
              },
            ],
          },
          CorsConfiguration: {
            CorsRules: [
              {
                AllowedOrigins: ["*"],
                AllowedHeaders: ["*"],
                AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
                MaxAge: 3000,
              },
            ],
          },
        },
      },

      SendUploadNotificationsPermission: {
        Type: "AWS::Lambda::Permission",
        Properties: {
          FunctionName: {
            Ref: "SendUploadNotificationsLambdaFunction",
          },
          Principal: "s3.amazonaws.com",
          Action: "lambda:InvokeFunction",
          SourceAccount: {
            Ref: "AWS::AccountId",
          },
          SourceArn:
            "arn:aws:s3:::${self:provider.environment.IMAGES_S3_BUCKET}",
        },
      },
      BucketPolicy: {
        Type: "AWS::S3::BucketPolicy",
        Properties: {
          Bucket: {
            Ref: "AttachmentsBucket",
          },
          PolicyDocument: {
            Version: "2012-10-17",
            Statement: [
              {
                Action: "s3:GetObject",
                Effect: "Allow",
                Principal: "*",
                Resource:
                  "arn:aws:s3:::${self:provider.environment.IMAGES_S3_BUCKET}/*",
              },
            ],
          },
        },
      },
      ImagesSearch: {
        Type: "AWS::Elasticsearch::Domain",
        Properties: {
          ElasticsearchVersion: "6.3",
          DomainName: "images-search-123${self:provider.stage}",
          ElasticsearchClusterConfig: {
            DedicatedMasterEnabled: false,
            InstanceCount: "1",
            ZoneAwarenessEnabled: "false",
            InstanceType: "t2.small.elasticsearch",
          },
          EBSOptions: {
            EBSEnabled: true,
            Iops: 0,
            VolumeSize: 10,
            VolumeType: "gp2",
          },

          AccessPolicies: {
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Principal: {
                  AWS: "*",
                },
                Action: "es:ESHttp*",

                //Resource: "*",
                Resource:
                  "arn:aws:es:${self:provider.region}:${AWS::AccountId}:domain/images-search-123${self:provider.stage}/*",
              },
            ],
          },
        },
      },
    },
  },
}

module.exports = serverlessConfiguration
