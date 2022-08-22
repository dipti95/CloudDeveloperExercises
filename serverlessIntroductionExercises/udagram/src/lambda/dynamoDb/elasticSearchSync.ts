import { DynamoDBStreamEvent, DynamoDBStreamHandler } from "aws-lambda"
import "source-map-support/register"
import * as elasticsearch from "elasticsearch"
import * as httpAwsEs from "http-aws-es"

const esHost = process.env.ES_ENDPOINT

const es = new elasticsearch.Client({
  hosts: [esHost],
  connectionClass: require("http-aws-es"),
})
// export const handler = (event) => {
//   console.log("Processing events batch from DynamoDB", JSON.stringify(event))
//   console.log("testing" + esHost)

//   console.log("last testing " + es)
// }

export const handler: DynamoDBStreamHandler = async (
  event: DynamoDBStreamEvent
) => {
  console.log("Processing events batch from DynamoDB", JSON.stringify(event))
  console.log(es)

  for (const record of event.Records) {
    console.log("Processing record", JSON.stringify(record))
    if (record.eventName !== "INSERT") {
      continue
    }

    const newItem = record.dynamodb.NewImage

    const imageId = newItem.imageId.S

    const body = {
      imageId: newItem.imageId.S,
      groupId: newItem.groupId.S,
      imageUrl: newItem.imageUrl.S,
      title: newItem.title.S,
      timestamp: newItem.timestamp.S,
    }
    try {
      console.log("Attempting to add index ", event)
      await es.index({
        index: "images-index",
        type: "images",
        id: imageId,
        body,
      })
    } catch (e) {
      console.log("Failed to ass index", JSON.stringify(e))
    }
  }
}
