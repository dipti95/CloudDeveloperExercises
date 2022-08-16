import { SNSHandler, SNSEvent, S3Event, S3Handler } from "aws-lambda"
import "source-map-support/register"
import * as AWS from "aws-sdk"

export const handler: S3Handler = async (event: S3Event) => {
  console.log("Processing SNS event ", JSON.stringify(event))
  for (const snsRecord of event.Records) {
    const key = snsRecord.s3.object.key
    console.log("Processing S3 event", key)
  }
}
