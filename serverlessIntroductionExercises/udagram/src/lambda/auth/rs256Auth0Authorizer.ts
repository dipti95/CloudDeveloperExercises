import { CustomAuthorizerEvent, CustomAuthorizerResult } from "aws-lambda"
import "source-map-support/register"

import { verify } from "jsonwebtoken"
import { JwtToken } from "../../auth/JwtToken"

const cert = `-----BEGIN CERTIFICATE-----
MIIDDTCCAfWgAwIBAgIJFmf7UAxvon1YMA0GCSqGSIb3DQEBCwUAMCQxIjAgBgNV
BAMTGWRldi1xODFqZjU4ci51cy5hdXRoMC5jb20wHhcNMjIwODMxMjAwOTU2WhcN
MzYwNTA5MjAwOTU2WjAkMSIwIAYDVQQDExlkZXYtcTgxamY1OHIudXMuYXV0aDAu
Y29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu4T9rb0Sbe5Tgp7S
jsDfK6W9XFxq1DPthBV6qZbcHxmIQS3q+L2WWl0+AcKhwJip16/hdLooEelM6szD
DtRBSOh5e5OiCaBHmdb0KbB8ZAk+Nr/66LpAhfJhV06mS2EK+SXtcFHAfs2LfEfF
5naRlhJ29Fs4ppzyuP/ghXFxpG6lvXwFBVsXHwemdhFekXST46DZ/r14QGl/60hu
rnNtqeco2r9Er8ihEFztlZR4G/pkW+Vh/J1V/l4vZmEEGOzakd8UWfmoYRf+36yv
cmHVUHPNBviuxBomrEE5k9UF293INKbw1wnwnUUAVnTA2hoH9y/iMssnnbbW8e8U
F4+WEQIDAQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBRXYx6ZQvPs
z5qu9RwAe/O8wMWGRzAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEB
AA8m5r1lTEmCHyQHfMsRxgLAiCqwZE4zp+XMmzb+jUU6Nk/hIOmbeXZ1l1N8YaAK
9TCDqbULZTavfWt39r3pG2uDwr5bbrGf0fgvlbP9g6LdqZ8VBflZABbNPJ4KVS/+
aE7dLUUDvQ/MEo9CIeIsC9zh+VoUk3WlWqhE2fNYfu6SB1XWvy0NTh4uZsGkEBAS
zwsix4iUv5UGx0NAnMUfl6Xx4f0ePm5gRNNWdj5UHNKZLsyoxozIZz1aDQE/WO4X
mS5itDe28txuddmmgNut8to/cxr8kisTtp0X4R+EnoOnIyl9jUCeFA5VJx89brdU
Vy2oDr0XPKTSwb9lcOc+rus=
-----END CERTIFICATE-----`

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  try {
    const jwtToken = verifyToken(event.authorizationToken)
    console.log("User was authorized", jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Allow",
            Resource: "*",
          },
        ],
      },
    }
  } catch (e) {
    console.log("User authorized", e.message)

    return {
      principalId: "user",
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Deny",
            Resource: "*",
          },
        ],
      },
    }
  }
}

function verifyToken(authHeader: string): JwtToken {
  if (!authHeader) throw new Error("No authentication header")

  if (!authHeader.toLowerCase().startsWith("bearer "))
    throw new Error("Invalid authentication header")

  const split = authHeader.split(" ")
  const token = split[1]

  return verify(token, cert, { algorithms: ["RS256"] }) as JwtToken
}
