import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  APIGatewayProxyHandler,
} from "aws-lambda"

import "source-map-support/register"

import * as AWS from "aws-sdk"

const docClient = new AWS.DynamoDB.DocumentClient()

const groupsTable = process.env.GROUPS_TABLE

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("Caller event", event)

  const result = await docClient
    .query({
      TableName: groupsTable,
    })
    .promise()
  const items = result.Items

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({
      items: items,
    }),
  }
}
