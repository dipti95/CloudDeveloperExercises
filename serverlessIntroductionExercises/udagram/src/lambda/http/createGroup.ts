import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  APIGatewayProxyHandler,
} from "aws-lambda"

import "source-map-support/register"

import * as AWS from "aws-sdk"
import * as uuid from "uuid"
import { getUserId } from "src/auth/utils"

const docClient = new AWS.DynamoDB.DocumentClient()

const groupsTable = process.env.GROUPS_TABLE

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("Proccessing event", event)
  const itemId = uuid.v4()

  const parsedBody = JSON.parse(event.body)

  const authorization = event.headers.Authorization
  const split = authorization.split(" ")
  const jwtToken = split[1]

  const newItem = {
    id: itemId,
    userId: getUserId(jwtToken),
    ...parsedBody,
  }

  await docClient
    .put({
      TableName: groupsTable,
      Item: newItem,
    })
    .promise()

  return {
    statusCode: 201,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({
      newItem,
    }),
  }
}
